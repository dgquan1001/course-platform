'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Thanh tiến trình trên cùng: hiện ngay khi bấm link, chạy tới khi trang mới hiển thị
export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  useEffect(() => {
    setState((s) => (s === 'loading' ? 'done' : s))
    const t = setTimeout(() => setState('idle'), 300)
    return () => clearTimeout(t)
  }, [pathname, searchParams])

  useEffect(() => {
    let fallback: ReturnType<typeof setTimeout>
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element).closest('a')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return
      setState('loading')
      clearTimeout(fallback)
      fallback = setTimeout(() => setState('idle'), 15000)
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      clearTimeout(fallback)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`fixed left-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-ocean-400 via-ocean-500 to-gold-400 ${
        state === 'idle'
          ? 'w-0 opacity-0'
          : state === 'loading'
            ? 'w-[85%] opacity-100 transition-[width] duration-[6000ms] ease-out'
            : 'w-full opacity-100 transition-[width] duration-200'
      }`}
    />
  )
}
