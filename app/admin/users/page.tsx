import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/StatusBadge'

type UserRegistration = { user_id: string; status: string; courses: { title: string } | null }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = (searchParams.q ?? '').trim()
  const supabase = createClient()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (q) {
    const term = q.replace(/[%,()]/g, '')
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
  }

  const [{ data: users, error }, { data: regs }] = await Promise.all([
    query,
    supabase.from('registrations').select('user_id, status, courses(title)'),
  ])
  if (error) throw new Error(error.message)

  const regsByUser = new Map<string, UserRegistration[]>()
  for (const r of (regs ?? []) as unknown as UserRegistration[]) {
    regsByUser.set(r.user_id, [...(regsByUser.get(r.user_id) ?? []), r])
  }

  return (
    <div className="space-y-5">
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên, Gmail hoặc số điện thoại"
          className="input max-w-md"
        />
        <button className="btn-primary">Tìm</button>
      </form>

      <p className="text-sm text-slate-500">{users?.length ?? 0} tài khoản</p>

      {/* Bảng trên máy tính, thẻ trên điện thoại */}
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Khóa học</th>
              <th className="px-4 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.map((u) => (
              <tr key={u.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ocean-900">
                    {u.full_name || '—'} {u.role === 'admin' && <StatusBadge status="admin" />}
                  </p>
                  <p className="text-slate-500">{u.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
                </td>
                <td className="px-4 py-3">
                  {u.phone ? <a href={`tel:${u.phone}`} className="text-ocean-700 hover:underline">{u.phone}</a> : '—'}
                </td>
                <td className="px-4 py-3">
                  <ul className="space-y-1">
                    {regsByUser.get(u.id)?.map((r, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        <span>{r.courses?.title ?? 'Khóa học đã xóa'}</span>
                        <StatusBadge status={r.status} />
                      </li>
                    )) ?? <li className="text-slate-400">Chưa đăng ký</li>}
                  </ul>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(u.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {users?.map((u) => (
          <div key={u.id} className="card p-4 text-sm">
            <p className="font-semibold text-ocean-900">
              {u.full_name || '—'} {u.role === 'admin' && <StatusBadge status="admin" />}
            </p>
            <p className="text-slate-500">{u.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
            {u.phone && <a href={`tel:${u.phone}`} className="text-ocean-700">{u.phone}</a>}
            <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
              {regsByUser.get(u.id)?.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span>{r.courses?.title ?? 'Khóa học đã xóa'}</span>
                  <StatusBadge status={r.status} />
                </li>
              )) ?? <li className="text-slate-400">Chưa đăng ký khóa học</li>}
            </ul>
          </div>
        ))}
      </div>

      {!users?.length && <p className="card p-10 text-center text-slate-500">Không tìm thấy học viên.</p>}
    </div>
  )
}
