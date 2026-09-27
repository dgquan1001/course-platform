'use client'

import { useState } from 'react'
import { COURSE_CATEGORIES } from '@/lib/courses'
import type { PublicCourse } from '@/lib/supabase/public'
import CourseCard from './CourseCard'

// Danh sách chương trình phục hồi, lọc theo nhóm bệnh (vẹo lưng / vẹo ngực)
export default function ProgramGrid({ courses }: { courses: PublicCourse[] }) {
  const [category, setCategory] = useState<string>('all')
  // Chỉ hiện nút lọc cho nhóm đang có chương trình
  const filters = [
    { value: 'all', label: 'Tất cả' },
    ...COURSE_CATEGORIES.filter((c) => courses.some((x) => x.category === c.value)),
  ]
  const shown = category === 'all' ? courses : courses.filter((c) => c.category === category)

  return (
    <>
      {filters.length > 2 && (
        <div role="group" aria-label="Lọc theo nhóm bệnh" className="mt-6 flex flex-wrap justify-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={category === f.value}
              onClick={() => setCategory(f.value)}
              className={`btn btn-sm border ${
                category === f.value ? 'border-ocean-500 bg-ocean-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-ocean-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </>
  )
}
