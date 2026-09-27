'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import OneTimeSecret from '@/components/OneTimeSecret'
import { createPatientAction } from '../actions'
import GrantFields, { type PlanOption } from '../GrantFields'

// Form tạo tài khoản bệnh nhân (SCR-23). Thành công → hiện mật khẩu một lần + tin nhắn mẫu gửi Zalo.
export default function NewPatientForm({ plans }: { plans: PlanOption[] }) {
  const [round, setRound] = useState(0)
  return <PatientForm key={round} plans={plans} onAnother={() => setRound((r) => r + 1)} />
}

function PatientForm({ plans, onAnother }: { plans: PlanOption[]; onAnother: () => void }) {
  const [state, action] = useFormState(createPatientAction, null)

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <OneTimeSecret title={`${state.message} ${state.name} – ${state.phone}`} name={state.name} phone={state.phone} password={state.password} />
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/patients/${state.patientId}`} className="btn-primary">
            Xem hồ sơ bệnh nhân
          </Link>
          <button type="button" onClick={onAnother} className="btn-outline">
            Tạo bệnh nhân khác
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
        <div className="sm:col-span-2">
          <label htmlFor="email" className="label">Email <span className="font-normal text-slate-400">(không bắt buộc)</span></label>
          <input id="email" name="email" type="email" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="note" className="label">Ghi chú nội bộ <span className="font-normal text-slate-400">(bệnh nhân không thấy)</span></label>
          <textarea id="note" name="note" rows={2} maxLength={1000} placeholder="VD: khách Zalo, vẹo lưng nhẹ, ưu tiên gọi buổi tối" className="input" />
        </div>
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-ocean-900">Cấp gói ngay (không bắt buộc)</legend>
        <GrantFields plans={plans} />
      </fieldset>

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input id="consent" name="consent" type="checkbox" value="yes" required className="mt-0.5 h-5 w-5 accent-ocean-600" />
        <span>
          Bệnh nhân đã đồng ý{' '}
          <Link href="/chinh-sach-bao-mat" target="_blank" className="font-semibold text-ocean-700 underline">
            Chính sách bảo mật
          </Link>{' '}
          (đã gửi link qua Zalo) *
        </span>
      </label>

      <SubmitButton className="btn-primary w-full sm:w-auto">Tạo tài khoản</SubmitButton>
    </form>
  )
}
