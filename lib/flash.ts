import { cookies } from 'next/headers'

// Để lại thông báo cho trang tiếp theo sau khi server action redirect (Toaster sẽ đọc và hiển thị)
export function setFlash(message: string, type: 'success' | 'error' = 'success') {
  // Next.js tự encodeURIComponent giá trị cookie, không cần mã hóa thêm
  cookies().set('flash', JSON.stringify({ message, type }), {
    path: '/',
    maxAge: 60,
    sameSite: 'lax',
  })
}
