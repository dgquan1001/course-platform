import { randomInt } from 'crypto'
import { MIN_PASSWORD_LENGTH } from '@/lib/password'

// Mật khẩu do hệ thống sinh cho tài khoản nhân viên tạo / cấp lại (BR-95): 8 ký tự dễ đọc qua điện thoại
// (bỏ 0 O o 1 l I), có chữ hoa, chữ thường và số; dùng bộ sinh số ngẫu nhiên an toàn (CSPRNG).
// Tách khỏi lib/password.ts vì file đó được dùng cả ở trình duyệt.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const DIGITS = '23456789'

export function generatePassword(length = MIN_PASSWORD_LENGTH) {
  const pick = (chars: string) => chars[randomInt(chars.length)]
  const all = UPPER + LOWER + DIGITS
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), ...Array.from({ length: length - 3 }, () => pick(all))]
  // Trộn Fisher–Yates để 3 ký tự bắt buộc không luôn nằm đầu
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
