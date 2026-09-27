'use client'

import { useState } from 'react'
import { siteConfig } from '@/lib/site-config'
import { CheckIcon, CopyIcon } from './icons'
import { toast } from './Toaster'

// Mật khẩu do hệ thống sinh, hiện MỘT lần cho nhân viên (SCR-23): chép tin nhắn mẫu gửi bệnh nhân qua Zalo.
// Tải lại trang là mất – hệ thống không lưu mật khẩu rõ ở đâu (BR-95).
export default function OneTimeSecret({ name, phone, password, title }: { name: string; phone: string; password: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const loginUrl = `${siteConfig.url}/login`
  const message =
    `Chào ${name || 'anh/chị'}, tài khoản tập luyện tại ${siteConfig.name}:\n` +
    `- Đăng nhập: ${loginUrl}\n` +
    `- Số điện thoại: ${phone}\n` +
    `- Mật khẩu: ${password}\n` +
    `Anh/chị nên đổi mật khẩu sau khi đăng nhập (mục Tài khoản của tôi). Cần hỗ trợ gọi ${siteConfig.hotline}.`

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast('Đã chép tin nhắn, dán vào Zalo để gửi bệnh nhân.')
    } catch {
      toast('Không chép được, hãy bôi đen và chép tay tin nhắn bên dưới.', 'error')
    }
  }

  return (
    <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="font-bold text-emerald-800">{title}</p>
      <p className="mt-2 text-sm text-emerald-900">
        Mật khẩu (chỉ hiện một lần):{' '}
        <strong data-testid="one-time-password" className="rounded bg-white px-2 py-0.5 font-mono text-lg tracking-wider text-ocean-900">
          {password}
        </strong>
      </p>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 font-sans text-sm text-slate-700 ring-1 ring-emerald-100">{message}</pre>
      <button type="button" onClick={copy} className="btn-primary btn-sm mt-3">
        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />} Chép tin nhắn gửi Zalo
      </button>
    </div>
  )
}
