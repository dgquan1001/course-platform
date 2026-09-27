// Phiếu tham vấn (ADR-015): loại câu hỏi, câu trả lời lưu trong phiếu, nhãn hiển thị
export type QuestionKind = 'check' | 'scale' | 'text'

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  check: 'Có / Không',
  scale: 'Thang 0 – 10',
  text: 'Trả lời ngắn',
}

export type ConsultQuestion = { id: string; label: string; kind: QuestionKind; sort_order: number; active: boolean }

// Ảnh chụp câu hỏi + câu trả lời trong phiếu (sửa mẫu không làm sai phiếu cũ)
export type ConsultAnswer = { label: string; kind: QuestionKind; value: string | number | boolean | null }

export const CONSULT_STATUSES = [
  { value: 'new', label: 'Mới' },
  { value: 'contacted', label: 'Đã liên hệ' },
  { value: 'done', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Hủy' },
] as const

export const CONSULT_ORIGINS = ['manual', 'course_end', 'expiring'] as const
export const originLabel = (o: string) =>
  ({ manual: 'Tự gửi', course_end: 'Sau khi hoàn thành buổi tập', expiring: 'Gói sắp hết hạn' })[o] ?? o

export function answerText(a: ConsultAnswer) {
  if (a.value === null || a.value === '') return '—'
  if (a.kind === 'check') return a.value ? 'Có' : 'Không'
  if (a.kind === 'scale') return `${a.value}/10`
  return String(a.value)
}
