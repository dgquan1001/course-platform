// Tiêu đề trang trong khu quản trị (Đợt 23 – UI-10): tên trang, mô tả ngắn, nút thao tác chính bên phải.
// Mọi trang quản trị dùng chung để người dùng luôn biết mình đang ở đâu và việc chính của trang là gì.
export default function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {back && <div className="mb-2 text-sm">{back}</div>}
        <h2 className="text-2xl font-bold tracking-tight text-ocean-950">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
