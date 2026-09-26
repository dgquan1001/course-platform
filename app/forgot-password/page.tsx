import type { Metadata } from 'next'
import { KeyIcon } from '@/components/icons'
import { hotlineHref, siteConfig } from '@/lib/site-config'
import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata: Metadata = { title: 'Quên mật khẩu' }

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-gradient-to-b from-ocean-50 via-white to-gold-50/60 px-4 py-12">
      <div className="card w-full max-w-md animate-fade-up p-6 shadow-md shadow-ocean-900/5 sm:p-8">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ocean-600 text-gold-200">
            <KeyIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-slate-500">Nhận mã xác nhận qua email để đặt mật khẩu mới</p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-4 text-center text-xs text-slate-400">
          Tài khoản không có email? Gọi{' '}
          <a href={hotlineHref} className="font-semibold text-ocean-700">{siteConfig.hotline}</a> để được hỗ trợ.
        </p>
      </div>
    </main>
  )
}
