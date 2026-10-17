'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import SubmitButton from '@/components/SubmitButton'
import OneTimeSecret from '@/components/OneTimeSecret'
import { createStaffAction } from '../actions'

// Form thêm nhân viên (Đợt 26). Thành công → hiện mật khẩu một lần + tin nhắn mẫu gửi nhân viên.
export default function NewStaffForm() {
  const [round, setRound] = useState(0)
  return <StaffForm key={round} onAnother={() => setRound((r) => r + 1)} />
}

function StaffForm({ onAnother }: { onAnother: () => void }) {
  const [state, action] = useActionState(createStaffAction, null)

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <OneTimeSecret audience="staff" title={`${state.message} ${state.name} – ${state.phone}`} name={state.name} phone={state.phone} password={state.password} />
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/staff/${state.staffId}`} className="btn-primary">
            Xem hồ sơ nhân viên
          </Link>
          <button type="button" onClick={onAnother} className="btn-outline">
            Thêm nhân viên khác
          </button>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      {state && !state.ok && (
        <p role="alert" className="alert-error">
          {state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="label">Họ và tên *</label>
          <input id="fullName" name="fullName" required maxLength={100} className="input" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Số điện thoại * <span className="font-normal text-slate-400">(dùng để đăng nhập)</span></label>
          <input id="phone" name="phone" type="tel" required className="input" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email <span className="font-normal text-slate-400">(không bắt buộc)</span></label>
          <input id="email" name="email" type="email" className="input" />
        </div>
        <div>
          <label htmlFor="role" className="label">Vai trò *</label>
          <select id="role" name="role" defaultValue="staff" className="input">
            <option value="staff">Nhân viên – duyệt đơn, quản lý khách hàng</option>
            <option value="admin">Admin – toàn quyền (khóa học, phân quyền)</option>
          </select>
        </div>
      </div>
      <SubmitButton className="btn-primary w-full sm:w-auto">Tạo tài khoản</SubmitButton>
    </form>
  )
}
