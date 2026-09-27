import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Middleware chạy trước mọi trang /courses, /account, /admin nên phải nhẹ:
// - Chỉ đọc phiên từ cookie (getSession): không gọi mạng, trừ khi access token hết hạn thì làm mới và ghi lại cookie.
// - Không truy vấn vai trò: trang quản trị tự kiểm tra bằng requireStaffPage / requireAdminPage (lib/auth.ts,
//   xác thực phiên với Supabase Auth và đã cache theo request), RLS là lớp bảo vệ cuối.
// Khách chưa đăng nhập vào trang cần đăng nhập → /login?next=. Trang khóa / bài học /courses/<id>/** công khai với
// khóa miễn phí nên chỉ làm mới phiên (trang tự chuyển tới đăng nhập với khóa khác).
const PUBLIC_COURSE_PAGE = /^\/courses\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/|$)/i

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname
  if (!session && !PUBLIC_COURSE_PAGE.test(path)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', `${path}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/courses/:path*', '/admin/:path*', '/account/:path*'],
}
