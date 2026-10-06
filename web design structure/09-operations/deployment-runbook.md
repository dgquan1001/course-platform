# Triển khai & vận hành (Runbook)

## 1. Môi trường

| Môi trường | Next.js | Supabase | Ghi chú |
| --- | --- | --- | --- |
| Local | `npm run dev` (:3000) | Project dev/staging | `.env.local` |
| E2E | `next start` (:3123) – `npm run test:e2e`; hoặc **workerd** qua `opennextjs-cloudflare preview` – `npm run test:e2e:workers` (chuẩn nghiệm thu từ Đợt 17) | **Project kiểm thử (staging)** – script từ chối chạy nếu `E2E_SUPABASE_REF` không khớp | Email gửi tới hộp thư giả (`MAIL_OUTBOX_URL`) |
| CI | GitHub Actions `.github/workflows/ci.yml` | `check`: không cần Supabase; `e2e`: project staging (secrets) | Xem mục 1.1 |
| Preview | Cloudflare **Workers Builds** – link xem trước cho mỗi nhánh khác `main` | **Nên** là project staging | Biến môi trường riêng cho bản xem trước |
| Production | Cloudflare Workers `hv-web` (nhánh `main`) – ADR-017 | Project production | Vercel chỉ còn là đường lùi tới hết Đợt 17 P5 |

> Sau Đợt 17 (ADR-017): Preview / Production chạy trên **Cloudflare Workers** (Workers Builds), E2E chuẩn chạy trên preview workerd –
> xem [cloudflare-migration.md](cloudflare-migration.md).
>
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
| `MAIL_OUTBOX_URL` | ❌ **Không đặt ở production** | Server | Gửi thư (JSON) tới hộp thư giả của `scripts/e2e.mjs` thay vì gửi thật (chỉ cho test; thay `MAIL_OUTBOX_DIR` từ Đợt 17 vì Workers không có hệ thống file) |
| `E2E_PORT`, `BROWSER_CHANNEL` | | Script | Tùy chọn cho E2E |
| `E2E_SUPABASE_REF` | Cho E2E | Script | Mã project Supabase **kiểm thử**; thiếu hoặc sai → E2E từ chối chạy. ❌ Không đặt ở production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Tùy chọn | Client / **chỉ server** | Cloudflare Turnstile chống bot ở form đăng ký; bỏ trống thì tắt |

## 3. Cài đặt lần đầu (fresh install)

1. `npm install`
2. Tạo project Supabase (khuyến nghị vùng **Singapore** cho người dùng Việt Nam).
3. Supabase › SQL Editor › dán toàn bộ `supabase/schema.sql` › **Run**.
4. Supabase › Authentication › Providers › Email: có thể **tắt** "Confirm email" (tài khoản đăng ký đã được tạo sẵn ở trạng thái xác nhận); **tắt "Allow new users to sign up"** (bắt buộc – SEC-01: hệ thống không dùng `signUp` từ client; để bật thì ai có khóa `anon` cũng tạo được tài khoản rác qua API). Tạo tài khoản bằng service role vẫn chạy.
5. Copy `.env.local.example` → `.env.local`, điền khóa (Project Settings › API).
6. Tạo admin: `npm run create-admin -- admin@gmail.com MatKhauManh123 "Tên Admin"`.
7. `npm run dev` → đăng nhập admin → Quản trị › Khóa học → thêm khóa & bài học.
8. Cập nhật `lib/site-config.ts` (hotline, email, Zalo, ngân hàng) và ảnh trong `public/images/`.

## 4. Triển khai lên Cloudflare Workers (ADR-017, Đợt 17)

Kế hoạch đầy đủ, rà soát ảnh hưởng, checklist nghiệm thu CF-01 → CF-41 và đường lùi: [cloudflare-migration.md](cloudflare-migration.md).

**Lần đầu (chủ dự án, dev hướng dẫn – Đợt 17 P3):**
1. Tạo tài khoản Cloudflare bằng email trung tâm, bật **2FA**; Workers & Pages › Plans › **Workers Paid** (5 USD/tháng); Billing › đặt cảnh báo.
2. Trên máy dev: `npx wrangler login` (mở trình duyệt để cho phép) → `npx wrangler whoami` thấy đúng tài khoản.
3. Tạo bộ nhớ đệm trang tĩnh:
   - `npx wrangler r2 bucket create hv-web-cache`
   - `npx wrangler d1 create hv-web-tag-cache` → chép `database_id` vào `wrangler.jsonc` (thay `00000000-…`), commit.
4. Khóa bí mật (chạy từng lệnh, dán giá trị khi được hỏi – **không** ghi vào file):
   `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`, `… SMTP_PASS`, `… TURNSTILE_SECRET_KEY` (nếu bật Turnstile).
   Biến thường (Workers › hv-web › Settings › Variables): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `MAIL_FROM`.
5. **Workers Builds** (Workers › hv-web › Settings › Builds › Connect GitHub): repo này, nhánh production `main`,
   Build command `npx opennextjs-cloudflare build`, Deploy command `npx opennextjs-cloudflare deploy`. **Từ 06/10/2026 không cần nhập Build variables**: 3 biến công khai nằm trong file `.env.production` (commit trong repo), Node 22 theo `.node-version`. (Trước đây hướng dẫn nhập ở Build variables – dễ nhầm với Variables and Secrets lúc chạy; nếu vẫn nhập thì giá trị ở đó được ưu tiên.) Các biến công khai:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (tạm `https://hv-web.<tài-khoản>.workers.dev`),
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (nếu bật), `NODE_VERSION=22`. **Không** đặt `MAIL_OUTBOX_URL`, `E2E_SUPABASE_REF`.
6. Deploy lần đầu: push `main` (Workers Builds tự chạy) hoặc trên máy `npm run deploy` (lấy biến build từ `.env.local`).
7. Supabase › Authentication › URL Configuration: Site URL + Redirect URLs = địa chỉ `workers.dev` (sau này là tên miền).
8. Workers › hv-web › Settings: kiểm tra **Observability (Workers Logs)** đang bật và Placement = **Smart** (đã khai báo trong `wrangler.jsonc`).

**Đã làm 04/10/2026**: tài khoản Cloudflare (tạm đăng nhập bằng GitHub, email `dgquan1001@gmail.com` – khi chốt email trung tâm: Manage Account › Members › mời làm **Super Administrator** + 2FA), Workers Paid, subdomain `bsdomanhcuong.workers.dev`, R2 `hv-web-cache`, D1 `hv-web-tag-cache` (`55b32318-…`, bảng `revalidations` đã tạo), Secret `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST`, `SMTP_PORT`; deploy **https://hv-web.bsdomanhcuong.workers.dev**. Chưa làm: `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` (A-12), Supabase Site URL (bước 7), Workers Builds (bước 5 – sau khi gộp nhánh vào `main`).

**Quy trình deploy chuẩn (từ 06/10/2026)**: code trên nhánh → push → Pull Request vào `main` (CI: typecheck, lint, build OpenNext) → chủ dự án merge → **Workers Builds** tự build từ `main` và deploy → lỗi thì Rollback. Website luôn khớp với `main` trên GitHub.

**Deploy từ máy (chỉ khẩn cấp hoặc trước khi bật Workers Builds)**: `npm run deploy:win`. Lệnh **từ chối** khi: còn thay đổi chưa commit; commit chưa push lên GitHub; không đứng ở `main` (nhánh khác: `npm run deploy:win -- --cho-phep-nhanh`). Mã commit được ghi vào Message của bản deploy (Workers › hv-web › Deployments) để biết website đang chạy commit nào. Lý do: các lần deploy 04 – 05/10 tải code từ máy, bỏ qua GitHub (Source = Upload) → code đang chạy chỉ có trên máy dev.

Chi tiết lệnh `npm run deploy:win` (`scripts/deploy-cloudflare.mjs`: build → nạp R2 → tạo bảng D1 → `wrangler deploy` với `OPEN_NEXT_DEPLOY=true`). `npm run deploy` / `wrangler deploy` trên Windows **treo** ở bước tạo bảng D1 (§8). Địa chỉ website lúc build lấy từ `.env.production.local` (`NEXT_PUBLIC_SITE_URL=https://hv-web.bsdomanhcuong.workers.dev`, chỉ trên máy, không commit). Biến SMTP đặt dạng **Secret** (kể cả không bí mật) để không bị xóa khi deploy lại từ máy.

**Các lần sau**: push `main` → tự build + deploy (khi đã bật Workers Builds) hoặc `npm run deploy:win`. **Lùi phiên bản**: Workers › hv-web › Deployments › chọn bản trước › **Rollback** (< 1 phút).
**Chạy thử bản Workers trên máy**: `npm run preview` (cần `.dev.vars` chứa các biến lúc chạy – định dạng `.env`, **không commit**). Windows: xem §8 "npm run preview treo". Trước khi build bản Cloudflare trên máy nên xóa `.next/cache` (bộ nhớ đệm cũ của `next dev` có thể bị đóng gói vào cache R2).

### 4.1. Vercel (đường lùi tới hết Đợt 17 P5, sau đó gỡ)

1. Vercel › Import repo › Framework: Next.js; Node.js Version 22.x.
2. Thêm toàn bộ biến ở mục 2 (trừ `MAIL_OUTBOX_URL`) cho Production; `vercel.json` đặt vùng `sin1`.
3. Khi cần lùi: deploy lên Vercel, đổi Supabase Site URL về địa chỉ Vercel (cloudflare-migration §7).

### Checklist sau deploy (smoke test)

- [ ] Trang chủ tải, danh sách khóa đúng, QR hiển thị.
- [ ] Đăng nhập admin, mở `/admin` (Tổng quan) và `/admin/registrations` xem được ảnh chuyển khoản.
- [ ] Gửi thử mã quên mật khẩu tới email thật.
- [ ] Mở một bài học bằng tài khoản học viên test.
- [ ] Không có lỗi trong Workers › hv-web › Logs (Observability).
- [ ] Sửa tên một khóa ở admin → trang chủ (tab ẩn danh) hiện tên mới (bộ nhớ đệm R2 / D1 hoạt động).

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
| Bật Turnstile | Cloudflare › Turnstile › Add site (domain production) (thêm hostname `workers.dev` / tên miền) → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ở Build variables + `npx wrangler secret put TURNSTILE_SECRET_KEY` → deploy lại → thử đăng ký trên điện thoại thật |
| Đặt lại mật khẩu cho bệnh nhân không có email | Hồ sơ bệnh nhân › "Cấp lại mật khẩu" (nhân viên / admin; mật khẩu mới hiện một lần, bệnh nhân được nhắc đổi). Tài khoản nhân viên / admin: Supabase › Authentication › Users hoặc `npm run create-admin` |
| Tìm tài khoản theo SĐT | `select * from profiles where phone = '0912345678';` |
| Xóa tài khoản theo yêu cầu | Supabase › Authentication › Users › Delete: xóa profile, mã reset, tiến độ, ghi chú nội bộ; **đơn đăng ký, phiếu tham vấn, lead được giữ** (`user_id` → null). Nếu bệnh nhân yêu cầu xóa hẳn dữ liệu sức khỏe: `delete from consultations where phone = '<SĐT>';`. Chỉ xóa thư mục `payment-proofs/<user_id>/` khi được yêu cầu xóa cả dữ liệu thanh toán (khi đó xóa luôn các đơn tương ứng) |
| Rà soát link video không hợp lệ | `select l.id, c.title, l.title, l.video_url from lessons l join courses c on c.id = l.course_id where l.video_url !~ '^https://'` rồi mở trang admin khóa học: bài lỗi có cảnh báo đỏ (26/09/2026: 0 bài lỗi) |
| Đổi thông tin ngân hàng/hotline | Sửa `lib/site-config.ts` → push `main` (Workers Builds tự deploy) |
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

### 7.1. Bật sao lưu & giữ hoạt động trên GitHub (gói Free – roadmap Đợt 16) – ✅ đã bật, chạy thử thành công 02/10/2026

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
| "Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY" | Chưa đặt Secret trên Cloudflare | `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY` (không cần build lại) |
| Workers Builds đỏ: `supabaseUrl is required` khi dựng `/register` (hoặc từ 06/10: "Thiếu biến môi trường lúc build") | Chưa đặt `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` ở **Build variables** (đặt ở Variables của Worker là biến lúc chạy, không có tác dụng khi build) | Kiểm file `.env.production` có trong repo (từ commit 06/10/2026); hoặc thêm ở Workers › hv-web › Settings › **Build** › Build variables and secrets (không phải Variables and Secrets phía trên) → Retry build (gặp 06/10/2026: chủ dự án nhập vào Variables and Secrets lúc chạy) |
| Workers Builds đỏ ở bước deploy của **nhánh khác `main`**: `Your Wrangler configuration needs a previews block` (lệnh `npx wrangler preview`) | Đang bật **Non-production branch builds**; bản xem trước cần D1 / R2 / Durable Object riêng (khối `previews` trong `wrangler.jsonc`) | Settings › Build › Branch control: tắt Non-production branch builds (khuyên dùng tới khi có Supabase staging). Không ảnh hưởng website và `main` (gặp 06/10/2026) |
| Trang lỗi CSP chặn Supabase / trang trắng sau deploy | Thiếu `NEXT_PUBLIC_*` ở **Build variables** (nhúng lúc build) | Thêm ở Workers Builds › Build variables, build lại |
| Quên mật khẩu báo lỗi gửi thư trên Cloudflare | SMTP sai hoặc Gmail chặn | Xem Workers Logs (`SMTP: 535…` = sai App Password); thư gửi qua `lib/smtp-workers.ts` (cổng 465 hoặc 587) |
| `npm run deploy` / `wrangler deploy` treo ở "Creating D1 table if necessary..." (Windows) | Như dòng dưới – `wrangler deploy` tự chuyển sang `opennextjs-cloudflare deploy` | Dùng `npm run deploy:win` |
| `npm run preview` treo ở "Creating D1 table if necessary..." (Windows) | OpenNext gọi wrangler qua `npm exec` + shell, Windows chèn ký tự escape sai vào câu SQL (OpenNext cũng cảnh báo chưa hỗ trợ đầy đủ Windows; Linux / Workers Builds không bị) | Trên Windows: `node node_modules/wrangler/bin/wrangler.js d1 execute NEXT_TAG_CACHE_D1 --local --command "CREATE TABLE IF NOT EXISTS revalidations (tag TEXT NOT NULL, revalidatedAt INTEGER NOT NULL, stale INTEGER, expire INTEGER default NULL, UNIQUE(tag) ON CONFLICT REPLACE);"` rồi `npx wrangler dev` (E2E `--workers` tự làm vậy); hoặc dùng WSL |
| Trang chủ không đổi sau khi admin sửa khóa (Cloudflare) | Thiếu R2 / D1 / Durable Object hoặc `database_id` D1 sai | Kiểm tra `wrangler.jsonc`, `npx wrangler d1 list`; deploy lại (lệnh deploy tự tạo bảng `revalidations`) |
| Bấm tab trong trang quản trị / "Hoàn thành & bài tiếp theo" không chuyển trang | Có `loading.tsx` dưới `/admin` hoặc `/courses` + trang chỉ đổi `?tham-số` + dữ liệu lớn – lỗi router Next 15.5 (RK-53, project-review §7.9) | Không thêm `loading.tsx` (dùng thanh tiến trình có sẵn) |
| "Hệ thống chưa cấu hình gửi email" | Thiếu SMTP_* | Cấu hình SMTP |
| Gmail báo lỗi xác thực | App Password sai/bị thu hồi, chưa bật 2FA | Tạo lại App Password |
| Đăng ký báo "Database error creating new user" | SĐT trùng unique index khi tạo profile (race) hoặc trigger lỗi | Kiểm tra `profiles` theo SĐT; xem log Postgres |
| Upload ảnh lỗi "Body exceeded" | File > 6MB tới server | Kiểm tra nén client; `bodySizeLimit` |
| Học viên đã duyệt nhưng không thấy bài | Khóa đang `draft` (RV-01) hoặc đơn không phải `approved` | Kiểm tra `registrations`, trạng thái khóa |
| Trang chủ không cập nhật khóa mới | Cache ISR | Đợi ≤ 5 phút hoặc thao tác lưu trong admin |
| Admin không thấy thumbnail ảnh | Ảnh HEIC trên Chrome | Bấm mở ảnh (tải về) hoặc dùng Safari |
| Lỗi schema cache "column … not found" | PostgREST chưa tải lại schema | Chạy `notify pgrst, 'reload schema';` |
| Project Supabase bị pause | Free tier không hoạt động 7 ngày; workflow `keepalive.yml` chưa bật hoặc lỗi | Restore trong dashboard; bật / kiểm tra workflow (§7.1); nâng gói |
| Script / workflow báo "Node.js detected but native WebSocket not found" | `@supabase/supabase-js` ≥ 2.117 cần **Node 22+** | Workflow dùng `node-version: 22`; `package.json` có `engines.node >= 22`; Workers Builds: biến build `NODE_VERSION=22` |
| Workflow "Sao lưu production" lỗi ở bước database | `PROD_SUPABASE_DB_URL` dùng Direct connection (IPv6) hoặc mật khẩu chưa mã hóa URL | Dùng chuỗi **Session pooler**, mã hóa ký tự đặc biệt (§7.1) |
| E2E báo "Chưa có bản build" / "Server không khởi động được" / trang 500 `MODULE_NOT_FOUND` | `npm run dev` đang chạy ghi đè thư mục `.next` | Build & test vào thư mục riêng: `NEXT_DIST_DIR=.next-e2e` (xem test-plan §2) |
| Học viên báo mất khóa sau khi admin ẩn khóa | Chưa chạy `schema.sql` mới (policy RV-01) | Chạy lại `supabase/schema.sql` |
| E2E báo "Từ chối chạy E2E trên project Supabase …" | Đang trỏ tới project không phải staging (RK-10) | Dùng env của staging (mục 1.1) |
| Khách báo "Bạn đã gửi quá nhiều đơn đăng ký" / "nhập sai quá nhiều lần" | Giới hạn tần suất theo IP (nhiều người dùng chung Wi-Fi) | Đợi hết khung giờ hoặc xóa khóa tương ứng trong `rate_limits`; chỉnh `LIMITS` trong `lib/rate-limit.ts` |
| Video / ảnh không hiện, console báo "Refused to … Content Security Policy" | Thêm nguồn mới chưa khai báo trong CSP | Bổ sung domain vào `next.config.mjs` (CSP) rồi deploy |

## 9. Sự cố bảo mật: lộ service role key

1. Supabase › Project Settings › API › **Roll/Regenerate** service role (hoặc tạo secret key mới, thu hồi key cũ).
2. Cập nhật `SUPABASE_SERVICE_ROLE_KEY`: `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY` (Cloudflare), GitHub secret `PROD_SUPABASE_SERVICE_ROLE_KEY`, `.env.local`.
3. Kiểm tra `profiles.role = 'admin'` có tài khoản lạ không; kiểm tra `registrations` bị sửa bất thường.
4. Nếu key bị commit lên git: xóa khỏi lịch sử (git filter-repo) **sau** khi đã xoay khóa.
5. Ghi lại sự cố, nguyên nhân, biện pháp phòng ngừa.

## 10. Chạy thử MVP (pilot) – hướng dẫn từng bước (roadmap Đợt 14)

Code v0.2 xong (Đợt 7 → 13), giao diện Đợt 15, hạ tầng gói Free Đợt 16. Mục này là **cách làm chi tiết** từng bước;
trạng thái theo dõi ở [roadmap §3.1](../10-review/roadmap.md#31-đợt-14--chạy-thử-mvp-pilot--kế-hoạch-từng-bước).
Làm theo thứ tự giai đoạn 1 → 7; trong một giai đoạn các bước không ghi "sau bước …" có thể làm song song.

> Project Supabase hiện tại (đang chứa dữ liệu test) **chính là production** của đợt chạy thử – không tạo project mới.
> Sau khi dọn dữ liệu (giai đoạn 2) **không chạy E2E trên project này nữa** (E2E tạo / xóa dữ liệu) – xem bước 2.5.

### Giai đoạn 1 – Hạ tầng & cấu hình (chủ dự án, ~1 buổi)

| Bước | Việc | Cách làm | Xong khi |
| --- | --- | --- | --- |
| 1.1 | ✅ Sao lưu + giữ Supabase hoạt động (A-14) | §7.1 – đã chạy thử 2 workflow 02/10/2026 | Actions có ✅ + artifact `hv-backup-…` |
| 1.2 | Vùng Supabase (A-15) | Supabase › Project Settings › General › Region | Ghi vào tài liệu (Smart Placement tự đặt Worker gần Supabase) |
| 1.3 | Cloudflare Workers production (A-18, A-20) – **Đợt 17** | §4 "Triển khai lên Cloudflare Workers" bước 1 → 8 | Mở được trang chủ trên `https://hv-web.<tài-khoản>.workers.dev`; Workers Logs không có lỗi |
| 1.4 | Tên miền (chốt 04/10: **chạy tạm `workers.dev`**, mua ở đợt sau – A-19) | Khi có tên miền: thêm vào Cloudflare (đổi nameserver) → Workers › hv-web › Domains & Routes › Custom Domain | `NEXT_PUBLIC_SITE_URL` = địa chỉ chính thức, đã build lại |
| 1.5 | Supabase Auth (sau 1.4) | Authentication › URL Configuration › **Site URL** = địa chỉ ở 1.4; Providers › Email: tắt "Confirm email"; **tắt "Allow new users to sign up"** (A-24, SEC-01 – hệ thống tạo tài khoản bằng service role); Password: tối thiểu 8 ký tự | Lưu thành công |
| 1.6 | Email quên mật khẩu (A-12) | Gmail của trung tâm: bật xác minh 2 bước → App Password → điền `SMTP_*` trên Cloudflare (§4 bước 4) (README "Cấu hình gửi email") | Quên mật khẩu bằng email thật nhận được mã 6 số |
| 1.7 | Turnstile (A-4) | §6 "Bật Turnstile". **Tùy chọn** khi chỉ mời người quen; **bắt buộc** trước khi quảng bá công khai | Form đăng ký hiện ô xác minh |

### Giai đoạn 2 – Dữ liệu sạch (dev chuẩn bị, chủ dự án xác nhận và chạy)

| Bước | Việc | Cách làm | Xong khi |
| --- | --- | --- | --- |
| 2.1 | Script dọn dữ liệu test (A-11) | **Dev** viết `supabase/cleanup-test-data.sql` gồm 2 phần: (1) **xem trước** – đếm và liệt kê khóa, tài khoản, đơn, phiếu, lead sẽ xóa; (2) **xóa** – giữ tài khoản admin, mẫu phiếu tham vấn | File có trong repo, chủ dự án đã đọc danh sách xem trước |
| 2.2 | Sao lưu ngay trước khi xóa (sau 2.1) | Actions › "Sao lưu production" › Run workflow (tick ảnh Storage) | Có artifact mới trong ngày |
| 2.3 | Chạy dọn dữ liệu (sau 2.2) | Supabase › SQL Editor: chạy phần xem trước → đối chiếu → chạy phần xóa; xóa ảnh test trong Storage › `payment-proofs`, `course-covers` | Quản trị › Tổng quan: 0 bệnh nhân, 0 đơn; Khóa học trống (hoặc chỉ còn khóa thật) |
| 2.4 | Schema mới nhất (A-5) | Đợt 15, 16 không đổi schema; nếu chưa chạy `supabase/schema.sql` từ sau Đợt 13 thì chạy lại (an toàn khi chạy nhiều lần) | Không lỗi khi chạy |
| 2.5 | Project staging (A-1) – **đề xuất làm trước chạy thử** | §1.1. Gói Free cho 2 project nên không tốn tiền; từ nay mọi đợt code mới cần staging để chạy E2E | `npm run test:e2e` chạy được trên staging |

### Giai đoạn 3 – Nội dung (chủ dự án / admin, trên giao diện Quản trị)

| Bước | Việc | Cách làm | Xong khi |
| --- | --- | --- | --- |
| 3.1 | Thông tin trung tâm (A-6) | Kiểm tra hotline, Zalo, **email liên hệ** (hiện là Gmail cá nhân), tài khoản ngân hàng trong `lib/site-config.ts` – cần đổi thì báo dev | Mã QR ở box đăng ký quét ra đúng tên + số tài khoản |
| 3.2 | Chính sách bảo mật (A-7) | Đọc `/chinh-sach-bao-mat`: thời hạn lưu, cam kết phản hồi 72 giờ, nhà cung cấp, email liên hệ – sửa gì báo dev | Chủ trung tâm duyệt (RK-20 đóng) |
| 3.3 | Khóa miễn phí (A-8) | Quản trị › Khóa học › Miễn phí › thêm khóa, ảnh bìa, bài + link video. Video YouTube để chế độ **Unlisted** | Khách chưa đăng nhập xem được |
| 3.4 | 2 chương trình Vẹo lưng, Vẹo ngực (A-8) | Thêm chương trình (nhóm bệnh, ảnh bìa, mô tả, "Bạn sẽ đạt được") → bảng **Gói**: giá 1 / 3 / 6 / 12 tháng, số buổi → **Nội dung**: tạo khung N buổi × M bài → điền tên bài + link video | Không còn cảnh báo "bài chưa có video", "số buổi ít hơn gói dài nhất" |
| 3.5 | 3 khóa premium 1:4 / 1:2 / 1:1 (A-8) | Quản trị › Khóa học › Premium | Bấm "Mở Zalo ngay" mở đúng Zalo trung tâm |
| 3.6 | Mẫu phiếu tham vấn (A-10) | Quản trị › Mẫu phiếu: sửa / bật tắt / sắp xếp 6 câu mẫu | Bác sĩ duyệt bộ câu hỏi |

### Giai đoạn 4 – Con người & quy trình

| Bước | Việc | Cách làm | Xong khi |
| --- | --- | --- | --- |
| 4.1 | Tài khoản nhân viên (A-9) | Nhân viên tự đăng ký ở `/register` (hoặc admin tạo ở Bệnh nhân › Tạo bệnh nhân) → admin: Bệnh nhân › ô Vai trò → **Nhân viên** | Nhân viên đăng nhập thấy menu 5 mục |
| 4.2 | Hướng dẫn nhân viên (~30 phút) | Đi qua §6: duyệt đơn (mở ảnh, **đối chiếu sao kê ngân hàng** trước khi Duyệt), tạo bệnh nhân Zalo + gửi tin nhắn mật khẩu, cấp gói / gia hạn, cấp lại mật khẩu, xử lý phiếu tham vấn, khách quan tâm | Mỗi nhân viên tự làm thử 1 lần trên tài khoản test |
| 4.3 | Mẫu tin nhắn Zalo | Chủ dự án soạn: lời mời chạy thử, gửi tài khoản (nút "Chép tin nhắn gửi Zalo" đã có sẵn), nhắc tập khi "không tập > 7 ngày", nhắc gia hạn | Lưu ở Zalo "Tin nhắn nhanh" |
| 4.4 | Phân công | Ai mở **Tổng quan đầu mỗi ca** (chưa có thông báo – RK-33), ai đối soát tiền cuối tuần, ai liên hệ dev khi lỗi | Có danh sách người phụ trách |

### Giai đoạn 5 – Nghiệm thu trước khi mời bệnh nhân (dev + chủ dự án, ~1 giờ)

Thử trên **iPhone (Safari)**, **Android (Chrome)** và máy tính (admin). Tài khoản thử là người nội bộ; xong có thể giữ làm tài khoản thật hoặc xóa.

- [ ] Khách: trang chủ hiện đúng 3 nhóm khóa, ảnh bìa; xem video khóa miễn phí không cần đăng nhập
- [ ] Khách: khóa premium → để lại SĐT / "Mở Zalo ngay" → nhân viên thấy ở Khách quan tâm
- [ ] Đăng ký chương trình bằng điện thoại: chọn gói, **chuyển khoản thật** theo QR (gói rẻ nhất), tải ảnh → nhân viên **Duyệt** → bệnh nhân thấy "Còn N ngày"
- [ ] Nhân viên tạo bệnh nhân Zalo + cấp gói tiền mặt → đăng nhập bằng SĐT + mật khẩu được cấp → hộp nhắc đổi mật khẩu
- [ ] Bệnh nhân: tick hết Buổi 1 → Buổi 2 mở; vòng tiến độ đổi; nút "Tiếp tục Buổi X – Bài Y" đúng
- [ ] Bệnh nhân gửi phiếu tham vấn → nhân viên chuyển Mới → Đã liên hệ → Hoàn tất
- [ ] Quên mật khẩu bằng email thật nhận mã
- [ ] Admin: Tổng quan khớp số liệu, doanh thu hiện đúng 2 giao dịch thử
- [ ] Workers › hv-web › Logs không có lỗi đỏ trong lúc thử; kèm checklist CF-01 → CF-41 ([cloudflare-migration §5](cloudflare-migration.md#5-checklist-nghiệm-thu-inspection))

### Giai đoạn 6 – Chạy thử (đề xuất 4 tuần, 10–30 bệnh nhân – chủ dự án chốt ở bước 6.1)

| Bước | Việc | Cách làm |
| --- | --- | --- |
| 6.1 | Chốt nhóm chạy thử | Số người, nhóm bệnh (vẹo lưng / vẹo ngực), thời gian, giá (đầy đủ / ưu đãi / cấp gói 0đ ghi chú "chạy thử") – ghi vào roadmap §3.1 |
| 6.2 | Mời theo đợt nhỏ | Tuần 1: 5–10 người (người quen, bệnh nhân cũ) → sửa lỗi phát sinh → tuần 2 trở đi mời thêm |
| 6.3 | Hằng ngày | Mở **Tổng quan** đầu ca: đơn chờ duyệt, phiếu tham vấn mới, khách quan tâm mới; gọi / Zalo bệnh nhân sắp hết hạn |
| 6.4 | Hằng tuần | Đối soát doanh thu "Theo người duyệt / cấp gói" với sao kê + tiền mặt; xem Actions có ✅ "Sao lưu production"; nhắn bệnh nhân "không tập > 7 ngày"; ghi góp ý / lỗi vào nhật ký §10.1 |
| 6.5 | Hằng tháng | Ghi Usage vào §12.2 (A-16); tải 1 bản sao lưu `.gpg` cất vào Google Drive của trung tâm |
| 6.6 | Khi có lỗi | Tra §8; gửi dev: ảnh chụp màn hình, giờ xảy ra, tài khoản (SĐT), thao tác vừa làm |

### Giai đoạn 7 – Đánh giá & quyết định (cuối đợt chạy thử)

| Chỉ số | Lấy ở đâu |
| --- | --- |
| Số bệnh nhân tham gia / đã kích hoạt gói | Tổng quan, Bệnh nhân |
| Tỷ lệ tập đều (không nằm trong "không tập > 7 ngày") | Bệnh nhân › lọc "Không tập > 7 ngày" |
| Tiến độ trung bình theo chương trình | Tổng quan |
| Số phiếu tham vấn, thời gian từ Mới → Đã liên hệ | Phiếu tham vấn |
| Tỷ lệ gia hạn; khách từ khóa miễn phí / premium chuyển thành bệnh nhân | Đơn đăng ký, Khách quan tâm |
| Thời gian duyệt đơn trung bình; số lỗi; góp ý chính | Đơn đăng ký (Ngày đăng ký → Ngày xử lý), nhật ký §10.1 |

Quyết định: **(a) mở rộng** → hạ tầng theo ngưỡng (Supabase Pro khi chạm hạn mức – roadmap §3.3; web đã ở Cloudflare Workers Paid), bật Turnstile, quảng bá;
**(b) điều chỉnh** → chủ dự án sắp lại backlog roadmap §3.2 theo góp ý; **(c) dừng / đổi hướng**. Ghi kết quả vào project-review.

### 10.1. Nhật ký chạy thử

| Ngày | Người ghi | Loại (lỗi / góp ý / sự cố / số liệu) | Nội dung | Xử lý | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## 11. Giám sát (đề xuất)

- Cloudflare **Web Analytics** (miễn phí) cho lượt xem; Workers › Metrics (request, lỗi, CPU).
- **Workers Logs** (giữ 7 ngày, 20 triệu dòng/tháng trong gói Paid) để bắt lỗi server action; Sentry nếu cần cảnh báo.
- Supabase › Reports: số kết nối, dung lượng DB/Storage.
- Cảnh báo khi số đơn `pending` > 24 giờ (truy vấn định kỳ hoặc email hằng ngày cho admin).
- **Mỗi tháng** (giai đoạn gói Free): ghi số liệu ở Supabase › Organization › Usage và Cloudflare › Workers & Pages › Usage vào bảng §12.2, so với ngưỡng chuyển gói.

## 12. Giai đoạn thử nghiệm trên gói Free & lộ trình chuyển gói (chốt 02/10/2026)

Chủ dự án chọn chạy thử nghiệm (vài chục người xem cùng lúc) trên **Supabase Free + Vercel Hobby**, chuyển gói theo ngưỡng.
**Cập nhật 04/10/2026 (ADR-017)**: phần web chuyển sang **Cloudflare Workers Paid** (~5 USD/tháng, hợp lệ thương mại) – các dòng "Vercel"
bên dưới thay bằng hạn mức Workers Paid (10 triệu request, 30 triệu ms CPU / tháng) sau Đợt 17. **Supabase Free giữ làm mặc định**, chỉ nâng
Pro khi chạm hạn mức Storage / egress (roadmap §3.3).
Phân tích tải đầy đủ: [project-review §7.8](../10-review/project-review.md#78-đánh-giá-hạ-tầng--quy-mô-500-người-học-cùng-lúc-02102026).

### 12.1. Gói Free chứa được bao nhiêu

Giả định mỗi bệnh nhân đang tập: ~30 buổi/tháng × ~8 lượt mở trang / tick; ~4 ảnh chuyển khoản/năm, mỗi ảnh ~0,5 MB (đã nén).
Hạn mức gói theo bảng giá tại thời điểm viết – **đối chiếu lại trang giá** của Supabase / Cloudflare (tra 04/10/2026) khi quyết định.

| Hạn mức Free | Đủ cho khoảng | Cạn trước? |
| --- | --- | --- |
| Supabase database 500 MB | Hàng nghìn bệnh nhân (< 100 KB / người) | Không |
| Supabase Storage 1 GB | ~2.000 ảnh chuyển khoản **tích lũy** (30 giao dịch/tháng → > 5 năm; 100/tháng → ~1,5 năm) | ⚠️ |
| Supabase egress 5 GB/tháng | ~1.000 bệnh nhân hoạt động (video ở YouTube, không tính); sao lưu ảnh hằng tháng cũng tính vào đây | Không |
| Supabase 50.000 MAU | Thoải mái | Không |
| Cloudflare Workers Paid: 10 triệu request, 30 triệu ms CPU / tháng (vượt: 0,30 USD / triệu request, 0,02 USD / triệu ms CPU) | Vài nghìn bệnh nhân tập đều | Không |
| R2 10 GB, D1 5 GB, Durable Objects 1 triệu request (bộ nhớ đệm trang) | Thoải mái | Không |
| Gmail SMTP ~500 thư/ngày | Chỉ dùng quên mật khẩu | Không |

→ Gói Free chịu được khoảng **50 người cùng lúc, 300–500 bệnh nhân hoạt động, vài nghìn giao dịch tích lũy**.
Hạn chế không phải tải mà là: **tạm dừng sau 7 ngày** (bù bằng `keepalive.yml`), **không backup** (bù bằng `backup.yml`),
Vercel Hobby chỉ cho mục đích phi thương mại → đã giải quyết bằng Cloudflare Workers Paid (ADR-017).

### 12.2. Ngưỡng chuyển gói (gặp **một** dấu hiệu là chuyển)

| Giai đoạn | Dấu hiệu | Hạ tầng | Chi phí / tháng (ước tính) |
| --- | --- | --- | --- |
| 0. Thử nghiệm + kinh doanh nhỏ (sau Đợt 17) | — | Supabase Free + **Cloudflare Workers Paid** + keepalive + backup | ~5 USD |
| 1. Chạm hạn mức Supabase Free | Storage > 600 MB · egress > 3,5 GB/tháng · cần backup hằng ngày tự động / hỗ trợ kỹ thuật | + **Supabase Pro** (hoặc chuyển ảnh sang R2 để kéo dài Free – RK-37) | ~30 USD |
| 2. Mở rộng | > 200 bệnh nhân (danh sách admin chỉ hiện 200 dòng) · > 100 người cùng lúc · trang chậm > 1 giây giờ cao điểm | Như trên + đợt code: phân trang (RV-12), nới giới hạn đăng nhập theo IP (RK-39), giới hạn Supabase Auth (RK-40), giám sát lỗi | 5–30 USD + 1 đợt code |
| 3. Quy mô mục tiêu | 300–500 người cùng lúc, ~1.000 bệnh nhân · CPU database > 60% giờ cao điểm | Supabase Pro + compute Small; staging + chạy thử tải trước | ~45–65 USD |

Supabase Free là mặc định – **không nâng theo lịch**, chỉ nâng khi gặp dấu hiệu ở dòng 1 (chủ dự án chốt 04/10/2026).

**Theo dõi hằng tháng** (điền khi xem Usage):

| Tháng | Bệnh nhân hoạt động | DB (MB) | Storage (MB) | Egress (GB) | Workers request / CPU (ms) | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| 10/2026 | | | | | | |
