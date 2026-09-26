import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getVideoEmbed } from '@/lib/video'
import { ArrowLeftIcon, ArrowRightIcon, PlayIcon } from '@/components/icons'

export default async function LessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string }
}) {
  const supabase = createClient()

  const [{ data: course }, { data: lessons }] = await Promise.all([
    supabase.from('courses').select('title').eq('id', params.courseId).single(),
    supabase
      .from('lessons')
      .select('id, title, description, video_url')
      .eq('course_id', params.courseId)
      .order('sort_order', { ascending: true }),
  ])

  const index = lessons?.findIndex((l) => l.id === params.lessonId) ?? -1
  const lesson = lessons?.[index]

  // RLS không trả bài học nếu user chưa được mở khóa này
  if (!lessons || !lesson) {
    return (
      <main className="container-page py-20 text-center">
        <p className="text-slate-600">Không tìm thấy bài học hoặc khóa học chưa được mở cho bạn.</p>
        <Link href={`/courses/${params.courseId}`} className="btn-outline mt-6">
          Quay lại khóa học
        </Link>
      </main>
    )
  }

  const video = getVideoEmbed(lesson.video_url)
  const prev = lessons[index - 1]
  const next = lessons[index + 1]

  return (
    <main className="container-page py-4 sm:py-8">
      <Link
        href={`/courses/${params.courseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700"
      >
        <ArrowLeftIcon className="h-4 w-4" /> {course?.title}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="-mx-4 overflow-hidden bg-ocean-950 sm:mx-0 sm:rounded-2xl">
            {video ? (
              <div className={video.vertical ? 'mx-auto aspect-[9/16] w-full max-w-sm' : 'aspect-video'}>
                <iframe
                  src={video.src}
                  title={lesson.title}
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
            Bài {index + 1}/{lessons.length}
          </p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{lesson.title}</h1>
          {lesson.description && (
            <p className="mt-3 whitespace-pre-line text-slate-700">{lesson.description}</p>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6">
            {prev ? (
              <Link href={`/courses/${params.courseId}/${prev.id}`} className="btn-outline">
                <ArrowLeftIcon className="h-4 w-4" /> Bài trước
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/courses/${params.courseId}/${next.id}`} className="btn-primary">
                Bài tiếp theo <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <p className="border-b border-slate-100 px-5 py-4 font-bold text-ocean-900">
              Danh sách bài học
            </p>
            <ol className="max-h-[60vh] overflow-y-auto">
              {lessons.map((l, i) => {
                const active = l.id === lesson.id
                return (
                  <li key={l.id}>
                    <Link
                      href={`/courses/${params.courseId}/${l.id}`}
                      className={`flex items-center gap-3 px-5 py-3 text-sm transition ${
                        active
                          ? 'bg-ocean-50 font-semibold text-ocean-800'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          active ? 'bg-ocean-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {active ? <PlayIcon className="h-3 w-3" /> : i + 1}
                      </span>
                      <span className="line-clamp-2">{l.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </div>
        </aside>
      </div>
    </main>
  )
}
