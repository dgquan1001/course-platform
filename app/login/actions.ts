'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { setFlash } from '@/lib/flash'
import { findAccount } from '@/lib/accounts'

// Chỉ cho phép chuyển hướng về đường dẫn nội bộ
function safeNext(next: string) {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/courses'
}

export async function loginAction(formData: FormData) {
  const identifier = String(formData.get('identifier') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(String(formData.get('next') ?? ''))

  // Nhập email hoặc số điện thoại: tìm email đăng nhập tương ứng của tài khoản
  const account = identifier ? await findAccount(identifier) : null
  const email = account?.authEmail ?? identifier.toLowerCase()

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const message =
      error.message === 'Invalid login credentials' || !account
        ? 'Email/số điện thoại hoặc mật khẩu không đúng.'
        : error.message
    redirect(`/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`)
  }

  setFlash('Đăng nhập thành công. Chào mừng bạn quay lại!')
  redirect(next)
}
