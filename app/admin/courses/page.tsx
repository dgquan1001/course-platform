import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/site-config'
import StatusBadge from '@/components/StatusBadge'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import { BookIcon, UsersIcon } from '@/components/icons'
import { isSupportedVideoUrl } from '@/lib/video'
import { createCourse, deleteCourse, setCourseStatus, updateCourse } from '../actions'
import { CourseFields } from './fields'

export default async function AdminCoursesPage() {
  const supabase = createClient()

  const [{ data: courses, error }, { data: regs }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, price, status, sort_order, lessons(video_url)')
      .order('sort_order', { ascending: true }),
    supabase.from('registrations').select('course_id, status'),
  ])
  if (error) throw new Error(error.message)

  const stats = new Map<string, { approved: number; pending: number }>()
  for (const r of regs ?? []) {
    const s = stats.get(r.course_id) ?? { approved: 0, pending: 0 }
    if (r.status === 'approved') s.approved++
    if (r.status === 'pending') s.pending++
    stats.set(r.course_id, s)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="space-y-3">
        {courses?.map((c) => {
          const s = stats.get(c.id)
          const brokenVideos = c.lessons.filter((l) => !isSupportedVideoUrl(l.video_url)).length
          return (
            <div key={c.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{c.title}</h2>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-lg font-bold text-ocean-700">{formatPrice(c.price)}</p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <BookIcon className="h-4 w-4" /> {c.lessons.length} bài học
                      {!!brokenVideos && <span className="font-semibold text-red-600">· {brokenVideos} bài lỗi link video</span>}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UsersIcon className="h-4 w-4" /> {s?.approved ?? 0} học viên
                      {!!s?.pending && <span className="text-gold-700">· {s.pending} chờ duyệt</span>}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/courses/${c.id}`} className="btn-primary btn-sm">
                    Quản lý bài học
                  </Link>
                  <ActionForm action={setCourseStatus.bind(null, c.id, c.status === 'published' ? 'draft' : 'published')}>
                    <SubmitButton className="btn-outline btn-sm">
                      {c.status === 'published' ? 'Ẩn khóa học' : 'Hiển thị'}
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>

              <details className="group mt-3 border-t border-slate-100 pt-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-ocean-700 hover:underline [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">Sửa thông tin</span>
                  <span className="hidden group-open:inline">Đóng</span>
                </summary>
                <ActionForm
                  key={`${c.title}|${c.description}|${c.price}|${c.sort_order}|${c.status}`}
                  action={updateCourse.bind(null, c.id)}
                  className="mt-3 space-y-3"
                >
                  <CourseFields values={c} />
                  <SubmitButton>Lưu thay đổi</SubmitButton>
                </ActionForm>
                <ActionForm action={deleteCourse.bind(null, c.id)} className="mt-3 border-t border-dashed border-slate-200 pt-3">
                  <SubmitButton
                    className="btn-sm btn border border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-100"
                    confirmMessage={`Xóa vĩnh viễn khóa "${c.title}" cùng toàn bộ bài học? Học viên sẽ không xem được khóa này nữa. Đơn đăng ký và lịch sử thanh toán vẫn được giữ lại.`}
                  >
                    Xóa khóa học
                  </SubmitButton>
                </ActionForm>
              </details>
            </div>
          )
        })}
        {!courses?.length && (
          <p className="card p-10 text-center text-slate-500">Chưa có khóa học nào. Thêm khóa học ở biểu mẫu bên cạnh.</p>
        )}
      </section>

      <section className="card h-fit p-5 lg:sticky lg:top-20">
        <h2 className="mb-4 text-lg font-bold">Thêm khóa học mới</h2>
        <ActionForm action={createCourse} resetOnSuccess className="space-y-3">
          <CourseFields />
          <SubmitButton className="btn-primary w-full">Thêm khóa học</SubmitButton>
        </ActionForm>
      </section>
    </div>
  )
}
