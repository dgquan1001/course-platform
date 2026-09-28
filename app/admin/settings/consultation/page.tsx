import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireAdminPage } from '@/lib/auth'
import { QUESTION_KIND_LABELS, type ConsultQuestion, type QuestionKind } from '@/lib/consultation'
import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import { createConsultQuestion, deleteConsultQuestion, moveConsultQuestion, updateConsultQuestion } from '../../actions'

export const metadata: Metadata = { title: 'Mẫu phiếu tham vấn' }

const kinds = Object.entries(QUESTION_KIND_LABELS) as [QuestionKind, string][]

function KindSelect({ id, value }: { id: string; value?: string }) {
  return (
    <select id={id} name="kind" defaultValue={value ?? 'check'} className="input py-2 text-sm">
      {kinds.map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  )
}

// Mẫu phiếu tham vấn chung (SCR-28, chỉ admin): thêm / sửa / bật tắt / sắp xếp / xóa câu hỏi.
export default async function ConsultationSettingsPage() {
  await requireAdminPage()
  const { data, error } = await createClient()
    .from('consult_questions')
    .select('id, label, kind, sort_order, active')
    .order('sort_order')
    .order('created_at')
  if (error) throw new Error(error.message)
  const questions = (data ?? []) as ConsultQuestion[]

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="space-y-3">
        <div className="card p-4 text-sm text-slate-600">
          Bệnh nhân trả lời các câu hỏi <strong>đang dùng</strong> khi gửi phiếu. Câu Có/Không và thang 0–10 bắt buộc trả lời, câu trả lời ngắn không bắt buộc.
          Sửa hay xóa câu hỏi <strong>không ảnh hưởng phiếu đã gửi</strong> (phiếu lưu lại câu hỏi lúc gửi).
        </div>
        {questions.map((q, i) => (
          <div key={q.id} data-testid="consult-question" className={`card p-4 ${q.active ? '' : 'opacity-70'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-semibold text-ocean-900">
                {i + 1}. {q.label}{' '}
                <span className="badge bg-slate-100 text-slate-600">{QUESTION_KIND_LABELS[q.kind]}</span>{' '}
                {!q.active && <span className="badge bg-slate-200 text-slate-600">Đang tắt</span>}
              </p>
              <div className="flex gap-1">
                <ActionForm action={moveConsultQuestion.bind(null, q.id, 'up')}>
                  <SubmitButton className="btn-outline btn-sm px-3" title="Lên trên">↑</SubmitButton>
                </ActionForm>
                <ActionForm action={moveConsultQuestion.bind(null, q.id, 'down')}>
                  <SubmitButton className="btn-outline btn-sm px-3" title="Xuống dưới">↓</SubmitButton>
                </ActionForm>
              </div>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-semibold text-ocean-700 hover:underline">Sửa câu hỏi</summary>
              <ActionForm key={`${q.label}|${q.kind}|${q.active}`} action={updateConsultQuestion.bind(null, q.id)} className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
                <div className="sm:col-span-2">
                  <label htmlFor={`label-${q.id}`} className="label">Câu hỏi</label>
                  <input id={`label-${q.id}`} name="label" required maxLength={300} defaultValue={q.label} className="input" />
                </div>
                <div>
                  <label htmlFor={`kind-${q.id}`} className="label">Loại</label>
                  <KindSelect id={`kind-${q.id}`} value={q.kind} />
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={q.active} className="h-4 w-4 accent-ocean-600" /> Đang dùng
                </label>
                <SubmitButton className="btn-primary btn-sm w-fit">Lưu câu hỏi</SubmitButton>
              </ActionForm>
              <ActionForm action={deleteConsultQuestion.bind(null, q.id)} className="mt-3 border-t border-dashed border-slate-200 pt-3">
                <SubmitButton
                  className="btn-sm btn border border-red-200 text-red-600 hover:bg-red-50"
                  confirmMessage={`Xóa câu hỏi "${q.label}"? Phiếu đã gửi vẫn giữ câu trả lời.`}
                >
                  Xóa câu hỏi
                </SubmitButton>
              </ActionForm>
            </details>
          </div>
        ))}
        {!questions.length && <p className="card p-10 text-center text-slate-500">Chưa có câu hỏi nào. Thêm câu hỏi ở khung bên cạnh.</p>}
      </section>

      <section className="card h-fit p-5 xl:sticky xl:top-20">
        <h2 className="mb-4 text-lg font-bold">Thêm câu hỏi</h2>
        <ActionForm action={createConsultQuestion} resetOnSuccess className="space-y-3">
          <div>
            <label htmlFor="new-label" className="label">Câu hỏi *</label>
            <input id="new-label" name="label" required maxLength={300} className="input" />
          </div>
          <div>
            <label htmlFor="new-kind" className="label">Loại</label>
            <KindSelect id="new-kind" />
          </div>
          <SubmitButton className="btn-primary w-full">Thêm câu hỏi</SubmitButton>
        </ActionForm>
      </section>
    </div>
  )
}
