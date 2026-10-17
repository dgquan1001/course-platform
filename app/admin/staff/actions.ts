'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
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
} from '@/lib/managed-accounts'

// Danh mục Nhân viên (Đợt 26 – chủ dự án 18/10/2026): CHỈ admin thêm / sửa / xóa tài khoản nhân viên và admin.
// Nhân viên (staff): duyệt đơn, quản lý khách hàng (thêm / sửa / xóa), phiếu tham vấn, khách quan tâm; không sửa khóa học,
// không phân quyền. Vai trò đổi bằng phiên của admin để database ghi người cấp quyền (trigger guard_role_change,
// chặn tự đổi quyền của mình và gỡ admin cuối cùng).

export type StaffSecretResult =
  | { ok: true; message: string; password: string; staffId: string; name: string; phone: string }
  | { ok: false; error: string }
  | null

const STAFF_ROLES = ['staff', 'admin'] as const
type StaffRole = (typeof STAFF_ROLES)[number]
const isStaffRole = (v: string): v is StaffRole => (STAFF_ROLES as readonly string[]).includes(v)

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim()
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.')
const roleLabel = (role: string) => (role === 'admin' ? 'admin' : 'nhân viên')

// Tài khoản nhân viên / admin (không thao tác tài khoản khách hàng ở đây)
async function findStaff(userId: string) {
  const account = await getManagedAccount(userId)
  return account && isStaffRole(account.role) ? account : null
}

const revalidate = () => revalidatePath('/admin', 'layout')

export async function createStaffAction(_prev: StaffSecretResult, formData: FormData): Promise<StaffSecretResult> {
  let admin: Actor
  try {
    admin = await requireAdmin()
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
  const contact = readContact(formData)
  if (typeof contact === 'string') return { ok: false, error: contact }
  const role = text(formData, 'role')
  if (!isStaffRole(role)) return { ok: false, error: 'Vui lòng chọn vai trò Nhân viên hoặc Admin.' }
  const conflict = await contactConflict(contact)
  if (conflict) {
    return {
      ok: false,
      error: `${conflict} Nếu đó là khách hàng muốn chuyển thành nhân viên: mở hồ sơ khách hàng › Phân quyền.`,
    }
  }

  const created = await provisionAccount(contact, { created_by: admin.id })
  if (created.error !== undefined) return { ok: false, error: created.error }
  // Cấp vai trò bằng phiên admin (database ghi người cấp quyền vào role_events)
  const { error: roleError } = await (await createClient()).from('profiles').update({ role }).eq('id', created.userId)
  if (roleError) {
    await removeAuthUser(created.userId)
    return { ok: false, error: `Không cấp được vai trò: ${roleError.message}` }
  }
  await logAccountEvent(admin, created.userId, contact.fullName, 'created')

  revalidate()
  return {
    ok: true,
    message: `Đã tạo tài khoản ${roleLabel(role)}.`,
    password: created.password,
    staffId: created.userId,
    name: contact.fullName,
    phone: contact.phone,
  }
}

export async function updateStaffAction(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const member = await findStaff(userId)
    if (!member) return { ok: false, error: 'Không tìm thấy tài khoản nhân viên.' }
    const contact = readContact(formData)
    if (typeof contact === 'string') return { ok: false, error: contact }
    const conflict = await contactConflict(contact, userId)
    if (conflict) return { ok: false, error: conflict }
    const error = await updateContact(userId, contact)
    if (error) return { ok: false, error }
    await logAccountEvent(admin, userId, contact.fullName, 'profile_updated')
    revalidate()
    return { ok: true, message: 'Đã lưu thông tin nhân viên.' }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

// Cấp lại mật khẩu cho nhân viên / admin khác (mọi phiên đang mở của người đó bị đăng xuất). Mật khẩu của mình: trang Tài khoản.
export async function resetStaffPasswordAction(userId: string): Promise<StaffSecretResult> {
  try {
    const admin = await requireAdmin()
    if (userId === admin.id) return { ok: false, error: 'Đổi mật khẩu của bạn ở trang Tài khoản của tôi.' }
    const member = await findStaff(userId)
    if (!member) return { ok: false, error: 'Không tìm thấy tài khoản nhân viên.' }
    const result = await resetPassword(userId)
    if (result.error !== undefined) return { ok: false, error: result.error }
    await logAccountEvent(admin, userId, member.full_name ?? member.phone ?? '', 'password_reset')
    revalidatePath(`/admin/staff/${userId}`)
    return {
      ok: true,
      message: 'Đã cấp mật khẩu mới. Mật khẩu cũ không còn dùng được, các phiên đang mở bị đăng xuất.',
      password: result.password,
      staffId: userId,
      name: member.full_name ?? '',
      phone: member.phone ?? '',
    }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

// Xóa vĩnh viễn tài khoản nhân viên / admin: không tự xóa mình, luôn còn ít nhất 1 admin (database cũng chặn – trigger
// guard_admin_delete), phải gõ lại SĐT. Đơn / phiếu / khách quan tâm người đó đã xử lý vẫn giữ tên người xử lý.
export async function deleteStaffAction(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (userId === admin.id) return { ok: false, error: 'Bạn không thể tự xóa tài khoản của mình.' }
    const member = await findStaff(userId)
    if (!member) return { ok: false, error: 'Không tìm thấy tài khoản nhân viên (có thể đã bị xóa).' }
    if (!confirmMatches(text(formData, 'confirm'), member)) {
      return { ok: false, error: 'Thông tin xác nhận không khớp, hãy gõ đúng số điện thoại của nhân viên.' }
    }
    if (member.role === 'admin') {
      const { count, error } = await createAdminClient().from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin').neq('id', userId)
      if (error) return { ok: false, error: 'Không kiểm tra được số admin còn lại, vui lòng thử lại.' }
      if (!count) return { ok: false, error: 'Phải còn ít nhất 1 tài khoản admin.' }
    }
    const name = member.full_name || member.phone || member.email || ''
    const error = await deleteAccount(userId, { deleteHealthData: false })
    if (error) return { ok: false, error }
    await logAccountEvent(admin, null, name, 'deleted')
    revalidate()
    return { ok: true, message: `Đã xóa tài khoản ${roleLabel(member.role)} ${name}.`, redirectTo: '/admin/staff' }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}
