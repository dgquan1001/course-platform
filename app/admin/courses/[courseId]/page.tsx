import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeftIcon } from '@/components/icons'
import { isSupportedVideoUrl } from '@/lib/video'
import {
  createLesson,
  createSession,
  deleteLesson,
  deleteSession,
  duplicateSession,
  generateSkeleton,
  moveSession,
  updateLesson,
  updateSession,
} from '../../actions'
import { LessonFields } from '../fields'

type Lesson = { id: string; title: string; description: string | null; video_url: string | null; sort_order: number; session_id: string | null }
type Session = { id: string; title: string; description: string | null }

// Trạng thái video của bài tập: có video / chưa có video (khung mới tạo) / link cũ không hợp lệ
function VideoStatus({ url }: { url: string | null }) {
  if (!url) return <span className="text-xs font-semibold text-gold-700">Chưa có video</span>
  if (!isSupportedVideoUrl(url)) {
    return (
      // Bài nhập trước khi có kiểm tra link: học viên không xem được, admin cần sửa
      <p role="alert" className="text-sm font-semibold text-red-600">
        Link video không hợp lệ, học viên chưa xem được bài này. Hãy sửa lại link YouTube/TikTok.
      </p>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-ocean-600 hover:underline">
      {url}
    </a>
  )
}

function LessonItem({ lesson, index, courseId, sessions }: { lesson: Lesson; index: number; courseId: string; sessions: Session[] }) {
  return (
    <div className="card p-3">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ocean-50 text-xs font-bold text-ocean-600">{index}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ocean-900">{lesson.title}</p>
          <VideoStatus url={lesson.video_url} />
        </div>
        <Link href={`/courses/${courseId}/${lesson.id}`} className="btn-ghost btn-sm shrink-0">
          Xem thử
        </Link>
      </div>
      <details className="group mt-2 border-t border-slate-100 pt-2">
        <summary className="cursor-pointer list-none text-sm font-semibold text-ocean-700 hover:underline [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Sửa bài học</span>
          <span className="hidden group-open:inline">Đóng</span>
        </summary>
        <ActionForm
          key={JSON.stringify([lesson.title, lesson.video_url, lesson.description, lesson.sort_order, lesson.session_id])}
          action={updateLesson.bind(null, lesson.id)}
          className="mt-3 space-y-3"
        >
          <LessonFields values={lesson} sessions={sessions} />
          <SubmitButton>Lưu thay đổi</SubmitButton>
        </ActionForm>
        <ActionForm action={deleteLesson.bind(null, lesson.id)} className="mt-3 border-t border-dashed border-slate-200 pt-3">
          <SubmitButton
            className="btn-sm btn border border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-100"
            confirmMessage={`Xóa bài học "${lesson.title}"?`}
          >
            Xóa bài học
          </SubmitButton>
        </ActionForm>
      </details>
    </div>
  )
}

// Nội dung khóa: buổi → bài tập (ADR-013). Tạo khung "N buổi × M bài", thêm / sửa / xóa / đổi thứ tự / sao chép buổi.
export default async function AdminCourseContentPage({ params }: { params: { courseId: string } }) {
  const supabase = createClient()
  const [{ data: course }, { data: sessionRows }, { data: lessonRows }, { data: plans }] = await Promise.all([
    supabase.from('courses').select('id, title, status, kind').eq('id', params.courseId).maybeSingle(),
    supabase
      .from('course_sessions')
      .select('id, title, description')
      .eq('course_id', params.courseId)
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('lessons')
      .select('id, title, description, video_url, sort_order, session_id')
      .eq('course_id', params.courseId)
      .order('sort_order')
      .order('created_at'),
    supabase.from('course_plans').select('months, sessions').eq('course_id', params.courseId),
  ])
  if (!course) notFound()
  const sessions = (sessionRows ?? []) as Session[]
  const lessons = (lessonRows ?? []) as Lesson[]
  const lessonsOf = (sessionId: string | null) => lessons.filter((l) => l.session_id === sessionId)
  const orphans = lessonsOf(null)
  const missingVideos = lessons.filter((l) => !l.video_url).length
  // Gói dài nhất cần bao nhiêu buổi
  const longest = (plans ?? []).reduce((max, p) => (p.sessions > max.sessions ? p : max), { months: 0, sessions: 0 })

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700">
          <ArrowLeftIcon className="h-4 w-4" /> Tất cả khóa học
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">{course.title}</h2>
          <StatusBadge status={course.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {sessions.length} buổi · {lessons.length} bài tập
        </p>
        {(!!missingVideos || longest.sessions > sessions.length) && (
          <ul className="mt-2 space-y-1 text-sm font-medium text-gold-800">
            {!!missingVideos && <li>⚠ {missingVideos} bài chưa có video</li>}
            {longest.sessions > sessions.length && (
              <li>
                ⚠ Gói {longest.months} tháng cần {longest.sessions} buổi, hiện có {sessions.length}
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-label="Buổi tập" className="space-y-4">
          <ActionForm
            action={generateSkeleton.bind(null, course.id)}
            resetOnSuccess
            className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-ocean-200 bg-white p-4"
          >
            <p className="w-full text-sm font-semibold text-ocean-900">Tạo thêm buổi (nối tiếp sau buổi cuối)</p>
            <label className="text-xs text-slate-500">
              Số buổi
              <input name="session_count" type="number" min={1} max={200} required placeholder="12" className="input mt-0.5 w-24 py-1.5" />
            </label>
            <span className="pb-2 text-slate-400">×</span>
            <label className="text-xs text-slate-500">
              Số bài mỗi buổi
              <input name="lessons_per_session" type="number" min={1} max={20} required placeholder="6" className="input mt-0.5 w-24 py-1.5" />
            </label>
            <SubmitButton className="btn-primary btn-sm">Tạo khung</SubmitButton>
          </ActionForm>

          {sessions.map((session) => {
            const items = lessonsOf(session.id)
            return (
              <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4" data-testid="admin-session">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-ocean-900">
                    {session.title} <span className="text-sm font-normal text-slate-500">({items.length} bài)</span>
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    <ActionForm action={moveSession.bind(null, course.id, session.id, 'up')}>
                      <SubmitButton className="btn-ghost btn-sm" title="Chuyển lên">
                        ↑
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={moveSession.bind(null, course.id, session.id, 'down')}>
                      <SubmitButton className="btn-ghost btn-sm" title="Chuyển xuống">
                        ↓
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={duplicateSession.bind(null, course.id, session.id)}>
                      <SubmitButton className="btn-outline btn-sm">Sao chép buổi</SubmitButton>
                    </ActionForm>
                  </div>
                </div>
                {session.description && <p className="mt-1 text-sm text-slate-600">{session.description}</p>}
                <details className="group mt-2">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ocean-700 hover:underline [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Sửa buổi</span>
                    <span className="hidden group-open:inline">Đóng</span>
                  </summary>
                  <ActionForm key={`${session.title}|${session.description}`} action={updateSession.bind(null, session.id)} className="mt-2 space-y-2">
                    <input name="title" required defaultValue={session.title} aria-label="Tên buổi" className="input" />
                    <textarea name="description" rows={2} defaultValue={session.description ?? ''} aria-label="Mô tả buổi" className="input" />
                    <SubmitButton className="btn-primary btn-sm">Lưu buổi</SubmitButton>
                  </ActionForm>
                  <ActionForm action={deleteSession.bind(null, session.id)} className="mt-2">
                    <SubmitButton
                      className="btn-sm btn border border-red-200 text-red-600 hover:bg-red-50"
                      confirmMessage={`Xóa "${session.title}" cùng ${items.length} bài tập? Tiến độ đã tick của các bài này cũng bị xóa.`}
                    >
                      Xóa buổi
                    </SubmitButton>
                  </ActionForm>
                </details>
                <div className="mt-3 space-y-2">
                  {items.map((lesson, j) => (
                    <LessonItem key={lesson.id} lesson={lesson} index={j + 1} courseId={course.id} sessions={sessions} />
                  ))}
                  {!items.length && <p className="text-sm text-slate-400">Buổi chưa có bài tập.</p>}
                </div>
              </div>
            )
          })}

          {!!orphans.length && (
            <div className="space-y-2">
              <h3 className="font-bold text-ocean-900">Bài chưa thuộc buổi nào</h3>
              {orphans.map((lesson, j) => (
                <LessonItem key={lesson.id} lesson={lesson} index={j + 1} courseId={course.id} sessions={sessions} />
              ))}
            </div>
          )}

          {!sessions.length && !lessons.length && (
            <p className="card p-10 text-center text-slate-500">Khóa học chưa có buổi nào. Tạo khung buổi tập hoặc thêm bài học.</p>
          )}
        </section>

        <div className="h-fit space-y-4 lg:sticky lg:top-20">
          <section className="card p-5">
            <h3 className="mb-4 text-lg font-bold">Thêm bài học</h3>
            <ActionForm action={createLesson.bind(null, course.id)} resetOnSuccess className="space-y-3">
              <LessonFields values={{ sort_order: lessonsOf(sessions.at(-1)?.id ?? null).length + 1 }} sessions={sessions} />
              <SubmitButton className="btn-primary w-full">Thêm bài học</SubmitButton>
            </ActionForm>
          </section>
          <section className="card p-5">
            <h3 className="mb-3 font-bold">Thêm 1 buổi</h3>
            <ActionForm action={createSession.bind(null, course.id)} resetOnSuccess className="space-y-2">
              <input name="title" required placeholder={`Buổi ${sessions.length + 1}`} aria-label="Tên buổi mới" className="input" />
              <SubmitButton className="btn-outline btn-sm w-full">Thêm buổi</SubmitButton>
            </ActionForm>
          </section>
        </div>
      </div>
    </div>
  )
}
