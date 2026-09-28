'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { MIN_PASSWORD_LENGTH, passwordHint } from '@/lib/password'
import PasswordInput from '@/components/PasswordInput'
import { SpinnerIcon } from '@/components/icons'
import { forgotPasswordAction, type ForgotState } from './actions'

const initialState: ForgotState = { stage: 'request', identifier: '', maskedEmail: null, error: null, info: null }

// Nút submit gửi kèm "intent" để server biết đang ở bước nào; hiện vòng xoay khi đang xử lý
function IntentButton({
  intent,
  className,
  children,
  noValidate,
}: {
  intent: 'request' | 'verify'
  className: string
  children: React.ReactNode
  noValidate?: boolean
}) {
  const { pending, data } = useFormStatus()
  const active = pending && data?.get('intent') === intent
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      formNoValidate={noValidate}
      className={className}
    >
      {active && <SpinnerIcon className="h-4 w-4" />}
      {children}
    </button>
  )
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useFormState(forgotPasswordAction, initialState)

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && <p role="alert" className="alert-error">{state.error}</p>}
      {state.info && <p role="status" className="alert-success">{state.info}</p>}

      {state.stage === 'request' ? (
        <>
          <div>
            <label htmlFor="identifier" className="label">Email hoặc số điện thoại đã đăng ký</label>
            <input
              id="identifier"
              name="identifier"
              required
              defaultValue={state.identifier}
              placeholder="ban@gmail.com hoặc 0912345678"
              className="input"
              autoComplete="username"
            />
            <p className="mt-1.5 text-xs text-slate-500">Mã xác nhận sẽ được gửi tới email của tài khoản.</p>
          </div>
          <IntentButton intent="request" className="btn-primary w-full">
            Gửi mã xác nhận
          </IntentButton>
        </>
      ) : (
        <>
          <input type="hidden" name="identifier" value={state.identifier} />
          <div>
            <label htmlFor="code" className="label">Mã xác nhận (6 số)</label>
            <input
              id="code"
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="\d{6}"
              placeholder="••••••"
              className="input text-center text-lg tracking-[0.5em]"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Mật khẩu mới</label>
            <PasswordInput id="password" name="password" required minLength={MIN_PASSWORD_LENGTH} placeholder={passwordHint} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">Nhập lại mật khẩu mới</label>
            <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          </div>
          <IntentButton intent="verify" className="btn-primary w-full">
            Đặt lại mật khẩu
          </IntentButton>
          <IntentButton intent="request" noValidate className="btn-ghost w-full">
            Gửi lại mã
          </IntentButton>
        </>
      )}

      <p className="text-center text-sm text-slate-500">
        Nhớ ra mật khẩu?{' '}
        <Link href="/login" className="font-semibold text-ocean-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
