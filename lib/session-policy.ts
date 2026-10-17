// Chính sách phiên đăng nhập (SEC-13, Đợt 21) – dùng chung cho middleware, server, trình duyệt.
//
// @supabase/ssr luôn ghi cookie phiên với Max-Age 400 ngày → tắt trình duyệt mở lại vẫn còn đăng nhập. Ở đây:
// - Cookie phiên là "cookie tạm" (không Max-Age): đóng trình duyệt là mất. Học viên chọn "Ghi nhớ đăng nhập" thì giữ 30 ngày.
// - Tự đăng xuất khi không thao tác: nhân viên / admin 30 phút, học viên 2 giờ; mỗi lần đăng nhập tối đa 12 giờ
//   (trình duyệt "mở lại các tab cũ" có thể khôi phục cookie tạm). Ghi nhớ: tối đa 30 ngày.
// - Mốc thời gian lưu ở cookie `hv-activity` = "<đăng nhập lúc>.<thao tác cuối>.<cờ>" (ms; cờ: s = nhân viên / admin,
//   r = ghi nhớ). Cookie này JS đọc được để trình duyệt tự đăng xuất đúng lúc (SessionGuard); sửa nó chỉ ảnh hưởng phiên
//   của chính người đó, quyền thật vẫn do Supabase Auth + RLS kiểm tra.

export const ACTIVITY_COOKIE = 'hv-activity'
export const REMEMBER_COOKIE = 'hv-remember'

const MINUTE = 60_000
export const IDLE_STAFF_MS = 30 * MINUTE
export const IDLE_USER_MS = 120 * MINUTE
export const MAX_SESSION_MS = 12 * 60 * MINUTE
export const REMEMBER_MS = 30 * 24 * 60 * MINUTE
// Ghi lại "thao tác cuối" tối đa mỗi phút một lần (đỡ ghi cookie liên tục)
export const TOUCH_EVERY_MS = MINUTE

export type Activity = { loginAt: number; lastSeen: number; staff: boolean; remember: boolean }

export function parseActivity(value: string | undefined | null): Activity | null {
  const m = /^(\d{10,16})\.(\d{10,16})\.([sr]*)$/.exec(value ?? '')
  if (!m) return null
  return { loginAt: Number(m[1]), lastSeen: Number(m[2]), staff: m[3].includes('s'), remember: m[3].includes('r') }
}

export const formatActivity = (a: Activity) => `${a.loginAt}.${a.lastSeen}.${a.staff ? 's' : ''}${a.remember ? 'r' : ''}`

// Ghi nhớ chỉ dành cho học viên: tài khoản quản trị luôn hết phiên khi đóng trình duyệt
export const remembers = (a: Activity) => a.remember && !a.staff

export function idleLimit(a: Activity) {
  return remembers(a) ? REMEMBER_MS : a.staff ? IDLE_STAFF_MS : IDLE_USER_MS
}

// Lý do phiên hết hạn (null = còn hiệu lực)
export function expiredReason(a: Activity | null, now = Date.now()): 'missing' | 'idle' | 'max' | null {
  if (!a) return 'missing'
  if (now - a.loginAt > (remembers(a) ? REMEMBER_MS : MAX_SESSION_MS)) return 'max'
  if (now - a.lastSeen > idleLimit(a)) return 'idle'
  return null
}

type CookieOpts = { maxAge?: number; expires?: Date; [key: string]: unknown }

// Tùy chọn cookie phiên Supabase: xóa (maxAge 0) giữ nguyên; ghi nhớ → 30 ngày; còn lại → cookie tạm.
export function authCookieOptions<T extends CookieOpts>(options: T, remember: boolean): T {
  if (options.maxAge === 0) return options
  const { maxAge: _maxAge, expires: _expires, ...rest } = options
  return (remember ? { ...rest, maxAge: REMEMBER_MS / 1000 } : rest) as T
}

// Cookie mốc thời gian / ghi nhớ: cùng thời hạn với cookie phiên
export function activityCookieOptions(remember: boolean, secure: boolean) {
  return { path: '/', sameSite: 'lax' as const, secure, ...(remember ? { maxAge: REMEMBER_MS / 1000 } : {}) }
}

// Cookie chỉ gửi qua HTTPS (Secure), trừ khi chạy http://localhost (máy dev, E2E) – cùng một cách tính ở server và trình duyệt
export function isSecureOrigin(proto: string | null | undefined, host: string | null | undefined) {
  if (proto) return proto.split(',')[0].trim().replace(/:$/, '') === 'https'
  return !/^(localhost|127\.0\.0\.1)(:|$)/.test(host ?? '')
}

// Cookie phiên Supabase: sb-<project>-auth-token (có thể chia .0, .1 khi dài)
export const isAuthCookie = (name: string) => name.startsWith('sb-') && /-auth-token(\.\d+)?$/.test(name)
