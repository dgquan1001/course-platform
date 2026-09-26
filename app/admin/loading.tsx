export default function AdminLoading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-24 animate-pulse bg-slate-100/60" />
      ))}
    </div>
  )
}
