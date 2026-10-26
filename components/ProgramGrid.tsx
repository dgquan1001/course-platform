'use client'

import { useState } from 'react'
import { COURSE_CATEGORIES } from '@/lib/courses'
import { cardCopy, type Locale } from '@/lib/i18n'
import type { PublicCourse } from '@/lib/supabase/public'
import CourseCard from './CourseCard'

// Danh sách chương trình phục hồi, lọc theo nhóm bệnh (vẹo lưng / vẹo ngực)
export default function ProgramGrid({ courses, locale = 'vi' }: { courses: PublicCourse[]; locale?: Locale }) {
  const t = cardCopy[locale]
  const [category, setCategory] = useState<string>('all')
  // Chỉ hiện nút lọc cho nhóm đang có chương trình
  const filters = [
    { value: 'all', label: t.all },
    ...COURSE_CATEGORIES.filter((c) => courses.some((x) => x.category === c.value)).map((c) => ({
      value: c.value,
      label: t.categories[c.value] ?? c.label,
    })),
  ]
  const shown = category === 'all' ? courses : courses.filter((c) => c.category === category)

  return (
    <>
      {filters.length > 2 && (
        <div role="group" aria-label={t.filterLabel} className="mt-8 flex flex-wrap justify-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={category === f.value}
              onClick={() => setCategory(f.value)}
              className={`btn btn-sm rounded-full border px-4 ${
                category === f.value
                  ? 'border-ocean-600 bg-ocean-600 text-white shadow-md shadow-ocean-600/25'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-ocean-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((course) => (
          <CourseCard key={course.id} course={course} locale={locale} />
        ))}
      </div>
    </>
  )
}
