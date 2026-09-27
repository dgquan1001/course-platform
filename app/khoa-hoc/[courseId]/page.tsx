import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourseOutline, getPublicCourse } from '@/lib/supabase/public'
import { formatPrice, hotlineHref, siteConfig } from '@/lib/site-config'
import { buildSessions, kindBadge } from '@/lib/courses'
import SessionOutline from '@/components/SessionOutline'
import CourseCover from '@/components/CourseCover'
import { ArrowRightIcon, BookIcon, CheckIcon, PhoneIcon } from '@/components/icons'
import doctorPhoto from '@/public/images/bac-si-do-manh-cuong.jpg'
import LeadDialog from '../LeadDialog'
import PlanPicker from '../PlanPicker'

// Trang tĩnh, làm mới tối đa mỗi 5 phút (admin sửa khóa học sẽ làm mới ngay)
export const revalidate = 300

type Props = { params: { courseId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getPublicCourse(params.courseId)
  if (!course) return { title: 'Không tìm thấy khóa học' }
  return {
    title: course.title,
    description: course.summary ?? course.description ?? undefined,
    openGraph: course.cover_image ? { images: [course.cover_image] } : undefined,
  }
}

// Trang giới thiệu khóa học (công khai, bố cục tham khảo Udemy): thông tin, "Bạn sẽ đạt được",
// đề cương (không có link video), bác sĩ hướng dẫn và khung hành động bên phải.
export default async function CourseLandingPage({ params }: Props) {
  const course = await getPublicCourse(params.courseId)
  if (!course) notFound()
  const outline = course.kind === 'premium' ? [] : await getCourseOutline(course.id)
  const sessions = buildSessions(outline, { done: new Set(), open: 'all', purchased: null })
  const badge = kindBadge(course.kind, course.category)

  const action =
    course.kind === 'premium' ? (
      <LeadDialog courseId={course.id} />
    ) : course.kind === 'free' ? (
      outline.length ? (
        <Link href={`/courses/${course.id}/${outline[0].id}`} className="btn-primary w-full py-3 text-base">
          Bắt đầu học ngay <ArrowRightIcon className="h-5 w-5" />
        </Link>
      ) : (
        <p className="text-center text-sm text-slate-500">Bài học đang được cập nhật.</p>
      )
    ) : course.plans.length ? (
      <PlanPicker courseId={course.id} plans={course.plans} />
    ) : (
      <p className="text-center text-sm text-slate-500">Chương trình sắp mở đăng ký. Nhắn Zalo để được tư vấn.</p>
    )

  return (
    <main>
      {/* Dải tiêu đề */}
      <section className="bg-ocean-900 text-white">
        <div className="container-page grid gap-6 py-10 lg:grid-cols-[1fr_360px] lg:py-14">
          <div>
            <Link href="/#khoa-hoc" className="text-sm text-ocean-100 hover:text-white">
              ← Tất cả khóa học
            </Link>
            <span className={`badge mt-4 flex w-fit ${badge.className}`}>{badge.label}</span>
            <h1 className="mt-3 text-2xl font-bold text-white sm:text-4xl">{course.title}</h1>
            {course.summary && <p className="mt-3 max-w-2xl text-ocean-50 sm:text-lg">{course.summary}</p>}
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ocean-100">
              <span>Hướng dẫn: {siteConfig.doctor.name}</span>
              {course.kind !== 'premium' && (
                <span className="flex items-center gap-1.5">
                  <BookIcon className="h-4 w-4" /> {sessions.length} buổi · {outline.length} bài tập
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_360px] lg:py-10">
        {/* Khung hành động: bên phải trên máy tính (dính khi cuộn), ngay dưới tiêu đề trên điện thoại */}
        <aside className="lg:col-start-2 lg:row-start-1 lg:-mt-48">
          <div className="card overflow-hidden shadow-lg shadow-ocean-900/10 lg:sticky lg:top-24">
            <CourseCover src={course.cover_image} alt={course.title} priority sizes="(min-width: 1024px) 360px, 100vw" />
            <div className="space-y-4 p-5">
              {/* Chương trình: giá theo gói đã chọn (trong PlanPicker) */}
              {course.kind !== 'program' && (
                <p className="text-3xl font-bold text-ocean-800">{course.kind === 'free' ? 'Miễn phí' : formatPrice(course.price)}</p>
              )}
              {course.kind === 'program' && !course.plans.length && <p className="text-3xl font-bold text-ocean-800">Liên hệ</p>}
              {action}
              {course.kind !== 'premium' && (
                <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                  Tư vấn qua Zalo
                </a>
              )}
              <ul className="space-y-2 text-sm text-slate-600">
                {(course.kind === 'premium'
                  ? ['Tập trực tiếp cùng bác sĩ', 'Nhóm nhỏ, theo dõi sát tình trạng', 'Tư vấn lộ trình riêng qua Zalo']
                  : ['Học trên điện thoại hoặc máy tính', 'Bài tập theo chuẩn y khoa', 'Được nhân viên hỗ trợ trong quá trình tập']
                ).map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ocean-500" /> {t}
                  </li>
                ))}
              </ul>
              <a href={hotlineHref} className="flex items-center justify-center gap-2 text-sm font-semibold text-ocean-700 hover:underline">
                <PhoneIcon className="h-4 w-4" /> {siteConfig.hotline}
              </a>
            </div>
          </div>
        </aside>

        <div className="space-y-8 lg:col-start-1 lg:row-start-1">
          {!!course.outcomes.length && (
            <section className="card p-5 sm:p-6">
              <h2 className="text-lg font-bold">Bạn sẽ đạt được</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-2 text-sm text-slate-700">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.kind !== 'premium' && (
            <section>
              <h2 className="text-lg font-bold">
                Nội dung khóa học{' '}
                <span className="font-normal text-slate-500">
                  ({sessions.length} buổi · {outline.length} bài tập)
                </span>
              </h2>
              <div className="card mt-4 overflow-hidden">
                {/* Đề cương theo buổi (không có link video); khóa miễn phí bấm vào bài để xem ngay */}
                <SessionOutline
                  sessions={sessions}
                  linkTo={course.kind === 'free' ? (id) => `/courses/${course.id}/${id}` : null}
                  showProgress={false}
                  label="Đề cương khóa học"
                />
                {!outline.length && <p className="p-6 text-center text-sm text-slate-500">Nội dung đang được cập nhật.</p>}
              </div>
            </section>
          )}

          {course.description && (
            <section>
              <h2 className="text-lg font-bold">Giới thiệu</h2>
              <p className="mt-3 whitespace-pre-line text-slate-700">{course.description}</p>
            </section>
          )}

          <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <Image
              src={doctorPhoto}
              alt={siteConfig.doctor.name}
              placeholder="blur"
              sizes="96px"
              className="h-24 w-24 shrink-0 rounded-2xl object-cover"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">Chuyên gia hướng dẫn</p>
              <p className="mt-1 text-lg font-bold text-ocean-900">{siteConfig.doctor.name}</p>
              <p className="text-sm text-slate-600">{siteConfig.doctor.credentials[2]}</p>
            </div>
          </section>

          <p className="text-xs text-slate-500">
            Nội dung mang tính hướng dẫn tập luyện, không thay thế chẩn đoán và điều trị y khoa. Nếu đau tăng khi tập,
            hãy dừng lại và liên hệ trung tâm.
          </p>
        </div>
      </div>
    </main>
  )
}
