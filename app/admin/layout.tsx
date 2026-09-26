import type { Metadata } from 'next'
import AdminNav from './AdminNav'

export const metadata: Metadata = { title: 'Quản trị' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-full bg-slate-50/60">
      <div className="border-b border-ocean-100 bg-white">
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Bảng quản trị</h1>
          <div className="mt-3">
            <AdminNav />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
    </main>
  )
}
