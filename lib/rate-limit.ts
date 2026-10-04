import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// Giới hạn tần suất theo IP (bảng rate_limits, hàm hit_rate_limit trong database). Chỉ dùng phía server.
export const LIMITS = {
  // Số lần gửi đơn đăng ký (đã qua kiểm tra dữ liệu) mỗi IP mỗi giờ
  register: { limit: 20, windowSeconds: 3600 },
  // Số lần đăng nhập SAI cho cùng 1 tài khoản từ 1 IP trong 15 phút
  loginFailPerAccount: { limit: 5, windowSeconds: 900 },
  // Tổng số lần đăng nhập sai từ 1 IP trong 15 phút (dò nhiều tài khoản)
  loginFailPerIp: { limit: 30, windowSeconds: 900 },
  // Số lần yêu cầu mã quên mật khẩu mỗi IP mỗi giờ
  forgotPassword: { limit: 10, windowSeconds: 3600 },
  // Số lần bấm liên hệ Zalo ở khóa premium (lưu khách quan tâm) mỗi IP mỗi giờ
  lead: { limit: 20, windowSeconds: 3600 },
  // Số phiếu tham vấn mỗi bệnh nhân mỗi ngày (BR-101)
  consultation: { limit: 5, windowSeconds: 86400 },
} as const

type Limit = (typeof LIMITS)[keyof typeof LIMITS]

// IP của người dùng (RK-43). Trên Cloudflare, cf-connecting-ip do Cloudflare đặt – người dùng không giả mạo được.
// KHÔNG lấy phần tử đầu x-forwarded-for khi chạy sau Cloudflare: Cloudflare giữ nguyên giá trị người dùng gửi, chỉ nối IP thật vào cuối.
// x-real-ip / x-forwarded-for chỉ dùng khi chạy ngoài Cloudflare (next dev / next start – Node tự đặt từ kết nối).
export async function clientIp() {
  const h = await headers()
  return h.get('cf-connecting-ip') || h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

// Ghi nhận 1 lần và trả về true nếu vẫn trong giới hạn. `increment = false`: chỉ kiểm tra, không ghi.
// Database lỗi (VD chưa chạy schema mới) thì cho qua để website không bị chặn, chỉ ghi log.
export async function withinLimit(key: string, { limit, windowSeconds }: Limit, increment = true) {
  const { data, error } = await createAdminClient().rpc('hit_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
    p_increment: increment,
  })
  if (error) {
    console.error('[rate-limit]', error.message)
    return true
  }
  return data === true
}
