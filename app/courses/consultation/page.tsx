import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUserPage } from '@/lib/auth'
import { CONSULT_ORIGINS, type ConsultQuestion } from '@/lib/consultation'
import { ArrowLeftIcon } from '@/components/icons'
import ConsultationForm from './ConsultationForm'

export const metadata: Metadata = { title: 'Phiếu tham vấn bác sĩ' }

// Phiếu tham vấn (SCR-20): bệnh nhân đã đăng nhập gửi bất cứ lúc nào (?course= chọn sẵn chương trình, ?origin= nguồn nhắc)
export default async function ConsultationPage({ searchParams }: { searchParams: { course?: string; origin?: string } }) {
  const user = await requireUserPage('/courses/consultation')
  const supabase = createClient()
  const [{ data: questions }, { data: regs }] = await Promise.all([
    supabase.from('consult_questions').select('id, label, kind, sort_order, active').eq('active', true).order('sort_order').order('created_at'),
    supabase.from('registrations').select('course_id, courses(id, title)').eq('user_id', user.id).eq('status', 'approved'),
  ])
  // Chương trình đã được duyệt (bỏ trùng khi có nhiều gói)
  const courses = new Map<string, { id: string; title: string }>()
  for (const r of regs ?? []) {
    const c = r.courses as unknown as { id: string; title: string } | null
    if (c) courses.set(c.id, c)
  }
  const courseId = courses.has(searchParams.course ?? '') ? searchParams.course! : ''
  const origin = (CONSULT_ORIGINS as readonly string[]).includes(searchParams.origin ?? '') ? searchParams.origin! : 'manual'

  return (
    <main>
      <section className="border-b border-ocean-100 bg-gradient-to-b from-ocean-50 to-white">
        <div className="container-page py-8 sm:py-10">
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ocean-700">
            <ArrowLeftIcon className="h-4 w-4" /> Khóa học của tôi
          </Link>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Phiếu tham vấn bác sĩ</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Cho trung tâm biết tình trạng hiện tại của bạn. Nhân viên sẽ xem câu trả lời và hẹn bác sĩ tư vấn qua điện thoại / Zalo.
            Thông tin sức khỏe chỉ nhân viên trung tâm xem được.
          </p>
        </div>
      </section>
      <div className="container-page max-w-3xl py-8 sm:py-10">
        <div className="card p-5 sm:p-6">
          <ConsultationForm
            questions={(questions ?? []) as ConsultQuestion[]}
            courses={[...courses.values()]}
            courseId={courseId}
            origin={origin}
          />
        </div>
      </div>
    </main>
  )
}
