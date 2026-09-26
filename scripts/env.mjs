// Đọc .env.local (nếu có) cho các script chạy ngoài Next.js; biến môi trường của shell/CI được ưu tiên
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

export function loadEnv() {
  const env = {}
  const file = new URL('../.env.local', import.meta.url)
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].trim()
    }
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(NEXT_PUBLIC_|SUPABASE_|E2E_|SMTP_|MAIL_|TURNSTILE_)/.test(key) && value) env[key] = value
  }
  for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!env[key]) throw new Error(`Thiếu ${key} trong .env.local`)
  }
  return env
}

export function adminClient(env) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
