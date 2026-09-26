# Thuật ngữ (Glossary)

## Nghiệp vụ

| Thuật ngữ | Tiếng Anh / trong code | Định nghĩa |
| --- | --- | --- |
| Khách | Guest | Người truy cập chưa đăng nhập |
| Học viên | User / `role = 'user'` | Người có tài khoản; có thể có 0..n khóa học được mở |
| Admin / Quản trị viên | `role = 'admin'` | Nhân viên trung tâm, toàn quyền nội dung và duyệt đơn |
| Khóa học | Course / `courses` | Tập hợp bài học, có giá và trạng thái hiển thị |
| Bài học | Lesson / `lessons` | Một video YouTube/TikTok thuộc một khóa học |
| Đơn đăng ký | Registration / `registrations` | Yêu cầu mua 1 khóa học kèm ảnh chuyển khoản |
| Ảnh chuyển khoản | Payment proof / `payment_proof_path` | Ảnh chụp màn hình giao dịch, lưu ở bucket riêng tư `payment-proofs` |
| Chờ duyệt | `pending` | Đơn mới gửi, chưa được admin xử lý |
| Đã duyệt | `approved` | Admin xác nhận đã nhận tiền → học viên được xem khóa học |
| Từ chối | `rejected` | Admin không xác nhận được chuyển khoản |
| Thu hồi | approved → rejected | Admin hủy quyền học của một đơn đã duyệt |
| Đang hiển thị | `published` | Khóa học hiển thị trên website và nhận đăng ký |
| Đang ẩn | `draft` | Khóa học không hiển thị, không nhận đăng ký |
| Học phí | `price` | Giá khóa học tính bằng VNĐ (số nguyên). `0` = hiển thị "Liên hệ" |
| Mã đặt lại mật khẩu | Reset code / `password_resets` | Mã 6 chữ số gửi qua email, hiệu lực 10 phút |
| Hotline | `siteConfig.hotline` | SĐT hỗ trợ của trung tâm |

## Kỹ thuật

| Thuật ngữ | Định nghĩa |
| --- | --- |
| RLS (Row Level Security) | Cơ chế Postgres lọc dòng dữ liệu theo người dùng; là lớp phân quyền chính của hệ thống |
| anon key | Khóa công khai của Supabase; mọi truy vấn dùng khóa này đều chịu RLS |
| service role key | Khóa bí mật của Supabase, **bỏ qua RLS**; chỉ dùng trong server (`lib/supabase/admin.ts`) |
| Server Action | Hàm `'use server'` của Next.js được gọi trực tiếp từ form |
| Server Component | Component React render trên server, đọc dữ liệu trực tiếp |
| Middleware | `middleware.ts` chạy trước request để chặn trang cần đăng nhập / quyền admin |
| ISR | Incremental Static Regeneration – trang tĩnh được làm mới định kỳ (`revalidate = 300`) |
| `revalidatePath` | Xóa cache trang tĩnh ngay khi dữ liệu đổi |
| Email nội bộ | `<SĐT>@sdt.hv.invalid` – email giả để tài khoản không có email vẫn đăng nhập được bằng Supabase Auth |
| Auth email | Email dùng để đăng nhập Supabase (email thật hoặc email nội bộ) |
| Real email | Email thật để liên hệ/nhận mã (null với tài khoản chỉ có SĐT) |
| Flash message | Thông báo lưu tạm trong cookie `flash` (60 giây) để hiện toast sau khi redirect |
| Toast | Thông báo nổi góc màn hình, tự ẩn sau 4 giây |
| ActionResult | Kiểu trả về `{ ok: true, message } \| { ok: false, error }` của server action |
| Signed URL | Link xem file tạm thời (1 giờ) cho bucket riêng tư |
| VietQR | Dịch vụ tạo ảnh QR chuyển khoản theo chuẩn Napas (`img.vietqr.io`) |
| BIN | Mã định danh ngân hàng trong VietQR (Vietcombank = `970436`) |
| E2E | End-to-end test: chạy trình duyệt thật trên hệ thống thật |
