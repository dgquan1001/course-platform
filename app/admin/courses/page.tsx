import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAdminPage } from '@/lib/auth'
import { formatPrice } from '@/lib/site-config'
import StatusBadge from '@/components/StatusBadge'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import { BookIcon, UsersIcon } from '@/components/icons'
import { isSupportedVideoUrl } from '@/lib/video'
import { COURSE_KINDS, kindBadge, sortPlans, type CourseKind, type Plan } from '@/lib/courses'
import PlanTable from './PlanTable'
import CourseCover from '@/components/CourseCover'
import { createCourse, deleteCourse, setCourseStatus, updateCourse } from '../actions'
import { CourseFields } from './fields'

type AdminCourse = {
  id: string
  title: string
  description: string | null
  price: number
  status: string
  sort_order: number
  kind: CourseKind
  category: string | null
  summary: string | null
  outcomes: string[]
  cover_image: string | null
  lessons: { video_url: string | null }[]
  course_plans: Plan[]
}

// Nhóm khóa theo loại để dễ quản lý: Chương trình (trả phí, có gói) · Miễn phí · Premium (liên hệ Zalo)
const GROUPS: { kind: CourseKind; title: string; hint: string }[] = [
  { kind: 'program', title: 'Chương trình phục hồi', hint: 'Trả phí theo gói tháng, có buổi tập mở lần lượt' },
  { kind: 'free', title: 'Khóa miễn phí', hint: 'Ai cũng xem được, không cần đăng nhập' },
  { kind: 'premium', title: 'Khóa premium', hint: 'Chỉ có thông tin và nút liên hệ Zalo, không có bài học' },
]

export default async function AdminCoursesPage({ searchParams }: { searchParams: { kind?: string } }) {
  await requireAdminPage()
  const filter = GROUPS.some((g) => g.kind === searchParams.kind) ? (searchParams.kind as CourseKind) : null
  const supabase = createClient()

  const [{ data: courses, error }, { data: regs }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, price, status, sort_order, kind, category, summary, outcomes, cover_image, lessons(video_url), course_plans(id, months, sessions, price, active)')
      .order('sort_order', { ascending: true }),
    // Chỉ đếm đơn chờ duyệt / đã duyệt (không tải cả lịch sử đơn bị từ chối)
    supabase.from('registrations').select('course_id, status').in('status', ['pending', 'approved']),
  ])
  if (error) throw new Error(error.message)
  const all = (courses ?? []) as unknown as AdminCourse[]
  const countOf = (kind: CourseKind) => all.filter((c) => c.kind === kind).length

  const stats = new Map<string, { approved: number; pending: number }>()
  for (const r of regs ?? []) {
    const s = stats.get(r.course_id) ?? { approved: 0, pending: 0 }
    if (r.status === 'approved') s.approved++
    if (r.status === 'pending') s.pending++
    stats.set(r.course_id, s)
  }

  const renderCourses = (list: AdminCourse[]) => (
    <>
        {list.map((c) => {
          const s = stats.get(c.id)
          const brokenVideos = c.lessons.filter((l) => l.video_url && !isSupportedVideoUrl(l.video_url)).length
          const missingVideos = c.lessons.filter((l) => !l.video_url).length
          const badge = kindBadge(c.kind, c.category)
          return (
            <div key={c.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-4">
                  <CourseCover src={c.cover_image} alt="" sizes="112px" className="hidden w-28 shrink-0 rounded-lg sm:block" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{c.title}</h2>
                      <span className={`badge ${badge.className}`}>{badge.label}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.kind !== 'program' && (
                      <p className="mt-1 text-lg font-bold text-ocean-700">{c.kind === 'free' ? 'Miễn phí' : formatPrice(c.price)}</p>
                    )}
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {c.kind === 'premium' ? (
                        <span>Khóa premium: chỉ có thông tin và nút liên hệ Zalo, không có bài học</span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <BookIcon className="h-4 w-4" /> {c.lessons.length} bài học
                          {!!brokenVideos && <span className="font-semibold text-red-600">· {brokenVideos} bài lỗi link video</span>}
                          {!!missingVideos && <span className="text-gold-700">· {missingVideos} bài chưa có video</span>}
                        </span>
                      )}
                      {c.kind === 'program' && (
                        <span className="flex items-center gap-1.5">
                          <UsersIcon className="h-4 w-4" /> {s?.approved ?? 0} học viên
                          {!!s?.pending && <span className="text-gold-700">· {s.pending} chờ duyệt</span>}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/khoa-hoc/${c.id}`} className="btn-outline btn-sm">
                    Xem trang giới thiệu
                  </Link>
                  {c.kind !== 'premium' && (
                    <Link href={`/admin/courses/${c.id}`} className="btn-primary btn-sm">
                      Quản lý buổi – bài
                    </Link>
                  )}
                  <ActionForm action={setCourseStatus.bind(null, c.id, c.status === 'published' ? 'draft' : 'published')}>
                    <SubmitButton className="btn-outline btn-sm">
                      {c.status === 'published' ? 'Ẩn khóa học' : 'Hiển thị'}
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>

              {c.kind === 'program' && <PlanTable courseId={c.id} plans={sortPlans(c.course_plans as Plan[])} />}

              <details className="group mt-3 border-t border-slate-100 pt-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-ocean-700 hover:underline [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">Sửa thông tin</span>
                  <span className="hidden group-open:inline">Đóng</span>
                </summary>
                <ActionForm
                  key={JSON.stringify([c.title, c.description, c.price, c.sort_order, c.status, c.kind, c.category, c.summary, c.outcomes, c.cover_image])}
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
    </>
  )
  const tabClass = (active: boolean) =>
    `btn-sm btn whitespace-nowrap border ${active ? 'border-ocean-500 bg-ocean-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-ocean-300'}`

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="space-y-5">
        <nav aria-label="Loại khóa học" className="flex gap-2 overflow-x-auto pb-1">
          <Link href="/admin/courses" aria-current={!filter ? 'page' : undefined} className={tabClass(!filter)}>
            Tất cả <span className="opacity-80">({all.length})</span>
          </Link>
          {GROUPS.map((g) => (
            <Link key={g.kind} href={`/admin/courses?kind=${g.kind}`} aria-current={filter === g.kind ? 'page' : undefined} className={tabClass(filter === g.kind)}>
              {COURSE_KINDS.find((k) => k.value === g.kind)?.label.split(' (')[0]} <span className="opacity-80">({countOf(g.kind)})</span>
            </Link>
          ))}
        </nav>
        {GROUPS.filter((g) => !filter || g.kind === filter).map((g) => {
          const list = all.filter((c) => c.kind === g.kind)
          return (
            <section key={g.kind} aria-label={g.title} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h2 className="text-lg font-bold">{g.title} <span className="text-sm font-normal text-slate-400">({list.length})</span></h2>
                <p className="text-xs text-slate-500">{g.hint}</p>
              </div>
              {list.length ? renderCourses(list) : <p className="card p-6 text-center text-sm text-slate-500">Chưa có khóa nào.</p>}
            </section>
          )
        })}
      </section>

      <section className="card h-fit p-5 lg:sticky lg:top-20">
        <h2 className="mb-4 text-lg font-bold">Thêm khóa học mới</h2>
        {/* key theo tab: chuyển tab thì form tạo lại với loại khóa chọn sẵn tương ứng */}
        <ActionForm key={filter ?? 'all'} action={createCourse} resetOnSuccess className="space-y-3">
          <CourseFields isNew defaultKind={filter ?? 'program'} />
          <SubmitButton className="btn-primary w-full">Thêm khóa học</SubmitButton>
        </ActionForm>
      </section>
    </div>
  )
}
