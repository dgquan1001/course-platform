'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { realEmail } from '@/lib/phone'
import { siteConfig } from '@/lib/site-config'
import {
  BookIcon,
  ChevronDownIcon,
  CloseIcon,
  LogOutIcon,
  MenuIcon,
  ShieldIcon,
  SpineIcon,
  SpinnerIcon,
  UserIcon,
} from './icons'
import { toast } from './Toaster'

type HeaderUser = { isAdmin: boolean; name: string; subtitle: string } | null

const navLinks = [
  { href: '/#bac-si', label: 'Bác sĩ' },
  { href: '/#khoa-hoc', label: 'Khóa học' },
  { href: '/#dang-ky', label: 'Cách đăng ký' },
  { href: '/#lien-he', label: 'Liên hệ' },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<HeaderUser | undefined>(undefined)
  const [navOpen, setNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  // Đọc phiên đăng nhập từ cookie ở trình duyệt, nhờ vậy các trang công khai
  // vẫn được cache tĩnh; kiểm tra lại mỗi lần chuyển trang (login/logout qua server action)
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        if (!cancelled) setUser(null)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, phone')
        .eq('id', session.user.id)
        .single()
      const contact = realEmail(session.user.email) ?? profile?.phone ?? ''
      if (!cancelled) {
        setUser({
          isAdmin: profile?.role === 'admin',
          name: profile?.full_name || contact || 'Tài khoản',
          subtitle: contact,
        })
      }
    }

    load()
    setNavOpen(false)
    setAccountOpen(false)
    return () => {
      cancelled = true
    }
  }, [pathname])

  // Đóng menu tài khoản khi bấm ra ngoài
  useEffect(() => {
    if (!accountOpen) return
    const onDown = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [accountOpen])

  async function signOut() {
    setSigningOut(true)
    const { error } = await createClient().auth.signOut()
    setSigningOut(false)
    if (error) {
      toast(`Đăng xuất không thành công: ${error.message}`, 'error')
      return
    }
    setUser(null)
    setAccountOpen(false)
    toast('Đã đăng xuất')
    router.push('/')
    router.refresh()
  }

  // Link trỏ tới trang hiện tại được tô nổi bật để người dùng biết mình đang ở đâu
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const current = (href: string) => (isActive(href) ? { 'aria-current': 'page' as const } : {})

  const menuItem = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-ocean-50 hover:text-ocean-700 ${
      isActive(href) ? 'bg-ocean-50 text-ocean-700' : 'text-slate-700'
    }`

  const accountMenu = user && (
    <div ref={accountRef} className="group relative">
      <button
        type="button"
        onClick={() => setAccountOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={accountOpen}
        aria-label="Tài khoản"
        className={`btn-ghost gap-2 px-2 sm:px-3 ${isActive('/account') || isActive('/courses') ? 'nav-active' : ''}`}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ocean-600 text-sm font-bold text-white">
          {user.name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? <UserIcon className="h-4 w-4" />}
        </span>
        <span className="hidden sm:inline">Tài khoản</span>
        <ChevronDownIcon className="h-4 w-4 transition group-hover:rotate-180" />
      </button>

      {/* pt-2 tạo "cầu nối" để rê chuột từ nút xuống menu không bị mất hover */}
      <div
        className={`absolute right-0 top-full z-50 pt-2 transition duration-150 ${
          accountOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
        } [@media(hover:hover)]:group-hover:visible [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100`}
      >
        <div role="menu" aria-label="Menu tài khoản" className="card w-64 p-2 shadow-lg shadow-ocean-900/10">
          <div className="border-b border-slate-100 px-3 pb-3 pt-2">
            <p className="truncate font-semibold text-ocean-900">{user.name}</p>
            {user.subtitle && <p className="truncate text-xs text-slate-500">{user.subtitle}</p>}
          </div>
          <div className="py-1">
            <Link href="/account" role="menuitem" className={menuItem('/account')} {...current('/account')}>
              <UserIcon className="h-4 w-4" /> Tài khoản của tôi
            </Link>
            <Link href="/courses" role="menuitem" className={menuItem('/courses')} {...current('/courses')}>
              <BookIcon className="h-4 w-4" /> Khóa học của tôi
            </Link>
            {user.isAdmin && (
              <Link href="/admin" role="menuitem" className={menuItem('/admin')}>
                <ShieldIcon className="h-4 w-4" /> Quản trị
              </Link>
            )}
          </div>
          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {signingOut ? <SpinnerIcon className="h-4 w-4" /> : <LogOutIcon className="h-4 w-4" />}
              {signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const guestLinks = (
    <>
      <Link href="/login" className={`btn-ghost ${isActive('/login') ? 'nav-active' : ''}`} {...current('/login')}>
        Đăng nhập
      </Link>
      <Link
        href="/register"
        className={`btn-gold ${isActive('/register') ? 'bg-gold-300 ring-4 ring-gold-200' : ''}`}
        {...current('/register')}
      >
        Đăng ký học
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-ocean-100/70 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ocean-600 text-gold-200">
            <SpineIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-bold text-ocean-900">{siteConfig.name}</span>
            <span className="block truncate text-[11px] text-slate-500">{siteConfig.tagline}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="btn-ghost px-3">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-h-[44px] items-center gap-1 sm:gap-2">
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={`btn-ghost hidden lg:inline-flex ${isActive('/admin') ? 'nav-active' : ''}`}
              {...current('/admin')}
            >
              Quản trị
            </Link>
          )}
          {user === null && <div className="hidden items-center gap-2 lg:flex">{guestLinks}</div>}
          {accountMenu}
          <button
            className="btn-ghost -mr-2 px-3 lg:hidden"
            onClick={() => setNavOpen((v) => !v)}
            aria-label={navOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={navOpen}
          >
            {navOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {navOpen && (
        <div className="border-t border-ocean-100 bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setNavOpen(false)} className="btn-ghost justify-start">
                {l.label}
              </Link>
            ))}
            {user === null && (
              <div className="mt-2 grid gap-2 border-t border-ocean-100 pt-3 [&>*]:w-full">{guestLinks}</div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
