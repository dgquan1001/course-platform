import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminPage } from '@/lib/auth'
import { isCourseKind, type CourseKind } from '@/lib/courses'
import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import PageHeader from '@/components/admin/PageHeader'
import { ArrowLeftIcon } from '@/components/icons'
import { createCourse } from '../../actions'
import { CourseFields } from '../fields'

export const metadata: Metadata = { title: 'Thêm khóa học' }

// Thêm khóa học (Đợt 24 – QL-07): trang riêng, mở từ nút "+ Thêm khóa học" (chọn sẵn loại theo tab đang xem).
// Tạo xong chuyển sang trang sửa khóa để thêm gói / buổi – bài.
export default async function NewCoursePage(props: { searchParams: Promise<{ kind?: string }> }) {
  const searchParams = await props.searchParams
  await requireAdminPage()
  const kind: CourseKind = searchParams.kind && isCourseKind(searchParams.kind) ? searchParams.kind : 'program'
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        back={
          <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-ocean-700">
            <ArrowLeftIcon className="h-4 w-4" /> Tất cả khóa học
          </Link>
        }
        title="Thêm khóa học mới"
        description="Chương trình có học phí: giá nhập ở đây tạo sẵn gói 1 tháng (12 buổi), thêm gói 3 / 6 / 12 tháng ở trang sửa khóa."
      />
      <section aria-label="Thông tin khóa học mới" className="card p-5 sm:p-6">
        <ActionForm action={createCourse} className="space-y-4">
          <CourseFields isNew defaultKind={kind} />
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <SubmitButton className="btn-primary">Thêm khóa học</SubmitButton>
            <Link href="/admin/courses" className="btn-ghost">
              Hủy
            </Link>
          </div>
        </ActionForm>
      </section>
    </div>
  )
}
