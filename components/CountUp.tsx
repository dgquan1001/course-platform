'use client'

import { useEffect, useRef } from 'react'

// Định dạng 13000 → "13.000" (không dùng toLocaleString để server và trình duyệt luôn ra cùng chuỗi, tránh lỗi hydration)
const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// Số đếm tăng dần khi cuộn tới. Server render sẵn giá trị cuối (máy tìm kiếm, tắt JS, giảm chuyển động vẫn thấy đúng số).
export default function CountUp({ to, suffix = '', duration = 1600 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration)
          el.textContent = group(Math.round(to * (1 - (1 - p) ** 3))) + suffix
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, suffix, duration])

  return (
    <span ref={ref}>{`${group(to)}${suffix}`}</span>
  )
}
