'use client'

import { useFormStatus } from 'react-dom'
import { SpinnerIcon } from './icons'

// Nút submit hiển thị trạng thái đang xử lý, tùy chọn hỏi xác nhận trước khi gửi
export default function SubmitButton({
  children,
  className = 'btn-primary',
  confirmMessage,
  title,
  disabled = false,
}: {
  children: React.ReactNode
  className?: string
  confirmMessage?: string
  title?: string
  // Chưa đủ điều kiện gửi (VD chưa gõ đúng tên khóa để xác nhận xóa)
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
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
