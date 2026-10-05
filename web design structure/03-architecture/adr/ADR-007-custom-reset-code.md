# ADR-007: Tự quản lý mã đặt lại mật khẩu 6 số qua SMTP

- **Trạng thái**: Accepted

## Bối cảnh
Luồng reset mặc định của Supabase gửi **link** qua email của Supabase (giới hạn số thư/giờ ở gói free, mẫu thư
khó tùy biến tiếng Việt, link mở trên trình duyệt khác gây lỗi PKCE). Người dùng lớn tuổi dễ nhập mã hơn bấm link.
Ngoài ra tài khoản SĐT có auth email nội bộ không nhận thư.

## Quyết định
- Bảng `password_resets` (chỉ service role), mã 6 số từ `crypto.randomInt`, lưu `sha256(userId:code)`.
- TTL 10 phút, tối đa 5 lần sai, gửi lại sau 60 giây, mã mới vô hiệu mã cũ, so sánh `timingSafeEqual`.
- Gửi thư qua SMTP của trung tâm (Gmail App Password): `nodemailer` trên Node, `lib/smtp-workers.ts` trên Cloudflare Workers (Đợt 17 – ADR-017). Test: `MAIL_OUTBOX_URL` gửi thư tới hộp thư giả của E2E (trước Đợt 17: `MAIL_OUTBOX_DIR` ghi file).
- Gửi tới **email thật** trong `profiles.email`; không có → hướng dẫn gọi hotline.

## Hệ quả
- ✅ Kiểm soát hoàn toàn nội dung thư, thương hiệu, ngôn ngữ.
- ✅ Test tự động đọc được mã.
- ⚠️ Gmail giới hạn ~500 thư/ngày; cần SMTP chuyên dụng (Resend, SES…) khi tăng quy mô.
- ⚠️ Mã 6 số + 5 lần thử: xác suất đoán đúng 5/10^6 mỗi mã; kẻ tấn công có thể yêu cầu mã mới mỗi 60s → nên thêm giới hạn theo IP/ngày (RV-04).
- ⚠️ Trang báo "Không tìm thấy tài khoản" → có thể dò tài khoản tồn tại (đánh đổi vì trải nghiệm người dùng).
