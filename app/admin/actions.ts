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
  // null: form không có ô Giá (sửa chương trình – giá nằm ở bảng gói, RK-18) → giữ nguyên
  price: number | null
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
  const price = formData.has('price') ? readInt(formData, 'price', 'Học phí', 0, MAX_PRICE) : null
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

type LessonInput = { title: string; description: string | null; video_url: string | null; sort_order: number }

// Link video không bắt buộc (khung buổi tập mới tạo chưa có video); có thì phải là YouTube / TikTok hợp lệ
function readLesson(formData: FormData): Parsed<LessonInput> {
  const base = readTitleAndDescription(formData, 'bài học')
  if (base.error !== null) return base
  const videoUrl = text(formData, 'video_url') || null
  if (videoUrl && !isSupportedVideoUrl(videoUrl)) {
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

// ---------- Phiếu tham vấn (ADR-015) ----------

const consultationMessages = {
  new: 'Đã chuyển phiếu về "Mới".',
  contacted: 'Đã ghi nhận: đã liên hệ bệnh nhân.',
  done: 'Đã hoàn tất phiếu tham vấn.',
  cancelled: 'Đã hủy phiếu.',
}
type ConsultationStatus = keyof typeof consultationMessages
const isConsultationStatus = (s: string): s is ConsultationStatus => Object.hasOwn(consultationMessages, s)
const MAX_STAFF_NOTE = 1000

// Như setLeadStatus: không ghi đè khi người khác vừa xử lý; người xử lý, thời điểm do trigger consultations_stamp ghi.
// Ghi chú nội bộ bệnh nhân không đọc được (bệnh nhân xem phiếu qua my_consultations()).
export async function setConsultationStatus(consultationId: string, expected: string, formData: FormData) {
  const status = text(formData, 'status')
  const note = text(formData, 'staff_note')
  const invalid =
    checkId(consultationId, 'phiếu') ??
    (isConsultationStatus(status) && isConsultationStatus(expected) ? null : 'Trạng thái không hợp lệ.') ??
    (note.length > MAX_STAFF_NOTE ? `Ghi chú tối đa ${MAX_STAFF_NOTE} ký tự.` : null)
  return run(
    isConsultationStatus(status) ? consultationMessages[status] : '',
    () =>
      createClient()
        .from('consultations')
        .update({ status, staff_note: note || null })
        .eq('id', consultationId)
        .eq('status', expected)
        .select('id'),
    invalid,
    { notFound: 'Phiếu đã thay đổi (có thể người khác vừa xử lý), vui lòng tải lại trang.', staff: true }
  )
}

// Mẫu phiếu tham vấn (chỉ admin). Sửa câu hỏi không ảnh hưởng phiếu đã gửi (phiếu lưu ảnh chụp câu hỏi).
const QUESTION_KINDS = ['check', 'scale', 'text'] as const
const MAX_QUESTION = 300

function readQuestion(formData: FormData): Parsed<{ label: string; kind: string; active: boolean }> {
  const label = text(formData, 'label')
  const kind = text(formData, 'kind')
  if (!label) return { value: null, error: 'Vui lòng nhập câu hỏi.' }
  if (label.length > MAX_QUESTION) return { value: null, error: `Câu hỏi tối đa ${MAX_QUESTION} ký tự.` }
  if (!(QUESTION_KINDS as readonly string[]).includes(kind)) return { value: null, error: 'Loại câu hỏi không hợp lệ.' }
  // Ô "Đang dùng" (checkbox) chỉ có ở form sửa; câu hỏi mới luôn bật
  return { value: { label, kind, active: formData.get('active') === 'on' }, error: null }
}

export async function createConsultQuestion(formData: FormData) {
  const { value, error } = readQuestion(formData)
  return run(
    'Đã thêm câu hỏi.',
    async () => {
      const supabase = createClient()
      const { data: last } = await supabase.from('consult_questions').select('sort_order').order('sort_order', { ascending: false }).limit(1)
      return supabase
        .from('consult_questions')
        .insert({ ...value!, active: true, sort_order: (last?.[0]?.sort_order ?? 0) + 1 })
        .select('id')
    },
    error
  )
}

export async function updateConsultQuestion(questionId: string, formData: FormData) {
  const { value, error } = readQuestion(formData)
  return run(
    'Đã lưu câu hỏi.',
    () => createClient().from('consult_questions').update(value!).eq('id', questionId).select('id'),
    checkId(questionId, 'câu hỏi') ?? error
  )
}

export async function deleteConsultQuestion(questionId: string) {
  return run(
    'Đã xóa câu hỏi.',
    () => createClient().from('consult_questions').delete().eq('id', questionId).select('id'),
    checkId(questionId, 'câu hỏi')
  )
}

// Đổi chỗ câu hỏi với câu liền trước / liền sau (đánh lại thứ tự 1…n)
export async function moveConsultQuestion(questionId: string, direction: 'up' | 'down') {
  return run(
    'Đã đổi thứ tự câu hỏi.',
    async () => {
      const supabase = createClient()
      const { data } = await supabase.from('consult_questions').select('id, sort_order').order('sort_order').order('created_at')
      const questions = data ?? []
      const index = questions.findIndex((x) => x.id === questionId)
      const target = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || target < 0 || target >= questions.length) return { data: [], error: null }
      ;[questions[index], questions[target]] = [questions[target], questions[index]]
      for (const [i, q] of questions.entries()) {
        if (q.sort_order === i + 1) continue
        const { error } = await supabase.from('consult_questions').update({ sort_order: i + 1 }).eq('id', q.id)
        if (error) return { data: null, error }
      }
      return { data: [questionId], error: null }
    },
    checkId(questionId, 'câu hỏi') ?? (direction === 'up' || direction === 'down' ? null : 'Hướng không hợp lệ.')
  )
}

// ---------- Phân quyền ----------

const roleMessages: Record<Role, string> = {
  admin: 'Đã cấp quyền admin.',
  staff: 'Đã chuyển vai trò thành Nhân viên.',
  user: 'Đã chuyển vai trò thành Bệnh nhân.',
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
  const skeleton = readSkeleton(formData)
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
      const result = await supabase.from('courses').insert({ ...value!, price: value!.price ?? 0, cover_image }).select('id')
      if (result.error) {
        await removeCover(cover_image)
        return result
      }
      // Chương trình có học phí: tạo sẵn gói 1 tháng (12 buổi) theo học phí nhập, thêm gói khác ở bảng gói
      if (value!.kind === 'program' && value!.price) {
        const { error: planError } = await supabase
          .from('course_plans')
          .insert({ course_id: result.data[0].id, months: 1, sessions: SESSIONS_PER_MONTH, price: value!.price })
        if (planError) return { data: null, error: { message: `Đã tạo khóa nhưng chưa tạo được gói 1 tháng: ${planError.message}` } }
      }
      // Khung buổi tập "N buổi × M bài" nhập kèm khi tạo khóa (không bắt buộc)
      if (skeleton.value && value!.kind !== 'premium') {
        const built = await insertSkeleton(supabase, result.data[0].id, skeleton.value.sessions, skeleton.value.lessons)
        if (built.error) return { data: null, error: { message: `Đã tạo khóa nhưng chưa tạo được khung buổi tập: ${built.error.message}` } }
      }
      return result
    },
    error ?? cover.error ?? skeleton.error
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
      const { price, ...rest } = value!
      const result = await supabase
        .from('courses')
        .update(price === null ? { ...rest, cover_image } : { ...rest, price, cover_image })
        .eq('id', courseId)
        .select('id')
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

// ---------- Buổi tập (ADR-013) ----------

const MAX_SKELETON_SESSIONS = 200
const MAX_LESSONS_PER_SESSION = 20
const MAX_SESSIONS = 500

type SupabaseServer = ReturnType<typeof createClient>

// Các buổi của khóa theo thứ tự hiển thị
async function sessionsOf(supabase: SupabaseServer, courseId: string) {
  const { data } = await supabase
    .from('course_sessions')
    .select('id, title, description, sort_order')
    .eq('course_id', courseId)
    .order('sort_order')
    .order('created_at')
  return data ?? []
}

// Tạo khung "N buổi × M bài" nối tiếp sau buổi cuối hiện có: Buổi k, mỗi buổi Bài 1…M chưa có video
async function insertSkeleton(supabase: SupabaseServer, courseId: string, sessionCount: number, lessonsPerSession: number) {
  const existing = await sessionsOf(supabase, courseId)
  if (existing.length + sessionCount > MAX_SESSIONS) {
    return { data: null, error: { message: `Mỗi khóa tối đa ${MAX_SESSIONS} buổi (hiện có ${existing.length}).` } }
  }
  const start = existing.length
  const lastOrder = existing.at(-1)?.sort_order ?? 0
  const { data: sessions, error } = await supabase
    .from('course_sessions')
    .insert(
      Array.from({ length: sessionCount }, (_, i) => ({
        course_id: courseId,
        title: `Buổi ${start + i + 1}`,
        sort_order: Math.max(lastOrder, start) + i + 1,
      }))
    )
    .select('id, sort_order')
  if (error || !sessions) return { data: null, error }
  const lessons = sessions.flatMap((session) =>
    Array.from({ length: lessonsPerSession }, (_, j) => ({
      course_id: courseId,
      session_id: session.id,
      title: `Bài ${j + 1}`,
      sort_order: j + 1,
    }))
  )
  const result = await supabase.from('lessons').insert(lessons).select('id')
  return result.error ? result : { data: sessions, error: null }
}

function readSkeleton(formData: FormData): Parsed<{ sessions: number; lessons: number } | null> {
  if (!text(formData, 'session_count') && !text(formData, 'lessons_per_session')) return { value: null, error: null }
  const sessions = readInt(formData, 'session_count', 'Số buổi', 1, MAX_SKELETON_SESSIONS)
  if (typeof sessions === 'string') return { value: null, error: sessions }
  const lessons = readInt(formData, 'lessons_per_session', 'Số bài mỗi buổi', 1, MAX_LESSONS_PER_SESSION)
  if (typeof lessons === 'string') return { value: null, error: lessons }
  if (!sessions || !lessons) return { value: null, error: 'Vui lòng nhập số buổi và số bài mỗi buổi.' }
  return { value: { sessions, lessons }, error: null }
}

export async function generateSkeleton(courseId: string, formData: FormData) {
  const { value, error } = readSkeleton(formData)
  return run(
    `Đã tạo ${value?.sessions} buổi × ${value?.lessons} bài.`,
    () => insertSkeleton(createClient(), courseId, value!.sessions, value!.lessons),
    checkId(courseId, 'khóa học') ?? error ?? (value ? null : 'Vui lòng nhập số buổi và số bài mỗi buổi.')
  )
}

function readSession(formData: FormData): Parsed<{ title: string; description: string | null }> {
  return readTitleAndDescription(formData, 'buổi')
}

export async function createSession(courseId: string, formData: FormData) {
  const { value, error } = readSession(formData)
  return run(
    `Đã thêm "${value?.title}".`,
    async () => {
      const supabase = createClient()
      const existing = await sessionsOf(supabase, courseId)
      const sortOrder = Math.max(existing.at(-1)?.sort_order ?? 0, existing.length) + 1
      return supabase.from('course_sessions').insert({ ...value!, course_id: courseId, sort_order: sortOrder }).select('id')
    },
    checkId(courseId, 'khóa học') ?? error
  )
}

export async function updateSession(sessionId: string, formData: FormData) {
  const { value, error } = readSession(formData)
  return run(
    'Đã lưu buổi.',
    () => createClient().from('course_sessions').update(value!).eq('id', sessionId).select('id'),
    checkId(sessionId, 'buổi') ?? error
  )
}

// Xóa buổi xóa luôn các bài của buổi (và tiến độ đã tick của các bài đó)
export async function deleteSession(sessionId: string) {
  return run(
    'Đã xóa buổi và các bài của buổi.',
    () => createClient().from('course_sessions').delete().eq('id', sessionId).select('id'),
    checkId(sessionId, 'buổi')
  )
}

// Đổi chỗ buổi với buổi liền trước / liền sau (đánh lại thứ tự 1…n cho cả khóa)
export async function moveSession(courseId: string, sessionId: string, direction: 'up' | 'down') {
  return run(
    'Đã đổi thứ tự buổi.',
    async () => {
      const supabase = createClient()
      const sessions = await sessionsOf(supabase, courseId)
      const index = sessions.findIndex((x) => x.id === sessionId)
      const target = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || target < 0 || target >= sessions.length) return { data: [], error: null }
      ;[sessions[index], sessions[target]] = [sessions[target], sessions[index]]
      for (const [i, session] of sessions.entries()) {
        if (session.sort_order === i + 1) continue
        const { error } = await supabase.from('course_sessions').update({ sort_order: i + 1 }).eq('id', session.id)
        if (error) return { data: null, error }
      }
      return { data: [sessionId], error: null }
    },
    checkId(courseId, 'khóa học') ?? checkId(sessionId, 'buổi') ?? (direction === 'up' || direction === 'down' ? null : 'Hướng không hợp lệ.')
  )
}

// Sao chép buổi (tên, mô tả, các bài kèm link video) thành buổi mới ở cuối khóa
export async function duplicateSession(courseId: string, sessionId: string) {
  return run(
    'Đã sao chép buổi.',
    async () => {
      const supabase = createClient()
      const sessions = await sessionsOf(supabase, courseId)
      const source = sessions.find((x) => x.id === sessionId)
      if (!source) return { data: [], error: null }
      const { data: copy, error } = await supabase
        .from('course_sessions')
        .insert({
          course_id: courseId,
          title: `Buổi ${sessions.length + 1}`,
          description: source.description,
          sort_order: Math.max(sessions.at(-1)?.sort_order ?? 0, sessions.length) + 1,
        })
        .select('id')
        .single()
      if (error || !copy) return { data: null, error }
      const { data: lessons } = await supabase
        .from('lessons')
        .select('title, description, video_url, sort_order')
        .eq('session_id', sessionId)
      if (!lessons?.length) return { data: [copy.id], error: null }
      return supabase
        .from('lessons')
        .insert(lessons.map((l) => ({ ...l, course_id: courseId, session_id: copy.id })))
        .select('id')
    },
    checkId(courseId, 'khóa học') ?? checkId(sessionId, 'buổi')
  )
}

// ---------- Bài học (bài tập trong buổi) ----------

// Buổi của bài: theo ô chọn; không chọn thì vào buổi cuối (khóa chưa có buổi nào thì tạo "Buổi 1")
async function resolveSession(supabase: SupabaseServer, courseId: string, sessionId: string) {
  if (sessionId) return { id: sessionId, error: null }
  const last = (await sessionsOf(supabase, courseId)).at(-1)
  if (last) return { id: last.id, error: null }
  const { data, error } = await supabase
    .from('course_sessions')
    .insert({ course_id: courseId, title: 'Buổi 1', sort_order: 1 })
    .select('id')
    .single()
  return { id: data?.id ?? null, error }
}

export async function createLesson(courseId: string, formData: FormData) {
  const { value, error } = readLesson(formData)
  const sessionId = text(formData, 'session_id')
  return run(
    `Đã thêm bài học "${value?.title}".`,
    async () => {
      const supabase = createClient()
      const session = await resolveSession(supabase, courseId, sessionId)
      if (session.error || !session.id) return { data: null, error: session.error ?? { message: 'Không tạo được buổi.' } }
      return supabase.from('lessons').insert({ ...value!, course_id: courseId, session_id: session.id }).select('id')
    },
    checkId(courseId, 'khóa học') ?? (sessionId ? checkId(sessionId, 'buổi') : null) ?? error
  )
}

export async function updateLesson(lessonId: string, formData: FormData) {
  const { value, error } = readLesson(formData)
  const sessionId = text(formData, 'session_id')
  return run(
    'Đã lưu bài học.',
    () =>
      createClient()
        .from('lessons')
        .update(sessionId ? { ...value!, session_id: sessionId } : value!)
        .eq('id', lessonId)
        .select('id'),
    checkId(lessonId, 'bài học') ?? (sessionId ? checkId(sessionId, 'buổi') : null) ?? error
  )
}

export async function deleteLesson(lessonId: string) {
  return run(
    'Đã xóa bài học.',
    () => createClient().from('lessons').delete().eq('id', lessonId).select('id'),
    checkId(lessonId, 'bài học')
  )
}
