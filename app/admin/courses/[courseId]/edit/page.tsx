import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdminPage } from '@/lib/auth'
import { kindBadge, sortPlans, type CourseKind, type Plan } from '@/lib/courses'
import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import StatusBadge from '@/components/StatusBadge'
import PageHeader from '@/components/admin/PageHeader'
import { ArrowLeftIcon, ExternalLinkIcon, EyeIcon, EyeOffIcon } from '@/components/icons'
import { setCourseStatus, updateCourse } from '../../../actions'
import { CourseFields } from '../../fields'
import PlanTable from '../../PlanTable'
import CourseTabs from '../../CourseTabs'
import DeleteCourse from '../../DeleteCourse'
import { courseUsage, usageBlocksDelete, usageMessage } from '../../usage'

export const metadata: Metadata = { title: 'Sửa khóa học' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Course = {
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
  course_plans: Plan[]
}

// Sửa khóa học (Đợt 24 – QL-06, QL-08): thông tin + ảnh bìa, bảng gói (chương trình), Ẩn / Hiện, xóa an toàn.
export default async function EditCoursePage(props: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await props.params
  await requireAdminPage()
  if (!UUID.test(courseId)) notFound()
  const supabase = await createClient()
  const [{ data, error }, usage] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, price, status, sort_order, kind, category, summary, outcomes, cover_image, course_plans(id, months, sessions, price, active)')
      .eq('id', courseId)
      .maybeSingle(),
    courseUsage(supabase, courseId),
  ])
  if (error) throw new Error(error.message)
  if (!data) notFound()
  const course = data as unknown as Course
  const badge = kindBadge(course.kind, course.category)
  const published = course.status === 'published'

  return (
    <div className="space-y-5">
      <PageHeader
        back={
          <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-ocean-700">
            <ArrowLeftIcon className="h-4 w-4" /> Tất cả khóa học
          </Link>
        }
        title={course.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className={`badge ${badge.className}`}>{badge.label}</span>
            <StatusBadge status={course.status} />
            <span>
              {usage.active} học viên đang học · {usage.pending} đơn chờ duyệt
            </span>
          </span>
        }
        actions={
          <Link href={`/khoa-hoc/${course.id}`} prefetch={false} target="_blank" className="btn-outline btn-sm">
            <ExternalLinkIcon className="h-3.5 w-3.5" /> Xem trang giới thiệu
          </Link>
        }
      />
      <CourseTabs courseId={course.id} kind={course.kind} active="edit" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section aria-label="Thông tin khóa học" className="card p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-ocean-950">Thông tin khóa học</h3>
            <ActionForm
              key={JSON.stringify([course.title, course.description, course.price, course.sort_order, course.status, course.kind, course.category, course.summary, course.outcomes, course.cover_image])}
              action={updateCourse.bind(null, course.id)}
              className="space-y-4"
            >
              <CourseFields values={course} />
              <div className="border-t border-slate-100 pt-4">
                <SubmitButton>Lưu thay đổi</SubmitButton>
              </div>
            </ActionForm>
          </section>
          {course.kind === 'program' && (
            <div className="card p-5 sm:p-6">
              <PlanTable courseId={course.id} plans={sortPlans(course.course_plans)} />
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <section aria-label="Hiển thị trên website" className="card p-5">
            <h3 className="font-bold text-ocean-950">Hiển thị trên website</h3>
            <p className="mt-1 text-sm text-slate-600">
              {published
                ? 'Khóa đang hiện trên website và nhận đăng ký.'
                : 'Khóa đang ẩn: không hiện trên website, không nhận đăng ký mới; học viên đã mua vẫn học tiếp.'}
            </p>
            <ActionForm action={setCourseStatus.bind(null, course.id, published ? 'draft' : 'published')} className="mt-3">
              <SubmitButton className="btn-outline w-full">
                {published ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                {published ? 'Ẩn khóa học' : 'Hiển thị'}
              </SubmitButton>
            </ActionForm>
          </section>
          <DeleteCourse
            courseId={course.id}
            title={course.title}
            usage={usage}
            blockedMessage={usageBlocksDelete(usage) ? usageMessage(usage) : null}
          />
        </aside>
      </div>
    </div>
  )
}
