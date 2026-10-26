import 'server-only'
import type { createClient } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createClient>>

// Khóa còn được dùng không (QL-08, Q-7): học viên có gói còn hạn (đơn đã duyệt, chưa hết hạn – đơn cũ không có hạn coi như còn học)
// và đơn chờ duyệt. Còn thì không cho xóa, chỉ cho Ẩn (học viên vẫn học tiếp – RV-01). Dùng chung cho trang sửa và server action.
export async function courseUsage(supabase: Supabase, courseId: string) {
  const now = new Date().toISOString()
  const [active, pending] = await Promise.all([
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'approved')
      .or(`access_until.is.null,access_until.gt.${now}`),
    supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('course_id', courseId).eq('status', 'pending'),
  ])
  return { active: active.count ?? 0, pending: pending.count ?? 0 }
}

export const usageBlocksDelete = (u: { active: number; pending: number }) => u.active > 0 || u.pending > 0

export function usageMessage(u: { active: number; pending: number }) {
  const parts = [u.active && `${u.active} học viên đang học (gói còn hạn)`, u.pending && `${u.pending} đơn chờ duyệt`].filter(Boolean)
  return `Không xóa được: khóa còn ${parts.join(' và ')}. Hãy "Ẩn khóa học" (học viên vẫn học tiếp) hoặc xử lý hết đơn / chờ gói hết hạn rồi xóa.`
}
