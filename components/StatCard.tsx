import Link from 'next/link'

// Thẻ chỉ số trên Tổng quan (SCR-22): con số lớn + nhãn + dòng phụ; bấm để mở danh sách đã lọc sẵn.
// tone chỉ dùng cho trạng thái cần chú ý (kèm chữ, không chỉ dựa vào màu).
export default function StatCard({
  label,
  value,
  hint,
  href,
  tone = 'default',
}: {
  label: string
  value: number | string
  hint?: string
  href: string
  tone?: 'default' | 'warning' | 'critical'
}) {
  const accent = tone === 'critical' ? 'border-l-red-500' : tone === 'warning' ? 'border-l-gold-500' : 'border-l-ocean-500'
  return (
    <Link
      href={href}
      data-testid="stat-card"
      className={`card group block border-l-4 ${accent} p-4 transition hover:border-ocean-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean-100`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-ocean-900" data-testid="stat-value">
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Link>
  )
}
