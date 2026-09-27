import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffPage } from '@/lib/auth'
import { ArrowLeftIcon } from '@/components/icons'
import { getPlanOptions } from '../data'
import NewPatientForm from './NewPatientForm'

export const metadata: Metadata = { title: 'Tạo bệnh nhân' }

// Nhân viên tạo tài khoản cho khách chốt qua Zalo (ADR-014): mật khẩu hệ thống sinh, tùy chọn cấp gói ngay
export default async function NewPatientPage() {
  await requireStaffPage()
  const plans = await getPlanOptions()
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700">
        <ArrowLeftIcon className="h-4 w-4" /> Danh sách bệnh nhân
      </Link>
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Tạo tài khoản bệnh nhân (khách từ Zalo)</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Hệ thống tự sinh mật khẩu 8 ký tự, chỉ hiện một lần sau khi tạo. Bệnh nhân đăng nhập bằng số điện thoại và được nhắc đổi mật khẩu.
        </p>
        <NewPatientForm plans={plans} />
      </section>
    </div>
  )
}
