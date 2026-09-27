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
