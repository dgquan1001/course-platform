import type { Metadata } from 'next'
import Link from 'next/link'
import { SpineIcon } from '@/components/icons'
import PasswordInput from '@/components/PasswordInput'
import SubmitButton from '@/components/SubmitButton'
import { siteConfig } from '@/lib/site-config'
import { loginAction } from './actions'

export const metadata: Metadata = { title: 'Đăng nhập' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string }
}) {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-gradient-to-b from-ocean-50 via-white to-gold-50/60 px-4 py-12">
      <div className="card w-full max-w-md animate-fade-up p-6 shadow-md shadow-ocean-900/5 sm:p-8">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ocean-600 text-gold-200">
            <SpineIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Đăng nhập</h1>
          <p className="mt-1 text-sm text-slate-500">Chào mừng bạn đến với {siteConfig.name}</p>
        </div>

        {searchParams.error && <p role="alert" className="alert-error mt-6">{searchParams.error}</p>}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={searchParams.next ?? ''} />
          <div>
            <label htmlFor="identifier" className="label">Email hoặc số điện thoại</label>
            <input
              id="identifier"
              name="identifier"
              required
              placeholder="ban@gmail.com hoặc 0912345678"
              className="input"
              autoComplete="username"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="label mb-0">Mật khẩu</label>
              <Link href="/forgot-password" className="text-sm font-medium text-ocean-700 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <PasswordInput id="password" name="password" required placeholder="••••••" autoComplete="current-password" />
          </div>
          <SubmitButton className="btn-primary w-full">Đăng nhập</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-semibold text-ocean-700 hover:underline">
            Đăng ký khóa học
          </Link>
        </p>
      </div>
    </main>
  )
}
