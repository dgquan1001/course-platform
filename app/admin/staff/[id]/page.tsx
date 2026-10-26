import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdminPage } from '@/lib/auth'
import { displayName, formatDateTime, formatDay } from '@/lib/format'
import { deleteConfirmValue, UUID } from '@/lib/managed-accounts'
import StatusBadge from '@/components/StatusBadge'
import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import DeleteAccount from '@/components/admin/DeleteAccount'
import { ArrowLeftIcon } from '@/components/icons'
import RoleForm from '../../customers/RoleForm'
import { deleteStaffAction, updateStaffAction } from '../actions'
import ResetStaffPassword from './ResetStaffPassword'

export const metadata: Metadata = { title: 'Hồ sơ nhân viên' }

const accountActions: Record<string, string> = {
  created: 'Tạo tài khoản',
  password_reset: 'Cấp lại mật khẩu',
  profile_updated: 'Sửa thông tin',
}
const roleName = (r: string) => ({ user: 'Khách hàng', staff: 'Nhân viên', admin: 'Admin' })[r] ?? r

// Hồ sơ nhân viên / admin (Đợt 26, chỉ admin): sửa thông tin, đổi vai trò, cấp lại mật khẩu, xóa; lịch sử phân quyền + nhật ký tài khoản.
// Tài khoản của chính mình: chỉ sửa thông tin (mật khẩu ở Tài khoản của tôi; không tự đổi quyền / tự xóa).
export default async function StaffMemberPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const me = await requireAdminPage()
  if (!UUID.test(params.id)) notFound()
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, phone, created_at, must_change_password')
    .eq('id', params.id)
    .maybeSingle()
  if (!member) notFound()
  // Khách hàng quản lý ở danh mục Khách hàng
  if (member.role === 'user') redirect(`/admin/customers/${member.id}`)

  const [{ data: roleEvents }, { data: events }] = await Promise.all([
    supabase.from('role_events').select('from_role, to_role, actor_name, created_at').eq('user_id', member.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('account_events').select('action, actor_name, created_at').eq('user_id', member.id).order('created_at', { ascending: false }).limit(20),
  ])
  const name = displayName(member)
  const isMe = member.id === me.id

  return (
    <div className="space-y-5">
      <Link href="/admin/staff" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700">
        <ArrowLeftIcon className="h-4 w-4" /> Danh sách nhân viên
      </Link>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">{name}</h2>
          <StatusBadge status={member.role} />
          {isMe && <span className="badge bg-slate-100 text-slate-600">Tài khoản của bạn</span>}
          {member.must_change_password && <span className="badge bg-gold-100 text-gold-800">Chưa đổi mật khẩu được cấp</span>}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {member.phone && (
            <a href={`tel:${member.phone}`} className="font-semibold text-ocean-700 hover:underline">
              {member.phone}
            </a>
          )}
          <span className="text-slate-500">{member.email ?? 'Không có email'}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">Tạo ngày {formatDay(member.created_at)}</p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section aria-label="Lịch sử phân quyền" className="card p-5">
            <h3 className="font-bold">Lịch sử phân quyền</h3>
            {roleEvents?.length ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {roleEvents.map((e, i) => (
                  <li key={i}>
                    <span className="text-slate-400">{formatDateTime(e.created_at)}</span> · {roleName(e.from_role)} → {roleName(e.to_role)} ·{' '}
                    {e.actor_name ?? 'Hệ thống'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Chưa có lần đổi vai trò nào được ghi lại.</p>
            )}
          </section>

          <section aria-label="Nhật ký tài khoản" className="card p-5">
            <h3 className="font-bold">Nhật ký tài khoản</h3>
            {events?.length ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {events.map((e, i) => (
                  <li key={i}>
                    <span className="text-slate-400">{formatDateTime(e.created_at)}</span> · {accountActions[e.action] ?? e.action} ·{' '}
                    {e.actor_name ?? 'Hệ thống'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Chưa có thao tác nào.</p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section id="sua-thong-tin" aria-label="Sửa thông tin" className="card scroll-mt-24 p-5">
            <h3 className="mb-3 font-bold">Sửa thông tin</h3>
            <ActionForm key={`${member.full_name}|${member.phone}|${member.email}`} action={updateStaffAction.bind(null, member.id)} className="space-y-3">
              <div>
                <label htmlFor="fullName" className="label">Họ và tên *</label>
                <input id="fullName" name="fullName" required maxLength={100} defaultValue={member.full_name ?? ''} className="input" />
              </div>
              <div>
                <label htmlFor="phone" className="label">Số điện thoại *</label>
                <input id="phone" name="phone" type="tel" required defaultValue={member.phone ?? ''} className="input" />
              </div>
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input id="email" name="email" type="email" defaultValue={member.email ?? ''} className="input" />
              </div>
              <SubmitButton className="btn-outline w-full">Lưu thông tin</SubmitButton>
            </ActionForm>
          </section>

          {isMe ? (
            <p className="card p-5 text-sm text-slate-600">
              Đổi mật khẩu của bạn ở{' '}
              <Link href="/account" className="font-semibold text-ocean-700 underline">
                Tài khoản của tôi
              </Link>
              . Bạn không thể tự đổi vai trò hay tự xóa tài khoản của mình.
            </p>
          ) : (
            <>
              <section aria-label="Vai trò" className="card p-5">
                <h3 className="mb-1 font-bold">Vai trò</h3>
                <p className="mb-3 text-xs text-slate-500">Chuyển thành Khách hàng: tài khoản mất quyền vào trang quản trị ngay và chuyển sang danh mục Khách hàng.</p>
                <RoleForm target={{ id: member.id, role: member.role, name }} />
              </section>

              <section className="card p-5">
                <h3 className="mb-1 font-bold">Mật khẩu</h3>
                <p className="mb-3 text-xs text-slate-500">Nhân viên quên mật khẩu: cấp mật khẩu mới rồi gửi riêng cho nhân viên.</p>
                <ResetStaffPassword userId={member.id} name={name} />
              </section>

              <DeleteAccount
                id="xoa-nhan-vien"
                title="Xóa nhân viên"
                description={
                  <p>
                    Xóa vĩnh viễn tài khoản – người này không đăng nhập được nữa. Đơn, phiếu tham vấn, khách quan tâm người này đã xử lý vẫn giữ
                    tên người xử lý. Chỉ muốn thu quyền: đổi vai trò thành Khách hàng.
                  </p>
                }
                confirmLabel="Gõ lại số điện thoại để xác nhận"
                confirmValue={deleteConfirmValue(member)}
                blockedMessage={null}
                action={deleteStaffAction.bind(null, member.id)}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
