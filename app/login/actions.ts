'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { setFlash } from '@/lib/flash'
import { findAccount } from '@/lib/accounts'
import { normalizePhone } from '@/lib/phone'
import { clientIp, LIMITS, withinLimit } from '@/lib/rate-limit'
import { startSession } from '@/lib/session'
import type { LoginError } from './errors'

// Chỉ cho phép chuyển hướng về đường dẫn nội bộ
function safeNext(next: string) {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/courses'
}

export async function loginAction(formData: FormData) {
  const identifier = String(formData.get('identifier') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(String(formData.get('next') ?? ''))
  const remember = formData.get('remember') === 'on'

  // Chỉ đưa MÃ lỗi lên URL (trang tự hiển thị câu tương ứng) – không cho link lạ chèn chữ tùy ý vào trang (SEC-14)
  const fail = (code: LoginError) => redirect(`/login?error=${code}&next=${encodeURIComponent(next)}`)

  // Chống dò mật khẩu: đếm số lần sai theo IP + tài khoản và theo IP (kể cả tài khoản không tồn tại)
  const ip = await clientIp()
  const accountKey = `login-fail:${ip}:${normalizePhone(identifier) ?? identifier.toLowerCase()}`
  const ipKey = `login-fail-ip:${ip}`
  const allowed =
    (await withinLimit(accountKey, LIMITS.loginFailPerAccount, false)) &&
    (await withinLimit(ipKey, LIMITS.loginFailPerIp, false))
  if (!allowed) fail('locked')

  // Nhập email hoặc số điện thoại: tìm email đăng nhập tương ứng của tài khoản
  const account = identifier ? await findAccount(identifier) : null
  const email = account?.authEmail ?? identifier.toLowerCase()

  // Ghi nhớ đăng nhập chỉ cho học viên (SEC-13)
  const keep = remember && !account?.isStaff
  const supabase = await createClient({ remember: keep })
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    await Promise.all([withinLimit(accountKey, LIMITS.loginFailPerAccount), withinLimit(ipKey, LIMITS.loginFailPerIp)])
    if (error.message !== 'Invalid login credentials' && account) console.error('[login]', error.message)
    fail(error.message === 'Invalid login credentials' || !account ? 'invalid' : 'failed')
  }

  await startSession({ staff: !!account?.isStaff, remember: keep })

  await setFlash('Đăng nhập thành công. Chào mừng bạn quay lại!')
  redirect(next)
}
