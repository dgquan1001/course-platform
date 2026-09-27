const styles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ duyệt', className: 'bg-gold-100 text-gold-800' },
  approved: { label: 'Đã duyệt', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-700' },
  published: { label: 'Đang hiển thị', className: 'bg-emerald-100 text-emerald-700' },
  draft: { label: 'Đang ẩn', className: 'bg-slate-100 text-slate-600' },
  admin: { label: 'Admin', className: 'bg-ocean-100 text-ocean-700' },
  staff: { label: 'Nhân viên', className: 'bg-violet-100 text-violet-700' },
  user: { label: 'Học viên', className: 'bg-slate-100 text-slate-600' },
  // Khách quan tâm khóa premium
  lead_new: { label: 'Mới', className: 'bg-gold-100 text-gold-800' },
  lead_contacted: { label: 'Đã liên hệ', className: 'bg-ocean-100 text-ocean-700' },
  lead_converted: { label: 'Đã chốt', className: 'bg-emerald-100 text-emerald-700' },
  lead_closed: { label: 'Đóng', className: 'bg-slate-100 text-slate-600' },
  // Phiếu tham vấn
  consult_new: { label: 'Mới', className: 'bg-gold-100 text-gold-800' },
  consult_contacted: { label: 'Đã liên hệ', className: 'bg-ocean-100 text-ocean-700' },
  consult_done: { label: 'Hoàn tất', className: 'bg-emerald-100 text-emerald-700' },
  consult_cancelled: { label: 'Hủy', className: 'bg-slate-100 text-slate-600' },
  // Nguồn tài khoản bệnh nhân
  source_web: { label: 'Web', className: 'bg-sky-100 text-sky-700' },
  source_zalo: { label: 'Zalo', className: 'bg-blue-100 text-blue-700' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = styles[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' }
  return <span className={`badge ${s.className}`}>{s.label}</span>
}
