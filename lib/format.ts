// Định dạng ngày giờ (giờ Việt Nam) và nhãn dùng chung cho các trang quản trị / bệnh nhân
const VN = { timeZone: 'Asia/Ho_Chi_Minh' } as const

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', { ...VN, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const formatDay = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', { ...VN, day: '2-digit', month: '2-digit', year: 'numeric' })

// Hình thức thanh toán của đơn (web: chuyển khoản; nhân viên cấp gói: chọn 1 trong 3)
export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'other', label: 'Khác' },
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']
export const isPaymentMethod = (s: string): s is PaymentMethod => PAYMENT_METHODS.some((m) => m.value === s)
export const paymentLabel = (s: string) => PAYMENT_METHODS.find((m) => m.value === s)?.label ?? s

// Nguồn: đơn (web / nhân viên cấp) và tài khoản (web / Zalo)
export const registrationSourceLabel = (s: string) => ({ web: 'Web', staff: 'Nhân viên' })[s] ?? s
export const accountSourceLabel = (s: string) => ({ web: 'Web', zalo: 'Zalo' })[s] ?? s

// Tên hiển thị của một người: họ tên, không có thì email / SĐT
export const displayName = (p: { full_name?: string | null; email?: string | null; phone?: string | null }) =>
  p.full_name || p.email || p.phone || '—'
