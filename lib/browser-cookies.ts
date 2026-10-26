// Đọc / ghi cookie ở trình duyệt – tách riêng khỏi lib/supabase/client.ts để component chỉ cần cookie
// không kéo theo thư viện Supabase (~68 kB gzip) vào trang (PERF-08)
import { isAuthCookie } from '@/lib/session-policy'

type Options = { path?: string; domain?: string; maxAge?: number; expires?: Date; sameSite?: string | boolean; secure?: boolean }

export function readCookies() {
  return document.cookie
    .split('; ')
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf('=')
      const name = pair.slice(0, i)
      let value = pair.slice(i + 1)
      try {
        value = decodeURIComponent(value)
      } catch {}
      return { name, value }
    })
}

export function writeCookie(name: string, value: string, options: Options = {}) {
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${options.path ?? '/'}`
  if (options.domain) cookie += `; Domain=${options.domain}`
  if (options.maxAge !== undefined) cookie += `; Max-Age=${Math.floor(options.maxAge)}`
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`
  cookie += `; SameSite=${typeof options.sameSite === 'string' ? options.sameSite : 'Lax'}`
  if (options.secure) cookie += '; Secure'
  document.cookie = cookie
}

// Có cookie phiên đăng nhập không (khách: không cần tải Supabase)
export const hasSessionCookie = () => readCookies().some((c) => isAuthCookie(c.name))

// Client Supabase phía trình duyệt, chỉ tải thư viện khi thật sự cần (người đã đăng nhập, lúc đăng xuất)
export async function loadBrowserClient() {
  const { createClient } = await import('@/lib/supabase/client')
  return createClient()
}

export type CookieOptions = Options
