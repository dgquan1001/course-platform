import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { formatPrice, hotlineHref, siteConfig } from '@/lib/site-config'
import { ArrowRightIcon, BookIcon, CheckIcon, ClockIcon } from '@/components/icons'

export const metadata: Metadata = { title: 'Khóa học của tôi' }

type CourseRow = {
  id: string
  title: string
  description: string | null
  price: number
  lessons: { count: number }[]
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { registered?: string }
}) {
  const supabase = createClient()
  const user = (await getCurrentUser())!

  let unlocked: CourseRow[] = []
  type RegistrationRow = { id: string; title: string; amount: number | null; note: string | null; course: CourseRow | null }
  let pending: RegistrationRow[] = []
  let rejected: RegistrationRow[] = []

  const courseFields = 'id, title, description, price, lessons(count)'

  if (user.isAdmin) {
    const { data } = await supabase.from('courses').select(courseFields).order('sort_order')
    unlocked = (data as CourseRow[]) ?? []
  } else {
    const { data } = await supabase
      .from('registrations')
      .select(`id, status, course_title, amount, review_note, courses(${courseFields})`)
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
        course,
      }
    })
    const seen = new Set<string>()
    unlocked = rows
      .filter((r) => r.status === 'approved' && r.course && !seen.has(r.course.id) && seen.add(r.course.id))
      .map((r) => r.course!)
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
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="card group flex flex-col p-6 transition hover:border-ocean-200 hover:shadow-md"
                >
                  <h3 className="text-lg font-bold group-hover:text-ocean-700">{course.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{course.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <BookIcon className="h-4 w-4" /> {course.lessons?.[0]?.count ?? 0} bài học
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-ocean-700">
                      Vào học <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-slate-600">
                {pending.length
                  ? 'Khóa học sẽ xuất hiện ở đây sau khi được xác nhận.'
                  : 'Bạn chưa có khóa học nào.'}
              </p>
              <Link href="/register" className="btn-gold mt-5">
                Đăng ký khóa học
              </Link>
            </div>
          )}
        </section>

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

        {!!unlocked.length && !user.isAdmin && (
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
