import 'server-only'
import type { createClient } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createClient>>

// Khách hàng còn đang dùng dịch vụ không (QL-04, Đợt 26): gói còn hạn (đơn đã duyệt của khóa còn tồn tại, chưa hết hạn –
// đơn cũ không có hạn coi như còn học) và đơn chờ duyệt. Còn thì không cho xóa: thu hồi gói / từ chối đơn trước.
// Dùng chung cho hồ sơ khách hàng (hiện lý do) và server action (kiểm tra lại trước khi xóa).
export async function customerUsage(supabase: Supabase, userId: string) {
  const now = new Date().toISOString()
  const [active, pending] = await Promise.all([
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved')
      .not('course_id', 'is', null)
      .or(`access_until.is.null,access_until.gt.${now}`),
    supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
  ])
  if (active.error || pending.error) throw new Error('Không kiểm tra được gói của khách hàng, vui lòng thử lại.')
  return { active: active.count ?? 0, pending: pending.count ?? 0 }
}

export function customerUsageMessage(u: { active: number; pending: number }) {
  if (!u.active && !u.pending) return null
  const parts = [u.active && `${u.active} gói còn hạn`, u.pending && `${u.pending} đơn chờ duyệt`].filter(Boolean)
  return `Không xóa được: khách hàng còn ${parts.join(' và ')}. Hãy thu hồi gói / từ chối đơn ở mục Đơn đăng ký (hoặc chờ gói hết hạn) rồi xóa.`
}
