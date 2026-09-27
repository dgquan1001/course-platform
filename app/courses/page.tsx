import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { formatPrice, hotlineHref, siteConfig } from '@/lib/site-config'
import { ArrowRightIcon, BookIcon, CheckIcon, ClockIcon } from '@/components/icons'
import { daysLeft, formatDate, type OutlineRow } from '@/lib/courses'
import { getCourseProgress, type CourseProgress } from '@/lib/progress'
import ProgressBar from '@/components/ProgressBar'

export const metadata: Metadata = { title: 'Khóa học của tôi' }

type CourseRow = {
  id: string
  title: string
  description: string | null
  price: number
  kind: string
  lessons: { count: number }[]
}

// Khóa đã mở kèm hạn học: null = không thời hạn (đơn cũ không có gói, hoặc nhân viên / admin xem trước)
type OwnedCourse = CourseRow & { accessUntil: string | null; progress?: CourseProgress; nextLabel?: string | null }

// "Buổi X – Bài Y" của bài tiếp theo (theo đề cương course_outline)
async function withProgress(supabase: ReturnType<typeof createClient>, course: OwnedCourse): Promise<OwnedCourse> {
  const [progress, { data: outline }] = await Promise.all([
    getCourseProgress(course.id),
    supabase.rpc('course_outline', { target_course: course.id }),
  ])
  const rows = (outline ?? []) as OutlineRow[]
  const next = rows.find((r) => r.id === progress.next_lesson_id)
  const nextLabel = next
    ? `${next.session_title ?? 'Bài'} – Bài ${rows.filter((r) => r.session_id === next.session_id).findIndex((r) => r.id === next.id) + 1}`
    : null
  return { ...course, progress, nextLabel }
}

// Nhãn hạn học: còn > 7 ngày (xám), ≤ 7 ngày (vàng – nhắc gia hạn), đã hết hạn (đỏ)
function AccessBadge({ until }: { until: string | null }) {
  const days = daysLeft(until)
  if (days === null) return null
  if (days <= 0) return <span className="badge bg-red-100 text-red-700">Đã hết hạn {formatDate(until!)}</span>
  return (
    <span className={`badge ${days <= 7 ? 'bg-gold-100 text-gold-800' : 'bg-slate-100 text-slate-600'}`} title={`Hạn học: ${formatDate(until!)}`}>
      Còn {days} ngày
    </span>
  )
}

function CourseTile({ course, expired }: { course: OwnedCourse; expired?: boolean }) {
  const renewable = course.kind === 'program' && course.accessUntil !== null
  return (
    <div className="card flex flex-col p-6 transition hover:border-ocean-200 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <AccessBadge until={course.accessUntil} />
      </div>
      <h3 className="mt-2 text-lg font-bold">
        <Link href={`/courses/${course.id}`} className="hover:text-ocean-700">
          {course.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{course.description}</p>
      {course.progress && <ProgressBar done={course.progress.done} total={course.progress.total} className="mt-4" />}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm">
        {expired ? (
          <Link href={`/courses/${course.id}`} className="font-semibold text-slate-600 hover:text-ocean-700">
            Xem khóa học
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500">
            <BookIcon className="h-4 w-4" /> {course.lessons?.[0]?.count ?? 0} bài học
          </span>
        )}
        <span className="flex gap-2">
          {renewable && (
            <Link href={`/register?course=${course.id}`} className={expired ? 'btn-gold btn-sm' : 'btn-outline btn-sm'}>
              {expired ? 'Gia hạn để tập tiếp' : 'Gia hạn'}
            </Link>
          )}
          {!expired &&
            (course.progress?.done && course.progress.next_lesson_id ? (
              // Đang tập dở: vào thẳng bài tiếp theo
              <Link href={`/courses/${course.id}/${course.progress.next_lesson_id}`} className="btn-primary btn-sm">
                Tiếp tục {course.nextLabel} <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <Link href={`/courses/${course.id}`} className="btn-primary btn-sm">
                Vào học <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ))}
        </span>
      </div>
    </div>
  )
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { registered?: string }
}) {
  const supabase = createClient()
  const user = (await getCurrentUser())!

  let unlocked: OwnedCourse[] = []
  let expired: OwnedCourse[] = []
  type RegistrationRow = { id: string; title: string; amount: number | null; note: string | null; course: CourseRow | null }
  let pending: RegistrationRow[] = []
  let rejected: RegistrationRow[] = []

  const courseFields = 'id, title, description, price, kind, lessons(count)'

  // Nhân viên và admin xem trước được mọi khóa học
  if (user.isStaff) {
    const { data } = await supabase.from('courses').select(courseFields).order('sort_order')
    unlocked = ((data as CourseRow[]) ?? []).map((c) => ({ ...c, accessUntil: null }))
  } else {
    const { data } = await supabase
      .from('registrations')
      .select(`id, status, course_title, amount, review_note, plan_months, access_until, courses(${courseFields})`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const rows = (data ?? []).map((r) => {
      const course = r.courses as unknown as CourseRow | null
      return {
        id: r.id,
        status: r.status as string,
        // Tên khóa & học phí lưu trong đơn: vẫn hiển thị khi khóa học đã bị xóa
        title: course?.title ?? r.course_title ?? 'Khóa học',
        amount: (r.amount as number | null) ?? course?.price ?? null,
        // Lý do admin ghi khi từ chối / thu hồi
        note: r.review_note as string | null,
        // Đơn cũ không có gói: không thời hạn
        until: r.plan_months ? (r.access_until as string | null) : null,
        unlimited: !r.plan_months,
        course,
      }
    })
    // Gộp các đơn đã duyệt theo khóa: hạn học = hạn xa nhất (gia hạn cộng dồn), có đơn không thời hạn thì không hết hạn
    const owned = new Map<string, OwnedCourse & { unlimited: boolean }>()
    for (const r of rows) {
      if (r.status !== 'approved' || !r.course) continue
      const prev = owned.get(r.course.id)
      const unlimited = (prev?.unlimited ?? false) || r.unlimited
      const accessUntil = unlimited ? null : [prev?.accessUntil, r.until].filter(Boolean).sort().at(-1) ?? null
      owned.set(r.course.id, { ...r.course, accessUntil, unlimited })
    }
    // Tiến độ từng khóa (vẫn đọc được khi đã hết hạn)
    const courses = await Promise.all([...owned.values()].map((c) => withProgress(supabase, c)))
    for (const c of courses) {
      if (c.accessUntil && new Date(c.accessUntil) <= new Date()) expired.push(c)
      else unlocked.push(c)
    }
    pending = rows.filter((r) => r.status === 'pending')
    rejected = rows.filter((r) => r.status === 'rejected')
  }

  return (
    <main>
      <section className="border-b border-ocean-100 bg-gradient-to-b from-ocean-50 to-white">
        <div className="container-page py-8 sm:py-10">
          <p className="text-sm text-slate-500">Xin chào, {user.fullName || user.email || user.phone}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Khóa học của tôi</h1>
        </div>
      </section>

      <div className="container-page space-y-10 py-8 sm:py-10">
        {searchParams.registered === '1' && (
          <div role="status" className="alert-success flex gap-3 text-base">
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Đăng ký thành công!</p>
              <p className="mt-1 text-sm">
                Trung tâm đang kiểm tra chuyển khoản của bạn. Khóa học sẽ tự động mở tại
                trang này ngay sau khi được xác nhận.
              </p>
            </div>
          </div>
        )}

        {!!pending.length && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Đang chờ xác nhận</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {pending.map((r) => (
                <div key={r.id} className="card flex items-center gap-4 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
                    <ClockIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ocean-900">{r.title}</p>
                    {r.course ? (
                      <p className="text-sm text-slate-500">Đang kiểm tra chuyển khoản</p>
                    ) : (
                      // Khóa đã bị xóa sau khi khách chuyển khoản: hướng dẫn liên hệ để hoàn tiền
                      <p className="text-sm text-red-700">
                        Khóa học đã ngừng. Vui lòng gọi{' '}
                        <a href={hotlineHref} className="font-semibold underline">{siteConfig.hotline}</a> để được hỗ trợ hoàn tiền.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-lg font-bold">Khóa học đã mở</h2>
          {unlocked.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {unlocked.map((course) => (
                <CourseTile key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-slate-600">
                {pending.length
                  ? 'Khóa học sẽ xuất hiện ở đây sau khi được xác nhận.'
                  : expired.length
                    ? 'Không có khóa học nào đang còn hạn.'
                    : 'Bạn chưa có khóa học nào.'}
              </p>
              <Link href="/register" className="btn-gold mt-5">
                Đăng ký khóa học
              </Link>
            </div>
          )}
        </section>

        {!!expired.length && (
          <section aria-label="Gói đã hết hạn">
            <h2 className="mb-1 text-lg font-bold">Gói đã hết hạn</h2>
            <p className="mb-3 text-sm text-slate-500">
              Tiến độ của bạn vẫn được giữ. Gia hạn để tập tiếp từ buổi đang dở.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {expired.map((course) => (
                <CourseTile key={course.id} course={course} expired />
              ))}
            </div>
          </section>
        )}

        {!!rejected.length && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Đơn chưa được xác nhận</h2>
            <div className="space-y-3">
              {rejected.map((r) => (
                <div key={r.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-ocean-900">{r.title}</p>
                    {r.note && <p className="mt-0.5 text-sm text-slate-700">Lý do: {r.note}</p>}
                    <p className="text-sm text-slate-500">
                      Chưa xác nhận được chuyển khoản. Vui lòng liên hệ{' '}
                      <a href={hotlineHref} className="font-semibold text-ocean-700">{siteConfig.hotline}</a>.
                    </p>
                  </div>
                  {r.amount != null && (
                    <span className="text-sm font-semibold text-slate-500">{formatPrice(r.amount)}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!!unlocked.length && !user.isStaff && (
          <div className="text-center">
            <Link href="/register" className="btn-outline">
              Đăng ký thêm khóa học
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
