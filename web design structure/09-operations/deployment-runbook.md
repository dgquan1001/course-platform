# Triển khai & vận hành (Runbook)

## 1. Môi trường

| Môi trường | Next.js | Supabase | Ghi chú |
| --- | --- | --- | --- |
| Local | `npm run dev` (:3000) | Project dev/staging | `.env.local` |
| E2E | `next start` (:3123) do script khởi động | Project trong `.env.local` | Email ghi ra file |
| Preview | Vercel Preview (mỗi PR) | **Nên** là project staging | Biến môi trường riêng cho Preview |
| Production | Vercel Production | Project production | |

> Hiện tại cấu hình mặc định chỉ dùng **một** project Supabase. Khuyến nghị tách staging/production trước khi có nhiều người phát triển.

## 2. Biến môi trường

| Biến | Bắt buộc | Phạm vi | Mô tả |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Client + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Client + server | Khóa anon/publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | **Chỉ server** | Khóa service_role/secret – BÍ MẬT |
| `NEXT_PUBLIC_SITE_URL` | ✓ (prod) | Client + server | URL gốc cho metadata/OG, VD `https://hv.vn` |
| `SMTP_HOST` | Cho quên MK | Server | VD `smtp.gmail.com` |
| `SMTP_PORT` | | Server | `465` (SSL) hoặc `587` |
| `SMTP_USER`, `SMTP_PASS` | Cho quên MK | Server | Gmail + App Password 16 ký tự |
| `MAIL_FROM` | | Server | VD `Trung tâm HV <email@gmail.com>` |
| `MAIL_OUTBOX_DIR` | ❌ **Không đặt ở production** | Server | Ghi thư ra file thay vì gửi (chỉ cho test) |
| `E2E_PORT`, `BROWSER_CHANNEL` | | Script | Tùy chọn cho E2E |

## 3. Cài đặt lần đầu (fresh install)

1. `npm install`
2. Tạo project Supabase (khuyến nghị vùng **Singapore** cho người dùng Việt Nam).
3. Supabase › SQL Editor › dán toàn bộ `supabase/schema.sql` › **Run**.
4. Supabase › Authentication › Providers › Email: có thể **tắt** "Confirm email" (tài khoản đăng ký đã được tạo sẵn ở trạng thái xác nhận); cân nhắc tắt "Allow new users to sign up" vì hệ thống không dùng `signUp` từ client.
5. Copy `.env.local.example` → `.env.local`, điền khóa (Project Settings › API).
6. Tạo admin: `npm run create-admin -- admin@gmail.com MatKhauManh123 "Tên Admin"`.
7. `npm run dev` → đăng nhập admin → Quản trị › Khóa học → thêm khóa & bài học.
8. Cập nhật `lib/site-config.ts` (hotline, email, Zalo, ngân hàng) và ảnh trong `public/images/`.

## 4. Triển khai lên Vercel

1. Đẩy code lên GitHub (kiểm tra `.env.local` **không** bị commit).
2. Vercel › Import repo › Framework: Next.js.
3. Thêm toàn bộ biến ở mục 2 (trừ `MAIL_OUTBOX_DIR`) cho Production (và Preview nếu dùng staging).
4. Deploy. Sau khi có domain: cập nhật `NEXT_PUBLIC_SITE_URL`, redeploy.
5. Supabase › Authentication › URL Configuration: đặt Site URL = domain production.

### Checklist sau deploy (smoke test)

- [ ] Trang chủ tải, danh sách khóa đúng, QR hiển thị.
- [ ] Đăng nhập admin, mở `/admin` xem được ảnh chuyển khoản.
- [ ] Gửi thử mã quên mật khẩu tới email thật.
- [ ] Mở một bài học bằng tài khoản học viên test.
- [ ] Không có lỗi trong Vercel › Logs.

## 5. Thay đổi database trên production

1. Viết thay đổi dạng idempotent vào `supabase/schema.sql` (hoặc migration – xem development-guide).
2. Chạy trên staging, chạy `npm run test:e2e` với staging.
3. **Sao lưu** production (Supabase › Database › Backups, hoặc `pg_dump`).
4. Chạy SQL trên production (giờ thấp điểm).
5. Deploy code phụ thuộc thay đổi đó **sau** khi DB đã cập nhật (thay đổi DB phải tương thích ngược với code cũ).

## 6. Tác vụ vận hành thường gặp

| Tác vụ | Cách làm |
| --- | --- |
| Thêm/nâng quyền admin | `npm run create-admin -- <email> <mật khẩu> ["Tên"]` (tài khoản có sẵn sẽ bị đặt lại mật khẩu) |
| Hạ quyền admin | SQL: `update profiles set role = 'user' where email = '…';` |
| Đặt lại mật khẩu cho học viên không có email | Supabase › Authentication › Users › chọn user (email dạng `<SĐT>@sdt.hv.invalid`) › Reset/Update password; hoặc script dùng `auth.admin.updateUserById` |
| Tìm tài khoản theo SĐT | `select * from profiles where phone = '0912345678';` |
| Xóa tài khoản theo yêu cầu | Supabase › Authentication › Users › Delete (cascade profile, đơn) + xóa thư mục `payment-proofs/<user_id>/` trong Storage |
| Đổi thông tin ngân hàng/hotline | Sửa `lib/site-config.ts` → deploy |
| Làm mới trang chủ ngay | Sửa bất kỳ khóa học trong admin (gọi `revalidatePath`), hoặc redeploy |
| Dọn mã reset cũ | `delete from password_resets where created_at < now() - interval '30 days';` |

## 7. Sao lưu & khôi phục

| Dữ liệu | Cách sao lưu | Tần suất đề xuất |
| --- | --- | --- |
| Database | Backup tự động của Supabase (gói Pro: hằng ngày, PITR) hoặc `pg_dump` định kỳ | Hằng ngày |
| Storage (ảnh CK) | Không có trong backup DB → tải bằng Supabase CLI / script định kỳ | Hằng tuần |
| Mã nguồn | GitHub | Mỗi commit |
| Cấu hình | Lưu danh sách biến môi trường (không lưu giá trị bí mật trong repo) ở trình quản lý mật khẩu | Khi thay đổi |

> Gói Free của Supabase **tạm dừng project sau 7 ngày không hoạt động** và không có PITR. Với production nên dùng gói Pro.

## 8. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Xử lý |
| --- | --- | --- |
| "Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY" | Chưa cấu hình trên Vercel | Thêm biến, redeploy |
| "Hệ thống chưa cấu hình gửi email" | Thiếu SMTP_* | Cấu hình SMTP |
| Gmail báo lỗi xác thực | App Password sai/bị thu hồi, chưa bật 2FA | Tạo lại App Password |
| Đăng ký báo "Database error creating new user" | SĐT trùng unique index khi tạo profile (race) hoặc trigger lỗi | Kiểm tra `profiles` theo SĐT; xem log Postgres |
| Upload ảnh lỗi "Body exceeded" | File > 6MB tới server | Kiểm tra nén client; `bodySizeLimit` |
| Học viên đã duyệt nhưng không thấy bài | Khóa đang `draft` (RV-01) hoặc đơn không phải `approved` | Kiểm tra `registrations`, trạng thái khóa |
| Trang chủ không cập nhật khóa mới | Cache ISR | Đợi ≤ 5 phút hoặc thao tác lưu trong admin |
| Admin không thấy thumbnail ảnh | Ảnh HEIC trên Chrome | Bấm mở ảnh (tải về) hoặc dùng Safari |
| Lỗi schema cache "column … not found" | PostgREST chưa tải lại schema | Chạy `notify pgrst, 'reload schema';` |
| Project Supabase bị pause | Free tier không hoạt động 7 ngày | Restore trong dashboard; nâng gói |
| E2E báo "Chưa có bản build" / "Server không khởi động được" / trang 500 `MODULE_NOT_FOUND` | `npm run dev` đang chạy ghi đè thư mục `.next` | Build & test vào thư mục riêng: `NEXT_DIST_DIR=.next-e2e` (xem test-plan §2) |
| Học viên báo mất khóa sau khi admin ẩn khóa | Chưa chạy `schema.sql` mới (policy RV-01) | Chạy lại `supabase/schema.sql` |

## 9. Sự cố bảo mật: lộ service role key

1. Supabase › Project Settings › API › **Roll/Regenerate** service role (hoặc tạo secret key mới, thu hồi key cũ).
2. Cập nhật `SUPABASE_SERVICE_ROLE_KEY` trên Vercel và `.env.local`, redeploy.
3. Kiểm tra `profiles.role = 'admin'` có tài khoản lạ không; kiểm tra `registrations` bị sửa bất thường.
4. Nếu key bị commit lên git: xóa khỏi lịch sử (git filter-repo) **sau** khi đã xoay khóa.
5. Ghi lại sự cố, nguyên nhân, biện pháp phòng ngừa.

## 10. Giám sát (đề xuất)

- Vercel Analytics / Speed Insights cho hiệu năng.
- Sentry (hoặc Vercel Log Drains) để bắt lỗi server action.
- Supabase › Reports: số kết nối, dung lượng DB/Storage.
- Cảnh báo khi số đơn `pending` > 24 giờ (truy vấn định kỳ hoặc email hằng ngày cho admin).
