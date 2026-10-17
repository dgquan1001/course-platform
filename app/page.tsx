import type { Metadata } from 'next'
import HomePage from '@/components/home/HomePage'

// Trang tĩnh, làm mới tối đa mỗi 5 phút (admin sửa khóa học sẽ làm mới ngay – revalidatePath('/', 'layout') gồm cả /en)
export const revalidate = 300

// Bản tiếng Anh ở /en (ADR-018)
export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { vi: '/', en: '/en' } },
}

export default function Page() {
  return <HomePage locale="vi" />
}
