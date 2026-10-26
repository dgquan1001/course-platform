'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaff } from '@/lib/auth'
import { detectImageType, IMAGE_EXT } from '@/lib/image-type'
import { isPaymentMethod } from '@/lib/format'
import { CONSENT_VERSION } from '@/lib/consent'
import type { ActionResult } from '@/lib/action-result'
import {
  type Actor,
  confirmMatches,
  contactConflict,
  deleteAccount,
  getManagedAccount,
  logAccountEvent,
  provisionAccount,
  readContact,
  removeAuthUser,
  resetPassword,
  updateContact,
  UUID,
} from '@/lib/managed-accounts'
import { customerUsage, customerUsageMessage } from './usage'

// Nhân viên / admin quản lý khách hàng (ADR-014, Đợt 26): tạo tài khoản cho khách chốt qua Zalo, cấp gói, sửa thông tin,
// cấp lại mật khẩu, xóa tài khoản. Tài khoản tạo bằng service role (như đăng ký web); đơn cấp gói tạo bằng phiên của nhân viên
// để database ghi đúng người xử lý, lịch sử và tính hạn học (trigger registrations_stamp_insert).
// Mọi thao tác chỉ áp dụng cho tài khoản khách hàng (role = user) – tài khoản nhân viên / admin quản lý ở trang Nhân viên (chỉ admin).

// Kết quả có mật khẩu hiện MỘT lần cho nhân viên (không lưu ở đâu)
export type SecretResult =
  | { ok: true; message: string; password: string; patientId: string; name: string; phone: string }
  | { ok: false; error: string }
  | null

const MAX_NOTE = 1000
const MAX_PAYMENT_NOTE = 500
const MAX_AMOUNT = 1_000_000_000
const MAX_PROOF = 5 * 1024 * 1024

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim()
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')

function readNote(formData: FormData): string | { error: string } {
  const note = text(formData, 'note')
  return note.length > MAX_NOTE ? { error: `Ghi chú tối đa ${MAX_NOTE} ký tự.` } : note
}

type Grant = {
  planId: string
  courseId: string
  amount: number
  method: string
  paymentNote: string | null
  proof: { file: File; contentType: string; ext: string } | null
}

// Thông tin cấp gói: gói (của chương trình đang bán), số tiền đã nhận, hình thức thanh toán, ảnh chuyển khoản (tùy chọn)
async function readGrant(formData: FormData, required: boolean): Promise<Grant | null | string> {
  const planId = text(formData, 'planId')
  if (!planId) return required ? 'Vui lòng chọn gói.' : null
  if (!UUID.test(planId)) return 'Gói không hợp lệ, vui lòng tải lại trang.'
  const rawAmount = text(formData, 'amount').replace(/[.\s,]/g, '')
  if (!/^\d+$/.test(rawAmount)) return 'Vui lòng nhập số tiền đã nhận (số nguyên, VNĐ).'
  const amount = Number(rawAmount)
  if (amount > MAX_AMOUNT) return 'Số tiền tối đa 1.000.000.000đ.'
  const method = text(formData, 'paymentMethod')
  if (!isPaymentMethod(method)) return 'Vui lòng chọn hình thức thanh toán.'
  const paymentNote = text(formData, 'paymentNote') || null
  if (paymentNote && paymentNote.length > MAX_PAYMENT_NOTE) return `Ghi chú thanh toán tối đa ${MAX_PAYMENT_NOTE} ký tự.`

  const { data: plan } = await (await createClient())
    .from('course_plans')
    .select('id, course_id, courses!inner(kind)')
    .eq('id', planId)
    .eq('active', true)
    .maybeSingle()
  const kind = (plan?.courses as unknown as { kind: string } | null)?.kind
  if (!plan || kind !== 'program') return 'Gói không còn bán hoặc không thuộc chương trình trả phí, vui lòng chọn lại.'

  let proof: Grant['proof'] = null
  const file = formData.get('proof')
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PROOF) return 'Ảnh chuyển khoản tối đa 5MB.'
    const contentType = detectImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()))
    if (!contentType) return 'Ảnh chuyển khoản phải là ảnh JPG, PNG, WEBP hoặc HEIC hợp lệ.'
    proof = { file, contentType, ext: IMAGE_EXT[contentType] }
  }
  return { planId, courseId: plan.course_id, amount, method, paymentNote, proof }
}

// Tạo đơn "Đã duyệt" bằng phiên nhân viên. Ảnh (nếu có) tải bằng service role vào thư mục của khách hàng.
async function insertGrant(staff: Actor, customer: { id: string; fullName: string; phone: string; email: string | null }, grant: Grant) {
  const admin = createAdminClient()
  let proofPath: string | null = null
  if (grant.proof) {
    proofPath = `${customer.id}/${randomUUID()}.${grant.proof.ext}`
    const { error } = await admin.storage.from('payment-proofs').upload(proofPath, grant.proof.file, { contentType: grant.proof.contentType })
    if (error) return { error: `Không tải được ảnh chuyển khoản: ${error.message}`, proofPath: null }
  }
  const { error } = await (await createClient()).from('registrations').insert({
    user_id: customer.id,
    course_id: grant.courseId,
    plan_id: grant.planId,
    amount: grant.amount,
    source: 'staff',
    status: 'approved',
    payment_method: grant.method,
    payment_note: grant.paymentNote,
    payment_proof_path: proofPath,
    full_name: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    created_by: staff.id,
  })
  if (error) {
    if (proofPath) await admin.storage.from('payment-proofs').remove([proofPath])
    return { error: `Không cấp được gói: ${error.message}`, proofPath: null }
  }
  return { error: null, proofPath }
}

// Ghi chú nội bộ (khách hàng không đọc được); người sửa, thời điểm do trigger ghi
async function saveNote(userId: string, note: string) {
  return (await createClient()).from('patient_notes').upsert({ user_id: userId, note })
}

// Tài khoản khách hàng (role = user) – nhân viên không thao tác trên tài khoản nhân viên / admin
async function findCustomer(userId: string) {
  const account = await getManagedAccount(userId)
  return account?.role === 'user' ? account : null
}

export async function createPatientAction(_prev: SecretResult, formData: FormData): Promise<SecretResult> {
  let staff: Actor
  try {
    staff = await requireStaff()
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
  const contact = readContact(formData)
  if (typeof contact === 'string') return { ok: false, error: contact }
  const note = readNote(formData)
  if (typeof note !== 'string') return { ok: false, error: note.error }
  if (formData.get('consent') !== 'yes') {
    return { ok: false, error: 'Vui lòng xác nhận khách hàng đã đồng ý Chính sách bảo mật (đã gửi link qua Zalo).' }
  }
  const grant = await readGrant(formData, false)
  if (typeof grant === 'string') return { ok: false, error: grant }
  const conflict = await contactConflict(contact)
  if (conflict) {
    return { ok: false, error: conflict.startsWith('Số điện thoại') ? 'Số điện thoại này đã có tài khoản. Hãy tìm khách hàng đó và cấp gói ở trang chi tiết.' : conflict }
  }

  const created = await provisionAccount(contact, {
    source: 'zalo',
    created_by: staff.id,
    consent_at: new Date().toISOString(),
    consent_version: CONSENT_VERSION,
  })
  if (created.error !== undefined) return { ok: false, error: created.error }
  const { userId, password } = created
  // Lỗi ở bước sau: xóa tài khoản vừa tạo để nhân viên tạo lại (không để lại tài khoản dở dang)
  const rollback = async (message: string): Promise<SecretResult> => {
    await removeAuthUser(userId)
    return { ok: false, error: message }
  }
  if (note) {
    const { error: noteError } = await saveNote(userId, note)
    if (noteError) return rollback(`Không lưu được ghi chú: ${noteError.message}`)
  }
  if (grant) {
    const granted = await insertGrant(staff, { id: userId, ...contact }, grant)
    if (granted.error) return rollback(granted.error)
  }
  await logAccountEvent(staff, userId, contact.fullName, 'created')

  revalidatePath('/admin', 'layout')
  return {
    ok: true,
    message: grant ? 'Đã tạo tài khoản và cấp gói cho khách hàng.' : 'Đã tạo tài khoản khách hàng.',
    password,
    patientId: userId,
    name: contact.fullName,
    phone: contact.phone,
  }
}

// Cấp gói / gia hạn cho khách hàng đã có tài khoản (hạn học cộng dồn như khi duyệt đơn)
export async function grantPlanAction(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaff()
    const customer = await findCustomer(userId)
    if (!customer) return { ok: false, error: 'Không tìm thấy tài khoản khách hàng.' }
    const grant = await readGrant(formData, true)
    if (typeof grant === 'string') return { ok: false, error: grant }
    const { error } = await insertGrant(
      staff,
      { id: customer.id, fullName: customer.full_name ?? '', phone: customer.phone ?? '', email: customer.email },
      grant!
    )
    if (error) return { ok: false, error }
    revalidatePath('/admin', 'layout')
    revalidatePath('/courses')
    return { ok: true, message: 'Đã cấp gói. Hạn học đã được cập nhật.' }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

export async function updatePatientAction(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaff()
    const customer = await findCustomer(userId)
    if (!customer) return { ok: false, error: 'Không tìm thấy tài khoản khách hàng.' }
    const contact = readContact(formData)
    if (typeof contact === 'string') return { ok: false, error: contact }
    const note = readNote(formData)
    if (typeof note !== 'string') return { ok: false, error: note.error }
    const conflict = await contactConflict(contact, userId)
    if (conflict) return { ok: false, error: conflict }

    const error = await updateContact(userId, contact)
    if (error) return { ok: false, error }
    const { error: noteError } = await saveNote(userId, note)
    if (noteError) return { ok: false, error: `Đã lưu thông tin nhưng chưa lưu được ghi chú: ${noteError.message}` }
    await logAccountEvent(staff, userId, contact.fullName, 'profile_updated')

    revalidatePath('/admin', 'layout')
    return { ok: true, message: 'Đã lưu thông tin khách hàng.' }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

// Cấp lại mật khẩu (R-02, BR-99): sinh mật khẩu mới, bật nhắc đổi mật khẩu; chỉ tài khoản khách hàng
export async function resetPatientPasswordAction(userId: string): Promise<SecretResult> {
  try {
    const staff = await requireStaff()
    const customer = await findCustomer(userId)
    if (!customer) return { ok: false, error: 'Chỉ cấp lại mật khẩu cho tài khoản khách hàng.' }
    const result = await resetPassword(userId)
    if (result.error !== undefined) return { ok: false, error: result.error }
    await logAccountEvent(staff, userId, customer.full_name ?? customer.phone ?? '', 'password_reset')
    revalidatePath(`/admin/customers/${userId}`)
    return {
      ok: true,
      message: 'Đã cấp mật khẩu mới. Mật khẩu cũ không còn dùng được.',
      password: result.password,
      patientId: userId,
      name: customer.full_name ?? '',
      phone: customer.phone ?? '',
    }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

// Xóa vĩnh viễn khách hàng (QL-04 – chủ dự án 18/10/2026: nhân viên và admin đều được xóa).
// Chặn khi còn gói còn hạn / đơn chờ duyệt; phải gõ lại SĐT. Xóa cả phiếu tham vấn (dữ liệu sức khỏe – Q-5);
// đơn đăng ký + ảnh chuyển khoản giữ làm chứng từ (đã lưu họ tên / SĐT), doanh thu không đổi.
export async function deleteCustomerAction(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaff()
    const customer = await findCustomer(userId)
    if (!customer) return { ok: false, error: 'Không tìm thấy tài khoản khách hàng (có thể đã bị xóa).' }
    if (!confirmMatches(text(formData, 'confirm'), customer)) {
      return { ok: false, error: 'Thông tin xác nhận không khớp, hãy gõ đúng số điện thoại của khách hàng.' }
    }
    const blocked = customerUsageMessage(await customerUsage(await createClient(), userId))
    if (blocked) return { ok: false, error: blocked }

    const name = customer.full_name || customer.phone || customer.email || ''
    const error = await deleteAccount(userId, { deleteHealthData: true })
    if (error) return { ok: false, error }
    // Nhật ký ghi sau khi xóa thành công: tài khoản không còn nên user_id = null, lưu tên người bị xóa
    await logAccountEvent(staff, null, name, 'deleted')

    revalidatePath('/admin', 'layout')
    return { ok: true, message: `Đã xóa khách hàng ${name}.`, redirectTo: '/admin/customers' }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}
