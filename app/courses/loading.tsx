export default function CoursesLoading() {
  return (
    <div className="container-page py-10">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-ocean-50" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-44 animate-pulse bg-slate-50" />
        ))}
      </div>
    </div>
  )
}
