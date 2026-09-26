'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isEmailTaken, isPhoneTaken } from '@/lib/accounts'
import { isValidEmail, normalizePhone, phoneToAuthEmail } from '@/lib/phone'
import { MIN_PASSWORD_LENGTH, passwordTooShort } from '@/lib/password'
import type { ActionResult } from '@/lib/action-result'

const fail = (error: string): ActionResult => ({ ok: false, error })

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')

  const fullName = String(formData.get('fullName') ?? '').trim()
  const phone = normalizePhone(String(formData.get('phone') ?? ''))
  const email = String(formData.get('email') ?? '').trim().toLowerCase() || null

  if (!fullName) return fail('Vui lòng nhập họ và tên.')
  if (!phone) return fail('Số điện thoại không hợp lệ (VD: 0912345678).')
  if (email && !isValidEmail(email)) return fail('Địa chỉ email không hợp lệ.')
  if (await isPhoneTaken(phone, user.id)) return fail('Số điện thoại này đã được tài khoản khác sử dụng.')
  if (email && (await isEmailTaken(email, user.id))) return fail('Email này đã được tài khoản khác sử dụng.')

  const admin = createAdminClient()

  // Email đăng nhập: email thật nếu có, không thì email nội bộ theo SĐT
  const authEmail = email ?? phoneToAuthEmail(phone)
  if (authEmail !== user.authEmail) {
    const { error } = await admin.auth.admin.updateUserById(user.id, { email: authEmail, email_confirm: true })
    if (error) {
      return fail(error.code === 'email_exists' ? 'Email này đã được tài khoản khác sử dụng.' : error.message)
    }
  }

  const { error } = await admin
    .from('profiles')
    .update({ full_name: fullName, phone, email })
    .eq('id', user.id)
  if (error) return fail(error.message)

  revalidatePath('/', 'layout')
  return { ok: true, message: 'Đã cập nhật thông tin tài khoản.' }
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')

  const current = String(formData.get('currentPassword') ?? '')
  const next = String(formData.get('newPassword') ?? '')
  const confirm = String(formData.get('confirmPassword') ?? '')

  if (next.length < MIN_PASSWORD_LENGTH) return fail(passwordTooShort('Mật khẩu mới'))
  if (next !== confirm) return fail('Mật khẩu nhập lại không khớp.')

  // Kiểm tra mật khẩu hiện tại bằng một client riêng (không ảnh hưởng phiên đăng nhập)
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { error: wrong } = await verifier.auth.signInWithPassword({ email: user.authEmail, password: current })
  if (wrong) return fail('Mật khẩu hiện tại không đúng.')

  const { error } = await createAdminClient().auth.admin.updateUserById(user.id, { password: next })
  if (error) return fail(error.message)

  return { ok: true, message: 'Đã đổi mật khẩu thành công.' }
}
