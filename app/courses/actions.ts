'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setFlash } from '@/lib/flash'
import type { ActionResult } from '@/lib/action-result'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// "Hoàn thành & bài tiếp theo": tick bài đang tập (RLS chỉ cho tick bài đang xem được – buổi đã mở, còn hạn),
// rồi chuyển sang bài kế tiếp nếu đã mở; hết bài đã mua thì ở lại bài hiện tại và hiện thẻ chúc mừng.
export async function completeLessonAction(courseId: string, lessonId: string, nextLessonId: string | null) {
  if (!UUID.test(courseId) || !UUID.test(lessonId)) {
    setFlash('Bài học không hợp lệ, vui lòng tải lại trang.', 'error')
    redirect('/courses')
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/courses/${courseId}/${lessonId}`)}`)

  const { error } = await supabase.from('lesson_progress').insert({ user_id: user.id, lesson_id: lessonId, course_id: courseId })
  // 23505: đã tick từ trước (bấm 2 lần) – coi như thành công
  if (error && error.code !== '23505') {
    setFlash('Chưa lưu được tiến độ: bài này đang bị khóa hoặc gói tập đã hết hạn.', 'error')
    redirect(`/courses/${courseId}/${lessonId}`)
  }
  revalidatePath(`/courses/${courseId}`, 'layout')
  revalidatePath('/courses')

  if (nextLessonId && UUID.test(nextLessonId)) {
    const { data: canView } = await supabase.rpc('can_view_lesson', { target_lesson: nextLessonId })
    if (canView) {
      setFlash('Đã hoàn thành bài tập. Tiếp tục bài tiếp theo!')
      redirect(`/courses/${courseId}/${nextLessonId}`)
    }
  }
  setFlash('Đã hoàn thành bài tập.')
  redirect(`/courses/${courseId}/${lessonId}?finished=1`)
}

// Bỏ đánh dấu đã tập (có hỏi xác nhận ở giao diện). Buổi sau có thể bị khóa lại cho tới khi tick lại (BR-90).
export async function uncompleteLessonAction(courseId: string, lessonId: string): Promise<ActionResult> {
  if (!UUID.test(courseId) || !UUID.test(lessonId)) return { ok: false, error: 'Bài học không hợp lệ, vui lòng tải lại trang.' }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' }
  const { data, error } = await supabase
    .from('lesson_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .select('lesson_id')
  if (error) return { ok: false, error: error.message }
  if (!data?.length) return { ok: false, error: 'Không bỏ đánh dấu được (bài đang bị khóa hoặc gói tập đã hết hạn).' }
  revalidatePath(`/courses/${courseId}`, 'layout')
  revalidatePath('/courses')
  return { ok: true, message: 'Đã bỏ đánh dấu bài tập.' }
}
