import { createClient } from '@/lib/supabase/server'
import type { PlanOption } from './GrantFields'

// Gói đang bán của mọi chương trình trả phí (kể cả chương trình đang ẩn: nhân viên vẫn cấp / gia hạn được qua Zalo)
export async function getPlanOptions(): Promise<PlanOption[]> {
  const { data } = await createClient()
    .from('course_plans')
    .select('id, months, sessions, price, courses!inner(title, kind, status, sort_order)')
    .eq('active', true)
    .eq('courses.kind', 'program')
  type Row = { id: string; months: number; sessions: number; price: number; courses: { title: string; status: string; sort_order: number } }
  return ((data ?? []) as unknown as Row[])
    .sort((a, b) => a.courses.sort_order - b.courses.sort_order || a.courses.title.localeCompare(b.courses.title) || a.months - b.months)
    .map((p) => ({
      id: p.id,
      courseTitle: p.courses.status === 'draft' ? `${p.courses.title} (đang ẩn)` : p.courses.title,
      months: p.months,
      sessions: p.sessions,
      price: p.price,
    }))
}
