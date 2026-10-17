'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { loadBrowserClient, readCookies, writeCookie } from '@/lib/browser-cookies'
import { invalidateProfile } from '@/lib/use-profile'
import {
  ACTIVITY_COOKIE,
  activityCookieOptions,
  expiredReason,
  formatActivity,
  isAuthCookie,
  isSecureOrigin,
  parseActivity,
  remembers,
  REMEMBER_COOKIE,
  TOUCH_EVERY_MS,
} from '@/lib/session-policy'
import { toast } from './Toaster'

const CHECK_EVERY_MS = 30_000
const PROTECTED = /^\/(courses|admin|account)(\/|$)/

// Đăng xuất trên trình duyệt: thu hồi phiên ở Supabase + xóa cookie phiên và mốc thời gian (dùng chung với nút Đăng xuất)
export async function signOutLocally(scope: 'local' | 'global' = 'local') {
  const { error } = await (await loadBrowserClient()).auth.signOut({ scope })
  for (const name of [ACTIVITY_COOKIE, REMEMBER_COOKIE]) writeCookie(name, '', { maxAge: 0 })
  // Phòng khi gọi Supabase lỗi mạng: vẫn xóa cookie phiên
  for (const { name } of readCookies()) if (isAuthCookie(name)) writeCookie(name, '', { maxAge: 0 })
  invalidateProfile()
  return { error }
}

// Tab vẫn mở nhưng không ai thao tác thì không có request nào tới middleware → tự kiểm tra ở trình duyệt (SEC-13):
// - mỗi 30 giây và khi quay lại tab: phiên quá giờ không thao tác / quá thời hạn → đăng xuất, về trang đăng nhập;
// - khi người dùng bấm / gõ / cuộn / chạm: ghi lại mốc "thao tác cuối" (tối đa mỗi phút một lần) – dùng chung mọi tab.
export default function SessionGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let signingOut = false
    const current = () => {
      const cookies = readCookies()
      if (!cookies.some((c) => isAuthCookie(c.name))) return null
      return { activity: parseActivity(cookies.find((c) => c.name === ACTIVITY_COOKIE)?.value) }
    }

    async function check() {
      const state = current()
      if (!state || signingOut) return
      const reason = expiredReason(state.activity)
      if (!reason) return
      signingOut = true
      await signOutLocally()
      const path = location.pathname
      if (PROTECTED.test(path)) {
        router.replace(`/login?error=${reason === 'idle' ? 'timeout' : 'expired'}&next=${encodeURIComponent(path + location.search)}`)
      } else {
        toast('Phiên đăng nhập đã hết hạn, bạn đã được đăng xuất.', 'error')
        router.refresh()
      }
      signingOut = false
    }

    function touch() {
      const state = current()
      const a = state?.activity
      if (!a || expiredReason(a)) return
      const now = Date.now()
      if (now - a.lastSeen < TOUCH_EVERY_MS) return
      const options = activityCookieOptions(remembers(a), isSecureOrigin(location.protocol, location.hostname))
      writeCookie(ACTIVITY_COOKIE, formatActivity({ ...a, lastSeen: now }), options)
    }

    const onVisible = () => document.visibilityState === 'visible' && check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }))
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisible)
    check()
    return () => {
      clearInterval(timer)
      events.forEach((e) => window.removeEventListener(e, touch))
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router, pathname])

  return null
}
