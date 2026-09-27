import { redirect } from 'next/navigation'

// Trang Tổng quan (dashboard) sẽ đặt ở đây; hiện chuyển tới bảng đơn đăng ký.
// Giữ bộ lọc cũ: /admin?status=approved → /admin/registrations?status=approved
export default function AdminHomePage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status ? `?status=${encodeURIComponent(searchParams.status)}` : ''
  redirect(`/admin/registrations${status}`)
}
