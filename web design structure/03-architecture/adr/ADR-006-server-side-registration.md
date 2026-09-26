# ADR-006: Tạo tài khoản & đơn đăng ký ở server bằng service role

- **Trạng thái**: Accepted

## Bối cảnh
Đăng ký gồm 3 việc phải cùng thành công: tạo user, upload ảnh, tạo đơn. Nếu để client làm (signUp + upload + insert),
cần mở policy insert cho anon/user, dễ bị lạm dụng (tự tạo đơn `approved`, upload file rác) và khó rollback.

## Quyết định
- Toàn bộ nằm trong một server action `registerAction`, dùng **service role** (`createAdminClient`).
- Tạo user bằng `auth.admin.createUser({ email_confirm: true })` (không gửi email xác nhận).
- Rollback thủ công theo thứ tự ngược: xóa ảnh → xóa user (chỉ khi user vừa được tạo trong request này).
- Không có policy insert trên `registrations` và storage `payment-proofs`.
- Sau khi thành công, đăng nhập tự động bằng server client (cookie).

## Hệ quả
- ✅ Client không thể giả mạo trạng thái đơn hay đường dẫn ảnh.
- ✅ Validate tập trung, thông báo lỗi tiếng Việt thống nhất.
- ⚠️ Service role bỏ qua RLS → code trong action phải tự kiểm tra kỹ (khóa `published`, trùng đơn, trùng SĐT).
- ⚠️ Không phải transaction thật: nếu server chết giữa chừng có thể còn user/ảnh mồ côi (xác suất thấp).
- ⚠️ Endpoint công khai có thể bị spam (chưa có rate limit/captcha) – xem RV-04.
