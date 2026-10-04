import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/phone'

export type Account = {
  userId: string
  authEmail: string // email dùng để đăng nhập Supabase (có thể là email nội bộ)
  email: string | null // email thật để liên hệ / nhận mã
  phone: string | null
}

// Tìm tài khoản theo email hoặc số điện thoại. Chỉ dùng phía server.
export async function findAccount(identifier: string): Promise<Account | null> {
  const value = identifier.trim()
  const admin = createAdminClient()

  let query = admin.from('profiles').select('id, email, phone')
  if (value.includes('@')) {
    query = query.eq('email', value.toLowerCase())
  } else {
    const phone = normalizePhone(value)
    if (!phone) return null
    query = query.eq('phone', phone)
  }

  const { data: profile } = await query.maybeSingle()
  if (!profile) return null

  const { data } = await admin.auth.admin.getUserById(profile.id)
  if (!data.user?.email) return null

  return { userId: profile.id, authEmail: data.user.email, email: profile.email, phone: profile.phone }
}

export async function isPhoneTaken(phone: string, exceptUserId?: string) {
  let query = createAdminClient().from('profiles').select('id').eq('phone', phone)
  if (exceptUserId) query = query.neq('id', exceptUserId)
  const { data } = await query.limit(1)
  return !!data?.length
}

export async function isEmailTaken(email: string, exceptUserId?: string) {
  let query = createAdminClient().from('profiles').select('id').eq('email', email)
  if (exceptUserId) query = query.neq('id', exceptUserId)
  const { data } = await query.limit(1)
  return !!data?.length
}
