'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { setFlash } from '@/lib/flash'
import { findAccount } from '@/lib/accounts'
import { normalizePhone } from '@/lib/phone'
import { clientIp, LIMITS, withinLimit } from '@/lib/rate-limit'

// Chỉ cho phép chuyển hướng về đường dẫn nội bộ
function safeNext(next: string) {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/courses'
}

export async function loginAction(formData: FormData) {
  const identifier = String(formData.get('identifier') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(String(formData.get('next') ?? ''))

  const fail = (message: string) =>
    redirect(`/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`)

  // Chống dò mật khẩu: đếm số lần sai theo IP + tài khoản và theo IP (kể cả tài khoản không tồn tại)
  const ip = clientIp()
  const accountKey = `login-fail:${ip}:${normalizePhone(identifier) ?? identifier.toLowerCase()}`
  const ipKey = `login-fail-ip:${ip}`
  const allowed =
    (await withinLimit(accountKey, LIMITS.loginFailPerAccount, false)) &&
    (await withinLimit(ipKey, LIMITS.loginFailPerIp, false))
  if (!allowed) fail('Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút hoặc dùng "Quên mật khẩu".')

  // Nhập email hoặc số điện thoại: tìm email đăng nhập tương ứng của tài khoản
  const account = identifier ? await findAccount(identifier) : null
  const email = account?.authEmail ?? identifier.toLowerCase()

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    await Promise.all([withinLimit(accountKey, LIMITS.loginFailPerAccount), withinLimit(ipKey, LIMITS.loginFailPerIp)])
    fail(
      error.message === 'Invalid login credentials' || !account
        ? 'Email/số điện thoại hoặc mật khẩu không đúng.'
        : error.message
    )
  }

  setFlash('Đăng nhập thành công. Chào mừng bạn quay lại!')
  redirect(next)
}
