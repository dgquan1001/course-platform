import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { authCookieOptions, isSecureOrigin, REMEMBER_COOKIE } from '@/lib/session-policy'

// remember: chỉ truyền khi vừa đăng nhập (ô "Ghi nhớ đăng nhập"); mặc định theo cookie hv-remember hiện có (SEC-13)
export async function createClient({ remember }: { remember?: boolean } = {}) {
  const cookieStore = await cookies()
  const keep = remember ?? cookieStore.get(REMEMBER_COOKIE)?.value === '1'
  const h = await headers()
  const secure = isSecureOrigin(h.get('x-forwarded-proto'), h.get('host'))

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, authCookieOptions({ ...options, secure }, keep))
            )
          } catch {
            // setAll() gọi từ Server Component sẽ bị bỏ qua – middleware đã làm mới phiên
          }
        },
      },
    }
  )
}
