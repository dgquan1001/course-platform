'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/site-config'
import { planLabel, type Plan } from '@/lib/courses'
import { ArrowRightIcon } from '@/components/icons'

// Khung giá của chương trình: chọn gói 1 / 3 / 6 / 12 tháng rồi tới box đăng ký đã chọn sẵn chương trình + gói
export default function PlanPicker({ courseId, plans }: { courseId: string; plans: Plan[] }) {
  const [planId, setPlanId] = useState(plans[0].id)
  const plan = plans.find((p) => p.id === planId) ?? plans[0]
  // Giá mỗi tháng của gói 1 tháng để tính mức tiết kiệm của gói dài
  const monthly = plans.find((p) => p.months === 1)?.price

  return (
    <div className="space-y-3">
      <p className="text-3xl font-bold text-ocean-800">{formatPrice(plan.price)}</p>
      <fieldset>
        <legend className="sr-only">Chọn gói</legend>
        <div className="space-y-2">
          {plans.map((p) => {
            const saving = monthly && p.months > 1 ? monthly * p.months - p.price : 0
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 text-sm transition ${
                  p.id === planId ? 'border-ocean-500 bg-ocean-50' : 'border-slate-200 hover:border-ocean-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={p.id === planId}
                    onChange={() => setPlanId(p.id)}
                    className="accent-ocean-600"
                  />
                  <span>
                    <span className="block font-semibold text-ocean-900">Gói {planLabel(p.months)}</span>
                    <span className="block text-xs text-slate-500">
                      {p.sessions} buổi tập{saving > 0 && ` · tiết kiệm ${formatPrice(saving)}`}
                    </span>
                  </span>
                </span>
                <span className="font-bold text-ocean-700">{formatPrice(p.price)}</span>
              </label>
            )
          })}
        </div>
      </fieldset>
      <Link href={`/?course=${courseId}&plan=${plan.id}#dang-ky`} className="btn-gold w-full py-3 text-base">
        Đăng ký gói {planLabel(plan.months)} <ArrowRightIcon className="h-5 w-5" />
      </Link>
    </div>
  )
}
