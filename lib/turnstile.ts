// Cloudflare Turnstile (chống bot) cho form đăng ký. Chỉ bật khi có đủ 2 khóa:
// NEXT_PUBLIC_TURNSTILE_SITE_KEY (widget trong RegisterForm) và TURNSTILE_SECRET_KEY (kiểm tra ở server).
// Chỉ dùng phía server.

// Trả về true nếu token hợp lệ hoặc chưa cấu hình Turnstile
export async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    // Cloudflare không phản hồi: không chặn khách thật (vẫn còn giới hạn tần suất theo IP)
    return true
  }
}
