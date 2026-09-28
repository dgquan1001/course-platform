import { percent } from '@/lib/courses'

// Vòng tròn tiến độ: % ở giữa, bên cạnh "x/y bài hoàn thành" (UI-03, design-system §8).
// Một màu (ocean) cho phần đã tập, xong 100% chuyển emerald – kèm chữ nên không chỉ dựa vào màu.
// size md: thẻ khóa, trang khóa, hồ sơ bệnh nhân · sm: header trình học, danh sách quản trị.
// Truyền value (VD tiến độ trung bình ở danh sách bệnh nhân) khi không có số bài: chỉ hiện vòng tròn.
type Props = { done?: number; total?: number; value?: number; size?: 'sm' | 'md'; label?: string; className?: string }

const R = 15.9155 // chu vi = 100 → strokeDasharray tính thẳng theo %

export default function ProgressRing({ done = 0, total = 0, value, size = 'md', label = 'Tiến độ khóa học', className = '' }: Props) {
  const pct = Math.max(0, Math.min(100, value ?? percent(done, total)))
  const md = size === 'md'
  const showCount = value === undefined
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        data-testid="progress-ring"
        className={`relative shrink-0 ${md ? 'h-14 w-14' : 'h-9 w-9'}`}
      >
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r={R} fill="none" strokeWidth={md ? 3.5 : 4} className="stroke-slate-100" />
          {pct > 0 && (
            <circle
              cx="18"
              cy="18"
              r={R}
              fill="none"
              strokeWidth={md ? 3.5 : 4}
              strokeLinecap="round"
              strokeDasharray={`${pct} 100`}
              className={`motion-safe:transition-[stroke-dasharray] motion-safe:duration-500 ${pct === 100 ? 'stroke-emerald-500' : 'stroke-ocean-500'}`}
            />
          )}
        </svg>
        <span className={`absolute inset-0 grid place-items-center font-bold text-slate-800 ${md ? 'text-sm' : 'text-[10px]'}`}>
          {pct}%
        </span>
      </div>
      {showCount && (
        <p className="leading-tight" data-testid="progress-text">
          <span className={`block font-semibold text-slate-800 ${md ? 'text-sm' : 'text-xs'}`}>
            {done}/{total} bài
          </span>
          <span className="block text-xs text-slate-500">{pct === 100 ? 'Đã hoàn thành' : 'hoàn thành'}</span>
        </p>
      )}
    </div>
  )
}
