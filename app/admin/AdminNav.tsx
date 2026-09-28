'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookIcon, ClipboardIcon, HomeIcon, SettingsIcon, StarIcon, StethoscopeIcon, UsersIcon } from '@/components/icons'

// Thứ tự menu do chủ dự án chốt 29/09/2026 (UI-02).
// adminOnly: nhân viên (staff) không thấy mục này (trang cũng tự chặn bằng requireAdminPage)
// exact: "Tổng quan" (/admin) chỉ sáng khi đúng trang, không sáng theo các trang con
const tabs = [
  { href: '/admin', label: 'Tổng quan', icon: HomeIcon, adminOnly: false, exact: true },
  { href: '/admin/registrations', label: 'Đơn đăng ký', icon: ClipboardIcon, adminOnly: false },
  { href: '/admin/patients', label: 'Bệnh nhân', icon: UsersIcon, adminOnly: false },
  { href: '/admin/courses', label: 'Khóa học', icon: BookIcon, adminOnly: true },
  { href: '/admin/consultations', label: 'Phiếu tham vấn', icon: StethoscopeIcon, adminOnly: false },
  { href: '/admin/leads', label: 'Khách quan tâm', icon: StarIcon, adminOnly: false },
  { href: '/admin/settings/consultation', label: 'Mẫu phiếu', icon: SettingsIcon, adminOnly: true },
]

// Màn hình < lg: hàng tab gạch chân cuộn ngang; từ lg: cột dọc trong sidebar bên trái (layout.tsx).
// counts: số việc cần xử lý theo href (server component bọc Suspense, truyền từ layout)
export default function AdminNav({ isAdmin, counts = {} }: { isAdmin: boolean; counts?: Record<string, React.ReactNode> }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Menu quản trị" className="-mb-px flex gap-1 overflow-x-auto lg:mb-0 lg:flex-col lg:overflow-visible">
      {tabs
        .filter((t) => isAdmin || !t.adminOnly)
        .map((t) => {
          const active = pathname === t.href || (!t.exact && pathname.startsWith(`${t.href}/`))
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition lg:rounded-r-lg lg:border-b-0 lg:border-l-4 lg:px-3 lg:py-2.5 ${
                active
                  ? 'border-ocean-500 text-ocean-700 lg:bg-ocean-50'
                  : 'border-transparent text-slate-500 hover:text-ocean-700 lg:hover:bg-slate-50'
              }`}
            >
              <Icon className="hidden h-5 w-5 shrink-0 lg:block" />
              <span data-nav-label>{t.label}</span>
              {counts[t.href]}
            </Link>
          )
        })}
    </nav>
  )
}
