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

export function CourseFields({ values = {} }: { values?: CourseValues }) {
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
        <label className="label">Giá (VNĐ, 0 = Liên hệ; khóa miễn phí bỏ qua)</label>
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
  video_url?: string
  sort_order?: number
}

export function LessonFields({ values = {} }: { values?: LessonValues }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Tên bài học *</label>
        <input name="title" required defaultValue={values.title} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Link video YouTube / TikTok *</label>
        <input
          name="video_url"
          type="url"
          required
          defaultValue={values.video_url}
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
