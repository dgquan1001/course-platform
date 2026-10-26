import type { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import { requireAdminPage } from '@/lib/auth'
import { ArrowLeftIcon } from '@/components/icons'
import NewStaffForm from './NewStaffForm'

export const metadata: Metadata = { title: 'Thêm nhân viên' }

// Admin tạo tài khoản nhân viên / admin (Đợt 26): mật khẩu hệ thống sinh, hiện một lần; nhân viên đổi mật khẩu sau khi đăng nhập
export default async function NewStaffPage() {
  await requireAdminPage()
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        back={
          <Link href="/admin/staff" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-ocean-700">
            <ArrowLeftIcon className="h-4 w-4" /> Danh sách nhân viên
          </Link>
        }
        title="Thêm nhân viên"
        description="Hệ thống tự sinh mật khẩu 8 ký tự, chỉ hiện một lần sau khi tạo. Nhân viên đăng nhập bằng số điện thoại (hoặc email) và được nhắc đổi mật khẩu."
      />
      <section className="card p-5 sm:p-6">
        <NewStaffForm />
      </section>
    </div>
  )
}
