// Đo hiệu năng các trang chính bằng Lighthouse (Đợt 22) – kể cả trang cần đăng nhập (quản trị, học tập).
//
// Cách chạy:
//   1. Chạy server production, VD: NEXT_DIST_DIR=.next-e2e npx next build && NEXT_DIST_DIR=.next-e2e npx next start -p 3140
//   2. E2E_SUPABASE_REF=<ref> PERF_BASE=http://localhost:3140 PERF_LABEL=truoc node scripts/perf.mjs [--runs=3] [--mobile-only|--desktop-only]
// Script tạo 1 tài khoản admin tạm (xóa khi xong) nên chỉ chạy trên project kiểm thử, giống E2E (E2E_SUPABASE_REF).
// Lighthouse: mặc định `npx -y lighthouse@12.8.2`; đặt LIGHTHOUSE_BIN=<đường dẫn> nếu đã cài sẵn ở nơi khác.
// Kết quả: bảng Markdown (trung vị các lần đo) + file test-results/perf-<nhãn>.json.
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { adminClient, loadEnv } from './env.mjs'

const env = loadEnv()
const BASE = process.env.PERF_BASE || 'http://localhost:3140'
const LABEL = process.env.PERF_LABEL || 'lan-do'
const RUNS = Number(process.argv.find((a) => a.startsWith('--runs='))?.split('=')[1] ?? 3)
const MODES = process.argv.includes('--mobile-only') ? ['mobile'] : process.argv.includes('--desktop-only') ? ['desktop'] : ['mobile', 'desktop']
const OUT = 'test-results/'
mkdirSync(OUT, { recursive: true })

const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
if (env.E2E_SUPABASE_REF !== projectRef) {
  console.error(`Từ chối chạy trên project Supabase "${projectRef}" (script tạo / xóa tài khoản tạm). Đặt E2E_SUPABASE_REF=${projectRef} như khi chạy E2E.`)
  process.exit(1)
}

const db = adminClient(env)
const stamp = Date.now()
const ADMIN = { email: `perf-admin-${stamp}@example.com`, password: `Perf#${stamp}` }
const lighthouse = process.env.LIGHTHOUSE_BIN ? [process.env.LIGHTHOUSE_BIN] : ['npx', '-y', 'lighthouse@12.8.2']

const median = (values) => {
  const s = [...values].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

function runLighthouse(url, mode, headersFile) {
  const args = [
    ...lighthouse.slice(1),
    url,
    '--output=json',
    '--output-path=stdout',
    '--quiet',
    '--only-categories=performance',
    '--chrome-flags=--headless=new --no-first-run',
    ...(mode === 'desktop' ? ['--preset=desktop'] : []),
    ...(headersFile ? [`--extra-headers=${headersFile}`] : []),
  ]
  const r = spawnSync(lighthouse[0], args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32' })
  if (r.status !== 0) throw new Error(`Lighthouse lỗi (${url}): ${(r.stderr || '').slice(-500)}`)
  const lhr = JSON.parse(r.stdout)
  const a = lhr.audits
  const bytesOf = (type) => a['resource-summary']?.details?.items?.find((i) => i.resourceType === type)?.transferSize ?? 0
  return {
    score: Math.round((lhr.categories.performance.score ?? 0) * 100),
    fcp: a['first-contentful-paint'].numericValue,
    lcp: a['largest-contentful-paint'].numericValue,
    tbt: a['total-blocking-time'].numericValue,
    cls: a['cumulative-layout-shift'].numericValue,
    si: a['speed-index'].numericValue,
    ttfb: a['server-response-time']?.numericValue ?? 0,
    totalKb: bytesOf('total') / 1024,
    jsKb: bytesOf('script') / 1024,
  }
}

let userId = null
const results = []
try {
  // Trang công khai: khóa học đang hiển thị đầu tiên cho /khoa-hoc/[id]
  const { data: course } = await db.from('courses').select('id').eq('status', 'published').order('sort_order').limit(1).maybeSingle()
  const pages = [
    { path: '/', auth: false },
    { path: '/en', auth: false },
    { path: '/login', auth: false },
    { path: '/register', auth: false },
    ...(course ? [{ path: `/khoa-hoc/${course.id}`, auth: false, name: '/khoa-hoc/[id]' }] : []),
    { path: '/courses', auth: true },
    { path: '/admin', auth: true },
    { path: '/admin/registrations', auth: true },
    { path: '/admin/patients', auth: true },
    { path: '/admin/courses', auth: true },
  ]

  // Tài khoản admin tạm → đăng nhập bằng trình duyệt → cookie cho Lighthouse
  const { data, error } = await db.auth.admin.createUser({ email: ADMIN.email, password: ADMIN.password, email_confirm: true })
  if (error) throw error
  userId = data.user.id
  await db.from('profiles').update({ role: 'admin', full_name: 'Perf Admin' }).eq('id', userId)
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome' })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/login`)
  await page.fill('#identifier', ADMIN.email)
  await page.fill('#password', ADMIN.password)
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')])
  const cookie = (await ctx.cookies(BASE)).map((c) => `${c.name}=${c.value}`).join('; ')
  await browser.close()
  const headersFile = `${OUT}perf-headers.json`
  writeFileSync(headersFile, JSON.stringify({ Cookie: cookie }))

  for (const mode of MODES) {
    for (const p of pages) {
      const runs = []
      for (let i = 0; i < RUNS; i++) runs.push(runLighthouse(`${BASE}${p.path}`, mode, p.auth ? headersFile : null))
      const m = Object.fromEntries(Object.keys(runs[0]).map((k) => [k, median(runs.map((r) => r[k]))]))
      results.push({ mode, page: p.name ?? p.path, ...m })
      console.log(`  ${mode} ${p.name ?? p.path}: ${m.score} điểm, LCP ${(m.lcp / 1000).toFixed(2)}s, TBT ${Math.round(m.tbt)}ms, JS ${m.jsKb.toFixed(0)} kB`)
    }
  }
  rmSync(headersFile, { force: true })
} finally {
  if (userId) await db.auth.admin.deleteUser(userId)
}

writeFileSync(`${OUT}perf-${LABEL}.json`, JSON.stringify({ base: BASE, label: LABEL, runs: RUNS, at: new Date().toISOString(), results }, null, 2))
const s = (ms) => (ms / 1000).toFixed(2)
console.log(`\n| Chế độ | Trang | Điểm | FCP (s) | LCP (s) | TBT (ms) | CLS | Speed Index (s) | TTFB (ms) | Tải về (kB) | JS (kB) |`)
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const r of results) {
  console.log(
    `| ${r.mode === 'mobile' ? 'Điện thoại' : 'Máy tính'} | \`${r.page}\` | ${r.score} | ${s(r.fcp)} | ${s(r.lcp)} | ${Math.round(r.tbt)} | ${r.cls.toFixed(3)} | ${s(r.si)} | ${Math.round(r.ttfb)} | ${r.totalKb.toFixed(0)} | ${r.jsKb.toFixed(0)} |`
  )
}
