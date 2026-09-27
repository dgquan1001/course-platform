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
}

export const isStaffRole = (role: string | null | undefined) => role === 'staff' || role === 'admin'

// User đang đăng nhập (kèm profile), null nếu chưa đăng nhập
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, role')
    .eq('id', user.id)
    .single()

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
  }
}

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
