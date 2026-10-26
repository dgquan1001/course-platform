import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireStaffPage } from '@/lib/auth'
import { daysLeft } from '@/lib/courses'
import { formatDay } from '@/lib/format'
import ProgressRing from '@/components/ProgressRing'
import StatusBadge from '@/components/StatusBadge'
import PageHeader from '@/components/admin/PageHeader'
import { PencilIcon, InboxIcon, PlusIcon, TrashIcon } from '@/components/icons'

export const metadata: Metadata = { title: 'Khách hàng' }

type Patient = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  source: string
  created_at: string
  created_by_name: string | null
  active_courses: number
  nearest_until: string | null
  has_expiring: boolean
  has_expired: boolean
  inactive: boolean
  last_activity: string | null
  avg_percent: number | null
}

type PatientRegistration = {
  user_id: string
  status: string
  course_title: string | null
  access_until: string | null
  plan_months: number | null
  courses: { title: string } | null
}

const STATUS_FILTERS = [
  { value: '', label: 'Mọi trạng thái gói' },
  { value: 'active', label: 'Đang học' },
  { value: 'expiring', label: 'Sắp hết hạn (≤ 7 ngày)' },
  { value: 'expired', label: 'Có gói đã hết hạn' },
  { value: 'inactive', label: 'Không tập > 7 ngày' },
  { value: 'none', label: 'Chưa có gói' },
]
const SOURCE_FILTERS = [
  { value: '', label: 'Mọi nguồn' },
  { value: 'web', label: 'Web (tự đăng ký)' },
  { value: 'zalo', label: 'Zalo (nhân viên tạo)' },
]
const NEW_FILTERS = [
  { value: '', label: 'Mọi thời điểm' },
  { value: '7', label: 'Mới 7 ngày' },
  { value: '30', label: 'Mới 30 ngày' },
]

const pick = (value: string | undefined, options: { value: string }[]) => (options.some((o) => o.value === value) ? value! : '')

// Tên khóa lưu trong đơn vẫn hiển thị khi khóa học đã bị xóa
function CourseName({ r }: { r: PatientRegistration }) {
  if (r.courses) return <span>{r.courses.title}</span>
  return (
    <span>
      {r.course_title ?? 'Khóa học'} <span className="text-xs italic text-slate-400">(đã xóa)</span>
    </span>
  )
}

// Mỗi chương trình một dòng: trạng thái đơn mới nhất + hạn học (đơn đã duyệt)
function CourseList({ regs }: { regs: PatientRegistration[] | undefined }) {
  if (!regs?.length) return <p className="text-slate-400">Chưa đăng ký</p>
  return (
    <ul className="space-y-1">
      {regs.map((r, i) => {
        const days = r.status === 'approved' && r.plan_months ? daysLeft(r.access_until) : null
        return (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <CourseName r={r} />
            <StatusBadge status={r.status} />
            {days !== null && (
              <span className={`text-xs ${days <= 0 ? 'font-semibold text-red-600' : days <= 7 ? 'text-gold-800' : 'text-slate-400'}`}>
                {days <= 0 ? 'hết hạn' : `còn ${days} ngày`}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default async function AdminCustomersPage(props: { searchParams: Promise<{ q?: string; role?: string; source?: string; status?: string; new?: string }> }) {
  const searchParams = await props.searchParams
  await requireStaffPage()
  const q = (searchParams.q ?? '').trim().slice(0, 100)
  // Đường dẫn cũ tab "Nhân viên & Admin" (?role=team) → danh mục Nhân viên riêng (Đợt 26; trang tự chặn người không phải admin)
  if (searchParams.role === 'team') redirect(`/admin/staff${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  const supabase = await createClient()

  const search = (
    <form className="flex flex-wrap gap-2">
      <input name="q" defaultValue={q} placeholder="Tìm theo tên, email hoặc số điện thoại" aria-label="Từ khóa" className="input max-w-md flex-1" />
      <select name="source" defaultValue={pick(searchParams.source, SOURCE_FILTERS)} aria-label="Nguồn" className="input w-auto">
        {SOURCE_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select name="status" defaultValue={pick(searchParams.status, STATUS_FILTERS)} aria-label="Trạng thái gói" className="input w-auto">
        {STATUS_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select name="new" defaultValue={pick(searchParams.new, NEW_FILTERS)} aria-label="Thời điểm tạo" className="input w-auto">
        {NEW_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button className="btn-primary">Lọc</button>
    </form>
  )

  const { data, error } = await supabase.rpc('admin_patients', {
    p_q: q.replace(/[%_\\]/g, ''),
    p_source: pick(searchParams.source, SOURCE_FILTERS),
    p_status: pick(searchParams.status, STATUS_FILTERS),
    p_new_days: Number(pick(searchParams.new, NEW_FILTERS) || 0),
    p_limit: 200,
  })
  if (error) throw new Error(error.message)
  const patients = (data ?? []) as Patient[]

  // Đơn của các khách hàng đang hiển thị (không tải toàn bộ bảng đơn): mỗi khóa lấy đơn mới nhất
  const regsByUser = new Map<string, PatientRegistration[]>()
  if (patients.length) {
    const { data: regs } = await supabase
      .from('registrations')
      .select('user_id, status, course_id, course_title, access_until, plan_months, created_at, courses(title)')
      .in('user_id', patients.map((p) => p.id))
      .order('created_at', { ascending: false })
    const seen = new Set<string>()
    for (const r of (regs ?? []) as unknown as (PatientRegistration & { course_id: string | null })[]) {
      // Đơn đã duyệt được ưu tiên hiển thị (có hạn học); các đơn khác theo khóa
      const key = `${r.user_id}|${r.course_id ?? r.course_title}|${r.status === 'approved' ? 'a' : r.status}`
      if (seen.has(key)) continue
      seen.add(key)
      regsByUser.set(r.user_id, [...(regsByUser.get(r.user_id) ?? []), r])
    }
  }

  const progress = (p: Patient) =>
    p.active_courses ? (
      <div className="flex items-center gap-3">
        <ProgressRing value={p.avg_percent ?? 0} size="sm" label="Tiến độ trung bình" />
        <span className="text-xs text-slate-400">
          {p.last_activity ? `Tập gần nhất ${formatDay(p.last_activity)}` : 'Chưa tập'}
          {p.inactive && <span className="block font-semibold text-gold-800">Không tập &gt; 7 ngày</span>}
        </span>
      </div>
    ) : (
      <span className="text-slate-300">—</span>
    )

  // Thao tác từng khách hàng (QL-02, Đợt 26): Sửa mở form ở hồ sơ, Xóa mở vùng xóa có kiểm tra điều kiện + gõ SĐT xác nhận
  const rowActions = (p: Patient) => {
    const name = p.full_name || p.phone || 'khách hàng'
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={`/admin/customers/${p.id}`} className="btn btn-sm border border-ocean-200 bg-white text-ocean-700 hover:bg-ocean-50">
          Hồ sơ
        </Link>
        <Link
          href={`/admin/customers/${p.id}#sua-thong-tin`}
          aria-label={`Sửa ${name}`}
          className="btn btn-sm border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          <PencilIcon className="h-3.5 w-3.5" /> Sửa
        </Link>
        <Link
          href={`/admin/customers/${p.id}#xoa-khach-hang`}
          aria-label={`Xóa ${name}`}
          className="btn btn-sm border border-red-200 bg-white text-red-600 hover:bg-red-50"
        >
          <TrashIcon className="h-3.5 w-3.5" /> Xóa
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Khách hàng"
        description="Tài khoản khách hàng (tự đăng ký trên web hoặc nhân viên tạo từ Zalo), gói đang học và tiến độ tập."
        actions={
          <Link href="/admin/customers/new" className="btn-gold">
            <PlusIcon className="h-4 w-4" /> Tạo khách hàng
          </Link>
        }
      />
      {search}
      <p className="text-sm text-slate-500">{patients.length} khách hàng{patients.length === 200 && ' (hiển thị 200 người mới nhất – hãy lọc hoặc tìm để thu hẹp)'}</p>

      <div className="card hidden overflow-x-auto md:block">
        <table aria-label="Danh sách khách hàng" className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Chương trình</th>
              <th className="px-4 py-3">Tiến độ</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ocean-900">
                    <Link href={`/admin/customers/${p.id}`} className="hover:underline">
                      {p.full_name || '—'}
                    </Link>
                    <StatusBadge status={`source_${p.source}`} />
                  </p>
                  <p className="text-slate-500">{p.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
                  {p.created_by_name && <p className="text-xs text-slate-400">Tạo bởi {p.created_by_name}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {p.phone ? <a href={`tel:${p.phone}`} className="text-ocean-700 hover:underline">{p.phone}</a> : '—'}
                </td>
                <td className="px-4 py-3"><CourseList regs={regsByUser.get(p.id)} /></td>
                <td className="px-4 py-3">{progress(p)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDay(p.created_at)}</td>
                <td className="px-4 py-3">{rowActions(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {patients.map((p) => (
          <div key={p.id} className="card p-4 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-semibold text-ocean-900">
              <Link href={`/admin/customers/${p.id}`} className="hover:underline">{p.full_name || '—'}</Link>
              <StatusBadge status={`source_${p.source}`} />
            </p>
            <p className="text-slate-500">{p.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
            {p.phone && <a href={`tel:${p.phone}`} className="text-ocean-700">{p.phone}</a>}
            <div className="mt-2 border-t border-slate-100 pt-2"><CourseList regs={regsByUser.get(p.id)} /></div>
            <div className="mt-2">{progress(p)}</div>
            <div className="mt-3 border-t border-slate-100 pt-3">{rowActions(p)}</div>
          </div>
        ))}
      </div>

      {!patients.length && (
        <div className="card grid place-items-center gap-2 p-10 text-center text-slate-500">
          <InboxIcon className="h-8 w-8 text-slate-300" />
          <p>Không tìm thấy khách hàng.</p>
          <Link href="/admin/customers/new" className="btn-primary btn-sm mt-1">
            <PlusIcon className="h-4 w-4" /> Tạo khách hàng
          </Link>
        </div>
      )}
    </div>
  )
}
