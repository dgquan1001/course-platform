import { createClient } from '@supabase/supabase-js'
import { sortPlans, type CourseKind, type OutlineRow, type Plan } from '@/lib/courses'

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
  // Gói đang bán (chỉ chương trình), sắp theo số tháng
  plans: Plan[]
}

export type PublicCourseDetail = PublicCourse & { outcomes: string[] }

export type OutlineLesson = OutlineRow

const PUBLIC_FIELDS = 'id, title, description, price, kind, category, summary, cover_image, plans:course_plans(id, months, sessions, price)'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Mọi khóa đang hiển thị (cả 3 loại) cho trang chủ
export async function getPublishedCourses(): Promise<PublicCourse[]> {
  const { data } = await createPublicClient()
    .from('courses')
    .select(PUBLIC_FIELDS)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  return ((data as PublicCourse[]) ?? []).map((c) => ({ ...c, plans: sortPlans(c.plans) }))
}

// Khóa nhận đơn đăng ký cho box đăng ký: chương trình trả phí có ít nhất 1 gói đang bán
export async function getRegistrableCourses(): Promise<PublicCourse[]> {
  return (await getPublishedCourses()).filter((c) => c.kind === 'program' && c.plans.length > 0)
}

export async function getPublicCourse(id: string): Promise<PublicCourseDetail | null> {
  if (!UUID.test(id)) return null
  const { data } = await createPublicClient()
    .from('courses')
    .select(`${PUBLIC_FIELDS}, outcomes`)
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()
  const course = data as PublicCourseDetail | null
  return course ? { ...course, plans: sortPlans(course.plans) } : null
}

// Đề cương công khai: tên và mô tả bài, không có link video (hàm course_outline trong database)
export async function getCourseOutline(id: string): Promise<OutlineLesson[]> {
  const { data } = await createPublicClient().rpc('course_outline', { target_course: id })
  return (data as OutlineLesson[]) ?? []
}
