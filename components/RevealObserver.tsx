'use client'

import { useEffect } from 'react'

// Hiệu ứng hiện dần khi cuộn (trang chủ): phần tử có thuộc tính data-reveal được thêm class is-visible
// khi vào màn hình. Chỉ đặt data-reveal ở phần tử do server render (không đặt trong danh sách client
// render lại như bộ lọc chương trình), vì phần tử sinh ra sau khi quan sát sẽ không được theo dõi.
export default function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'))
    const show = (el: Element) => el.classList.add('is-visible')

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(show)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          show(e.target)
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
    )
    // Phần tử đã nằm trong màn hình lúc tải trang thì hiện ngay, tránh nháy
    for (const el of items) {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) show(el)
      else io.observe(el)
    }
    root.classList.add('reveal-ready')

    return () => {
      io.disconnect()
      root.classList.remove('reveal-ready')
    }
  }, [])

  return null
}
