import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getRegistrableCourses } from '@/lib/supabase/public'
import { hotlineHref, siteConfig } from '@/lib/site-config'
import { CheckIcon, PhoneIcon } from '@/components/icons'
import RegisterForm from './RegisterForm'

export const metadata: Metadata = { title: 'Đăng ký khóa học' }
export const revalidate = 300

export default async function RegisterPage() {
  const courses = await getRegistrableCourses()

  return (
    <main className="bg-gradient-to-b from-ocean-50 via-white to-gold-50/50">
      <section className="container-page pb-6 pt-10 text-center sm:pt-14">
        <span className="eyebrow">Đăng ký khóa học</span>
        <h1 className="mt-4 text-2xl font-bold sm:text-4xl">
          Bắt đầu hành trình <span className="text-ocean-600">khỏe mạnh</span> cùng {siteConfig.name}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Hoàn thành 3 bước bên dưới. Khóa học được mở ngay sau khi trung tâm xác nhận
          thanh toán.
        </p>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
          {['Thanh toán an toàn qua QR', 'Kích hoạt nhanh', 'Bác sĩ hỗ trợ tận tình'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-ocean-500" /> {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-16">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<div className="card h-[36rem] animate-pulse" />}>
            <RegisterForm courses={courses} />
          </Suspense>

          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-600">
            <PhoneIcon className="h-4 w-4 text-ocean-600" />
            Cần hỗ trợ? Gọi
            <a href={hotlineHref} className="font-semibold text-ocean-700 hover:underline">
              {siteConfig.hotline}
            </a>
            hoặc
            <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ocean-700 hover:underline">
              nhắn Zalo
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
