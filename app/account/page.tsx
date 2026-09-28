import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUserPage } from '@/lib/auth'
import { MIN_PASSWORD_LENGTH, passwordHint } from '@/lib/password'
import ActionForm from '@/components/ActionForm'
import PasswordInput from '@/components/PasswordInput'
import SubmitButton from '@/components/SubmitButton'
import { ArrowRightIcon, KeyIcon, UserIcon } from '@/components/icons'
import { changePasswordAction, updateProfileAction } from './actions'

export const metadata: Metadata = { title: 'Tài khoản của tôi' }

export default async function AccountPage() {
  const user = await requireUserPage('/account')

  return (
    <main>
      <section className="border-b border-ocean-100 bg-gradient-to-b from-ocean-50 to-white">
        <div className="container-page py-8 sm:py-10">
          <p className="text-sm text-slate-500">Xin chào, {user.fullName || user.phone}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Tài khoản của tôi</h1>
        </div>
      </section>

      <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <UserIcon className="h-5 w-5 text-ocean-600" /> Thông tin cá nhân
          </h2>
          {/* key đổi theo dữ liệu mới → form hiển thị lại giá trị vừa lưu */}
          <ActionForm
            key={`${user.fullName}|${user.phone}|${user.email}`}
            action={updateProfileAction}
            className="space-y-4"
          >
            <div>
              <label htmlFor="fullName" className="label">Họ và tên *</label>
              <input id="fullName" name="fullName" required defaultValue={user.fullName ?? ''} className="input" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Số điện thoại * <span className="font-normal text-slate-400">(dùng để đăng nhập)</span></label>
              <input id="phone" name="phone" type="tel" required defaultValue={user.phone ?? ''} className="input" autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="email" className="label">Email <span className="font-normal text-slate-400">(không bắt buộc)</span></label>
              <input id="email" name="email" type="email" defaultValue={user.email ?? ''} placeholder="ban@gmail.com" className="input" autoComplete="email" />
              {!user.email && (
                <p className="mt-1.5 text-xs text-gold-800">
                  Thêm email để có thể nhận mã khi quên mật khẩu và đăng nhập bằng email.
                </p>
              )}
            </div>
            <SubmitButton>Lưu thông tin</SubmitButton>
          </ActionForm>
        </section>

        <div className="space-y-6">
          <section id="doi-mat-khau" className="card scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <KeyIcon className="h-5 w-5 text-ocean-600" /> Đổi mật khẩu
            </h2>
            {user.mustChangePassword && (
              <p className="alert-warning mb-4 text-sm">
                Mật khẩu hiện tại do nhân viên trung tâm cấp. Bạn nên đổi sang mật khẩu mới do mình tự đặt.
              </p>
            )}
            <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="label">Mật khẩu hiện tại</label>
                <PasswordInput id="currentPassword" name="currentPassword" required autoComplete="current-password" />
              </div>
              <div>
                <label htmlFor="newPassword" className="label">Mật khẩu mới</label>
                <PasswordInput id="newPassword" name="newPassword" required minLength={MIN_PASSWORD_LENGTH} placeholder={passwordHint} autoComplete="new-password" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">Nhập lại mật khẩu mới</label>
                <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
              </div>
              <SubmitButton>Đổi mật khẩu</SubmitButton>
            </ActionForm>
          </section>

          <Link href="/courses" className="card group flex items-center justify-between p-5 transition hover:border-ocean-200">
            <span className="font-semibold text-ocean-900">Khóa học của tôi</span>
            <ArrowRightIcon className="h-5 w-5 text-ocean-600 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </main>
  )
}
