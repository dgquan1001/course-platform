'use client'

import { useFormStatus } from 'react-dom'
import { SpinnerIcon } from './icons'

// Nút submit hiển thị trạng thái đang xử lý, tùy chọn hỏi xác nhận trước khi gửi
export default function SubmitButton({
  children,
  className = 'btn-primary',
  confirmMessage,
  title,
}: {
  children: React.ReactNode
  className?: string
  confirmMessage?: string
  title?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={className}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault()
      }}
    >
      {pending && <SpinnerIcon className="h-4 w-4" />}
      {children}
    </button>
  )
}
