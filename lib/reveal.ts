import type { CSSProperties } from 'react'

// Độ trễ so le cho hiệu ứng hiện dần (data-reveal, xem components/RevealObserver.tsx):
// phần tử thứ i hiện sau phần tử trước `step` ms
export function revealDelay(i: number, step = 90) {
  return { '--reveal-delay': `${i * step}ms` } as CSSProperties
}
