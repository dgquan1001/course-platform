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

// Cấp / gỡ quyền admin (không áp dụng cho chính mình)
function RoleButton({ user, meId }: { user: Profile; meId: string }) {
  if (user.id === meId) return <span className="text-xs text-slate-400">Tài khoản của bạn</span>
  const name = user.full_name || user.email || user.phone || 'tài khoản này'
  const isAdmin = user.role === 'admin'
  return (
    <ActionForm action={setUserRole.bind(null, user.id, isAdmin ? 'user' : 'admin')}>
      <SubmitButton
        className={`btn btn-sm whitespace-nowrap border ${
          isAdmin ? 'border-red-200 bg-white text-red-600 hover:bg-red-50' : 'border-ocean-200 bg-white text-ocean-700 hover:bg-ocean-50'
        }`}
        confirmMessage={
          isAdmin
            ? `Gỡ quyền admin của ${name}? Người này sẽ không vào được trang quản trị nữa.`
            : `Cấp quyền admin cho ${name}? Người này sẽ duyệt đơn, sửa khóa học và phân quyền như bạn.`
        }
      >
        {isAdmin ? 'Gỡ quyền admin' : 'Cấp quyền admin'}
      </SubmitButton>
    </ActionForm>
  )
}

// Ai đã cấp quyền admin (lần gần nhất)
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
  const onlyAdmins = searchParams.role === 'admin'
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
  if (onlyAdmins) query = query.eq('role', 'admin')

  const [{ data, error }, { data: regs }, { count: adminCount }, { data: roleEvents }] = await Promise.all([
    query,
    supabase.from('registrations').select('user_id, status, course_title, courses(title)'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase
      .from('role_events')
      .select('user_id, actor_name, created_at')
      .eq('to_role', 'admin')
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
    { href: '/admin/users', label: 'Tất cả tài khoản', active: !onlyAdmins },
    { href: '/admin/users?role=admin', label: `Admin (${adminCount ?? 0})`, active: onlyAdmins },
  ]

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
        {onlyAdmins && <input type="hidden" name="role" value="admin" />}
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
              <th className="px-4 py-3">Quyền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ocean-900">
                    {u.full_name || '—'} {u.role === 'admin' && <StatusBadge status="admin" />}
                  </p>
                  <p className="text-slate-500">{u.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
                  {u.role === 'admin' && <GrantedBy event={grantedBy.get(u.id)} />}
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
                  <RoleButton user={u} meId={me.id} />
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
              {u.full_name || '—'} {u.role === 'admin' && <StatusBadge status="admin" />}
            </p>
            <p className="text-slate-500">{u.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
            {u.phone && <a href={`tel:${u.phone}`} className="text-ocean-700">{u.phone}</a>}
            {u.role === 'admin' && <GrantedBy event={grantedBy.get(u.id)} />}
            <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
              {regsByUser.get(u.id)?.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <CourseName r={r} />
                  <StatusBadge status={r.status} />
                </li>
              )) ?? <li className="text-slate-400">Chưa đăng ký khóa học</li>}
            </ul>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <RoleButton user={u} meId={me.id} />
            </div>
          </div>
        ))}
      </div>

      {!users.length && <p className="card p-10 text-center text-slate-500">Không tìm thấy tài khoản.</p>}
    </div>
  )
}
