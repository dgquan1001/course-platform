import Link from 'next/link'
import { formatPrice } from '@/lib/site-config'
import { kindBadge } from '@/lib/courses'
import type { PublicCourse } from '@/lib/supabase/public'
import CourseCover from './CourseCover'

// Thẻ khóa học trên trang chủ: ảnh bìa, nhãn loại / nhóm bệnh, mô tả ngắn, giá và nút hành động
export default function CourseCard({ course }: { course: PublicCourse }) {
  const badge = kindBadge(course.kind, course.category)
  const detailHref = `/khoa-hoc/${course.id}`
  return (
    <div className="card flex flex-col overflow-hidden transition hover:border-ocean-200 hover:shadow-md">
      <Link href={detailHref} tabIndex={-1} aria-hidden="true">
        <CourseCover src={course.cover_image} alt="" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <span className={`badge w-fit ${badge.className}`}>{badge.label}</span>
        <h3 className="mt-3 text-lg font-bold">
          <Link href={detailHref} className="hover:text-ocean-700">
            {course.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{course.summary || course.description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xl font-bold text-ocean-700">
            {course.kind === 'free' ? 'Miễn phí' : formatPrice(course.price)}
          </span>
          <div className="flex gap-2">
            {course.kind === 'program' ? (
              <>
                <Link href={detailHref} className="btn-outline btn-sm">
                  Xem lộ trình
                </Link>
                <Link href={`/?course=${course.id}#dang-ky`} className="btn-gold btn-sm">
                  Đăng ký
                </Link>
              </>
            ) : (
              <Link href={detailHref} className={course.kind === 'free' ? 'btn-primary btn-sm' : 'btn-gold btn-sm'}>
                {course.kind === 'free' ? 'Xem ngay' : 'Nhận ưu đãi'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
