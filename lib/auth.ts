import { createClient } from '@/lib/supabase/server'
import { realEmail } from '@/lib/phone'

type CurrentUser = {
  id: string
  authEmail: string // email đăng nhập Supabase (có thể là email nội bộ theo SĐT)
  email: string | null // email thật, null nếu tài khoản chỉ dùng SĐT
  fullName: string | null
  phone: string | null
  isAdmin: boolean
}

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

  return {
    id: user.id,
    authEmail: user.email ?? '',
    email: realEmail(user.email),
    fullName: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    isAdmin: profile?.role === 'admin',
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user?.isAdmin) throw new Error('Chỉ admin được thực hiện thao tác này')
  return user
}
