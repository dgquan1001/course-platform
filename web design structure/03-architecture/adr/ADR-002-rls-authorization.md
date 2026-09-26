# ADR-002: Phân quyền bằng Row Level Security trong database

- **Trạng thái**: Accepted

## Bối cảnh
Anon key của Supabase công khai trong trình duyệt; bất kỳ ai cũng có thể gọi thẳng API Postgres.
Kiểm tra quyền chỉ ở UI/middleware là không đủ.

## Quyết định
- Bật RLS cho **mọi** bảng (`profiles`, `courses`, `lessons`, `registrations`, `password_resets`).
- Hai hàm `security definer`: `is_admin()` và `has_course_access(course_id)` dùng chung trong policy.
- Quyền xem bài học theo **từng khóa**: `lessons_select using (has_course_access(course_id))`.
- `password_resets` bật RLS **không có policy** → chỉ service role truy cập.
- `registrations` **không có policy insert** → client không tự tạo đơn (xem ADR-006).
- Thao tác quản trị nội dung dùng server client (chịu RLS) thay vì service role, để database là lớp kiểm tra cuối.

## Hệ quả
- ✅ Kể cả khi UI có lỗi, dữ liệu trả phí không lộ.
- ✅ App di động/tích hợp sau này dùng lại được cùng quy tắc.
- ⚠️ Mọi bảng mới **bắt buộc** thêm RLS + policy; quên là lộ dữ liệu hoặc bị chặn toàn bộ.
- ⚠️ Hàm `security definer` phải `set search_path = public` để tránh chiếm quyền qua search_path.
- ⚠️ RLS của `courses` ảnh hưởng tới học viên đã mua khi khóa bị ẩn (xem RV-01).
