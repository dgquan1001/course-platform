'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import type { ActionResult } from '@/lib/action-result'

type DbResult = { data: unknown[] | null; error: { message: string } | null }

// Chạy thao tác admin: kiểm tra quyền, báo lỗi nếu database lỗi hoặc không có dòng nào
// bị ảnh hưởng (VD: dữ liệu đã bị xóa), làm mới toàn bộ trang khi thành công.
async function run(message: string, op: () => PromiseLike<DbResult>): Promise<ActionResult> {
  try {
    await requireAdmin()
    const { data, error } = await op()
    if (error) return { ok: false, error: error.message }
    if (!data?.length) return { ok: false, error: 'Không tìm thấy dữ liệu, vui lòng tải lại trang.' }
    revalidatePath('/', 'layout')
    return { ok: true, message }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.' }
  }
}

function readCourse(formData: FormData) {
  return {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    price: Number(formData.get('price') || 0),
    sort_order: Number(formData.get('sort_order') || 0),
    status: formData.get('status') === 'draft' ? 'draft' : 'published',
  }
}

function readLesson(formData: FormData) {
  return {
    title: String(formData.get('title') ?? '').trim(),
    video_url: String(formData.get('video_url') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    sort_order: Number(formData.get('sort_order') || 0),
  }
}

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
  return run(statusMessages[status], () =>
    createClient()
      .from('registrations')
      .update({ status, reviewed_at: status === 'pending' ? null : new Date().toISOString() })
      .eq('id', registrationId)
      .select('id')
  )
}

// ---------- Khóa học ----------

export async function createCourse(formData: FormData) {
  const course = readCourse(formData)
  return run(`Đã thêm khóa học "${course.title}".`, () =>
    createClient().from('courses').insert(course).select('id')
  )
}

export async function updateCourse(courseId: string, formData: FormData) {
  return run('Đã lưu thông tin khóa học.', () =>
    createClient().from('courses').update(readCourse(formData)).eq('id', courseId).select('id')
  )
}

export async function setCourseStatus(courseId: string, status: 'draft' | 'published') {
  return run(
    status === 'published' ? 'Khóa học đã hiển thị trên website.' : 'Đã ẩn khóa học khỏi website.',
    () => createClient().from('courses').update({ status }).eq('id', courseId).select('id')
  )
}

export async function deleteCourse(courseId: string) {
  return run('Đã xóa khóa học.', () =>
    createClient().from('courses').delete().eq('id', courseId).select('id')
  )
}

// ---------- Bài học ----------

export async function createLesson(courseId: string, formData: FormData) {
  const lesson = readLesson(formData)
  return run(`Đã thêm bài học "${lesson.title}".`, () =>
    createClient().from('lessons').insert({ ...lesson, course_id: courseId }).select('id')
  )
}

export async function updateLesson(lessonId: string, formData: FormData) {
  return run('Đã lưu bài học.', () =>
    createClient().from('lessons').update(readLesson(formData)).eq('id', lessonId).select('id')
  )
}

export async function deleteLesson(lessonId: string) {
  return run('Đã xóa bài học.', () =>
    createClient().from('lessons').delete().eq('id', lessonId).select('id')
  )
}
