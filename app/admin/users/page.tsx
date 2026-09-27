import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import StatusBadge from '@/components/StatusBadge'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import { setUserRole } from '../actions'

type UserRegistration = {
  user_id: string
  status: string
  course_title: string | null
  courses: { title: string } | null
}

type Profile = { id: string; email: string | null; full_name: string | null; phone: string | null; role: string; created_at: string }

type RoleEvent = { user_id: string; actor_name: string | null; created_at: string }

// Tên khóa lưu trong đơn vẫn hiển thị khi khóa học đã bị xóa
function CourseName({ r }: { r: UserRegistration }) {
  if (r.courses) return <span>{r.courses.title}</span>
  return (
    <span>
      {r.course_title ?? 'Khóa học'} <span className="text-xs italic text-slate-400">(đã xóa)</span>
    </span>
  )
}

const roleOptions = [
  { value: 'user', label: 'Học viên' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'admin', label: 'Admin' },
]

// Chọn vai trò: chỉ admin đổi được, không áp dụng cho chính mình; nhân viên chỉ xem
function RoleForm({ user, meId, canEdit }: { user: Profile; meId: string; canEdit: boolean }) {
  if (user.id === meId) return <span className="text-xs text-slate-400">Tài khoản của bạn</span>
  if (!canEdit) return <StatusBadge status={user.role} />
  const name = user.full_name || user.email || user.phone || 'tài khoản này'
  return (
    <ActionForm key={user.role} action={setUserRole.bind(null, user.id)} className="flex items-center gap-2">
      <label htmlFor={`role-${user.id}`} className="sr-only">
        Vai trò của {name}
      </label>
      <select id={`role-${user.id}`} name="role" defaultValue={user.role} className="input w-32 py-1.5 text-sm">
        {roleOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <SubmitButton
        className="btn btn-sm whitespace-nowrap border border-ocean-200 bg-white text-ocean-700 hover:bg-ocean-50"
        confirmMessage={`Đổi vai trò của ${name}? Nhân viên: duyệt đơn, xem học viên. Admin: toàn quyền, kể cả sửa khóa học và phân quyền. Học viên: không vào được trang quản trị.`}
      >
        Lưu vai trò
      </SubmitButton>
    </ActionForm>
  )
}

// Ai đã cấp vai trò nhân viên / admin (lần gần nhất)
function GrantedBy({ event }: { event?: RoleEvent }) {
  if (!event) return null
  return (
    <p className="text-xs text-slate-400">
      Cấp quyền bởi {event.actor_name ?? 'Hệ thống'} ·{' '}
      {new Date(event.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
    </p>
  )
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string }
}) {
  const q = (searchParams.q ?? '').trim()
  // Tab "Nhân viên & Admin": rà soát ai đang có quyền vào trang quản trị
  const onlyTeam = searchParams.role === 'team'
  const supabase = createClient()
  const me = (await getCurrentUser())!

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (q) {
    const term = q.replace(/[%,()]/g, '')
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
  }
  if (onlyTeam) query = query.in('role', ['staff', 'admin'])

  const [{ data, error }, { data: regs }, { count: teamCount }, { data: roleEvents }] = await Promise.all([
    query,
    supabase.from('registrations').select('user_id, status, course_title, courses(title)'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['staff', 'admin']),
    // Nhật ký phân quyền chỉ admin đọc được (nhân viên nhận danh sách rỗng)
    supabase
      .from('role_events')
      .select('user_id, actor_name, created_at')
      .in('to_role', ['staff', 'admin'])
      .order('created_at', { ascending: false }),
  ])
  if (error) throw new Error(error.message)
  const users = (data ?? []) as Profile[]

  const regsByUser = new Map<string, UserRegistration[]>()
  for (const r of (regs ?? []) as unknown as UserRegistration[]) {
    regsByUser.set(r.user_id, [...(regsByUser.get(r.user_id) ?? []), r])
  }
  // Sắp xếp mới nhất trước: lần cấp quyền gần nhất của mỗi tài khoản
  const grantedBy = new Map<string, RoleEvent>()
  for (const e of (roleEvents ?? []) as RoleEvent[]) if (!grantedBy.has(e.user_id)) grantedBy.set(e.user_id, e)

  const tabs = [
    { href: '/admin/users', label: 'Tất cả tài khoản', active: !onlyTeam },
    { href: '/admin/users?role=team', label: `Nhân viên & Admin (${teamCount ?? 0})`, active: onlyTeam },
  ]
  const isTeam = (u: Profile) => u.role === 'staff' || u.role === 'admin'

  return (
    <div className="space-y-5">
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

      <form className="flex gap-2">
        {onlyTeam && <input type="hidden" name="role" value="team" />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên, email hoặc số điện thoại"
          className="input max-w-md"
        />
        <button className="btn-primary">Tìm</button>
      </form>

      <p className="text-sm text-slate-500">{users.length} tài khoản</p>

      {/* Bảng trên máy tính, thẻ trên điện thoại */}
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Khóa học</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Vai trò</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ocean-900">
                    {u.full_name || '—'} {isTeam(u) && <StatusBadge status={u.role} />}
                  </p>
                  <p className="text-slate-500">{u.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
                  {isTeam(u) && <GrantedBy event={grantedBy.get(u.id)} />}
                </td>
                <td className="px-4 py-3">
                  {u.phone ? <a href={`tel:${u.phone}`} className="text-ocean-700 hover:underline">{u.phone}</a> : '—'}
                </td>
                <td className="px-4 py-3">
                  <ul className="space-y-1">
                    {regsByUser.get(u.id)?.map((r, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        <CourseName r={r} />
                        <StatusBadge status={r.status} />
                      </li>
                    )) ?? <li className="text-slate-400">Chưa đăng ký</li>}
                  </ul>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(u.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </td>
                <td className="px-4 py-3">
                  <RoleForm user={u} meId={me.id} canEdit={me.isAdmin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="card p-4 text-sm">
            <p className="font-semibold text-ocean-900">
              {u.full_name || '—'} {isTeam(u) && <StatusBadge status={u.role} />}
            </p>
            <p className="text-slate-500">{u.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
            {u.phone && <a href={`tel:${u.phone}`} className="text-ocean-700">{u.phone}</a>}
            {isTeam(u) && <GrantedBy event={grantedBy.get(u.id)} />}
            <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
              {regsByUser.get(u.id)?.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <CourseName r={r} />
                  <StatusBadge status={r.status} />
                </li>
              )) ?? <li className="text-slate-400">Chưa đăng ký khóa học</li>}
            </ul>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <RoleForm user={u} meId={me.id} canEdit={me.isAdmin} />
            </div>
          </div>
        ))}
      </div>

      {!users.length && <p className="card p-10 text-center text-slate-500">Không tìm thấy tài khoản.</p>}
    </div>
  )
}
