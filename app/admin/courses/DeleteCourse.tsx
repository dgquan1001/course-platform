'use client'

import { useState } from 'react'
import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import { AlertIcon, TrashIcon } from '@/components/icons'
import { deleteCourse } from '../actions'

// Vùng "Xóa khóa học" ở trang sửa khóa (QL-08): còn học viên đang học / đơn chờ duyệt thì không cho xóa, gợi ý Ẩn (Q-7);
// được xóa thì phải gõ đúng tên khóa (server kiểm tra lại cả hai điều kiện).
export default function DeleteCourse({
  courseId,
  title,
  usage,
  blockedMessage,
}: {
  courseId: string
  title: string
  usage: { active: number; pending: number }
  blockedMessage: string | null
}) {
  const [typed, setTyped] = useState('')
  return (
    <section id="xoa-khoa-hoc" aria-label="Xóa khóa học" className="card scroll-mt-24 border-red-200 p-5">
      <h3 className="flex items-center gap-2 font-bold text-red-700">
        <AlertIcon className="h-5 w-5" /> Xóa khóa học
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Xóa vĩnh viễn khóa, toàn bộ buổi – bài, gói và ảnh bìa. Đơn đăng ký và lịch sử thanh toán vẫn được giữ lại (ghi tên khóa đã xóa).
      </p>
      {blockedMessage ? (
        <p role="note" className="alert-warning mt-3">
          {blockedMessage}
        </p>
      ) : (
        <ActionForm action={deleteCourse.bind(null, courseId)} className="mt-3 space-y-3">
          <div>
            <label htmlFor="confirm_title" className="label">
              Gõ lại tên khóa để xác nhận: <span className="font-semibold text-ocean-900">{title}</span>
            </label>
            <input
              id="confirm_title"
              name="confirm_title"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="input"
            />
          </div>
          <SubmitButton
            disabled={typed.trim() !== title.trim()}
            className="btn w-full border border-red-200 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-100"
          >
            <TrashIcon className="h-4 w-4" /> Xóa vĩnh viễn khóa học
          </SubmitButton>
          {usage.active + usage.pending === 0 && (
            <p className="text-xs text-slate-500">Khóa không còn học viên đang học hay đơn chờ duyệt.</p>
          )}
        </ActionForm>
      )}
    </section>
  )
}
