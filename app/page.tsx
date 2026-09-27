import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import RegisterForm from '@/app/register/RegisterForm'
import { getPublishedCourses } from '@/lib/supabase/public'
import { hotlineHref, siteConfig } from '@/lib/site-config'
import CourseCard from '@/components/CourseCard'
import ProgramGrid from '@/components/ProgramGrid'
import doctorPhoto from '@/public/images/bac-si-do-manh-cuong.jpg'
import centerBanner from '@/public/images/trung-tam-hv.jpg'
import {
  ArrowRightIcon,
  AwardIcon,
  BookIcon,
  CheckIcon,
  ClockIcon,
  PhoneIcon,
  ShieldIcon,
} from '@/components/icons'

// Trang tĩnh, làm mới tối đa mỗi 5 phút (admin sửa khóa học sẽ làm mới ngay)
export const revalidate = 300

const painPoints = [
  'Đau mỏi cổ, vai, gáy khi ngồi làm việc lâu',
  'Đau lưng dưới, cứng cột sống mỗi sáng thức dậy',
  'Lệch vai, lệch hông, gù lưng, sai tư thế',
  'Tê bì tay chân, khớp kêu khi vận động',
]

const benefits = [
  {
    icon: AwardIcon,
    title: 'Bác sĩ trực tiếp giảng dạy',
    text: 'Kiến thức giải phẫu và trị liệu chuẩn y khoa, giải thích dễ hiểu.',
  },
  {
    icon: BookIcon,
    title: 'Lộ trình bài bản',
    text: 'Bài học sắp xếp từ cơ bản đến nâng cao, biết rõ mỗi ngày cần tập gì.',
  },
  {
    icon: ClockIcon,
    title: 'Học mọi lúc, mọi nơi',
    text: 'Xem trên điện thoại hay máy tính, xem lại bao nhiêu lần tùy thích.',
  },
  {
    icon: ShieldIcon,
    title: 'An toàn, dễ áp dụng',
    text: 'Động tác nhẹ nhàng, có hướng dẫn điều chỉnh theo thể trạng.',
  },
]

const faqs = [
  {
    q: 'Bao lâu thì khóa học được kích hoạt?',
    a: 'Thông thường trong vài giờ làm việc sau khi trung tâm xác nhận chuyển khoản. Bạn đăng nhập bằng số điện thoại (hoặc email) và mật khẩu đã tạo để theo dõi trạng thái.',
  },
  {
    q: 'Tôi chưa từng tập luyện, có theo được không?',
    a: 'Được. Các bài học bắt đầu từ mức cơ bản, có hướng dẫn chi tiết cho người mới.',
  },
  {
    q: 'Tôi xem khóa học trên thiết bị nào?',
    a: 'Bất kỳ thiết bị nào có trình duyệt: điện thoại, máy tính bảng hoặc máy tính.',
  },
  {
    q: 'Khóa học có thay thế được việc điều trị không?',
    a: 'Không. Nếu bạn có bệnh lý cơ xương khớp nặng, hãy thăm khám trực tiếp trước khi tập. Liên hệ hotline để được tư vấn.',
  },
]

export default async function HomePage() {
  const courses = await getPublishedCourses()
  const free = courses.filter((c) => c.kind === 'free')
  const programs = courses.filter((c) => c.kind === 'program')
  const premium = courses.filter((c) => c.kind === 'premium')

  return (
    <main>
      {/* HERO */}
      <section className="bg-gradient-to-b from-ocean-50 via-white to-gold-50/60">
        <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="animate-fade-up">
            <span className="eyebrow">{siteConfig.fullName}</span>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Trị liệu cột sống – cơ xương khớp{' '}
              <span className="text-ocean-600">toàn diện</span> cho người Việt
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
              Khóa học video do <strong className="text-ocean-800">{siteConfig.doctor.name}</strong>{' '}
              trực tiếp hướng dẫn, giúp bạn giảm đau mỏi, cải thiện tư thế và vận động
              linh hoạt ngay tại nhà.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="#dang-ky" className="btn-gold px-6 text-base">
                Đăng ký khóa học <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <a href={hotlineHref} className="btn-outline px-6 text-base">
                <PhoneIcon className="h-5 w-5" /> {siteConfig.hotline}
              </a>
            </div>
            <ul className="mt-7 grid gap-2 text-sm text-slate-600 sm:flex sm:flex-wrap sm:gap-x-6">
              {['Hơn 10 năm kinh nghiệm lâm sàng', 'Học trên mọi thiết bị', 'Hỗ trợ trong quá trình học'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-ocean-500" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
            <div className="absolute -inset-3 -z-0 rounded-[2rem] bg-gradient-to-br from-ocean-100 to-gold-100" />
            <Image
              src={doctorPhoto}
              alt={siteConfig.doctor.name}
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 448px, (min-width: 640px) 384px, 90vw"
              className="relative aspect-square w-full rounded-3xl object-cover"
            />
            <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-ocean-100 bg-white/95 p-4 shadow-md sm:left-6 sm:right-auto">
              <p className="font-bold text-ocean-900">{siteConfig.doctor.name}</p>
              <p className="text-xs text-slate-500">Bác sĩ Y học cổ truyền · 10+ năm kinh nghiệm</p>
            </div>
          </div>
        </div>
      </section>

      {/* BÁC SĨ */}
      <section id="bac-si" className="scroll-mt-16 py-16 sm:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <Image
            src={centerBanner}
            alt={`${siteConfig.fullName} – ${siteConfig.doctor.name}`}
            placeholder="blur"
            sizes="(min-width: 1024px) 560px, 95vw"
            className="w-full rounded-2xl border border-ocean-100 shadow-sm"
          />
          <div>
            <span className="eyebrow">Chuyên gia đồng hành</span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{siteConfig.doctor.name}</h2>
            <p className="mt-1 text-ocean-700">{siteConfig.doctor.title}</p>
            <ul className="mt-6 space-y-3">
              {siteConfig.doctor.credentials.map((c) => (
                <li key={c} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ocean-100 text-ocean-600">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-slate-700">{c}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[
                { value: '10+', label: 'Năm kinh nghiệm' },
                { value: 'YHCT', label: 'Bác sĩ chuyên môn' },
                { value: '1:1', label: 'Hỗ trợ học viên' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-gold-50 p-3 ring-1 ring-gold-100">
                  <p className="text-xl font-bold text-ocean-700 sm:text-2xl">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-600">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VẤN ĐỀ */}
      <section className="bg-ocean-50/60 py-16 sm:py-20">
        <div className="container-page grid items-center gap-8 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Bạn có đang gặp</span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Những vấn đề cơ xương khớp phổ biến</h2>
            <p className="mt-4 text-slate-600">
              Phần lớn đến từ thói quen sinh hoạt và tư thế sai kéo dài. Tập đúng cách
              mỗi ngày là chìa khóa để cải thiện bền vững.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {painPoints.map((p) => (
              <li key={p} className="card flex gap-3 p-4">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-slate-700">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LỢI ÍCH */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Vì sao chọn Trung tâm HV</span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Học hiệu quả, dễ áp dụng</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6 transition hover:border-ocean-200">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ocean-50 text-ocean-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KHÓA MIỄN PHÍ: ai cũng xem được, không cần đăng nhập */}
      {!!free.length && (
        <section id="mien-phi" className="scroll-mt-16 py-16 sm:py-20">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Miễn phí</span>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Bắt đầu tập miễn phí</h2>
              <p className="mt-3 text-slate-600">Xem ngay, không cần đăng ký tài khoản.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {free.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CHƯƠNG TRÌNH PHỤC HỒI (trả phí): mọi nút "Đăng ký" cuộn tới box đăng ký */}
      <section id="khoa-hoc" className="scroll-mt-16 bg-gradient-to-b from-gold-50/70 to-white py-16 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Chương trình phục hồi chức năng</span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Chọn chương trình phù hợp với bạn</h2>
            <p className="mt-3 text-slate-600">
              Lộ trình tập theo từng buổi, chuẩn y khoa, có chuyên gia hướng dẫn.
            </p>
          </div>
          <ProgramGrid courses={programs} />
          {!programs.length && (
            <p className="card mt-8 p-8 text-center text-slate-500">
              Chương trình đang được cập nhật. Gọi <a href={hotlineHref} className="font-semibold text-ocean-700">{siteConfig.hotline}</a> để được tư vấn.
            </p>
          )}
        </div>
      </section>

      {/* PREMIUM 1:4, 1:2, 1:1: chỉ có thông tin, liên hệ Zalo để nhận ưu đãi */}
      {!!premium.length && (
        <section id="premium" className="scroll-mt-16 bg-ocean-950 py-16 text-white sm:py-20">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Premium chuyên sâu</span>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Tập trực tiếp cùng bác sĩ</h2>
              <p className="mt-3 text-ocean-100">Nhóm nhỏ 1:4, 1:2 hoặc kèm riêng 1:1. Liên hệ Zalo để được tư vấn và nhận ưu đãi.</p>
            </div>
            <div className="mt-10 grid gap-5 text-slate-900 sm:grid-cols-2 lg:grid-cols-3">
              {premium.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FORM ĐĂNG KÝ: mọi nút "Đăng ký" trên trang đều cuộn tới đây */}
      <section id="dang-ky" className="scroll-mt-16 py-16 sm:py-20">
        <div className="container-page">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="eyebrow">Đăng ký học</span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Đăng ký chỉ với 3 bước</h2>
            <p className="mt-3 text-slate-600">
              Khóa học được mở ngay sau khi trung tâm xác nhận chuyển khoản.
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <Suspense fallback={<div className="card h-[36rem] animate-pulse" />}>
              <RegisterForm courses={programs} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-ocean-50/60 py-16 sm:py-20">
        <div className="container-page max-w-3xl">
          <div className="text-center">
            <span className="eyebrow">Câu hỏi thường gặp</span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Bạn còn thắc mắc?</h2>
          </div>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ocean-900">
                  {f.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 sm:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-ocean-100 via-ocean-50 to-gold-100 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Sẵn sàng chăm sóc cột sống của bạn?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Đăng ký hôm nay, khóa học được mở ngay sau khi trung tâm xác nhận chuyển khoản.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="#dang-ky" className="btn-gold px-7 text-base">
              Đăng ký học ngay <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="btn-outline px-7 text-base">
              Tư vấn qua Zalo
            </a>
          </div>
        </div>
      </section>

      {/* Thanh hành động cố định trên điện thoại */}
      <div className="h-16 sm:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-ocean-100 bg-white/95 p-2 backdrop-blur sm:hidden">
        <a href={hotlineHref} className="btn-outline">
          <PhoneIcon className="h-4 w-4" /> Gọi ngay
        </a>
        <Link href="#dang-ky" className="btn-gold">
          Đăng ký học
        </Link>
      </div>
    </main>
  )
}
