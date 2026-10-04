'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaff } from '@/lib/auth'
import { isEmailTaken, isPhoneTaken } from '@/lib/accounts'
import { isValidEmail, normalizePhone, phoneToAuthEmail } from '@/lib/phone'
import { generatePassword } from '@/lib/generate-password'
import { detectImageType, IMAGE_EXT } from '@/lib/image-type'
import { isPaymentMethod } from '@/lib/format'
import { CONSENT_VERSION } from '@/lib/consent'
import type { ActionResult } from '@/lib/action-result'

// Nhân viên / admin quản lý bệnh nhân (ADR-014): tạo tài khoản cho khách chốt qua Zalo, cấp gói, sửa thông tin,
// cấp lại mật khẩu. Tài khoản tạo bằng service role (như đăng ký web); đơn cấp gói tạo bằng phiên của nhân viên để
// database ghi đúng người xử lý, lịch sử và tính hạn học (trigger registrations_stamp_insert).

// Kết quả có mật khẩu hiện MỘT lần cho nhân viên (không lưu ở đâu)
export type SecretResult =
  | { ok: true; message: string; password: string; patientId: string; name: string; phone: string }
  | { ok: false; error: string }
  | null

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_NAME = 100
const MAX_NOTE = 1000
const MAX_PAYMENT_NOTE = 500
const MAX_AMOUNT = 1_000_000_000
const MAX_PROOF = 5 * 1024 * 1024

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim()
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')

type Staff = Awaited<ReturnType<typeof requireStaff>>
type Contact = { fullName: string; phone: string; email: string | null; note: string }

function readContact(formData: FormData): Contact | string {
  const fullName = text(formData, 'fullName')
  const phone = normalizePhone(text(formData, 'phone'))
  const email = text(formData, 'email').toLowerCase() || null
  const note = text(formData, 'note')
  if (!fullName) return 'Vui lòng nhập họ và tên.'
  if (fullName.length > MAX_NAME) return `Họ tên tối đa ${MAX_NAME} ký tự.`
  if (!phone) return 'Số điện thoại không hợp lệ (VD: 0912345678).'
  if (email && !isValidEmail(email)) return 'Địa chỉ email không hợp lệ.'
  if (note.length > MAX_NOTE) return `Ghi chú tối đa ${MAX_NOTE} ký tự.`
  return { fullName, phone, email, note }
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

// Tạo đơn "Đã duyệt" bằng phiên nhân viên. Ảnh (nếu có) tải bằng service role vào thư mục của bệnh nhân.
async function insertGrant(staff: Staff, patient: { id: string; fullName: string; phone: string; email: string | null }, grant: Grant) {
  const admin = createAdminClient()
  let proofPath: string | null = null
  if (grant.proof) {
    proofPath = `${patient.id}/${randomUUID()}.${grant.proof.ext}`
    const { error } = await admin.storage.from('payment-proofs').upload(proofPath, grant.proof.file, { contentType: grant.proof.contentType })
    if (error) return { error: `Không tải được ảnh chuyển khoản: ${error.message}`, proofPath: null }
  }
  const { error } = await (await createClient()).from('registrations').insert({
    user_id: patient.id,
    course_id: grant.courseId,
    plan_id: grant.planId,
    amount: grant.amount,
    source: 'staff',
    status: 'approved',
    payment_method: grant.method,
    payment_note: grant.paymentNote,
    payment_proof_path: proofPath,
    full_name: patient.fullName,
    phone: patient.phone,
    email: patient.email,
    created_by: staff.id,
  })
  if (error) {
    if (proofPath) await admin.storage.from('payment-proofs').remove([proofPath])
    return { error: `Không cấp được gói: ${error.message}`, proofPath: null }
  }
  return { error: null, proofPath }
}

async function logAccountEvent(staff: Staff, userId: string, userName: string, action: 'created' | 'password_reset' | 'profile_updated') {
  await createAdminClient().from('account_events').insert({
    user_id: userId,
    user_name: userName,
    actor: staff.id,
    actor_name: staff.fullName || staff.email || staff.phone,
    action,
  })
}

// Ghi chú nội bộ (bệnh nhân không đọc được); người sửa, thời điểm do trigger ghi
async function saveNote(userId: string, note: string) {
  return (await createClient()).from('patient_notes').upsert({ user_id: userId, note })
}

// Tài khoản bệnh nhân (role = user) – nhân viên không thao tác trên tài khoản nhân viên / admin
async function findPatient(userId: string) {
  if (!UUID.test(userId)) return null
  const { data } = await (await createClient()).from('profiles').select('id, role, full_name, phone, email').eq('id', userId).maybeSingle()
  return data?.role === 'user' ? data : null
}

export async function createPatientAction(_prev: SecretResult, formData: FormData): Promise<SecretResult> {
  let staff: Staff
  try {
    staff = await requireStaff()
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
  const contact = readContact(formData)
  if (typeof contact === 'string') return { ok: false, error: contact }
  if (formData.get('consent') !== 'yes') {
    return { ok: false, error: 'Vui lòng xác nhận bệnh nhân đã đồng ý Chính sách bảo mật (đã gửi link qua Zalo).' }
  }
  const grant = await readGrant(formData, false)
  if (typeof grant === 'string') return { ok: false, error: grant }
  if (await isPhoneTaken(contact.phone)) return { ok: false, error: 'Số điện thoại này đã có tài khoản. Hãy tìm bệnh nhân đó và cấp gói ở trang chi tiết.' }
  if (contact.email && (await isEmailTaken(contact.email))) return { ok: false, error: 'Email này đã được tài khoản khác sử dụng.' }

  const admin = createAdminClient()
  const password = generatePassword()
  const { data, error } = await admin.auth.admin.createUser({
    email: contact.email ?? phoneToAuthEmail(contact.phone),
    password,
    email_confirm: true,
    user_metadata: { full_name: contact.fullName, phone: contact.phone },
  })
  if (error || !data.user) {
    if (error?.code === 'email_exists' || error?.message.toLowerCase().includes('already')) {
      return { ok: false, error: 'Email / số điện thoại này đã có tài khoản.' }
    }
    return { ok: false, error: `Không tạo được tài khoản: ${error?.message}` }
  }
  const userId = data.user.id
  // Lỗi ở bước sau: xóa tài khoản vừa tạo để nhân viên tạo lại (không để lại tài khoản dở dang)
  const rollback = async (message: string): Promise<SecretResult> => {
    await admin.from('account_events').delete().eq('user_id', userId)
    await admin.auth.admin.deleteUser(userId)
    return { ok: false, error: message }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      source: 'zalo',
      created_by: staff.id,
      must_change_password: true,
      consent_at: new Date().toISOString(),
      consent_version: CONSENT_VERSION,
      email: contact.email,
    })
    .eq('id', userId)
  if (profileError) return rollback(`Không lưu được thông tin bệnh nhân: ${profileError.message}`)
  if (contact.note) {
    const { error: noteError } = await saveNote(userId, contact.note)
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
    message: grant ? 'Đã tạo tài khoản và cấp gói cho bệnh nhân.' : 'Đã tạo tài khoản bệnh nhân.',
    password,
    patientId: userId,
    name: contact.fullName,
    phone: contact.phone,
  }
}

// Cấp gói / gia hạn cho bệnh nhân đã có tài khoản (hạn học cộng dồn như khi duyệt đơn)
export async function grantPlanAction(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaff()
    const patient = await findPatient(userId)
    if (!patient) return { ok: false, error: 'Không tìm thấy tài khoản bệnh nhân.' }
    const grant = await readGrant(formData, true)
    if (typeof grant === 'string') return { ok: false, error: grant }
    const { error } = await insertGrant(
      staff,
      { id: patient.id, fullName: patient.full_name ?? '', phone: patient.phone ?? '', email: patient.email },
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
    const patient = await findPatient(userId)
    if (!patient) return { ok: false, error: 'Không tìm thấy tài khoản bệnh nhân.' }
    const contact = readContact(formData)
    if (typeof contact === 'string') return { ok: false, error: contact }
    if (await isPhoneTaken(contact.phone, userId)) return { ok: false, error: 'Số điện thoại này đã được tài khoản khác sử dụng.' }
    if (contact.email && (await isEmailTaken(contact.email, userId))) return { ok: false, error: 'Email này đã được tài khoản khác sử dụng.' }

    const admin = createAdminClient()
    // Email đăng nhập: email thật nếu có, không thì email nội bộ theo SĐT (như trang Tài khoản của bệnh nhân)
    const { data: auth } = await admin.auth.admin.getUserById(userId)
    const authEmail = contact.email ?? phoneToAuthEmail(contact.phone)
    if (auth.user && auth.user.email !== authEmail) {
      const { error } = await admin.auth.admin.updateUserById(userId, { email: authEmail, email_confirm: true })
      if (error) return { ok: false, error: error.code === 'email_exists' ? 'Email này đã được tài khoản khác sử dụng.' : error.message }
    }
    const { error } = await admin
      .from('profiles')
      .update({ full_name: contact.fullName, phone: contact.phone, email: contact.email })
      .eq('id', userId)
    if (error) return { ok: false, error: error.message }
    const { error: noteError } = await saveNote(userId, contact.note)
    if (noteError) return { ok: false, error: `Đã lưu thông tin nhưng chưa lưu được ghi chú: ${noteError.message}` }
    await logAccountEvent(staff, userId, contact.fullName, 'profile_updated')

    revalidatePath('/admin', 'layout')
    return { ok: true, message: 'Đã lưu thông tin bệnh nhân.' }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

// Cấp lại mật khẩu (R-02, BR-99): sinh mật khẩu mới, bật nhắc đổi mật khẩu; chỉ tài khoản bệnh nhân
export async function resetPatientPasswordAction(userId: string): Promise<SecretResult> {
  try {
    const staff = await requireStaff()
    const patient = await findPatient(userId)
    if (!patient) return { ok: false, error: 'Chỉ cấp lại mật khẩu cho tài khoản bệnh nhân.' }
    const admin = createAdminClient()
    const password = generatePassword()
    const { error } = await admin.auth.admin.updateUserById(userId, { password })
    if (error) return { ok: false, error: `Không đổi được mật khẩu: ${error.message}` }
    await admin.from('profiles').update({ must_change_password: true }).eq('id', userId)
    await logAccountEvent(staff, userId, patient.full_name ?? patient.phone ?? '', 'password_reset')
    revalidatePath(`/admin/patients/${userId}`)
    return {
      ok: true,
      message: 'Đã cấp mật khẩu mới. Mật khẩu cũ không còn dùng được.',
      password,
      patientId: userId,
      name: patient.full_name ?? '',
      phone: patient.phone ?? '',
    }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}
