# Chuyển hạ tầng sang Cloudflare Workers (Đợt 17) – kế hoạch, rà soát ảnh hưởng, checklist nghiệm thu

> Quyết định: [ADR-017](../03-architecture/adr/ADR-017-cloudflare-workers.md) (chủ dự án chốt 04/10/2026).
> Theo dõi tiến độ: [roadmap §3.4](../10-review/roadmap.md#34-đợt-17--chuyển-hạ-tầng-sang-cloudflare-workers-kế-hoạch-04102026).
> Rủi ro mới RK-43 → RK-52: [project-review §7.9](../10-review/project-review.md#79-rà-soát-chuyển-hạ-tầng-sang-cloudflare-workers-04102026).

Cách dùng: làm lần lượt §4 (giai đoạn P0 → P6). Mỗi giai đoạn có tiêu chí **"Xong khi"**. Không bắt đầu cutover (P5) khi checklist §5
còn mục 🔴 chưa đạt. Đánh dấu ⬜ → ✅ + ngày ngay trong file này.

## 1. Mục tiêu & phạm vi

| | Trước (Đợt 16) | Sau (Đợt 17) |
| --- | --- | --- |
| Chạy web (Next.js) | Vercel Hobby, vùng `sin1` | **Cloudflare Workers Paid** + `@opennextjs/cloudflare`, Smart Placement |
| Next.js / React | 14.2 / 18 | **15 (latest minor) / 19** |
| Database, đăng nhập, ảnh | Supabase Free (Singapore) | **Giữ nguyên** – không đổi schema, RLS, Storage |
| Bộ nhớ đệm trang tĩnh (ISR) | Vercel tự lo | R2 (cache) + D1 (tag cache) + Durable Objects (queue) |
| Tên miền / DNS | Chưa có (`*.vercel.app`) | DNS trên Cloudflare (zone Free); tạm `*.workers.dev` nếu chưa mua |
| Email quên mật khẩu | `nodemailer` → SMTP Gmail | Giữ nếu chạy được trên Workers (P0), không thì Resend (HTTP API) |
| Triển khai | Vercel Git | Workers Builds (GitHub `main` → production, nhánh khác → link xem trước) |
| Sao lưu, keepalive | GitHub Actions | **Giữ nguyên** (gọi thẳng Supabase, không qua web) |
| Thống kê truy cập | (`@vercel/analytics` khai báo nhưng không dùng) | Cloudflare Web Analytics (miễn phí) |

**Không thuộc phạm vi**: đổi Supabase sang D1/R2, chuyển ảnh sang R2 (để sau – RK-37), thông báo R-01, video riêng tư R-10.

### 1.1. Chi phí giai đoạn đầu

| Hạng mục | Chi phí | Ghi chú |
| --- | --- | --- |
| Cloudflare Workers Paid | **5 USD/tháng** | Gồm 10 triệu request, 30 triệu ms CPU; R2 10 GB, D1 5 GB, Durable Objects 1 triệu request, Workers Logs 20 triệu dòng (giữ 7 ngày) |
| Supabase | 0đ | Free; nâng Pro chỉ khi chạm ngưỡng runbook §12.2 |
| Tên miền | `.com` ~10–11 USD/năm (Cloudflare Registrar) · `.vn` ~750 nghìn – 1,1 triệu đ năm đầu, gia hạn hằng năm | Thuê theo năm, bật tự gia hạn |
| Email gửi đi | 0đ | Gmail SMTP hoặc Resend Free (~3.000 thư/tháng, cần tên miền đã xác minh) |
| GitHub Actions | 0đ | Như hiện tại |

Số liệu gói Cloudflare tra ngày 04/10/2026 ([pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[limits](https://developers.cloudflare.com/workers/platform/limits/)); đối chiếu lại khi đăng ký.

## 2. Kiến trúc sau chuyển đổi

```
Trình duyệt (VN)
   │  HTTPS
   ▼
Cloudflare (PoP Hà Nội / TP.HCM): DNS · SSL · DDoS/WAF · tài nguyên tĩnh (/_next/static, /images)
   │
   ▼
Worker "hv-web" (OpenNext) ── Smart Placement đặt gần Supabase
   ├─ middleware (đọc cookie phiên – ADR-016)
   ├─ trang / server action (Node compat: nodejs_compat)
   ├─ R2  NEXT_INC_CACHE_R2_BUCKET   ← trang ISR (/, /register, /khoa-hoc/[id])
   ├─ D1  NEXT_TAG_CACHE_D1          ← revalidatePath / revalidateTag
   └─ DO  NEXT_CACHE_DO_QUEUE        ← làm mới theo thời gian (revalidate = 300)
   │  HTTPS (fetch)
   ▼
Supabase Free (Singapore): Auth · Postgres + RLS · Storage (payment-proofs riêng tư, course-covers công khai)

GitHub Actions: keepalive.yml, backup.yml → Supabase (không đổi)
```

## 3. Rà soát ảnh hưởng (đã đọc mã nguồn 04/10/2026)

Ký hiệu: 🔴 bắt buộc sửa trước khi chạy thật · 🟠 phải sửa trong đợt · 🟡 nên làm / kiểm tra · ✅ không ảnh hưởng.

### 3.1. Mã nguồn

| # | Hạng mục | Hiện trạng (file) | Ảnh hưởng trên Workers | Việc cần làm | Mức |
| --- | --- | --- | --- | --- | --- |
| I-01 ✅ | IP người dùng cho giới hạn tần suất | `lib/rate-limit.ts` `clientIp()` lấy phần tử **đầu** `x-forwarded-for`; dùng ở đăng nhập, đăng ký, quên mật khẩu, lead, Turnstile (`remoteip`) | Cloudflare **giữ** `X-Forwarded-For` do người dùng gửi và nối thêm IP vào cuối → người dùng tự đặt được phần tử đầu → **vượt giới hạn đăng nhập sai / đăng ký / gửi mã** (RK-43) | Ưu tiên `cf-connecting-ip`, rồi `x-real-ip`, cuối cùng `x-forwarded-for` (chỉ khi chạy local); cập nhật comment; E2E giả header `X-Forwarded-For` phải không né được giới hạn | 🔴 |
| I-02 ✅ | Phiên bản Next.js | `next ^14.2.35`, `react ^18` | OpenNext đã ngừng hỗ trợ Next 14 (RK-44) | Nâng Next 15 + React 19, `eslint-config-next` 15, `@types/react` 19 | 🔴 |
| I-03 ✅ | API động thành bất đồng bộ (Next 15) | `cookies()` ở `lib/supabase/server.ts`, `lib/flash.ts`; `headers()` ở `lib/rate-limit.ts`; `params` / `searchParams` ở 16 file trong `app/` | Next 15 bắt buộc `await` | Đổi sang `await cookies()` / `await headers()`; `params: Promise<…>`; `createClient()` thành async → sửa mọi chỗ gọi | 🔴 |
| I-04 ✅ | Hook form | `useFormState` / `useFormStatus` ở 5 file (`NewPatientForm`, `ConsultationForm`, `ForgotPasswordForm`, `RegisterForm`, `SubmitButton`) | React 19 đổi `useFormState` → `useActionState` (`react`) | Đổi tên + import; `useFormStatus` giữ (`react-dom`) | 🟠 |
| I-05 ✅ | `@supabase/ssr` 0.5 → 0.12 | Cookie API kiểu `get/set/remove` ở `middleware.ts`, `lib/supabase/server.ts` | Bản mới khuyến nghị `getAll/setAll`; cần tương thích Next 15 | Nâng `@supabase/ssr` bản mới nhất, chuyển `getAll/setAll` (giữ hành vi ADR-016) | 🟠 |
| I-06 ✅ | ISR + làm mới theo yêu cầu | `export const revalidate = 300` ở `app/page.tsx`, `app/register/page.tsx`, `app/khoa-hoc/[courseId]/page.tsx`; ~22 lần gọi `revalidatePath` | Không cấu hình cache → trang không được lưu / không làm mới đúng (RK-45) | `open-next.config.ts`: R2 incremental cache + D1 tag cache + DO queue; tạo bucket / database; kiểm tra admin sửa khóa → trang chủ đổi ngay | 🔴 |
| I-07 ✅ | Gửi email | `lib/mailer.ts` dùng `nodemailer` (TCP/TLS tới Gmail 465) | Chưa chắc chạy trên `workerd` (RK-46) | ✅ P0: `nodemailer` **không** chạy trên workerd; thư viện `worker-mailer` import tĩnh `cloudflare:sockets` nên OpenNext không đóng gói được → tự viết `lib/smtp-workers.ts` (~130 dòng, SMTP qua socket Cloudflare, SSL 465 / STARTTLS 587, AUTH PLAIN, text + HTML UTF-8). Node vẫn dùng `nodemailer` | 🔴 |
| I-08 ✅ | Hộp thư giả khi kiểm thử | `MAIL_OUTBOX_DIR` → `fs.writeFileSync` | Workers không có hệ thống file → E2E quên mật khẩu không đọc được mã | ✅ `MAIL_OUTBOX_URL` (HTTP) cho cả Node và Workers; bỏ `MAIL_OUTBOX_DIR` | 🟠 |
| I-09 | `crypto`, `Buffer` | `randomUUID`, `randomInt`, `createHash`, `timingSafeEqual`, `Buffer.from` (forgot-password, register, patients, generate-password) | Có trong `nodejs_compat` | Kiểm tra bằng E2E trên preview (đặt lại mật khẩu, tạo bệnh nhân, mật khẩu sinh ngẫu nhiên) | 🟡 |
| I-10 ✅ | Tối ưu ảnh `next/image` | 3 chỗ: `app/page.tsx`, `app/khoa-hoc/[courseId]/page.tsx`, `components/CourseCover.tsx`; `remotePatterns` Supabase | Cần binding `IMAGES` (Cloudflare Images, tính phí theo lượt biến đổi) hoặc tắt tối ưu (RK-47) | Giai đoạn đầu: `images.unoptimized = true` (ảnh bìa đã nén ≤ 1600px trên trình duyệt, ảnh `public/` tự nén trước); theo dõi dung lượng trang; xem lại khi nhiều khóa | 🟠 |
| I-11 | Upload ảnh qua server action | `serverActions.bodySizeLimit: '6mb'` (ảnh chuyển khoản ≤ 5 MB) | Workers nhận body ≤ 100 MB → đủ; cần thử thật | E2E đăng ký có ảnh + tạo bệnh nhân có ảnh trên preview | 🟡 |
| I-12 | Middleware | `middleware.ts` (edge, chỉ đọc cookie) | OpenNext hỗ trợ middleware edge; Node middleware (Next 15.2+) chưa hỗ trợ | Giữ middleware edge, **không** bật `runtime: 'nodejs'` | 🟡 |
| I-13 | Header bảo mật / CSP | `next.config.mjs` đọc `NEXT_PUBLIC_SUPABASE_URL` **lúc build** để tạo CSP + `remotePatterns` | Biến phải có ở môi trường build của Workers Builds; Web Analytics cần thêm domain vào CSP | Thêm `https://static.cloudflareinsights.com` (script) và `https://cloudflareinsights.com` (connect) nếu bật Web Analytics; kiểm tra header bằng `curl -I` | 🟠 |
| I-14 ✅ | Thư viện không dùng / riêng Node | `@vercel/analytics` (không import ở đâu), `sharp` (chỉ để Next tối ưu ảnh trên Node) | Tăng kích thước bản build; `sharp` không chạy trên Workers | ✅ Gỡ `@vercel/analytics`; `sharp` chuyển sang devDependencies (chỉ script E2E dùng) | 🟡 |
| I-15 ✅ | Kích thước Worker | **1,6 MiB nén** (7,8 MiB chưa nén) – đo 04/10 | Gói Paid giới hạn 10 MiB (nén gzip) | `opennextjs-cloudflare build` rồi `wrangler deploy --dry-run` xem kích thước; ghi vào §6 | 🟡 |
| I-16 | Phông chữ | `next/font/google` (Be Vietnam Pro) tải lúc build | Tự host trong bản build → không ảnh hưởng | — | ✅ |
| I-17 | Biến môi trường | 9 biến (`NEXT_PUBLIC_*` ×4, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `SMTP_*`, `MAIL_FROM`, `MAIL_OUTBOX_DIR`) | `NEXT_PUBLIC_*` nhúng lúc **build**; khóa bí mật lúc **chạy** – đặt nhầm chỗ → lỗi hoặc lộ khóa (RK-48) | Bảng §4 P3.4; khóa bí mật chỉ đặt dạng **Secret** (không ghi trong `wrangler.jsonc`) | 🔴 |
| I-18 | Thời gian chạy dài | Không có tác vụ > 30 giây | CPU mặc định 30 giây/request trên Paid | — | ✅ |
| I-19 | Kết nối database | Mọi truy vấn qua PostgREST (HTTPS) | Không mở kết nối Postgres trực tiếp → không cần Hyperdrive | — | ✅ |
| I-20 🟡 | Trang Chính sách bảo mật | `app/chinh-sach-bao-mat/page.tsx:86` ghi nhà cung cấp lưu trữ "(Vercel)" | Thông tin pháp lý sai sau khi chuyển | ✅ Đã đổi thành Cloudflare; ⬜ chủ trung tâm duyệt cùng A-7 | 🔴 |
| I-21 | Đăng nhập phía server và giới hạn Supabase Auth | `signInWithPassword` trong server action (RK-40) | Supabase thấy IP của Cloudflare thay vì Vercel – bản chất không đổi | Giữ theo dõi RK-40 ở giai đoạn 2 | 🟡 |

### 3.2. Kiểm thử, CI, script

| # | Hạng mục | Việc cần làm | Mức |
| --- | --- | --- | --- |
| I-22 ✅ | `scripts/e2e.mjs` chạy `next start` (Node) | Thêm chế độ `E2E_RUNTIME=workers`: build OpenNext, chạy `opennextjs-cloudflare preview` (workerd), dùng `.dev.vars` tạm từ `.env.local`; giữ chế độ Node để so sánh khi có lỗi. **Kết quả nghiệm thu tính trên chế độ workers** (RK-50) | 🔴 |
| I-23 ✅ | `.github/workflows/ci.yml` | Job `check`: thêm `npx opennextjs-cloudflare build` để bắt lỗi tương thích sớm; job `e2e` (khi có staging) chạy chế độ workers | 🟠 |
| I-24 | `keepalive.yml`, `backup.yml`, `scripts/backup-storage.mjs`, `scripts/create-admin.mjs` | Gọi thẳng Supabase, chạy trên Node của GitHub / máy – **không đổi** | ✅ |
| I-25 | `vercel.json`, `.vercel/` | Xóa sau cutover (P6), không xóa trước để còn đường lùi | 🟡 |
| I-26 ✅ | `.gitignore` | Thêm `.open-next/`, `.wrangler/`, `.dev.vars` | 🔴 |

### 3.3. Cấu hình bên ngoài

| # | Hạng mục | Việc cần làm | Ai |
| --- | --- | --- | --- |
| I-27 | Supabase › Authentication › URL Configuration | Site URL = tên miền mới; Redirect URLs thêm domain mới (+ link preview nếu cần thử) | Chủ dự án |
| I-28 | Cloudflare Turnstile (nếu bật – A-4) | Thêm hostname mới (domain / `*.workers.dev`) vào widget | Chủ dự án |
| I-29 | `NEXT_PUBLIC_SITE_URL`, `lib/site-config.ts` (`siteConfig.url`), `metadataBase`, ảnh chia sẻ OG | Trỏ về domain mới; link gửi qua Zalo dùng domain mới (RK-49) | Dev + chủ dự án |
| I-30 | Email gửi đi | Nếu dùng Resend: tạo tài khoản, xác minh domain (bản ghi DNS SPF/DKIM trên Cloudflare), `MAIL_FROM` dùng domain | Chủ dự án |
| I-31 | Email nhận (A-6) | Cloudflare Email Routing: `lienhe@<domain>` → Gmail trung tâm (miễn phí) | Chủ dự án |
| I-32 | Tài liệu | README, runbook (§1, §2, §4, §8, §10 bước 1.3, §12), system-architecture, source-structure, development-guide, ADR-001 (ghi chú), SRS (NFR hạ tầng), templates (release-checklist, bug-report), project-overview | Dev |

## 4. Kế hoạch từng giai đoạn

Thứ tự đề xuất: **P0 → P1 → (Đợt 18 – thêm / sửa / xóa) → P2 → P3 → P4 → P5 → P6**. Đợt 18 làm sau P1 để code mới viết thẳng trên Next 15,
tránh sửa hai lần. Đợt 14 (chạy thử) tạm dừng ở bước 1.2; bước 1.3 "Vercel production" được thay bằng P3 → P5 của đợt này.

| GĐ | Nội dung | Ai | Ước lượng | Xong khi |
| --- | --- | --- | --- | --- |
| P0 | Thử nghiệm kỹ thuật (spike) trên nhánh riêng | Dev | 0,5 ngày | Có kết luận cho 4 câu hỏi P0.1 → P0.4, ghi vào §6 |
| P1 | Nâng Next 15 / React 19, vẫn chạy Node | Dev | 1–1,5 ngày | typecheck / lint / build sạch; **E2E 98/98 trên Node** |
| P2 | Chuyển sang Workers (OpenNext, cache, IP, email, ảnh, E2E chế độ workers) | Dev | 1,5–2 ngày | **E2E toàn bộ PASS trên preview workerd** + bước mới TC-IP, TC-ISR |
| P3 | Dựng hạ tầng Cloudflare + cấu hình | Chủ dự án (dev hướng dẫn) | 1 buổi | Worker chạy trên `*.workers.dev`, đủ biến, R2 / D1 / DO đã gắn |
| P4 | Nghiệm thu theo checklist §5 | Dev + chủ dự án | 0,5–1 ngày | Mọi mục 🔴 đạt, mục 🟠 đạt hoặc có ghi chú chấp nhận |
| P5 | Cutover: trỏ domain, đổi URL Supabase / Turnstile, theo dõi | Chủ dự án + dev | 1 buổi + theo dõi 14 ngày | Smoke test trên domain đạt; 14 ngày không lỗi nghiêm trọng |
| P6 | Dọn dẹp: gỡ Vercel, cập nhật tài liệu cuối, đóng RK | Dev + chủ dự án | 0,5 ngày | Không còn tham chiếu Vercel trong code / tài liệu vận hành |

### P0 – Thử nghiệm kỹ thuật
- ✅ 04/10 P0.1 Dựng app mẫu tối thiểu với `@opennextjs/cloudflare` + Next 15 bản đang chọn; chạy `preview`.
- ✅ 04/10 P0.2 (kết quả ở §6) Gửi thử 1 email qua `nodemailer` → Gmail SMTP 465 trong workerd. Được → giữ SMTP. Không → chọn Resend (cần domain đã xác minh;
  trước khi có domain thì Resend chỉ gửi được tới email của chủ tài khoản).
- ✅ 04/10 P0.3 (gọi được, kể cả khi bật cờ) Gọi `fetch` từ Worker preview tới `http://127.0.0.1:<port>` (cho hộp thư giả E2E). Bị chặn bởi `global_fetch_strictly_public` →
  chạy E2E preview không bật cờ đó (cờ chỉ bật khi deploy) hoặc dùng cách khác, ghi lại.
- ✅ 04/10 P0.4 (TC-103) `revalidatePath` + R2/D1 hoạt động ở preview local (giả lập bằng Miniflare).

### P1 – Nâng Next 15 (vẫn Node, chưa đụng Cloudflare)
- ✅ 04/10 P1.1 Nâng `next`, `react`, `react-dom`, `eslint-config-next`, `@types/react*`; `@supabase/ssr`, `@supabase/supabase-js` bản mới nhất.
- ✅ 04/10 P1.2 Sửa I-03 (async `cookies` / `headers` / `params` / `searchParams` – 19 file), I-04 (`useActionState`), I-05 (`getAll/setAll`).
- ✅ 04/10 P1.3 Rà hành vi cache của Next 15 (fetch mặc định không cache; route GET không cache) – trang công khai vẫn ISR nhờ `revalidate`.
- ✅ 04/10 P1.4 typecheck / lint / build; E2E 98/98 (Node) trên project hiện tại (vẫn là dữ liệu test, chưa dọn – Đợt 14 bước 2.1 chưa làm).
- ✅ 04/10 P1.5 Commit riêng "Next 15" để dễ lùi.

### P2 – Chuyển sang Workers (code)
- ✅ 04/10 P2.1 Thêm `@opennextjs/cloudflare`, `wrangler` (dev); `wrangler.jsonc`: `main: .open-next/worker.js`, `compatibility_date` mới,
  `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`, `assets`, `services` (WORKER_SELF_REFERENCE), `r2_buckets`,
  `d1_databases`, `durable_objects`, `placement: { mode: "smart" }`, `observability.enabled = true`.
- ✅ 04/10 P2.2 `open-next.config.ts`: R2 incremental cache, D1 tag cache, DO queue (I-06).
- ✅ 04/10 P2.3 Scripts `package.json`: `preview`, `deploy`, `cf-typegen`; `public/_headers` cache dài hạn cho `/_next/static/*`.
- ✅ 04/10 P2.4 I-01 `clientIp()` dùng `cf-connecting-ip` (🔴 bảo mật).
- ✅ 04/10 P2.5 I-07 / I-08 email + hộp thư giả qua HTTP.
- ✅ 04/10 P2.6 I-10 `images.unoptimized`; I-13 CSP; I-14 gỡ `@vercel/analytics`, xử lý `sharp`; I-20 trang chính sách; I-26 `.gitignore`.
- ✅ 04/10 P2.7 I-22 E2E chế độ workers + bước mới: **TC-IP** (gửi `X-Forwarded-For` giả 6 lần đăng nhập sai vẫn bị chặn theo IP thật),
  **TC-ISR** (admin đổi tên khóa → trang chủ đổi trong ≤ 1 lần tải lại; không đổi gì → trang chủ trả từ cache).
- ✅ 04/10 P2.8 I-23 CI build OpenNext. I-15 đo kích thước Worker.
- ✅ 04/10 P2.9 E2E toàn bộ trên preview workerd PASS; ghi số bước vào test-plan.

### P3 – Hạ tầng Cloudflare (chủ dự án, dev hướng dẫn qua màn hình)
- ⬜ P3.1 (A-18) Tạo tài khoản Cloudflare bằng email trung tâm, bật 2 lớp xác thực (2FA), đăng ký **Workers Paid**; đặt cảnh báo thanh toán.
- ⬜ P3.2 (A-19) Tên miền: mua (`.com` trên Cloudflare Registrar hoặc `.vn` ở nhà đăng ký VN) → thêm zone vào Cloudflare → đổi nameserver.
  Chưa có domain thì chạy tạm `hv-web.<tài-khoản>.workers.dev`.
- ⬜ P3.3 Tạo R2 bucket (cache), D1 database (tag cache) – tên theo `wrangler.jsonc`.
- ⬜ P3.4 Workers Builds: kết nối repo GitHub, nhánh production `main`, lệnh build `npx opennextjs-cloudflare build`, lệnh deploy
  `npx opennextjs-cloudflare deploy`. Biến:

  | Biến | Loại | Đặt ở |
  | --- | --- | --- |
  | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Công khai, nhúng lúc build | **Build variables** (và Variables lúc chạy cho chắc) |
  | `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `SMTP_PASS` hoặc `RESEND_API_KEY` | **Bí mật** | Variables and Secrets › **Secret** (mã hóa, không hiện lại) |
  | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `MAIL_FROM` | Thường | Variables |
  | `MAIL_OUTBOX_DIR`, `MAIL_OUTBOX_URL` | ⛔ Không bao giờ đặt trên production | — |

- ⬜ P3.5 Deploy lần đầu lên `*.workers.dev` (chưa trỏ domain). Bật Workers Logs, Web Analytics.
- ⬜ P3.6 Supabase › Auth › URL Configuration: thêm URL `*.workers.dev` vào Redirect URLs để thử (Site URL đổi ở P5).
- ⬜ P3.7 (A-15) Xác nhận vùng Supabase = Singapore (Smart Placement tự đặt gần, nhưng vẫn cần biết để ghi tài liệu).

### P4 – Nghiệm thu
Chạy toàn bộ checklist §5 trên bản `*.workers.dev` với project Supabase hiện tại. Ghi kết quả vào §6.

### P5 – Cutover
Vì **chưa có bệnh nhân thật** (Đợt 14 chưa mời ai), cutover không cần giờ thấp điểm, không có dữ liệu phải di chuyển.
1. ⬜ Gắn Custom Domain cho Worker (`<domain>` và `www.<domain>` → chuyển hướng 301 về một bản chính).
2. ⬜ `NEXT_PUBLIC_SITE_URL` = domain → build lại.
3. ⬜ Supabase Site URL = domain; Turnstile thêm hostname; (Resend) xác minh domain.
4. ⬜ Smoke test §5 nhóm "Smoke" trên domain (15 phút).
5. ⬜ Theo dõi 14 ngày: Workers Logs (lỗi 5xx), Usage (CPU, request), Supabase Usage; ghi nhật ký runbook §10.1.

### P6 – Dọn dẹp
- ⬜ Xóa project trên Vercel (sau 14 ngày ổn định), xóa `vercel.json`; gỡ biến `NEXT_DIST_DIR` nếu không còn dùng.
- ⬜ Cập nhật tài liệu I-32; đóng RK-35, RK-43 → RK-50 tương ứng; roadmap §1.1 / §4.

## 5. Checklist nghiệm thu (inspection)

Mỗi mục: **cách kiểm tra** → **đạt khi**. Mức: 🔴 chặn cutover · 🟠 phải đạt hoặc ghi chấp nhận · 🟡 nên đạt.
Cột "Smoke" (S) = chạy lại sau cutover trên domain thật.

### 5.1. Chức năng (theo vai trò)

| ID | Mức | S | Kiểm tra | Đạt khi |
| --- | --- | --- | --- | --- |
| CF-01 | 🔴 | | E2E toàn bộ chế độ workers (P2.9) | 100% PASS, ảnh chụp lưu `test-results/` |
| CF-02 | 🔴 | ✓ | Khách: trang chủ, `/khoa-hoc/<id>`, khóa miễn phí xem video không cần đăng nhập, chính sách bảo mật | Hiển thị đủ, không lỗi console |
| CF-03 | 🔴 | ✓ | Đăng ký 3 bước trên **iPhone (Safari) + Android (Chrome)**: QR đúng số tiền, chụp / chọn ảnh, nén ảnh, gửi | Tạo đơn `pending`, ảnh xem được ở admin |
| CF-04 | 🔴 | ✓ | Đăng nhập bằng email, SĐT `0912…`, `+84…`; đăng xuất; vào `/admin` khi chưa đăng nhập | Đúng chuyển hướng, cookie phiên được ghi / xóa |
| CF-05 | 🔴 | ✓ | Quên mật khẩu với email thật → nhận mã → đặt mật khẩu mới | Thư tới trong ≤ 1 phút, không vào Spam; mã sai bị chặn |
| CF-06 | 🔴 | | Bệnh nhân: tập theo buổi, tick / bỏ tick, buổi sau mở, hết hạn mất video, phiếu tham vấn | Như E2E [Bệnh nhân] |
| CF-07 | 🔴 | ✓ | Nhân viên: duyệt đơn, tạo bệnh nhân Zalo (có ảnh), cấp gói, cấp lại mật khẩu, xử lý phiếu / lead | Thao tác thành công, toast hiện |
| CF-08 | 🔴 | | Admin: tạo / sửa / ẩn / xóa khóa, ảnh bìa, gói, buổi – bài; Tổng quan + doanh thu | Như E2E [Admin] |
| CF-09 | 🔴 | ✓ | Sửa tên một khóa ở admin → mở trang chủ (tab ẩn danh) | Tên mới hiện ngay ở lần tải tiếp theo (TC-ISR) |

### 5.2. Bảo mật

| ID | Mức | S | Kiểm tra | Đạt khi |
| --- | --- | --- | --- | --- |
| CF-10 | 🔴 | | Giả `X-Forwarded-For` khi đăng nhập sai liên tục (TC-IP) | Vẫn bị chặn sau 5 lần / tài khoản, 30 lần / IP |
| CF-11 | 🔴 | ✓ | `curl -I https://<domain>` | Có CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`; không có `x-powered-by` |
| CF-12 | 🔴 | | Tìm `service_role` / `SUPABASE_SERVICE_ROLE_KEY` trong `.open-next/assets` và mã trả về trình duyệt | Không thấy; khóa chỉ ở Secret |
| CF-13 | 🔴 | | Repo: `git ls-files` không có `.dev.vars`, `.open-next/`, `.wrangler/` | Không có |
| CF-14 | 🔴 | | Ảnh chuyển khoản (bucket riêng tư) mở bằng link khi chưa đăng nhập / bằng tài khoản bệnh nhân khác | Bị từ chối (RLS không đổi) |
| CF-15 | 🟠 | ✓ | `http://` → `https://`; `www` → bản chính; `*.workers.dev` sau cutover | Chuyển 301 đúng; workers.dev tắt hoặc chuyển về domain |
| CF-16 | 🟠 | | Turnstile (nếu bật) trên domain mới | Widget hiện, token xác minh ở server thành công |
| CF-17 | 🟠 | | Tài khoản Cloudflare: 2FA, chỉ chủ dự án là Super Administrator; token API (nếu có) quyền tối thiểu | Đạt |
| CF-18 | 🟡 | | Cloudflare › Security: Bot Fight Mode, luật giới hạn tần suất cho `POST /login`, `/forgot-password` (1 luật miễn phí) | Bật, không chặn nhầm người dùng thật (thử từ 4G) |

### 5.3. Hiệu năng

| ID | Mức | S | Kiểm tra | Đạt khi |
| --- | --- | --- | --- | --- |
| CF-19 | 🟠 | ✓ | PageSpeed Insights (mobile) trang chủ, `/khoa-hoc/<id>` | LCP ≤ 2,5 giây; điểm Performance không thấp hơn bản Vercel đo cùng ngày |
| CF-20 | 🟠 | | Thời gian phản hồi trang động (`/courses`, `/admin`) đo 10 lần từ 4G Việt Nam (DevTools › Network › TTFB) | Trung vị ≤ 800 ms; tick bài → bài tiếp theo < 1 giây (NFR-16) |
| CF-21 | 🟠 | | Header `cf-cache-status` cho `/_next/static/*` | `HIT` từ lần thứ 2, `cache-control` immutable |
| CF-22 | 🟡 | | Smart Placement: Workers › Settings › Placement | Trạng thái đã chọn vị trí (sau vài giờ có lưu lượng) |
| CF-23 | 🟡 | | Kích thước Worker (I-15) | < 10 MiB nén, ghi số đo |

### 5.4. SEO, chia sẻ, giao diện

| ID | Mức | S | Kiểm tra | Đạt khi |
| --- | --- | --- | --- | --- |
| CF-24 | 🟠 | ✓ | Dán link trang chủ vào Zalo / Facebook | Hiện tiêu đề, mô tả, ảnh OG đúng domain mới |
| CF-25 | 🟠 | | Trang không tồn tại `/abc` | Trang 404 tiếng Việt, mã 404 |
| CF-26 | 🟡 | | Favicon, phông chữ tiếng Việt, ảnh `public/images`, ảnh bìa (tắt tối ưu) | Hiển thị đúng; ảnh không vỡ, dung lượng trang chủ không tăng quá 30% |
| CF-27 | 🟡 | | Video YouTube / TikTok nhúng (CSP `frame-src`) | Phát được trên điện thoại và máy tính |

### 5.5. Vận hành, giám sát, sao lưu, chi phí

| ID | Mức | S | Kiểm tra | Đạt khi |
| --- | --- | --- | --- | --- |
| CF-28 | 🔴 | | Đẩy 1 commit lên `main` | Workers Builds tự build + deploy, link xem trước cho nhánh khác hoạt động |
| CF-29 | 🔴 | | **Lùi phiên bản**: Workers › Deployments › Rollback về bản trước | Website về bản cũ trong < 1 phút |
| CF-30 | 🔴 | | Workers Logs: gây 1 lỗi thử (VD trang admin với tham số sai) | Thấy log lỗi kèm thời điểm, đường dẫn |
| CF-31 | 🟠 | | `keepalive.yml`, `backup.yml` chạy tay 1 lần sau chuyển | Thành công (không phụ thuộc Workers) |
| CF-32 | 🟠 | | Cảnh báo chi phí / usage Cloudflare; Notifications cho lỗi Worker | Đã bật, email về chủ dự án |
| CF-33 | 🟡 | | Web Analytics nhận lượt xem | Có số liệu sau 1 giờ |
| CF-41 | 🟠 | ✓ | Mở `/admin`, `/admin/registrations`, `/admin/patients`, `/admin/courses` 10 lần sau khi thao tác (duyệt đơn, lưu khóa) – DevTools › Console | Không có lỗi React #418 (RK-54). Còn lỗi → ghi lại URL, thử Next / OpenNext bản mới |

### 5.6. Tên miền, email, pháp lý, tài liệu

| ID | Mức | S | Kiểm tra | Đạt khi |
| --- | --- | --- | --- | --- |
| CF-34 | 🔴 | ✓ | Chứng chỉ SSL domain + `www` | Hợp lệ, tự gia hạn (Cloudflare Universal SSL) |
| CF-35 | 🔴 | | Supabase Site URL / Redirect URLs | Chỉ còn domain chính (+ localhost cho dev) |
| CF-36 | 🟠 | | Email gửi đi: SPF / DKIM (nếu Resend) – mail-tester.com | Điểm ≥ 8/10 |
| CF-37 | 🟠 | | Email Routing `lienhe@<domain>` (A-6) | Thư thử tới Gmail trung tâm |
| CF-38 | 🔴 | | Trang chính sách bảo mật ghi đúng nhà cung cấp (I-20) | Chủ trung tâm đã duyệt |
| CF-39 | 🟠 | | Tên miền bật **tự gia hạn**, thông tin chủ sở hữu là trung tâm | Đạt |
| CF-40 | 🟠 | | Tài liệu I-32 cập nhật; runbook có mục "Triển khai lên Cloudflare" và "Lùi phiên bản" | Đạt |

## 6. Nhật ký thử nghiệm & nghiệm thu

| Ngày | Mục | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| 04/10/2026 | P0.2 email | `nodemailer` lỗi "proxy request failed" trên workerd; socket thô `cloudflare:sockets` tới smtp.gmail.com 465 / 587 **được**; `lib/smtp-workers.ts` gửi trọn thư tới máy chủ SMTP giả, tới Gmail đi được tới bước AUTH (tài khoản thử bị từ chối như mong đợi) | `.env.local` chưa có `SMTP_USER` / `SMTP_PASS` → gửi thư thật để ở CF-05 (A-12) |
| 04/10/2026 | P0.3 hộp thư giả | `fetch` tới `http://127.0.0.1` từ wrangler dev chạy được | — |
| 04/10/2026 | Header IP | wrangler dev giữ `X-Forwarded-For` người dùng gửi, `cf-connecting-ip` = IP kết nối → xác nhận RK-43 | — |
| 04/10/2026 | Kích thước Worker | `wrangler deploy --dry-run`: 7.982 KiB, gzip **1.643 KiB** (< 10 MiB Paid, < 3 MiB Free) | — |
| 04/10/2026 | Lỗi Next 15 | Đổi tab `/admin/registrations?status=` không chuyển trang: Next 15.5 hủy điều hướng khi có `app/admin/loading.tsx` + trang chỉ đổi tham số + dữ liệu lớn (tái hiện bằng tài khoản tạm, thu hẹp từng phần) | Bỏ `app/admin/loading.tsx` (RK-53) |
| 04/10/2026 | E2E | **Node 99/99**, **Workers 100/100** (TC-102, TC-103 PASS); RK-54: 12 lỗi hydration #418 ở `/admin/**` trên workerd, ghi nhận riêng | Kiểm lại CF-41 sau deploy |
| 04/10/2026 | Windows | `opennextjs-cloudflare preview` treo ở bước tạo bảng D1 (`npm exec` chèn `^^^`) – E2E tự tạo bảng + `wrangler dev`; Linux / Workers Builds không bị | runbook §8 |
| 04/10/2026 | P3 | Chủ dự án: tài khoản Cloudflare (đăng nhập GitHub), Workers Paid, `wrangler login`, bật R2, subdomain `bsdomanhcuong`. Dev: R2 `hv-web-cache`, D1 `hv-web-tag-cache` + bảng, Secret Supabase / SMTP_HOST / SMTP_PORT | Còn: SMTP_USER / SMTP_PASS / MAIL_FROM, Supabase Site URL, Workers Builds |
| 04/10/2026 | Deploy | **https://hv-web.bsdomanhcuong.workers.dev** (bản `d8fea07c`, 1,6 MiB nén, khởi động 16 ms). Windows: `wrangler deploy` tự chuyển sang `opennextjs-cloudflare deploy` và treo ở D1 → `npm run deploy:win` | runbook §4 |
| 05/10/2026 | Deploy sau rà soát | Bản `a400e7a4`; `enableCacheInterception` hoạt động (`x-opennext-cache: HIT`); TTFB 5 lần: `/register` 0,37 – 1,0 giây (trước 0,6 – 1,4), `/login` 0,22 – 0,89, `/` 0,65 – 1,2; Placement lần đo này `local-SIN` | Dao động chủ yếu do mạng (PERF-01) |
| 04/10/2026 | Smoke | 5 trang công khai 200 (0,7 – 3 giây lần đầu), `/courses`, `/admin` → 307 `/login`, trang lạ 404; đủ header bảo mật, không `x-powered-by`; trang chủ `x-nextjs-cache: HIT`; `/_next/static` cache 1 năm | Còn checklist CF-01 → CF-41 với tài khoản thật |

## 7. Phương án lùi (rollback)

| Tình huống | Cách lùi | Thời gian |
| --- | --- | --- |
| Lỗi ở bản deploy mới (sau cutover) | Workers › Deployments › Rollback (CF-29) | < 1 phút |
| Lỗi nghiêm trọng của nền tảng Workers / OpenNext trong 14 ngày đầu | Giữ project Vercel (Hobby, chưa thu tiền) đến hết P5 → deploy nhánh trước P2 lên Vercel, trỏ DNS domain về Vercel, đổi Supabase Site URL | 30–60 phút |
| Lỗi do nâng Next 15 (P1) | Lùi commit "Next 15" (P1.5) | Theo lần deploy |
| Dữ liệu | Không di chuyển dữ liệu – Supabase giữ nguyên; sao lưu tuần vẫn chạy | — |

Lưu ý: nếu đã bắt đầu thu tiền thì lùi về Vercel phải dùng **Vercel Pro** (RK-35).

## 8. Câu hỏi chờ chủ dự án chốt

| # | Câu hỏi | Đề xuất / chốt |
| --- | --- | --- |
| Q-1 | Tên miền: `.vn` / `.com.vn` / `.com`, mua trước P3 hay chạy tạm `workers.dev`? | ✅ **Chốt 04/10: chạy tạm `*.workers.dev`**, chọn tên miền ở đợt sau. Hệ quả: email gửi đi phải dùng SMTP Gmail (Resend cần domain) – P0.2 bắt buộc đạt; CF-15, CF-34, CF-36, CF-37, CF-39 dời tới khi có domain |
| Q-2 | Email gửi đi nếu SMTP Gmail không chạy trên Workers | ✅ Không cần: SMTP Gmail chạy được qua `lib/smtp-workers.ts` (P0.2) |
| Q-3 | Bật Cloudflare Web Analytics? | Có (miễn phí, không cookie) |
| Q-4 | Giữ Vercel làm đường lùi bao lâu? | 14 ngày sau cutover rồi xóa |
