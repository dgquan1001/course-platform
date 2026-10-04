import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaffPage } from '@/lib/auth'
import { daysLeft } from '@/lib/courses'
import { formatDay } from '@/lib/format'
import ProgressRing from '@/components/ProgressRing'
import StatusBadge from '@/components/StatusBadge'
import RoleForm, { type RoleTarget } from './RoleForm'

export const metadata: Metadata = { title: 'Bệnh nhân' }

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

type TeamMember = { id: string; email: string | null; full_name: string | null; phone: string | null; role: string; created_at: string }
type RoleEvent = { user_id: string; actor_name: string | null; created_at: string }

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

function Tabs({ team, isAdmin, teamCount }: { team: boolean; isAdmin: boolean; teamCount: number }) {
  const tabs = [{ href: '/admin/patients', label: 'Bệnh nhân', active: !team }]
  if (isAdmin) tabs.push({ href: '/admin/patients?role=team', label: `Nhân viên & Admin (${teamCount})`, active: team })
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? 'page' : undefined}
          className={`btn-sm btn whitespace-nowrap border ${
            t.active ? 'border-ocean-500 bg-ocean-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-ocean-300'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}

export default async function AdminPatientsPage(props: { searchParams: Promise<{ q?: string; role?: string; source?: string; status?: string; new?: string }> }) {
  const searchParams = await props.searchParams
  const me = await requireStaffPage()
  const q = (searchParams.q ?? '').trim().slice(0, 100)
  // Tab "Nhân viên & Admin" chỉ admin xem (rà soát ai đang có quyền vào trang quản trị)
  const team = searchParams.role === 'team' && me.isAdmin
  const supabase = await createClient()
  const { count: teamCount } = me.isAdmin
    ? await supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['staff', 'admin'])
    : { count: 0 }

  const search = (
    <form className="flex flex-wrap gap-2">
      {team && <input type="hidden" name="role" value="team" />}
      <input name="q" defaultValue={q} placeholder="Tìm theo tên, email hoặc số điện thoại" aria-label="Từ khóa" className="input max-w-md flex-1" />
      {!team && (
        <>
          <select name="source" defaultValue={pick(searchParams.source, SOURCE_FILTERS)} aria-label="Nguồn" className="input w-auto">
            {SOURCE_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select name="status" defaultValue={pick(searchParams.status, STATUS_FILTERS)} aria-label="Trạng thái gói" className="input w-auto">
            {STATUS_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select name="new" defaultValue={pick(searchParams.new, NEW_FILTERS)} aria-label="Thời điểm tạo" className="input w-auto">
            {NEW_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </>
      )}
      <button className="btn-primary">Lọc</button>
    </form>
  )

  if (team) return <TeamList q={q} me={me} teamCount={teamCount ?? 0} search={search} />

  const { data, error } = await supabase.rpc('admin_patients', {
    p_q: q.replace(/[%_\\]/g, ''),
    p_source: pick(searchParams.source, SOURCE_FILTERS),
    p_status: pick(searchParams.status, STATUS_FILTERS),
    p_new_days: Number(pick(searchParams.new, NEW_FILTERS) || 0),
    p_limit: 200,
  })
  if (error) throw new Error(error.message)
  const patients = (data ?? []) as Patient[]

  // Đơn của các bệnh nhân đang hiển thị (không tải toàn bộ bảng đơn): mỗi khóa lấy đơn mới nhất
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

  const roleTarget = (p: Patient): RoleTarget => ({ id: p.id, role: 'user', name: p.full_name || p.email || p.phone || 'tài khoản này' })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs team={false} isAdmin={me.isAdmin} teamCount={teamCount ?? 0} />
        <Link href="/admin/patients/new" className="btn-gold">
          + Tạo bệnh nhân
        </Link>
      </div>
      {search}
      <p className="text-sm text-slate-500">{patients.length} bệnh nhân{patients.length === 200 && ' (hiển thị 200 người mới nhất – hãy lọc hoặc tìm để thu hẹp)'}</p>

      <div className="card hidden overflow-x-auto md:block">
        <table aria-label="Danh sách bệnh nhân" className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Bệnh nhân</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Chương trình</th>
              <th className="px-4 py-3">Tiến độ</th>
              <th className="px-4 py-3">Ngày tạo</th>
              {me.isAdmin && <th className="px-4 py-3">Vai trò</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ocean-900">
                    <Link href={`/admin/patients/${p.id}`} className="hover:underline">
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
                {me.isAdmin && (
                  <td className="px-4 py-3">
                    <RoleForm target={roleTarget(p)} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {patients.map((p) => (
          <div key={p.id} className="card p-4 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-semibold text-ocean-900">
              <Link href={`/admin/patients/${p.id}`} className="hover:underline">{p.full_name || '—'}</Link>
              <StatusBadge status={`source_${p.source}`} />
            </p>
            <p className="text-slate-500">{p.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
            {p.phone && <a href={`tel:${p.phone}`} className="text-ocean-700">{p.phone}</a>}
            <div className="mt-2 border-t border-slate-100 pt-2"><CourseList regs={regsByUser.get(p.id)} /></div>
            <div className="mt-2">{progress(p)}</div>
          </div>
        ))}
      </div>

      {!patients.length && <p className="card p-10 text-center text-slate-500">Không tìm thấy bệnh nhân.</p>}
    </div>
  )
}

// Tab "Nhân viên & Admin" (chỉ admin): ai đang có quyền vào trang quản trị, ai cấp quyền
async function TeamList({ q, me, teamCount, search }: { q: string; me: { id: string; isAdmin: boolean }; teamCount: number; search: React.ReactNode }) {
  const supabase = await createClient()
  let query = supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, created_at')
    .in('role', ['staff', 'admin'])
    .order('created_at', { ascending: false })
    .limit(200)
  if (q) {
    const term = q.replace(/[%,()\\]/g, '')
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
  }
  const [{ data, error }, { data: roleEvents }] = await Promise.all([
    query,
    supabase.from('role_events').select('user_id, actor_name, created_at').in('to_role', ['staff', 'admin']).order('created_at', { ascending: false }),
  ])
  if (error) throw new Error(error.message)
  const members = (data ?? []) as TeamMember[]
  // Lần cấp quyền gần nhất của mỗi tài khoản
  const grantedBy = new Map<string, RoleEvent>()
  for (const e of (roleEvents ?? []) as RoleEvent[]) if (!grantedBy.has(e.user_id)) grantedBy.set(e.user_id, e)

  return (
    <div className="space-y-5">
      <Tabs team isAdmin={me.isAdmin} teamCount={teamCount} />
      {search}
      <div className="card overflow-x-auto">
        <table aria-label="Nhân viên và admin" className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tài khoản</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Vai trò</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((u) => {
              const event = grantedBy.get(u.id)
              return (
                <tr key={u.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ocean-900">
                      {u.full_name || '—'} <StatusBadge status={u.role} />
                    </p>
                    <p className="text-slate-500">{u.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
                    {event && (
                      <p className="text-xs text-slate-400">
                        Cấp quyền bởi {event.actor_name ?? 'Hệ thống'} · {formatDay(event.created_at)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{u.phone ? <a href={`tel:${u.phone}`} className="text-ocean-700 hover:underline">{u.phone}</a> : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDay(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {u.id === me.id ? (
                      <span className="text-xs text-slate-400">Tài khoản của bạn</span>
                    ) : (
                      <RoleForm target={{ id: u.id, role: u.role, name: u.full_name || u.email || u.phone || 'tài khoản này' }} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!members.length && <p className="p-10 text-center text-slate-500">Không tìm thấy tài khoản.</p>}
      </div>
    </div>
  )
}
