'use client'

import { useRef } from 'react'
import type { ActionResult } from '@/lib/action-result'
import { toast } from './Toaster'

// Form gọi server action rồi hiện thông báo thành công/thất bại
export default function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
}) {
  const ref = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={ref}
      className={className}
      action={async (formData) => {
        try {
          const result = await action(formData)
          if (result.ok) {
            toast(result.message)
            if (resetOnSuccess) ref.current?.reset()
          } else {
            toast(result.error, 'error')
          }
        } catch {
          toast('Không kết nối được máy chủ, vui lòng thử lại.', 'error')
        }
      }}
    >
      {children}
    </form>
  )
}
