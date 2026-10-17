import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isEmailTaken, isPhoneTaken } from '@/lib/accounts'
import { isValidEmail, normalizePhone, phoneToAuthEmail } from '@/lib/phone'
import { generatePassword } from '@/lib/generate-password'
import type { getCurrentUser } from '@/lib/auth'

// Tài khoản do nhân viên / admin quản lý (Đợt 26): dùng chung cho trang Khách hàng (nhân viên + admin) và trang Nhân viên (chỉ admin).
// Mọi hàm ở đây chạy phía server, sau khi server action đã kiểm tra quyền (requireStaff / requireAdmin).

export type Actor = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
export type Contact = { fullName: string; phone: string; email: string | null }
export type AccountRow = { id: string; role: string; full_name: string | null; phone: string | null; email: string | null }
export type AccountAction = 'created' | 'password_reset' | 'profile_updated' | 'deleted'

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_NAME = 100

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim()

// Họ tên, SĐT (bắt buộc – dùng để đăng nhập), email (không bắt buộc)
export function readContact(formData: FormData): Contact | string {
  const fullName = text(formData, 'fullName')
  const phone = normalizePhone(text(formData, 'phone'))
  const email = text(formData, 'email').toLowerCase() || null
  if (!fullName) return 'Vui lòng nhập họ và tên.'
  if (fullName.length > MAX_NAME) return `Họ tên tối đa ${MAX_NAME} ký tự.`
  if (!phone) return 'Số điện thoại không hợp lệ (VD: 0912345678).'
  if (email && !isValidEmail(email)) return 'Địa chỉ email không hợp lệ.'
  return { fullName, phone, email }
}

// Tài khoản theo id (đọc bằng phiên của người đang thao tác – RLS: nhân viên / admin đọc được mọi profile)
export async function getManagedAccount(userId: string): Promise<AccountRow | null> {
  if (!UUID.test(userId)) return null
  const { data } = await (await createClient()).from('profiles').select('id, role, full_name, phone, email').eq('id', userId).maybeSingle()
  return data
}

// Chuỗi người thao tác phải gõ lại để xác nhận xóa: SĐT (luôn có với tài khoản tạo từ web / nhân viên), không có thì email / họ tên
export const deleteConfirmValue = (a: Pick<AccountRow, 'phone' | 'email' | 'full_name'>) => a.phone || a.email || a.full_name || ''

export function confirmMatches(typed: string, account: Pick<AccountRow, 'phone' | 'email' | 'full_name'>) {
  const expected = deleteConfirmValue(account)
  if (!expected) return false
  const value = typed.trim()
  if (account.phone) return normalizePhone(value) === account.phone
  return value.toLowerCase() === expected.toLowerCase()
}

// Nhật ký tài khoản: ai làm gì với tài khoản nào (lưu kèm tên – vẫn đọc được khi tài khoản đã bị xóa). Lỗi ghi nhật ký không chặn thao tác.
export async function logAccountEvent(actor: Actor, userId: string | null, userName: string, action: AccountAction) {
  await createAdminClient()
    .from('account_events')
    .insert({ user_id: userId, user_name: userName, actor: actor.id, actor_name: actor.fullName || actor.email || actor.phone, action })
    .then(
      () => undefined,
      () => undefined
    )
}

// Trùng SĐT / email với tài khoản khác
export async function contactConflict(contact: Contact, exceptUserId?: string) {
  if (await isPhoneTaken(contact.phone, exceptUserId)) return 'Số điện thoại này đã được tài khoản khác sử dụng.'
  if (contact.email && (await isEmailTaken(contact.email, exceptUserId))) return 'Email này đã được tài khoản khác sử dụng.'
  return null
}

// Tạo tài khoản Auth + profile với mật khẩu hệ thống sinh (hiện MỘT lần cho người tạo, không lưu ở đâu – BR-95).
// Đăng nhập bằng email thật nếu có, không thì email nội bộ theo SĐT.
export async function provisionAccount(
  contact: Contact,
  profile: Record<string, unknown>
): Promise<{ error: string } | { error?: never; userId: string; password: string }> {
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
      return { error: 'Email / số điện thoại này đã có tài khoản.' }
    }
    return { error: `Không tạo được tài khoản: ${error?.message}` }
  }
  const userId = data.user.id
  const { error: profileError } = await admin
    .from('profiles')
    .update({ must_change_password: true, email: contact.email, ...profile })
    .eq('id', userId)
  if (profileError) {
    await removeAuthUser(userId)
    return { error: `Không lưu được thông tin tài khoản: ${profileError.message}` }
  }
  return { userId, password }
}

// Xóa tài khoản vừa tạo dở (bước sau lỗi): không để lại tài khoản không dùng được
export async function removeAuthUser(userId: string) {
  const admin = createAdminClient()
  await admin.from('account_events').delete().eq('user_id', userId)
  await admin.auth.admin.deleteUser(userId)
}

// Sửa họ tên / SĐT / email; đổi luôn email đăng nhập (email thật, không thì email nội bộ theo SĐT)
export async function updateContact(userId: string, contact: Contact) {
  const admin = createAdminClient()
  const { data: auth } = await admin.auth.admin.getUserById(userId)
  const authEmail = contact.email ?? phoneToAuthEmail(contact.phone)
  if (auth.user && auth.user.email !== authEmail) {
    const { error } = await admin.auth.admin.updateUserById(userId, { email: authEmail, email_confirm: true })
    if (error) return error.code === 'email_exists' ? 'Email này đã được tài khoản khác sử dụng.' : error.message
  }
  const { error } = await admin.from('profiles').update({ full_name: contact.fullName, phone: contact.phone, email: contact.email }).eq('id', userId)
  return error?.message ?? null
}

// Mật khẩu mới do hệ thống sinh; Supabase thu hồi mọi phiên đang mở của tài khoản đó (mật khẩu cũ hết hiệu lực)
export async function resetPassword(userId: string): Promise<{ error: string } | { error?: never; password: string }> {
  const admin = createAdminClient()
  const password = generatePassword()
  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) return { error: `Không đổi được mật khẩu: ${error.message}` }
  await admin.from('profiles').update({ must_change_password: true }).eq('id', userId)
  return { password }
}

// Xóa vĩnh viễn tài khoản Auth. Database tự xóa theo: profile, tiến độ, ghi chú nội bộ, mã quên mật khẩu (cascade);
// giữ lại với người = null: đơn đăng ký + ảnh chuyển khoản (chứng từ), khách quan tâm, nhật ký (đã lưu tên).
// deleteHealthData: xóa luôn phiếu tham vấn (dữ liệu sức khỏe – Q-5) của khách hàng.
export async function deleteAccount(userId: string, { deleteHealthData }: { deleteHealthData: boolean }) {
  const admin = createAdminClient()
  // Lấy id phiếu trước khi xóa tài khoản (sau đó user_id của phiếu về null, không tìm lại được)
  const consultationIds: string[] = []
  if (deleteHealthData) {
    const { data, error } = await admin.from('consultations').select('id').eq('user_id', userId)
    if (error) return `Không đọc được phiếu tham vấn: ${error.message}`
    consultationIds.push(...(data ?? []).map((c) => c.id))
  }
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return `Không xóa được tài khoản: ${error.message}`
  if (consultationIds.length) {
    const { error: consultError } = await admin.from('consultations').delete().in('id', consultationIds)
    if (consultError) return `Đã xóa tài khoản nhưng chưa xóa được phiếu tham vấn: ${consultError.message}`
  }
  return null
}
