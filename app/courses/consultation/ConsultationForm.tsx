'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import type { ConsultQuestion } from '@/lib/consultation'
import { submitConsultationAction } from '../actions'

// Form phiếu tham vấn (SCR-20): câu Có/Không và thang 0–10 bắt buộc; trả lời ngắn và ghi chú không bắt buộc
export default function ConsultationForm({
  questions,
  courses,
  courseId,
  origin,
}: {
  questions: ConsultQuestion[]
  courses: { id: string; title: string }[]
  courseId: string
  origin: string
}) {
  const [state, action] = useFormState(submitConsultationAction, { error: null })
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="origin" value={origin} />
      {state.error && (
        <p role="alert" className="alert-error">
          {state.error}
        </p>
      )}
      {!!courses.length && (
        <div>
          <label htmlFor="courseId" className="label">Chương trình đang tập (không bắt buộc)</label>
          <select id="courseId" name="courseId" defaultValue={courseId} className="input">
            <option value="">— Không chọn —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      <ol className="space-y-5">
        {questions.map((q, i) => (
          <li key={q.id}>
            {q.kind === 'text' ? (
              <>
                <label htmlFor={`q_${q.id}`} className="label">{i + 1}. {q.label}</label>
                <textarea id={`q_${q.id}`} name={`q_${q.id}`} rows={2} maxLength={500} className="input" />
              </>
            ) : (
              <fieldset>
                <legend className="label">{i + 1}. {q.label} *</legend>
                {q.kind === 'check' ? (
                  <div className="flex gap-6 pt-1 text-sm">
                    {[['yes', 'Có'], ['no', 'Không']].map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2">
                        <input type="radio" name={`q_${q.id}`} value={value} required className="h-5 w-5 accent-ocean-600" /> {label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Array.from({ length: 11 }, (_, n) => (
                      <label key={n} className="cursor-pointer">
                        <input type="radio" name={`q_${q.id}`} value={n} required className="peer sr-only" aria-label={`${q.label}: ${n}`} />
                        <span className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 transition peer-checked:border-ocean-600 peer-checked:bg-ocean-600 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-ocean-100">
                          {n}
                        </span>
                      </label>
                    ))}
                    <span className="basis-full text-xs text-slate-400">0 = không đau / không có · 10 = rất nặng</span>
                  </div>
                )}
              </fieldset>
            )}
          </li>
        ))}
      </ol>

      <div>
        <label htmlFor="note" className="label">Ghi chú thêm cho bác sĩ</label>
        <textarea id="note" name="note" rows={3} maxLength={1000} className="input" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton className="btn-primary">Gửi cho nhân viên</SubmitButton>
        <p className="text-sm text-slate-500">Nhân viên sẽ liên hệ qua điện thoại / Zalo trong giờ làm việc.</p>
      </div>
    </form>
  )
}
