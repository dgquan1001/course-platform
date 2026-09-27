import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaffPage } from '@/lib/auth'
import StatusBadge from '@/components/StatusBadge'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import { setLeadStatus } from '../actions'

const tabs = [
  { key: 'new', label: 'Mới' },
  { key: 'contacted', label: 'Đã liên hệ' },
  { key: 'converted', label: 'Đã chốt' },
  { key: 'closed', label: 'Đóng' },
] as const

type Lead = {
  id: string
  course_title: string | null
  user_id: string | null
  full_name: string | null
  phone: string | null
  status: string
  staff_note: string | null
  handled_by_name: string | null
  handled_at: string | null
  created_at: string
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// Khách bấm "Liên hệ Zalo nhận ưu đãi" ở khóa premium và để lại SĐT: nhân viên gọi / nhắn Zalo rồi cập nhật trạng thái.
// Lượt bấm "Mở Zalo ngay" (ẩn danh, không có SĐT) chỉ được đếm.
export default async function AdminLeadsPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireStaffPage()
  const status = tabs.some((t) => t.key === searchParams.status) ? searchParams.status! : 'new'
  const supabase = createClient()
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  const countOf = (s: string) =>
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', s).not('phone', 'is', null)

  const [{ data, error }, anonymous, ...counts] = await Promise.all([
    supabase
      .from('leads')
      .select('id, course_title, user_id, full_name, phone, status, staff_note, handled_by_name, handled_at, created_at')
      .eq('status', status)
      .not('phone', 'is', null)
      .order('created_at', { ascending: status === 'new' })
      .limit(200),
    supabase.from('leads').select('id', { count: 'exact', head: true }).is('phone', null).gte('created_at', since),
    ...tabs.map((t) => countOf(t.key)),
  ])
  if (error) throw new Error(error.message)
  const leads = (data ?? []) as Lead[]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t, i) => (
            <Link
              key={t.key}
              href={t.key === 'new' ? '/admin/leads' : `/admin/leads?status=${t.key}`}
              aria-current={status === t.key ? 'page' : undefined}
              className={`btn-sm btn whitespace-nowrap border ${
                status === t.key ? 'border-ocean-500 bg-ocean-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-ocean-300'
              }`}
            >
              {t.label} <span className="opacity-80">({counts[i].count ?? 0})</span>
            </Link>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Lượt bấm &quot;Mở Zalo ngay&quot; (không để lại SĐT) 30 ngày qua: <strong>{anonymous.count ?? 0}</strong>
        </p>
      </div>

      <div className="space-y-3">
        {leads.map((l) => (
          <div key={l.id} className="card grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ocean-900">{l.full_name}</p>
                <StatusBadge status={`lead_${l.status}`} />
                {l.user_id && <span className="text-xs text-slate-400">(đã có tài khoản)</span>}
              </div>
              <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
                <a href={`tel:${l.phone}`} className="font-semibold text-ocean-700 hover:underline">
                  {l.phone}
                </a>
                <a href={`https://zalo.me/${l.phone}`} target="_blank" rel="noopener noreferrer" className="text-ocean-700 hover:underline">
                  Nhắn Zalo
                </a>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Khóa: <span className="font-medium">{l.course_title ?? 'Khóa premium'}</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Gửi lúc {formatDateTime(l.created_at)}
                {l.handled_at && ` · Cập nhật bởi ${l.handled_by_name ?? 'Hệ thống'} lúc ${formatDateTime(l.handled_at)}`}
              </p>
              {l.staff_note && <p className="mt-2 text-sm italic text-slate-600">Ghi chú: {l.staff_note}</p>}
            </div>
            <ActionForm key={`${l.status}|${l.staff_note}`} action={setLeadStatus.bind(null, l.id, l.status)} className="space-y-2">
              <label htmlFor={`lead-status-${l.id}`} className="sr-only">
                Trạng thái
              </label>
              <select id={`lead-status-${l.id}`} name="status" defaultValue={l.status} className="input py-2 text-sm">
                {tabs.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <label htmlFor={`lead-note-${l.id}`} className="sr-only">
                Ghi chú nội bộ
              </label>
              <textarea
                id={`lead-note-${l.id}`}
                name="staff_note"
                rows={2}
                maxLength={500}
                defaultValue={l.staff_note ?? ''}
                placeholder="Ghi chú nội bộ (khách không thấy)"
                className="input text-sm"
              />
              <SubmitButton className="btn-primary btn-sm w-full">Cập nhật</SubmitButton>
            </ActionForm>
          </div>
        ))}
        {!leads.length && <p className="card p-10 text-center text-slate-500">Không có yêu cầu nào.</p>}
      </div>
    </div>
  )
}
