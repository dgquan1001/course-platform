'use client'

import { useEffect } from 'react'

// Layout gốc đặt <html lang="vi">; trang tiếng Anh (/en) đổi lang khi đang mở để trình đọc màn hình,
// trình duyệt (dịch, gạch lỗi chính tả) nhận đúng ngôn ngữ, rời trang thì trả lại "vi".
export default function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const html = document.documentElement
    const prev = html.lang
    html.lang = lang
    return () => {
      html.lang = prev
    }
  }, [lang])
  return null
}
