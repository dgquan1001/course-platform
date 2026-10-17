import Link from 'next/link'
import { formatPrice } from '@/lib/site-config'
import { cardCopy, type Locale } from '@/lib/i18n'
import type { PublicCourse } from '@/lib/supabase/public'
import CourseCover from './CourseCover'

type Copy = (typeof cardCopy)[Locale]

// Nhãn nhỏ trên thẻ: loại khóa / nhóm bệnh (giống kindBadge ở lib/courses.ts, có bản tiếng Anh)
function badge(course: PublicCourse, t: Copy) {
  if (course.kind === 'free') return { label: t.free, className: 'bg-emerald-100 text-emerald-700' }
  if (course.kind === 'premium') return { label: t.premium, className: 'bg-gold-200 text-ocean-950' }
  return { label: (course.category && t.categories[course.category]) || t.program, className: 'bg-ocean-100 text-ocean-700' }
}

const price = (amount: number, t: Copy) => (amount > 0 ? formatPrice(amount) : t.contact)

// Giá trên thẻ: chương trình lấy gói rẻ nhất ("Từ …") kèm các gói đang bán; miễn phí; premium theo giá khóa
function PriceTag({ course, t }: { course: PublicCourse; t: Copy }) {
  if (course.kind === 'free') return <span className="text-xl font-bold text-ocean-700">{t.free}</span>
  if (course.kind === 'premium' || !course.plans.length) {
    return <span className="text-xl font-bold text-ocean-700">{price(course.kind === 'premium' ? course.price : 0, t)}</span>
  }
  const cheapest = Math.min(...course.plans.map((p) => p.price))
  return (
    <span>
      <span className="block text-xl font-bold text-ocean-700">
        <span className="text-sm font-medium text-slate-500">{t.from}</span>
        {price(cheapest, t)}
      </span>
      <span className="block text-xs text-slate-500">
        {t.plans} {course.plans.map((p) => t.months(p.months)).join(' · ')}
      </span>
    </span>
  )
}

// Thẻ khóa học trên trang chủ: ảnh bìa, nhãn loại / nhóm bệnh, mô tả ngắn, giá và nút hành động.
// Tên, mô tả khóa do admin nhập (tiếng Việt) – bản tiếng Anh chỉ dịch nhãn, giá, nút.
export default function CourseCard({ course, locale = 'vi' }: { course: PublicCourse; locale?: Locale }) {
  const t = cardCopy[locale]
  const b = badge(course, t)
  const detailHref = `/khoa-hoc/${course.id}`
  return (
    <div className="card card-lift spotlight group flex flex-col overflow-hidden">
      <Link href={detailHref} tabIndex={-1} aria-hidden="true" className="block overflow-hidden">
        <CourseCover src={course.cover_image} alt="" className="transition duration-700 group-hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <span className={`badge w-fit ${b.className}`}>{b.label}</span>
        <h3 className="mt-3 text-lg font-bold">
          <Link href={detailHref} className="hover:text-ocean-700">
            {course.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{course.summary || course.description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <PriceTag course={course} t={t} />
          <div className="flex gap-2">
            {course.kind === 'program' ? (
              <>
                <Link href={detailHref} className="btn-outline btn-sm">
                  {t.outline}
                </Link>
                {/* Chưa có gói đang bán thì chưa nhận đăng ký (giá hiện "Liên hệ"). Form đăng ký chỉ có tiếng Việt (ở "/") */}
                {!!course.plans.length && (
                  <Link href={`/?course=${course.id}#dang-ky`} className="btn-gold btn-sm">
                    {t.register}
                  </Link>
                )}
              </>
            ) : (
              <Link href={detailHref} className={course.kind === 'free' ? 'btn-primary btn-sm' : 'btn-gold btn-sm'}>
                {course.kind === 'free' ? t.watch : t.offer}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
