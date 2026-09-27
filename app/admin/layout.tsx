import type { Metadata } from 'next'
import { requireStaffPage } from '@/lib/auth'
import StatusBadge from '@/components/StatusBadge'
import AdminNav from './AdminNav'

export const metadata: Metadata = { title: 'Quản trị' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Chỉ nhân viên / admin (middleware đã chặn khách chưa đăng nhập; từng trang cũng tự kiểm tra, cache theo request)
  const user = await requireStaffPage()
  return (
    <main className="min-h-full bg-slate-50/60">
      <div className="border-b border-ocean-100 bg-white">
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">Bảng quản trị</h1>
            <StatusBadge status={user.role} />
          </div>
          <div className="mt-3">
            <AdminNav isAdmin={user.isAdmin} />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
    </main>
  )
}
