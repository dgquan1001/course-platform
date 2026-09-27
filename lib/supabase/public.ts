import { createClient } from '@supabase/supabase-js'
import type { CourseKind } from '@/lib/courses'

// Client ẩn danh không đọc cookie: dùng cho trang công khai để Next.js
// có thể cache (ISR) thay vì render lại mỗi request.
function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export type PublicCourse = {
  id: string
  title: string
  description: string | null
  price: number
  kind: CourseKind
  category: string | null
  summary: string | null
  cover_image: string | null
}

export type PublicCourseDetail = PublicCourse & { outcomes: string[] }

export type OutlineLesson = { id: string; title: string; description: string | null }

const PUBLIC_FIELDS = 'id, title, description, price, kind, category, summary, cover_image'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Mọi khóa đang hiển thị (cả 3 loại) cho trang chủ
export async function getPublishedCourses(): Promise<PublicCourse[]> {
  const { data } = await createPublicClient()
    .from('courses')
    .select(PUBLIC_FIELDS)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  return (data as PublicCourse[]) ?? []
}

// Khóa nhận đơn đăng ký (chương trình trả phí) cho box đăng ký
export async function getRegistrableCourses(): Promise<PublicCourse[]> {
  return (await getPublishedCourses()).filter((c) => c.kind === 'program')
}

export async function getPublicCourse(id: string): Promise<PublicCourseDetail | null> {
  if (!UUID.test(id)) return null
  const { data } = await createPublicClient()
    .from('courses')
    .select(`${PUBLIC_FIELDS}, outcomes`)
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()
  return (data as PublicCourseDetail | null) ?? null
}

// Đề cương công khai: tên và mô tả bài, không có link video (hàm course_outline trong database)
export async function getCourseOutline(id: string): Promise<OutlineLesson[]> {
  const { data } = await createPublicClient().rpc('course_outline', { target_course: id })
  return (data as OutlineLesson[]) ?? []
}
