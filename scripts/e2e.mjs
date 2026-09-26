// Kiểm thử end-to-end các luồng chính trên trình duyệt thật + Supabase thật.
// Yêu cầu: đã build (npm run build), .env.local có SUPABASE_SERVICE_ROLE_KEY.
// Chạy: npm run test:e2e
// Script tự khởi động server (cổng E2E_PORT, mặc định 3123) ở chế độ ghi email ra file
// (MAIL_OUTBOX_DIR) để đọc mã quên mật khẩu, tự tạo dữ liệu test và XÓA sạch khi kết thúc.
//
// Mỗi bước được gắn nhãn theo vai trò thực hiện:
//   [Hệ thống]  kiểm tra trực tiếp database / phân quyền RLS / email
//   [Khách]     người chưa đăng nhập
//   [Học viên]  người đã có tài khoản
//   [Admin]     quản trị viên (trình duyệt máy tính)
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { chromium, devices } from 'playwright-core'
import { adminClient, loadEnv } from './env.mjs'

const PORT = Number(process.env.E2E_PORT || 3123)
const BASE = `http://localhost:${PORT}`
const env = loadEnv()

// E2E tạo/xóa tài khoản, khóa học, đổi quyền admin: chỉ chạy trên project Supabase đã được khai báo là
// project kiểm thử (E2E_SUPABASE_REF = mã project), tránh chạy nhầm lên database thật.
const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
if (env.E2E_SUPABASE_REF !== projectRef) {
  console.error(
    `Từ chối chạy E2E trên project Supabase "${projectRef}".\n` +
      `E2E ghi và xóa dữ liệu thật. Dùng project Supabase riêng cho kiểm thử (staging), rồi đặt\n` +
      `E2E_SUPABASE_REF=${projectRef} trong file env của project đó (hoặc biến môi trường của CI).\n` +
      `Xem web design structure/09-operations/deployment-runbook.md › "Môi trường kiểm thử".`
  )
  process.exit(1)
}

const db = adminClient(env)
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

// ---------- Dữ liệu test ----------
const stamp = Date.now()
const tail = String(stamp).slice(-8)
const TEST_IP = `e2e-${stamp}`
const ADMIN = { email: `e2e-admin-${stamp}@example.com`, password: 'Admin#123456' }
// Học viên 1: có email, dùng điện thoại
const STUDENT = { email: `e2e-hocvien-${stamp}@example.com`, password: 'Hocvien#123', name: 'Học Viên Kiểm Thử', phone: `09${tail}` }
// Học viên 2: KHÔNG có email (chỉ số điện thoại), dùng máy tính
const STUDENT2 = { phone: `08${tail}`, password: 'Sdt#123456', name: 'Chị Lan Không Email', laterEmail: `e2e-lan-${stamp}@example.com` }
const COURSE_A = { title: `[E2E] Khóa A – Trị liệu cột sống ${stamp}`, price: '199000', status: 'published' }
const COURSE_B = { title: `[E2E] Khóa B – Cổ vai gáy ${stamp}`, price: '299000', status: 'published' }
const COURSE_HIDDEN = { title: `[E2E] Khóa C – Đang ẩn ${stamp}`, price: '99000', status: 'draft' }
const LESSON_TITLE = 'Bài 1: Giải phẫu cột sống cơ bản'
const LEGACY_LESSON_TITLE = 'Bài 9: Link video cũ không hợp lệ'
const LEGACY_LESSON = {}
const REJECT_NOTE = 'Ảnh chuyển khoản bị mờ, không đọc được số tiền'
// Admin thứ 2 (quyền ngang nhau) được admin 1 cấp quyền trên giao diện
const ADMIN2 = { email: `e2e-admin2-${stamp}@example.com`, password: 'Admin2#123456', name: 'Admin Hai E2E' }
const RACE = {} // đơn dùng cho kịch bản 2 admin cùng xử lý

const OUT = fileURLToPath(new URL('../test-results/', import.meta.url))
const OUTBOX = `${OUT}mail-outbox`
rmSync(OUTBOX, { recursive: true, force: true })
mkdirSync(OUTBOX, { recursive: true })
const SMALL_IMAGE = fileURLToPath(new URL('../public/images/bac-si-do-manh-cuong.jpg', import.meta.url))
const LARGE_IMAGE = `${OUT}anh-chuyen-khoan-lon.png`
const NOT_IMAGE = `${OUT}khong-phai-anh.txt`

// ---------- Tiện ích ----------
const results = []
const pageErrors = []
const thirdPartyErrors = [] // lỗi trong iframe bên thứ ba: chỉ ghi nhận, không tính là lỗi website
let currentStep = '' // bước đang chạy, ghi kèm lỗi JavaScript để dễ tìm nguyên nhân
const created = { userIds: [], courseIds: {}, registrationIds: [] }

function phase(title) {
  console.log(`\n${title}`)
}

async function step(name, fn) {
  const t = Date.now()
  currentStep = name
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`  ✔ ${name} (${Date.now() - t}ms)`)
  } catch (e) {
    results.push({ name, ok: false })
    console.log(`  ✘ ${name}\n      ${e.message.split('\n')[0]}`)
    // Chụp màn hình mọi trang đang mở để dễ tìm nguyên nhân
    for (const [i, p] of (browser?.contexts() ?? []).flatMap((c) => c.pages()).entries()) {
      await p.screenshot({ path: `${OUT}loi-${i}.png` }).catch(() => {})
      console.log(`      [trang ${i}] ${p.url()}`)
    }
    throw e
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function watch(page, label) {
  page.on('pageerror', (e) => {
    const stack = (e.stack ?? '').split('\n').slice(0, 4).join(' | ')
    const detail = `[${label}] ${e.message}\n        bước: ${currentStep} · ${page.url()}\n        ${stack}`
    // Playwright báo cả lỗi bên trong iframe khác domain (trình phát YouTube/TikTok) là lỗi của trang, với stack rỗng.
    // Lỗi của website luôn có stack trỏ về BASE; lỗi không stack khi trang đang nhúng iframe bên thứ ba thì bỏ qua.
    const thirdPartyFrame = page.frames().some((f) => /^https?:/.test(f.url()) && !f.url().startsWith(BASE))
    if (!stack.includes(BASE) && thirdPartyFrame) thirdPartyErrors.push(detail)
    else pageErrors.push(detail)
  })
  page.on('console', (m) => {
    // Bỏ qua thông báo từ iframe bên thứ ba (YouTube/TikTok), chỉ bắt lỗi của website
    const url = m.location()?.url ?? ''
    const thirdParty = (url && !url.startsWith(BASE)) || m.text().includes('Permissions policy violation')
    if (m.type() === 'error' && !thirdParty) pageErrors.push(`[${label}] console: ${m.text()} (bước: ${currentStep})`)
  })
  return page
}

const toast = (page, text) => page.getByRole('status').filter({ hasText: text }).first().waitFor()
const alertText = (page, text) => page.getByRole('alert').filter({ hasText: text }).waitFor()
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const registerButton = (page) => page.getByRole('button', { name: 'Đăng ký', exact: true })

// Đăng nhập bằng email hoặc số điện thoại
async function login(page, identifier, password, next = '') {
  await page.goto(`${BASE}/login${next ? `?next=${encodeURIComponent(next)}` : ''}`)
  await page.fill('#identifier', identifier)
  await page.fill('#password', password)
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')])
}

// Thử đăng nhập và trả về true/false (dùng cho kiểm tra mật khẩu cũ/mới)
async function tryLogin(identifier, password) {
  const ctx = await newContext()
  const p = await ctx.newPage()
  await p.goto(`${BASE}/login`)
  await p.fill('#identifier', identifier)
  await p.fill('#password', password)
  await Promise.all([p.waitForURL((u) => !u.pathname.startsWith('/login') || u.search.includes('error=')), p.click('button[type=submit]')])
  const ok = !new URL(p.url()).pathname.startsWith('/login')
  await ctx.close()
  return ok
}

async function openAccountMenu(page) {
  await page.getByRole('button', { name: 'Tài khoản' }).click()
  const menu = page.getByRole('menu', { name: 'Menu tài khoản' })
  await menu.waitFor({ state: 'visible' })
  return menu
}

async function logoutViaMenu(page) {
  const menu = await openAccountMenu(page)
  await menu.getByRole('menuitem', { name: 'Đăng xuất' }).click()
  await toast(page, 'Đã đăng xuất')
  await page.waitForURL(`${BASE}/`)
}

async function createCourseViaUI(page, course) {
  await page.goto(`${BASE}/admin/courses`)
  const form = page.locator('section', { has: page.getByRole('heading', { name: 'Thêm khóa học mới' }) })
  await form.locator('[name=title]').fill(course.title)
  await form.locator('[name=description]').fill('Khóa học kiểm thử tự động.')
  await form.locator('[name=price]').fill(course.price)
  await form.locator('[name=status]').selectOption(course.status)
  await form.getByRole('button', { name: 'Thêm khóa học' }).click()
  await toast(page, 'Đã thêm khóa học')
  await page.getByRole('heading', { name: course.title }).waitFor()
  assert((await form.locator('[name=title]').inputValue()) === '', 'Form thêm khóa học không được xóa trắng')
  const { data } = await db.from('courses').select('id, price, status').eq('title', course.title).single()
  assert(data?.price === Number(course.price) && data.status === course.status, `Dữ liệu khóa học sai: ${JSON.stringify(data)}`)
  return data.id
}

// Điền Bước 3 của form đăng ký (khách chưa đăng nhập)
async function fillGuestForm(page, { name, email, phone, password, courseId, image }) {
  await page.fill('#fullName', name)
  await page.fill('#email', email ?? '')
  await page.fill('#phone', phone)
  await page.fill('#password', password)
  if (courseId) await page.selectOption('#courseId', courseId)
  if (image) await page.setInputFiles('#paymentProof', image)
}

// Chờ email mới gửi tới địa chỉ `to` trong hộp thư test, trả về mã 6 số
async function waitForResetCode(to, after) {
  for (let i = 0; i < 50; i++) {
    const mails = readdirSync(OUTBOX)
      .filter((f) => Number(f.split('-')[0]) >= after)
      .map((f) => JSON.parse(readFileSync(`${OUTBOX}/${f}`, 'utf8')))
      .filter((m) => m.to === to)
    if (mails.length) {
      const code = mails.at(-1).subject.match(/\b(\d{6})\b/)?.[1]
      assert(code && mails.at(-1).html.includes(code), 'Email không chứa mã 6 số')
      return code
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`Không nhận được email gửi tới ${to}`)
}

async function registrationsOf(userId) {
  const { data } = await db
    .from('registrations')
    .select('id, course_id, status, email, reviewed_at, reviewed_by, reviewed_by_name, review_note')
    .eq('user_id', userId)
  return data ?? []
}

// Đơn tạo thẳng vào database (service role) để dựng tình huống; ảnh chuyển khoản không có thật
async function insertRegistration(values) {
  const { data, error } = await db
    .from('registrations')
    .insert({ payment_proof_path: `e2e/${stamp}.jpg`, ...values })
    .select('id')
    .single()
  assert(!error, `Không tạo được đơn test: ${error?.message}`)
  created.registrationIds.push(data.id)
  return data.id
}

async function cleanup() {
  // Xóa tài khoản không còn xóa đơn (RK-03): xóa đơn của dữ liệu test trước
  if (created.userIds.length) await db.from('registrations').delete().in('user_id', created.userIds)
  if (created.registrationIds.length) await db.from('registrations').delete().in('id', created.registrationIds)
  // Nhật ký phân quyền giữ lại khi xóa tài khoản: xóa phần của dữ liệu test
  if (created.userIds.length) await db.from('role_events').delete().in('user_id', created.userIds)
  // Bộ đếm giới hạn tần suất của lần chạy này
  await db.from('rate_limits').delete().like('key', `%${TEST_IP}%`)
  for (const id of created.userIds) {
    const { data: files } = await db.storage.from('payment-proofs').list(id)
    if (files?.length) await db.storage.from('payment-proofs').remove(files.map((f) => `${id}/${f.name}`))
    await db.auth.admin.deleteUser(id)
  }
  const ids = Object.values(created.courseIds)
  if (ids.length) await db.from('courses').delete().in('id', ids)
  // Phòng trường hợp bước lỗi tạo nhầm khóa học: xóa mọi khóa mang dấu thời gian của lần chạy này
  await db.from('courses').delete().like('title', `[E2E]%${stamp}%`)
}

// ---------- Khởi động server ----------
const DIST_DIR = process.env.NEXT_DIST_DIR || '.next'
if (!existsSync(fileURLToPath(new URL(`../${DIST_DIR}/BUILD_ID`, import.meta.url)))) {
  console.error(`Chưa có bản build trong ${DIST_DIR}. Hãy chạy: npm run build`)
  process.exit(1)
}
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  env: { ...process.env, MAIL_OUTBOX_DIR: OUTBOX },
  stdio: 'ignore',
})
for (let i = 0; ; i++) {
  try {
    if ((await fetch(BASE)).ok) break
  } catch {}
  if (i > 60) throw new Error(`Server không khởi động được trên cổng ${PORT}`)
  await new Promise((r) => setTimeout(r, 500))
}

// ---------- Kịch bản ----------
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome' })
// Mỗi lần chạy dùng một "IP" riêng (header x-forwarded-for) để giới hạn tần suất theo IP
// không cộng dồn giữa các lần chạy; khóa giới hạn được dọn khi kết thúc.
const newContext = (options = {}, ip = TEST_IP) =>
  browser.newContext({ ...options, extraHTTPHeaders: { 'x-forwarded-for': ip } })
let failed = false

try {
  console.log(`Kiểm thử trên ${BASE}`)

  // Ảnh chụp chuyển khoản "nặng" (~10MB) để kiểm tra cơ chế nén trước khi upload
  await sharp({
    create: { width: 1800, height: 2400, channels: 3, noise: { type: 'gaussian', mean: 160, sigma: 25 } },
  })
    .png()
    .toFile(LARGE_IMAGE)
  writeFileSync(NOT_IMAGE, 'day khong phai la anh')

  // =====================================================================
  phase('1. HỆ THỐNG – chuẩn bị')
  // =====================================================================
  await step('[Hệ thống] Database có đủ bảng và bucket lưu ảnh chuyển khoản', async () => {
    for (const t of ['profiles', 'courses', 'lessons', 'registrations', 'password_resets', 'registration_events', 'role_events']) {
      const { error } = await db.from(t).select('*', { head: true, count: 'exact' })
      assert(!error, `Bảng ${t}: ${error?.message} (đã chạy supabase/schema.sql mới nhất chưa?)`)
    }
    const { error } = await db.storage.getBucket('payment-proofs')
    assert(!error, `Bucket payment-proofs: ${error?.message}`)
    const { error: colError } = await db.from('registrations').select('course_title, amount', { head: true })
    assert(!colError, `Bảng registrations thiếu cột course_title/amount: ${colError?.message} (hãy chạy lại supabase/schema.sql)`)
    const { error: reviewerError } = await db.from('registrations').select('reviewed_by, reviewed_by_name, review_note').limit(1)
    assert(!reviewerError, `Bảng registrations thiếu cột người xử lý: ${reviewerError?.message} (hãy chạy lại supabase/schema.sql)`)
  })

  await step('[Hệ thống] Database chặn học phí âm (ràng buộc courses_price_nonnegative)', async () => {
    const { error } = await db.from('courses').insert({ title: `[E2E] Giá âm ${stamp}`, price: -1 }).select('id')
    assert(error?.message.includes('courses_price_nonnegative'), `Database vẫn nhận học phí âm: ${error?.message}`)
  })

  await step('[Hệ thống] Tạo tài khoản admin test, trigger tự sinh profile', async () => {
    const { data, error } = await db.auth.admin.createUser({
      email: ADMIN.email, password: ADMIN.password, email_confirm: true, user_metadata: { full_name: 'Admin E2E' },
    })
    assert(!error, error?.message)
    created.userIds.push(data.user.id)
    ADMIN.id = data.user.id
    const { data: profile } = await db.from('profiles').select('role, email').eq('id', data.user.id).single()
    assert(profile?.role === 'user' && profile.email === ADMIN.email, 'Trigger không tạo profile đúng')
    await db.from('profiles').update({ role: 'admin' }).eq('id', data.user.id)
  })

  const adminCtx = await newContext({ viewport: { width: 1366, height: 900 } })
  const admin = watch(await adminCtx.newPage(), 'admin')
  const admin2Ctx = await newContext({ viewport: { width: 1366, height: 900 } })
  const admin2 = watch(await admin2Ctx.newPage(), 'admin2')
  const guestCtx = await newContext({ ...devices['iPhone 13'] })
  const guest = watch(await guestCtx.newPage(), 'khach-dt')
  const guest2Ctx = await newContext({ viewport: { width: 1366, height: 900 } })
  const guest2 = watch(await guest2Ctx.newPage(), 'khach-mt')

  // =====================================================================
  phase('2. KHÁCH – trang cần đăng nhập')
  // =====================================================================
  await step('[Khách] Vào /admin, /courses, /account bị chuyển tới trang đăng nhập', async () => {
    for (const path of ['/admin', '/courses', '/account']) {
      await guest.goto(`${BASE}${path}`)
      const url = new URL(guest.url())
      assert(url.pathname === '/login' && url.searchParams.get('next') === path, `${path} → ${guest.url()}`)
    }
  })

  // =====================================================================
  phase('3. ADMIN – đăng nhập & chuẩn bị khóa học')
  // =====================================================================
  await step('[Admin] Đăng nhập sai mật khẩu hiển thị lỗi', async () => {
    await admin.goto(`${BASE}/login`)
    await admin.fill('#identifier', ADMIN.email)
    await admin.fill('#password', 'sai-mat-khau')
    await Promise.all([admin.waitForURL(/error=/), admin.click('button[type=submit]')])
    await admin.getByText('Email/số điện thoại hoặc mật khẩu không đúng.').waitFor()
  })

  await step('[Admin] Đăng nhập bằng email, có thông báo, nút "Quản trị" được tô nổi bật', async () => {
    await login(admin, ADMIN.email, ADMIN.password, '/admin')
    await admin.getByRole('heading', { name: 'Bảng quản trị' }).waitFor()
    await toast(admin, 'Đăng nhập thành công')
    const link = admin.getByRole('link', { name: 'Quản trị', exact: true })
    await link.and(admin.locator('[aria-current=page]')).waitFor()
    const bg = await link.evaluate((el) => getComputedStyle(el).backgroundColor)
    assert(bg !== 'rgba(0, 0, 0, 0)', `Nút Quản trị không đổi màu (background: ${bg})`)
  })

  await step('[Admin] Cấp quyền admin cho tài khoản thứ 2 trên giao diện; tab "Admin" ghi người cấp; không tự đổi quyền mình', async () => {
    const { data, error } = await db.auth.admin.createUser({
      email: ADMIN2.email, password: ADMIN2.password, email_confirm: true, user_metadata: { full_name: ADMIN2.name },
    })
    assert(!error, error?.message)
    ADMIN2.id = data.user.id
    created.userIds.push(ADMIN2.id)

    await admin.goto(`${BASE}/admin/users?q=${encodeURIComponent(ADMIN2.email)}`)
    const row = admin.locator('tr', { hasText: ADMIN2.email })
    admin.once('dialog', (d) => d.accept())
    await row.getByRole('button', { name: 'Cấp quyền admin' }).click()
    await toast(admin, 'Đã cấp quyền admin')
    await row.getByRole('button', { name: 'Gỡ quyền admin' }).waitFor()
    const { data: profile } = await db.from('profiles').select('role').eq('id', ADMIN2.id).single()
    assert(profile.role === 'admin', `Quyền chưa đổi: ${profile.role}`)
    const { data: events } = await db.from('role_events').select('actor, actor_name, from_role, to_role').eq('user_id', ADMIN2.id)
    assert(
      events.length === 1 && events[0].actor === ADMIN.id && events[0].actor_name === 'Admin E2E' && events[0].to_role === 'admin',
      `Nhật ký phân quyền sai: ${JSON.stringify(events)}`
    )

    // Tab "Admin": có cả 2 admin test, ghi "Cấp quyền bởi Admin E2E"; dòng của chính mình không có nút đổi quyền
    await admin.goto(`${BASE}/admin/users?role=admin&q=e2e-admin`)
    await admin.getByRole('link', { name: /^Admin \(\d+\)/ }).and(admin.locator('[aria-current=page]')).waitFor()
    await admin.locator('tr', { hasText: ADMIN2.email }).getByText('Cấp quyền bởi Admin E2E').waitFor()
    const me = admin.locator('tr', { hasText: ADMIN.email })
    await me.getByText('Tài khoản của bạn').waitFor()
    assert((await me.getByRole('button').count()) === 0, 'Dòng của chính mình vẫn có nút đổi quyền')

    // Database chặn tự gỡ quyền kể cả khi gọi thẳng API bằng phiên admin
    ADMIN.session = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { error: loginError } = await ADMIN.session.auth.signInWithPassword({ email: ADMIN.email, password: ADMIN.password })
    assert(!loginError, loginError?.message)
    const { error: selfError } = await ADMIN.session.from('profiles').update({ role: 'user' }).eq('id', ADMIN.id)
    assert(selfError?.message.includes('không thể tự gỡ quyền'), `Tự gỡ được quyền admin: ${selfError?.message ?? 'không lỗi'}`)

    await login(admin2, ADMIN2.email, ADMIN2.password, '/admin')
    await admin2.getByRole('heading', { name: 'Bảng quản trị' }).waitFor()
  })

  await step('[Admin] Tạo 2 khóa đang mở đăng ký và 1 khóa đang ẩn', async () => {
    created.courseIds.A = await createCourseViaUI(admin, COURSE_A)
    created.courseIds.B = await createCourseViaUI(admin, COURSE_B)
    created.courseIds.hidden = await createCourseViaUI(admin, COURSE_HIDDEN)
  })

  await step('[Admin] Thêm bài học video YouTube cho khóa A', async () => {
    await admin.goto(`${BASE}/admin/courses/${created.courseIds.A}`)
    const form = admin.locator('section', { has: admin.getByRole('heading', { name: 'Thêm bài học' }) })
    await form.locator('[name=title]').fill(LESSON_TITLE)
    await form.locator('[name=video_url]').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await form.getByRole('button', { name: 'Thêm bài học' }).click()
    await toast(admin, 'Đã thêm bài học')
    const { count } = await db.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', created.courseIds.A)
    assert(count === 1, `Số bài học: ${count}`)
  })

  await step('[Admin] Server kiểm tra dữ liệu: tên rỗng, học phí âm/không phải số, link video lạ đều bị từ chối', async () => {
    // Gửi thẳng dữ liệu sai lên server: ghi đè FormData ngay lúc form được gửi (bỏ qua kiểm tra HTML)
    const submitWith = async (form, button, values) => {
      await form.evaluate((el, v) => {
        el.noValidate = true
        el.addEventListener('formdata', (e) => Object.entries(v).forEach(([k, x]) => e.formData.set(k, x)), { once: true })
      }, values)
      await form.getByRole('button', { name: button }).click()
    }
    const expectError = async (text) => {
      const alert = admin.getByRole('alert').filter({ hasText: text }).first()
      await alert.waitFor()
      await alert.waitFor({ state: 'detached', timeout: 8000 }) // chờ toast tắt để lần sau không nhầm
    }

    await admin.goto(`${BASE}/admin/courses`)
    const courseForm = admin.locator('section', { has: admin.getByRole('heading', { name: 'Thêm khóa học mới' }) }).locator('form')
    for (const [values, expected] of [
      [{ title: '   ', price: '100000' }, 'Vui lòng nhập tên khóa học'],
      [{ title: `[E2E] Sai giá ${stamp}`, price: '-5000' }, 'Học phí phải từ 0'],
      [{ title: `[E2E] Sai giá ${stamp}`, price: 'abc' }, 'Học phí phải là số nguyên'],
      [{ title: `[E2E] Sai giá ${stamp}`, price: '1.5' }, 'Học phí phải là số nguyên'],
      [{ title: 'x'.repeat(201), price: '0' }, 'tối đa 200 ký tự'],
      [{ title: `[E2E] Sai trạng thái ${stamp}`, price: '0', status: 'archived' }, 'Trạng thái khóa học không hợp lệ'],
    ]) {
      await submitWith(courseForm, 'Thêm khóa học', values)
      await expectError(expected)
    }
    const { data: bad } = await db.from('courses').select('title').like('title', `%${stamp}%`)
    assert(bad.length === 3, `Khóa học sai vẫn được lưu: ${JSON.stringify(bad.map((c) => c.title))}`)

    // Bài học: link không phải https YouTube/TikTok bị từ chối; link TikTok hợp lệ được nhận
    await admin.goto(`${BASE}/admin/courses/${created.courseIds.A}`)
    const lessonForm = admin.locator('section', { has: admin.getByRole('heading', { name: 'Thêm bài học' }) }).locator('form')
    for (const url of ['https://example.com/video.mp4', 'http://www.youtube.com/watch?v=dQw4w9WgXcQ', 'javascript:alert(1)', 'https://evil.com/?v=dQw4w9WgXcQ']) {
      await submitWith(lessonForm, 'Thêm bài học', { title: 'Bài lỗi', video_url: url })
      await expectError('Link video phải là link YouTube hoặc TikTok')
    }
    await lessonForm.locator('[name=title]').fill('Bài 2: Video TikTok')
    await lessonForm.locator('[name=video_url]').fill('https://www.tiktok.com/@bacsi/video/7300000000000000000')
    await lessonForm.getByRole('button', { name: 'Thêm bài học' }).click()
    await toast(admin, 'Đã thêm bài học "Bài 2: Video TikTok"')
    const { data: lessons } = await db.from('lessons').select('title').eq('course_id', created.courseIds.A)
    assert(lessons.length === 2 && !lessons.some((l) => l.title === 'Bài lỗi'), `Bài học: ${JSON.stringify(lessons)}`)
  })

  await step('[Admin] Bài học cũ có link video không hợp lệ được cảnh báo ở danh sách khóa và trang bài học', async () => {
    // Giả lập dữ liệu nhập trước khi có kiểm tra link (ghi thẳng vào database)
    const { data, error } = await db
      .from('lessons')
      .insert({ course_id: created.courseIds.A, title: LEGACY_LESSON_TITLE, video_url: 'https://example.com/video.mp4', sort_order: 99 })
      .select('id')
      .single()
    assert(!error, error?.message)
    LEGACY_LESSON.id = data.id
    await admin.goto(`${BASE}/admin/courses`)
    await admin.locator('.card', { has: admin.getByRole('heading', { name: COURSE_A.title }) }).getByText('1 bài lỗi link video').waitFor()
    await admin.goto(`${BASE}/admin/courses/${created.courseIds.A}`)
    const card = admin.locator('.card', { hasText: LEGACY_LESSON_TITLE })
    await card.getByRole('alert').filter({ hasText: 'Link video không hợp lệ' }).waitFor()
    assert(
      (await admin.locator('.card', { hasText: LESSON_TITLE }).getByText('Link video không hợp lệ').count()) === 0,
      'Bài có link hợp lệ vẫn bị cảnh báo'
    )
  })

  await step('[Hệ thống] RLS: khách chỉ thấy khóa đang mở; không thấy khóa ẩn, bài học, đơn đăng ký', async () => {
    const { data: courses } = await anon.from('courses').select('id').in('id', Object.values(created.courseIds))
    const visible = courses.map((c) => c.id)
    assert(visible.includes(created.courseIds.A) && visible.includes(created.courseIds.B), 'Khách không thấy khóa đang mở')
    assert(!visible.includes(created.courseIds.hidden), 'Khách thấy khóa đang ẩn!')
    const { data: lessons } = await anon.from('lessons').select('id').eq('course_id', created.courseIds.A)
    assert(lessons?.length === 0, 'Khách xem được bài học!')
    for (const t of ['registrations', 'password_resets', 'registration_events', 'role_events']) {
      const { data } = await anon.from(t).select('id')
      assert(!data?.length, `Khách đọc được bảng ${t}!`)
    }
  })

  // =====================================================================
  phase('4. KHÁCH – đăng ký khóa học bằng form 3 bước')
  // =====================================================================
  await step('[Khách] Trang chủ có thông tin trung tâm, bác sĩ và box đăng ký 3 bước', async () => {
    await guest.goto(BASE)
    await guest.getByRole('heading', { level: 1, name: /Trị liệu cột sống/ }).waitFor()
    await guest.getByRole('heading', { name: 'Bác sĩ Đỗ Mạnh Cường' }).waitFor()
    // FAQ hướng dẫn đăng nhập bằng số điện thoại (không còn nhắc "Gmail")
    const faq = await guest.locator('details').allTextContents()
    assert(faq.some((t) => t.includes('số điện thoại (hoặc email)')) && !faq.some((t) => t.includes('Gmail')), 'FAQ còn nội dung cũ')
    const box = guest.locator('#dang-ky')
    for (const s of ['Bước 1: Chuyển khoản theo thông tin', 'Bước 2: Chụp lại ảnh chuyển khoản', 'Bước 3: Đăng ký thông tin & gửi ảnh']) {
      await box.getByRole('heading', { name: s }).waitFor()
    }
    for (const field of ['#fullName', '#email', '#phone', '#password', '#courseId', '#paymentProof']) {
      assert((await box.locator(field).count()) === 1, `Thiếu ô ${field} trong box đăng ký`)
    }
    assert((await box.locator('#email').getAttribute('required')) === null, 'Email vẫn đang bắt buộc')
    await registerButton(box).waitFor()
    await guest.screenshot({ path: `${OUT}mobile-home.png` })
  })

  await step('[Khách] Nút "Đăng ký" của khóa học cuộn tới form và chọn sẵn khóa đó', async () => {
    const card = guest.locator('.card', { has: guest.getByRole('heading', { name: COURSE_B.title }) })
    await card.getByRole('link', { name: 'Đăng ký' }).click()
    await guest.waitForURL(new RegExp(`course=${created.courseIds.B}`))
    await guest.waitForFunction(() => {
      const top = document.querySelector('#dang-ky')?.getBoundingClientRect().top ?? 9999
      return top >= -50 && top < window.innerHeight / 2
    })
    await guest.waitForFunction((id) => document.querySelector('#courseId')?.value === id, created.courseIds.B)
  })

  await step('[Khách] Ô "Chọn khóa học" chỉ liệt kê các khóa đang mở đăng ký, kèm giá', async () => {
    const options = await guest.locator('#courseId option').allTextContents()
    assert(options.some((o) => o.includes(COURSE_A.title) && o.includes('199.000đ')), `Thiếu khóa A: ${options}`)
    assert(options.some((o) => o.includes(COURSE_B.title) && o.includes('299.000đ')), `Thiếu khóa B: ${options}`)
    assert(!options.some((o) => o.includes(COURSE_HIDDEN.title)), 'Khóa đang ẩn xuất hiện trong danh sách!')
  })

  await step('[Khách] Mã QR (Bước 1) cập nhật theo khóa học và số điện thoại', async () => {
    await guest.selectOption('#courseId', created.courseIds.A)
    await guest.fill('#phone', STUDENT.phone)
    const qr = await guest.getByAltText('Mã QR chuyển khoản').getAttribute('src')
    assert(qr.includes('970436-0991000029158') && qr.includes('amount=199000') && qr.includes(STUDENT.phone), `QR sai: ${qr}`)
  })

  await step('[Khách] Chọn file không phải ảnh bị từ chối ngay trên trình duyệt', async () => {
    await guest.setInputFiles('#paymentProof', NOT_IMAGE)
    await alertText(guest, 'Chỉ nhận ảnh định dạng JPG, PNG, WEBP hoặc HEIC')
    assert((await guest.locator('#paymentProof').evaluate((el) => el.files.length)) === 0, 'File sai vẫn được giữ lại')
  })

  await step('[Khách] Ảnh chuyển khoản dung lượng lớn được tự động nén trước khi upload', async () => {
    await guest.setInputFiles('#paymentProof', LARGE_IMAGE)
    const info = await guest.getByTestId('proof-size').textContent({ timeout: 20000 })
    assert(info.startsWith('Đã tối ưu:'), `Ảnh không được nén: ${info}`)
    const [name, type, size] = await guest
      .locator('#paymentProof')
      .evaluate((el) => [el.files[0].name, el.files[0].type, el.files[0].size])
    assert(type === 'image/jpeg' && name.endsWith('.jpg') && size < 2 * 1024 * 1024, `File sau nén: ${name} ${type} ${size}B`)
    console.log(`      ${info}`)
  })

  await step('[Khách] Mật khẩu dưới 8 ký tự bị từ chối (trình duyệt và server)', async () => {
    assert((await guest.locator('#password').getAttribute('minlength')) === '8', 'Ô mật khẩu chưa yêu cầu tối thiểu 8 ký tự')
    // Bỏ qua kiểm tra của trình duyệt để chắc chắn server cũng chặn
    await guest.locator('form', { has: guest.locator('#paymentProof') }).evaluate((f) => (f.noValidate = true))
    await fillGuestForm(guest, { ...STUDENT, password: 'Ngan#12', courseId: created.courseIds.A, image: SMALL_IMAGE })
    await registerButton(guest).click()
    await alertText(guest, 'Mật khẩu cần ít nhất 8 ký tự')
  })

  await step('[Khách] File không phải ảnh đổi đuôi .png (vượt qua trình duyệt) bị server từ chối theo nội dung file', async () => {
    const fake = { name: 'chuyen-khoan.png', mimeType: 'image/png', buffer: Buffer.from('day khong phai la anh, chi doi duoi thanh png') }
    await fillGuestForm(guest, { ...STUDENT, courseId: created.courseIds.A })
    await guest.setInputFiles('#paymentProof', fake)
    await guest.getByTestId('proof-size').waitFor()
    await registerButton(guest).click()
    await alertText(guest, 'Ảnh chuyển khoản phải là ảnh JPG, PNG, WEBP hoặc HEIC hợp lệ')
    const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('email', STUDENT.email)
    assert(count === 0, 'Vẫn tạo tài khoản dù ảnh không hợp lệ')
  })

  await step('[Khách] Số điện thoại sai: báo lỗi, không lưu gì vào database', async () => {
    await fillGuestForm(guest, { ...STUDENT, phone: '12345', courseId: created.courseIds.A, image: SMALL_IMAGE })
    await registerButton(guest).click()
    await alertText(guest, 'Số điện thoại không hợp lệ')
    const { count } = await db.from('registrations').select('id', { count: 'exact', head: true }).eq('email', STUDENT.email)
    assert(count === 0, 'Đơn lỗi vẫn được lưu')
  })

  await step('[Khách] Đăng ký có email thành công (điện thoại): tạo tài khoản, lưu đơn và ảnh đã nén', async () => {
    await fillGuestForm(guest, { ...STUDENT, courseId: created.courseIds.A, image: LARGE_IMAGE })
    await guest.getByTestId('proof-size').filter({ hasText: 'Đã tối ưu' }).waitFor({ timeout: 20000 })
    await guest.screenshot({ path: `${OUT}mobile-register-form.png`, fullPage: true })
    await Promise.all([guest.waitForURL(/\/courses\?registered=1/, { timeout: 30000 }), registerButton(guest).click()])
    await toast(guest, 'Đã gửi đăng ký thành công')
    await guest.getByText('Đăng ký thành công!', { exact: true }).waitFor()

    const { data: reg } = await db
      .from('registrations')
      .select('user_id, status, phone, full_name, course_id, course_title, amount, payment_proof_path')
      .eq('email', STUDENT.email)
      .single()
    assert(
      reg?.status === 'pending' && reg.course_id === created.courseIds.A && reg.phone === STUDENT.phone && reg.full_name === STUDENT.name,
      `Đơn sai: ${JSON.stringify(reg)}`
    )
    assert(reg.course_title === COURSE_A.title && reg.amount === Number(COURSE_A.price), `Đơn không lưu tên khóa/học phí: ${JSON.stringify(reg)}`)
    STUDENT.id = reg.user_id
    created.userIds.push(reg.user_id)
    assert(reg.payment_proof_path.endsWith('.jpg'), `Ảnh không lưu dạng JPG: ${reg.payment_proof_path}`)
    const { data: file } = await db.storage.from('payment-proofs').download(reg.payment_proof_path)
    assert(file && file.size > 10_000 && file.size < 2 * 1024 * 1024, `Ảnh trong Storage: ${file?.size}B`)
    const { data: profile } = await db.from('profiles').select('full_name, phone, email, role').eq('id', reg.user_id).single()
    assert(
      profile?.full_name === STUDENT.name && profile.phone === STUDENT.phone && profile.email === STUDENT.email && profile.role === 'user',
      `Profile sai: ${JSON.stringify(profile)}`
    )
  })

  await step('[Khách] Đăng ký KHÔNG có email, chỉ số điện thoại (máy tính): thành công', async () => {
    await guest2.goto(`${BASE}/register?course=${created.courseIds.B}`)
    await fillGuestForm(guest2, { ...STUDENT2, email: '', image: SMALL_IMAGE })
    await Promise.all([guest2.waitForURL(/\/courses\?registered=1/, { timeout: 30000 }), registerButton(guest2).click()])
    await toast(guest2, 'Đã gửi đăng ký thành công')

    const { data: profile } = await db.from('profiles').select('id, full_name, email, phone').eq('phone', STUDENT2.phone).single()
    assert(profile?.full_name === STUDENT2.name && profile.email === null, `Profile sai: ${JSON.stringify(profile)}`)
    STUDENT2.id = profile.id
    created.userIds.push(profile.id)
    const regs = await registrationsOf(profile.id)
    assert(regs.length === 1 && regs[0].email === null && regs[0].course_id === created.courseIds.B, `Đơn sai: ${JSON.stringify(regs)}`)
    const { data: auth } = await db.auth.admin.getUserById(profile.id)
    assert(auth.user.email === `${STUDENT2.phone}@sdt.hv.invalid`, `Email đăng nhập nội bộ sai: ${auth.user.email}`)
  })

  await step('[Khách] Đăng ký trùng email hoặc trùng số điện thoại bị từ chối', async () => {
    const ctx = await newContext()
    const p = watch(await ctx.newPage(), 'khach-trung')
    await p.goto(`${BASE}/register`)
    await fillGuestForm(p, { ...STUDENT, phone: '0987000111', courseId: created.courseIds.B, image: SMALL_IMAGE })
    await registerButton(p).click()
    await alertText(p, 'Email này đã có tài khoản')
    await fillGuestForm(p, { ...STUDENT2, email: '', courseId: created.courseIds.B, image: SMALL_IMAGE })
    await registerButton(p).click()
    await alertText(p, 'Số điện thoại này đã có tài khoản')
    await ctx.close()
  })

  // =====================================================================
  phase('5. HỌC VIÊN – trước khi được duyệt')
  // =====================================================================
  const student = guest // cùng trình duyệt: đã tự đăng nhập sau khi đăng ký
  const student2 = guest2

  await step('[Học viên] Thấy đơn đang chờ; khóa A còn khóa; không vào được /admin', async () => {
    await student.goto(`${BASE}/courses`)
    await student.getByRole('heading', { name: 'Đang chờ xác nhận' }).waitFor()
    await student.goto(`${BASE}/courses/${created.courseIds.A}`)
    await student.getByText('Khóa học chưa được mở cho tài khoản của bạn').waitFor()
    await student.goto(`${BASE}/admin`)
    assert(new URL(student.url()).pathname === '/courses', `Học viên vào được admin: ${student.url()}`)
  })

  await step('[Học viên] Đăng ký thêm khóa B: form điền sẵn thông tin, không hỏi email/mật khẩu', async () => {
    await student.goto(`${BASE}/register?course=${created.courseIds.B}`)
    await student.getByText(`Bạn đang đăng nhập với ${STUDENT.email}`).waitFor()
    assert((await student.locator('#password').count()) === 0, 'Vẫn hỏi mật khẩu khi đã đăng nhập')
    assert((await student.locator('#email').count()) === 0, 'Vẫn hỏi email khi đã đăng nhập')
    assert((await student.inputValue('#fullName')) === STUDENT.name, 'Họ tên chưa được điền sẵn')
    assert((await student.inputValue('#courseId')) === created.courseIds.B, 'Chưa chọn sẵn khóa B')
    await student.setInputFiles('#paymentProof', SMALL_IMAGE)
    await Promise.all([student.waitForURL(/\/courses\?registered=1/, { timeout: 30000 }), registerButton(student).click()])
    const regs = await registrationsOf(STUDENT.id)
    assert(regs.length === 2 && regs.every((r) => r.email === STUDENT.email), `Đơn của học viên: ${JSON.stringify(regs)}`)
  })

  await step('[Học viên] Đăng ký lại khóa A đang chờ duyệt bị chặn', async () => {
    await student.goto(`${BASE}/register?course=${created.courseIds.A}`)
    await student.getByText(`Bạn đang đăng nhập với ${STUDENT.email}`).waitFor()
    await student.setInputFiles('#paymentProof', SMALL_IMAGE)
    await registerButton(student).click()
    await alertText(student, 'đang chờ xác nhận')
  })

  await step('[Hệ thống] Database chặn 2 đơn cùng chờ duyệt cho cùng khóa (gửi đồng thời vượt qua kiểm tra của web)', async () => {
    const { error } = await db.from('registrations').insert({
      user_id: STUDENT.id, course_id: created.courseIds.A, full_name: STUDENT.name, phone: STUDENT.phone, payment_proof_path: `e2e/${stamp}.jpg`,
    })
    assert(error?.code === '23505', `Database vẫn nhận đơn trùng: ${error?.message ?? 'không lỗi'} (đã chạy supabase/schema.sql mới nhất chưa?)`)
  })

  // =====================================================================
  phase('6. ADMIN – duyệt đơn đăng ký')
  // =====================================================================
  const regTable = () => admin.getByRole('table', { name: 'Danh sách đơn đăng ký' })
  const regCard = (who, course) => regTable().locator('tbody tr', { hasText: who }).filter({ hasText: course.title })
  const REG_COLUMNS = ['STT', 'Ảnh chuyển khoản', 'Họ và tên', 'Email', 'Số điện thoại', 'Khóa học', 'Học phí', 'Ngày đăng ký', 'Trạng thái', 'Ngày xử lý', 'Người xử lý', 'Thao tác']
  // Nút "Từ chối" / "Thu hồi" mở ô nhập lý do, bấm "Xác nhận …" mới gửi
  const rejectToggle = (row, label) => row.locator('summary', { hasText: label })
  async function rejectVia(row, label, note = '') {
    await rejectToggle(row, label).click()
    if (note) await row.locator('textarea[name=note]').fill(note)
    await row.getByRole('button', { name: `Xác nhận ${label.toLowerCase()}` }).click()
  }

  await step('[Admin] Đơn đăng ký hiển thị dạng bảng với đủ cột ở cả 4 tab', async () => {
    for (const tab of ['Tất cả', 'Từ chối', 'Đã duyệt', 'Chờ duyệt']) {
      await admin.goto(`${BASE}/admin`)
      await admin.getByRole('link', { name: new RegExp(`^${tab}`) }).click()
      await admin.getByRole('link', { name: new RegExp(`^${tab}`) }).and(admin.locator('[aria-current=page]')).waitFor()
      const headers = (await regTable().locator('thead th').allTextContents()).map((h) => h.trim())
      assert(JSON.stringify(headers) === JSON.stringify(REG_COLUMNS), `Tab ${tab}: cột sai ${headers}`)
    }
    // Tab "Chờ duyệt": 3 đơn của học viên test, mỗi dòng có trạng thái + nút Duyệt/Từ chối
    for (const [who, course] of [[STUDENT.email, COURSE_A], [STUDENT.email, COURSE_B], [STUDENT2.phone, COURSE_B]]) {
      const row = regCard(who, course)
      await row.getByText('Chờ duyệt', { exact: true }).waitFor()
      await row.getByRole('button', { name: 'Duyệt' }).waitFor()
      await rejectToggle(row, 'Từ chối').waitFor()
    }
  })

  await step('[Admin] Thấy đơn kèm ảnh chuyển khoản (tải được) và duyệt khóa A', async () => {
    await admin.goto(`${BASE}/admin`)
    const card = regCard(STUDENT.email, COURSE_A)
    const proof = card.getByAltText(`Chuyển khoản của ${STUDENT.name}`)
    await proof.scrollIntoViewIfNeeded()
    await admin.waitForFunction((img) => img.complete && img.naturalWidth > 0, await proof.elementHandle(), { timeout: 15000 })
    await admin.screenshot({ path: `${OUT}desktop-admin.png`, fullPage: true })
    await card.getByRole('button', { name: 'Duyệt' }).click()
    await toast(admin, 'Đã duyệt đơn')
    await card.waitFor({ state: 'detached' })
  })

  await step('[Admin] Từ chối đơn khóa B của học viên 1 kèm lý do', async () => {
    const card = regCard(STUDENT.email, COURSE_B)
    await rejectVia(card, 'Từ chối', REJECT_NOTE)
    await toast(admin, 'Từ chối')
    await card.waitFor({ state: 'detached' })
    const byCourse = Object.fromEntries((await registrationsOf(STUDENT.id)).map((r) => [r.course_id, r]))
    assert(byCourse[created.courseIds.A]?.status === 'approved' && byCourse[created.courseIds.A].reviewed_at, 'Khóa A chưa được duyệt')
    assert(byCourse[created.courseIds.B]?.status === 'rejected', 'Khóa B chưa bị từ chối')
    assert(byCourse[created.courseIds.B].review_note === REJECT_NOTE, `Lý do từ chối: ${byCourse[created.courseIds.B].review_note}`)
    // Database tự ghi admin đang đăng nhập là người xử lý
    for (const r of [byCourse[created.courseIds.A], byCourse[created.courseIds.B]]) {
      assert(r.reviewed_by === ADMIN.id && r.reviewed_by_name === 'Admin E2E', `Người xử lý sai: ${JSON.stringify(r)}`)
    }
  })

  await step('[Hệ thống] Người xử lý không sửa tay được qua API; chuyển về "Chờ duyệt" thì xóa người xử lý', async () => {
    const regA = (await registrationsOf(STUDENT.id)).find((r) => r.course_id === created.courseIds.A)
    await db.from('registrations').update({ reviewed_by_name: 'Giả mạo', reviewed_at: null, review_note: 'Giả mạo' }).eq('id', regA.id)
    const after = (await registrationsOf(STUDENT.id)).find((r) => r.id === regA.id)
    assert(
      after.reviewed_by_name === 'Admin E2E' && after.reviewed_at === regA.reviewed_at && after.review_note === null,
      `Sửa tay được người xử lý / lý do: ${JSON.stringify(after)}`
    )
    const { data: anonEvents } = await anon.from('registration_events').select('id')
    assert(!anonEvents?.length, 'Khách đọc được lịch sử xử lý đơn!')

    const id = await insertRegistration({
      user_id: STUDENT2.id, course_id: created.courseIds.hidden, full_name: STUDENT2.name, phone: STUDENT2.phone,
      status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: ADMIN.id, reviewed_by_name: 'Admin E2E',
    })
    await db.from('registrations').update({ status: 'pending' }).eq('id', id)
    const { data } = await db.from('registrations').select('reviewed_at, reviewed_by, reviewed_by_name').eq('id', id).single()
    assert(!data.reviewed_at && !data.reviewed_by && !data.reviewed_by_name, `Về chờ duyệt vẫn còn người xử lý: ${JSON.stringify(data)}`)
    await db.from('registrations').delete().eq('id', id)
  })

  await step('[Admin] Đơn của học viên không có email hiển thị "Không có email"', async () => {
    const card = regCard(STUDENT2.phone, COURSE_B)
    await card.getByText('Không có email').waitFor()
  })

  await step('[Admin] Tab "Đã duyệt", "Từ chối", "Tất cả" hiển thị đúng trạng thái, ngày xử lý và nút', async () => {
    await admin.goto(`${BASE}/admin?status=approved`)
    let row = regCard(STUDENT.email, COURSE_A)
    await row.getByText('Đã duyệt', { exact: true }).waitFor()
    assert(/\d{2}\/\d{2}\/\d{4}/.test(await row.locator('td').nth(9).textContent()), 'Thiếu ngày xử lý')
    assert((await row.locator('td').nth(10).textContent()).trim() === 'Admin E2E', 'Thiếu người xử lý')
    await rejectToggle(row, 'Thu hồi').waitFor()
    assert((await row.getByRole('button', { name: 'Duyệt' }).count()) === 0, 'Đơn đã duyệt vẫn có nút Duyệt')

    await admin.goto(`${BASE}/admin?status=rejected`)
    row = regCard(STUDENT.email, COURSE_B)
    await row.getByText('Từ chối', { exact: true }).waitFor()
    // Lý do hiện dưới trạng thái (bản thứ 2 nằm trong "Lịch sử" đang thu gọn)
    await row.getByText(`Lý do: ${REJECT_NOTE}`).first().waitFor()
    await row.getByRole('button', { name: 'Duyệt' }).waitFor()
    assert((await rejectToggle(row, 'Từ chối').count()) === 0, 'Đơn bị từ chối vẫn có nút Từ chối')

    await admin.goto(`${BASE}/admin?status=all`)
    for (const [who, course, status] of [
      [STUDENT.email, COURSE_A, 'Đã duyệt'],
      [STUDENT.email, COURSE_B, 'Từ chối'],
      [STUDENT2.phone, COURSE_B, 'Chờ duyệt'],
    ]) {
      await regCard(who, course).getByText(status, { exact: true }).waitFor()
    }
    await admin.screenshot({ path: `${OUT}desktop-admin-table.png`, fullPage: true })
  })

  await step('[Admin] Danh sách học viên hiển thị đúng trạng thái từng khóa', async () => {
    await admin.goto(`${BASE}/admin/users?q=${encodeURIComponent(STUDENT.email)}`)
    const row = admin.locator('tr', { hasText: STUDENT.email })
    await row.getByText(STUDENT.phone).waitFor()
    await row.locator('li', { hasText: COURSE_A.title }).getByText('Đã duyệt').waitFor()
    await row.locator('li', { hasText: COURSE_B.title }).getByText('Từ chối').waitFor()
    await admin.goto(`${BASE}/admin/users?q=${STUDENT2.phone}`)
    await admin.locator('tr', { hasText: STUDENT2.phone }).getByText('Không có email').waitFor()
  })

  await step('[Admin] 2 admin cùng xử lý 1 đơn: admin 2 duyệt trước, admin 1 (trang cũ) từ chối bị chặn, không ghi đè', async () => {
    // Đơn chờ duyệt của học viên 2 cho khóa đang ẩn (không ảnh hưởng các bước sau)
    RACE.id = await insertRegistration({ user_id: STUDENT2.id, course_id: created.courseIds.hidden, full_name: STUDENT2.name, phone: STUDENT2.phone })
    await Promise.all([admin.goto(`${BASE}/admin`), admin2.goto(`${BASE}/admin`)])
    const row1 = regCard(STUDENT2.phone, COURSE_HIDDEN)
    const row2 = admin2.getByRole('table', { name: 'Danh sách đơn đăng ký' }).locator('tbody tr', { hasText: COURSE_HIDDEN.title })
    await row2.getByRole('button', { name: 'Duyệt' }).click()
    await toast(admin2, 'Đã duyệt đơn')
    await rejectVia(row1, 'Từ chối', 'Bấm từ trang cũ')
    await alertText(admin, 'Đơn đã thay đổi (có thể admin khác vừa xử lý)')
    const { data } = await db.from('registrations').select('status, reviewed_by, reviewed_by_name, review_note').eq('id', RACE.id).single()
    assert(
      data.status === 'approved' && data.reviewed_by === ADMIN2.id && data.reviewed_by_name === ADMIN2.name && !data.review_note,
      `Đơn bị ghi đè: ${JSON.stringify(data)}`
    )
  })

  await step('[Admin] Lịch sử xử lý đơn: Duyệt (admin 2) → Thu hồi kèm lý do (admin 1) → Duyệt lại (admin 1) đủ 3 dòng đúng người', async () => {
    await admin.goto(`${BASE}/admin?status=approved`)
    let row = regCard(STUDENT2.phone, COURSE_HIDDEN)
    await rejectVia(row, 'Thu hồi', 'Chuyển khoản chưa về tài khoản')
    await toast(admin, 'Từ chối')
    await admin.goto(`${BASE}/admin?status=rejected`)
    row = regCard(STUDENT2.phone, COURSE_HIDDEN)
    await row.getByRole('button', { name: 'Duyệt' }).click()
    await toast(admin, 'Đã duyệt đơn')

    const { data: events } = await db
      .from('registration_events')
      .select('actor, actor_name, from_status, to_status, note')
      .eq('registration_id', RACE.id)
      .order('created_at')
    const summary = events.map((e) => `${e.actor_name}:${e.from_status}>${e.to_status}:${e.note ?? ''}`)
    assert(
      JSON.stringify(summary) ===
        JSON.stringify([
          `${ADMIN2.name}:pending>approved:`,
          'Admin E2E:approved>rejected:Chuyển khoản chưa về tài khoản',
          'Admin E2E:rejected>approved:',
        ]),
      `Lịch sử sai: ${JSON.stringify(summary)}`
    )
    const { data: reg } = await db.from('registrations').select('review_note').eq('id', RACE.id).single()
    assert(reg.review_note === null, `Duyệt lại vẫn còn lý do thu hồi: ${reg.review_note}`)

    // Giao diện: mở "Lịch sử (3)" thấy đủ người xử lý và lý do
    await admin.goto(`${BASE}/admin?status=approved`)
    row = regCard(STUDENT2.phone, COURSE_HIDDEN)
    await row.locator('summary', { hasText: 'Lịch sử (3)' }).click()
    await row.locator('li', { hasText: 'Lý do: Chuyển khoản chưa về tài khoản' }).waitFor()
    await row.locator('li', { hasText: ADMIN2.name }).waitFor()

    // Admin cũng không tự ghi / sửa được lịch sử (chỉ trigger ghi)
    const { error } = await ADMIN.session.from('registration_events').insert({ registration_id: RACE.id, from_status: 'pending', to_status: 'approved' })
    assert(error, 'Admin tự ghi được lịch sử xử lý!')
    const { data: deleted } = await ADMIN.session.from('registration_events').delete().eq('registration_id', RACE.id).select('id')
    assert(!deleted?.length, 'Admin xóa được lịch sử xử lý!')
  })

  // =====================================================================
  phase('7. HỌC VIÊN – sau khi được duyệt')
  // =====================================================================
  await step('[Học viên] Khóa A đã mở, khóa B báo chưa xác nhận; xem được video bài học', async () => {
    await student.goto(`${BASE}/courses`)
    await student.getByRole('heading', { name: 'Đơn chưa được xác nhận' }).waitFor()
    await student.locator('.card', { hasText: COURSE_B.title }).getByText(`Lý do: ${REJECT_NOTE}`).waitFor()
    await student.getByRole('link', { name: new RegExp(escape(COURSE_A.title)) }).click()
    await student.getByRole('link', { name: 'Bắt đầu học' }).click()
    await student.getByRole('heading', { name: LESSON_TITLE }).waitFor()
    const src = await student.locator('iframe').getAttribute('src')
    assert(src?.startsWith('https://www.youtube.com/embed/dQw4w9WgXcQ'), `iframe src: ${src}`)
    await student.waitForTimeout(3000)
    await student.screenshot({ path: `${OUT}mobile-lesson.png` })
  })

  await step('[Học viên] Bài có link video không hợp lệ không nhúng link lạ, hiện "Video đang được cập nhật"', async () => {
    await student.goto(`${BASE}/courses/${created.courseIds.A}/${LEGACY_LESSON.id}`)
    await student.getByRole('heading', { name: LEGACY_LESSON_TITLE }).waitFor()
    await student.getByText('Video bài học đang được cập nhật').waitFor()
    assert((await student.locator('iframe').count()) === 0, 'Vẫn nhúng link video không hợp lệ')
  })

  await step('[Học viên] Điện thoại: bấm "Tài khoản" rồi Đăng xuất; đăng nhập lại bằng email', async () => {
    await logoutViaMenu(student)
    await login(student, STUDENT.email, STUDENT.password)
    assert(new URL(student.url()).pathname === '/courses', `URL sau đăng nhập: ${student.url()}`)
    await student.getByRole('heading', { name: 'Khóa học đã mở' }).waitFor()
  })

  await step('[Học viên] Đăng nhập bằng số điện thoại (có dấu cách, dạng +84) cũng thành công', async () => {
    await logoutViaMenu(student)
    await login(student, `+84 ${STUDENT.phone.slice(1, 4)} ${STUDENT.phone.slice(4)}`, STUDENT.password)
    assert(new URL(student.url()).pathname === '/courses', `URL sau đăng nhập: ${student.url()}`)
  })

  // =====================================================================
  phase('8. HỌC VIÊN – tài khoản, đổi mật khẩu, quên mật khẩu (học viên không email, máy tính)')
  // =====================================================================
  await step('[Học viên] Rê chuột vào "Tài khoản" hiện menu: Tài khoản của tôi, Khóa học của tôi, Đăng xuất', async () => {
    await student2.goto(`${BASE}/courses`)
    const menu = student2.getByRole('menu', { name: 'Menu tài khoản' })
    assert(!(await menu.isVisible()), 'Menu tài khoản hiện sẵn khi chưa rê chuột')
    await student2.getByRole('button', { name: 'Tài khoản' }).hover()
    await menu.waitFor({ state: 'visible' })
    await menu.getByText(STUDENT2.name).waitFor()
    for (const item of ['Tài khoản của tôi', 'Khóa học của tôi', 'Đăng xuất']) {
      await menu.getByRole('menuitem', { name: item }).waitFor()
    }
    assert((await menu.getByRole('menuitem', { name: 'Quản trị' }).count()) === 0, 'Học viên thấy mục Quản trị')
    await student2.screenshot({ path: `${OUT}desktop-account-menu.png` })
    await menu.getByRole('menuitem', { name: 'Tài khoản của tôi' }).click()
    await student2.waitForURL(`${BASE}/account`)
  })

  await step('[Học viên] Trang Tài khoản của tôi hiển thị thông tin; cập nhật họ tên thành công', async () => {
    await student2.getByRole('heading', { name: 'Tài khoản của tôi' }).waitFor()
    assert((await student2.inputValue('#phone')) === STUDENT2.phone, 'Sai số điện thoại')
    assert((await student2.inputValue('#email')) === '', 'Tài khoản không email nhưng ô email có dữ liệu')
    STUDENT2.name = 'Chị Lan Đã Đổi Tên'
    await student2.fill('#fullName', STUDENT2.name)
    await student2.getByRole('button', { name: 'Lưu thông tin' }).click()
    await toast(student2, 'Đã cập nhật thông tin tài khoản')
    const { data } = await db.from('profiles').select('full_name').eq('id', STUDENT2.id).single()
    assert(data.full_name === STUDENT2.name, `Họ tên chưa cập nhật: ${data.full_name}`)
  })

  await step('[Học viên] Đổi mật khẩu: sai mật khẩu hiện tại bị từ chối, đúng thì thành công', async () => {
    const form = student2.locator('form', { has: student2.locator('#currentPassword') })
    await form.locator('#currentPassword').fill('mat-khau-sai')
    await form.locator('#newPassword').fill('MoiDoi#2024')
    await form.locator('#confirmPassword').fill('MoiDoi#2024')
    await form.getByRole('button', { name: 'Đổi mật khẩu' }).click()
    await student2.getByRole('alert').filter({ hasText: 'Mật khẩu hiện tại không đúng' }).first().waitFor()
    await form.locator('#currentPassword').fill(STUDENT2.password)
    await form.locator('#newPassword').fill('MoiDoi#2024')
    await form.locator('#confirmPassword').fill('MoiDoi#2024')
    await form.getByRole('button', { name: 'Đổi mật khẩu' }).click()
    await toast(student2, 'Đã đổi mật khẩu thành công')
    STUDENT2.password = 'MoiDoi#2024'
  })

  await step('[Học viên] Đăng xuất qua menu, đăng nhập lại bằng số điện thoại + mật khẩu mới', async () => {
    await logoutViaMenu(student2)
    await login(student2, STUDENT2.phone, STUDENT2.password)
    assert(new URL(student2.url()).pathname === '/courses', `URL: ${student2.url()}`)
  })

  await step('[Học viên] Quên mật khẩu khi tài khoản chưa có email: báo liên hệ hotline, không gửi thư', async () => {
    const ctx = await newContext()
    const p = watch(await ctx.newPage(), 'quen-mk-1')
    await p.goto(`${BASE}/login`)
    await p.getByRole('link', { name: 'Quên mật khẩu?' }).click()
    await p.waitForURL(`${BASE}/forgot-password`)
    await p.fill('#identifier', STUDENT2.phone)
    await p.getByRole('button', { name: 'Gửi mã xác nhận' }).click()
    await alertText(p, 'chưa có email')
    assert(readdirSync(OUTBOX).length === 0, 'Vẫn gửi email cho tài khoản không có email')
    await ctx.close()
  })

  await step('[Học viên] Không nhập được email nội bộ dạng <SĐT>@sdt.hv.invalid (chiếm SĐT người khác)', async () => {
    await student2.goto(`${BASE}/account`)
    await student2.fill('#email', `0399${tail.slice(0, 6)}@SDT.hv.invalid`)
    await student2.getByRole('button', { name: 'Lưu thông tin' }).click()
    await student2.getByRole('alert').filter({ hasText: 'Địa chỉ email không hợp lệ' }).first().waitFor()
    const { data } = await db.auth.admin.getUserById(STUDENT2.id)
    assert(data.user.email === `${STUDENT2.phone}@sdt.hv.invalid`, `Email đăng nhập bị đổi: ${data.user.email}`)
  })

  await step('[Học viên] Thêm email vào tài khoản, sau đó đăng nhập được bằng email', async () => {
    await student2.goto(`${BASE}/account`)
    await student2.fill('#email', STUDENT2.laterEmail)
    await student2.getByRole('button', { name: 'Lưu thông tin' }).click()
    await toast(student2, 'Đã cập nhật thông tin tài khoản')
    const { data } = await db.from('profiles').select('email').eq('id', STUDENT2.id).single()
    assert(data.email === STUDENT2.laterEmail, `Email chưa lưu: ${data.email}`)
    assert(await tryLogin(STUDENT2.laterEmail, STUDENT2.password), 'Không đăng nhập được bằng email mới thêm')
    assert(await tryLogin(STUDENT2.phone, STUDENT2.password), 'Mất khả năng đăng nhập bằng số điện thoại')
  })

  await step('[Hệ thống] Quên mật khẩu: gửi mã 6 số qua email, chặn gửi lại liên tục', async () => {
    const ctx = await newContext({ ...devices['iPhone 13'] })
    const p = watch(await ctx.newPage(), 'quen-mk-2')
    STUDENT2.resetPage = p
    STUDENT2.resetCtx = ctx
    const before = Date.now()
    await p.goto(`${BASE}/forgot-password`)
    await p.fill('#identifier', STUDENT2.phone)
    await p.getByRole('button', { name: 'Gửi mã xác nhận' }).click()
    await p.getByRole('status').filter({ hasText: 'Đã gửi mã 6 số tới e2' }).waitFor()
    STUDENT2.code = await waitForResetCode(STUDENT2.laterEmail, before)
    const { data } = await db.from('password_resets').select('code_hash').eq('user_id', STUDENT2.id)
    assert(data.length === 1 && !data[0].code_hash.includes(STUDENT2.code), 'Mã phải được lưu dạng băm')
    await p.getByRole('button', { name: 'Gửi lại mã' }).click()
    await alertText(p, 'Vui lòng đợi')
  })

  await step('[Học viên] Nhập sai mã bị báo lỗi; nhập đúng mã + mật khẩu mới thì được đăng nhập', async () => {
    const p = STUDENT2.resetPage
    const wrong = STUDENT2.code === '000000' ? '111111' : '000000'
    await p.fill('#code', wrong)
    await p.fill('#password', 'QuenMk#2024')
    await p.fill('#confirmPassword', 'QuenMk#2024')
    await p.getByRole('button', { name: 'Đặt lại mật khẩu' }).click()
    await alertText(p, 'Mã không đúng. Bạn còn 4 lần thử')
    await p.fill('#code', STUDENT2.code)
    await p.fill('#password', 'QuenMk#2024')
    await p.fill('#confirmPassword', 'QuenMk#2024')
    await Promise.all([p.waitForURL(`${BASE}/courses`), p.getByRole('button', { name: 'Đặt lại mật khẩu' }).click()])
    await toast(p, 'Đặt lại mật khẩu thành công')
    await STUDENT2.resetCtx.close()
    assert(!(await tryLogin(STUDENT2.phone, STUDENT2.password)), 'Mật khẩu cũ vẫn đăng nhập được')
    STUDENT2.password = 'QuenMk#2024'
    assert(await tryLogin(STUDENT2.phone, STUDENT2.password), 'Mật khẩu mới không đăng nhập được')
    const { data } = await db.from('password_resets').select('used_at').eq('user_id', STUDENT2.id)
    assert(data.every((r) => r.used_at), 'Mã đã dùng chưa bị vô hiệu hóa')
  })

  // =====================================================================
  phase('9. ADMIN – quản lý sau khi duyệt')
  // =====================================================================
  await step('[Admin] Ẩn khóa A → biến mất khỏi ô chọn khóa học của form đăng ký; khách không đọc được', async () => {
    await admin.goto(`${BASE}/admin/courses`)
    const card = admin.locator('.card', { has: admin.getByRole('heading', { name: COURSE_A.title }) })
    await card.getByRole('button', { name: 'Ẩn khóa học' }).click()
    await toast(admin, 'Đã ẩn khóa học')
    await card.getByText('Đang ẩn').waitFor()
    const html = await (await fetch(`${BASE}/register`)).text()
    assert(!html.includes(COURSE_A.title), 'Form đăng ký vẫn hiện khóa đã ẩn')
    assert(html.includes(COURSE_B.title), 'Form đăng ký mất khóa đang mở')
    const { data } = await anon.from('courses').select('id').eq('id', created.courseIds.A)
    assert(data?.length === 0, 'Khách đọc được khóa đang ẩn!')
  })

  await step('[Học viên] Khóa A đang ẩn nhưng học viên đã được duyệt vẫn thấy khóa và xem được bài học', async () => {
    await student.goto(`${BASE}/courses`)
    await student.getByRole('link', { name: new RegExp(escape(COURSE_A.title)) }).click()
    await student.waitForURL(`${BASE}/courses/${created.courseIds.A}`)
    await student.getByRole('heading', { level: 1, name: COURSE_A.title }).waitFor()
    await student.getByRole('link', { name: 'Bắt đầu học' }).click()
    await student.getByRole('heading', { name: LESSON_TITLE }).waitFor()
    // Học viên chưa mua khóa A (học viên 2) vẫn không thấy khóa đang ẩn.
    // Đăng nhập lại: đặt lại mật khẩu ở bước trước đã thu hồi các phiên cũ của học viên 2.
    await login(student2, STUDENT2.phone, STUDENT2.password, `/courses/${created.courseIds.A}`)
    await student2.getByRole('heading', { name: 'Không tìm thấy trang' }).waitFor()
  })

  await step('[Admin] Đơn chờ duyệt của khóa đang ẩn vẫn duyệt được → học viên vào học được', async () => {
    // Đơn gửi trước khi khóa A bị ẩn (khách đã chuyển khoản); sau khi ẩn không tạo được đơn mới
    await insertRegistration({ user_id: STUDENT2.id, course_id: created.courseIds.A, full_name: STUDENT2.name, phone: STUDENT2.phone })
    await admin.goto(`${BASE}/admin`)
    const row = regCard(STUDENT2.phone, COURSE_A)
    await row.getByText('(khóa đang ẩn)').waitFor()
    await row.getByRole('button', { name: 'Duyệt' }).click()
    await toast(admin, 'Đã duyệt đơn')
    await row.waitFor({ state: 'detached' })
    await student2.goto(`${BASE}/courses/${created.courseIds.A}`)
    await student2.getByRole('heading', { level: 1, name: COURSE_A.title }).waitFor()
  })

  await step('[Hệ thống] Xóa tài khoản vẫn giữ đơn đăng ký; admin thấy "(tài khoản đã xóa)", không duyệt được', async () => {
    const name = `Tài Khoản Sẽ Xóa ${tail}`
    const { data, error } = await db.auth.admin.createUser({ email: `e2e-xoa-${stamp}@example.com`, password: 'Xoa#123456', email_confirm: true })
    assert(!error, error?.message)
    const id = await insertRegistration({ user_id: data.user.id, course_id: created.courseIds.A, full_name: name, phone: '0390000000', amount: 199000 })
    const { error: deleteError } = await db.auth.admin.deleteUser(data.user.id)
    assert(!deleteError, `Không xóa được tài khoản: ${deleteError?.message}`)
    const { data: reg } = await db.from('registrations').select('user_id, full_name, amount').eq('id', id).maybeSingle()
    assert(reg && reg.user_id === null && reg.full_name === name && reg.amount === 199000, `Đơn sau khi xóa tài khoản: ${JSON.stringify(reg)}`)

    await admin.goto(`${BASE}/admin`)
    const row = regTable().locator('tbody tr', { hasText: name })
    await row.getByText('(tài khoản đã xóa)').waitFor()
    assert((await row.getByRole('button', { name: 'Duyệt' }).count()) === 0, 'Vẫn có nút Duyệt cho tài khoản đã xóa')
  })

  await step('[Admin] Thu hồi quyền học khóa A → học viên không xem được nữa', async () => {
    await admin.goto(`${BASE}/admin?status=approved`)
    const card = regCard(STUDENT.email, COURSE_A)
    await rejectVia(card, 'Thu hồi')
    await toast(admin, 'Từ chối')
    await card.waitFor({ state: 'detached' })
    await student.goto(`${BASE}/courses/${created.courseIds.A}/${(await db.from('lessons').select('id').eq('course_id', created.courseIds.A).eq('title', LESSON_TITLE).single()).data.id}`)
    await student.getByText('Không tìm thấy bài học hoặc khóa học chưa được mở cho bạn').waitFor()
    await student.goto(`${BASE}/courses`)
    await student.getByRole('heading', { name: 'Khóa học đã mở' }).waitFor()
    assert((await student.getByRole('link', { name: new RegExp(escape(COURSE_A.title)) }).count()) === 0, 'Khóa A vẫn nằm trong khóa đã mở')
  })

  await step('[Admin] Xóa khóa B → đơn đăng ký và lịch sử thanh toán của khóa B vẫn được giữ', async () => {
    const before = await db.from('registrations').select('id').eq('course_id', created.courseIds.B)
    assert(before.data.length === 2, `Khóa B phải có 2 đơn, đang có ${before.data.length}`)
    await admin.goto(`${BASE}/admin/courses`)
    const card = admin.locator('.card', { has: admin.getByRole('heading', { name: COURSE_B.title }) })
    await card.getByText('Sửa thông tin').click()
    let dialogText = ''
    admin.once('dialog', (d) => { dialogText = d.message(); d.accept() })
    await card.getByRole('button', { name: 'Xóa khóa học' }).click()
    await toast(admin, 'Đã xóa khóa học')
    assert(dialogText.includes('lịch sử thanh toán vẫn được giữ lại'), `Hộp xác nhận: ${dialogText}`)
    await card.waitFor({ state: 'detached' })
    delete created.courseIds.B

    const { data: regs } = await db.from('registrations').select('id, course_id, course_title, amount, status').in('id', before.data.map((r) => r.id))
    assert(
      regs.length === 2 && regs.every((r) => r.course_id === null && r.course_title === COURSE_B.title && r.amount === Number(COURSE_B.price)),
      `Đơn khóa B sau khi xóa: ${JSON.stringify(regs)}`
    )

    // Bảng admin vẫn hiện đơn với tên khóa, học phí đã lưu; không còn nút Duyệt cho khóa đã xóa
    await admin.goto(`${BASE}/admin?status=all`)
    const row = regCard(STUDENT2.phone, COURSE_B)
    await row.getByText('(khóa học đã xóa)').waitFor()
    await row.getByText('299.000đ').waitFor()
    await row.getByText('Chờ duyệt', { exact: true }).waitFor()
    assert((await row.getByRole('button', { name: 'Duyệt' }).count()) === 0, 'Vẫn có nút Duyệt cho khóa đã xóa')
    await admin.goto(`${BASE}/admin/users?q=${STUDENT2.phone}`)
    await admin.locator('tr', { hasText: STUDENT2.phone }).locator('li', { hasText: COURSE_B.title }).getByText('(đã xóa)').waitFor()

    // Học viên vẫn thấy lịch sử đơn khóa B trong "Khóa học của tôi"
    await student.goto(`${BASE}/courses`)
    await student.locator('.card', { hasText: COURSE_B.title }).getByText('299.000đ').waitFor()
  })

  await step('[Admin] Đơn chờ duyệt của khóa đã xóa: tab "cần hoàn tiền", học viên được hướng dẫn liên hệ hoàn tiền', async () => {
    // Học viên 2 đã chuyển khoản khóa B (đang chờ duyệt) trước khi khóa bị xóa
    await student2.goto(`${BASE}/courses`)
    await student2.locator('.card', { hasText: COURSE_B.title }).getByText('Khóa học đã ngừng').waitFor()

    await admin.goto(`${BASE}/admin`)
    await admin.getByRole('link', { name: /^Khóa đã xóa – cần hoàn tiền/ }).click()
    await admin.waitForURL(/status=refund/)
    const row = regCard(STUDENT2.phone, COURSE_B)
    await row.getByText('(khóa học đã xóa)').waitFor()
    assert((await regTable().locator('tbody tr', { hasText: STUDENT.email }).count()) === 0, 'Tab hoàn tiền có đơn không thuộc diện')
    await rejectVia(row, 'Từ chối', 'Đã hoàn tiền qua chuyển khoản')
    await toast(admin, 'Từ chối')
    await student2.reload()
    await student2.locator('.card', { hasText: COURSE_B.title }).getByText('Lý do: Đã hoàn tiền qua chuyển khoản').waitFor()
  })

  await step('[Admin] Gỡ quyền admin 2 → admin 2 không vào được trang quản trị nữa; nhật ký ghi lại', async () => {
    await admin.goto(`${BASE}/admin/users?role=admin&q=${encodeURIComponent(ADMIN2.email)}`)
    const row = admin.locator('tr', { hasText: ADMIN2.email })
    let dialogText = ''
    admin.once('dialog', (d) => { dialogText = d.message(); d.accept() })
    await row.getByRole('button', { name: 'Gỡ quyền admin' }).click()
    await toast(admin, 'Đã gỡ quyền admin')
    assert(dialogText.includes('không vào được trang quản trị'), `Hộp xác nhận: ${dialogText}`)
    await admin2.goto(`${BASE}/admin`)
    assert(new URL(admin2.url()).pathname === '/courses', `Admin đã bị gỡ quyền vẫn vào được: ${admin2.url()}`)
    const { data: events } = await db.from('role_events').select('from_role, to_role, actor_name').eq('user_id', ADMIN2.id).order('created_at')
    assert(events.map((e) => `${e.from_role}>${e.to_role}`).join(',') === 'user>admin,admin>user', `Nhật ký phân quyền: ${JSON.stringify(events)}`)
  })

  // =====================================================================
  phase('10. HỆ THỐNG – bảo mật & chống lạm dụng')
  // =====================================================================
  await step('[Hệ thống] Header bảo mật: CSP, chống nhúng trang (clickjacking), nosniff, không lộ "X-Powered-By"', async () => {
    for (const path of ['/', '/login', '/register']) {
      const res = await fetch(`${BASE}${path}`)
      const csp = res.headers.get('content-security-policy') ?? ''
      assert(csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"), `${path}: CSP thiếu: ${csp}`)
      assert(res.headers.get('x-frame-options') === 'DENY', `${path}: thiếu X-Frame-Options`)
      assert(res.headers.get('x-content-type-options') === 'nosniff', `${path}: thiếu nosniff`)
      assert(res.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', `${path}: thiếu Referrer-Policy`)
      assert(!res.headers.get('x-powered-by'), `${path}: vẫn lộ X-Powered-By`)
    }
  })

  await step('[Hệ thống] Giới hạn tần suất trong database: vượt ngưỡng bị chặn; khách/học viên không gọi được hàm', async () => {
    const key = `e2e-test:${TEST_IP}`
    const hit = async (increment = true) =>
      (await db.rpc('hit_rate_limit', { p_key: key, p_limit: 2, p_window_seconds: 60, p_increment: increment })).data
    assert((await hit()) === true && (await hit()) === true, 'Chặn sớm hơn giới hạn')
    assert((await hit(false)) === false, 'Kiểm tra (không ghi) phải báo đã hết lượt')
    assert((await hit()) === false, 'Vượt giới hạn vẫn được cho qua')
    const { error } = await anon.rpc('hit_rate_limit', { p_key: key, p_limit: 99, p_window_seconds: 60 })
    assert(error, 'Khách gọi được hàm giới hạn tần suất!')
    const { data } = await anon.from('rate_limits').select('key')
    assert(!data?.length, 'Khách đọc được bảng rate_limits!')
  })

  await step('[Khách] Đăng nhập sai 5 lần liên tiếp → bị khóa tạm 15 phút (kể cả tài khoản không tồn tại)', async () => {
    const ctx = await newContext({}, `${TEST_IP}-khoa`)
    const p = watch(await ctx.newPage(), 'khoa-dang-nhap')
    const phone = `0399${tail.slice(-6)}`
    const attempt = async () => {
      await p.goto(`${BASE}/login`)
      await p.fill('#identifier', phone)
      await p.fill('#password', 'sai-mat-khau')
      await Promise.all([p.waitForURL(/error=/), p.click('button[type=submit]')])
    }
    for (let i = 0; i < 5; i++) {
      await attempt()
      await p.getByText('Email/số điện thoại hoặc mật khẩu không đúng.').waitFor()
    }
    await attempt()
    await p.getByText('Bạn đã nhập sai quá nhiều lần').waitFor()
    await ctx.close()
    // IP khác (người dùng khác) không bị ảnh hưởng
    assert(await tryLogin(STUDENT.email, STUDENT.password), 'Khóa đăng nhập ảnh hưởng người dùng khác')
  })

  // =====================================================================
  phase('11. HỆ THỐNG – tổng kết')
  // =====================================================================
  await step('[Hệ thống] Chụp màn hình giao diện máy tính', async () => {
    const ctx = await newContext({ viewport: { width: 1366, height: 900 } })
    const p = watch(await ctx.newPage(), 'desktop')
    await p.goto(BASE)
    await p.screenshot({ path: `${OUT}desktop-home.png`, fullPage: true })
    await p.goto(`${BASE}/register`)
    await p.screenshot({ path: `${OUT}desktop-register.png`, fullPage: true })
    await ctx.close()
  })

  await step('[Hệ thống] Không có lỗi JavaScript trên mọi trình duyệt đã dùng', async () => {
    if (thirdPartyErrors.length) console.log(`      (bỏ qua ${thirdPartyErrors.length} lỗi trong iframe bên thứ ba, VD YouTube)`)
    if (pageErrors.length) console.log(pageErrors.map((e) => `      ${e}`).join('\n'))
    assert(pageErrors.length === 0, `${pageErrors.length} lỗi JavaScript (chi tiết ở trên)`)
  })
} catch {
  failed = true
  // Dừng giữa chừng: vẫn in các lỗi JavaScript đã ghi nhận để dễ tìm nguyên nhân
  if (pageErrors.length) console.log(`\nLỗi JavaScript đã ghi nhận:\n${pageErrors.map((e) => `  ${e}`).join('\n')}`)
} finally {
  await browser.close()
  await cleanup()
  server.kill()
  const passed = results.filter((r) => r.ok).length
  console.log(`\n${passed}/${results.length} bước thành công${failed ? ' (dừng ở bước lỗi)' : ''}. Đã dọn dữ liệu test.`)
  console.log('Ảnh chụp màn hình: test-results/\n')
  process.exit(failed ? 1 : 0)
}
