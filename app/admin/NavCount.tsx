import { createClient } from '@/lib/supabase/server'

// Số việc cần xử lý cạnh mục menu quản trị (UI-02). Mỗi số là 1 truy vấn đếm (head, không tải dòng),
// quyền theo RLS nhân viên; không gọi dashboard_stats() để tránh tính tiến độ mỗi lần mở trang (RK-30).
// Được bọc Suspense ở layout nên trang không phải chờ các số này.
const counters = {
  registrations: { table: 'registrations', status: 'pending', hint: 'đơn chờ duyệt' },
  consultations: { table: 'consultations', status: 'new', hint: 'phiếu mới' },
  leads: { table: 'leads', status: 'new', hint: 'khách mới' },
} as const

export type NavCountKind = keyof typeof counters

export default async function NavCount({ kind }: { kind: NavCountKind }) {
  const { table, status, hint } = counters[kind]
  let query = (await createClient()).from(table).select('id', { count: 'exact', head: true }).eq('status', status)
  // Khách chỉ bấm "Mở Zalo" (chưa để lại SĐT) không tính là việc cần gọi – giống dashboard_stats()
  if (kind === 'leads') query = query.not('phone', 'is', null)
  const { count } = await query
  if (!count) return null
  return (
    <span
      data-testid={`nav-count-${kind}`}
      title={`${count} ${hint}`}
      className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-ocean-600 px-1.5 text-[11px] font-bold leading-none text-white"
    >
      {count > 99 ? '99+' : count}
      <span className="sr-only"> {hint}</span>
    </span>
  )
}
