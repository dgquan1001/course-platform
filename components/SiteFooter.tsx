'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { hotlineHref, siteConfig } from '@/lib/site-config'
import { chromeCopy, homeHref, localeOfPath } from '@/lib/i18n'
import { MailIcon, MapPinIcon, PhoneIcon, SpineIcon } from './icons'

// Chân trang (nền xanh đậm – Đợt 20); ở trang chủ tiếng Anh (/en) hiện bản tiếng Anh (ADR-018)
export default function SiteFooter() {
  const pathname = usePathname()
  const locale = localeOfPath(pathname)
  const t = chromeCopy[locale]
  const home = homeHref(locale)
  // Khu quản trị (Đợt 23) là công cụ làm việc: không cần chân trang giới thiệu
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null

  return (
    <footer id="lien-he" lang={locale} className="relative isolate scroll-mt-16 overflow-hidden bg-ocean-950 text-ocean-100">
      <div aria-hidden="true" className="absolute -top-32 right-0 -z-10 h-72 w-72 rounded-full bg-ocean-600/30 blur-3xl" />
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="flex items-center gap-2.5 text-lg font-bold text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ocean-600 text-gold-200">
              <SpineIcon className="h-5 w-5" />
            </span>
            {siteConfig.name}
          </p>
          <p className="mt-2 text-sm text-ocean-200">{siteConfig.fullName}</p>
          <p className="mt-1 font-medium text-gold-300">{t.tagline}</p>
          <p className="mt-3 max-w-md text-sm text-ocean-100/80">{t.description}</p>
          <ul aria-label={t.branchesLabel} className="mt-5 space-y-2 text-sm text-ocean-100/90">
            {siteConfig.branches.map((b, i) => (
              <li key={b} className="flex gap-2">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                <span>
                  <strong className="font-semibold text-white">{t.branch(i + 1)}</strong> {b}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">{t.links}</p>
          <ul className="space-y-2">
            <li><Link href={`${home}#khoa-hoc`} className="hover:text-gold-300">{t.linkPrograms}</Link></li>
            <li><Link href="/register" className="hover:text-gold-300">{t.register}</Link></li>
            <li><Link href="/login" className="hover:text-gold-300">{t.login}</Link></li>
            <li><Link href="/chinh-sach-bao-mat" className="hover:text-gold-300">{t.privacy}</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">{t.contact}</p>
          <ul className="space-y-3">
            <li>
              <a href={hotlineHref} className="flex items-center gap-2 font-semibold text-gold-300 hover:underline">
                <PhoneIcon className="h-4 w-4" /> {siteConfig.hotline}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 break-all hover:text-gold-300">
                <MailIcon className="h-4 w-4 shrink-0" /> {siteConfig.email}
              </a>
            </li>
            <li>
              <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold-300">
                {t.zalo}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-ocean-200/80">
        © {new Date().getFullYear()} {siteConfig.name}. {t.disclaimer}
      </div>
    </footer>
  )
}
