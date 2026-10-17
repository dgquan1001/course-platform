import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAdminPage } from '@/lib/auth'
import { formatDateTime, formatDay } from '@/lib/format'
import StatusBadge from '@/components/StatusBadge'
import PageHeader from '@/components/admin/PageHeader'
import { InboxIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/icons'

export const metadata: Metadata = { title: 'Nhân viên' }

type Member = { id: string; email: string | null; full_name: string | null; phone: string | null; role: string; created_at: string }
type RoleEvent = { user_id: string; actor_name: string | null; created_at: string }
type DeletedEvent = { user_name: string | null; actor_name: string | null; created_at: string }

const ROLE_FILTERS = [
  { value: '', label: 'Mọi vai trò' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'admin', label: 'Admin' },
]

// Danh mục Nhân viên (Đợt 26 – tách khỏi danh sách khách hàng): chỉ admin. Ai đang có quyền vào trang quản trị, ai cấp quyền;
// thêm / sửa / xóa tài khoản nhân viên, admin. Cuối trang: nhật ký xóa tài khoản (khách hàng + nhân viên) để admin rà soát.
export default async function AdminStaffPage(props: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const searchParams = await props.searchParams
  const me = await requireAdminPage()
  const q = (searchParams.q ?? '').trim().slice(0, 100)
  const role = ROLE_FILTERS.some((o) => o.value === searchParams.role) ? searchParams.role! : ''
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, created_at')
    .in('role', role ? [role] : ['staff', 'admin'])
    .order('created_at', { ascending: false })
    .limit(200)
  if (q) {
    // Bỏ ký tự đặc biệt của bộ lọc PostgREST (dấu phẩy, ngoặc) để từ khóa không chèn thêm điều kiện
    const term = q.replace(/[%,()\\*:"]/g, '')
    if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
  }
  const [{ data, error }, { data: roleEvents }, { data: deleted }] = await Promise.all([
    query,
    supabase
      .from('role_events')
      .select('user_id, actor_name, created_at')
      .in('to_role', ['staff', 'admin'])
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('account_events').select('user_name, actor_name, created_at').eq('action', 'deleted').order('created_at', { ascending: false }).limit(20),
  ])
  if (error) throw new Error(error.message)
  const members = (data ?? []) as Member[]
  // Lần cấp quyền gần nhất của mỗi tài khoản
  const grantedBy = new Map<string, RoleEvent>()
  for (const e of (roleEvents ?? []) as RoleEvent[]) if (!grantedBy.has(e.user_id)) grantedBy.set(e.user_id, e)

  const rowActions = (u: Member) => {
    const name = u.full_name || u.phone || 'nhân viên'
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={`/admin/staff/${u.id}`} aria-label={`Sửa ${name}`} className="btn btn-sm border border-ocean-200 bg-white text-ocean-700 hover:bg-ocean-50">
          <PencilIcon className="h-3.5 w-3.5" /> Sửa
        </Link>
        {u.id !== me.id && (
          <Link
            href={`/admin/staff/${u.id}#xoa-nhan-vien`}
            aria-label={`Xóa ${name}`}
            className="btn btn-sm border border-red-200 bg-white text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="h-3.5 w-3.5" /> Xóa
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nhân viên"
        description="Tài khoản nhân viên và admin có quyền vào trang quản trị. Nhân viên quản lý đơn, khách hàng, phiếu tham vấn; chỉ admin sửa khóa học và phân quyền."
        actions={
          <Link href="/admin/staff/new" className="btn-gold">
            <PlusIcon className="h-4 w-4" /> Thêm nhân viên
          </Link>
        }
      />
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Tìm theo tên, email hoặc số điện thoại" aria-label="Từ khóa" className="input max-w-md flex-1" />
        <select name="role" defaultValue={role} aria-label="Vai trò" className="input w-auto">
          {ROLE_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="btn-primary">Lọc</button>
      </form>
      <p className="text-sm text-slate-500">{members.length} tài khoản</p>

      <div className="card overflow-x-auto">
        <table aria-label="Danh sách nhân viên" className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nhân viên</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((u) => {
              const event = grantedBy.get(u.id)
              return (
                <tr key={u.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ocean-900">
                      <Link href={`/admin/staff/${u.id}`} className="hover:underline">
                        {u.full_name || '—'}
                      </Link>
                      {u.id === me.id && <span className="ml-2 text-xs font-normal text-slate-400">(bạn)</span>}
                    </p>
                    <p className="text-slate-500">{u.email ?? <span className="italic text-slate-400">Không có email</span>}</p>
                    {event && (
                      <p className="text-xs text-slate-400">
                        Cấp quyền bởi {event.actor_name ?? 'Hệ thống'} · {formatDay(event.created_at)}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {u.phone ? <a href={`tel:${u.phone}`} className="text-ocean-700 hover:underline">{u.phone}</a> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.role} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDay(u.created_at)}</td>
                  <td className="px-4 py-3">{rowActions(u)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!members.length && (
          <div className="grid place-items-center gap-2 p-10 text-center text-slate-500">
            <InboxIcon className="h-8 w-8 text-slate-300" />
            <p>Không tìm thấy tài khoản.</p>
          </div>
        )}
      </div>

      <section aria-label="Nhật ký xóa tài khoản" className="card p-5">
        <h3 className="font-bold">Nhật ký xóa tài khoản</h3>
        <p className="text-xs text-slate-500">20 lần xóa gần nhất (khách hàng và nhân viên) – ai xóa, xóa ai, lúc nào.</p>
        {deleted?.length ? (
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {(deleted as DeletedEvent[]).map((e, i) => (
              <li key={i}>
                <span className="text-slate-400">{formatDateTime(e.created_at)}</span> · {e.actor_name ?? 'Hệ thống'} đã xóa{' '}
                <span className="font-semibold text-ocean-900">{e.user_name || 'tài khoản'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Chưa có tài khoản nào bị xóa.</p>
        )}
      </section>
    </div>
  )
}
