import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffPage } from '@/lib/auth'
import { ExternalLinkIcon, ShieldIcon } from '@/components/icons'
import AdminNav from './AdminNav'
import NavCount from './NavCount'

export const metadata: Metadata = { title: 'Quản trị' }

// Không thêm app/admin/loading.tsx: với Next 15.5, trang chỉ đổi ?tham-số (tab Đơn đăng ký, Khách quan tâm…) và dữ liệu lớn thì router
// hủy điều hướng, bấm tab không chuyển (RK-53, Đợt 17). Khi chờ tải đã có thanh tiến trình NavigationProgress.

// Số việc cần xử lý cạnh menu: stream sau, không chặn trang
const counts = {
  '/admin/registrations': <Suspense fallback={null}><NavCount kind="registrations" /></Suspense>,
  '/admin/consultations': <Suspense fallback={null}><NavCount kind="consultations" /></Suspense>,
  '/admin/leads': <Suspense fallback={null}><NavCount kind="leads" /></Suspense>,
}

// Khung quản trị (Đợt 23 – UI-10): từ lg là thanh bên tối dính khi cuộn (thương hiệu, menu có số việc cần làm, lối về website)
// + vùng nội dung nền xám nhạt; nhỏ hơn là dải tối phía trên với hàng tab cuộn ngang.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Chỉ nhân viên / admin (middleware đã chặn khách chưa đăng nhập; từng trang cũng tự kiểm tra, cache theo request)
  const user = await requireStaffPage()
  const roleLabel = user.isAdmin ? 'Admin' : 'Nhân viên'
  return (
    <main className="admin-shell min-h-[calc(100vh-4rem)] bg-slate-100/70 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="bg-ocean-950 text-ocean-100 lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col">
        <div className="flex items-center gap-3 px-4 pb-3 pt-5 sm:px-6 lg:px-5 lg:pb-5 lg:pt-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-300 ring-1 ring-inset ring-white/10">
            <ShieldIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight text-white">Bảng quản trị</h1>
            <p className="truncate text-xs text-ocean-300">
              <span className="font-semibold text-gold-300">{roleLabel}</span>
              {user.fullName && <> · {user.fullName}</>}
            </p>
          </div>
        </div>
        <div className="px-2 pb-2 sm:px-4 lg:flex-1 lg:overflow-y-auto lg:px-3">
          <AdminNav isAdmin={user.isAdmin} counts={counts} />
        </div>
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ocean-200 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLinkIcon className="h-4 w-4" /> Xem website
          </Link>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </div>
    </main>
  )
}
