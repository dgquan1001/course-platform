import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  ACTIVITY_COOKIE,
  activityCookieOptions,
  authCookieOptions,
  expiredReason,
  formatActivity,
  isAuthCookie,
  isSecureOrigin,
  parseActivity,
  remembers,
  REMEMBER_COOKIE,
  TOUCH_EVERY_MS,
} from '@/lib/session-policy'

// Middleware chạy trước mọi trang nên phải nhẹ:
// - Không có cookie phiên (khách) → không gọi Supabase; trang cần đăng nhập → /login?next=.
// - Có phiên: kiểm tra thời hạn phiên (SEC-13, lib/session-policy.ts) – quá giờ không thao tác / quá 12 giờ → thu hồi phiên
//   ở Supabase, xóa cookie (trang công khai hiện như khách, trang cần đăng nhập về /login); còn hạn → đọc phiên từ cookie
//   (getSession: không gọi mạng, trừ khi access token hết hạn thì làm mới) và ghi lại mốc "thao tác cuối".
// - Không truy vấn vai trò: trang quản trị tự kiểm tra bằng requireStaffPage / requireAdminPage (lib/auth.ts), RLS là lớp cuối.
// Trang khóa / bài học /courses/<id>/** công khai với khóa miễn phí nên không bắt đăng nhập (trang tự chuyển với khóa khác).
const PROTECTED = /^\/(courses|admin|account)(\/|$)/
const PUBLIC_COURSE_PAGE = /^\/courses\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/|$)/i

function toLogin(request: NextRequest, error?: 'timeout' | 'expired') {
  const loginUrl = new URL('/login', request.url)
  if (error) loginUrl.searchParams.set('error', error)
  loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

const clear = (response: NextResponse, names: string[]) => {
  for (const name of names) response.cookies.set(name, '', { path: '/', maxAge: 0 })
  return response
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED.test(path) && !PUBLIC_COURSE_PAGE.test(path)
  const authCookies = request.cookies.getAll().map((c) => c.name).filter(isAuthCookie)
  const sessionCookies = [ACTIVITY_COOKIE, REMEMBER_COOKIE].filter((name) => request.cookies.has(name))
  const secure = isSecureOrigin(request.nextUrl.protocol, request.nextUrl.hostname)

  if (!authCookies.length) {
    return clear(isProtected ? toLogin(request) : NextResponse.next(), sessionCookies)
  }

  const supabaseFor = (setAll: Parameters<typeof createServerClient>[2]['cookies']['setAll']) =>
    createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => request.cookies.getAll(), setAll },
    })

  const activity = parseActivity(request.cookies.get(ACTIVITY_COOKIE)?.value)
  const reason = expiredReason(activity)
  if (reason) {
    // Hết hạn: thu hồi refresh token ở Supabase (cookie bị lộ cũng không dùng lại được), xóa cookie ở cả request
    // (trang đang dựng thấy như khách) và response. Lỗi mạng khi thu hồi vẫn xóa cookie.
    await supabaseFor(() => {}).auth.signOut({ scope: 'local' }).catch(() => {})
    const names = [...authCookies, ...sessionCookies]
    names.forEach((name) => request.cookies.delete(name))
    const response = isProtected
      ? toLogin(request, reason === 'idle' ? 'timeout' : 'expired')
      : NextResponse.next({ request })
    return clear(response, names)
  }

  const keep = remembers(activity!)
  let response = NextResponse.next({ request })
  const supabase = supabaseFor((cookiesToSet) => {
    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
    response = NextResponse.next({ request })
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, authCookieOptions({ ...options, secure }, keep))
    )
  })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && isProtected) return toLogin(request)

  const now = Date.now()
  if (now - activity!.lastSeen > TOUCH_EVERY_MS) {
    response.cookies.set(ACTIVITY_COOKIE, formatActivity({ ...activity!, lastSeen: now }), activityCookieOptions(keep, secure))
  }
  return response
}

export const config = {
  // Mọi trang trừ file tĩnh (JS/CSS của Next, ảnh, icon) – để phiên quá hạn bị xóa ở cả trang công khai
  matcher: ['/((?!_next/static|_next/image|images/|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|txt|xml|webmanifest)$).*)'],
}
