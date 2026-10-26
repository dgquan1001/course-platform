import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import RegisterForm from '@/app/register/RegisterForm'
import { getPublishedCourses } from '@/lib/supabase/public'
import { hotlineHref, siteConfig } from '@/lib/site-config'
import { homeCopy, type Locale } from '@/lib/i18n'
import { revealDelay } from '@/lib/reveal'
import CountUp from '@/components/CountUp'
import CourseCard from '@/components/CourseCard'
import HtmlLang from '@/components/HtmlLang'
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

type TitlePart = { text: string; accent?: boolean }

// Tiêu đề hero chia theo từ, mỗi từ hiện lần lượt (animate-word-in); trình đọc màn hình vẫn đọc liền câu
function KineticTitle({ parts, accentClass, delay = 120 }: { parts: TitlePart[]; accentClass: string; delay?: number }) {
  let i = 0
  return parts.flatMap((p, pi) =>
    p.text.split(' ').map((w, wi) => {
      const n = i++
      return (
        <span key={`${pi}-${wi}`}>
          {n > 0 && ' '}
          <span
            className={`inline-block animate-word-in ${p.accent ? accentClass : ''}`}
            style={{ animationDelay: `${delay + n * 70}ms` }}
          >
            {w}
          </span>
        </span>
      )
    })
  )
}

// Tiêu đề section có từ nhấn (hiện dần khi cuộn)
function Title({ parts, accentClass = 'text-gradient' }: { parts: TitlePart[]; accentClass?: string }) {
  return parts.map((p, i) => (
    <span key={i}>
      {i > 0 && ' '}
      <span className={p.accent ? accentClass : ''}>{p.text}</span>
    </span>
  ))
}

function SectionHead({ eyebrow, title, lead, dark = false }: { eyebrow: string; title: string; lead?: string; dark?: boolean }) {
  return (
    <div data-reveal="" className="mx-auto max-w-3xl text-center">
      <span className={dark ? 'eyebrow-dark' : 'eyebrow'}>{eyebrow}</span>
      <h2 className={`section-title ${dark ? 'text-white' : ''}`}>{title}</h2>
      {lead && <p className={`mx-auto mt-4 max-w-2xl text-base sm:text-lg ${dark ? 'text-ocean-100' : 'text-slate-600'}`}>{lead}</p>}
    </div>
  )
}

const benefitIcons = [AwardIcon, BookIcon, ClockIcon, ShieldIcon]
const expertiseIcons = [SpineIcon, StethoscopeIcon, ShieldIcon, UsersIcon]
const galleryPhotos = [practicePhoto, conferencePhoto, workshopPhoto, talkPhoto]

// Trang chủ dùng chung cho tiếng Việt ("/") và tiếng Anh ("/en") – Đợt 20 (ADR-018).
// Nội dung chữ ở lib/i18n.ts; dữ liệu khóa học lấy từ database (tên, mô tả giữ nguyên tiếng Việt).
export default async function HomePage({ locale }: { locale: Locale }) {
  const t = homeCopy[locale]
  const courses = await getPublishedCourses()
  const free = courses.filter((c) => c.kind === 'free')
  const programs = courses.filter((c) => c.kind === 'program')
  const premium = courses.filter((c) => c.kind === 'premium')
  const { doctor } = t
  const keywordItems = [...t.keywords, ...t.keywords]

  return (
    <main lang={locale} className="overflow-x-clip">
      <RevealObserver />
      {locale !== 'vi' && <HtmlLang lang={locale} />}
      {/* Thanh tiến độ cuộn trang (CSS scroll-driven, chỉ ở trình duyệt hỗ trợ) */}
      <div aria-hidden="true" className="scroll-progress fixed inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-gold-400 via-gold-300 to-ocean-400" />

      {/* HERO – nền xanh đậm, lưới mờ, vệt sáng chuyển động; tiêu đề hiện từng từ */}
      <section className="relative isolate overflow-hidden bg-ocean-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] animate-blob rounded-full bg-ocean-500/40 blur-3xl" />
          <div className="absolute -right-24 top-1/4 h-[28rem] w-[28rem] animate-blob rounded-full bg-gold-400/20 blur-3xl [animation-delay:-7s]" />
          <div className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] animate-blob rounded-full bg-ocean-300/25 blur-3xl [animation-delay:-13s]" />
          <div className="bg-grid absolute inset-0" />
        </div>

        <div className="container-page grid items-center gap-14 pb-28 pt-14 sm:pt-20 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.15fr_0.85fr] lg:pb-32">
          <div>
            <span className="eyebrow-dark animate-fade-up-slow">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
              </span>
              {t.eyebrow}
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              <KineticTitle parts={t.heroTitle} accentClass="text-gradient-light" />
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up-slow text-base text-ocean-100/90 [animation-delay:700ms] sm:text-lg">
              {t.heroLead(doctor.name)}
            </p>
            <div className="mt-9 flex animate-fade-up-slow flex-col gap-3 [animation-delay:850ms] sm:flex-row">
              <Link href="#dang-ky" className="btn-gold btn-shine group px-7 text-base shadow-[0_12px_40px_-12px] shadow-gold-400/70">
                {t.ctaRegister}
                <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <Link href={free.length ? '#mien-phi' : '#khoa-hoc'} className="btn glass px-7 text-base text-white hover:bg-white/20 focus-visible:ring-white/30">
                <PlayIcon className="h-4 w-4 text-gold-300" /> {free.length ? t.ctaFree : t.ctaPrograms}
              </Link>
            </div>
            <a
              href={hotlineHref}
              className="mt-6 inline-flex animate-fade-up-slow items-center gap-2 text-sm text-ocean-100 [animation-delay:1000ms] hover:text-white"
            >
              <PhoneIcon className="h-4 w-4 text-gold-300" />
              {t.hotline} <strong className="text-white">{siteConfig.hotline}</strong>
            </a>
          </div>

          {/* Ảnh bác sĩ: viền gradient xoay, quầng sáng, thẻ kính nổi; trôi chậm khi cuộn (parallax) */}
          <div data-parallax="" className="[--parallax:28px]">
          <div className="relative mx-auto w-full max-w-sm animate-fade-up-slow [animation-delay:300ms] lg:max-w-md">
            <div aria-hidden="true" className="absolute -inset-10 animate-glow rounded-full bg-gold-400/25 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.4rem] p-[3px] shadow-2xl shadow-black/40">
              <div
                aria-hidden="true"
                className="absolute -inset-1/2 animate-spin-slow bg-[conic-gradient(from_0deg,#F8E09A,#4A91C4,#E8B84B,#A0CAE7,#F8E09A)]"
              />
              <Image
                src={doctorPhoto}
                alt={doctor.name}
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 448px, (min-width: 640px) 384px, 90vw"
                className="relative aspect-[4/5] w-full rounded-[2.25rem] object-cover"
              />
            </div>
            <div className="absolute -left-4 top-10 border border-white/15 bg-ocean-950/70 backdrop-blur-md animate-float rounded-2xl px-4 py-3 shadow-xl sm:-left-10">
              <p className="text-3xl font-bold text-gold-300">10+</p>
              <p className="text-xs text-ocean-100">{t.badgeYears}</p>
            </div>
            <div className="absolute -right-4 top-1/2 border border-white/15 bg-ocean-950/70 backdrop-blur-md flex animate-float items-center gap-3 rounded-2xl px-4 py-3 shadow-xl [animation-delay:-3s] sm:-right-10">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-400 text-ocean-950">
                <AwardIcon className="h-5 w-5" />
              </span>
              <span className="text-xs leading-tight text-ocean-100">
                {t.badgeCert}
                <br />
                <strong className="text-sm text-white">Schroth · SSOL</strong>
              </span>
            </div>
            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl bg-white p-4 text-slate-700 shadow-2xl sm:left-8 sm:right-auto">
              <p className="font-bold text-ocean-900">{doctor.name}</p>
              <p className="text-xs text-slate-500">{t.founder}</p>
            </div>
          </div>
          </div>
        </div>

        <a
          href="#van-de"
          aria-label={t.scroll}
          className="absolute bottom-16 left-1/2 hidden h-10 w-6 -translate-x-1/2 justify-center rounded-full border-2 border-white/30 pt-2 lg:flex"
        >
          <span className="h-2 w-1 animate-scroll-cue rounded-full bg-gold-300" />
        </a>
      </section>

      {/* Hai dải chuyên môn chạy ngược chiều, đặt chéo đè lên đáy hero */}
      <div className="relative z-10 -mt-12 py-8">
        <div aria-hidden="true" className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 rotate-2 overflow-hidden bg-ocean-700 py-3 text-ocean-100/80">
          <div className="flex w-max animate-marquee-reverse gap-10">
            {keywordItems.map((k, i) => (
              <span key={i} className="whitespace-nowrap text-sm font-semibold uppercase tracking-wider">
                ✦ {k}
              </span>
            ))}
          </div>
        </div>
        <div className="group relative -mx-[5%] -rotate-2 overflow-hidden bg-gold-400 py-4 text-ocean-950 shadow-xl shadow-ocean-950/20">
          <ul aria-label={t.keywordsLabel} className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused]">
            {keywordItems.map((k, i) => (
              <li
                key={i}
                aria-hidden={i >= t.keywords.length || undefined}
                className="flex items-center gap-3 whitespace-nowrap text-sm font-bold uppercase tracking-wider"
              >
                <SpineIcon className="h-4 w-4 text-ocean-700" /> {k}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SỐ LIỆU – đếm tăng khi cuộn tới */}
      <section className="py-14 sm:py-20">
        <div className="container-page">
          <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-ocean-100">
            {t.stats.map((s, i) => (
              <div key={s.label} data-reveal="" style={revealDelay(i, 120)} className="px-4 text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-gradient text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </dd>
                <dd className="mx-auto mt-2 max-w-[14rem] text-sm text-slate-600">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* VẤN ĐỀ → GIẢI PHÁP – bố cục bento */}
      <section id="van-de" className="scroll-mt-16 pb-20 sm:pb-28">
        <div className="container-page grid gap-4 lg:grid-cols-4 lg:grid-rows-2">
          <div
            data-reveal="left"
            className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 p-8 text-white sm:p-10 lg:col-span-2 lg:row-span-2"
          >
            <SpineIcon className="pointer-events-none absolute -bottom-10 -right-6 -z-10 h-64 w-64 animate-float text-white/5" />
            <div aria-hidden="true" className="absolute -right-20 -top-20 -z-10 h-64 w-64 animate-glow rounded-full bg-gold-400/20 blur-3xl" />
            <span className="eyebrow-dark">{t.painEyebrow}</span>
            <h2 className="section-title text-white">
              <Title parts={t.painTitle} accentClass="text-gradient-light" />
            </h2>
            <p className="mt-4 text-ocean-100">{t.painLead}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {t.pains.map((p) => (
                <li key={p} className="glass flex gap-3 rounded-2xl p-4 text-sm text-white">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-400 text-ocean-950">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          {t.benefits.map(({ title, text }, i) => {
            const Icon = benefitIcons[i]
            return (
              <div key={title} data-reveal="" style={revealDelay(i, 110)}>
                <div className="card card-lift spotlight group h-full rounded-[2rem] p-7">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ocean-50 text-ocean-600 transition duration-500 group-hover:rotate-6 group-hover:bg-ocean-600 group-hover:text-gold-200">
                    <Icon className="h-7 w-7" />
                  </span>
                  <h3 className="mt-6 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* BÁC SĨ – cột ảnh dính khi cuộn, cột hồ sơ cuộn bên cạnh */}
      <section id="bac-si" className="scroll-mt-16 bg-ocean-50/70 py-20 sm:py-28">
        <div className="container-page">
          <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="lg:sticky lg:top-24">
              <div data-reveal="left" className="relative mx-auto max-w-lg pb-12 pr-12">
                <Image
                  src={teachingPhoto}
                  alt={`${doctor.name} ${t.photoTeaching}`}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 460px, 90vw"
                  className="w-full rounded-[2rem] object-cover shadow-2xl shadow-ocean-900/15"
                />
                <Image
                  src={schrothPhoto}
                  alt={`${doctor.name} ${t.photoSchroth}`}
                  placeholder="blur"
                  sizes="200px"
                  className="absolute bottom-0 right-0 w-36 animate-float rounded-2xl border-4 border-white object-cover shadow-xl sm:w-44"
                />
              </div>
              <figure data-reveal="" className="relative mx-auto mt-8 max-w-lg rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ocean-100">
                <span aria-hidden="true" className="absolute -top-5 left-6 font-serif text-6xl leading-none text-gold-400">
                  “
                </span>
                <blockquote className="text-slate-700">{t.doctorQuote}</blockquote>
                <figcaption className="mt-3 text-sm font-semibold text-ocean-800">— {doctor.name}</figcaption>
              </figure>
            </div>

            <div>
              <div data-reveal="right">
                <span className="eyebrow">{t.doctorEyebrow}</span>
                <h2 className="section-title">{doctor.name}</h2>
                <p className="mt-3 font-semibold text-ocean-700">{doctor.title}</p>
                <p className="mt-4 text-slate-600">
                  {doctor.summary}, {t.doctorIntro}
                </p>
              </div>

              <div data-reveal="" className="mt-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ocean-100 sm:p-8">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-800">
                  <GraduationIcon className="h-5 w-5" /> {t.educationTitle}
                </h3>
                <ul className="mt-4 space-y-3">
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

              <div id="chuyen-mon" className="mt-12 scroll-mt-20">
                <h3 data-reveal="" className="text-2xl font-bold">
                  {t.expertiseTitle}
                </h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {doctor.expertise.map((e, i) => {
                    const Icon = expertiseIcons[i % expertiseIcons.length]
                    return (
                      <div key={e.title} data-reveal="" style={revealDelay(i)}>
                        <div className="card card-lift spotlight group relative h-full overflow-hidden rounded-3xl p-6">
                          <span
                            aria-hidden="true"
                            className="absolute -right-8 -top-8 -z-10 h-24 w-24 rounded-full bg-gold-100/80 transition duration-700 group-hover:scale-[3.5]"
                          />
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ocean-600 text-gold-200 shadow-lg shadow-ocean-600/30">
                            <Icon className="h-6 w-6" />
                          </span>
                          <h4 className="mt-4 font-bold text-ocean-950">{e.title}</h4>
                          <p className="mt-2 text-sm text-slate-600">{e.text}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-12">
                <h3 data-reveal="" className="text-2xl font-bold">
                  {t.careerTitle}
                </h3>
                <div className="relative mt-6">
                  <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-0.5 rounded bg-ocean-200" />
                  <span aria-hidden="true" className="timeline-fill absolute bottom-2 left-[7px] top-2 w-0.5 rounded bg-gradient-to-b from-gold-400 to-ocean-500" />
                  <ol className="space-y-7 pl-10">
                    {doctor.career.map((c, i) => (
                      <li key={c.time} data-reveal="" style={revealDelay(i, 150)} className="relative">
                        <span aria-hidden="true" className="absolute -left-10 top-1 h-4 w-4 rounded-full border-4 border-white bg-gold-500 shadow ring-2 ring-gold-200" />
                        <p className="text-sm font-bold text-gold-800">{c.time}</p>
                        <p className="mt-1 text-slate-700">{c.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <h3 data-reveal="" className="text-center text-2xl font-bold">
              {t.galleryTitle}
            </h3>
            <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {galleryPhotos.map((src, i) => (
                <li key={t.gallery[i]} data-reveal="zoom" style={revealDelay(i, 120)}>
                  <figure className="group relative aspect-[4/5] overflow-hidden rounded-3xl shadow-lg shadow-ocean-900/10">
                    <Image
                      src={src}
                      alt={t.gallery[i]}
                      placeholder="blur"
                      sizes="(min-width: 1024px) 280px, 45vw"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-950/90 via-ocean-950/40 to-transparent p-4 pt-16 text-xs font-medium text-white transition duration-500 sm:text-sm lg:translate-y-2 lg:group-hover:translate-y-0">
                      {t.gallery[i]}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* KHÓA MIỄN PHÍ: ai cũng xem được, không cần đăng nhập */}
      {!!free.length && (
        <section id="mien-phi" className="scroll-mt-16 py-20 sm:py-28">
          <div className="container-page">
            <SectionHead eyebrow={t.freeEyebrow} title={t.freeTitle} lead={t.freeLead} />
            <div className="mt-12 flex flex-wrap justify-center gap-5">
              {free.map((course, i) => (
                <div key={course.id} data-reveal="" style={revealDelay(i)} className="flex w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc((100%-2.5rem)/3)] [&>*]:w-full">
                  <CourseCard course={course} locale={locale} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CHƯƠNG TRÌNH PHỤC HỒI (trả phí): mọi nút "Đăng ký" cuộn tới box đăng ký */}
      <section id="khoa-hoc" className="scroll-mt-16 bg-gradient-to-b from-gold-50 to-white py-20 sm:py-28">
        <div className="container-page">
          <SectionHead eyebrow={t.programEyebrow} title={t.programTitle} lead={t.programLead} />
          <ProgramGrid courses={programs} locale={locale} />
          {!programs.length && (
            <p className="card mt-8 p-8 text-center text-slate-500">
              {t.programEmpty} <a href={hotlineHref} className="font-semibold text-ocean-700">{siteConfig.hotline}</a> {t.programEmptyAfter}
            </p>
          )}
        </div>
      </section>

      {/* PREMIUM 1:4, 1:2, 1:1: chỉ có thông tin, liên hệ Zalo để nhận ưu đãi */}
      {!!premium.length && (
        <section id="premium" className="relative isolate scroll-mt-16 overflow-hidden bg-ocean-950 py-20 text-white sm:py-28">
          <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10" />
          <div aria-hidden="true" className="absolute -right-20 -top-20 -z-10 h-96 w-96 animate-blob rounded-full bg-ocean-500/40 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-10 -z-10 h-80 w-80 animate-blob rounded-full bg-gold-400/20 blur-3xl [animation-delay:-9s]" />
          <div className="container-page">
            <SectionHead eyebrow={t.premiumEyebrow} title={t.premiumTitle} lead={t.premiumLead} dark />
            <div className="mt-12 flex flex-wrap justify-center gap-5 text-slate-900">
              {premium.map((course, i) => (
                <div key={course.id} data-reveal="" style={revealDelay(i)} className="flex w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc((100%-2.5rem)/3)] [&>*]:w-full">
                  <CourseCard course={course} locale={locale} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ĐĂNG KÝ: bản tiếng Việt có form 3 bước (mọi nút "Đăng ký" cuộn tới đây); bản tiếng Anh tóm tắt 3 bước + mở form tiếng Việt */}
      <section id="dang-ky" className="scroll-mt-16 py-20 sm:py-28">
        <div className="container-page">
          <div className="mb-12">
            <SectionHead eyebrow={t.registerEyebrow} title={t.registerTitle} lead={t.registerLead} />
          </div>
          {locale === 'vi' ? (
            <div className="mx-auto max-w-5xl">
              <Suspense fallback={<div className="card h-[36rem] animate-pulse" />}>
                <RegisterForm courses={programs} />
              </Suspense>
            </div>
          ) : (
            <div data-reveal="" className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-ocean-600 to-ocean-800 p-8 text-white shadow-2xl shadow-ocean-900/20 sm:p-10">
              <ol className="grid gap-4 sm:grid-cols-3">
                {t.registerSteps.map((s, i) => (
                  <li key={s} className="glass rounded-2xl p-5">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-400 font-bold text-ocean-950">{i + 1}</span>
                    <p className="mt-3 text-sm text-ocean-50">{s}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/#dang-ky" hrefLang="vi" className="btn-gold btn-shine px-7 text-base">
                  {t.registerForm} <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="btn glass px-7 text-base text-white hover:bg-white/20">
                  {t.zalo}
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ + liên hệ trực tiếp */}
      <section className="bg-ocean-50/70 py-20 sm:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div data-reveal="">
              <span className="eyebrow">{t.faqEyebrow}</span>
              <h2 className="section-title">{t.faqTitle}</h2>
            </div>
            <div className="mt-8 space-y-3">
              {t.faqs.map((f) => (
                <details key={f.q} className="card group p-5 transition open:shadow-md [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ocean-900">
                    {f.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-600 transition duration-300 group-open:rotate-45 group-open:bg-gold-400 group-open:text-ocean-950">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div data-reveal="right" className="lg:pt-20">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-ocean-950 p-8 text-white shadow-2xl shadow-ocean-900/30">
              <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10" />
              <span aria-hidden="true" className="absolute -right-10 -top-10 -z-10 h-48 w-48 animate-blob rounded-full bg-gold-400/30 blur-2xl" />
              <h3 className="text-2xl font-bold text-white">{t.consultTitle}</h3>
              <p className="mt-3 text-ocean-100">{t.consultText}</p>
              <div className="mt-6 grid gap-3">
                <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-shine text-base">
                  {t.zalo}
                </a>
                <a href={hotlineHref} className="btn glass text-base text-white hover:bg-white/20 focus-visible:ring-white/30">
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
          <PhoneIcon className="h-4 w-4" /> {t.mobileCall}
        </a>
        <Link href={locale === 'vi' ? '#dang-ky' : '/#dang-ky'} className="btn-gold">
          {t.mobileRegister}
        </Link>
      </div>
    </main>
  )
}
