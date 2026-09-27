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
//   [Nhân viên] vai trò staff: duyệt đơn, xem học viên; không sửa khóa học, không phân quyền
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
const COURSE_A = { title: `[E2E] Khóa A – Trị liệu cột sống ${stamp}`, price: '199000', status: 'published', category: 'veo_lung' }
const COURSE_B = { title: `[E2E] Khóa B – Cổ vai gáy ${stamp}`, price: '299000', status: 'published', category: 'veo_nguc' }
const COURSE_HIDDEN = { title: `[E2E] Khóa C – Đang ẩn ${stamp}`, price: '99000', status: 'draft' }
const LESSON_TITLE = 'Bài 1: Giải phẫu cột sống cơ bản'
// v0.2 – Đợt 8: khóa miễn phí (ai cũng xem) và khóa premium (chỉ liên hệ Zalo), có ảnh bìa
const COURSE_FREE = { title: `[E2E] Miễn phí – Bài tập thở ${stamp}`, price: '0', status: 'published', kind: 'free', summary: 'Tập thở cơ hoành 10 phút mỗi ngày' }
const COURSE_PREMIUM = {
  title: `[E2E] Premium 1:1 cùng bác sĩ ${stamp}`, price: '5000000', status: 'published', kind: 'premium',
  summary: 'Kèm riêng 1:1', outcomes: 'Lộ trình riêng\nBác sĩ theo dõi sát', cover: true,
}
const FREE_LESSON_TITLE = 'Bài 1: Thở cơ hoành'
// v0.2 – Đợt 9: chương trình bán theo gói tháng, bệnh nhân gia hạn (không có email)
const COURSE_PLAN = { title: `[E2E] Chương trình gói tháng ${stamp}`, price: '300000', status: 'published', category: 'veo_lung' }
const PLAN3_PRICE = 800000
// v0.2 – Đợt 10: chương trình tạo kèm khung 3 buổi × 2 bài, gói 1 tháng chỉ mở 2 buổi
const COURSE_SEQ = { title: `[E2E] Chương trình buổi tập ${stamp}`, price: '250000', status: 'published', category: 'veo_nguc', sessions: '3', lessonsPerSession: '2' }
const RENEW = { phone: `03${tail}`, password: 'Giahan#123', name: 'Bệnh Nhân Gia Hạn' }
// Cộng số tháng theo lịch (giống make_interval(months => n) của Postgres)
const addMonths = (iso, n) => {
  const d = new Date(iso)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.getTime()
}
const LEAD = { name: 'Khách Premium E2E', phone: `07${tail}` }
const LEGACY_LESSON_TITLE = 'Bài 9: Link video cũ không hợp lệ'
const LEGACY_LESSON = {}
const REJECT_NOTE = 'Ảnh chuyển khoản bị mờ, không đọc được số tiền'
// Admin thứ 2 (quyền ngang nhau) được admin 1 cấp quyền trên giao diện
const ADMIN2 = { email: `e2e-admin2-${stamp}@example.com`, password: 'Admin2#123456', name: 'Admin Hai E2E' }
const RACE = {} // đơn dùng cho kịch bản 2 admin cùng xử lý
// Nhân viên (vai trò staff, v0.2) được admin chuyển vai trò trên giao diện
const STAFF = { email: `e2e-staff-${stamp}@example.com`, password: 'Staff#123456', name: 'Nhân Viên E2E' }

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
  if (course.kind) await form.locator('[name=kind]').selectOption(course.kind)
  if (course.category) await form.locator('[name=category]').selectOption(course.category)
  if (course.summary) await form.locator('[name=summary]').fill(course.summary)
  if (course.outcomes) await form.locator('[name=outcomes]').fill(course.outcomes)
  if (course.sessions) {
    await form.locator('[name=session_count]').fill(course.sessions)
    await form.locator('[name=lessons_per_session]').fill(course.lessonsPerSession)
  }
  if (course.cover) {
    await form.locator('[name=cover]').setInputFiles(LARGE_IMAGE)
    await form.getByTestId('cover-size').waitFor({ timeout: 20000 })
  }
  await form.getByRole('button', { name: 'Thêm khóa học' }).click()
  await toast(page, 'Đã thêm khóa học')
  await page.getByRole('heading', { name: course.title }).waitFor()
  assert((await form.locator('[name=title]').inputValue()) === '', 'Form thêm khóa học không được xóa trắng')
  const { data } = await db.from('courses').select('id, price, status, kind, category, cover_image').eq('title', course.title).single()
  assert(
    data?.price === Number(course.price) && data.status === course.status && data.kind === (course.kind ?? 'program') &&
      data.category === (course.category ?? null),
    `Dữ liệu khóa học sai: ${JSON.stringify(data)}`
  )
  assert(!course.cover || data.cover_image?.includes('/course-covers/'), `Ảnh bìa chưa lưu: ${data.cover_image}`)
  return data.id
}

// Admin đổi vai trò tài khoản ở trang Học viên (ô chọn vai trò + xác nhận), trả về nội dung hộp xác nhận
async function setRoleViaUI(page, email, role, message) {
  await page.goto(`${BASE}/admin/users?q=${encodeURIComponent(email)}`)
  const row = page.locator('tr', { hasText: email })
  await row.locator('select[name=role]').selectOption(role)
  let dialogText = ''
  page.once('dialog', (d) => { dialogText = d.message(); d.accept() })
  await row.getByRole('button', { name: 'Lưu vai trò' }).click()
  await toast(page, message)
  return dialogText
}

// Điền Bước 3 của form đăng ký (khách chưa đăng nhập)
async function fillGuestForm(page, { name, email, phone, password, courseId, image }) {
  await page.fill('#fullName', name)
  await page.fill('#email', email ?? '')
  await page.fill('#phone', phone)
  await page.fill('#password', password)
  if (courseId) await page.selectOption('#courseId', courseId)
  if (image) await page.setInputFiles('#paymentProof', image)
  await page.check('#consent')
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
  // Khách quan tâm của khóa premium test (khóa bị xóa thì course_id về null nên xóa trước)
  const courseIds = Object.values(created.courseIds)
  if (courseIds.length) await db.from('leads').delete().in('course_id', courseIds)
  await db.from('leads').delete().eq('phone', LEAD.phone)
  // Ảnh bìa của khóa test
  if (courseIds.length) {
    const { data: covers } = await db.from('courses').select('cover_image').in('id', courseIds).not('cover_image', 'is', null)
    const paths = (covers ?? []).map((c) => c.cover_image.split('/course-covers/')[1]).filter(Boolean)
    if (paths.length) await db.storage.from('course-covers').remove(paths)
  }
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
    // v0.2 – Đợt 7: vai trò staff
    // v0.2 – Đợt 8: loại khóa, khách quan tâm, đồng ý chính sách, bucket ảnh bìa
    const { error: kindError } = await db.from('courses').select('kind, category, summary, outcomes', { head: true })
    assert(!kindError, `Bảng courses thiếu cột loại khóa: ${kindError?.message} (hãy chạy lại supabase/schema.sql)`)
    const { error: leadsError } = await db.from('leads').select('*', { head: true })
    assert(!leadsError, `Thiếu bảng leads: ${leadsError?.message}`)
    const { error: consentError } = await db.from('profiles').select('consent_at, consent_version', { head: true })
    assert(!consentError, `Bảng profiles thiếu cột consent_at: ${consentError?.message}`)
    const { error: coverBucketError } = await db.storage.getBucket('course-covers')
    assert(!coverBucketError, `Bucket course-covers: ${coverBucketError?.message}`)
    // v0.2 – Đợt 9: gói theo thời hạn, hạn học trên đơn
    const { error: plansError } = await db.from('course_plans').select('*', { head: true })
    assert(!plansError, `Thiếu bảng course_plans: ${plansError?.message} (hãy chạy lại supabase/schema.sql)`)
    const { error: accessError } = await db.from('registrations').select('plan_id, plan_months, plan_sessions, source, payment_method, access_until', { head: true })
    assert(!accessError, `Bảng registrations thiếu cột gói / hạn học: ${accessError?.message}`)
    // v0.2 – Đợt 10: buổi tập, tiến độ
    for (const t of ['course_sessions', 'lesson_progress']) {
      const { error: tableError } = await db.from(t).select('*', { head: true })
      assert(!tableError, `Thiếu bảng ${t}: ${tableError?.message} (hãy chạy lại supabase/schema.sql)`)
    }
    const { error: staffFnError } = await db.rpc('is_staff')
    assert(!staffFnError, `Thiếu hàm is_staff: ${staffFnError?.message} (hãy chạy lại supabase/schema.sql)`)
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

  await step('[Admin] Cấp quyền admin cho tài khoản thứ 2 trên giao diện; tab "Nhân viên & Admin" ghi người cấp; không tự đổi quyền mình', async () => {
    const { data, error } = await db.auth.admin.createUser({
      email: ADMIN2.email, password: ADMIN2.password, email_confirm: true, user_metadata: { full_name: ADMIN2.name },
    })
    assert(!error, error?.message)
    ADMIN2.id = data.user.id
    created.userIds.push(ADMIN2.id)

    await setRoleViaUI(admin, ADMIN2.email, 'admin', 'Đã cấp quyền admin')
    const { data: profile } = await db.from('profiles').select('role').eq('id', ADMIN2.id).single()
    assert(profile.role === 'admin', `Quyền chưa đổi: ${profile.role}`)
    const { data: events } = await db.from('role_events').select('actor, actor_name, from_role, to_role').eq('user_id', ADMIN2.id)
    assert(
      events.length === 1 && events[0].actor === ADMIN.id && events[0].actor_name === 'Admin E2E' && events[0].to_role === 'admin',
      `Nhật ký phân quyền sai: ${JSON.stringify(events)}`
    )

    // Tab "Nhân viên & Admin": có cả 2 admin test, ghi "Cấp quyền bởi Admin E2E"; dòng của chính mình không có ô đổi vai trò
    await admin.goto(`${BASE}/admin/users?role=team&q=e2e-admin`)
    await admin.getByRole('link', { name: /^Nhân viên & Admin \(\d+\)/ }).and(admin.locator('[aria-current=page]')).waitFor()
    await admin.locator('tr', { hasText: ADMIN2.email }).getByText('Cấp quyền bởi Admin E2E').waitFor()
    const me = admin.locator('tr', { hasText: ADMIN.email })
    await me.getByText('Tài khoản của bạn').waitFor()
    assert((await me.getByRole('button').count()) === 0 && (await me.locator('select').count()) === 0, 'Dòng của chính mình vẫn đổi được vai trò')

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

  await step('[Admin] Tạo khóa miễn phí (có bài học) và khóa premium có ảnh bìa; khách không tải được ảnh bìa lên', async () => {
    created.courseIds.free = await createCourseViaUI(admin, COURSE_FREE)
    created.courseIds.premium = await createCourseViaUI(admin, COURSE_PREMIUM)
    const { data: cover } = await db.from('courses').select('cover_image').eq('id', created.courseIds.premium).single()
    const res = await fetch(cover.cover_image)
    assert(res.ok && res.headers.get('content-type')?.startsWith('image/'), `Ảnh bìa không mở được công khai: ${res.status}`)
    // Khóa premium không có trang quản lý bài học
    const card = admin.locator('.card', { has: admin.getByRole('heading', { name: COURSE_PREMIUM.title }) })
    await card.getByText('không có bài học').waitFor()
    assert((await card.getByRole('link', { name: 'Quản lý buổi – bài' }).count()) === 0, 'Khóa premium vẫn có nút Quản lý bài học')

    await admin.goto(`${BASE}/admin/courses/${created.courseIds.free}`)
    const form = admin.locator('section', { has: admin.getByRole('heading', { name: 'Thêm bài học' }) })
    await form.locator('[name=title]').fill(FREE_LESSON_TITLE)
    await form.locator('[name=video_url]').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await form.getByRole('button', { name: 'Thêm bài học' }).click()
    await toast(admin, 'Đã thêm bài học')

    const { error: uploadError } = await anon.storage.from('course-covers').upload(`e2e-${stamp}.png`, readFileSync(SMALL_IMAGE), { contentType: 'image/jpeg' })
    assert(uploadError, 'Khách tải được ảnh bìa lên!')
  })

  await step('[Hệ thống] RLS: khách chỉ thấy khóa đang mở; không thấy khóa ẩn, bài học, đơn đăng ký', async () => {
    const { data: courses } = await anon.from('courses').select('id').in('id', Object.values(created.courseIds))
    const visible = courses.map((c) => c.id)
    assert(visible.includes(created.courseIds.A) && visible.includes(created.courseIds.B), 'Khách không thấy khóa đang mở')
    assert(!visible.includes(created.courseIds.hidden), 'Khách thấy khóa đang ẩn!')
    const { data: lessons } = await anon.from('lessons').select('id').eq('course_id', created.courseIds.A)
    assert(lessons?.length === 0, 'Khách xem được bài học!')
    // Khóa miễn phí: khách xem được bài học. Đề cương công khai của khóa trả phí không có link video.
    const { data: freeLessons } = await anon.from('lessons').select('id, video_url').eq('course_id', created.courseIds.free)
    assert(freeLessons?.length === 1, `Khách không xem được bài của khóa miễn phí: ${freeLessons?.length}`)
    const { data: outline } = await anon.rpc('course_outline', { target_course: created.courseIds.A })
    assert(outline?.length >= 1 && outline.every((l) => !('video_url' in l)), `Đề cương công khai sai: ${JSON.stringify(outline)}`)
    const { data: hiddenOutline } = await anon.rpc('course_outline', { target_course: created.courseIds.hidden })
    assert(!hiddenOutline?.length, 'Khách xem được đề cương khóa đang ẩn!')
    const { data: anonLeads } = await anon.from('leads').select('id')
    assert(!anonLeads?.length, 'Khách đọc được danh sách khách quan tâm!')
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

  await step('[Khách] Trang chủ chia 3 nhóm: Miễn phí, Chương trình (lọc vẹo lưng / vẹo ngực), Premium', async () => {
    const group = (id) => guest2.locator(id)
    await guest2.goto(BASE)
    await group('#mien-phi').getByRole('heading', { name: COURSE_FREE.title }).waitFor()
    await group('#premium').getByRole('heading', { name: COURSE_PREMIUM.title }).waitFor()
    const programs = group('#khoa-hoc')
    await programs.getByRole('heading', { name: COURSE_A.title }).waitFor()
    assert((await programs.getByRole('heading', { name: COURSE_FREE.title }).count()) === 0, 'Khóa miễn phí lẫn vào nhóm chương trình')
    await programs.getByRole('button', { name: 'Vẹo ngực' }).click()
    await programs.getByRole('heading', { name: COURSE_B.title }).waitFor()
    assert((await programs.getByRole('heading', { name: COURSE_A.title }).count()) === 0, 'Lọc Vẹo ngực vẫn hiện khóa Vẹo lưng')
    await programs.getByRole('button', { name: 'Tất cả' }).click()
    await programs.getByRole('heading', { name: COURSE_A.title }).waitFor()
    await guest2.screenshot({ path: `${OUT}desktop-home-v02.png`, fullPage: true })
  })

  await step('[Khách] Trang giới thiệu khóa: đề cương không lộ link video; khóa miễn phí học ngay không cần đăng nhập', async () => {
    const html = await (await fetch(`${BASE}/khoa-hoc/${created.courseIds.A}`)).text()
    assert(html.includes(LESSON_TITLE) && !html.includes('dQw4w9WgXcQ'), 'Trang giới thiệu thiếu đề cương hoặc lộ link video')
    await guest2.goto(`${BASE}/khoa-hoc/${created.courseIds.free}`)
    await guest2.getByRole('heading', { level: 1, name: COURSE_FREE.title }).waitFor()
    await guest2.getByRole('link', { name: 'Bắt đầu học ngay' }).click()
    await guest2.getByRole('heading', { name: FREE_LESSON_TITLE }).waitFor()
    await guest2.locator('iframe[src*="youtube.com/embed/dQw4w9WgXcQ"]').waitFor({ state: 'attached' })
    // Khóa trả phí: khách mở bài học bị chuyển tới đăng nhập
    const lessonA = (await db.from('lessons').select('id').eq('course_id', created.courseIds.A).eq('title', LESSON_TITLE).single()).data.id
    // Trang tự chuyển hướng (redirect trong server component được thực hiện phía trình duyệt): chờ URL cuối
    for (const path of [`/courses/${created.courseIds.A}/${lessonA}`, `/courses/${created.courseIds.A}`]) {
      await guest2.goto(`${BASE}${path}`)
      await guest2.waitForURL(/\/login\?next=/).catch(() => {})
      const url = new URL(guest2.url())
      assert(url.pathname === '/login' && url.searchParams.get('next') === path, `Khách mở khóa trả phí: ${guest2.url()}`)
    }
  })

  await step('[Khách] Khóa premium: để lại họ tên + SĐT → lưu khách quan tâm và mở Zalo; "Mở Zalo ngay" lưu lượt bấm ẩn danh', async () => {
    await guest2.goto(`${BASE}/khoa-hoc/${created.courseIds.premium}`)
    await guest2.getByText('Lộ trình riêng', { exact: true }).waitFor()
    assert((await guest2.getByRole('list', { name: 'Đề cương khóa học' }).count()) === 0, 'Khóa premium có đề cương')
    await guest2.getByRole('button', { name: 'Liên hệ Zalo nhận ưu đãi' }).click()
    const form = guest2.getByRole('form', { name: 'Liên hệ Zalo nhận ưu đãi' })
    await form.getByRole('button', { name: 'Gửi & mở Zalo' }).click()
    await form.getByRole('alert').filter({ hasText: 'Vui lòng nhập họ và tên' }).waitFor()
    await form.getByLabel('Họ và tên').fill(LEAD.name)
    await form.getByLabel('Số điện thoại').fill(LEAD.phone)
    const [popup] = await Promise.all([guest2Ctx.waitForEvent('page'), form.getByRole('button', { name: 'Gửi & mở Zalo' }).click()])
    await popup.waitForURL(/zalo\.me/, { waitUntil: 'commit' }).catch(() => {})
    assert(popup.url().includes('zalo.me'), `Không mở Zalo: ${popup.url()}`)
    await popup.close()
    await toast(guest2, 'Đã gửi thông tin')
    const { data: leads } = await db.from('leads').select('full_name, phone, status, course_title').eq('course_id', created.courseIds.premium)
    assert(
      leads.length === 1 && leads[0].phone === LEAD.phone && leads[0].status === 'new' && leads[0].course_title === COURSE_PREMIUM.title,
      `Khách quan tâm: ${JSON.stringify(leads)}`
    )

    await guest2.reload()
    await guest2.getByRole('button', { name: 'Liên hệ Zalo nhận ưu đãi' }).click()
    const [popup2] = await Promise.all([guest2Ctx.waitForEvent('page'), guest2.getByRole('link', { name: 'Mở Zalo ngay' }).click()])
    await popup2.close()
    for (let i = 0; i < 20; i++) {
      const { count } = await db.from('leads').select('id', { count: 'exact', head: true }).eq('course_id', created.courseIds.premium).is('phone', null)
      if (count === 1) break
      assert(i < 19, 'Lượt bấm "Mở Zalo ngay" chưa được lưu')
      await new Promise((r) => setTimeout(r, 250))
    }
  })

  await step('[Khách] Chính sách bảo mật: có trang riêng; không tick đồng ý thì server từ chối tạo tài khoản', async () => {
    await guest2.goto(`${BASE}/chinh-sach-bao-mat`)
    await guest2.getByRole('heading', { level: 1, name: 'Chính sách bảo mật' }).waitFor()
    await guest2.getByRole('heading', { name: /Dữ liệu sức khỏe|dữ liệu nào/ }).first().waitFor()
    await guest2.goto(`${BASE}/register?course=${created.courseIds.B}`)
    const consentLink = guest2.locator('label[for=consent]').getByRole('link', { name: 'Chính sách bảo mật' })
    assert((await consentLink.getAttribute('href')) === '/chinh-sach-bao-mat', 'Ô đồng ý thiếu link chính sách')
    await fillGuestForm(guest2, { ...STUDENT2, email: '', image: SMALL_IMAGE })
    await guest2.uncheck('#consent')
    await guest2.locator('form', { has: guest2.locator('#paymentProof') }).evaluate((f) => (f.noValidate = true))
    await registerButton(guest2).click()
    await alertText(guest2, 'Vui lòng đồng ý Chính sách bảo mật')
    const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('phone', STUDENT2.phone)
    assert(count === 0, 'Vẫn tạo tài khoản khi chưa đồng ý chính sách')
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
    assert(!options.some((o) => o.includes(COURSE_FREE.title) || o.includes(COURSE_PREMIUM.title)), 'Khóa miễn phí / premium xuất hiện trong ô đăng ký!')
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
    const { data: profile } = await db.from('profiles').select('full_name, phone, email, role, consent_at, consent_version').eq('id', reg.user_id).single()
    assert(
      profile?.full_name === STUDENT.name && profile.phone === STUDENT.phone && profile.email === STUDENT.email && profile.role === 'user',
      `Profile sai: ${JSON.stringify(profile)}`
    )
    assert(profile.consent_at && profile.consent_version, `Chưa lưu đồng ý chính sách: ${JSON.stringify(profile)}`)
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
    await student.goto(`${BASE}/admin/registrations`)
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
  const REG_COLUMNS = ['STT', 'Ảnh chuyển khoản', 'Họ và tên', 'Email', 'Số điện thoại', 'Khóa học', 'Gói', 'Học phí', 'Ngày đăng ký', 'Trạng thái', 'Hạn học', 'Ngày xử lý', 'Người xử lý', 'Thao tác']
  const col = (name) => REG_COLUMNS.indexOf(name)
  // Nút "Từ chối" / "Thu hồi" mở ô nhập lý do, bấm "Xác nhận …" mới gửi
  const rejectToggle = (row, label) => row.locator('summary', { hasText: label })
  async function rejectVia(row, label, note = '') {
    await rejectToggle(row, label).click()
    if (note) await row.locator('textarea[name=note]').fill(note)
    await row.getByRole('button', { name: `Xác nhận ${label.toLowerCase()}` }).click()
  }

  await step('[Admin] Đơn đăng ký hiển thị dạng bảng với đủ cột ở cả 4 tab', async () => {
    for (const tab of ['Tất cả', 'Từ chối', 'Đã duyệt', 'Chờ duyệt']) {
      await admin.goto(`${BASE}/admin/registrations`)
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
    await admin.goto(`${BASE}/admin/registrations`)
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
    await admin.goto(`${BASE}/admin/registrations?status=approved`)
    let row = regCard(STUDENT.email, COURSE_A)
    await row.getByText('Đã duyệt', { exact: true }).waitFor()
    assert(/\d{2}\/\d{2}\/\d{4}/.test(await row.locator('td').nth(col('Ngày xử lý')).textContent()), 'Thiếu ngày xử lý')
    assert((await row.locator('td').nth(col('Người xử lý')).textContent()).trim() === 'Admin E2E', 'Thiếu người xử lý')
    // Gói 1 tháng lúc đăng ký, hạn học ≈ 1 tháng sau khi duyệt
    assert((await row.locator('td').nth(col('Gói')).textContent()).includes('1 tháng'), 'Thiếu gói trong bảng đơn')
    assert(/\d{2}\/\d{2}\/\d{4}/.test(await row.locator('td').nth(col('Hạn học')).textContent()), 'Thiếu hạn học')
    await rejectToggle(row, 'Thu hồi').waitFor()
    assert((await row.getByRole('button', { name: 'Duyệt' }).count()) === 0, 'Đơn đã duyệt vẫn có nút Duyệt')

    await admin.goto(`${BASE}/admin/registrations?status=rejected`)
    row = regCard(STUDENT.email, COURSE_B)
    await row.getByText('Từ chối', { exact: true }).waitFor()
    // Lý do hiện dưới trạng thái (bản thứ 2 nằm trong "Lịch sử" đang thu gọn)
    await row.getByText(`Lý do: ${REJECT_NOTE}`).first().waitFor()
    await row.getByRole('button', { name: 'Duyệt' }).waitFor()
    assert((await rejectToggle(row, 'Từ chối').count()) === 0, 'Đơn bị từ chối vẫn có nút Từ chối')

    await admin.goto(`${BASE}/admin/registrations?status=all`)
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
    await Promise.all([admin.goto(`${BASE}/admin/registrations`), admin2.goto(`${BASE}/admin/registrations`)])
    const row1 = regCard(STUDENT2.phone, COURSE_HIDDEN)
    const row2 = admin2.getByRole('table', { name: 'Danh sách đơn đăng ký' }).locator('tbody tr', { hasText: COURSE_HIDDEN.title })
    await row2.getByRole('button', { name: 'Duyệt' }).click()
    await toast(admin2, 'Đã duyệt đơn')
    await rejectVia(row1, 'Từ chối', 'Bấm từ trang cũ')
    await alertText(admin, 'Đơn đã thay đổi (có thể người khác vừa xử lý)')
    const { data } = await db.from('registrations').select('status, reviewed_by, reviewed_by_name, review_note').eq('id', RACE.id).single()
    assert(
      data.status === 'approved' && data.reviewed_by === ADMIN2.id && data.reviewed_by_name === ADMIN2.name && !data.review_note,
      `Đơn bị ghi đè: ${JSON.stringify(data)}`
    )
  })

  await step('[Admin] Lịch sử xử lý đơn: Duyệt (admin 2) → Thu hồi kèm lý do (admin 1) → Duyệt lại (admin 1) đủ 3 dòng đúng người', async () => {
    await admin.goto(`${BASE}/admin/registrations?status=approved`)
    let row = regCard(STUDENT2.phone, COURSE_HIDDEN)
    await rejectVia(row, 'Thu hồi', 'Chuyển khoản chưa về tài khoản')
    await toast(admin, 'Từ chối')
    await admin.goto(`${BASE}/admin/registrations?status=rejected`)
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
    await admin.goto(`${BASE}/admin/registrations?status=approved`)
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
    await admin.goto(`${BASE}/admin/registrations`)
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

    await admin.goto(`${BASE}/admin/registrations`)
    const row = regTable().locator('tbody tr', { hasText: name })
    await row.getByText('(tài khoản đã xóa)').waitFor()
    assert((await row.getByRole('button', { name: 'Duyệt' }).count()) === 0, 'Vẫn có nút Duyệt cho tài khoản đã xóa')
  })

  await step('[Admin] Thu hồi quyền học khóa A → học viên không xem được nữa', async () => {
    await admin.goto(`${BASE}/admin/registrations?status=approved`)
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
    await admin.goto(`${BASE}/admin/registrations?status=all`)
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

    await admin.goto(`${BASE}/admin/registrations`)
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
    const dialogText = await setRoleViaUI(admin, ADMIN2.email, 'user', 'Đã chuyển vai trò thành Học viên')
    assert(dialogText.includes('không vào được trang quản trị'), `Hộp xác nhận: ${dialogText}`)
    await admin2.goto(`${BASE}/admin`)
    assert(new URL(admin2.url()).pathname === '/courses', `Admin đã bị gỡ quyền vẫn vào được: ${admin2.url()}`)
    // Tài khoản học viên chưa đồng ý Chính sách bảo mật: hộp hỏi đồng ý hiện một lần
    const dialog = admin2.getByRole('dialog', { name: 'Chính sách bảo mật' })
    await dialog.getByRole('button', { name: 'Tôi đồng ý' }).click()
    await toast(admin2, 'Cảm ơn bạn đã đồng ý')
    await dialog.waitFor({ state: 'detached' })
    const { data: consent } = await db.from('profiles').select('consent_at').eq('id', ADMIN2.id).single()
    assert(consent.consent_at, 'Chưa lưu đồng ý chính sách của tài khoản cũ')
    const { data: events } = await db.from('role_events').select('from_role, to_role, actor_name').eq('user_id', ADMIN2.id).order('created_at')
    assert(events.map((e) => `${e.from_role}>${e.to_role}`).join(',') === 'user>admin,admin>user', `Nhật ký phân quyền: ${JSON.stringify(events)}`)
  })

  // =====================================================================
  phase('9b. NHÂN VIÊN – vai trò staff (v0.2, Đợt 7)')
  // =====================================================================
  const staffCtx = await newContext({ viewport: { width: 1366, height: 900 } })
  const staff = watch(await staffCtx.newPage(), 'nhan-vien')

  await step('[Admin] Chuyển tài khoản sang vai trò "Nhân viên"; nhân viên không tự đổi vai trò / sửa khóa học / sửa tài khoản admin qua API', async () => {
    const { data, error } = await db.auth.admin.createUser({
      email: STAFF.email, password: STAFF.password, email_confirm: true, user_metadata: { full_name: STAFF.name },
    })
    assert(!error, error?.message)
    STAFF.id = data.user.id
    created.userIds.push(STAFF.id)

    await setRoleViaUI(admin, STAFF.email, 'staff', 'Đã chuyển vai trò thành Nhân viên')
    await admin.locator('tr', { hasText: STAFF.email }).locator('.badge', { hasText: 'Nhân viên' }).waitFor()
    const { data: events } = await db.from('role_events').select('actor, from_role, to_role').eq('user_id', STAFF.id)
    assert(events.length === 1 && events[0].actor === ADMIN.id && events[0].to_role === 'staff', `Nhật ký phân quyền: ${JSON.stringify(events)}`)

    STAFF.session = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { error: loginError } = await STAFF.session.auth.signInWithPassword({ email: STAFF.email, password: STAFF.password })
    assert(!loginError, loginError?.message)
    // Dòng của nhân viên không nằm trong phạm vi sửa (chỉ tài khoản học viên) → không dòng nào bị đổi
    const { data: selfRows } = await STAFF.session.from('profiles').update({ role: 'admin' }).eq('id', STAFF.id).select('id')
    assert(!selfRows?.length, 'Nhân viên tự nâng quyền admin được!')
    // Tài khoản học viên sửa được thông tin nhưng không đổi được vai trò (trigger guard_role_change)
    const { error: promoteError } = await STAFF.session.from('profiles').update({ role: 'staff' }).eq('id', STUDENT.id)
    assert(promoteError?.message.includes('Chỉ admin'), `Nhân viên cấp quyền cho học viên được: ${promoteError?.message ?? 'không lỗi'}`)
    const { data: adminRows } = await STAFF.session.from('profiles').update({ full_name: 'Bị sửa' }).eq('id', ADMIN.id).select('id')
    assert(!adminRows?.length, 'Nhân viên sửa được tài khoản admin!')
    const { data: courseRows } = await STAFF.session.from('courses').update({ title: 'Bị sửa' }).eq('id', created.courseIds.hidden).select('id')
    assert(!courseRows?.length, 'Nhân viên sửa được khóa học!')
    const { error: coverError } = await STAFF.session.storage.from('course-covers').upload(`e2e-staff-${stamp}.jpg`, readFileSync(SMALL_IMAGE), { contentType: 'image/jpeg' })
    assert(coverError, 'Nhân viên tải được ảnh bìa lên!')
    const { data: profiles } = await db.from('profiles').select('id, role, full_name').in('id', [STAFF.id, STUDENT.id, ADMIN.id])
    const byId = Object.fromEntries(profiles.map((p) => [p.id, p]))
    assert(byId[STAFF.id].role === 'staff' && byId[STUDENT.id].role === 'user' && byId[ADMIN.id].full_name === 'Admin E2E', `Dữ liệu bị đổi: ${JSON.stringify(profiles)}`)
    // Nhân viên đọc được đơn đăng ký và lịch sử xử lý (cần để duyệt đơn)
    const { data: regs } = await STAFF.session.from('registrations').select('id').eq('user_id', STUDENT.id)
    assert(regs?.length >= 2, `Nhân viên không đọc được đơn: ${regs?.length}`)
  })

  await step('[Nhân viên] Vào trang quản trị: chỉ có Đơn đăng ký, Học viên; trang Khóa học bị chặn; không đổi được vai trò', async () => {
    await login(staff, STAFF.email, STAFF.password, '/admin')
    await staff.waitForURL(`${BASE}/admin/registrations`)
    await staff.getByRole('heading', { name: 'Bảng quản trị' }).waitFor()
    await staff.getByRole('link', { name: 'Quản trị', exact: true }).waitFor()
    const nav = staff.getByRole('navigation', { name: 'Menu quản trị' })
    const tabs = (await nav.getByRole('link').allTextContents()).map((t) => t.trim())
    assert(JSON.stringify(tabs) === JSON.stringify(['Đơn đăng ký', 'Học viên', 'Khách quan tâm']), `Menu của nhân viên: ${tabs}`)
    // Middleware chuyển về /admin, trang /admin chuyển tiếp tới /admin/registrations
    await staff.goto(`${BASE}/admin/courses`)
    await staff.waitForURL(`${BASE}/admin/registrations`).catch(() => {})
    assert(new URL(staff.url()).pathname === '/admin/registrations', `Nhân viên vào được trang khóa học: ${staff.url()}`)
    await staff.getByRole('table', { name: 'Danh sách đơn đăng ký' }).waitFor()
    await staff.goto(`${BASE}/admin/users?q=${encodeURIComponent(STUDENT.email)}`)
    await staff.locator('tr', { hasText: STUDENT.email }).waitFor()
    assert((await staff.locator('select[name=role]').count()) === 0, 'Nhân viên thấy ô đổi vai trò')
  })

  await step('[Nhân viên] Duyệt đơn trên bảng đơn đăng ký; database ghi nhân viên là người xử lý', async () => {
    const who = `Đơn Nhân Viên Duyệt ${tail}`
    const id = await insertRegistration({ user_id: STAFF.id, course_id: created.courseIds.hidden, full_name: who, phone: '0390000001', amount: 99000 })
    await staff.goto(`${BASE}/admin/registrations`)
    const row = staff.getByRole('table', { name: 'Danh sách đơn đăng ký' }).locator('tbody tr', { hasText: who })
    await row.getByRole('button', { name: 'Duyệt' }).click()
    await toast(staff, 'Đã duyệt đơn')
    const { data } = await db.from('registrations').select('status, reviewed_by, reviewed_by_name').eq('id', id).single()
    assert(data.status === 'approved' && data.reviewed_by === STAFF.id && data.reviewed_by_name === STAFF.name, `Người xử lý: ${JSON.stringify(data)}`)
    await db.from('registrations').delete().eq('id', id)
  })

  await step('[Nhân viên] Khách quan tâm premium: thấy khách mới, gọi / nhắn Zalo, chuyển "Đã liên hệ" kèm ghi chú', async () => {
    await staff.goto(`${BASE}/admin/leads`)
    const card = staff.locator('.card', { hasText: LEAD.phone })
    await card.getByText(COURSE_PREMIUM.title).waitFor()
    assert((await card.getByRole('link', { name: LEAD.phone }).getAttribute('href')) === `tel:${LEAD.phone}`, 'Thiếu link gọi')
    await card.locator('select[name=status]').selectOption('contacted')
    await card.locator('textarea[name=staff_note]').fill('Đã gọi, hẹn tư vấn thứ 7')
    await card.getByRole('button', { name: 'Cập nhật' }).click()
    await toast(staff, 'Đã ghi nhận: đã liên hệ khách')
    const { data } = await db.from('leads').select('status, staff_note, handled_by, handled_by_name, phone').eq('phone', LEAD.phone).single()
    assert(
      data.status === 'contacted' && data.staff_note === 'Đã gọi, hẹn tư vấn thứ 7' && data.handled_by === STAFF.id && data.handled_by_name === STAFF.name,
      `Khách quan tâm sau khi xử lý: ${JSON.stringify(data)}`
    )
    // Nhân viên không sửa được thông tin khách để lại (trigger giữ nguyên)
    await STAFF.session.from('leads').update({ phone: '0900000000' }).eq('phone', LEAD.phone)
    const { count } = await db.from('leads').select('id', { count: 'exact', head: true }).eq('phone', LEAD.phone)
    assert(count === 1, 'Nhân viên sửa được SĐT khách để lại!')
  })

  await step('[Hệ thống] Đường dẫn cũ /admin?status=… chuyển sang /admin/registrations?status=…', async () => {
    await admin.goto(`${BASE}/admin?status=approved`)
    await admin.waitForURL(/\/admin\/registrations\?status=approved/).catch(() => {})
    const url = new URL(admin.url())
    assert(url.pathname === '/admin/registrations' && url.searchParams.get('status') === 'approved', `Chuyển hướng sai: ${admin.url()}`)
    await admin.getByRole('link', { name: /^Đã duyệt/ }).and(admin.locator('[aria-current=page]')).waitFor()
  })

  // =====================================================================
  phase('9c. GÓI THÁNG & HẠN HỌC (v0.2, Đợt 9)')
  // =====================================================================
  const renewCtx = await newContext({ viewport: { width: 1366, height: 900 } })
  const patient = watch(await renewCtx.newPage(), 'benh-nhan-gia-han')
  const plans = {}

  await step('[Admin] Tạo chương trình có học phí → tự có gói 1 tháng (12 buổi); thêm gói 3 tháng; gói trùng và nhân viên thêm gói bị chặn', async () => {
    created.courseIds.plan = await createCourseViaUI(admin, COURSE_PLAN)
    const card = admin.locator('.card', { has: admin.getByRole('heading', { name: COURSE_PLAN.title }) })
    const addForm = card.locator('form', { has: admin.getByRole('button', { name: 'Thêm gói' }) })
    await addForm.locator('select[name=months]').selectOption('3')
    await addForm.locator('input[name=price]').fill(String(PLAN3_PRICE))
    await addForm.getByRole('button', { name: 'Thêm gói' }).click()
    await toast(admin, 'Đã thêm gói 3 tháng')
    const { data } = await db.from('course_plans').select('id, months, sessions, price, active').eq('course_id', created.courseIds.plan).order('months')
    assert(
      data.length === 2 && data[0].months === 1 && data[0].sessions === 12 && data[0].price === Number(COURSE_PLAN.price) &&
        data[1].months === 3 && data[1].sessions === 36 && data[1].price === PLAN3_PRICE && data.every((p) => p.active),
      `Gói sai: ${JSON.stringify(data)}`
    )
    plans.m1 = data[0].id
    plans.m3 = data[1].id
    const { error: dupError } = await ADMIN.session.from('course_plans').insert({ course_id: created.courseIds.plan, months: 1, sessions: 12, price: 1 })
    assert(dupError?.code === '23505', `Database nhận gói 1 tháng thứ 2: ${dupError?.message ?? 'không lỗi'}`)
    const { error: staffError } = await STAFF.session.from('course_plans').insert({ course_id: created.courseIds.plan, months: 6, sessions: 72, price: 1 })
    assert(staffError, 'Nhân viên thêm được gói!')

    await admin.goto(`${BASE}/admin/courses/${created.courseIds.plan}`)
    const form = admin.locator('section', { has: admin.getByRole('heading', { name: 'Thêm bài học' }) })
    await form.locator('[name=title]').fill('Buổi 1 – Bài 1: Khởi động')
    await form.locator('[name=video_url]').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await form.getByRole('button', { name: 'Thêm bài học' }).click()
    await toast(admin, 'Đã thêm bài học')
  })

  await step('[Khách] Trang giới thiệu chọn gói 3 tháng → box đăng ký chọn sẵn gói, QR đúng giá; server chặn gói của chương trình khác; đăng ký gói 1 tháng', async () => {
    await patient.goto(`${BASE}/khoa-hoc/${created.courseIds.plan}`)
    await patient.getByRole('radio', { name: /Gói 3 tháng/ }).check()
    await patient.getByRole('link', { name: 'Đăng ký gói 3 tháng' }).click()
    await patient.waitForURL(new RegExp(`plan=${plans.m3}`))
    await patient.waitForFunction((id) => document.querySelector('#courseId')?.value === id, created.courseIds.plan)
    await patient.waitForFunction((id) => document.querySelector('input[name=planId]:checked')?.value === id, plans.m3)
    await patient.fill('#phone', RENEW.phone)
    const qr = await patient.getByAltText('Mã QR chuyển khoản').getAttribute('src')
    assert(qr.includes(`amount=${PLAN3_PRICE}`), `QR không theo giá gói 3 tháng: ${qr}`)

    // Gửi gói của chương trình khác (sửa dữ liệu form): server từ chối, không tạo tài khoản
    const otherPlan = (await db.from('course_plans').select('id').eq('course_id', created.courseIds.A).eq('months', 1).single()).data.id
    await fillGuestForm(patient, { name: RENEW.name, email: '', phone: RENEW.phone, password: RENEW.password, courseId: created.courseIds.plan, image: SMALL_IMAGE })
    await patient.locator('form', { has: patient.locator('#paymentProof') }).evaluate((el, id) => {
      el.addEventListener('formdata', (e) => e.formData.set('planId', id), { once: true })
    }, otherPlan)
    await registerButton(patient).click()
    await alertText(patient, 'Gói không hợp lệ')
    const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('phone', RENEW.phone)
    assert(count === 0, 'Vẫn tạo tài khoản khi gói không hợp lệ')

    await fillGuestForm(patient, { name: RENEW.name, email: '', phone: RENEW.phone, password: RENEW.password, courseId: created.courseIds.plan, image: SMALL_IMAGE })
    await patient.getByRole('radio', { name: /Gói 1 tháng/ }).check()
    await Promise.all([patient.waitForURL(/\/courses\?registered=1/, { timeout: 30000 }), registerButton(patient).click()])
    const { data: profile } = await db.from('profiles').select('id').eq('phone', RENEW.phone).single()
    RENEW.id = profile.id
    created.userIds.push(profile.id)
    const regs = await db.from('registrations').select('status, plan_id, plan_months, plan_sessions, amount, source, payment_method').eq('user_id', RENEW.id)
    const r = regs.data[0]
    assert(
      regs.data.length === 1 && r.status === 'pending' && r.plan_id === plans.m1 && r.plan_months === 1 && r.plan_sessions === 12 &&
        r.amount === Number(COURSE_PLAN.price) && r.source === 'web' && r.payment_method === 'bank_transfer',
      `Đơn không lưu đúng gói: ${JSON.stringify(regs.data)}`
    )
  })

  await step('[Nhân viên] Duyệt đơn gói 1 tháng → hạn học = lúc duyệt + 1 tháng; bệnh nhân thấy "Còn N ngày", nút Gia hạn, xem được bài', async () => {
    await staff.goto(`${BASE}/admin/registrations`)
    const row = staff.getByRole('table', { name: 'Danh sách đơn đăng ký' }).locator('tbody tr', { hasText: RENEW.phone })
    await row.getByText('1 tháng').first().waitFor()
    const before = Date.now()
    await row.getByRole('button', { name: 'Duyệt' }).click()
    await toast(staff, 'Đã duyệt đơn')
    const { data } = await db.from('registrations').select('access_starts_at, access_until').eq('user_id', RENEW.id).single()
    const starts = new Date(data.access_starts_at).getTime()
    assert(Math.abs(starts - before) < 60_000, `Hạn học không tính từ lúc duyệt: ${data.access_starts_at}`)
    assert(new Date(data.access_until).getTime() === addMonths(data.access_starts_at, 1), `Hạn học sai: ${JSON.stringify(data)}`)
    RENEW.firstUntil = data.access_until

    await patient.goto(`${BASE}/courses`)
    const tile = patient.locator('.card', { has: patient.getByRole('heading', { name: COURSE_PLAN.title }) })
    await tile.getByText(/^Còn \d+ ngày$/).waitFor()
    await tile.getByRole('link', { name: 'Gia hạn' }).waitFor()
    await tile.getByRole('link', { name: 'Vào học' }).click()
    await patient.getByRole('link', { name: 'Bắt đầu học' }).click()
    await patient.locator('iframe[src*="youtube.com/embed/"]').waitFor({ state: 'attached' })
  })

  await step('[Bệnh nhân] Gia hạn gói 3 tháng khi còn hạn → cộng dồn vào hạn cũ; đơn chờ thứ 2 bị chặn; nhân viên không sửa tay được hạn học', async () => {
    await patient.goto(`${BASE}/courses`)
    await patient.locator('.card', { has: patient.getByRole('heading', { name: COURSE_PLAN.title }) }).getByRole('link', { name: 'Gia hạn' }).click()
    await patient.getByText('Bạn đang học chương trình này tới').waitFor()
    await patient.getByRole('radio', { name: /Gói 3 tháng/ }).check()
    await patient.setInputFiles('#paymentProof', SMALL_IMAGE)
    await Promise.all([patient.waitForURL(/\/courses\?registered=1/, { timeout: 30000 }), registerButton(patient).click()])
    // Đơn gia hạn thứ 2 khi đơn trước còn chờ duyệt: bị chặn
    await patient.goto(`${BASE}/register?course=${created.courseIds.plan}`)
    await patient.getByText('Bạn đang học chương trình này tới').waitFor()
    await patient.setInputFiles('#paymentProof', SMALL_IMAGE)
    await registerButton(patient).click()
    await alertText(patient, 'đang chờ xác nhận')

    const { data: pending } = await db.from('registrations').select('id, plan_months').eq('user_id', RENEW.id).eq('status', 'pending').single()
    assert(pending.plan_months === 3, `Đơn gia hạn sai gói: ${JSON.stringify(pending)}`)
    const { data: approved, error } = await STAFF.session
      .from('registrations')
      .update({ status: 'approved' })
      .eq('id', pending.id)
      .eq('status', 'pending')
      .select('access_starts_at, access_until')
    assert(!error && approved.length === 1, `Nhân viên không duyệt được: ${error?.message}`)
    assert(
      new Date(approved[0].access_starts_at).getTime() === new Date(RENEW.firstUntil).getTime() &&
        new Date(approved[0].access_until).getTime() === addMonths(RENEW.firstUntil, 3),
      `Gia hạn không cộng dồn: hạn cũ ${RENEW.firstUntil}, mới ${JSON.stringify(approved[0])}`
    )
    // Nhân viên sửa tay hạn học / học phí qua API: database giữ nguyên
    await STAFF.session.from('registrations').update({ access_until: '2099-01-01T00:00:00Z', amount: 1 }).eq('id', pending.id)
    const { data: after } = await db.from('registrations').select('access_until, amount').eq('id', pending.id).single()
    assert(new Date(after.access_until).getTime() === addMonths(RENEW.firstUntil, 3) && after.amount === PLAN3_PRICE, `Sửa tay được: ${JSON.stringify(after)}`)
  })

  await step('[Bệnh nhân] Hết hạn: mất quyền xem bài, vẫn thấy khóa ở mục "Gói đã hết hạn" + đề cương; gia hạn khi đã hết hạn tính lại từ lúc duyệt; số buổi đã mua cộng dồn', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    await db.from('registrations').update({ access_until: past }).eq('user_id', RENEW.id).eq('status', 'approved')
    await patient.goto(`${BASE}/courses`)
    const expired = patient.getByRole('region', { name: 'Gói đã hết hạn' })
    await expired.getByRole('heading', { name: COURSE_PLAN.title }).waitFor()
    await expired.getByText(/Đã hết hạn/).first().waitFor()
    await expired.getByRole('link', { name: 'Xem khóa học' }).click()
    await patient.getByText(/Gói tập đã hết hạn ngày/).waitFor()
    await patient.getByRole('list', { name: 'Đề cương khóa học' }).getByText('Buổi 1 – Bài 1: Khởi động').waitFor()
    assert((await patient.getByRole('link', { name: 'Bắt đầu học' }).count()) === 0, 'Hết hạn vẫn có nút Bắt đầu học')
    await patient.getByRole('link', { name: 'Gia hạn để tập tiếp' }).waitFor()

    const session = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { error: loginError } = await session.auth.signInWithPassword({ email: `${RENEW.phone}@sdt.hv.invalid`, password: RENEW.password })
    assert(!loginError, loginError?.message)
    const { data: lessons } = await session.from('lessons').select('id').eq('course_id', created.courseIds.plan)
    assert(!lessons?.length, 'Hết hạn vẫn đọc được bài học qua API!')

    // Gia hạn khi đã hết hạn: tính từ lúc duyệt, không nối vào hạn cũ đã qua
    const id = await insertRegistration({
      user_id: RENEW.id, course_id: created.courseIds.plan, full_name: RENEW.name, phone: RENEW.phone,
      plan_id: plans.m1, plan_months: 1, plan_sessions: 12, amount: Number(COURSE_PLAN.price),
    })
    const before = Date.now()
    const { data } = await STAFF.session.from('registrations').update({ status: 'approved' }).eq('id', id).select('access_starts_at, access_until')
    assert(Math.abs(new Date(data[0].access_starts_at).getTime() - before) < 60_000, `Gia hạn sau khi hết hạn không tính từ lúc duyệt: ${JSON.stringify(data)}`)
    const { data: sessions } = await session.rpc('purchased_sessions', { target_course: created.courseIds.plan })
    assert(sessions === 12 + 36 + 12, `Số buổi đã mua: ${sessions}`)
    const { data: again } = await session.from('lessons').select('id').eq('course_id', created.courseIds.plan)
    assert(again?.length === 1, 'Gia hạn xong vẫn không xem được bài')
  })

  // =====================================================================
  phase('9d. BUỔI – BÀI TẬP, CHECKLIST & TIẾN ĐỘ (v0.2, Đợt 10)')
  // =====================================================================
  const seq = {}
  // Buổi / bài của chương trình theo thứ tự hiển thị
  const loadSeq = async () => {
    const { data: sessions } = await db.from('course_sessions').select('id, title, sort_order').eq('course_id', created.courseIds.seq).order('sort_order').order('created_at')
    const { data: lessons } = await db.from('lessons').select('id, title, session_id, sort_order, video_url').eq('course_id', created.courseIds.seq).order('sort_order')
    seq.sessions = sessions
    seq.lesson = (i, j) => lessons.filter((l) => l.session_id === sessions[i].id)[j]
    return { sessions, lessons }
  }
  const seqLessonUrl = (i, j) => `${BASE}/courses/${created.courseIds.seq}/${seq.lesson(i, j).id}`

  await step('[Admin] Tạo chương trình kèm khung 3 buổi × 2 bài; sao chép / xóa / đổi thứ tự buổi; thêm video cho bài; cảnh báo bài chưa có video', async () => {
    created.courseIds.seq = await createCourseViaUI(admin, COURSE_SEQ)
    let { sessions, lessons } = await loadSeq()
    assert(
      sessions.map((x) => x.title).join(',') === 'Buổi 1,Buổi 2,Buổi 3' && lessons.length === 6 && lessons.every((l) => !l.video_url),
      `Khung buổi tập sai: ${JSON.stringify({ sessions, lessons: lessons.length })}`
    )
    await admin.goto(`${BASE}/admin/courses/${created.courseIds.seq}`)
    await admin.getByText('6 bài chưa có video').waitFor()
    const block = (title) => admin.getByTestId('admin-session').filter({ has: admin.getByRole('heading', { name: new RegExp(`^${title} `) }) })

    // Sao chép Buổi 1 → Buổi 4 (2 bài), rồi xóa Buổi 4 (có xác nhận)
    await block('Buổi 1').getByRole('button', { name: 'Sao chép buổi' }).click()
    await toast(admin, 'Đã sao chép buổi')
    await block('Buổi 4').waitFor()
    await block('Buổi 4').locator('summary', { hasText: 'Sửa buổi' }).click()
    admin.once('dialog', (d) => d.accept())
    await block('Buổi 4').getByRole('button', { name: 'Xóa buổi' }).click()
    await toast(admin, 'Đã xóa buổi')
    await block('Buổi 4').waitFor({ state: 'detached' })

    // Đổi thứ tự: Buổi 1 xuống dưới Buổi 2, rồi đưa lại lên đầu
    await block('Buổi 1').getByRole('button', { name: '↓' }).click()
    await toast(admin, 'Đã đổi thứ tự buổi')
    ;({ sessions } = await loadSeq())
    assert(sessions.map((x) => x.title).join(',') === 'Buổi 2,Buổi 1,Buổi 3', `Đổi thứ tự sai: ${sessions.map((x) => x.title)}`)
    await block('Buổi 1').getByRole('button', { name: '↑' }).click()
    // Toast lần trước có thể còn hiện: chờ database đổi thứ tự
    for (let i = 0; i < 40; i++) {
      ;({ sessions, lessons } = await loadSeq())
      if (sessions[0].title === 'Buổi 1') break
      await new Promise((r) => setTimeout(r, 250))
    }
    assert(sessions.map((x) => x.title).join(',') === 'Buổi 1,Buổi 2,Buổi 3' && lessons.length === 6, `Thứ tự sau khi đổi lại: ${sessions.map((x) => x.title)}`)

    // Thêm video cho Buổi 1 – Bài 1
    const lessonCard = block('Buổi 1').locator('.card').first()
    await lessonCard.locator('summary', { hasText: 'Sửa bài học' }).click()
    await lessonCard.locator('[name=title]').fill('Bài 1: Thở cơ hoành')
    await lessonCard.locator('[name=video_url]').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await lessonCard.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await toast(admin, 'Đã lưu bài học')
    await admin.getByText('5 bài chưa có video').waitFor()
    await loadSeq()

    // Gói 1 tháng của chương trình chỉ mở 2 buổi (buổi 3 cần gia hạn)
    await db.from('course_plans').update({ sessions: 2 }).eq('course_id', created.courseIds.seq).eq('months', 1)
  })

  await step('[Bệnh nhân] Buổi mở lần lượt: buổi 2 khóa tới khi tick đủ buổi 1, buổi 3 vượt số buổi đã mua; database chặn tick trước (RLS)', async () => {
    const plan = (await db.from('course_plans').select('id').eq('course_id', created.courseIds.seq).single()).data
    const id = await insertRegistration({
      user_id: RENEW.id, course_id: created.courseIds.seq, full_name: RENEW.name, phone: RENEW.phone,
      plan_id: plan.id, plan_months: 1, plan_sessions: 2, amount: 250000,
    })
    const { error } = await STAFF.session.from('registrations').update({ status: 'approved' }).eq('id', id)
    assert(!error, error?.message)

    await patient.goto(`${BASE}/courses/${created.courseIds.seq}`)
    await patient.getByTestId('progress-text').filter({ hasText: '0/4 bài · 0%' }).waitFor()
    await patient.getByText('Hoàn thành Buổi 1 để mở').first().waitFor()
    await patient.getByText('Gia hạn để mở buổi này').first().waitFor()

    RENEW.session = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    await RENEW.session.auth.signInWithPassword({ email: `${RENEW.phone}@sdt.hv.invalid`, password: RENEW.password })
    const { error: early } = await RENEW.session.from('lesson_progress').insert({ user_id: RENEW.id, lesson_id: seq.lesson(1, 0).id, course_id: created.courseIds.seq })
    assert(early, 'Database cho tick bài của buổi chưa mở!')
    const { data: lockedLesson } = await RENEW.session.from('lessons').select('video_url').eq('id', seq.lesson(1, 0).id)
    assert(!lockedLesson?.length, 'Đọc được link video của buổi chưa mở!')

    await patient.goto(seqLessonUrl(1, 0))
    await patient.getByText('Hoàn thành Buổi 1 để mở').first().waitFor()
    assert((await patient.locator('iframe').count()) === 0, 'Buổi chưa mở vẫn phát video')
  })

  await step('[Bệnh nhân] Checklist buổi 1: "Hoàn thành & bài tiếp theo" tick bài và chuyển bài; xong buổi 1 thì buổi 2 mở; "Khóa học của tôi" hiện tiến độ + "Tiếp tục Buổi 2 – Bài 1"', async () => {
    await patient.goto(`${BASE}/courses/${created.courseIds.seq}`)
    await patient.getByRole('link', { name: 'Bắt đầu học' }).click()
    await patient.getByRole('heading', { level: 1, name: 'Bài 1: Thở cơ hoành' }).waitFor()
    await patient.locator('iframe[src*="youtube.com/embed/"]').waitFor({ state: 'attached' })
    await patient.getByRole('button', { name: 'Hoàn thành & bài tiếp theo' }).click()
    await patient.waitForURL(seqLessonUrl(0, 1))
    await toast(patient, 'Đã hoàn thành bài tập')
    await patient.getByText('Video bài học đang được cập nhật').waitFor()
    await patient.getByRole('button', { name: 'Hoàn thành & bài tiếp theo' }).click()
    // Tick xong bài cuối buổi 1 → buổi 2 mở → chuyển thẳng sang Buổi 2 – Bài 1
    await patient.waitForURL(seqLessonUrl(1, 0))
    await patient.getByTestId('progress-text').filter({ hasText: '2/4 bài · 50%' }).waitFor()
    await patient.getByText('Buổi 2 · Bài 1/2').waitFor()

    await patient.goto(`${BASE}/courses`)
    const tile = patient.locator('.card', { has: patient.getByRole('heading', { name: COURSE_SEQ.title }) })
    await tile.getByTestId('progress-text').filter({ hasText: '2/4 bài · 50%' }).waitFor()
    await tile.getByRole('link', { name: /Tiếp tục Buổi 2 – Bài 1/ }).waitFor()
    const { count } = await db.from('lesson_progress').select('lesson_id', { count: 'exact', head: true }).eq('user_id', RENEW.id).eq('course_id', created.courseIds.seq)
    assert(count === 2, `Số bài đã tick: ${count}`)
  })

  await step('[Bệnh nhân] Bỏ tick 1 bài buổi 1 (có xác nhận) → buổi 2 khóa lại; tick lại → mở; xong buổi đã mua → chúc mừng, buổi 3 vẫn khóa "Gia hạn"', async () => {
    await patient.goto(seqLessonUrl(0, 1))
    let dialogText = ''
    patient.once('dialog', (d) => { dialogText = d.message(); d.accept() })
    await patient.getByRole('button', { name: 'Bỏ đánh dấu' }).click()
    await toast(patient, 'Đã bỏ đánh dấu')
    assert(dialogText.includes('Buổi sau có thể bị khóa lại'), `Hộp xác nhận: ${dialogText}`)
    await patient.goto(seqLessonUrl(1, 0))
    await patient.getByText('Hoàn thành Buổi 1 để mở').first().waitFor()

    await patient.goto(seqLessonUrl(0, 1))
    await patient.getByRole('button', { name: 'Hoàn thành & bài tiếp theo' }).click()
    await patient.waitForURL(seqLessonUrl(1, 0))
    await patient.getByRole('button', { name: 'Hoàn thành & bài tiếp theo' }).click()
    await patient.waitForURL(seqLessonUrl(1, 1))
    // Bài cuối của buổi cuối đã mua: buổi 3 chưa mở → ở lại, hiện chúc mừng
    await patient.getByRole('button', { name: 'Hoàn thành & bài tiếp theo' }).click()
    await patient.waitForURL(/finished=1/)
    await patient.getByText('Chúc mừng! Bạn đã hoàn thành các buổi tập đã mở').waitFor()
    await patient.getByTestId('progress-text').filter({ hasText: '4/4 bài · 100%' }).waitFor()
    await patient.goto(seqLessonUrl(2, 0))
    await patient.getByText('Gia hạn để mở buổi này').first().waitFor()
    const { error } = await RENEW.session.from('lesson_progress').insert({ user_id: RENEW.id, lesson_id: seq.lesson(2, 0).id, course_id: created.courseIds.seq })
    assert(error, 'Database cho tick bài vượt số buổi đã mua!')
  })

  await step('[Nhân viên] Xem trước mọi buổi (kể cả buổi bệnh nhân chưa mở), không có nút tick, không ghi tiến độ', async () => {
    await staff.goto(seqLessonUrl(2, 1))
    await staff.getByText('Chế độ xem trước').waitFor()
    await staff.getByText('Video bài học đang được cập nhật').waitFor()
    assert((await staff.getByRole('button', { name: /Hoàn thành/ }).count()) === 0, 'Nhân viên có nút tick')
    const { count } = await db.from('lesson_progress').select('lesson_id', { count: 'exact', head: true }).eq('user_id', STAFF.id)
    assert(count === 0, 'Nhân viên có tiến độ')
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
