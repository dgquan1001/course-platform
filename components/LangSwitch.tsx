'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/i18n'
import { GlobeIcon } from './icons'

// Nút chuyển ngữ VI | EN trên header (chỉ hiện ở trang chủ "/" và "/en" – ADR-018).
// Nền vàng trượt sang ngôn ngữ đang chọn; giữ nguyên mục đang xem (#bac-si, #khoa-hoc…) khi chuyển.
export default function LangSwitch({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter()
  const index = LOCALES.findIndex((l) => l.value === locale)

  return (
    <nav aria-label={label} className="relative flex items-center rounded-full border border-ocean-100 bg-ocean-50/80 p-1 text-xs font-bold">
      <GlobeIcon className="mx-1.5 hidden h-4 w-4 text-ocean-500 sm:block" />
      <span className="relative grid grid-cols-2">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-gold-400 shadow transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {LOCALES.map((l) => {
          const active = l.value === locale
          return (
            <Link
              key={l.value}
              href={l.href}
              hrefLang={l.value}
              lang={l.value}
              title={l.name}
              aria-label={l.name}
              aria-current={active ? 'true' : undefined}
              onClick={(e) => {
                if (active) return e.preventDefault()
                e.preventDefault()
                router.push(`${l.href}${window.location.hash}`)
              }}
              className={`relative z-10 grid min-h-[32px] min-w-[40px] place-items-center rounded-full px-2.5 transition-colors ${
                active ? 'text-ocean-950' : 'text-slate-500 hover:text-ocean-700'
              }`}
            >
              {l.label}
            </Link>
          )
        })}
      </span>
    </nav>
  )
}
