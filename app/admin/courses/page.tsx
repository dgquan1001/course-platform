import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAdminPage } from '@/lib/auth'
import { formatPrice } from '@/lib/site-config'
import StatusBadge from '@/components/StatusBadge'
import SubmitButton from '@/components/SubmitButton'
import ActionForm from '@/components/ActionForm'
import PageHeader from '@/components/admin/PageHeader'
import { BookIcon, ExternalLinkIcon, EyeIcon, EyeOffIcon, InboxIcon, LayersIcon, PencilIcon, PlusIcon, TrashIcon, UsersIcon } from '@/components/icons'
import { isSupportedVideoUrl } from '@/lib/video'
import { COURSE_KINDS, kindBadge, sortPlans, type CourseKind, type Plan } from '@/lib/courses'
import CourseCover from '@/components/CourseCover'
import { setCourseStatus } from '../actions'

type AdminCourse = {
  id: string
  title: string
  price: number
  status: string
  kind: CourseKind
  category: string | null
  summary: string | null
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

// Danh sách khóa học (Đợt 24 – QL-06, QL-07): mỗi khóa một thẻ với hàng thao tác rõ ràng
// Sửa · Buổi – bài · Ẩn / Hiện · Xem trang · Xóa; thêm khóa ở trang riêng (/admin/courses/new), sửa + gói + xóa ở /admin/courses/[id]/edit.
export default async function AdminCoursesPage(props: { searchParams: Promise<{ kind?: string }> }) {
  const searchParams = await props.searchParams
  await requireAdminPage()
  const filter = GROUPS.some((g) => g.kind === searchParams.kind) ? (searchParams.kind as CourseKind) : null
  const supabase = await createClient()

  const [{ data: courses, error }, { data: regs }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, price, status, kind, category, summary, cover_image, lessons(video_url), course_plans(id, months, sessions, price, active)')
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

  const priceText = (c: AdminCourse) => {
    if (c.kind === 'free') return 'Miễn phí'
    if (c.kind === 'premium') return formatPrice(c.price)
    const active = sortPlans(c.course_plans).filter((p) => p.active)
    if (!active.length) return 'Chưa có gói đang bán'
    return `Từ ${formatPrice(Math.min(...active.map((p) => p.price)))} · ${active.map((p) => `${p.months} tháng`).join(', ')}`
  }

  const renderCourse = (c: AdminCourse) => {
    const s = stats.get(c.id)
    const brokenVideos = c.lessons.filter((l) => l.video_url && !isSupportedVideoUrl(l.video_url)).length
    const missingVideos = c.lessons.filter((l) => !l.video_url).length
    const badge = kindBadge(c.kind, c.category)
    const published = c.status === 'published'
    return (
      <article key={c.id} className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
          <CourseCover src={c.cover_image} alt="" sizes="160px" className="aspect-[16/10] w-full shrink-0 rounded-xl sm:w-40" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${badge.className}`}>{badge.label}</span>
              <StatusBadge status={c.status} />
            </div>
            <h3 className="mt-1.5 text-lg font-bold leading-snug text-ocean-950">
              <Link href={`/admin/courses/${c.id}/edit`} className="hover:text-ocean-700 hover:underline">
                {c.title}
              </Link>
            </h3>
            {c.summary && <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{c.summary}</p>}
            <p className="mt-2 text-sm font-semibold text-ocean-700">{priceText(c)}</p>
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

        {/* Hàng thao tác (QL-06): luôn hiện, không giấu trong mục thu gọn */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
          <Link href={`/admin/courses/${c.id}/edit`} className="btn-primary btn-sm">
            <PencilIcon className="h-3.5 w-3.5" /> Sửa
          </Link>
          {c.kind !== 'premium' && (
            <Link href={`/admin/courses/${c.id}`} className="btn-outline btn-sm">
              <LayersIcon className="h-3.5 w-3.5" /> Quản lý buổi – bài
            </Link>
          )}
          <ActionForm action={setCourseStatus.bind(null, c.id, published ? 'draft' : 'published')}>
            <SubmitButton className="btn-outline btn-sm">
              {published ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
              {published ? 'Ẩn khóa học' : 'Hiển thị'}
            </SubmitButton>
          </ActionForm>
          {/* Không prefetch: khóa đang ẩn thì trang giới thiệu là 404 (Next 15 prefetch cả trang ISR → lỗi 404 trong console) */}
          <Link href={`/khoa-hoc/${c.id}`} prefetch={false} target="_blank" className="btn-ghost btn-sm">
            <ExternalLinkIcon className="h-3.5 w-3.5" /> Xem trang giới thiệu
          </Link>
          <Link
            href={`/admin/courses/${c.id}/edit#xoa-khoa-hoc`}
            className="btn-sm btn ml-auto text-red-600 hover:bg-red-50 focus-visible:ring-red-100"
          >
            <TrashIcon className="h-3.5 w-3.5" /> Xóa
          </Link>
        </div>
      </article>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khóa học"
        description="Chương trình phục hồi (bán theo gói tháng), khóa miễn phí và khóa premium hiển thị trên website."
        actions={
          <Link href={`/admin/courses/new${filter ? `?kind=${filter}` : ''}`} className="btn-gold">
            <PlusIcon className="h-4 w-4" /> Thêm khóa học
          </Link>
        }
      />
      <nav aria-label="Loại khóa học" className="seg">
        <Link href="/admin/courses" aria-current={!filter ? 'page' : undefined} className="seg-item">
          Tất cả <span className="opacity-70">({all.length})</span>
        </Link>
        {GROUPS.map((g) => (
          <Link key={g.kind} href={`/admin/courses?kind=${g.kind}`} aria-current={filter === g.kind ? 'page' : undefined} className="seg-item">
            {COURSE_KINDS.find((k) => k.value === g.kind)?.label.split(' (')[0]} <span className="opacity-70">({countOf(g.kind)})</span>
          </Link>
        ))}
      </nav>
      {GROUPS.filter((g) => !filter || g.kind === filter).map((g) => {
        const list = all.filter((c) => c.kind === g.kind)
        return (
          <section key={g.kind} aria-label={g.title} className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 className="text-lg font-bold text-ocean-950">
                {g.title} <span className="text-sm font-normal text-slate-400">({list.length})</span>
              </h2>
              <p className="text-xs text-slate-500">{g.hint}</p>
            </div>
            {list.length ? (
              list.map(renderCourse)
            ) : (
              <div className="card grid place-items-center gap-3 p-8 text-center text-sm text-slate-500">
                <InboxIcon className="h-8 w-8 text-slate-300" />
                <p>Chưa có khóa nào.</p>
                <Link href={`/admin/courses/new?kind=${g.kind}`} className="btn-outline btn-sm">
                  <PlusIcon className="h-3.5 w-3.5" /> Thêm {g.title.toLowerCase()}
                </Link>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
