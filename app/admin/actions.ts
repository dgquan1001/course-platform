'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, requireAdmin, requireStaff, type Role } from '@/lib/auth'
import { isSupportedVideoUrl } from '@/lib/video'
import { detectImageType, type ImageType } from '@/lib/image-type'
import { isCourseCategory, isCourseKind, PLAN_MONTHS, SESSIONS_PER_MONTH } from '@/lib/courses'
import type { ActionResult } from '@/lib/action-result'

type DbResult = { data: unknown[] | null; error: { message: string; code?: string } | null }
type RunOptions = {
  // Thông báo khi không có dòng nào bị ảnh hưởng
  notFound?: string
  // Thông báo riêng theo mã lỗi Postgres của từng thao tác (VD 23505: trùng dữ liệu)
  errors?: Record<string, string>
  // Thao tác nhân viên cũng làm được (duyệt đơn); mặc định chỉ admin (khóa học, bài học, phân quyền)
  staff?: boolean
}
type Parsed<T> = { value: T; error: null } | { value: null; error: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_TITLE = 200
const MAX_DESCRIPTION = 5000
const MAX_PRICE = 1_000_000_000
const MAX_SORT_ORDER = 100_000
const MAX_NOTE = 500
const MAX_SUMMARY = 300
const MAX_OUTCOMES = 12
const MAX_OUTCOME = 200
const MAX_COVER = 2 * 1024 * 1024
const COVER_BUCKET = 'course-covers'
const COVER_EXT: Partial<Record<ImageType, string>> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Chạy thao tác quản trị: kiểm tra quyền, dừng nếu dữ liệu nhập không hợp lệ, báo lỗi nếu database lỗi
// hoặc không có dòng nào bị ảnh hưởng (VD: dữ liệu đã bị xóa), làm mới toàn bộ trang khi thành công.
async function run(
  message: string,
  op: () => PromiseLike<DbResult>,
  invalid: string | null = null,
  { notFound = 'Không tìm thấy dữ liệu, vui lòng tải lại trang.', errors = {}, staff = false }: RunOptions = {}
): Promise<ActionResult> {
  try {
    await (staff ? requireStaff() : requireAdmin())
    if (invalid) return { ok: false, error: invalid }
    const { data, error } = await op()
    if (error) return { ok: false, error: (error.code && errors[error.code]) || error.message }
    if (!data?.length) return { ok: false, error: notFound }
    revalidatePath('/', 'layout')
    return { ok: true, message }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.' }
  }
}

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim()

// Số nguyên trong khoảng [min, max]; ô để trống được tính là 0
function readInt(formData: FormData, name: string, label: string, min: number, max: number): number | string {
  const raw = text(formData, name)
  if (!raw) return 0
  if (!/^-?\d+$/.test(raw)) return `${label} phải là số nguyên.`
  const value = Number(raw)
  if (value < min || value > max) return `${label} phải từ ${min.toLocaleString('vi-VN')} đến ${max.toLocaleString('vi-VN')}.`
  return value
}

function readTitleAndDescription(
  formData: FormData,
  label: string
): Parsed<{ title: string; description: string | null }> {
  const title = text(formData, 'title')
  const description = text(formData, 'description') || null
  if (!title) return { value: null, error: `Vui lòng nhập tên ${label}.` }
  if (title.length > MAX_TITLE) return { value: null, error: `Tên ${label} tối đa ${MAX_TITLE} ký tự.` }
  if (description && description.length > MAX_DESCRIPTION) {
    return { value: null, error: `Mô tả tối đa ${MAX_DESCRIPTION} ký tự.` }
  }
  return { value: { title, description }, error: null }
}

type CourseInput = {
  title: string
  description: string | null
  price: number
  sort_order: number
  status: string
  kind: string
  category: string | null
  summary: string | null
  outcomes: string[]
}

function readCourse(formData: FormData): Parsed<CourseInput> {
  const base = readTitleAndDescription(formData, 'khóa học')
  if (base.error !== null) return base
  const price = readInt(formData, 'price', 'Học phí', 0, MAX_PRICE)
  if (typeof price === 'string') return { value: null, error: price }
  const sortOrder = readInt(formData, 'sort_order', 'Thứ tự hiển thị', -MAX_SORT_ORDER, MAX_SORT_ORDER)
  if (typeof sortOrder === 'string') return { value: null, error: sortOrder }
  const status = text(formData, 'status') || 'published'
  if (status !== 'draft' && status !== 'published') return { value: null, error: 'Trạng thái khóa học không hợp lệ.' }
  const kind = text(formData, 'kind') || 'program'
  if (!isCourseKind(kind)) return { value: null, error: 'Loại khóa học không hợp lệ.' }
  const category = text(formData, 'category') || null
  if (category && !isCourseCategory(category)) return { value: null, error: 'Nhóm bệnh không hợp lệ.' }
  const summary = text(formData, 'summary') || null
  if (summary && summary.length > MAX_SUMMARY) return { value: null, error: `Mô tả ngắn tối đa ${MAX_SUMMARY} ký tự.` }
  // "Bạn sẽ đạt được": mỗi dòng một ý, bỏ dòng trống
  const outcomes = text(formData, 'outcomes')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (outcomes.length > MAX_OUTCOMES) return { value: null, error: `"Bạn sẽ đạt được" tối đa ${MAX_OUTCOMES} dòng.` }
  if (outcomes.some((o) => o.length > MAX_OUTCOME)) return { value: null, error: `Mỗi ý "Bạn sẽ đạt được" tối đa ${MAX_OUTCOME} ký tự.` }
  // Khóa miễn phí luôn có học phí 0
  return {
    value: { ...base.value, price: kind === 'free' ? 0 : price, sort_order: sortOrder, status, kind, category, summary, outcomes },
    error: null,
  }
}

type Cover = { file: File; contentType: ImageType; ext: string } | null

// Ảnh bìa (không bắt buộc): JPG/PNG/WEBP ≤ 2MB, xác định định dạng theo nội dung file
async function readCover(formData: FormData): Promise<Parsed<Cover>> {
  const file = formData.get('cover')
  if (!(file instanceof File) || file.size === 0) return { value: null, error: null }
  if (file.size > MAX_COVER) return { value: null, error: 'Ảnh bìa tối đa 2MB.' }
  const contentType = detectImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()))
  const ext = contentType && COVER_EXT[contentType]
  if (!contentType || !ext) return { value: null, error: 'Ảnh bìa phải là ảnh JPG, PNG hoặc WEBP hợp lệ.' }
  return { value: { file, contentType, ext }, error: null }
}

// Tải ảnh bìa lên bucket công khai (chịu RLS: chỉ admin), trả về đường dẫn công khai
async function uploadCover(cover: NonNullable<Cover>) {
  const storage = createClient().storage.from(COVER_BUCKET)
  const path = `${crypto.randomUUID()}.${cover.ext}`
  const { error } = await storage.upload(path, cover.file, { contentType: cover.contentType })
  if (error) return { url: null, error: { message: `Không tải được ảnh bìa: ${error.message}` } }
  return { url: storage.getPublicUrl(path).data.publicUrl, error: null }
}

// Xóa file ảnh bìa cũ (không làm hỏng thao tác chính nếu lỗi)
async function removeCover(url: string | null | undefined) {
  const path = url?.split(`/${COVER_BUCKET}/`)[1]
  if (path) await createClient().storage.from(COVER_BUCKET).remove([decodeURIComponent(path)])
}

type LessonInput = { title: string; description: string | null; video_url: string; sort_order: number }

function readLesson(formData: FormData): Parsed<LessonInput> {
  const base = readTitleAndDescription(formData, 'bài học')
  if (base.error !== null) return base
  const videoUrl = text(formData, 'video_url')
  if (!isSupportedVideoUrl(videoUrl)) {
    return {
      value: null,
      error: 'Link video phải là link YouTube hoặc TikTok hợp lệ (VD: https://www.youtube.com/watch?v=... hoặc https://www.tiktok.com/@user/video/...).',
    }
  }
  const sortOrder = readInt(formData, 'sort_order', 'Thứ tự bài', -MAX_SORT_ORDER, MAX_SORT_ORDER)
  if (typeof sortOrder === 'string') return { value: null, error: sortOrder }
  return { value: { ...base.value, video_url: videoUrl, sort_order: sortOrder }, error: null }
}

const checkId = (id: string, label: string) => (UUID.test(id) ? null : `Mã ${label} không hợp lệ, vui lòng tải lại trang.`)

const statusMessages = {
  approved: 'Đã duyệt đơn, khóa học đã được mở cho học viên.',
  rejected: 'Đã cập nhật đơn sang trạng thái Từ chối.',
  pending: 'Đã chuyển đơn về trạng thái Chờ duyệt.',
}

// ---------- Đơn đăng ký ----------

type RegistrationStatus = keyof typeof statusMessages

const isRegistrationStatus = (s: string): s is RegistrationStatus => Object.hasOwn(statusMessages, s)

// Nhân viên và admin đều xử lý được đơn.
// `expected` là trạng thái đang thấy trên trang: nếu người khác vừa xử lý đơn (trạng thái đã đổi)
// thì không ghi đè. `note` là lý do từ chối / thu hồi (học viên thấy được).
export async function setRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus,
  expected: RegistrationStatus,
  formData?: FormData
) {
  const note = status === 'pending' ? '' : text(formData ?? new FormData(), 'note')
  const invalid =
    checkId(registrationId, 'đơn') ??
    (isRegistrationStatus(status) && isRegistrationStatus(expected) && status !== expected ? null : 'Trạng thái đơn không hợp lệ.') ??
    (note.length > MAX_NOTE ? `Lý do tối đa ${MAX_NOTE} ký tự.` : null)
  return run(
    statusMessages[status],
    () => {
      // Thời điểm, người xử lý và lịch sử do trigger registrations_stamp_review ghi
      let query = createClient()
        .from('registrations')
        .update({ status, review_note: note || null })
        .eq('id', registrationId)
        .eq('status', expected)
      // Khóa học hoặc tài khoản đã bị xóa thì không duyệt được (đơn chỉ còn là lịch sử thanh toán).
      // Khóa đang ẩn vẫn duyệt được: khách đã chuyển khoản trước khi khóa ngừng nhận đăng ký.
      if (status === 'approved') query = query.not('course_id', 'is', null).not('user_id', 'is', null)
      return query.select('id')
    },
    invalid,
    {
      notFound: 'Đơn đã thay đổi (có thể người khác vừa xử lý), vui lòng tải lại trang.',
      errors: { '23505': 'Học viên đã có một đơn khác đang chờ duyệt hoặc đã được duyệt cho khóa này.' },
      staff: true,
    }
  )
}

// ---------- Khách quan tâm khóa premium ----------

const leadMessages = {
  new: 'Đã chuyển về "Mới".',
  contacted: 'Đã ghi nhận: đã liên hệ khách.',
  converted: 'Đã ghi nhận: khách đã chốt.',
  closed: 'Đã đóng yêu cầu.',
}
type LeadStatus = keyof typeof leadMessages
const isLeadStatus = (s: string): s is LeadStatus => Object.hasOwn(leadMessages, s)

// Nhân viên cập nhật trạng thái + ghi chú nội bộ. `expected`: trạng thái đang thấy trên trang (không ghi đè người khác).
// Người xử lý, thời điểm do trigger leads_stamp ghi.
export async function setLeadStatus(leadId: string, expected: string, formData: FormData) {
  const status = text(formData, 'status')
  const note = text(formData, 'staff_note')
  const invalid =
    checkId(leadId, 'yêu cầu') ??
    (isLeadStatus(status) && isLeadStatus(expected) ? null : 'Trạng thái không hợp lệ.') ??
    (note.length > MAX_NOTE ? `Ghi chú tối đa ${MAX_NOTE} ký tự.` : null)
  return run(
    isLeadStatus(status) ? leadMessages[status] : '',
    () =>
      createClient()
        .from('leads')
        .update({ status, staff_note: note || null })
        .eq('id', leadId)
        .eq('status', expected)
        .select('id'),
    invalid,
    { notFound: 'Yêu cầu đã thay đổi (có thể người khác vừa xử lý), vui lòng tải lại trang.', staff: true }
  )
}

// ---------- Phân quyền ----------

const roleMessages: Record<Role, string> = {
  admin: 'Đã cấp quyền admin.',
  staff: 'Đã chuyển vai trò thành Nhân viên.',
  user: 'Đã chuyển vai trò thành Học viên.',
}

const isRole = (s: string): s is Role => Object.hasOwn(roleMessages, s)

// Chỉ admin đổi vai trò. Database chặn tự đổi quyền của mình, gỡ admin cuối cùng và
// người không phải admin đổi vai trò (trigger guard_role_change).
export async function setUserRole(userId: string, formData: FormData) {
  const role = text(formData, 'role')
  const me = await getCurrentUser()
  const invalid =
    checkId(userId, 'tài khoản') ??
    (isRole(role) ? null : 'Vai trò không hợp lệ.') ??
    (userId === me?.id ? 'Bạn không thể tự thay đổi quyền của chính mình.' : null)
  return run(
    isRole(role) ? roleMessages[role] : '',
    () => createClient().from('profiles').update({ role }).eq('id', userId).select('id'),
    invalid
  )
}

// ---------- Khóa học ----------

export async function createCourse(formData: FormData) {
  const { value, error } = readCourse(formData)
  const cover = await readCover(formData)
  return run(
    `Đã thêm khóa học "${value?.title}".`,
    async () => {
      let cover_image: string | null = null
      if (cover.value) {
        const uploaded = await uploadCover(cover.value)
        if (uploaded.error) return { data: null, error: uploaded.error }
        cover_image = uploaded.url
      }
      const supabase = createClient()
      const result = await supabase.from('courses').insert({ ...value!, cover_image }).select('id')
      if (result.error) {
        await removeCover(cover_image)
        return result
      }
      // Chương trình có học phí: tạo sẵn gói 1 tháng (12 buổi) theo học phí nhập, thêm gói khác ở bảng gói
      if (value!.kind === 'program' && value!.price > 0) {
        const { error: planError } = await supabase
          .from('course_plans')
          .insert({ course_id: result.data[0].id, months: 1, sessions: SESSIONS_PER_MONTH, price: value!.price })
        if (planError) return { data: null, error: { message: `Đã tạo khóa nhưng chưa tạo được gói 1 tháng: ${planError.message}` } }
      }
      return result
    },
    error ?? cover.error
  )
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { value, error } = readCourse(formData)
  const cover = await readCover(formData)
  const removeCurrent = formData.get('remove_cover') === 'yes'
  return run(
    'Đã lưu thông tin khóa học.',
    async () => {
      const supabase = createClient()
      const { data: current } = await supabase.from('courses').select('kind, cover_image').eq('id', courseId).maybeSingle()
      if (!current) return { data: [], error: null }
      // Đổi loại khóa khi đã có đơn đăng ký sẽ làm sai lịch sử thanh toán / quyền học
      if (current.kind !== value!.kind) {
        const { count } = await supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('course_id', courseId)
        if (count) return { data: null, error: { message: 'Không đổi được loại khóa khi khóa đã có đơn đăng ký.' } }
      }
      let cover_image: string | null = removeCurrent ? null : current.cover_image
      if (cover.value) {
        const uploaded = await uploadCover(cover.value)
        if (uploaded.error) return { data: null, error: uploaded.error }
        cover_image = uploaded.url
      }
      const result = await supabase.from('courses').update({ ...value!, cover_image }).eq('id', courseId).select('id')
      // Ảnh bìa cũ không còn dùng → xóa; lưu lỗi thì xóa ảnh vừa tải lên
      if (result.error) await removeCover(cover.value ? cover_image : null)
      else if (cover_image !== current.cover_image) await removeCover(current.cover_image)
      return result
    },
    checkId(courseId, 'khóa học') ?? error ?? cover.error
  )
}

export async function setCourseStatus(courseId: string, status: 'draft' | 'published') {
  const invalid = checkId(courseId, 'khóa học') ?? (['draft', 'published'].includes(status) ? null : 'Trạng thái khóa học không hợp lệ.')
  return run(
    status === 'published' ? 'Khóa học đã hiển thị trên website.' : 'Đã ẩn khóa học khỏi website (học viên đã mua vẫn học được).',
    () => createClient().from('courses').update({ status }).eq('id', courseId).select('id'),
    invalid
  )
}

// Đơn đăng ký của khóa được giữ lại (course_id = null, còn tên khóa và học phí đã lưu)
export async function deleteCourse(courseId: string) {
  return run(
    'Đã xóa khóa học. Đơn đăng ký và lịch sử thanh toán vẫn được giữ lại.',
    async () => {
      const result = await createClient().from('courses').delete().eq('id', courseId).select('id, cover_image')
      if (!result.error) await removeCover(result.data?.[0]?.cover_image)
      return result
    },
    checkId(courseId, 'khóa học')
  )
}

// ---------- Gói theo thời hạn của chương trình (ADR-012) ----------

type PlanInput = { sessions: number; price: number; active: boolean }

function readPlan(formData: FormData, months: number): Parsed<PlanInput> {
  const price = readInt(formData, 'price', 'Giá gói', 0, MAX_PRICE)
  if (typeof price === 'string') return { value: null, error: price }
  // Để trống số buổi = 12 buổi mỗi tháng
  const sessions = text(formData, 'sessions') ? readInt(formData, 'sessions', 'Số buổi', 1, 500) : months * SESSIONS_PER_MONTH
  if (typeof sessions === 'string') return { value: null, error: sessions }
  return { value: { sessions, price, active: formData.get('active') === 'on' }, error: null }
}

export async function createPlan(courseId: string, formData: FormData) {
  const months = Number(text(formData, 'months'))
  const monthsError = (PLAN_MONTHS as readonly number[]).includes(months) ? null : 'Gói phải là 1, 3, 6 hoặc 12 tháng.'
  const { value, error } = readPlan(formData, months)
  return run(
    `Đã thêm gói ${months} tháng.`,
    () =>
      createClient()
        .from('course_plans')
        .insert({ ...value!, active: true, months, course_id: courseId })
        .select('id'),
    checkId(courseId, 'khóa học') ?? monthsError ?? error,
    { errors: { '23505': `Chương trình đã có gói ${months} tháng, hãy sửa gói đó.` } }
  )
}

export async function updatePlan(planId: string, months: number, formData: FormData) {
  const { value, error } = readPlan(formData, months)
  return run(
    `Đã lưu gói ${months} tháng.`,
    () => createClient().from('course_plans').update(value!).eq('id', planId).select('id'),
    checkId(planId, 'gói') ?? error
  )
}

// Đơn đã đăng ký gói vẫn giữ ảnh chụp gói (plan_months, plan_sessions, amount); plan_id về null
export async function deletePlan(planId: string) {
  return run(
    'Đã xóa gói.',
    () => createClient().from('course_plans').delete().eq('id', planId).select('id'),
    checkId(planId, 'gói')
  )
}

// ---------- Bài học ----------

export async function createLesson(courseId: string, formData: FormData) {
  const { value, error } = readLesson(formData)
  return run(
    `Đã thêm bài học "${value?.title}".`,
    () => createClient().from('lessons').insert({ ...value!, course_id: courseId }).select('id'),
    checkId(courseId, 'khóa học') ?? error
  )
}

export async function updateLesson(lessonId: string, formData: FormData) {
  const { value, error } = readLesson(formData)
  return run(
    'Đã lưu bài học.',
    () => createClient().from('lessons').update(value!).eq('id', lessonId).select('id'),
    checkId(lessonId, 'bài học') ?? error
  )
}

export async function deleteLesson(lessonId: string) {
  return run(
    'Đã xóa bài học.',
    () => createClient().from('lessons').delete().eq('id', lessonId).select('id'),
    checkId(lessonId, 'bài học')
  )
}
