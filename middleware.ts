import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Bảo vệ /courses (Khóa học của tôi), /account (cần đăng nhập) và /admin (nhân viên hoặc admin;
// quản lý khóa học chỉ admin). Trang khóa / bài học /courses/[id]/** chỉ làm mới phiên vì khóa miễn phí
// ai cũng xem được: trang tự chuyển tới đăng nhập với khóa khác. Quyền xem bài học kiểm soát bằng RLS.
const ADMIN_ONLY = ['/admin/courses', '/admin/settings']

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
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Trang khóa / bài học: chỉ làm mới phiên, trang tự quyết định (khóa miễn phí không cần đăng nhập)
  const isCoursePage = path.startsWith('/courses/')

  if (!user && !isCoursePage) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  if (user && path.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.redirect(new URL('/courses', request.url))
    }
    if (role === 'staff' && ADMIN_ONLY.some((p) => path === p || path.startsWith(`${p}/`))) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/courses/:path*', '/admin/:path*', '/account/:path*'],
}
