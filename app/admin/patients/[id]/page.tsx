import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireStaffPage } from '@/lib/auth'
import { formatPrice } from '@/lib/site-config'
import { daysLeft } from '@/lib/courses'
import { accountSourceLabel, displayName, formatDateTime, formatDay, paymentLabel, registrationSourceLabel } from '@/lib/format'
import StatusBadge from '@/components/StatusBadge'
import ProgressRing from '@/components/ProgressRing'
import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import { ArrowLeftIcon } from '@/components/icons'
import { getPlanOptions } from '../data'
import GrantFields from '../GrantFields'
import { grantPlanAction, updatePatientAction } from '../actions'
import ResetPassword from './ResetPassword'

export const metadata: Metadata = { title: 'Hồ sơ bệnh nhân' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type CourseProgressRow = {
  course_id: string
  course_title: string
  until: string | null
  unlimited: boolean
  purchased: number | null
  done: number
  total: number
  last_activity: string | null
}

const accountActions: Record<string, string> = {
  created: 'Tạo tài khoản',
  password_reset: 'Cấp lại mật khẩu',
  profile_updated: 'Sửa thông tin',
}

// Hồ sơ bệnh nhân (SCR-24): thông tin, gói & hạn học, tiến độ, lịch sử đơn, phiếu tham vấn, nhật ký tài khoản.
// Nhân viên / admin cấp gói, sửa thông tin, cấp lại mật khẩu.
export default async function PatientPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  await requireStaffPage()
  if (!UUID.test(params.id)) notFound()
  const supabase = await createClient()

  const { data: patient } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, phone, source, created_at, created_by, consent_at, must_change_password')
    .eq('id', params.id)
    .maybeSingle()
  if (!patient) notFound()

  const [{ data: creator }, { data: note }, { data: progress }, { data: regs }, { data: consultations }, { data: events }, plans] = await Promise.all([
    patient.created_by
      ? supabase.from('profiles').select('full_name, email, phone').eq('id', patient.created_by).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('patient_notes').select('note, updated_by_name, updated_at').eq('user_id', patient.id).maybeSingle(),
    supabase.rpc('patient_progress', { p_user: patient.id }),
    supabase
      .from('registrations')
      .select('id, status, course_title, amount, plan_months, plan_sessions, source, payment_method, payment_note, access_until, reviewed_by_name, created_at, courses(title)')
      .eq('user_id', patient.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('consultations')
      .select('id, course_title, status, answers, note, created_at, handled_by_name')
      .eq('user_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('account_events').select('action, actor_name, created_at').eq('user_id', patient.id).order('created_at', { ascending: false }).limit(20),
    getPlanOptions(),
  ])
  const courses = (progress ?? []) as CourseProgressRow[]
  const isPatient = patient.role === 'user'
  const name = displayName(patient)

  return (
    <div className="space-y-5">
      <Link href="/admin/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700">
        <ArrowLeftIcon className="h-4 w-4" /> Danh sách bệnh nhân
      </Link>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">{name}</h2>
          <StatusBadge status={isPatient ? `source_${patient.source}` : patient.role} />
          {patient.must_change_password && <span className="badge bg-gold-100 text-gold-800">Chưa đổi mật khẩu được cấp</span>}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {patient.phone && (
            <>
              <a href={`tel:${patient.phone}`} className="font-semibold text-ocean-700 hover:underline">{patient.phone}</a>
              <a href={`https://zalo.me/${patient.phone}`} target="_blank" rel="noopener noreferrer" className="text-ocean-700 hover:underline">
                Nhắn Zalo
              </a>
            </>
          )}
          <span className="text-slate-500">{patient.email ?? 'Không có email'}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Nguồn: {accountSourceLabel(patient.source)} · Tạo ngày {formatDay(patient.created_at)}
          {creator && ` bởi ${displayName(creator)}`}
          {patient.consent_at && ` · Đồng ý chính sách ${formatDay(patient.consent_at)}`}
        </p>
        {note?.note && (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold">Ghi chú nội bộ:</span> {note.note}
            <span className="mt-1 block text-xs text-slate-400">
              {note.updated_by_name ?? 'Hệ thống'} · {formatDateTime(note.updated_at)}
            </span>
          </p>
        )}
      </section>

      {!isPatient ? (
        <p className="card p-6 text-sm text-slate-600">Đây là tài khoản nhân viên / admin – quản lý vai trò ở tab &quot;Nhân viên &amp; Admin&quot;.</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <section aria-label="Gói và tiến độ" className="card p-5">
              <h3 className="font-bold">Gói & tiến độ</h3>
              {courses.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {courses.map((c) => {
                    const days = c.unlimited ? null : daysLeft(c.until)
                    return (
                      <li key={c.course_id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-ocean-900">{c.course_title}</p>
                          {c.unlimited ? (
                            <span className="badge bg-slate-100 text-slate-600">Không thời hạn</span>
                          ) : days !== null && days <= 0 ? (
                            <span className="badge bg-red-100 text-red-700">Đã hết hạn {formatDay(c.until!)}</span>
                          ) : (
                            <span className={`badge ${days !== null && days <= 7 ? 'bg-gold-100 text-gold-800' : 'bg-emerald-100 text-emerald-700'}`}>
                              Còn {days} ngày · hạn {formatDay(c.until!)}
                            </span>
                          )}
                        </div>
                        <ProgressRing done={c.done} total={c.total} className="mt-2" />
                        <p className="mt-1 text-xs text-slate-400">
                          {c.purchased ? `${c.purchased} buổi đã mua` : 'Mở mọi buổi'} ·{' '}
                          {c.last_activity ? `tập gần nhất ${formatDateTime(c.last_activity)}` : 'chưa tập'}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Chưa có gói nào được duyệt.</p>
              )}
            </section>

            <section aria-label="Lịch sử đơn" className="card overflow-x-auto p-5">
              <h3 className="font-bold">Lịch sử đơn / gói</h3>
              {regs?.length ? (
                <table className="mt-3 w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Ngày</th>
                      <th className="py-2 pr-3">Chương trình</th>
                      <th className="py-2 pr-3">Gói</th>
                      <th className="py-2 pr-3 text-right">Số tiền</th>
                      <th className="py-2 pr-3">Thanh toán</th>
                      <th className="py-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {regs.map((r) => (
                      <tr key={r.id} className="align-top">
                        <td className="whitespace-nowrap py-2 pr-3 text-slate-500">{formatDay(r.created_at)}</td>
                        <td className="py-2 pr-3">{(r.courses as unknown as { title: string } | null)?.title ?? r.course_title ?? 'Khóa học'}</td>
                        <td className="whitespace-nowrap py-2 pr-3">{r.plan_months ? `${r.plan_months} tháng · ${r.plan_sessions} buổi` : '—'}</td>
                        <td className="whitespace-nowrap py-2 pr-3 text-right font-semibold text-gold-700">{r.amount != null ? formatPrice(r.amount) : '—'}</td>
                        <td className="py-2 pr-3 text-xs text-slate-500">
                          {registrationSourceLabel(r.source)} · {paymentLabel(r.payment_method)}
                          {r.payment_note && <span className="block italic">{r.payment_note}</span>}
                        </td>
                        <td className="py-2">
                          <StatusBadge status={r.status} />
                          {r.reviewed_by_name && <span className="block text-xs text-slate-400">{r.reviewed_by_name}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Chưa có đơn nào.</p>
              )}
            </section>

            <section aria-label="Phiếu tham vấn của bệnh nhân" className="card p-5">
              <h3 className="font-bold">Phiếu tham vấn</h3>
              {consultations?.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {consultations.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={`consult_${c.status}`} />
                      <span className="text-slate-500">{formatDateTime(c.created_at)}</span>
                      <span>{c.course_title ?? 'Không chọn chương trình'}</span>
                      <Link href={`/admin/consultations?status=${c.status}#phieu-${c.id}`} className="text-ocean-700 hover:underline">
                        Xem
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Chưa gửi phiếu nào.</p>
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
                <p className="mt-2 text-sm text-slate-500">Chưa có thao tác nào của nhân viên.</p>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="card p-5">
              <h3 className="mb-3 font-bold">Cấp gói / Gia hạn</h3>
              <ActionForm action={grantPlanAction.bind(null, patient.id)} resetOnSuccess className="space-y-3">
                <GrantFields plans={plans} required />
                <SubmitButton className="btn-primary w-full">Cấp gói</SubmitButton>
              </ActionForm>
              <p className="mt-2 text-xs text-slate-400">Còn hạn thì cộng dồn vào hạn cũ; đã hết hạn thì tính từ bây giờ.</p>
            </section>

            <section className="card p-5">
              <h3 className="mb-3 font-bold">Sửa thông tin</h3>
              <ActionForm
                key={`${patient.full_name}|${patient.phone}|${patient.email}|${note?.note}`}
                action={updatePatientAction.bind(null, patient.id)}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="fullName" className="label">Họ và tên *</label>
                  <input id="fullName" name="fullName" required maxLength={100} defaultValue={patient.full_name ?? ''} className="input" />
                </div>
                <div>
                  <label htmlFor="phone" className="label">Số điện thoại *</label>
                  <input id="phone" name="phone" type="tel" required defaultValue={patient.phone ?? ''} className="input" />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input id="email" name="email" type="email" defaultValue={patient.email ?? ''} className="input" />
                </div>
                <div>
                  <label htmlFor="note" className="label">Ghi chú nội bộ</label>
                  <textarea id="note" name="note" rows={3} maxLength={1000} defaultValue={note?.note ?? ''} className="input" />
                </div>
                <SubmitButton className="btn-outline w-full">Lưu thông tin</SubmitButton>
              </ActionForm>
            </section>

            <section className="card p-5">
              <h3 className="mb-1 font-bold">Mật khẩu</h3>
              <p className="mb-3 text-xs text-slate-500">Bệnh nhân quên mật khẩu, không có email: cấp mật khẩu mới rồi gửi qua Zalo.</p>
              <ResetPassword userId={patient.id} name={name} />
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
