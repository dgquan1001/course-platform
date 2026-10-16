import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import RegisterForm from '@/app/register/RegisterForm'
import { getPublishedCourses } from '@/lib/supabase/public'
import { hotlineHref, siteConfig } from '@/lib/site-config'
import { revealDelay } from '@/lib/reveal'
import CountUp from '@/components/CountUp'
import CourseCard from '@/components/CourseCard'
import ProgramGrid from '@/components/ProgramGrid'
import RevealObserver from '@/components/RevealObserver'
import doctorPhoto from '@/public/images/bac-si-do-manh-cuong.jpg'
import teachingPhoto from '@/public/images/bac-si/giang-day.jpg'
import schrothPhoto from '@/public/images/bac-si/chung-nhan-ssol-schroth.jpg'
import practicePhoto from '@/public/images/bac-si/huong-dan-thuc-hanh.jpg'
import conferencePhoto from '@/public/images/bac-si/hoi-nghi-quan-y-103.jpg'
import talkPhoto from '@/public/images/bac-si/chia-se-benh-ly-cot-song.jpg'
import workshopPhoto from '@/public/images/bac-si/workshop-can-chinh.jpg'
import {
  ArrowRightIcon,
  AwardIcon,
  BookIcon,
  CheckIcon,
  ClockIcon,
  GraduationIcon,
  PhoneIcon,
  PlayIcon,
  ShieldIcon,
  SpineIcon,
  StethoscopeIcon,
  UsersIcon,
} from '@/components/icons'

// Trang tĩnh, làm mới tối đa mỗi 5 phút (admin sửa khóa học sẽ làm mới ngay)
export const revalidate = 300

// Số liệu nổi bật (nguồn: hồ sơ bác sĩ), đếm tăng dần khi cuộn tới
const stats = [
  { to: 10, suffix: '+', label: 'Năm kinh nghiệm trị liệu cột sống' },
  { to: 13000, suffix: '+', label: 'Người theo dõi chia sẻ của bác sĩ' },
  { to: 3, suffix: '', label: 'Cơ sở trị liệu tại Hà Nội & TP.HCM' },
  { to: 1, suffix: ':1', label: 'Bác sĩ kèm riêng với gói Premium' },
]

// Dải chuyên môn chạy ngang dưới hero
const keywords = [
  'Cong vẹo cột sống',
  'Phương pháp Schroth',
  'Đau cổ vai gáy',
  'Thoát vị đĩa đệm',
  'Đau lưng dưới',
  'Chấn thương thể thao',
  'Kinesio Tape',
  'Sai tư thế – gù lưng',
]

const painPoints = [
  'Đau mỏi cổ, vai, gáy khi ngồi làm việc lâu',
  'Đau lưng dưới, cứng cột sống mỗi sáng thức dậy',
  'Lệch vai, lệch hông, gù lưng, sai tư thế',
  'Tê bì tay chân, khớp kêu khi vận động',
]

const benefits = [
  {
    icon: AwardIcon,
    title: 'Bác sĩ trực tiếp xây dựng',
    text: 'Mỗi bài tập do bác sĩ thiết kế và giải thích, chuẩn giải phẫu, dễ hiểu.',
  },
  {
    icon: BookIcon,
    title: 'Lộ trình theo từng buổi',
    text: 'Tập lần lượt từng buổi, đánh dấu hoàn thành để thấy rõ tiến bộ mỗi ngày.',
  },
  {
    icon: ClockIcon,
    title: 'Tập mọi lúc, mọi nơi',
    text: 'Xem trên điện thoại hay máy tính, xem lại bao nhiêu lần tùy thích.',
  },
  {
    icon: ShieldIcon,
    title: 'An toàn, vừa sức',
    text: 'Động tác nhẹ nhàng, có hướng dẫn điều chỉnh theo thể trạng từng người.',
  },
]

const expertiseIcons = [SpineIcon, StethoscopeIcon, ShieldIcon, UsersIcon]

// Hoạt động chuyên môn (ảnh từ hồ sơ bác sĩ)
const gallery = [
  { src: practicePhoto, caption: 'Hướng dẫn thực hành cho học viên' },
  { src: conferencePhoto, caption: 'Hội nghị khoa học Cơ xương khớp – Bệnh viện Quân y 103' },
  { src: workshopPhoto, caption: 'Workshop cân chỉnh chuẩn y khoa trong trị liệu' },
  { src: talkPhoto, caption: 'Talkshow “Bệnh lý xương khớp trong xã hội hiện đại”' },
]

const faqs = [
  {
    q: 'Bao lâu thì khóa học được kích hoạt?',
    a: 'Thông thường trong vài giờ làm việc sau khi trung tâm xác nhận chuyển khoản. Bạn đăng nhập bằng số điện thoại (hoặc email) và mật khẩu đã tạo để theo dõi trạng thái.',
  },
  {
    q: 'Tôi chưa từng tập luyện, có theo được không?',
    a: 'Được. Các bài học bắt đầu từ mức cơ bản, có hướng dẫn chi tiết cho người mới. Bạn có thể tập thử khóa miễn phí trước.',
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
  const { doctor } = siteConfig

  return (
    <main className="overflow-x-clip">
      <RevealObserver />

      {/* HERO: thông điệp chính + ảnh bác sĩ với các thẻ nổi */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-ocean-50 via-white to-gold-50/60">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 top-10 h-72 w-72 animate-blob rounded-full bg-ocean-200/50 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-80 w-80 animate-blob rounded-full bg-gold-200/50 blur-3xl [animation-delay:-6s]" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-blob rounded-full bg-ocean-100/70 blur-3xl [animation-delay:-12s]" />
        </div>

        <div className="container-page grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <span className="eyebrow animate-fade-up-slow">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-600" />
              </span>
              {siteConfig.fullName}
            </span>
            <h1 className="mt-5 animate-fade-up-slow text-3xl font-bold leading-tight [animation-delay:100ms] sm:text-4xl lg:text-[3.25rem] lg:leading-[1.1]">
              Trị liệu cột sống – cơ xương khớp <span className="text-gradient">toàn diện</span> cho người Việt
            </h1>
            <p className="mt-5 max-w-xl animate-fade-up-slow text-base text-slate-600 [animation-delay:200ms] sm:text-lg">
              Đừng để cơn đau lưng, cổ vai gáy trở thành “bạn đồng hành” mỗi ngày. Lộ trình tập phục hồi theo
              từng buổi do <strong className="text-ocean-800">{doctor.name}</strong> trực tiếp xây dựng –
              tập đúng, tập đủ ngay tại nhà.
            </p>
            <div className="mt-8 flex animate-fade-up-slow flex-col gap-3 [animation-delay:300ms] sm:flex-row">
              <Link href="#dang-ky" className="btn-gold group px-6 text-base shadow-lg shadow-gold-500/25">
                Đăng ký chương trình
                <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <Link href={free.length ? '#mien-phi' : '#khoa-hoc'} className="btn-outline px-6 text-base">
                <PlayIcon className="h-4 w-4" /> {free.length ? 'Tập thử miễn phí' : 'Xem chương trình'}
              </Link>
            </div>
            <a
              href={hotlineHref}
              className="mt-5 inline-flex animate-fade-up-slow items-center gap-2 text-sm text-slate-600 [animation-delay:400ms] hover:text-ocean-700"
            >
              <PhoneIcon className="h-4 w-4 text-ocean-500" />
              Tư vấn miễn phí: <strong className="text-ocean-800">{siteConfig.hotline}</strong>
            </a>
          </div>

          <div className="relative mx-auto w-full max-w-sm animate-fade-up-slow [animation-delay:200ms] lg:max-w-md">
            <div aria-hidden="true" className="absolute -inset-4 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-ocean-200 via-ocean-100 to-gold-200" />
            <Image
              src={doctorPhoto}
              alt={doctor.name}
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 448px, (min-width: 640px) 384px, 90vw"
              className="relative aspect-square w-full rounded-[2rem] object-cover shadow-xl shadow-ocean-900/10"
            />
            <div className="absolute -left-3 top-8 animate-float rounded-2xl bg-white/95 px-4 py-3 shadow-lg shadow-ocean-900/10 ring-1 ring-ocean-100 sm:-left-8">
              <p className="text-2xl font-bold text-ocean-700">10+</p>
              <p className="text-xs text-slate-500">năm kinh nghiệm</p>
            </div>
            <div className="absolute -right-3 top-1/2 flex animate-float items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 shadow-lg shadow-ocean-900/10 ring-1 ring-ocean-100 [animation-delay:-3s] sm:-right-8">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-100 text-gold-700">
                <AwardIcon className="h-5 w-5" />
              </span>
              <span className="text-xs leading-tight text-slate-600">
                Chứng nhận
                <br />
                <strong className="text-ocean-900">Schroth · SSOL</strong>
              </span>
            </div>
            <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-ocean-100 bg-white/95 p-4 shadow-md backdrop-blur sm:left-8 sm:right-auto">
              <p className="font-bold text-ocean-900">{doctor.name}</p>
              <p className="text-xs text-slate-500">Founder Xương Khớp HV · Bác sĩ Y học cổ truyền</p>
            </div>
          </div>
        </div>

        {/* Số liệu nổi bật */}
        <div className="container-page pb-12 sm:pb-16">
          <dl className="grid grid-cols-2 gap-3 rounded-3xl border border-ocean-100 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} data-reveal="" style={revealDelay(i)} className="rounded-2xl px-2 py-3 text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-bold text-ocean-700 sm:text-3xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </dd>
                <dd className="mt-1 text-xs text-slate-600 sm:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Dải chuyên môn chạy ngang (dừng khi rê chuột) */}
      <div className="group relative overflow-hidden border-y border-ocean-900/10 bg-ocean-950 py-4 text-ocean-50">
        <ul aria-label="Lĩnh vực chuyên môn" className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused]">
          {[...keywords, ...keywords].map((k, i) => (
            <li
              key={i}
              aria-hidden={i >= keywords.length || undefined}
              className="flex items-center gap-3 whitespace-nowrap text-sm font-semibold uppercase tracking-wider"
            >
              <SpineIcon className="h-4 w-4 text-gold-300" /> {k}
            </li>
          ))}
        </ul>
      </div>

      {/* VẤN ĐỀ → GIẢI PHÁP */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div data-reveal="left">
              <span className="eyebrow">Bạn có đang gặp</span>
              <h2 className="section-title">
                Cơn đau không tự hết – nhưng <span className="text-gradient">có thể cải thiện</span> mỗi ngày
              </h2>
              <p className="mt-4 text-slate-600">
                Phần lớn vấn đề cơ xương khớp đến từ thói quen sinh hoạt và tư thế sai kéo dài. Tập đúng cách,
                đều đặn theo lộ trình là chìa khóa để cải thiện bền vững.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {painPoints.map((p, i) => (
                <li key={p} data-reveal="" style={revealDelay(i)}>
                  <div className="card card-lift flex h-full gap-3 p-4">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-slate-700">{p}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }, i) => (
              <div key={title} data-reveal="" style={revealDelay(i)}>
                <div className="card card-lift group h-full p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ocean-50 text-ocean-600 transition duration-300 group-hover:bg-ocean-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BÁC SĨ: hồ sơ, chuyên môn, quá trình công tác, hoạt động */}
      <section id="bac-si" className="scroll-mt-16 bg-ocean-50/60 py-16 sm:py-24">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div data-reveal="left" className="relative mx-auto w-full max-w-lg pb-10 pr-10">
              <Image
                src={teachingPhoto}
                alt={`${doctor.name} chia sẻ về bệnh lý cột sống`}
                placeholder="blur"
                sizes="(min-width: 1024px) 480px, 90vw"
                className="w-full rounded-3xl object-cover shadow-xl shadow-ocean-900/10"
              />
              <Image
                src={schrothPhoto}
                alt={`${doctor.name} nhận chứng nhận phương pháp Schroth (SSOL)`}
                placeholder="blur"
                sizes="200px"
                className="absolute bottom-0 right-0 w-36 animate-float rounded-2xl border-4 border-white object-cover shadow-lg sm:w-44"
              />
            </div>
            <div data-reveal="right">
              <span className="eyebrow">Chuyên gia đồng hành</span>
              <h2 className="section-title">{doctor.name}</h2>
              <p className="mt-2 font-medium text-ocean-700">{doctor.title}</p>
              <p className="mt-4 text-slate-600">
                {doctor.summary}, chuyên xử lý các vấn đề cột sống – đặc biệt là cong vẹo cột sống. Bác sĩ trực
                tiếp xây dựng từng buổi tập trên website để bạn tập đúng như khi được hướng dẫn tại phòng khám.
              </p>
              <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-800">
                <GraduationIcon className="h-5 w-5" /> Học vấn & chứng chỉ
              </h3>
              <ul className="mt-3 space-y-2.5">
                {doctor.education.map((c) => (
                  <li key={c} className="flex gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ocean-100 text-ocean-600">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-slate-700">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chuyên môn */}
          <div id="chuyen-mon" className="mt-16 scroll-mt-20">
            <h3 data-reveal="" className="text-center text-xl font-bold sm:text-2xl">Lĩnh vực chuyên môn</h3>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {doctor.expertise.map((e, i) => {
                const Icon = expertiseIcons[i % expertiseIcons.length]
                return (
                  <div key={e.title} data-reveal="" style={revealDelay(i)}>
                    <div className="card card-lift group relative h-full overflow-hidden p-6">
                      <span
                        aria-hidden="true"
                        className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold-100/70 transition duration-500 group-hover:scale-[3]"
                      />
                      <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-ocean-600 text-gold-200">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h4 className="relative mt-4 font-semibold text-ocean-950">{e.title}</h4>
                      <p className="relative mt-2 text-sm text-slate-600">{e.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quá trình công tác + hoạt động chuyên môn */}
          <div className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal="left">
              <h3 className="text-xl font-bold sm:text-2xl">Quá trình công tác</h3>
              <ol className="mt-6 space-y-6 border-l-2 border-ocean-200 pl-6">
                {doctor.career.map((c) => (
                  <li key={c.time} className="relative">
                    <span aria-hidden="true" className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-white bg-gold-500 ring-2 ring-gold-200" />
                    <p className="text-sm font-semibold text-gold-800">{c.time}</p>
                    <p className="mt-1 text-slate-700">{c.text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 data-reveal="" className="text-xl font-bold sm:text-2xl">Hoạt động chuyên môn</h3>
              <ul className="mt-6 grid grid-cols-2 gap-3">
                {gallery.map((g, i) => (
                  <li key={g.caption} data-reveal="zoom" style={revealDelay(i)}>
                    <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm">
                      <Image
                        src={g.src}
                        alt={g.caption}
                        placeholder="blur"
                        sizes="(min-width: 1024px) 320px, 45vw"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-950/85 to-transparent p-3 pt-10 text-xs font-medium text-white sm:text-sm">
                        {g.caption}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* KHÓA MIỄN PHÍ: ai cũng xem được, không cần đăng nhập */}
      {!!free.length && (
        <section id="mien-phi" className="scroll-mt-16 py-16 sm:py-24">
          <div className="container-page">
            <div data-reveal="" className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Miễn phí</span>
              <h2 className="section-title">Bắt đầu tập miễn phí ngay hôm nay</h2>
              <p className="mt-3 text-slate-600">Xem ngay, không cần đăng ký tài khoản.</p>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-5">
              {free.map((course, i) => (
                <div key={course.id} data-reveal="" style={revealDelay(i)} className="flex w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc((100%-2.5rem)/3)] [&>*]:w-full">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CHƯƠNG TRÌNH PHỤC HỒI (trả phí): mọi nút "Đăng ký" cuộn tới box đăng ký */}
      <section id="khoa-hoc" className="scroll-mt-16 bg-gradient-to-b from-gold-50/70 to-white py-16 sm:py-24">
        <div className="container-page">
          <div data-reveal="" className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Chương trình phục hồi chức năng</span>
            <h2 className="section-title">Chọn chương trình phù hợp với bạn</h2>
            <p className="mt-3 text-slate-600">
              Lộ trình tập theo từng buổi, chuẩn y khoa, có chuyên gia hướng dẫn. Gói theo tháng – tập đến đâu chắc đến đó.
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
        <section id="premium" className="relative isolate scroll-mt-16 overflow-hidden bg-ocean-950 py-16 text-white sm:py-24">
          <div aria-hidden="true" className="absolute -right-20 -top-20 -z-10 h-80 w-80 animate-blob rounded-full bg-ocean-600/40 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-10 -z-10 h-72 w-72 animate-blob rounded-full bg-gold-500/20 blur-3xl [animation-delay:-9s]" />
          <div className="container-page">
            <div data-reveal="" className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Premium chuyên sâu</span>
              <h2 className="section-title text-white">Tập trực tiếp cùng bác sĩ</h2>
              <p className="mt-3 text-ocean-100">Nhóm nhỏ 1:4, 1:2 hoặc kèm riêng 1:1. Liên hệ Zalo để được tư vấn và nhận ưu đãi.</p>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-5 text-slate-900">
              {premium.map((course, i) => (
                <div key={course.id} data-reveal="" style={revealDelay(i)} className="flex w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc((100%-2.5rem)/3)] [&>*]:w-full">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FORM ĐĂNG KÝ: mọi nút "Đăng ký" trên trang đều cuộn tới đây */}
      <section id="dang-ky" className="scroll-mt-16 py-16 sm:py-24">
        <div className="container-page">
          <div data-reveal="" className="mx-auto mb-10 max-w-2xl text-center">
            <span className="eyebrow">Đăng ký học</span>
            <h2 className="section-title">Bắt đầu hành trình phục hồi chỉ với 3 bước</h2>
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

      {/* FAQ + liên hệ trực tiếp */}
      <section className="bg-ocean-50/60 py-16 sm:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div data-reveal="">
              <span className="eyebrow">Câu hỏi thường gặp</span>
              <h2 className="section-title">Bạn còn thắc mắc?</h2>
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

          <div data-reveal="right" className="lg:pt-16">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-600 to-ocean-800 p-8 text-white shadow-xl shadow-ocean-900/20">
              <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 animate-blob rounded-full bg-gold-400/30 blur-2xl" />
              <h3 className="relative text-2xl font-bold text-white">Chưa biết chọn chương trình nào?</h3>
              <p className="relative mt-3 text-ocean-100">
                Nhắn tình trạng của bạn cho trung tâm, bác sĩ sẽ tư vấn lộ trình phù hợp – hoàn toàn miễn phí.
              </p>
              <div className="relative mt-6 grid gap-3">
                <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="btn-gold text-base">
                  Tư vấn qua Zalo
                </a>
                <a href={hotlineHref} className="btn border border-white/30 text-base text-white hover:bg-white/10 focus-visible:ring-white/30">
                  <PhoneIcon className="h-5 w-5" /> {siteConfig.hotline}
                </a>
              </div>
            </div>
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
