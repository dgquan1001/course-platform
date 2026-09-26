// Tài khoản không có email đăng nhập bằng số điện thoại. Supabase Auth bắt buộc có email
// (đăng nhập bằng SĐT cần dịch vụ SMS), nên các tài khoản này dùng một email nội bộ
// dạng 0912345678@sdt.hv.invalid. Tên miền .invalid được dành riêng, không bao giờ nhận thư.
const PHONE_EMAIL_DOMAIN = 'sdt.hv.invalid'

// Chuẩn hóa về dạng 0xxxxxxxxx; trả về null nếu không phải SĐT Việt Nam hợp lệ
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s.\-()]/g, '')
  if (digits.startsWith('+84')) digits = `0${digits.slice(3)}`
  else if (/^84\d{9,10}$/.test(digits)) digits = `0${digits.slice(2)}`
  return /^0\d{9,10}$/.test(digits) ? digits : null
}

export function phoneToAuthEmail(phone: string) {
  return `${phone}@${PHONE_EMAIL_DOMAIN}`
}

export function isPhoneAuthEmail(email: string | null | undefined) {
  return !!email && email.endsWith(`@${PHONE_EMAIL_DOMAIN}`)
}

// Email thật để hiển thị/liên hệ (bỏ email nội bộ)
export function realEmail(email: string | null | undefined) {
  return email && !isPhoneAuthEmail(email) ? email : null
}

// Email nội bộ theo SĐT không được nhập tay: tránh chiếm email đăng nhập của số điện thoại người khác
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !isPhoneAuthEmail(email.toLowerCase())
}
