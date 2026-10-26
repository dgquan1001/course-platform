import Link from 'next/link'

// Tab trong trang một khóa (Đợt 24): "Thông tin & gói" (sửa, giá, xóa) · "Buổi – bài" (nội dung). Khóa premium không có bài học.
export default function CourseTabs({ courseId, kind, active }: { courseId: string; kind: string; active: 'edit' | 'content' }) {
  return (
    <nav aria-label="Trang của khóa học" className="seg">
      <Link href={`/admin/courses/${courseId}/edit`} aria-current={active === 'edit' ? 'page' : undefined} className="seg-item">
        Thông tin {kind === 'program' ? '& gói' : ''}
      </Link>
      {kind !== 'premium' && (
        <Link href={`/admin/courses/${courseId}`} aria-current={active === 'content' ? 'page' : undefined} className="seg-item">
          Buổi – bài
        </Link>
      )}
    </nav>
  )
}
