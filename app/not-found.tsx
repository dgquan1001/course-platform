import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="text-5xl font-bold text-ocean-200">404</p>
        <h1 className="mt-3 text-xl font-bold">Không tìm thấy trang</h1>
        <p className="mt-2 text-slate-500">Trang bạn tìm không tồn tại hoặc đã bị xóa.</p>
        <Link href="/" className="btn-primary mt-6">
          Về trang chủ
        </Link>
      </div>
    </main>
  )
}
