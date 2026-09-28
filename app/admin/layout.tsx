import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireStaffPage } from '@/lib/auth'
import StatusBadge from '@/components/StatusBadge'
import AdminNav from './AdminNav'
import NavCount from './NavCount'

export const metadata: Metadata = { title: 'Quản trị' }

// Số việc cần xử lý cạnh menu: stream sau, không chặn trang
const counts = {
  '/admin/registrations': <Suspense fallback={null}><NavCount kind="registrations" /></Suspense>,
  '/admin/consultations': <Suspense fallback={null}><NavCount kind="consultations" /></Suspense>,
  '/admin/leads': <Suspense fallback={null}><NavCount kind="leads" /></Suspense>,
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Chỉ nhân viên / admin (middleware đã chặn khách chưa đăng nhập; từng trang cũng tự kiểm tra, cache theo request)
  const user = await requireStaffPage()
  // < lg: tiêu đề + hàng tab ngang ở trên; từ lg: sidebar bên trái dính khi cuộn (header cao 4rem), nội dung bên phải
  return (
    <main className="min-h-full bg-slate-50/60">
      <div className="mx-auto w-full max-w-[1600px] lg:flex lg:items-start lg:gap-8 lg:px-8">
        <aside className="border-b border-ocean-100 bg-white px-4 pt-6 sm:px-6 lg:sticky lg:top-24 lg:my-8 lg:w-56 lg:shrink-0 lg:rounded-2xl lg:border lg:border-slate-100 lg:px-3 lg:py-4 lg:shadow-[0_1px_3px_rgba(23,42,61,0.06)]">
          <div className="flex flex-wrap items-center gap-3 lg:gap-2 lg:px-3">
            <h1 className="text-2xl font-bold lg:text-lg">Bảng quản trị</h1>
            <StatusBadge status={user.role} />
          </div>
          <div className="mt-3 lg:mt-4">
            <AdminNav isAdmin={user.isAdmin} counts={counts} />
          </div>
        </aside>
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-0">{children}</div>
      </div>
    </main>
  )
}
