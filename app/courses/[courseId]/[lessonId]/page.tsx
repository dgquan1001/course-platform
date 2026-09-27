import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVideoEmbed } from '@/lib/video'
import { lessonLabel, loadLearning } from '@/lib/progress'
import { lockReason } from '@/lib/courses'
import ProgressBar from '@/components/ProgressBar'
import SessionOutline from '@/components/SessionOutline'
import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@/components/icons'
import { completeLessonAction, uncompleteLessonAction } from '../../actions'

// Trình học (ADR-013, SCR-19): video + hướng dẫn bên trái, cột "Nội dung khóa học" theo buổi bên phải (điện thoại: phía dưới).
// Bài của buổi bị khóa không đọc được link video (RLS can_view_lesson) → hiện lý do khóa.
export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { courseId: string; lessonId: string }
  searchParams: { finished?: string }
}) {
  const learning = await loadLearning(params.courseId)
  const lessonPath = `/courses/${params.courseId}/${params.lessonId}`

  // Khóa miễn phí xem không cần đăng nhập; khóa khác phải đăng nhập (trang không chặn ở middleware)
  if (!learning) {
    const {
      data: { user },
    } = await createClient().auth.getUser()
    if (!user) redirect(`/login?next=${encodeURIComponent(lessonPath)}`)
  } else {
    if (!learning.user && learning.course.kind !== 'free') redirect(`/login?next=${encodeURIComponent(lessonPath)}`)
    if (learning.course.kind === 'premium') redirect(`/khoa-hoc/${params.courseId}`)
  }

  const index = learning ? learning.lessons.findIndex((l) => l.id === params.lessonId) : -1
  const outlineLesson = learning?.lessons[index]

  // Không đọc được khóa / không có trong đề cương: khóa đang ẩn mà không có quyền, bài đã xóa, sai đường dẫn
  if (!learning || !outlineLesson) {
    return (
      <main className="container-page py-20 text-center">
        <p className="text-slate-600">Không tìm thấy bài học hoặc khóa học chưa được mở cho bạn.</p>
        <Link href={`/courses/${params.courseId}`} className="btn-outline mt-6">
          Quay lại khóa học
        </Link>
      </main>
    )
  }

  const { course, sessions, lessons, done, mode, canTick, progress } = learning
  const session = sessions.find((s) => s.lessons.some((l) => l.id === params.lessonId))!
  const sessionIndex = sessions.indexOf(session)
  const positionInSession = session.lessons.findIndex((l) => l.id === params.lessonId)
  const { data: lesson } = await createClient()
    .from('lessons')
    .select('title, description, video_url')
    .eq('id', params.lessonId)
    .maybeSingle()
  const locked = !lesson || session.lock !== 'open'
  const video = lesson?.video_url ? getVideoEmbed(lesson.video_url) : null
  const isDone = done.has(params.lessonId)
  const prev = lessons[index - 1]
  const next = lessons[index + 1]
  const nextOpen = next && sessions.find((s) => s.lessons.some((l) => l.id === next.id))?.lock === 'open'
  const lessonHref = (id: string) => `/courses/${params.courseId}/${id}`
  // Hết bài đã mở (tick xong bài cuối của buổi cuối được học)
  const finished = searchParams.finished === '1' && isDone && !(next && nextOpen)
  const nextLabel = lessonLabel(sessions, progress.next_lesson_id)

  return (
    <main className="container-page py-4 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/courses/${params.courseId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700">
          <ArrowLeftIcon className="h-4 w-4" /> {course.title}
        </Link>
        {mode === 'preview' ? (
          <span className="badge bg-violet-100 text-violet-700">Chế độ xem trước (nhân viên / admin)</span>
        ) : learning.user ? (
          <ProgressBar done={progress.done} total={progress.total} className="w-48" />
        ) : (
          <Link href={`/login?next=${encodeURIComponent(lessonPath)}`} className="text-sm font-semibold text-ocean-700 hover:underline">
            Đăng nhập để lưu tiến độ
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="-mx-4 overflow-hidden bg-ocean-950 sm:mx-0 sm:rounded-2xl">
            {locked ? (
              <div className="grid aspect-video place-items-center px-6 text-center text-ocean-50">
                <div>
                  <p className="text-3xl" aria-hidden="true">
                    🔒
                  </p>
                  <p className="mt-2 font-semibold">{lockReason(session.lock === 'open' ? 'access' : session.lock, sessions[sessionIndex - 1])}</p>
                  {session.lock === 'previous' && progress.next_lesson_id && (
                    <Link href={lessonHref(progress.next_lesson_id)} className="btn-gold btn-sm mt-4">
                      Tiếp tục {nextLabel}
                    </Link>
                  )}
                  {(session.lock === 'purchase' || session.lock === 'access') && (
                    <Link href={`/register?course=${params.courseId}`} className="btn-gold btn-sm mt-4">
                      Gia hạn / đăng ký gói
                    </Link>
                  )}
                </div>
              </div>
            ) : video ? (
              <div className={video.vertical ? 'mx-auto aspect-[9/16] w-full max-w-sm' : 'aspect-video'}>
                <iframe
                  src={video.src}
                  title={outlineLesson.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="grid aspect-video place-items-center px-6 text-center text-sm text-ocean-100">
                Video bài học đang được cập nhật, vui lòng quay lại sau.
              </p>
            )}
          </div>

          <p className="mt-6 text-sm font-semibold text-gold-700">
            {session.title} · Bài {positionInSession + 1}/{session.lessons.length}
          </p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{outlineLesson.title}</h1>
          {!locked && lesson?.description && <p className="mt-3 whitespace-pre-line text-slate-700">{lesson.description}</p>}

          {finished && (
            <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-lg font-bold text-emerald-800">Chúc mừng! Bạn đã hoàn thành các buổi tập đã mở 🎉</p>
              <p className="mt-1 text-sm text-emerald-900">
                {progress.done}/{progress.total} bài. Hãy duy trì luyện tập và liên hệ trung tâm nếu cần bác sĩ tư vấn.
              </p>
              {mode === 'program' && (
                <Link href={`/register?course=${params.courseId}`} className="btn-gold btn-sm mt-4">
                  Gia hạn để tập tiếp
                </Link>
              )}
            </div>
          )}

          <div className="sticky bottom-0 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:static sm:mx-0 sm:px-0">
            {prev ? (
              <Link href={lessonHref(prev.id)} className="btn-outline">
                <ArrowLeftIcon className="h-4 w-4" /> Bài trước
              </Link>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center gap-2">
              {canTick && !locked && !isDone && (
                <form action={completeLessonAction.bind(null, params.courseId, params.lessonId, next?.id ?? null)}>
                  <SubmitButton className="btn-gold">
                    <CheckIcon className="h-4 w-4" /> {next ? 'Hoàn thành & bài tiếp theo' : 'Hoàn thành bài tập'}
                  </SubmitButton>
                </form>
              )}
              {canTick && !locked && isDone && (
                <>
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <CheckIcon className="h-4 w-4" /> Đã tập
                  </span>
                  <ActionForm action={uncompleteLessonAction.bind(null, params.courseId, params.lessonId)}>
                    <SubmitButton
                      className="btn-ghost btn-sm text-slate-500"
                      confirmMessage="Bỏ đánh dấu bài này? Buổi sau có thể bị khóa lại cho tới khi bạn tập lại bài này."
                    >
                      Bỏ đánh dấu
                    </SubmitButton>
                  </ActionForm>
                </>
              )}
              {next && (!canTick || isDone || locked) && (
                <Link href={lessonHref(next.id)} className="btn-primary">
                  Bài tiếp theo <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <p className="border-b border-slate-100 px-4 py-3 font-bold text-ocean-900">Nội dung khóa học</p>
            <div className="max-h-[70vh] overflow-y-auto">
              <SessionOutline sessions={sessions} currentLessonId={params.lessonId} done={done} linkTo={lessonHref} showProgress={canTick} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
