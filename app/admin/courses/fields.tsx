// Các ô nhập dùng chung cho form thêm/sửa khóa học và bài học
import { COURSE_CATEGORIES, COURSE_KINDS } from '@/lib/courses'
import CoverInput from './CoverInput'

type CourseValues = {
  title?: string
  description?: string | null
  price?: number
  sort_order?: number
  status?: string
  kind?: string
  category?: string | null
  summary?: string | null
  outcomes?: string[]
  cover_image?: string | null
}

// isNew: form tạo khóa (có ô tạo nhanh khung buổi tập)
export function CourseFields({ values = {}, isNew = false }: { values?: CourseValues; isNew?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Tên khóa học *</label>
        <input name="title" required defaultValue={values.title} className="input" />
      </div>
      <div>
        <label className="label">Loại khóa</label>
        <select name="kind" defaultValue={values.kind ?? 'program'} className="input">
          {COURSE_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Nhóm bệnh</label>
        <select name="category" defaultValue={values.category ?? ''} className="input">
          <option value="">Không phân nhóm</option>
          {COURSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <CoverInput current={values.cover_image} />
      {isNew && (
        <div className="grid gap-3 rounded-xl bg-ocean-50/60 p-3 sm:col-span-2 sm:grid-cols-2">
          <p className="text-xs text-slate-600 sm:col-span-2">
            Tạo nhanh khung buổi tập (không bắt buộc, VD 12 buổi × 6 bài). Tên bài và video sửa sau ở trang nội dung.
          </p>
          <div>
            <label className="label">Số buổi</label>
            <input name="session_count" type="number" min={1} max={200} placeholder="12" className="input" />
          </div>
          <div>
            <label className="label">Số bài mỗi buổi</label>
            <input name="lessons_per_session" type="number" min={1} max={20} placeholder="6" className="input" />
          </div>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="label">Mô tả ngắn (hiện trên thẻ khóa học)</label>
        <input name="summary" maxLength={300} defaultValue={values.summary ?? ''} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Bạn sẽ đạt được (mỗi dòng một ý)</label>
        <textarea name="outcomes" rows={3} defaultValue={values.outcomes?.join('\n') ?? ''} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Giới thiệu chi tiết</label>
        <textarea name="description" rows={3} defaultValue={values.description ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Giá (VNĐ) – chương trình: giá gói 1 tháng khi tạo mới; premium: giá hiển thị</label>
        <input name="price" type="number" min={0} step={1000} defaultValue={values.price ?? 0} className="input" />
      </div>
      <div>
        <label className="label">Thứ tự hiển thị</label>
        <input name="sort_order" type="number" defaultValue={values.sort_order ?? 0} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Trạng thái</label>
        <select name="status" defaultValue={values.status ?? 'published'} className="input">
          <option value="published">Hiển thị – nhận đăng ký</option>
          <option value="draft">Ẩn – chưa mở đăng ký</option>
        </select>
      </div>
    </div>
  )
}

type LessonValues = {
  title?: string
  description?: string | null
  video_url?: string | null
  sort_order?: number
  session_id?: string | null
}

// sessions: danh sách buổi để chọn buổi của bài (bỏ trống = buổi cuối)
export function LessonFields({ values = {}, sessions }: { values?: LessonValues; sessions?: { id: string; title: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Tên bài học *</label>
        <input name="title" required defaultValue={values.title} className="input" />
      </div>
      {!!sessions?.length && (
        <div className="sm:col-span-2">
          <label className="label">Thuộc buổi</label>
          <select name="session_id" defaultValue={values.session_id ?? sessions.at(-1)?.id} className="input">
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="label">Link video YouTube / TikTok (có thể thêm sau)</label>
        <input
          name="video_url"
          type="url"
          defaultValue={values.video_url ?? ''}
          placeholder="https://www.youtube.com/watch?v=... hoặc https://www.tiktok.com/@user/video/..."
          className="input"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Mô tả</label>
        <textarea name="description" rows={3} defaultValue={values.description ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Thứ tự bài</label>
        <input name="sort_order" type="number" defaultValue={values.sort_order ?? 0} className="input" />
      </div>
    </div>
  )
}
