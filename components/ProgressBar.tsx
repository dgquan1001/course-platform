import { percent } from '@/lib/courses'

// Thanh tiến độ nhỏ: "18/72 bài · 25%" (design-system §8)
export default function ProgressBar({ done, total, className = '' }: { done: number; total: number; className?: string }) {
  const value = percent(done, total)
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-label="Tiến độ khóa học"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div className={`h-full rounded-full ${value === 100 ? 'bg-emerald-500' : 'bg-ocean-500'}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500" data-testid="progress-text">
        {done}/{total} bài · {value}%
      </p>
    </div>
  )
}
