import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/courses'
import { lessonLabel, loadLearning } from '@/lib/progress'
import ProgressBar from '@/components/ProgressBar'
import SessionOutline from '@/components/SessionOutline'
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, ShieldIcon } from '@/components/icons'

// Trang khóa của bệnh nhân (SCR-08/18): tiến độ, nút "Tiếp tục Buổi X – Bài Y", nội dung theo buổi (🔒 buổi chưa mở).
export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const learning = await loadLearning(params.courseId)
  const path = `/courses/${params.courseId}`

  // Khóa miễn phí: ai cũng xem được. Khóa khác: phải đăng nhập (trang khóa không chặn ở middleware)
  if (!learning) {
    const {
      data: { user },
    } = await createClient().auth.getUser()
    if (!user) redirect(`/login?next=${encodeURIComponent(path)}`)
    notFound()
  }
  const { course, user, sessions, lessons, done, hasAccess, mode, progress } = learning
  if (!user && course.kind !== 'free') redirect(`/login?next=${encodeURIComponent(path)}`)
  // Khóa premium không có bài học: chuyển về trang giới thiệu (liên hệ Zalo)
  if (course.kind === 'premium') redirect(`/khoa-hoc/${params.courseId}`)

  // Đã từng được duyệt nhưng gói hết hạn: vẫn xem đề cương + bài đã tick, có nút gia hạn
  let expiredAt: string | null = null
  if (!hasAccess && user) {
    const { data: approved } = await createClient()
      .from('registrations')
      .select('access_until')
      .eq('user_id', user.id)
      .eq('course_id', params.courseId)
      .eq('status', 'approved')
      .not('access_until', 'is', null)
      .order('access_until', { ascending: false })
      .limit(1)
    expiredAt = approved?.[0]?.access_until ?? null
  }

  const lessonHref = (id: string) => `${path}/${id}`
  const started = progress.done > 0
  const nextId = progress.next_lesson_id ?? lessons[0]?.id
  const tracking = !!user && mode !== 'preview'

  return (
    <main>
      <section className="border-b border-ocean-100 bg-gradient-to-b from-ocean-50 to-white">
        <div className="container-page py-8 sm:py-10">
          <Link
            href={user ? '/courses' : `/khoa-hoc/${params.courseId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700"
          >
            <ArrowLeftIcon className="h-4 w-4" /> {user ? 'Khóa học của tôi' : 'Giới thiệu khóa học'}
          </Link>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{course.title}</h1>
          {course.description && <p className="mt-2 max-w-3xl text-slate-600">{course.description}</p>}
          {hasAccess && tracking && <ProgressBar done={progress.done} total={progress.total} className="mt-4 max-w-sm" />}
          {hasAccess && !!nextId && (
            <Link href={lessonHref(nextId)} className="btn-primary mt-6">
              {started && progress.next_lesson_id ? `Tiếp tục ${lessonLabel(sessions, progress.next_lesson_id)}` : 'Bắt đầu học'}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="container-page max-w-4xl py-8 sm:py-10">
        {!hasAccess && expiredAt ? (
          <>
            <div role="status" className="card flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
                <ClockIcon className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-ocean-900">Gói tập đã hết hạn ngày {formatDate(expiredAt)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Tiến độ của bạn vẫn được giữ ({progress.done}/{progress.total} bài). Gia hạn để xem video và tập tiếp.
                </p>
              </div>
              <Link href={`/register?course=${params.courseId}`} className="btn-gold">
                Gia hạn để tập tiếp
              </Link>
            </div>
            {!!sessions.length && (
              <div className="card mt-6 overflow-hidden">
                <SessionOutline sessions={sessions} done={done} linkTo={null} label="Đề cương khóa học" />
              </div>
            )}
          </>
        ) : !hasAccess ? (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold-100 text-gold-700">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-ocean-900">Khóa học chưa được mở cho tài khoản của bạn</p>
            <p className="mt-1 text-sm text-slate-500">Nếu bạn đã đăng ký, vui lòng chờ trung tâm xác nhận chuyển khoản.</p>
            <Link href={`/register?course=${params.courseId}`} className="btn-gold mt-5">
              Đăng ký khóa học này
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-bold">
              Nội dung khóa học{' '}
              <span className="font-normal text-slate-500">
                ({sessions.length} buổi · {lessons.length} bài)
              </span>
            </h2>
            <div className="card overflow-hidden">
              <SessionOutline sessions={sessions} done={done} linkTo={lessonHref} showProgress={tracking} />
              {!lessons.length && <p className="p-8 text-center text-slate-500">Khóa học chưa có bài nào.</p>}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
