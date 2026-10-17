'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { hasSessionCookie, loadBrowserClient } from '@/lib/browser-cookies'

// Profile của người đang đăng nhập, đọc ở trình duyệt để các trang công khai vẫn cache tĩnh được.
// Header và hộp nhắc (đồng ý chính sách, đổi mật khẩu) dùng chung một bản: mỗi lần chuyển trang tối đa 1 truy vấn,
// thường là 0 (cache 60 giây theo tài khoản). Tài khoản đang cần nhắc thì luôn đọc lại để hộp nhắc tắt ngay khi xong.
export type ClientProfile = {
  id: string
  authEmail: string | null
  role: string
  full_name: string | null
  phone: string | null
  consent_at: string | null
  must_change_password: boolean
} | null

const TTL = 60_000
let cached: { at: number; profile: NonNullable<ClientProfile> } | null = null
let inflight: { userId: string; promise: Promise<ClientProfile> } | null = null

const needsReminder = (p: NonNullable<ClientProfile>) => p.role === 'user' && (!p.consent_at || p.must_change_password)

export async function loadProfile(): Promise<ClientProfile> {
  // Khách (không có cookie phiên): không tải thư viện Supabase (PERF-08)
  if (!hasSessionCookie()) {
    cached = null
    return null
  }
  const supabase = await loadBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    cached = null
    return null
  }
  const userId = session.user.id
  if (cached && cached.profile.id === userId && Date.now() - cached.at < TTL && !needsReminder(cached.profile)) {
    return cached.profile
  }
  if (inflight?.userId === userId) return inflight.promise
  const promise = (async () => {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name, phone, consent_at, must_change_password')
      .eq('id', userId)
      .single()
    const profile: ClientProfile = data
      ? { id: userId, authEmail: session.user.email ?? null, ...data, must_change_password: !!data.must_change_password }
      : null
    cached = profile ? { at: Date.now(), profile } : null
    return profile
  })().finally(() => {
    inflight = null
  })
  inflight = { userId, promise }
  return promise
}

const subscribers = new Set<() => void>()

// Đăng xuất / vừa cập nhật: bỏ cache và báo mọi nơi đang hiển thị (header, hộp nhắc) đọc lại ngay –
// kể cả khi tự đăng xuất do hết phiên mà không chuyển trang (SessionGuard, SEC-13)
export function invalidateProfile() {
  cached = null
  subscribers.forEach((reload) => reload())
}

// undefined = đang tải, null = chưa đăng nhập
export function useProfile(): ClientProfile | undefined {
  const pathname = usePathname()
  const [profile, setProfile] = useState<ClientProfile | undefined>(undefined)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const reload = () => setVersion((v) => v + 1)
    subscribers.add(reload)
    return () => {
      subscribers.delete(reload)
    }
  }, [])
  useEffect(() => {
    let cancelled = false
    loadProfile().then((p) => {
      if (!cancelled) setProfile(p)
    })
    return () => {
      cancelled = true
    }
  }, [pathname, version])
  return profile
}
