import Link from 'next/link'
import { hotlineHref, siteConfig } from '@/lib/site-config'
import { MailIcon, PhoneIcon } from './icons'

export default function SiteFooter() {
  return (
    <footer id="lien-he" className="scroll-mt-16 border-t border-ocean-100 bg-ocean-50/60">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-lg font-bold text-ocean-900">
            {siteConfig.name} <span className="font-medium text-slate-500">({siteConfig.fullName})</span>
          </p>
          <p className="mt-1 font-medium text-ocean-700">{siteConfig.tagline}</p>
          <p className="mt-3 max-w-md text-sm text-slate-600">{siteConfig.description}</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-ocean-900">Liên kết</p>
          <ul className="space-y-2 text-slate-600">
            <li><Link href="/#khoa-hoc" className="hover:text-ocean-700">Chương trình phục hồi</Link></li>
            <li><Link href="/register" className="hover:text-ocean-700">Đăng ký học</Link></li>
            <li><Link href="/login" className="hover:text-ocean-700">Đăng nhập</Link></li>
            <li><Link href="/chinh-sach-bao-mat" className="hover:text-ocean-700">Chính sách bảo mật</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-ocean-900">Liên hệ</p>
          <ul className="space-y-3 text-slate-600">
            <li>
              <a href={hotlineHref} className="flex items-center gap-2 font-semibold text-ocean-700 hover:underline">
                <PhoneIcon className="h-4 w-4" /> {siteConfig.hotline}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 break-all hover:text-ocean-700">
                <MailIcon className="h-4 w-4 shrink-0" /> {siteConfig.email}
              </a>
            </li>
            <li>
              <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ocean-700">
                Nhắn tin qua Zalo
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ocean-100 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {siteConfig.name}. Nội dung khóa học mang tính hướng dẫn, không thay thế chẩn đoán và điều trị y khoa.
      </div>
    </footer>
  )
}
