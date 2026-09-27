import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/site-config'
import StatusBadge from '@/components/StatusBadge'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import { setRegistrationStatus } from '../actions'

const filters = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
  { key: 'all', label: 'Tất cả' },
  // Đơn chờ duyệt của khóa đã bị xóa: khách đã chuyển khoản, cần liên hệ hoàn tiền rồi Từ chối (ghi lý do)
  { key: 'refund', label: 'Khóa đã xóa – cần hoàn tiền' },
] as const

type Status = 'pending' | 'approved' | 'rejected'

// Cột của bảng, tương ứng các trường trong bảng registrations
const columns = [
  { label: 'STT', className: 'w-12 text-center' },
  { label: 'Ảnh chuyển khoản', className: 'w-20' },
  { label: 'Họ và tên' },
  { label: 'Email' },
  { label: 'Số điện thoại', className: 'w-28' },
  { label: 'Khóa học' },
  { label: 'Học phí', className: 'text-right' },
  { label: 'Ngày đăng ký', className: 'w-28' },
  { label: 'Trạng thái' },
  { label: 'Ngày xử lý', className: 'w-28' },
  // Nhân viên / admin đã duyệt / từ chối / thu hồi đơn (nhiều người cùng xử lý nên cần biết ai xử lý)
  { label: 'Người xử lý' },
  // Cột thao tác cố định bên phải: luôn thấy nút kể cả khi bảng phải cuộn ngang
  { label: 'Thao tác', className: 'sticky right-0 bg-ocean-50 text-center shadow-[-6px_0_8px_-6px_rgba(23,42,61,0.15)]' },
]

// Ngày và giờ hiển thị 2 dòng cho gọn cột
function DateTime({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-300">—</span>
  const date = new Date(value)
  const opts = { timeZone: 'Asia/Ho_Chi_Minh' } as const
  return (
    <>
      <span className="block">{date.toLocaleDateString('vi-VN', { ...opts, day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
      <span className="block text-xs text-slate-400">{date.toLocaleTimeString('vi-VN', { ...opts, hour: '2-digit', minute: '2-digit' })}</span>
    </>
  )
}

type RegistrationEvent = {
  registration_id: string
  actor_name: string | null
  from_status: string
  to_status: string
  note: string | null
  created_at: string
}

const statusLabels: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// Lịch sử xử lý đơn (mới nhất ở cuối), thu gọn mặc định
function History({ events }: { events: RegistrationEvent[] }) {
  if (!events.length) return null
  return (
    <details className="mt-1.5 text-xs">
      <summary className="cursor-pointer text-ocean-700 hover:underline">Lịch sử ({events.length})</summary>
      <ol className="mt-1.5 min-w-[220px] space-y-1.5 border-l-2 border-slate-200 pl-2 text-slate-600">
        {events.map((e, i) => (
          <li key={i}>
            <span className="block text-slate-400">{formatDateTime(e.created_at)}</span>
            <span className="font-semibold text-slate-700">{e.actor_name ?? 'Hệ thống'}</span>: {statusLabels[e.from_status]} →{' '}
            {statusLabels[e.to_status]}
            {e.note && <span className="block italic">Lý do: {e.note}</span>}
          </li>
        ))}
      </ol>
    </details>
  )
}

// Nút Từ chối / Thu hồi mở ô nhập lý do (học viên thấy lý do), bấm xác nhận mới gửi
function RejectForm({ id, status, label }: { id: string; status: Status; label: string }) {
  return (
    <details>
      <summary className="btn btn-sm cursor-pointer list-none border border-red-200 bg-white text-red-600 hover:bg-red-50 [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <ActionForm action={setRegistrationStatus.bind(null, id, 'rejected', status)} className="mt-2 w-56 space-y-2 text-left">
        <label htmlFor={`note-${id}`} className="block text-xs font-semibold text-slate-600">
          Lý do (học viên sẽ thấy, không bắt buộc)
        </label>
        <textarea id={`note-${id}`} name="note" rows={2} maxLength={500} className="input text-sm" />
        <SubmitButton className="btn btn-sm w-full bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-100">
          Xác nhận {label.toLowerCase()}
        </SubmitButton>
      </ActionForm>
    </details>
  )
}

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const filter = filters.some((f) => f.key === searchParams.status) ? searchParams.status! : 'pending'
  const supabase = createClient()

  let query = supabase
    .from('registrations')
    .select(
      'id, user_id, full_name, email, phone, status, payment_proof_path, created_at, reviewed_at, reviewed_by_name, review_note, course_title, amount, courses(title, price, status)'
    )
    .order('created_at', { ascending: filter === 'pending' })
    .limit(200)
  if (filter === 'refund') query = query.eq('status', 'pending').is('course_id', null)
  else if (filter !== 'all') query = query.eq('status', filter)

  const countOf = (status: Status) =>
    supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', status)

  const [{ data: registrations, error }, pending, approved, rejected, refund] = await Promise.all([
    query,
    countOf('pending'),
    countOf('approved'),
    countOf('rejected'),
    countOf('pending').is('course_id', null),
  ])
  if (error) throw new Error(error.message)

  const counts: Record<string, number> = {
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    refund: refund.count ?? 0,
  }
  counts.all = counts.pending + counts.approved + counts.rejected

  // Ảnh chuyển khoản nằm trong bucket riêng tư: tạo link xem tạm thời 1 giờ.
  // Lịch sử xử lý của các đơn đang hiển thị (ai đổi trạng thái, lúc nào, lý do).
  const proofUrls = new Map<string, string>()
  const eventsByRegistration = new Map<string, RegistrationEvent[]>()
  if (registrations?.length) {
    const [{ data: signed }, { data: events }] = await Promise.all([
      supabase.storage.from('payment-proofs').createSignedUrls(registrations.map((r) => r.payment_proof_path), 3600),
      supabase
        .from('registration_events')
        .select('registration_id, actor_name, from_status, to_status, note, created_at')
        .in('registration_id', registrations.map((r) => r.id))
        .order('created_at', { ascending: true }),
    ])
    signed?.forEach((s) => s.path && s.signedUrl && proofUrls.set(s.path, s.signedUrl))
    for (const e of events ?? []) {
      eventsByRegistration.set(e.registration_id, [...(eventsByRegistration.get(e.registration_id) ?? []), e])
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* Tab "cần hoàn tiền" chỉ hiện khi có đơn, tô đỏ để admin chú ý */}
        {filters.filter((f) => f.key !== 'refund' || counts.refund > 0 || filter === 'refund').map((f) => (
          <Link
            key={f.key}
            href={f.key === 'pending' ? '/admin/registrations' : `/admin/registrations?status=${f.key}`}
            aria-current={filter === f.key ? 'page' : undefined}
            className={`btn-sm btn whitespace-nowrap border ${
              filter === f.key
                ? 'border-ocean-500 bg-ocean-500 text-white'
                : f.key === 'refund'
                  ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-ocean-300'
            }`}
          >
            {f.label}
            <span className="opacity-80">({counts[f.key]})</span>
          </Link>
        ))}
      </div>

      {/* Bảng cuộn ngang trên màn hình hẹp */}
      <div className="card overflow-x-auto">
        <table aria-label="Danh sách đơn đăng ký" className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-ocean-50/70 text-xs font-semibold uppercase tracking-wide text-ocean-800">
            <tr>
              {columns.map((c) => (
                <th key={c.label} scope="col" className={`px-3 py-3 leading-snug ${c.className ?? ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations?.map((r, i) => {
              const course = r.courses as unknown as { title: string; price: number; status: string } | null
              // Tên khóa & học phí lưu lúc đăng ký (vẫn còn khi khóa đã bị xóa)
              const courseTitle = course?.title ?? r.course_title
              const amount = r.amount ?? course?.price
              const proofUrl = proofUrls.get(r.payment_proof_path)
              return (
                <tr key={r.id} className="group align-middle transition hover:bg-ocean-50/40">
                  <td className="px-3 py-3 text-center text-slate-400">{i + 1}</td>
                  <td className="px-3 py-3">
                    {proofUrl ? (
                      <a href={proofUrl} target="_blank" rel="noopener noreferrer" title="Bấm để xem ảnh lớn">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proofUrl}
                          alt={`Chuyển khoản của ${r.full_name}`}
                          loading="lazy"
                          className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200 transition hover:ring-4 hover:ring-ocean-200"
                        />
                      </a>
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-center text-[10px] leading-tight text-slate-400">
                        Không có ảnh
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-semibold text-ocean-900">
                    {r.full_name}
                    {!r.user_id && <span className="block text-xs font-normal italic text-slate-400">(tài khoản đã xóa)</span>}
                  </td>
                  <td className="max-w-[170px] truncate px-3 py-3 text-slate-600" title={r.email ?? undefined}>
                    {r.email ?? <span className="italic text-slate-400">Không có email</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <a href={`tel:${r.phone}`} className="text-ocean-700 hover:underline">
                      {r.phone}
                    </a>
                  </td>
                  <td className="min-w-[160px] max-w-[220px] px-3 py-3 text-slate-700">
                    {courseTitle ?? 'Khóa học'}
                    {!course && <span className="block text-xs italic text-slate-400">(khóa học đã xóa)</span>}
                    {course?.status === 'draft' && <span className="block text-xs italic text-slate-400">(khóa đang ẩn)</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-gold-700">
                    {amount != null ? formatPrice(amount) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600"><DateTime value={r.created_at} /></td>
                  <td className="px-3 py-3">
                    <StatusBadge status={r.status} />
                    {r.review_note && (
                      <span className="mt-1 block max-w-[200px] text-xs italic text-slate-500" title={r.review_note}>
                        Lý do: {r.review_note}
                      </span>
                    )}
                    <History events={eventsByRegistration.get(r.id) ?? []} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                    <DateTime value={r.reviewed_at} />
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-3 text-slate-600" title={r.reviewed_by_name ?? undefined}>
                    {r.reviewed_by_name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="sticky right-0 bg-white px-3 py-3 shadow-[-6px_0_8px_-6px_rgba(23,42,61,0.15)] group-hover:bg-ocean-50">
                    {/* Nút gửi kèm trạng thái đang thấy: người khác vừa xử lý thì không ghi đè */}
                    <div className="flex items-start justify-center gap-2">
                      {/* Khóa hoặc tài khoản đã xóa thì không còn gì để mở: chỉ giữ đơn làm lịch sử */}
                      {r.status !== 'approved' && course && r.user_id && (
                        <ActionForm action={setRegistrationStatus.bind(null, r.id, 'approved', r.status as Status)}>
                          <SubmitButton className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-200">
                            Duyệt
                          </SubmitButton>
                        </ActionForm>
                      )}
                      {r.status !== 'rejected' && (
                        <RejectForm id={r.id} status={r.status as Status} label={r.status === 'approved' ? 'Thu hồi' : 'Từ chối'} />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {!registrations?.length && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-slate-500">
                  Không có đơn đăng ký nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
