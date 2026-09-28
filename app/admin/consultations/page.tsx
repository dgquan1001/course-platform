import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaffPage } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import { answerText, CONSULT_STATUSES, originLabel, type ConsultAnswer } from '@/lib/consultation'
import StatusBadge from '@/components/StatusBadge'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import { setConsultationStatus } from '../actions'

export const metadata: Metadata = { title: 'Phiếu tham vấn' }

type Consultation = {
  id: string
  user_id: string | null
  full_name: string | null
  phone: string | null
  course_title: string | null
  answers: ConsultAnswer[]
  note: string | null
  origin: string
  status: string
  staff_note: string | null
  handled_by_name: string | null
  handled_at: string | null
  created_at: string
}

// Phiếu tham vấn bệnh nhân gửi (SCR-25): nhân viên xem câu trả lời, gọi / nhắn Zalo hẹn bác sĩ, cập nhật trạng thái
export default async function AdminConsultationsPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireStaffPage()
  const status = CONSULT_STATUSES.some((s) => s.value === searchParams.status) ? searchParams.status! : 'new'
  const supabase = createClient()
  const countOf = (s: string) => supabase.from('consultations').select('id', { count: 'exact', head: true }).eq('status', s)

  const [{ data, error }, ...counts] = await Promise.all([
    supabase
      .from('consultations')
      .select('id, user_id, full_name, phone, course_title, answers, note, origin, status, staff_note, handled_by_name, handled_at, created_at')
      .eq('status', status)
      // Phiếu mới: cũ nhất trước (xử lý theo thứ tự gửi)
      .order('created_at', { ascending: status === 'new' })
      .limit(200),
    ...CONSULT_STATUSES.map((s) => countOf(s.value)),
  ])
  if (error) throw new Error(error.message)
  const items = (data ?? []) as Consultation[]

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CONSULT_STATUSES.map((s, i) => (
          <Link
            key={s.value}
            href={s.value === 'new' ? '/admin/consultations' : `/admin/consultations?status=${s.value}`}
            aria-current={status === s.value ? 'page' : undefined}
            className={`btn-sm btn whitespace-nowrap border ${
              status === s.value ? 'border-ocean-500 bg-ocean-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-ocean-300'
            }`}
          >
            {s.label} <span className="opacity-80">({counts[i].count ?? 0})</span>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((c) => {
          // Tóm tắt: câu thang điểm đầu tiên (thường là mức đau)
          const scale = c.answers.find((a) => a.kind === 'scale')
          return (
            <div key={c.id} id={`phieu-${c.id}`} className="card grid scroll-mt-24 gap-4 p-4 sm:p-5 xl:grid-cols-[1fr_360px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {c.user_id ? (
                    <Link href={`/admin/patients/${c.user_id}`} className="font-semibold text-ocean-900 hover:underline">
                      {c.full_name ?? 'Bệnh nhân'}
                    </Link>
                  ) : (
                    <p className="font-semibold text-ocean-900">{c.full_name ?? 'Bệnh nhân'} <span className="text-xs font-normal italic text-slate-400">(tài khoản đã xóa)</span></p>
                  )}
                  <StatusBadge status={`consult_${c.status}`} />
                  {scale && <span className="badge bg-red-50 text-red-700">{scale.label}: {answerText(scale)}</span>}
                </div>
                {c.phone && (
                  <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
                    <a href={`tel:${c.phone}`} className="font-semibold text-ocean-700 hover:underline">{c.phone}</a>
                    <a href={`https://zalo.me/${c.phone}`} target="_blank" rel="noopener noreferrer" className="text-ocean-700 hover:underline">Nhắn Zalo</a>
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-600">
                  Chương trình: <span className="font-medium">{c.course_title ?? 'Không chọn'}</span> · {originLabel(c.origin)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Gửi lúc {formatDateTime(c.created_at)}
                  {c.handled_at && ` · Cập nhật bởi ${c.handled_by_name ?? 'Hệ thống'} lúc ${formatDateTime(c.handled_at)}`}
                </p>
                <details className="mt-2 text-sm" open={status === 'new'}>
                  <summary className="cursor-pointer font-semibold text-ocean-700 hover:underline">Câu trả lời ({c.answers.length})</summary>
                  <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto]">
                    {c.answers.map((a, i) => (
                      <div key={i} className="contents">
                        <dt className="text-slate-600">{a.label}</dt>
                        <dd className="font-semibold text-ocean-900">{answerText(a)}</dd>
                      </div>
                    ))}
                  </dl>
                  {c.note && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-slate-700">Ghi chú: {c.note}</p>}
                </details>
              </div>
              <ActionForm key={`${c.status}|${c.staff_note}`} action={setConsultationStatus.bind(null, c.id, c.status)} className="space-y-2">
                <label htmlFor={`consult-status-${c.id}`} className="sr-only">Trạng thái</label>
                <select id={`consult-status-${c.id}`} name="status" defaultValue={c.status} className="input py-2 text-sm">
                  {CONSULT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <label htmlFor={`consult-note-${c.id}`} className="sr-only">Ghi chú nội bộ</label>
                <textarea
                  id={`consult-note-${c.id}`}
                  name="staff_note"
                  rows={3}
                  maxLength={1000}
                  defaultValue={c.staff_note ?? ''}
                  placeholder="Ghi chú nội bộ (bệnh nhân không thấy), VD: hẹn bác sĩ gọi 19h thứ 5"
                  className="input text-sm"
                />
                <SubmitButton className="btn-primary btn-sm w-full">Cập nhật</SubmitButton>
              </ActionForm>
            </div>
          )
        })}
        {!items.length && <p className="card p-10 text-center text-slate-500">Không có phiếu nào.</p>}
      </div>
    </div>
  )
}
