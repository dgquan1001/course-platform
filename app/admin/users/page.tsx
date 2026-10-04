import { redirect } from 'next/navigation'

// Trang "Học viên" cũ đổi thành "Bệnh nhân" (v0.2 Đợt 11): giữ đường dẫn cũ, chuyển kèm bộ lọc
export default async function AdminUsersPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const searchParams = await props.searchParams
  const params = new URLSearchParams()
  if (searchParams.q) params.set('q', searchParams.q)
  if (searchParams.role === 'team') params.set('role', 'team')
  const query = params.toString()
  redirect(`/admin/patients${query ? `?${query}` : ''}`)
}
