'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { acceptConsentAction } from '@/app/account/actions'
import { SpinnerIcon } from './icons'
import { toast } from './Toaster'

// Học viên có tài khoản từ trước khi có Chính sách bảo mật (chưa có consent_at): hỏi đồng ý một lần sau khi đăng nhập.
// Chỉ áp dụng tài khoản học viên; nhân viên / admin không bị hỏi.
export default function ConsentReminder() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return !cancelled && setShow(false)
      const { data: profile } = await supabase.from('profiles').select('role, consent_at').eq('id', session.user.id).single()
      if (!cancelled) setShow(profile?.role === 'user' && !profile.consent_at)
    })
    return () => {
      cancelled = true
    }
  }, [pathname])

  // Đang đọc chính sách thì không che nội dung
  if (!show || pathname === '/chinh-sach-bao-mat') return null

  async function accept() {
    setPending(true)
    try {
      const result = await acceptConsentAction()
      if (result.ok) {
        toast(result.message)
        setShow(false)
      } else {
        toast(result.error, 'error')
      }
    } catch {
      toast('Không kết nối được máy chủ, vui lòng thử lại.', 'error')
    }
    setPending(false)
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ocean-950/50 p-4">
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
    </div>
  )
}
