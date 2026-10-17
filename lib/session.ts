import 'server-only'
import { cookies, headers } from 'next/headers'
import {
  ACTIVITY_COOKIE,
  activityCookieOptions,
  formatActivity,
  isSecureOrigin,
  REMEMBER_COOKIE,
} from '@/lib/session-policy'

// Gọi ngay sau khi đăng nhập thành công (đăng nhập, đặt lại mật khẩu, đăng ký): bắt đầu tính giờ phiên (SEC-13).
// Thiếu cookie này thì middleware coi phiên là hết hạn và đăng xuất.
export async function startSession({ staff, remember = false }: { staff: boolean; remember?: boolean }) {
  const store = await cookies()
  const keep = remember && !staff
  const h = await headers()
  const secure = isSecureOrigin(h.get('x-forwarded-proto'), h.get('host'))
  const now = Date.now()
  store.set(ACTIVITY_COOKIE, formatActivity({ loginAt: now, lastSeen: now, staff, remember: keep }), activityCookieOptions(keep, secure))
  if (keep) store.set(REMEMBER_COOKIE, '1', activityCookieOptions(true, secure))
  else store.delete(REMEMBER_COOKIE)
}
