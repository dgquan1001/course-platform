# Triển khai & vận hành (Runbook)

## 1. Môi trường

| Môi trường | Next.js | Supabase | Ghi chú |
| --- | --- | --- | --- |
| Local | `npm run dev` (:3000) | Project dev/staging | `.env.local` |
| E2E | `next start` (:3123) do script khởi động | **Project kiểm thử (staging)** – script từ chối chạy nếu `E2E_SUPABASE_REF` không khớp | Email ghi ra file |
| CI | GitHub Actions `.github/workflows/ci.yml` | `check`: không cần Supabase; `e2e`: project staging (secrets) | Xem mục 1.1 |
| Preview | Vercel Preview (mỗi PR) | **Nên** là project staging | Biến môi trường riêng cho Preview |
| Production | Vercel Production | Project production | |

> Hiện tại cấu hình mặc định chỉ dùng **một** project Supabase. Khuyến nghị tách staging/production trước khi có nhiều người phát triển.

### 1.1. Môi trường kiểm thử (staging) cho E2E (RK-10)

E2E tạo/xóa tài khoản, khóa học, đổi quyền admin nên **không** được chạy trên database thật.
`npm run test:e2e` chỉ chạy khi `E2E_SUPABASE_REF` bằng mã project trong `NEXT_PUBLIC_SUPABASE_URL`.

1. Tạo project Supabase thứ hai (VD `hv-staging`, gói Free đủ dùng), chạy `supabase/schema.sql`.
2. Tạo file env riêng cho staging, VD `.env.staging.local` (đã nằm trong `.gitignore`), với khóa của project staging và
   `E2E_SUPABASE_REF=<mã project staging>`. **Không** đặt biến này trong env của production.
3. Chạy E2E local: sao chép `.env.staging.local` → `.env.local` (hoặc export các biến trong shell), rồi
   `NEXT_DIST_DIR=.next-e2e npm run build && NEXT_DIST_DIR=.next-e2e npm run test:e2e` (build phải dùng cùng project vì `NEXT_PUBLIC_*` được nhúng lúc build).
4. CI: GitHub › Settings › Secrets and variables › Actions:
   - Variable `E2E_ENABLED = true`
   - Secrets `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_SUPABASE_REF` (của **staging**)
5. Job `check` (typecheck, lint, build) luôn chạy, không cần secrets. Bật "Require status checks" cho nhánh `main` khi đã ổn định.

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
| `E2E_SUPABASE_REF` | Cho E2E | Script | Mã project Supabase **kiểm thử**; thiếu hoặc sai → E2E từ chối chạy. ❌ Không đặt ở production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Tùy chọn | Client / **chỉ server** | Cloudflare Turnstile chống bot ở form đăng ký; bỏ trống thì tắt |

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
- [ ] Đăng nhập admin, mở `/admin` (Tổng quan) và `/admin/registrations` xem được ảnh chuyển khoản.
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
| Tạo admin đầu tiên | `npm run create-admin -- <email> <mật khẩu ≥ 8 ký tự> ["Tên"]` (tài khoản có sẵn sẽ bị đặt lại mật khẩu) |
| Cấp / gỡ quyền nhân viên, admin | Quản trị › Bệnh nhân › ô "Vai trò" (chỉ admin; tài khoản đã là nhân viên / admin ở tab "Nhân viên & Admin"). Ghi `role_events`; không tự đổi quyền mình, luôn còn ≥ 1 admin |
| Tạo tài khoản cho khách chốt qua Zalo | Quản trị › Bệnh nhân › "+ Tạo bệnh nhân" (tùy chọn cấp gói ngay) → chép tin nhắn mật khẩu gửi Zalo (mật khẩu chỉ hiện một lần) |
| Cấp gói / gia hạn tại quầy, qua Zalo | Hồ sơ bệnh nhân › "Cấp gói / Gia hạn": chọn gói, số tiền đã nhận, hình thức (tiền mặt / chuyển khoản / khác), ảnh nếu có |
| Nhân viên cấp nhầm / cần hủy gói | Quản trị › Đơn đăng ký › tab Đã duyệt › "Thu hồi" kèm lý do (hạn học của đơn đó bị xóa; nếu có đơn gia hạn sau đó, cấp bù – RK-16) |
| Sửa câu hỏi phiếu tham vấn | Quản trị › Mẫu phiếu (chỉ admin) – phiếu đã gửi không bị ảnh hưởng |
| Mở khóa đăng nhập bị khóa tạm | Tự hết sau 15 phút; gỡ ngay: `delete from rate_limits where key like 'login-fail:%<SĐT hoặc email>%';` |
| Bật Turnstile | Cloudflare › Turnstile › Add site (domain production) → đặt 2 biến Turnstile trên Vercel → redeploy → thử đăng ký trên điện thoại thật |
| Đặt lại mật khẩu cho bệnh nhân không có email | Hồ sơ bệnh nhân › "Cấp lại mật khẩu" (nhân viên / admin; mật khẩu mới hiện một lần, bệnh nhân được nhắc đổi). Tài khoản nhân viên / admin: Supabase › Authentication › Users hoặc `npm run create-admin` |
| Tìm tài khoản theo SĐT | `select * from profiles where phone = '0912345678';` |
| Xóa tài khoản theo yêu cầu | Supabase › Authentication › Users › Delete: xóa profile, mã reset, tiến độ, ghi chú nội bộ; **đơn đăng ký, phiếu tham vấn, lead được giữ** (`user_id` → null). Nếu bệnh nhân yêu cầu xóa hẳn dữ liệu sức khỏe: `delete from consultations where phone = '<SĐT>';`. Chỉ xóa thư mục `payment-proofs/<user_id>/` khi được yêu cầu xóa cả dữ liệu thanh toán (khi đó xóa luôn các đơn tương ứng) |
| Rà soát link video không hợp lệ | `select l.id, c.title, l.title, l.video_url from lessons l join courses c on c.id = l.course_id where l.video_url !~ '^https://'` rồi mở trang admin khóa học: bài lỗi có cảnh báo đỏ (26/09/2026: 0 bài lỗi) |
| Đổi thông tin ngân hàng/hotline | Sửa `lib/site-config.ts` → deploy |
| Làm mới trang chủ ngay | Sửa bất kỳ khóa học trong admin (gọi `revalidatePath`), hoặc redeploy |
| Dọn mã reset cũ | `delete from password_resets where created_at < now() - interval '30 days';` |

## 7. Sao lưu & khôi phục

| Dữ liệu | Cách sao lưu | Tần suất đề xuất |
| --- | --- | --- |
| Database | **Gói Free (hiện tại)**: workflow `.github/workflows/backup.yml` (Supabase CLI `db dump`). **Gói Pro**: backup tự động hằng ngày của Supabase (vẫn có thể giữ workflow làm bản sao thứ hai) | Hằng tuần (Free) / hằng ngày (Pro) |
| Storage (ảnh CK, ảnh bìa) | Không có trong backup DB → cùng workflow (`npm run backup:storage`), hoặc chạy tay trên máy: `npm run backup:storage` | Tuần đầu mỗi tháng (tiết kiệm egress gói Free) |
| Mã nguồn | GitHub | Mỗi commit |
| Cấu hình | Lưu danh sách biến môi trường (không lưu giá trị bí mật trong repo) ở trình quản lý mật khẩu | Khi thay đổi |

> Gói Free của Supabase **tạm dừng project sau 7 ngày không hoạt động** và không có backup / PITR. Giai đoạn thử nghiệm dùng 2 workflow
> ở §7.1 để bù; khi đạt ngưỡng ở §12 thì chuyển gói Pro.

### 7.1. Bật sao lưu & giữ hoạt động trên GitHub (gói Free – roadmap Đợt 16)

Hai workflow chỉ chạy theo lịch khi đã nằm trên nhánh **`main`** (merge PR) và đã cấu hình ở GitHub › Settings › Secrets and variables › Actions:

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Secret | `PROD_SUPABASE_URL` | Project URL của production |
| Secret | `PROD_SUPABASE_ANON_KEY` | Khóa `anon` / `publishable` |
| Secret | `PROD_SUPABASE_SERVICE_ROLE_KEY` | Khóa `service_role` / `secret` (để tải ảnh trong bucket riêng tư) |
| Secret | `PROD_SUPABASE_DB_URL` | Supabase › **Connect** › **Session pooler** › URI (dạng `postgresql://postgres.<ref>:<mật khẩu>@aws-…pooler.supabase.com:5432/postgres`). Dùng **Session pooler** vì máy GitHub không kết nối được địa chỉ IPv6 của "Direct connection". Mật khẩu có ký tự đặc biệt thì phải mã hóa URL (VD `@` → `%40`) |
| Secret | `BACKUP_PASSPHRASE` | Cụm mật khẩu dài tự đặt để mã hóa bản sao lưu. **Lưu ở trình quản lý mật khẩu** – mất cụm này là không giải mã được bản sao lưu |
| Variable | `KEEPALIVE_ENABLED` = `true` | Bật `keepalive.yml`: mỗi 3 ngày đọc danh sách khóa → project không bị tạm dừng |
| Variable | `BACKUP_ENABLED` = `true` | Bật `backup.yml`: database 02:00 Chủ nhật (giờ VN), ảnh Storage tuần đầu mỗi tháng |

Sau khi cấu hình: Actions › "Sao lưu production" › **Run workflow** (tick "Tải cả ảnh Storage") để chạy thử ngay; tương tự "Giữ Supabase hoạt động".
Bản sao lưu nằm ở trang lần chạy › **Artifacts** (`hv-backup-<ngày>`), giữ **90 ngày**. Muốn giữ lâu hơn: tải về mỗi tháng, cất ở Google Drive
của trung tâm (file đã mã hóa). Workflow lỗi → GitHub gửi email cho người bật workflow.

**Khôi phục** (thử trên một project Supabase mới trước khi làm với production):

```bash
# 1. Giải mã (Git Bash trên Windows có sẵn gpg)
gpg --decrypt -o backup.tar.gz hv-backup-2026-10-04.tar.gz.gpg && tar -xzf backup.tar.gz
# 2. Nạp vào database đích (chuỗi kết nối Session pooler của project đích; cần psql – Postgres client)
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file backup/db/roles.sql --file backup/db/schema.sql \
  --command 'SET session_replication_role = replica' --file backup/db/data.sql \
  --dbname "<chuỗi kết nối project đích>"
```

Ảnh: tải lên lại bucket cùng tên, giữ nguyên đường dẫn trong `backup/storage/<bucket>/…` (đường dẫn được lưu trong `registrations.payment_proof_path`).
Cách nạp chi tiết theo hướng dẫn "Backup and restore using the CLI" của Supabase.

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
| Project Supabase bị pause | Free tier không hoạt động 7 ngày; workflow `keepalive.yml` chưa bật hoặc lỗi | Restore trong dashboard; bật / kiểm tra workflow (§7.1); nâng gói |
| Workflow "Sao lưu production" lỗi ở bước database | `PROD_SUPABASE_DB_URL` dùng Direct connection (IPv6) hoặc mật khẩu chưa mã hóa URL | Dùng chuỗi **Session pooler**, mã hóa ký tự đặc biệt (§7.1) |
| E2E báo "Chưa có bản build" / "Server không khởi động được" / trang 500 `MODULE_NOT_FOUND` | `npm run dev` đang chạy ghi đè thư mục `.next` | Build & test vào thư mục riêng: `NEXT_DIST_DIR=.next-e2e` (xem test-plan §2) |
| Học viên báo mất khóa sau khi admin ẩn khóa | Chưa chạy `schema.sql` mới (policy RV-01) | Chạy lại `supabase/schema.sql` |
| E2E báo "Từ chối chạy E2E trên project Supabase …" | Đang trỏ tới project không phải staging (RK-10) | Dùng env của staging (mục 1.1) |
| Khách báo "Bạn đã gửi quá nhiều đơn đăng ký" / "nhập sai quá nhiều lần" | Giới hạn tần suất theo IP (nhiều người dùng chung Wi-Fi) | Đợi hết khung giờ hoặc xóa khóa tương ứng trong `rate_limits`; chỉnh `LIMITS` trong `lib/rate-limit.ts` |
| Video / ảnh không hiện, console báo "Refused to … Content Security Policy" | Thêm nguồn mới chưa khai báo trong CSP | Bổ sung domain vào `next.config.mjs` (CSP) rồi deploy |

## 9. Sự cố bảo mật: lộ service role key

1. Supabase › Project Settings › API › **Roll/Regenerate** service role (hoặc tạo secret key mới, thu hồi key cũ).
2. Cập nhật `SUPABASE_SERVICE_ROLE_KEY` trên Vercel và `.env.local`, redeploy.
3. Kiểm tra `profiles.role = 'admin'` có tài khoản lạ không; kiểm tra `registrations` bị sửa bất thường.
4. Nếu key bị commit lên git: xóa khỏi lịch sử (git filter-repo) **sau** khi đã xoay khóa.
5. Ghi lại sự cố, nguyên nhân, biện pháp phòng ngừa.

## 10. Chuyển lên phiên bản 0.2 – go-live MVP (roadmap Đợt 14)

Code v0.2 đã xong (Đợt 7 → 13, 27/09/2026). Trình tự đưa lên production:

1. Sao lưu database (runbook §7) trước mỗi đợt có thay đổi schema.
2. Chạy `supabase/schema.sql` mới nhất trên **staging** → E2E → rồi mới chạy trên production, sau đó deploy code của đợt.
   Code đợt mới **không** chạy được với schema cũ (thiếu cột/hàm) – luôn chạy schema trước.
3. Đợt 8: tạo bucket public `course-covers` (schema tự tạo), thêm domain Supabase Storage vào `images.remotePatterns` và CSP `img-src`.
4. Sau deploy: cấp vai trò `staff` cho nhân viên ở Quản trị › Bệnh nhân (ô Vai trò) – tài khoản nhân viên tự đăng ký hoặc tạo bằng `create-admin` rồi hạ quyền.
5. **Dọn dữ liệu test trước go-live** (hiện toàn bộ là dữ liệu test – 27/09/2026): xóa đơn, tài khoản học viên test, khóa học test
   trong Supabase Dashboard (hoặc script SQL do dev chuẩn bị, chạy có xác nhận), giữ tài khoản admin; kiểm tra lại bucket `payment-proofs`.
6. Soạn nội dung: ảnh bìa, 2 chương trình (Vẹo lưng, Vẹo ngực) với gói 1/3/6/12 tháng, khung buổi, khóa miễn phí, 3 khóa premium,
   mẫu phiếu tham vấn, trang chính sách bảo mật (chủ trung tâm duyệt nội dung pháp lý).
7. Smoke test sau deploy: khách xem khóa free, lead premium mở Zalo, đăng ký chọn gói, staff tạo bệnh nhân Zalo (mật khẩu hiện một lần),
   bệnh nhân đăng nhập (hộp nhắc đổi mật khẩu), tick buổi 1, gửi phiếu tham vấn, staff xử lý phiếu, admin xem Tổng quan + doanh thu.
8. Tuần đầu: mỗi ngày mở Tổng quan (đơn chờ, phiếu mới, lead mới); cuối tuần đối soát doanh thu tiền mặt theo nhân viên (bảng "Theo người duyệt / cấp gói").

## 11. Giám sát (đề xuất)

- Vercel Analytics / Speed Insights cho hiệu năng.
- Sentry (hoặc Vercel Log Drains) để bắt lỗi server action.
- Supabase › Reports: số kết nối, dung lượng DB/Storage.
- Cảnh báo khi số đơn `pending` > 24 giờ (truy vấn định kỳ hoặc email hằng ngày cho admin).
- **Mỗi tháng** (giai đoạn gói Free): ghi số liệu ở Supabase › Organization › Usage và Vercel › Usage vào bảng §12.2, so với ngưỡng chuyển gói.

## 12. Giai đoạn thử nghiệm trên gói Free & lộ trình chuyển gói (chốt 02/10/2026)

Chủ dự án chọn chạy thử nghiệm (vài chục người xem cùng lúc) trên **Supabase Free + Vercel Hobby**, chuyển gói theo ngưỡng.
Phân tích tải đầy đủ: [project-review §7.8](../10-review/project-review.md#78-đánh-giá-hạ-tầng--quy-mô-500-người-học-cùng-lúc-02102026).

### 12.1. Gói Free chứa được bao nhiêu

Giả định mỗi bệnh nhân đang tập: ~30 buổi/tháng × ~8 lượt mở trang / tick; ~4 ảnh chuyển khoản/năm, mỗi ảnh ~0,5 MB (đã nén).
Hạn mức gói theo bảng giá tại thời điểm viết – **đối chiếu lại trang giá** của Supabase / Vercel khi quyết định.

| Hạn mức Free | Đủ cho khoảng | Cạn trước? |
| --- | --- | --- |
| Supabase database 500 MB | Hàng nghìn bệnh nhân (< 100 KB / người) | Không |
| Supabase Storage 1 GB | ~2.000 ảnh chuyển khoản **tích lũy** (30 giao dịch/tháng → > 5 năm; 100/tháng → ~1,5 năm) | ⚠️ |
| Supabase egress 5 GB/tháng | ~1.000 bệnh nhân hoạt động (video ở YouTube, không tính); sao lưu ảnh hằng tháng cũng tính vào đây | Không |
| Supabase 50.000 MAU | Thoải mái | Không |
| Vercel Hobby Active CPU 4 giờ/tháng | ~500–600 bệnh nhân tập đều (~0,1 giây CPU / trang động) | ⚠️ cạn đầu tiên |
| Vercel Hobby 100 GB băng thông, 1 triệu request | ~1.000+ bệnh nhân | Không |
| Gmail SMTP ~500 thư/ngày | Chỉ dùng quên mật khẩu | Không |

→ Gói Free chịu được khoảng **50 người cùng lúc, 300–500 bệnh nhân hoạt động, vài nghìn giao dịch tích lũy**.
Hạn chế không phải tải mà là: **tạm dừng sau 7 ngày** (bù bằng `keepalive.yml`), **không backup** (bù bằng `backup.yml`),
**Vercel Hobby chỉ cho mục đích phi thương mại** (chấp nhận trong thời gian thử nghiệm ngắn).

### 12.2. Ngưỡng chuyển gói (gặp **một** dấu hiệu là chuyển)

| Giai đoạn | Dấu hiệu | Hạ tầng | Chi phí / tháng (ước tính) |
| --- | --- | --- | --- |
| 0. Thử nghiệm (hiện tại) | — | Supabase Free + Vercel Hobby (vùng `sin1`) + keepalive + backup tuần | 0đ |
| 1. Kinh doanh | ≥ ~30 bệnh nhân trả phí / thu tiền đều hằng tháng · chuẩn bị chạy quảng cáo · Storage > 600 MB · Vercel Active CPU > 70% · egress > 3,5 GB | **Supabase Pro trước** (backup hằng ngày, không pause, 100 GB Storage), **Vercel Pro** (hợp lệ thương mại) | ~45 USD |
| 2. Mở rộng | > 200 bệnh nhân (danh sách admin chỉ hiện 200 dòng) · > 100 người cùng lúc · trang chậm > 1 giây giờ cao điểm | Như 1 + đợt code: phân trang (RV-12), nới giới hạn đăng nhập theo IP (RK-39), giới hạn Supabase Auth (RK-40), Sentry | ~45 USD + 1 đợt code |
| 3. Quy mô mục tiêu | 300–500 người cùng lúc, ~1.000 bệnh nhân · CPU database > 60% giờ cao điểm | Supabase compute Small; staging + chạy thử tải trước | ~60–80 USD |

Nếu chỉ chuyển được một gói: **chuyển Supabase trước** (mất dữ liệu bệnh nhân / thanh toán là không lấy lại được).

**Theo dõi hằng tháng** (điền khi xem Usage):

| Tháng | Bệnh nhân hoạt động | DB (MB) | Storage (MB) | Egress (GB) | Vercel CPU (giờ) | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| 10/2026 | | | | | | |
