import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeftIcon, ArrowRightIcon, PlayIcon, ShieldIcon } from '@/components/icons'

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string }
}) {
  const supabase = createClient()

  const [{ data: course }, { data: canAccess }, { data: lessons }, { data: auth }] = await Promise.all([
    supabase.from('courses').select('title, description, kind').eq('id', params.courseId).maybeSingle(),
    supabase.rpc('has_course_access', { target_course: params.courseId }),
    supabase
      .from('lessons')
      .select('id, title, description')
      .eq('course_id', params.courseId)
      .order('sort_order', { ascending: true }),
    supabase.auth.getUser(),
  ])

  // Khóa miễn phí: ai cũng xem được. Khóa khác: phải đăng nhập (trang khóa không chặn ở middleware)
  const isFree = course?.kind === 'free'
  if (!auth.user && !isFree) redirect(`/login?next=${encodeURIComponent(`/courses/${params.courseId}`)}`)
  if (!course) notFound()
  // Khóa premium không có bài học: chuyển về trang giới thiệu (liên hệ Zalo)
  if (course.kind === 'premium') redirect(`/khoa-hoc/${params.courseId}`)
  const hasAccess = isFree || canAccess

  return (
    <main>
      <section className="border-b border-ocean-100 bg-gradient-to-b from-ocean-50 to-white">
        <div className="container-page py-8 sm:py-10">
          <Link
            href={auth.user ? '/courses' : `/khoa-hoc/${params.courseId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700"
          >
            <ArrowLeftIcon className="h-4 w-4" /> {auth.user ? 'Khóa học của tôi' : 'Giới thiệu khóa học'}
          </Link>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{course.title}</h1>
          {course.description && <p className="mt-2 max-w-3xl text-slate-600">{course.description}</p>}
          {hasAccess && !!lessons?.length && (
            <Link href={`/courses/${params.courseId}/${lessons[0].id}`} className="btn-primary mt-6">
              Bắt đầu học <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="container-page max-w-4xl py-8 sm:py-10">
        {!hasAccess ? (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold-100 text-gold-700">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-ocean-900">Khóa học chưa được mở cho tài khoản của bạn</p>
            <p className="mt-1 text-sm text-slate-500">
              Nếu bạn đã đăng ký, vui lòng chờ trung tâm xác nhận chuyển khoản.
            </p>
            <Link href={`/register?course=${params.courseId}`} className="btn-gold mt-5">
              Đăng ký khóa học này
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-bold">
              Nội dung khóa học <span className="font-normal text-slate-500">({lessons?.length ?? 0} bài)</span>
            </h2>
            <ol className="card divide-y divide-slate-100 overflow-hidden">
              {lessons?.map((lesson, i) => (
                <li key={lesson.id}>
                  <Link
                    href={`/courses/${params.courseId}/${lesson.id}`}
                    className="group flex items-center gap-4 px-4 py-4 transition hover:bg-ocean-50/70 sm:px-5"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ocean-50 font-bold text-ocean-600 transition group-hover:bg-ocean-600 group-hover:text-white">
                      <span className="group-hover:hidden">{i + 1}</span>
                      <PlayIcon className="hidden h-4 w-4 group-hover:block" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ocean-900">{lesson.title}</span>
                      {lesson.description && (
                        <span className="block truncate text-sm text-slate-500">{lesson.description}</span>
                      )}
                    </span>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-ocean-600" />
                  </Link>
                </li>
              ))}
              {!lessons?.length && <li className="p-8 text-center text-slate-500">Khóa học chưa có bài nào.</li>}
            </ol>
          </>
        )}
      </section>
    </main>
  )
}
