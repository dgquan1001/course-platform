import { redirect } from 'next/navigation'

// Trang "Học viên" cũ đổi thành "Khách hàng" (v0.2 Đợt 11): giữ đường dẫn cũ, chuyển kèm bộ lọc
export default async function AdminUsersPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const searchParams = await props.searchParams
  const params = new URLSearchParams()
  if (searchParams.q) params.set('q', searchParams.q)
  const query = params.toString()
  // Tab "Nhân viên & Admin" cũ → danh mục Nhân viên (Đợt 26)
  redirect(`${searchParams.role === 'team' ? '/admin/staff' : '/admin/customers'}${query ? `?${query}` : ''}`)
}
