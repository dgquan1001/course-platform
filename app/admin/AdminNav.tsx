'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/admin', label: 'Đơn đăng ký' },
  { href: '/admin/users', label: 'Học viên' },
  { href: '/admin/courses', label: 'Khóa học' },
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
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
