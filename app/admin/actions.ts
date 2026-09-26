'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { isSupportedVideoUrl } from '@/lib/video'
import type { ActionResult } from '@/lib/action-result'

type DbResult = { data: unknown[] | null; error: { message: string } | null }
type Parsed<T> = { value: T; error: null } | { value: null; error: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_TITLE = 200
const MAX_DESCRIPTION = 5000
const MAX_PRICE = 1_000_000_000
const MAX_SORT_ORDER = 100_000

// Chạy thao tác admin: kiểm tra quyền, dừng nếu dữ liệu nhập không hợp lệ, báo lỗi nếu database lỗi
// hoặc không có dòng nào bị ảnh hưởng (VD: dữ liệu đã bị xóa), làm mới toàn bộ trang khi thành công.
async function run(
  message: string,
  op: () => PromiseLike<DbResult>,
  invalid: string | null = null
): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (invalid) return { ok: false, error: invalid }
    const { data, error } = await op()
    if (error) return { ok: false, error: error.message }
    if (!data?.length) return { ok: false, error: 'Không tìm thấy dữ liệu, vui lòng tải lại trang.' }
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

type CourseInput = { title: string; description: string | null; price: number; sort_order: number; status: string }

function readCourse(formData: FormData): Parsed<CourseInput> {
  const base = readTitleAndDescription(formData, 'khóa học')
  if (base.error !== null) return base
  const price = readInt(formData, 'price', 'Học phí', 0, MAX_PRICE)
  if (typeof price === 'string') return { value: null, error: price }
  const sortOrder = readInt(formData, 'sort_order', 'Thứ tự hiển thị', -MAX_SORT_ORDER, MAX_SORT_ORDER)
  if (typeof sortOrder === 'string') return { value: null, error: sortOrder }
  const status = text(formData, 'status') || 'published'
  if (status !== 'draft' && status !== 'published') return { value: null, error: 'Trạng thái khóa học không hợp lệ.' }
  return { value: { ...base.value, price, sort_order: sortOrder, status }, error: null }
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

export async function setRegistrationStatus(
  registrationId: string,
  status: 'approved' | 'rejected' | 'pending'
) {
  const invalid = checkId(registrationId, 'đơn') ?? (Object.hasOwn(statusMessages, status) ? null : 'Trạng thái đơn không hợp lệ.')
  return run(
    statusMessages[status],
    () => {
      let query = createClient()
        .from('registrations')
        .update({ status, reviewed_at: status === 'pending' ? null : new Date().toISOString() })
        .eq('id', registrationId)
      // Khóa học đã bị xóa thì không duyệt được (đơn chỉ còn là lịch sử thanh toán)
      if (status === 'approved') query = query.not('course_id', 'is', null)
      return query.select('id')
    },
    invalid
  )
}

// ---------- Khóa học ----------

export async function createCourse(formData: FormData) {
  const { value, error } = readCourse(formData)
  return run(`Đã thêm khóa học "${value?.title}".`, () => createClient().from('courses').insert(value!).select('id'), error)
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { value, error } = readCourse(formData)
  return run(
    'Đã lưu thông tin khóa học.',
    () => createClient().from('courses').update(value!).eq('id', courseId).select('id'),
    checkId(courseId, 'khóa học') ?? error
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
    () => createClient().from('courses').delete().eq('id', courseId).select('id'),
    checkId(courseId, 'khóa học')
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
