'use server'

import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findAccount } from '@/lib/accounts'
import { resetCodeEmail, sendMail } from '@/lib/mailer'
import { setFlash } from '@/lib/flash'
import { siteConfig } from '@/lib/site-config'
import { MIN_PASSWORD_LENGTH, passwordTooShort } from '@/lib/password'
import { clientIp, LIMITS, withinLimit } from '@/lib/rate-limit'

export type ForgotState = {
  stage: 'request' | 'verify'
  identifier: string
  maskedEmail: string | null
  error: string | null
  info: string | null
}

const CODE_TTL_MINUTES = 10
const RESEND_SECONDS = 60
const MAX_ATTEMPTS = 5

function hashCode(userId: string, code: string) {
  return createHash('sha256').update(`${userId}:${code}`).digest('hex')
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`
}

// Một action cho cả 2 bước: "request" gửi mã, "verify" kiểm tra mã và đặt mật khẩu mới
export async function forgotPasswordAction(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  return formData.get('intent') === 'verify' ? verifyCode(prev, formData) : requestCode(prev, formData)
}

async function requestCode(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const identifier = String(formData.get('identifier') ?? '').trim()
  const fail = (error: string): ForgotState => ({ ...prev, identifier, error, info: null })

  if (!identifier) return fail('Vui lòng nhập email hoặc số điện thoại.')
  // Giới hạn theo IP (tính cả khi không tìm thấy tài khoản: chống dò danh sách tài khoản)
  if (!(await withinLimit(`forgot:${await clientIp()}`, LIMITS.forgotPassword))) {
    return fail(`Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 1 giờ hoặc gọi ${siteConfig.hotline}.`)
  }
  const account = await findAccount(identifier)
  if (!account) return fail('Không tìm thấy tài khoản với email hoặc số điện thoại này.')
  if (!account.email) {
    return fail(
      `Tài khoản này chưa có email nên không thể nhận mã. Vui lòng gọi ${siteConfig.hotline} để được hỗ trợ đặt lại mật khẩu.`
    )
  }

  const admin = createAdminClient()
  const { data: last } = await admin
    .from('password_resets')
    .select('created_at')
    .eq('user_id', account.userId)
    .order('created_at', { ascending: false })
    .limit(1)
  const waited = last?.[0] ? (Date.now() - new Date(last[0].created_at).getTime()) / 1000 : Infinity
  if (waited < RESEND_SECONDS) {
    return fail(`Vui lòng đợi ${Math.ceil(RESEND_SECONDS - waited)} giây trước khi gửi lại mã.`)
  }

  // Vô hiệu hóa các mã cũ, tạo mã mới 6 chữ số (chỉ lưu bản băm)
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await admin
    .from('password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', account.userId)
    .is('used_at', null)
  const { data: row, error } = await admin
    .from('password_resets')
    .insert({
      user_id: account.userId,
      code_hash: hashCode(account.userId, code),
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
    })
    .select('id')
    .single()
  if (error) return fail(`Không tạo được mã: ${error.message}`)

  try {
    await sendMail({ to: account.email, ...resetCodeEmail(code, CODE_TTL_MINUTES) })
  } catch (e) {
    await admin.from('password_resets').delete().eq('id', row.id)
    return fail(e instanceof Error ? e.message : 'Không gửi được email, vui lòng thử lại.')
  }

  const maskedEmail = maskEmail(account.email)
  return {
    stage: 'verify',
    identifier,
    maskedEmail,
    error: null,
    info: `Đã gửi mã 6 số tới ${maskedEmail}. Mã có hiệu lực trong ${CODE_TTL_MINUTES} phút (kiểm tra cả thư mục Spam).`,
  }
}

async function verifyCode(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const identifier = String(formData.get('identifier') ?? '').trim()
  const code = String(formData.get('code') ?? '').replace(/\s/g, '')
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirmPassword') ?? '')
  const fail = (error: string): ForgotState => ({ ...prev, stage: 'verify', identifier, error, info: null })

  if (!/^\d{6}$/.test(code)) return fail('Mã xác nhận gồm 6 chữ số.')
  if (password.length < MIN_PASSWORD_LENGTH) return fail(passwordTooShort('Mật khẩu mới'))
  if (password !== confirm) return fail('Mật khẩu nhập lại không khớp.')

  const account = await findAccount(identifier)
  if (!account) return fail('Không tìm thấy tài khoản.')

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('password_resets')
    .select('id, code_hash, attempts, expires_at')
    .eq('user_id', account.userId)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
  const row = rows?.[0]
  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return fail('Mã đã hết hạn hoặc không tồn tại. Vui lòng bấm "Gửi lại mã".')
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return fail('Bạn đã nhập sai quá nhiều lần. Vui lòng bấm "Gửi lại mã" để nhận mã mới.')
  }

  const expected = Buffer.from(row.code_hash, 'hex')
  const actual = Buffer.from(hashCode(account.userId, code), 'hex')
  if (!timingSafeEqual(expected, actual)) {
    await admin.from('password_resets').update({ attempts: row.attempts + 1 }).eq('id', row.id)
    const left = MAX_ATTEMPTS - row.attempts - 1
    return fail(left > 0 ? `Mã không đúng. Bạn còn ${left} lần thử.` : 'Mã không đúng. Vui lòng gửi lại mã mới.')
  }

  await admin.from('password_resets').update({ used_at: new Date().toISOString() }).eq('id', row.id)
  const { error } = await admin.auth.admin.updateUserById(account.userId, { password })
  if (error) return fail(`Không đặt lại được mật khẩu: ${error.message}`)

  // Đăng nhập luôn bằng mật khẩu mới
  await (await createClient()).auth.signInWithPassword({ email: account.authEmail, password })
  await setFlash('Đặt lại mật khẩu thành công!')
  redirect('/courses')
}
