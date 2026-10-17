'use client'

import { useState } from 'react'
import OneTimeSecret from '@/components/OneTimeSecret'
import { SpinnerIcon } from '@/components/icons'
import { toast } from '@/components/Toaster'
import { resetPatientPasswordAction, type SecretResult } from '../actions'

// Cấp lại mật khẩu (SCR-24): hỏi xác nhận, hiện mật khẩu mới một lần kèm tin nhắn gửi Zalo
export default function ResetPassword({ userId, name }: { userId: string; name: string }) {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<SecretResult>(null)

  async function reset() {
    if (!window.confirm(`Cấp mật khẩu mới cho ${name}? Mật khẩu hiện tại sẽ không dùng được nữa.`)) return
    setPending(true)
    try {
      const r = await resetPatientPasswordAction(userId)
      setResult(r)
      if (r?.ok) toast(r.message)
      else if (r) toast(r.error, 'error')
    } catch {
      toast('Không kết nối được máy chủ, vui lòng thử lại.', 'error')
    }
    setPending(false)
  }

  if (result?.ok) {
    return <OneTimeSecret title="Mật khẩu mới đã được cấp" name={result.name} phone={result.phone} password={result.password} />
  }
  return (
    <button type="button" onClick={reset} disabled={pending} className="btn-outline w-full">
      {pending && <SpinnerIcon className="h-4 w-4" />} Cấp lại mật khẩu
    </button>
  )
}
