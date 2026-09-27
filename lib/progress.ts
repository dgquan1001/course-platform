import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { buildSessions, type OutlineRow, type OutlineSession } from '@/lib/courses'

export type CourseProgress = { done: number; total: number; next_lesson_id: string | null; purchased: number | null; last_activity: string | null }

// Tiến độ của người đang đăng nhập trong một khóa (hàm course_progress trong database)
export async function getCourseProgress(courseId: string): Promise<CourseProgress> {
  const { data } = await createClient().rpc('course_progress', { target_course: courseId })
  const row = (data as CourseProgress[] | null)?.[0]
  return row ?? { done: 0, total: 0, next_lesson_id: null, purchased: null, last_activity: null }
}

export type Learning = {
  course: { id: string; title: string; description: string | null; kind: string }
  user: Awaited<ReturnType<typeof getCurrentUser>>
  // preview: nhân viên / admin xem trước (mở hết, không tick) · free: khóa miễn phí · program: theo gói, mở lần lượt
  mode: 'preview' | 'free' | 'program'
  hasAccess: boolean
  canTick: boolean
  done: Set<string>
  sessions: OutlineSession[]
  lessons: OutlineRow[]
  progress: CourseProgress
}

// Dữ liệu học tập của một khóa cho trang khóa / trình học: đề cương theo buổi (không có link video),
// bài đã tick, số buổi đã mua, trạng thái khóa / mở từng buổi (giống can_view_lesson trong database).
export async function loadLearning(courseId: string): Promise<Learning | null> {
  const supabase = createClient()
  const [{ data: course }, user] = await Promise.all([
    supabase.from('courses').select('id, title, description, kind').eq('id', courseId).maybeSingle(),
    getCurrentUser(),
  ])
  // Không đọc được khóa (không tồn tại / đang ẩn mà không có quyền) hoặc khóa premium (không có bài học)
  if (!course) return null
  if (course.kind === 'premium') return { course, user } as Learning

  const [{ data: outline }, { data: access }, { data: purchased }, { data: ticked }, progress] = await Promise.all([
    supabase.rpc('course_outline', { target_course: courseId }),
    supabase.rpc('has_course_access', { target_course: courseId }),
    user ? supabase.rpc('purchased_sessions', { target_course: courseId }) : Promise.resolve({ data: null }),
    user
      ? supabase.from('lesson_progress').select('lesson_id').eq('course_id', courseId).eq('user_id', user.id)
      : Promise.resolve({ data: [] as { lesson_id: string }[] }),
    user ? getCourseProgress(courseId) : Promise.resolve(null),
  ])

  const mode = user?.isStaff ? 'preview' : course.kind === 'free' ? 'free' : 'program'
  const hasAccess = mode !== 'program' || !!access
  const done = new Set((ticked ?? []).map((t) => t.lesson_id))
  const lessons = (outline ?? []) as OutlineRow[]
  const sessions = buildSessions(lessons, {
    done,
    open: mode === 'program' ? (hasAccess ? 'sequential' : 'none') : 'all',
    purchased: mode === 'program' ? ((purchased as number | null) ?? null) : null,
  })
  return {
    course,
    user,
    mode,
    hasAccess,
    // Bệnh nhân đã đăng nhập tick được khi bài đang xem được; nhân viên / admin chỉ xem trước
    canTick: !!user && mode !== 'preview' && hasAccess,
    done,
    sessions,
    lessons,
    progress: progress ?? { done: 0, total: lessons.length, next_lesson_id: lessons[0]?.id ?? null, purchased: null, last_activity: null },
  }
}

// "Buổi X – Bài Y" của một bài trong đề cương
export function lessonLabel(sessions: OutlineSession[], lessonId: string | null) {
  for (const s of sessions) {
    const index = s.lessons.findIndex((l) => l.id === lessonId)
    if (index >= 0) return `${s.title} – Bài ${index + 1}`
  }
  return null
}
