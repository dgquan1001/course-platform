# ADR-003: Đăng nhập bằng SĐT qua email nội bộ `@sdt.hv.invalid`

- **Trạng thái**: Accepted

## Bối cảnh
Nhiều học viên lớn tuổi không dùng email. Supabase Auth hỗ trợ đăng nhập bằng SĐT nhưng **bắt buộc OTP SMS**
(tốn phí, cần nhà cung cấp SMS). Ta muốn đăng nhập bằng **SĐT + mật khẩu**, không SMS.

## Quyết định
- Tài khoản không có email được tạo với auth email `<SĐT chuẩn hóa>@sdt.hv.invalid`
  (`.invalid` là TLD dành riêng theo RFC 2606 – không bao giờ nhận thư).
- `profiles.phone` là nơi tra cứu SĐT (unique). Khi đăng nhập, server tìm profile theo email hoặc SĐT
  (`findAccount`) rồi lấy auth email thật từ `auth.users` để gọi `signInWithPassword`.
- Email nội bộ **không** lưu vào `profiles.email`, không hiển thị (hàm `realEmail()`).
- Khi học viên thêm email thật trong trang Tài khoản → auth email đổi sang email thật; xóa email → quay về email nội bộ.

## Hệ quả
- ✅ Đăng nhập bằng SĐT miễn phí, không cần SMS.
- ⚠️ Tài khoản chỉ có SĐT **không tự lấy lại mật khẩu được** (không có kênh gửi mã) → phải gọi hotline;
  hiện admin chưa có công cụ đặt lại mật khẩu (backlog US-09.02).
- ⚠️ Không xác minh được SĐT thuộc về người đăng ký (không có OTP).
- ⚠️ Mọi nơi hiển thị email phải đi qua `realEmail()`; đổi domain nội bộ phải migrate dữ liệu `auth.users`.
- ⚠️ Trigger `handle_new_user` nhận diện email nội bộ bằng `like '%@sdt.hv.invalid'` – phải đồng bộ với `PHONE_EMAIL_DOMAIN`.
