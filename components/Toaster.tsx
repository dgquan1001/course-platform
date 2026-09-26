'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CheckIcon, CloseIcon } from './icons'

type ToastType = 'success' | 'error'
type ToastItem = { id: number; type: ToastType; message: string }

const listeners = new Set<(t: ToastItem) => void>()
let nextId = 0

// Hiện thông báo nổi từ bất kỳ client component nào
export function toast(message: string, type: ToastType = 'success') {
  const item = { id: ++nextId, type, message }
  listeners.forEach((l) => l(item))
}

// Server action có redirect (đăng nhập, đăng ký) để lại thông báo trong cookie "flash"
// (ghi bởi setFlash trong lib/flash.ts)
const FLASH_COOKIE = 'flash'

function readFlash() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${FLASH_COOKIE}=([^;]*)`))
  if (!match) return
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`
  try {
    const { message, type } = JSON.parse(decodeURIComponent(match[1]))
    if (message) toast(message, type === 'error' ? 'error' : 'success')
  } catch {}
}

export default function Toaster() {
  const pathname = usePathname()
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener = (t: ToastItem) => {
      setItems((s) => [...s, t])
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 4000)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  useEffect(() => {
    readFlash()
  }, [pathname])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg ${
            t.type === 'success' ? 'border-emerald-200' : 'border-red-200'
          }`}
        >
          <span
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${
              t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {t.type === 'success' ? <CheckIcon className="h-3 w-3" /> : <CloseIcon className="h-3 w-3" />}
          </span>
          <p className="flex-1 text-slate-700">{t.message}</p>
          <button
            onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Đóng thông báo"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
