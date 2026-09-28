import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireStaffPage } from '@/lib/auth'
import { daysLeft } from '@/lib/courses'
import { formatDateTime, formatDay, paymentLabel, registrationSourceLabel } from '@/lib/format'
import StatCard from '@/components/StatCard'
import ProgressRing from '@/components/ProgressRing'

export const metadata: Metadata = { title: 'Tổng quan' }

type Stats = {
  patients: number
  new_7d_web: number
  new_7d_zalo: number
  new_30d_web: number
  new_30d_zalo: number
  pending_registrations: number
  oldest_pending_at: string | null
  active_plans: number
  active_patients: number
  expiring_7d: number
  expired: number
  inactive_7d: number
  consultations_new: number
  leads_new: number
  expiring: { user_id: string; full_name: string | null; phone: string | null; course_title: string; until: string }[]
  inactive: { user_id: string; full_name: string | null; phone: string | null; course_title: string; last_activity: string | null; done: number; total: number }[]
  programs: { course_id: string; course_title: string; patients: number; avg_percent: number }[]
}

type RevenueRow = { dimension: 'total' | 'course' | 'method' | 'source' | 'handler'; label: string; orders: number; revenue: number }

// Đầu tháng theo giờ Việt Nam (UTC+7, không đổi giờ): tháng này và tháng trước
function monthStarts() {
  const vn = new Date(Date.now() + 7 * 3600_000)
  const y = vn.getUTCFullYear()
  const m = vn.getUTCMonth()
  const iso = (year: number, month: number) => {
    const d = new Date(Date.UTC(year, month, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01T00:00:00+07:00`
  }
  return { thisMonth: iso(y, m), lastMonth: iso(y, m - 1), nextMonth: iso(y, m + 1), label: `tháng ${m + 1}`, lastLabel: `tháng ${m === 0 ? 12 : m}` }
}

const sinceText = (value: string | null) => {
  if (!value) return ''
  const hours = Math.floor((Date.now() - new Date(value).getTime()) / 3600_000)
  return hours < 24 ? `đơn cũ nhất chờ ${Math.max(hours, 1)} giờ` : `đơn cũ nhất chờ ${Math.floor(hours / 24)} ngày`
}

// Tổng quan (SCR-22, FR-180 → FR-184): chỉ số, việc cần làm, tiến độ theo chương trình; doanh thu chỉ admin.
// /admin?status=… (đường dẫn cũ của bảng đơn) chuyển sang /admin/registrations?status=…
export default async function AdminDashboardPage({ searchParams }: { searchParams: { status?: string } }) {
  if (searchParams.status) redirect(`/admin/registrations?status=${encodeURIComponent(searchParams.status)}`)
  const me = await requireStaffPage()
  const supabase = createClient()
  const months = monthStarts()

  const [{ data, error }, thisMonth, lastMonth] = await Promise.all([
    supabase.rpc('dashboard_stats'),
    me.isAdmin ? supabase.rpc('revenue_report', { p_from: months.thisMonth, p_to: months.nextMonth }) : Promise.resolve({ data: null }),
    me.isAdmin ? supabase.rpc('revenue_report', { p_from: months.lastMonth, p_to: months.thisMonth }) : Promise.resolve({ data: null }),
  ])
  if (error) throw new Error(error.message)
  const s = data as Stats

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Tổng quan</h2>
        <Link href="/admin/patients/new" className="btn-gold">
          + Tạo bệnh nhân
        </Link>
      </div>

      <section aria-label="Chỉ số" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Bệnh nhân" value={s.patients} hint={`Mới 7 ngày: Web ${s.new_7d_web} · Zalo ${s.new_7d_zalo}`} href="/admin/patients" />
        <StatCard label="Mới 30 ngày" value={s.new_30d_web + s.new_30d_zalo} hint={`Web ${s.new_30d_web} · Zalo ${s.new_30d_zalo}`} href="/admin/patients?new=30" />
        <StatCard
          label="Đơn chờ duyệt"
          value={s.pending_registrations}
          hint={sinceText(s.oldest_pending_at) || 'Không có đơn chờ'}
          href="/admin/registrations"
          tone={s.pending_registrations ? 'warning' : 'default'}
        />
        <StatCard label="Gói đang hiệu lực" value={s.active_plans} hint={`${s.active_patients} bệnh nhân đang học`} href="/admin/patients?status=active" />
        <StatCard label="Sắp hết hạn (7 ngày)" value={s.expiring_7d} hint="Gọi nhắc gia hạn" href="/admin/patients?status=expiring" tone={s.expiring_7d ? 'warning' : 'default'} />
        <StatCard label="Đã hết hạn" value={s.expired} hint="Chưa gia hạn" href="/admin/patients?status=expired" />
        <StatCard
          label="Phiếu tham vấn mới"
          value={s.consultations_new}
          hint="Cần hẹn bác sĩ"
          href="/admin/consultations"
          tone={s.consultations_new ? 'critical' : 'default'}
        />
        <StatCard label="Khách premium mới" value={s.leads_new} hint="Để lại SĐT, chưa liên hệ" href="/admin/leads" tone={s.leads_new ? 'warning' : 'default'} />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section aria-label="Việc cần làm" className="card p-5">
          <h3 className="font-bold">Việc cần làm</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {!!s.pending_registrations && (
              <li className="flex items-center justify-between gap-3">
                <span>Duyệt {s.pending_registrations} đơn đăng ký ({sinceText(s.oldest_pending_at)})</span>
                <Link href="/admin/registrations" className="btn-outline btn-sm">Mở</Link>
              </li>
            )}
            {!!s.consultations_new && (
              <li className="flex items-center justify-between gap-3">
                <span>Liên hệ {s.consultations_new} phiếu tham vấn mới</span>
                <Link href="/admin/consultations" className="btn-outline btn-sm">Mở</Link>
              </li>
            )}
            {!!s.leads_new && (
              <li className="flex items-center justify-between gap-3">
                <span>Gọi {s.leads_new} khách quan tâm premium</span>
                <Link href="/admin/leads" className="btn-outline btn-sm">Mở</Link>
              </li>
            )}
            {s.expiring.map((x) => (
              <li key={`${x.user_id}-${x.course_title}`} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <span>
                  Sắp hết hạn:{' '}
                  <Link href={`/admin/patients/${x.user_id}`} className="font-semibold text-ocean-800 hover:underline">
                    {x.full_name ?? x.phone}
                  </Link>{' '}
                  – {x.course_title} <span className="text-gold-800">(còn {daysLeft(x.until)} ngày)</span>
                </span>
                {x.phone && (
                  <span className="flex gap-2">
                    <a href={`tel:${x.phone}`} className="btn-outline btn-sm">Gọi</a>
                    <a href={`https://zalo.me/${x.phone}`} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">Zalo</a>
                  </span>
                )}
              </li>
            ))}
            {!s.pending_registrations && !s.consultations_new && !s.leads_new && !s.expiring.length && (
              <li className="text-slate-500">Không có việc cần xử lý ngay.</li>
            )}
          </ul>
        </section>

        <section aria-label="Tiến độ theo chương trình" className="card p-5">
          <h3 className="font-bold">Tiến độ theo chương trình</h3>
          <p className="text-xs text-slate-500">Trung bình % bài đã tập của bệnh nhân đang còn hạn</p>
          {s.programs.length ? (
            <ul className="mt-3 space-y-3">
              {s.programs.map((p) => (
                <li key={p.course_id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-ocean-900">{p.course_title}</span>
                    <span className="tabular-nums text-slate-600">{p.avg_percent}% · {p.patients} bệnh nhân</span>
                  </div>
                  <div
                    role="meter"
                    aria-label={`Tiến độ trung bình ${p.course_title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={p.avg_percent}
                    className="mt-1 h-2 overflow-hidden rounded-full bg-ocean-100"
                  >
                    <div className="h-full rounded-full bg-ocean-500" style={{ width: `${p.avg_percent}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Chưa có bệnh nhân đang học.</p>
          )}

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-bold">Không tập &gt; 7 ngày ({s.inactive_7d})</h4>
              {!!s.inactive_7d && <Link href="/admin/patients?status=inactive" className="text-sm font-semibold text-ocean-700 hover:underline">Xem tất cả</Link>}
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              {s.inactive.map((x) => (
                <li key={`${x.user_id}-${x.course_title}`} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <Link href={`/admin/patients/${x.user_id}`} className="font-semibold text-ocean-800 hover:underline">{x.full_name ?? x.phone}</Link>{' '}
                    <span className="text-slate-500">
                      – {x.course_title} · {x.last_activity ? `tập gần nhất ${formatDay(x.last_activity)}` : 'chưa tập buổi nào'}
                    </span>
                  </span>
                  <ProgressRing done={x.done} total={x.total} size="sm" />
                </li>
              ))}
              {!s.inactive.length && <li className="text-slate-500">Mọi bệnh nhân đang học đều tập trong 7 ngày qua.</li>}
            </ul>
          </div>
        </section>
      </div>

      {me.isAdmin && (
        <Revenue
          current={(thisMonth.data ?? []) as RevenueRow[]}
          previous={(lastMonth.data ?? []) as RevenueRow[]}
          label={months.label}
          lastLabel={months.lastLabel}
        />
      )}
      <p className="text-xs text-slate-400">Số liệu tại {formatDateTime(new Date().toISOString())}.</p>
    </div>
  )
}

const DIMENSIONS: { key: RevenueRow['dimension']; title: string; format: (s: string) => string }[] = [
  { key: 'course', title: 'Theo chương trình', format: (s) => s },
  { key: 'method', title: 'Theo hình thức thanh toán', format: paymentLabel },
  { key: 'source', title: 'Theo nguồn', format: registrationSourceLabel },
  // "—": đơn duyệt bằng script / dữ liệu cũ không ghi người xử lý
  { key: 'handler', title: 'Theo người duyệt / cấp gói', format: (s) => (s === '—' ? 'Không rõ (dữ liệu cũ)' : s) },
]

// Doanh thu (chỉ admin, FR-184): tháng này so với tháng trước + phân tích theo 4 chiều.
// Mỗi bảng một thang đo, thanh ngang một màu (độ lớn), số liệu ghi rõ bên cạnh; rê chuột vào thanh để xem chi tiết.
function Revenue({ current, previous, label, lastLabel }: { current: RevenueRow[]; previous: RevenueRow[]; label: string; lastLabel: string }) {
  const total = current.find((r) => r.dimension === 'total') ?? { revenue: 0, orders: 0 }
  const lastTotal = previous.find((r) => r.dimension === 'total') ?? { revenue: 0, orders: 0 }
  const delta = total.revenue - lastTotal.revenue
  return (
    <section aria-label="Doanh thu" className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-bold">Doanh thu {label}</h3>
          <p className="mt-1 text-4xl font-bold tabular-nums text-ocean-900" data-testid="revenue-total">
            {total.revenue.toLocaleString('vi-VN')}đ
          </p>
          <p className="text-sm text-slate-500">
            {total.orders} đơn · {lastLabel}: {lastTotal.revenue.toLocaleString('vi-VN')}đ{' '}
            {lastTotal.revenue > 0 && (
              <span className={delta >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                ({delta >= 0 ? '▲' : '▼'} {Math.abs(Math.round((delta * 100) / lastTotal.revenue))}%)
              </span>
            )}
          </p>
        </div>
        <p className="max-w-sm text-xs text-slate-400">
          Tính theo số tiền của các đơn đang ở trạng thái Đã duyệt, theo ngày duyệt / cấp gói (giờ Việt Nam). Đơn bị thu hồi không tính.
        </p>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {DIMENSIONS.map((d) => {
          const rows = current.filter((r) => r.dimension === d.key).sort((a, b) => b.revenue - a.revenue)
          const max = Math.max(...rows.map((r) => r.revenue), 1)
          return (
            <div key={d.key}>
              <h4 className="text-sm font-semibold text-slate-700">{d.title}</h4>
              {rows.length ? (
                <table className="mt-2 w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[38%]" />
                    <col />
                    <col className="w-[34%]" />
                  </colgroup>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.label} title={`${d.format(r.label)}: ${r.revenue.toLocaleString('vi-VN')}đ · ${r.orders} đơn`}>
                        <td className="truncate py-1 pr-2 text-slate-700">{d.format(r.label)}</td>
                        <td className="py-1">
                          <div className="h-3 rounded-r bg-ocean-500" style={{ width: `${Math.max((r.revenue / max) * 100, 2)}%` }} />
                        </td>
                        <td className="whitespace-nowrap py-1 pl-2 text-right tabular-nums text-slate-700">
                          {r.revenue.toLocaleString('vi-VN')}đ <span className="text-xs text-slate-400">· {r.orders}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Chưa có doanh thu.</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
