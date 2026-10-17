import { createBrowserClient } from '@supabase/ssr'
import { authCookieOptions, isSecureOrigin, REMEMBER_COOKIE } from '@/lib/session-policy'
import { readCookies, writeCookie, type CookieOptions } from '@/lib/browser-cookies'

// Tự đọc / ghi cookie thay vì để @supabase/ssr ghi Max-Age 400 ngày khi làm mới token (SEC-13, lib/session-policy.ts).
// Component nên dùng loadBrowserClient() (lib/browser-cookies.ts) để chỉ tải thư viện khi cần (PERF-08).
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: readCookies,
      setAll(cookiesToSet) {
        const remember = readCookies().some((c) => c.name === REMEMBER_COOKIE && c.value === '1')
        const secure = isSecureOrigin(location.protocol, location.hostname)
        cookiesToSet.forEach(({ name, value, options }) =>
          writeCookie(name, value, authCookieOptions({ ...(options as CookieOptions), secure }, remember))
        )
      },
    },
  })
}
