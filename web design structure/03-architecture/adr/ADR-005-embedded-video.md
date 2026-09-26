# ADR-005: Video nhúng từ YouTube/TikTok

- **Trạng thái**: Accepted

## Bối cảnh
Lưu trữ & stream video tốn băng thông/chi phí. Bác sĩ đã có kênh YouTube/TikTok.

## Quyết định
- Bài học lưu `video_url` (link gốc). `lib/video.ts` chuyển sang link nhúng:
  - YouTube: `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/` → `youtube.com/embed/<id>?rel=0&modestbranding=1`
  - TikTok: `/video/<id>`, `/embed/v2/<id>`, `/player/v1/<id>` → `tiktok.com/player/v1/<id>`
  - Shorts & TikTok hiển thị khung dọc 9:16.
- Khuyến nghị để video YouTube ở chế độ **Unlisted**.

## Hệ quả
- ✅ Miễn phí, chất lượng stream tốt, hỗ trợ mọi thiết bị.
- ⚠️ **Không bảo vệ được nội dung**: ai có link gốc đều xem được; học viên có thể chia sẻ link. RLS chỉ bảo vệ *danh sách link*.
- ⚠️ Video bị gỡ/khóa trên nền tảng gốc thì bài học hỏng.
- 🔜 Khi cần bảo vệ nội dung: chuyển sang Bunny Stream / Cloudflare Stream với signed URL (roadmap R-10); chỉ cần thay `lib/video.ts` và kiểu dữ liệu `video_url`.
