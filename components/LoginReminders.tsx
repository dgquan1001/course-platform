'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { acceptConsentAction } from '@/app/account/actions'
import { invalidateProfile, useProfile } from '@/lib/use-profile'
import { SpinnerIcon } from './icons'
import { toast } from './Toaster'

// Hộp nhắc sau khi đăng nhập (SCR-21), chỉ với tài khoản học viên / bệnh nhân:
// 1. Chưa đồng ý Chính sách bảo mật (tài khoản cũ): phải đồng ý mới dùng tiếp (vẫn đăng xuất được).
// 2. Mật khẩu do nhân viên cấp (must_change_password): nhắc đổi, không bắt buộc – "Để sau" ẩn tới hết phiên trình duyệt.
const skipKey = (userId: string) => `hv-skip-password-reminder:${userId}`

export default function LoginReminders() {
  const pathname = usePathname()
  const profile = useProfile()
  const [consented, setConsented] = useState(false)
  const [skipped, setSkipped] = useState(true)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setConsented(false)
    setSkipped(!!profile && sessionStorage.getItem(skipKey(profile.id)) === '1')
  }, [profile])

  if (!profile || profile.role !== 'user') return null
  // Đang đọc chính sách / đang ở trang đổi mật khẩu thì không che nội dung
  if (pathname === '/chinh-sach-bao-mat') return null
  const showConsent = !profile.consent_at && !consented
  const showPassword = !showConsent && profile.must_change_password && !skipped && pathname !== '/account'
  if (!showConsent && !showPassword) return null

  async function accept() {
    setPending(true)
    try {
      const result = await acceptConsentAction()
      if (result.ok) {
        toast(result.message)
        invalidateProfile()
        setConsented(true)
      } else {
        toast(result.error, 'error')
      }
    } catch {
      toast('Không kết nối được máy chủ, vui lòng thử lại.', 'error')
    }
    setPending(false)
  }

  function later() {
    sessionStorage.setItem(skipKey(profile!.id), '1')
    setSkipped(true)
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ocean-950/50 p-4">
      {showConsent ? (
        <div role="dialog" aria-modal="true" aria-labelledby="consent-title" className="card w-full max-w-md p-6 shadow-xl">
          <h2 id="consent-title" className="text-lg font-bold">Chính sách bảo mật</h2>
          <p className="mt-3 text-sm text-slate-600">
            Trung tâm vừa cập nhật Chính sách bảo mật: thông tin cá nhân, tiến độ tập và thông tin sức khỏe bạn cung cấp chỉ
            dùng để hướng dẫn tập luyện và tư vấn. Vui lòng đọc và đồng ý để tiếp tục sử dụng tài khoản.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" onClick={accept} disabled={pending} className="btn-primary sm:flex-1">
              {pending && <SpinnerIcon className="h-4 w-4" />} Tôi đồng ý
            </button>
            <Link href="/chinh-sach-bao-mat" target="_blank" className="btn-outline sm:flex-1">
              Đọc chính sách
            </Link>
          </div>
        </div>
      ) : (
        <div role="dialog" aria-modal="true" aria-labelledby="password-title" className="card w-full max-w-md p-6 shadow-xl">
          <h2 id="password-title" className="text-lg font-bold">Bạn nên đổi mật khẩu</h2>
          <p className="mt-3 text-sm text-slate-600">
            Mật khẩu của bạn do nhân viên trung tâm cấp. Bạn nên đổi sang mật khẩu mới do mình tự đặt để bảo mật tài khoản.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <Link href="/account#doi-mat-khau" onClick={later} className="btn-primary sm:flex-1">
              Đổi ngay
            </Link>
            <button type="button" onClick={later} className="btn-outline sm:flex-1">
              Để sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
