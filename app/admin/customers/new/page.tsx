import type { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import { requireStaffPage } from '@/lib/auth'
import { ArrowLeftIcon } from '@/components/icons'
import { getPlanOptions } from '../data'
import NewCustomerForm from './NewCustomerForm'

export const metadata: Metadata = { title: 'Tạo khách hàng' }

// Nhân viên tạo tài khoản cho khách chốt qua Zalo (ADR-014): mật khẩu hệ thống sinh, tùy chọn cấp gói ngay
export default async function NewPatientPage() {
  await requireStaffPage()
  const plans = await getPlanOptions()
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        back={
          <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-ocean-700">
            <ArrowLeftIcon className="h-4 w-4" /> Danh sách khách hàng
          </Link>
        }
        title="Tạo tài khoản khách hàng (khách từ Zalo)"
        description="Hệ thống tự sinh mật khẩu 8 ký tự, chỉ hiện một lần sau khi tạo. Khách hàng đăng nhập bằng số điện thoại và được nhắc đổi mật khẩu."
      />
      <section className="card p-5 sm:p-6">
        <NewCustomerForm plans={plans} />
      </section>
    </div>
  )
}
