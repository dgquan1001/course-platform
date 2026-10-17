'use client'

import { useState } from 'react'
import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import { AlertIcon, TrashIcon } from '@/components/icons'
import type { ActionResult } from '@/lib/action-result'

// Vùng "Xóa tài khoản" (Đợt 26) ở hồ sơ khách hàng / nhân viên: bị chặn thì hiện lý do; được xóa thì phải gõ lại
// thông tin xác nhận (SĐT, không có thì email / họ tên) – server kiểm tra lại cả điều kiện lẫn chuỗi xác nhận.
export default function DeleteAccount({
  id,
  title,
  description,
  confirmLabel,
  confirmValue,
  blockedMessage,
  action,
}: {
  id: string
  title: string
  description: React.ReactNode
  confirmLabel: string
  confirmValue: string
  blockedMessage: string | null
  action: (formData: FormData) => Promise<ActionResult>
}) {
  const [typed, setTyped] = useState('')
  const normalize = (v: string) => v.replace(/[\s.\-()]/g, '').toLowerCase()
  const matches = !!confirmValue && normalize(typed) === normalize(confirmValue)
  return (
    <section id={id} aria-label={title} className="card scroll-mt-24 border-red-200 p-5">
      <h3 className="flex items-center gap-2 font-bold text-red-700">
        <AlertIcon className="h-5 w-5" /> {title}
      </h3>
      <div className="mt-1 text-sm text-slate-600">{description}</div>
      {blockedMessage ? (
        <p role="note" className="alert-warning mt-3">
          {blockedMessage}
        </p>
      ) : (
        <ActionForm action={action} className="mt-3 space-y-3">
          <div>
            <label htmlFor={`${id}-confirm`} className="label">
              {confirmLabel}: <span className="font-semibold text-ocean-900">{confirmValue}</span>
            </label>
            <input
              id={`${id}-confirm`}
              name="confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="input"
            />
          </div>
          <SubmitButton
            disabled={!matches}
            className="btn w-full border border-red-200 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-100"
          >
            <TrashIcon className="h-4 w-4" /> {title}
          </SubmitButton>
        </ActionForm>
      )}
    </section>
  )
}
