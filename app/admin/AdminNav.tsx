'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// adminOnly: nhân viên (staff) không thấy tab này (middleware cũng chặn)
const tabs = [
  { href: '/admin/registrations', label: 'Đơn đăng ký', adminOnly: false },
  { href: '/admin/users', label: 'Học viên', adminOnly: false },
  { href: '/admin/courses', label: 'Khóa học', adminOnly: true },
]

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Menu quản trị" className="-mb-px flex gap-1 overflow-x-auto">
      {tabs
        .filter((t) => isAdmin || !t.adminOnly)
        .map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`)
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'border-ocean-500 text-ocean-700'
                  : 'border-transparent text-slate-500 hover:text-ocean-700'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
    </nav>
  )
}
