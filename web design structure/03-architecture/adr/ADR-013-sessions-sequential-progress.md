# ADR-013: Cấu trúc Buổi → Bài tập, mở buổi tuần tự, video đọc qua hàm kiểm quyền

- **Trạng thái**: Accepted – triển khai Đợt 10 (27/09/2026), có điều chỉnh (xem cuối file)
- **Ngày**: 27/09/2026
- **Người quyết định**: Chủ dự án

## Bối cảnh
Chương trình phục hồi chức năng gồm nhiều **buổi**, mỗi buổi nhiều **bài tập** (thường 6). Yêu cầu:
- Admin tùy chọn số buổi và số bài mỗi buổi khi tạo khóa.
- Checklist mỗi buổi dùng **mẫu chung**: tick từng bài đã tập.
- Buổi mở **lần lượt**: tick đủ bài của buổi trước mới vào buổi sau.
- Hiển thị % tiến độ, trang giới thiệu khóa có đề cương như Udemy (khách xem được tên buổi/bài).

v0.1 có danh sách bài phẳng và RLS chặn cả dòng `lessons` → không hiển thị được đề cương công khai.

## Quyết định
- Bảng `course_sessions(course_id, title, sort_order)`; `lessons.session_id` (bắt buộc với khóa mới).
  Giao diện gọi bài là "bài tập", database giữ tên `lessons` để không phá code cũ.
- **Tạo khung nhanh**: khi tạo khóa (hoặc trên trang quản lý nội dung) admin nhập *số buổi* × *số bài/buổi* → hệ thống tạo
  "Buổi 1…N", mỗi buổi "Bài 1…M" chưa có video. Sau đó sửa, thêm, xóa từng buổi/bài; số bài mỗi buổi có thể khác nhau;
  có nút "Sao chép buổi" để nhân bản bài của buổi trước.
- `lessons.video_url` cho phép `null` (bài chưa có video: hiện "Video đang được cập nhật", vẫn tick được).
- **Tách đề cương và video**: đề cương (buổi, tên/mô tả bài) đọc công khai với khóa đang hiển thị; cột `video_url`
  **không** cấp quyền `select` cho `anon`/`authenticated`; video chỉ lấy qua RPC `get_lesson_video(lesson_id)` (`security definer`)
  kiểm tra `can_view_lesson()`.
- `can_view_lesson(lesson)` đúng khi: staff/admin; hoặc khóa `free` đang hiển thị; hoặc khóa `program` mà bệnh nhân còn hạn
  **và** buổi nằm trong số buổi đã mua **và** mọi bài của buổi trước đã tick.
- Bảng `lesson_progress(user_id, lesson_id, completed_at)`; RLS: bệnh nhân chỉ ghi dòng của mình và chỉ khi `can_view_lesson`
  (không tick trước buổi bị khóa); đọc được cả khi đã hết hạn (vẫn thấy tiến độ cũ). Bỏ tick được.
- % tiến độ = số bài đã tick / tổng số bài **trong số buổi đã mua** (khóa miễn phí: trên toàn khóa).
- Khóa miễn phí: không khóa tuần tự; không đăng nhập thì không lưu tiến độ (gợi ý đăng nhập để lưu).

## Hệ quả
- ✅ Đề cương công khai giúp bán hàng (kiểu Udemy) mà video vẫn được bảo vệ ở database.
- ✅ Luật mở tuần tự nằm trong database, không vượt qua được bằng cách gọi API.
- ⚠️ Mọi chỗ đọc `video_url` (trang học, admin) phải đổi sang RPC hoặc client staff/admin; E2E RLS cần cập nhật.
- ⚠️ Không có "đã xem hết video" thật sự (video nhúng YouTube/TikTok) – tiến độ dựa trên bệnh nhân tự tick.

## Điều chỉnh khi triển khai (Đợt 10, 27/09/2026)
- **Không dùng column privilege + `get_lesson_video`.** Thay bằng RLS theo dòng: `lessons_select using (can_view_lesson(id))`.
  Tên bài của buổi bị khóa (đề cương, cột nội dung ở trình học) lấy qua `course_outline()` (security definer, không trả link video).
  Lý do: giữ nguyên mọi truy vấn `lessons` ở trang admin (admin / nhân viên luôn `can_view_lesson`), không phải thêm RPC đọc video,
  kết quả bảo mật tương đương (chỉ ai xem được bài mới đọc được dòng bài, kể cả `video_url`).
- `course_outline()` trả thêm `session_id`, `session_title`, `session_position`, `has_video`; `course_progress()` trả `done, total,
  next_lesson_id, purchased, last_activity`.
- Tick bài: server action `completeLessonAction` (tick + chuyển sang bài kế tiếp nếu đã mở, hết bài đã mua thì hiện thẻ chúc mừng),
  `uncompleteLessonAction` (bỏ tick, có hỏi xác nhận) – đều dùng server client, RLS `lesson_progress` quyết định.
- "Sao chép buổi" tạo buổi mới ở **cuối khóa** (không chèn ngay sau buổi gốc); đổi thứ tự bằng nút ↑ ↓.

## Phương án đã cân nhắc
- *Bảng checklist riêng cho từng buổi do admin soạn*: linh hoạt nhưng chủ dự án chọn mẫu chung (tick bài đã tập).
- *Khóa tuần tự chỉ ở giao diện*: dễ làm nhưng gọi API là vượt qua; không chọn.
- *View `lessons_public` không có `video_url`*: được, nhưng column privilege + RPC gọn hơn, giữ một bảng.
