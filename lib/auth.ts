import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { realEmail } from '@/lib/phone'

// user: bệnh nhân / học viên · staff: nhân viên · admin: quyền cao nhất
export type Role = 'user' | 'staff' | 'admin'

type CurrentUser = {
  id: string
  authEmail: string // email đăng nhập Supabase (có thể là email nội bộ theo SĐT)
  email: string | null // email thật, null nếu tài khoản chỉ dùng SĐT
  fullName: string | null
  phone: string | null
  role: Role
  isAdmin: boolean
  isStaff: boolean // nhân viên hoặc admin
  mustChangePassword: boolean // mật khẩu do nhân viên cấp, nên đổi (ADR-014)
}

export const isStaffRole = (role: string | null | undefined) => role === 'staff' || role === 'admin'

// id người dùng trong access token (claim "sub") – chỉ để gửi sớm truy vấn profile, không dùng để quyết định quyền.
// Đọc thẳng JWT thay vì session.user để Supabase không ghi cảnh báo "getSession() could be insecure" mỗi request.
function tokenSubject(token: string | undefined) {
  try {
    const payload = token?.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.sub === 'string' ? json.sub : null
  } catch {
    return null
  }
}

// User đang đăng nhập (kèm profile), null nếu chưa đăng nhập.
// Middleware chỉ đọc phiên từ cookie (không gọi mạng); ở đây xác thực phiên với Supabase Auth (getUser) –
// `cache` gộp mọi lần gọi trong cùng một request (layout + trang + loadLearning…) thành 1 lần xác thực + 1 truy vấn profile.
// PERF-10 (Đợt 22): đọc profile song song với xác thực (id lấy từ cookie phiên) thay vì chờ getUser xong mới truy vấn –
// bớt 1 lượt gọi Supabase cho mọi trang cần đăng nhập. Profile chỉ được dùng khi getUser xác nhận đúng người đó
// (truy vấn profile vẫn chịu RLS theo JWT, cookie giả không đọc được gì).
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const earlyId = tokenSubject(session?.access_token)
  const profileQuery = (id: string) =>
    supabase.from('profiles').select('full_name, phone, role, must_change_password').eq('id', id).maybeSingle()
  const [
    {
      data: { user },
    },
    early,
  ] = await Promise.all([supabase.auth.getUser(), earlyId ? profileQuery(earlyId) : Promise.resolve(null)])
  if (!user) return null

  const { data: profile } = early && earlyId === user.id ? early : await profileQuery(user.id)

  const role: Role = profile?.role === 'admin' || profile?.role === 'staff' ? profile.role : 'user'
  return {
    id: user.id,
    authEmail: user.email ?? '',
    email: realEmail(user.email),
    fullName: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    role,
    isAdmin: role === 'admin',
    isStaff: isStaffRole(role),
    mustChangePassword: !!profile?.must_change_password,
  }
})

// Dùng trong server action: báo lỗi (ActionResult) thay vì chuyển trang
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user?.isAdmin) throw new Error('Chỉ admin được thực hiện thao tác này')
  return user
}

export async function requireStaff() {
  const user = await getCurrentUser()
  if (!user?.isStaff) throw new Error('Chỉ nhân viên hoặc admin được thực hiện thao tác này')
  return user
}

// Dùng trong trang (server component): phiên không hợp lệ → đăng nhập; không đủ quyền → trang phù hợp.
// Middleware đã chặn khách chưa đăng nhập bằng cookie; các hàm này là lớp kiểm tra thật (phiên đã xác thực).
export async function requireUserPage(next: string) {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

export async function requireStaffPage() {
  const user = await requireUserPage('/admin')
  if (!user.isStaff) redirect('/courses')
  return user
}

// Trang chỉ admin (khóa học, cài đặt): nhân viên về Tổng quan
export async function requireAdminPage() {
  const user = await requireStaffPage()
  if (!user.isAdmin) redirect('/admin')
  return user
}
