'use client'

import { useState } from 'react'
import { PAYMENT_METHODS } from '@/lib/format'

export type PlanOption = { id: string; courseTitle: string; months: number; sessions: number; price: number }

// Ô cấp gói dùng chung (tạo bệnh nhân / cấp thêm gói): chọn gói → số tiền điền sẵn theo giá gói (sửa được, VD giảm giá),
// hình thức thanh toán, ảnh chuyển khoản (tùy chọn), ghi chú thanh toán.
export default function GrantFields({ plans, required = false }: { plans: PlanOption[]; required?: boolean }) {
  const [amount, setAmount] = useState('')
  const [planId, setPlanId] = useState('')
  const hasPlan = required || !!planId

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="planId" className="label">
          Chương trình & gói {required ? '*' : '(bỏ trống nếu chưa cấp gói)'}
        </label>
        <select
          id="planId"
          name="planId"
          required={required}
          value={planId}
          onChange={(e) => {
            setPlanId(e.target.value)
            const plan = plans.find((p) => p.id === e.target.value)
            setAmount(plan ? String(plan.price) : '')
          }}
          className="input"
        >
          <option value="">{required ? '— Chọn gói —' : '— Chưa cấp gói —'}</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.courseTitle} – {p.months} tháng ({p.sessions} buổi) – {p.price.toLocaleString('vi-VN')}đ
            </option>
          ))}
        </select>
        {!plans.length && <p className="mt-1 text-xs text-red-600">Chưa có chương trình nào đang bán gói.</p>}
      </div>
      {hasPlan && (
        <>
          <div>
            <label htmlFor="amount" className="label">Số tiền đã nhận (VNĐ) *</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min={0}
              step={1000}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
            />
          </div>
          <fieldset>
            <legend className="label">Hình thức thanh toán *</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-sm">
              {PAYMENT_METHODS.map((m, i) => (
                <label key={m.value} className="flex items-center gap-2">
                  <input type="radio" name="paymentMethod" value={m.value} defaultChecked={i === 0} className="h-4 w-4 accent-ocean-600" />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="proof" className="label">Ảnh chuyển khoản (không bắt buộc)</label>
            <input id="proof" name="proof" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" className="input py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="paymentNote" className="label">Ghi chú thanh toán</label>
            <input id="paymentNote" name="paymentNote" maxLength={500} placeholder="VD: CK Vietcombank 10/10, giảm 10%" className="input" />
          </div>
        </>
      )}
    </div>
  )
}
