import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/site-config'
import StatusBadge from '@/components/StatusBadge'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import { setRegistrationStatus } from './actions'

const filters = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
  { key: 'all', label: 'Tất cả' },
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

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const filter = filters.some((f) => f.key === searchParams.status) ? searchParams.status! : 'pending'
  const supabase = createClient()

  let query = supabase
    .from('registrations')
    .select('id, full_name, email, phone, status, payment_proof_path, created_at, reviewed_at, course_title, amount, courses(title, price)')
    .order('created_at', { ascending: filter === 'pending' })
    .limit(200)
  if (filter !== 'all') query = query.eq('status', filter)

  const countOf = (status: Status) =>
    supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', status)

  const [{ data: registrations, error }, pending, approved, rejected] = await Promise.all([
    query,
    countOf('pending'),
    countOf('approved'),
    countOf('rejected'),
  ])
  if (error) throw new Error(error.message)

  const counts: Record<string, number> = {
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
  }
  counts.all = counts.pending + counts.approved + counts.rejected

  // Ảnh chuyển khoản nằm trong bucket riêng tư: tạo link xem tạm thời 1 giờ
  const proofUrls = new Map<string, string>()
  if (registrations?.length) {
    const { data: signed } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrls(registrations.map((r) => r.payment_proof_path), 3600)
    signed?.forEach((s) => s.path && s.signedUrl && proofUrls.set(s.path, s.signedUrl))
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'pending' ? '/admin' : `/admin?status=${f.key}`}
            aria-current={filter === f.key ? 'page' : undefined}
            className={`btn-sm btn whitespace-nowrap border ${
              filter === f.key
                ? 'border-ocean-500 bg-ocean-500 text-white'
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
        <table aria-label="Danh sách đơn đăng ký" className="w-full min-w-[960px] text-left text-sm">
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
              const course = r.courses as unknown as { title: string; price: number } | null
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
                  <td className="px-3 py-3 font-semibold text-ocean-900">{r.full_name}</td>
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
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-gold-700">
                    {amount != null ? formatPrice(amount) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600"><DateTime value={r.created_at} /></td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                    <DateTime value={r.reviewed_at} />
                  </td>
                  <td className="sticky right-0 bg-white px-3 py-3 shadow-[-6px_0_8px_-6px_rgba(23,42,61,0.15)] group-hover:bg-ocean-50">
                    <div className="flex justify-center gap-2">
                      {/* Khóa đã xóa thì không còn gì để mở: chỉ giữ đơn làm lịch sử */}
                      {r.status !== 'approved' && course && (
                        <ActionForm action={setRegistrationStatus.bind(null, r.id, 'approved')}>
                          <SubmitButton className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-200">
                            Duyệt
                          </SubmitButton>
                        </ActionForm>
                      )}
                      {r.status !== 'rejected' && (
                        <ActionForm action={setRegistrationStatus.bind(null, r.id, 'rejected')}>
                          <SubmitButton
                            className="btn btn-sm border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-100"
                            confirmMessage={
                              r.status === 'approved'
                                ? `Thu hồi quyền học "${courseTitle}" của ${r.full_name}?`
                                : undefined
                            }
                          >
                            {r.status === 'approved' ? 'Thu hồi' : 'Từ chối'}
                          </SubmitButton>
                        </ActionForm>
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
