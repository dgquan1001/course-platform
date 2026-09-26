// Các ô nhập dùng chung cho form thêm/sửa khóa học và bài học

type CourseValues = {
  title?: string
  description?: string | null
  price?: number
  sort_order?: number
  status?: string
}

export function CourseFields({ values = {} }: { values?: CourseValues }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Tên khóa học *</label>
        <input name="title" required defaultValue={values.title} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Mô tả</label>
        <textarea name="description" rows={3} defaultValue={values.description ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Giá (VNĐ, 0 = Liên hệ)</label>
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
