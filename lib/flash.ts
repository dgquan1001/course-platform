import { cookies } from 'next/headers'

// Để lại thông báo cho trang tiếp theo sau khi server action redirect (Toaster sẽ đọc và hiển thị)
export async function setFlash(message: string, type: 'success' | 'error' = 'success') {
  const cookieStore = await cookies()
  // Next.js tự encodeURIComponent giá trị cookie, không cần mã hóa thêm
  cookieStore.set('flash', JSON.stringify({ message, type }), {
    path: '/',
    maxAge: 60,
    sameSite: 'lax',
  })
}
