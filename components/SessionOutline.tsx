import Link from 'next/link'
import { lockReason, type OutlineSession } from '@/lib/courses'
import { CheckIcon, PlayIcon } from './icons'

// Nội dung khóa theo buổi (design-system §8 – SessionAccordion): mỗi buổi thu gọn / mở rộng,
// "Buổi 4 · 1/6 ✓", buổi bị khóa có 🔒 + lý do. linkTo: đường dẫn bài (null = chỉ hiển thị tên, VD trang giới thiệu).
export default function SessionOutline({
  sessions,
  currentLessonId,
  done,
  linkTo,
  showProgress = true,
  label = 'Nội dung khóa học',
}: {
  sessions: OutlineSession[]
  currentLessonId?: string
  done?: Set<string>
  linkTo?: ((lessonId: string) => string) | null
  showProgress?: boolean
  label?: string
}) {
  // Mở sẵn buổi chứa bài đang xem, không có thì buổi đầu tiên chưa xong
  const openId =
    sessions.find((s) => s.lessons.some((l) => l.id === currentLessonId))?.id ??
    sessions.find((s) => s.lock === 'open' && s.done < s.lessons.length)?.id ??
    sessions[0]?.id

  return (
    <div role="list" aria-label={label} className="divide-y divide-slate-100">
      {sessions.map((s, i) => {
        const locked = s.lock !== 'open'
        const complete = s.lessons.length > 0 && s.done === s.lessons.length
        return (
          <details key={s.id ?? 'none'} role="listitem" open={s.id === openId} className="group" data-testid="session">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className={`block font-semibold ${locked ? 'text-slate-400' : 'text-ocean-900'}`}>
                  {locked && <span aria-hidden="true">🔒 </span>}
                  {s.title}
                </span>
                {locked ? (
                  <span className="block text-xs text-slate-400">{lockReason(s.lock, sessions[i - 1])}</span>
                ) : (
                  <span className="block text-xs text-slate-500">
                    {showProgress && done ? `${s.done}/${s.lessons.length} bài` : `${s.lessons.length} bài`}
                    {showProgress && complete && <span className="font-semibold text-emerald-600"> · Đã xong ✓</span>}
                  </span>
                )}
              </span>
              <span className="text-slate-400 transition group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            <ol className="pb-2">
              {s.lessons.map((l, j) => {
                const isDone = done?.has(l.id)
                const active = l.id === currentLessonId
                const body = (
                  <>
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                        isDone ? 'bg-emerald-500 text-white' : active ? 'bg-ocean-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isDone ? <CheckIcon className="h-3.5 w-3.5" /> : active ? <PlayIcon className="h-3 w-3" /> : j + 1}
                    </span>
                    <span className="line-clamp-2">{l.title}</span>
                    {isDone && <span className="sr-only">(đã tập)</span>}
                  </>
                )
                const row = 'flex items-center gap-3 px-4 py-2 text-sm'
                return (
                  <li key={l.id}>
                    {linkTo && !locked ? (
                      <Link
                        href={linkTo(l.id)}
                        aria-current={active ? 'page' : undefined}
                        className={`${row} transition ${active ? 'bg-ocean-50 font-semibold text-ocean-800' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {body}
                      </Link>
                    ) : (
                      <span className={`${row} ${locked ? 'text-slate-400' : 'text-slate-700'}`}>{body}</span>
                    )}
                  </li>
                )
              })}
            </ol>
          </details>
        )
      })}
    </div>
  )
}
