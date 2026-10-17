import Link from 'next/link'

// Thẻ chỉ số trên Tổng quan (SCR-22): con số lớn + nhãn + dòng phụ; bấm để mở danh sách đã lọc sẵn.
// Đợt 23 (UI-10): icon trong ô màu theo mức cần chú ý; tone luôn kèm chữ ("Cần xử lý"), không chỉ dựa vào màu.
const TONES = {
  default: { chip: 'bg-ocean-50 text-ocean-600 ring-ocean-100', note: '' },
  warning: { chip: 'bg-gold-50 text-gold-700 ring-gold-200', note: 'Cần chú ý' },
  critical: { chip: 'bg-red-50 text-red-600 ring-red-100', note: 'Cần xử lý' },
}

export default function StatCard({
  label,
  value,
  hint,
  href,
  tone = 'default',
  icon,
}: {
  label: string
  value: number | string
  hint?: string
  href: string
  tone?: keyof typeof TONES
  icon?: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <Link
      href={href}
      data-testid="stat-card"
      className="card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-ocean-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean-100 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon && <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${t.chip}`}>{icon}</span>}
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-ocean-950" data-testid="stat-value">
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </p>
      <p className="mt-auto pt-1 text-xs text-slate-500">
        {t.note && <span className={`mr-1 font-semibold ${tone === 'critical' ? 'text-red-600' : 'text-gold-800'}`}>{t.note} ·</span>}
        {hint}
      </p>
    </Link>
  )
}
