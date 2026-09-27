'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import { setFlash } from '@/lib/flash'
import { LIMITS, withinLimit } from '@/lib/rate-limit'
import { siteConfig } from '@/lib/site-config'
import { CONSULT_ORIGINS, type ConsultAnswer, type QuestionKind } from '@/lib/consultation'
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

// ---------- Phiếu tham vấn (ADR-015, BR-100 → BR-103) ----------

export type ConsultationState = { error: string | null }

const MAX_TEXT_ANSWER = 500
const MAX_CONSULT_NOTE = 1000

// Bệnh nhân gửi phiếu bất cứ lúc nào: trả lời các câu hỏi đang dùng (Có/Không và thang 0–10 bắt buộc), chọn chương trình
// đang học (không bắt buộc). Phiếu lưu ảnh chụp câu hỏi + câu trả lời; tối đa 5 phiếu / ngày; ghi bằng service role.
export async function submitConsultationAction(_prev: ConsultationState, formData: FormData): Promise<ConsultationState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' }
  const admin = createAdminClient()

  const { data: questions } = await admin
    .from('consult_questions')
    .select('id, label, kind')
    .eq('active', true)
    .order('sort_order')
    .order('created_at')
  const answers: ConsultAnswer[] = []
  for (const q of (questions ?? []) as { id: string; label: string; kind: QuestionKind }[]) {
    const raw = String(formData.get(`q_${q.id}`) ?? '').trim()
    if (q.kind === 'check') {
      if (raw !== 'yes' && raw !== 'no') return { error: `Vui lòng trả lời: "${q.label}".` }
      answers.push({ label: q.label, kind: q.kind, value: raw === 'yes' })
    } else if (q.kind === 'scale') {
      if (!/^(10|[0-9])$/.test(raw)) return { error: `Vui lòng chọn mức 0 – 10 cho: "${q.label}".` }
      answers.push({ label: q.label, kind: q.kind, value: Number(raw) })
    } else {
      if (raw.length > MAX_TEXT_ANSWER) return { error: `Câu trả lời "${q.label}" tối đa ${MAX_TEXT_ANSWER} ký tự.` }
      answers.push({ label: q.label, kind: q.kind, value: raw || null })
    }
  }
  const note = String(formData.get('note') ?? '').trim()
  if (note.length > MAX_CONSULT_NOTE) return { error: `Ghi chú tối đa ${MAX_CONSULT_NOTE} ký tự.` }
  if (!answers.length && !note) return { error: 'Vui lòng nhập nội dung cần tư vấn.' }
  const originRaw = String(formData.get('origin') ?? '')
  const origin = (CONSULT_ORIGINS as readonly string[]).includes(originRaw) ? originRaw : 'manual'

  // Chương trình đang học: phải là chương trình bệnh nhân đã được duyệt (kể cả đã hết hạn)
  const courseId = String(formData.get('courseId') ?? '')
  let course: { id: string; title: string } | null = null
  if (UUID.test(courseId)) {
    const { data } = await admin
      .from('registrations')
      .select('course_id, courses(title)')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'approved')
      .limit(1)
    const title = (data?.[0]?.courses as unknown as { title: string } | null)?.title
    if (title) course = { id: courseId, title }
  }

  if (!(await withinLimit(`consult:${user.id}`, LIMITS.consultation))) {
    return { error: `Bạn đã gửi ${LIMITS.consultation.limit} phiếu hôm nay. Vui lòng gọi ${siteConfig.hotline} nếu cần hỗ trợ gấp.` }
  }

  const { error } = await admin.from('consultations').insert({
    user_id: user.id,
    full_name: user.fullName,
    phone: user.phone,
    course_id: course?.id ?? null,
    course_title: course?.title ?? null,
    answers,
    note: note || null,
    origin,
  })
  if (error) return { error: `Không gửi được phiếu: ${error.message}` }

  revalidatePath('/courses')
  revalidatePath('/admin', 'layout')
  setFlash('Đã gửi phiếu tham vấn. Nhân viên sẽ liên hệ bạn qua điện thoại / Zalo.')
  redirect('/courses?consultation=sent')
}
