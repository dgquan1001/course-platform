import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeftIcon } from '@/components/icons'
import { createLesson, deleteLesson, updateLesson } from '../../actions'
import { LessonFields } from '../fields'

export default async function AdminCourseLessonsPage({
  params,
}: {
  params: { courseId: string }
}) {
  const supabase = createClient()
  const [{ data: course }, { data: lessons }] = await Promise.all([
    supabase.from('courses').select('id, title, status').eq('id', params.courseId).maybeSingle(),
    supabase
      .from('lessons')
      .select('id, title, description, video_url, sort_order')
      .eq('course_id', params.courseId)
      .order('sort_order', { ascending: true }),
  ])
  if (!course) notFound()

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
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-3">
          {lessons?.map((l, i) => (
            <div key={l.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ocean-50 text-sm font-bold text-ocean-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ocean-900">{l.title}</p>
                  <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-ocean-600 hover:underline">
                    {l.video_url}
                  </a>
                  <p className="text-xs text-slate-400">Thứ tự: {l.sort_order}</p>
                </div>
                <Link href={`/courses/${course.id}/${l.id}`} className="btn-ghost btn-sm shrink-0">
                  Xem thử
                </Link>
              </div>
              <details className="group mt-3 border-t border-slate-100 pt-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-ocean-700 hover:underline [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">Sửa bài học</span>
                  <span className="hidden group-open:inline">Đóng</span>
                </summary>
                <ActionForm
                  key={`${l.title}|${l.video_url}|${l.description}|${l.sort_order}`}
                  action={updateLesson.bind(null, l.id)}
                  className="mt-3 space-y-3"
                >
                  <LessonFields values={l} />
                  <SubmitButton>Lưu thay đổi</SubmitButton>
                </ActionForm>
                <ActionForm action={deleteLesson.bind(null, l.id)} className="mt-3 border-t border-dashed border-slate-200 pt-3">
                  <SubmitButton
                    className="btn-sm btn border border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-100"
                    confirmMessage={`Xóa bài học "${l.title}"?`}
                  >
                    Xóa bài học
                  </SubmitButton>
                </ActionForm>
              </details>
            </div>
          ))}
          {!lessons?.length && <p className="card p-10 text-center text-slate-500">Khóa học chưa có bài học nào.</p>}
        </section>

        <section className="card h-fit p-5 lg:sticky lg:top-20">
          <h3 className="mb-4 text-lg font-bold">Thêm bài học</h3>
          <ActionForm action={createLesson.bind(null, course.id)} resetOnSuccess className="space-y-3">
            <LessonFields values={{ sort_order: (lessons?.length ?? 0) + 1 }} />
            <SubmitButton className="btn-primary w-full">Thêm bài học</SubmitButton>
          </ActionForm>
        </section>
      </div>
    </div>
  )
}
