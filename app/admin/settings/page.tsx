import { redirect } from 'next/navigation'

// Cài đặt: hiện chỉ có mẫu phiếu tham vấn
export default function AdminSettingsPage() {
  redirect('/admin/settings/consultation')
}
