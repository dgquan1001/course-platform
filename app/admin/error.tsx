'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-semibold text-red-700">Thao tác không thành công</p>
      <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      <button onClick={reset} className="btn-outline mt-5">
        Thử lại
      </button>
    </div>
  )
}
