'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizePhone } from '@/lib/phone'
import { siteConfig } from '@/lib/site-config'
import { SpinnerIcon } from '@/components/icons'
import { toast } from '@/components/Toaster'
import { createLeadAction } from './actions'

// Nút liên hệ Zalo của khóa premium: khách để lại họ tên + SĐT (nhân viên gọi lại) rồi mở Zalo,
// hoặc mở Zalo ngay (chỉ ghi lượt bấm). Zalo được mở ngay trong lúc bấm để trình duyệt không chặn.
export default function LeadDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  // Đã đăng nhập: điền sẵn họ tên, SĐT
  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', session.user.id).single()
      setFullName((v) => v || profile?.full_name || '')
      setPhone((v) => v || profile?.phone || '')
    })
  }, [open])

  const openZalo = () => window.open(siteConfig.zaloUrl, '_blank', 'noopener,noreferrer')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return setError('Vui lòng nhập họ và tên.')
    if (!normalizePhone(phone)) return setError('Số điện thoại không hợp lệ (VD: 0912345678).')
    setError(null)
    openZalo()
    setPending(true)
    const form = new FormData()
    form.set('fullName', fullName)
    form.set('phone', phone)
    try {
      const result = await createLeadAction(courseId, form)
      if (result.ok) {
        setSent(true)
        toast(result.message)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Không kết nối được máy chủ, vui lòng thử lại.')
    }
    setPending(false)
  }

  // Lượt bấm ẩn danh: không chờ kết quả
  function openNow() {
    createLeadAction(courseId, new FormData()).catch(() => {})
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-gold w-full py-3 text-base">
        Liên hệ Zalo nhận ưu đãi
      </button>
    )
  }

  if (sent) {
    return (
      <div role="status" className="alert-success">
        Đã gửi thông tin. Nhân viên sẽ liên hệ bạn sớm. Nếu Zalo chưa mở,{' '}
        <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
          bấm vào đây
        </a>
        .
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Liên hệ Zalo nhận ưu đãi" className="space-y-3 text-left">
      <p className="text-sm text-slate-600">Để lại thông tin để nhân viên tư vấn và giữ ưu đãi cho bạn.</p>
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="lead-name" className="label">Họ và tên *</label>
        <input id="lead-name" className="input" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="lead-phone" className="label">Số điện thoại (Zalo) *</label>
        <input
          id="lead-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0912 345 678"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <button type="submit" disabled={pending} className="btn-gold w-full py-3">
        {pending && <SpinnerIcon className="h-4 w-4" />} Gửi & mở Zalo
      </button>
      <p className="text-center text-sm">
        <a
          href={siteConfig.zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={openNow}
          className="font-semibold text-ocean-700 hover:underline"
        >
          Mở Zalo ngay
        </a>
      </p>
    </form>
  )
}
