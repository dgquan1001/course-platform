// Loại khóa, nhóm bệnh và nhãn hiển thị (dùng chung cho trang công khai, trang học và quản trị)

// free: miễn phí, ai cũng xem · program: chương trình trả phí · premium: 1:4, 1:2, 1:1 – chỉ liên hệ Zalo
export type CourseKind = 'free' | 'program' | 'premium'
export type CourseCategory = 'veo_lung' | 'veo_nguc'

export const COURSE_KINDS: { value: CourseKind; label: string }[] = [
  { value: 'program', label: 'Chương trình phục hồi (trả phí)' },
  { value: 'free', label: 'Miễn phí' },
  { value: 'premium', label: 'Premium chuyên sâu (liên hệ Zalo)' },
]

export const COURSE_CATEGORIES: { value: CourseCategory; label: string }[] = [
  { value: 'veo_lung', label: 'Vẹo lưng' },
  { value: 'veo_nguc', label: 'Vẹo ngực' },
]

export const isCourseKind = (s: string): s is CourseKind => COURSE_KINDS.some((k) => k.value === s)
export const isCourseCategory = (s: string): s is CourseCategory => COURSE_CATEGORIES.some((c) => c.value === s)

export const categoryLabel = (c: string | null) => COURSE_CATEGORIES.find((x) => x.value === c)?.label ?? null

// Nhãn nhỏ trên thẻ khóa học
export function kindBadge(kind: string, category: string | null) {
  if (kind === 'free') return { label: 'Miễn phí', className: 'bg-emerald-100 text-emerald-700' }
  if (kind === 'premium') return { label: 'Premium', className: 'bg-gold-200 text-ocean-950' }
  return { label: categoryLabel(category) ?? 'Chương trình', className: 'bg-ocean-100 text-ocean-700' }
}

// ---------- Gói theo thời hạn (ADR-012) ----------

export const PLAN_MONTHS = [1, 3, 6, 12] as const
export const SESSIONS_PER_MONTH = 12

export type Plan = { id: string; months: number; sessions: number; price: number; active?: boolean }

export const planLabel = (months: number) => `${months} tháng`

// Gói đang bán, sắp theo số tháng tăng dần
export const sortPlans = <T extends { months: number }>(plans: T[] | null | undefined) =>
  [...(plans ?? [])].sort((a, b) => a.months - b.months)

// Hạn học còn bao nhiêu ngày (làm tròn lên); null = không thời hạn
export function daysLeft(accessUntil: string | null) {
  if (!accessUntil) return null
  return Math.ceil((new Date(accessUntil).getTime() - Date.now()) / 86_400_000)
}

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })
