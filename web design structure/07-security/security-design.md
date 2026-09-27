# Thiết kế bảo mật

## 1. Tài sản cần bảo vệ

| Tài sản | Mức nhạy cảm | Nơi lưu |
| --- | --- | --- |
| Danh sách link video bài học (nội dung trả phí) | Cao | `lessons.video_url` |
| Ảnh chuyển khoản (chứa tên, STK, số tiền của khách) | Cao (dữ liệu cá nhân + tài chính) | Storage `payment-proofs` |
| Thông tin cá nhân: họ tên, SĐT, email | Trung bình – cao | `profiles`, `registrations`, `auth.users` |
| Mật khẩu | Rất cao | `auth.users` (bcrypt do Supabase quản lý) |
| Mã đặt lại mật khẩu | Cao | `password_resets` (chỉ lưu hash) |
| `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_PASS` | Tối quan trọng | Biến môi trường server |
| Quyền admin | Tối quan trọng | `profiles.role` |

## 2. Xác thực (Authentication)

| Hạng mục | Thiết kế |
| --- | --- |
| Nhà cung cấp | Supabase Auth, email + password |
| Định danh | Email thật **hoặc** SĐT (tra qua `profiles`, xem ADR-003) |
| Phiên | Cookie HTTP do `@supabase/ssr` quản lý; middleware làm mới token bằng `getSession()` (không gọi mạng khi token còn hạn) – ADR-016 |
| Kiểm tra phiên ở server | Mọi quyết định quyền dùng `auth.getUser()` (xác minh với Supabase) qua `getCurrentUser()` (cache theo request) và `requireUserPage` / `requireStaffPage` / `requireAdminPage`. Middleware chỉ dùng `getSession()` để **chuyển hướng** khách chưa đăng nhập – cookie giả qua được middleware nhưng bị chặn ở trang + RLS (ADR-016) |
| Ở client | `getSession()` + `lib/use-profile.ts` chỉ dùng để hiển thị (header, hộp nhắc), không dùng để quyết định quyền |
| Mật khẩu | ≥ 8 ký tự (RV-03). Mật khẩu nhân viên cấp: 8 ký tự CSPRNG (`lib/generate-password.ts`), hiện một lần, nhắc đổi (BR-95, BR-96) |
| Đổi mật khẩu | Bắt buộc xác minh mật khẩu cũ bằng client tách biệt (không ghi đè phiên) |
| Quên mật khẩu | Mã 6 số, SHA-256, TTL 10', 5 lần thử, 60s gửi lại, dùng 1 lần (ADR-007) |
| Open redirect | `safeNext()` chỉ nhận path bắt đầu `/` và không `//` |
| Thông báo lỗi đăng nhập | Chung chung, không tiết lộ tài khoản có tồn tại |

## 3. Ma trận phân quyền

✅ được phép · ❌ bị chặn · 🔸 chỉ dữ liệu của chính mình

| Tài nguyên / thao tác | Khách (anon) | Học viên | Admin | Service role (server) |
| --- | --- | --- | --- | --- |
| courses – đọc `published` | ✅ | ✅ | ✅ | ✅ |
| courses – đọc `draft` | ❌ | 🔸 khóa đã `approved` | ✅ | ✅ |
| courses – thêm/sửa/xóa | ❌ | ❌ | ✅ | ✅ |
| lessons – đọc | ❌ | 🔸 khóa đã `approved` | ✅ | ✅ |
| lessons – thêm/sửa/xóa | ❌ | ❌ | ✅ | ✅ |
| profiles – đọc | ❌ | 🔸 | ✅ | ✅ |
| profiles – sửa | ❌ | ❌ (qua action dùng service role) | ✅ | ✅ |
| registrations – đọc | ❌ | 🔸 | ✅ | ✅ |
| registrations – tạo | ❌ | ❌ (qua `registerAction`) | ❌ (qua action) | ✅ |
| registrations – đổi trạng thái | ❌ | ❌ | ✅ | ✅ |
| password_resets | ❌ | ❌ | ❌ | ✅ |
| Storage payment-proofs – đọc | ❌ | ❌ | ✅ | ✅ |
| Storage payment-proofs – ghi | ❌ | ❌ | ❌ | ✅ |
| Đổi `role` | ❌ | ❌ | ✅ (trang Học viên; nhân viên không đổi được – xem §3.1) | ✅ |

### 3.1. Ma trận phân quyền phiên bản 0.2 (ADR-011)

> ✅ Toàn bộ ma trận dưới đã áp dụng (Đợt 7 → 13, 27/09/2026) và có E2E kiểm tra qua API (RLS / trigger / hàm), không chỉ ở giao diện.
> Đợt 9: chỉ admin quản lý gói; nhân viên / admin không sửa tay được gói, học phí, hạn học của đơn (trigger).
> Đợt 11: nhân viên chỉ tạo được đơn `source = staff` đã duyệt, gói của đúng chương trình (trigger); ghi chú nội bộ ở `patient_notes`.
> Đợt 12: bệnh nhân đọc phiếu qua `my_consultations()` (không có ghi chú nội bộ). Đợt 13: `revenue_report()` báo lỗi với nhân viên.

| Tài nguyên / thao tác | Khách | Bệnh nhân | Staff | Admin |
| --- | --- | --- | --- | --- |
| Khóa đang hiển thị, gói đang bán, đề cương (buổi, tên bài) | ✅ | ✅ | ✅ | ✅ |
| Video bài khóa **free** (RLS `can_view_lesson`) | ✅ | ✅ | ✅ | ✅ |
| Video bài khóa **program** | ❌ | 🔸 còn hạn + buổi đã mở | ✅ xem trước | ✅ |
| Khóa / gói / buổi / bài / ảnh bìa – thêm, sửa, xóa | ❌ | ❌ | ❌ | ✅ |
| `lesson_progress` – đọc | ❌ | 🔸 | ✅ | ✅ |
| `lesson_progress` – tick / bỏ tick | ❌ | 🔸 chỉ bài đang xem được | ❌ giao diện không có nút (RLS vẫn cho ghi tiến độ **của chính mình**, không ảnh hưởng bệnh nhân) | ❌ như staff |
| profiles – đọc | ❌ | 🔸 | ✅ | ✅ |
| profiles – sửa | ❌ | 🔸 qua action | ✅ chỉ `role = user` | ✅ |
| Đổi `role` | ❌ | ❌ | ❌ | ✅ |
| Tạo tài khoản bệnh nhân, cấp lại mật khẩu | ❌ | ❌ | ✅ (tài khoản `user`) | ✅ |
| registrations – đọc | ❌ | 🔸 | ✅ | ✅ |
| registrations – duyệt / từ chối / thu hồi | ❌ | ❌ | ✅ | ✅ |
| registrations – tạo đơn đã duyệt (cấp gói) | ❌ | ❌ | ✅ `source = staff` | ✅ |
| Ảnh chuyển khoản – xem | ❌ | ❌ | ✅ | ✅ |
| consultations – gửi | ❌ | ✅ qua action (5 phiếu / ngày) | ❌ (giao diện ẩn nút ở chế độ xem trước) | ❌ |
| consultations – đọc | ❌ | 🔸 qua `my_consultations()` – không thấy ghi chú nội bộ | ✅ | ✅ |
| consultations – đổi trạng thái | ❌ | ❌ | ✅ | ✅ |
| Mẫu phiếu tham vấn – sửa | ❌ | ❌ | ❌ | ✅ |
| leads – tạo | ✅ qua action | ✅ qua action | — | — |
| leads – đọc / xử lý | ❌ | ❌ | ✅ | ✅ |
| Ghi chú nội bộ (`patient_notes`), nhật ký tài khoản (`account_events`) | ❌ | ❌ | ✅ | ✅ |
| `admin_patients()`, `patient_progress()`, `dashboard_stats()` | ❌ (rỗng / null) | ❌ (rỗng / null) | ✅ | ✅ |
| `_patient_courses()` (hàm nội bộ) | ❌ | ❌ | ❌ | ❌ (chỉ gọi bên trong hàm security definer) |
| Dashboard | ❌ | ❌ | ✅ không có doanh thu | ✅ |
| `revenue_report()` | ❌ | ❌ | ❌ | ✅ |

## 4. Nguyên tắc về service role

1. Chỉ khởi tạo trong `lib/supabase/admin.ts`; chỉ import ở file `'use server'` hoặc `scripts/`.
2. Mỗi action dùng service role **phải** tự kiểm tra: người gọi là ai, dữ liệu có hợp lệ, có đúng phạm vi không.
3. Không bao giờ trả dữ liệu đọc bằng service role về client nguyên vẹn.
4. Không đặt biến với tiền tố `NEXT_PUBLIC_` cho khóa bí mật.

## 5. Threat model (STRIDE)

| # | Mối đe dọa | Loại | Biện pháp hiện có | Rủi ro còn lại / đề xuất |
| --- | --- | --- | --- | --- |
| T1 | Gọi thẳng PostgREST bằng anon key để đọc bài học | Information disclosure | RLS `has_course_access` | Thấp |
| T2 | Học viên tự sửa đơn thành `approved` | Tampering / Elevation | Không có policy insert/update cho user | Thấp |
| T3 | Học viên tự nâng `role = admin` | Elevation | Không có policy update profile cho user | Thấp |
| T4 | Chia sẻ link YouTube gốc | Information disclosure | Khuyến nghị Unlisted | **Cao** – không kiểm soát được (ADR-005) |
| T5 | Ảnh chuyển khoản giả | Spoofing | Admin đối chiếu sao kê | Trung bình – quy trình vận hành |
| T6 | Spam đăng ký tạo hàng loạt tài khoản + upload | DoS | Giới hạn 5MB/ảnh | **Trung bình** – thêm rate limit theo IP, CAPTCHA (Turnstile) – RV-04 |
| T7 | Brute-force đăng nhập | Spoofing | Rate limit mặc định của Supabase Auth | Trung bình – thêm giới hạn theo IP ở action |
| T8 | Brute-force mã reset | Spoofing | 5 lần/mã, 60s/mã | Trung bình – giới hạn số mã/ngày/tài khoản |
| T9 | Dò tài khoản tồn tại qua quên mật khẩu/đăng ký | Information disclosure | — (đánh đổi UX) | Thấp – chấp nhận |
| T10 | Lộ service role key | Elevation | `.gitignore` có `.env*.local`; chỉ dùng server | Nghiêm trọng nếu xảy ra → xoay khóa ngay (runbook) |
| T11 | XSS | Tampering | React escape mặc định; không dùng `dangerouslySetInnerHTML`; `video_url` chỉ nhận https YouTube/TikTok (RV-05) | Thấp. Dữ liệu cũ đã rà soát (0 link lỗi); link không hợp lệ không được nhúng vào iframe, admin thấy cảnh báo (RK-09) |
| T12 | CSRF lên Server Action | Tampering | Next.js kiểm tra Origin cho Server Actions; cookie SameSite=Lax | Thấp |
| T13 | Open redirect sau đăng nhập | Spoofing | `safeNext()` | Thấp |
| T14 | Clickjacking trang admin | Tampering | — | Thấp – thêm header `X-Frame-Options: DENY`/CSP `frame-ancestors` |
| T15 | Chiếm quyền qua `search_path` trong hàm security definer | Elevation | `set search_path = public` | Thấp |
| T16 | Mất dữ liệu thanh toán khi admin xóa khóa học | Repudiation / Integrity | ✅ Đơn giữ lại với snapshot tên khóa & học phí (`on delete set null`) | Thấp. Xóa tài khoản cũng giữ đơn (`user_id … on delete set null`, RK-03) |
| T17 | Không truy vết ai duyệt đơn | Repudiation | ✅ Trigger ghi `reviewed_by` = `auth.uid()` + tên admin; không sửa tay được qua API | Thấp. Lịch sử đầy đủ trong `registration_events`, nhật ký phân quyền `role_events` (Đợt 3); chỉ trigger ghi, admin chỉ đọc |
| T18 | 2 admin xử lý cùng một đơn, thao tác sau ghi đè thao tác trước | Tampering | ✅ Update có điều kiện `status = expected` (RK-11) | Thấp |
| T19 | Mất hết admin / admin tự khóa mình / nhân viên nghỉ việc còn quyền | Elevation / DoS | ✅ Trigger `profiles_guard_role`: chặn tự gỡ, luôn còn ≥ 1 admin; tab "Admin" để rà soát và gỡ quyền (RK-13) | Thấp. Admin quyền ngang nhau nên một admin có thể gỡ quyền admin khác – đã ghi nhật ký |
| T20 | Spam đăng ký / dò mật khẩu / dò tài khoản qua quên mật khẩu | DoS / Spoofing | ✅ Giới hạn tần suất theo IP trong database (`rate_limits`), khóa tạm 15 phút sau 5 lần sai; Turnstile tùy chọn (RK-06) | Thấp–Trung bình. Chưa bật Turnstile trên production cho tới khi có khóa Cloudflare |
| T21 | File giả dạng ảnh (đổi đuôi) | Tampering | ✅ Kiểm tra magic bytes, lưu MIME theo nội dung (RK-08) | Thấp |
| T22 | Clickjacking, nhúng script lạ, lộ công nghệ | Tampering / Info disclosure | ✅ CSP (`frame-ancestors 'none'`, `object-src 'none'`, nguồn script/frame/ảnh giới hạn), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, tắt `X-Powered-By` (RV-16) | Thấp. `script-src` còn `'unsafe-inline'` (Next.js); nâng cấp dùng nonce khi cần |
| T23 | Chạy E2E nhầm lên database thật | Tampering | ✅ Script chỉ chạy khi `E2E_SUPABASE_REF` khớp project (RK-10) | Thấp |
| T24 *(v0.2)* | Staff tự nâng quyền / sửa tài khoản admin | Elevation | ✅ Đợt 7: trigger chỉ cho admin đổi `role`; policy staff chỉ sửa dòng `role = 'user'` (E2E TC-65) | Thấp |
| T25 *(v0.2)* | Staff cấp gói "miễn phí" cho người quen (đơn approved không ảnh) | Repudiation / Fraud | ✅ Đợt 11: bắt buộc số tiền + hình thức; trigger tự lấy gói theo `plan_id` của đúng chương trình, ghi `created_by`, người xử lý, lịch sử `new → approved`; staff không sửa được học phí / hạn học sau đó (Đợt 9). ✅ Đợt 13: admin xem doanh thu theo người duyệt / cấp gói, theo hình thức | Trung bình – vẫn cần đối soát định kỳ (tiền mặt) |
| T26 *(v0.2)* | Mật khẩu hệ thống sinh bị lộ qua tin nhắn Zalo | Spoofing | ✅ Đợt 11: hiện một lần, không lưu; nhắc bệnh nhân đổi (`must_change_password`); cấp lại được (mật khẩu cũ hết hiệu lực – E2E) | Trung bình – chấp nhận vì yêu cầu không bắt buộc đổi |
| T27 *(v0.2)* | Vượt khóa tuần tự / xem video khi hết hạn bằng cách gọi API | Information disclosure | ✅ Đợt 10: RLS `lessons_select = can_view_lesson(id)`, `lesson_progress` insert/delete chỉ khi `can_view_lesson` (E2E: tick trước buổi, đọc video buổi khóa, tick vượt số buổi đã mua đều bị chặn) | Thấp. Link YouTube gốc vẫn chia sẻ được (T4) |
| T28 *(v0.2)* | Lộ dữ liệu sức khỏe (phiếu tham vấn, tiến độ) | Information disclosure | ✅ Đợt 12: RLS `consultations` chỉ staff / admin; bệnh nhân đọc phiếu mình qua `my_consultations()`; không có trang công khai; đồng ý xử lý dữ liệu (E2E: bệnh nhân khác, khách không đọc được) | Thấp–Trung bình |
| T29 *(v0.2)* | Spam lead / phiếu tham vấn | DoS | ✅ Đợt 8: rate limit 20 lead/giờ/IP (`lead:<IP>`); ✅ Đợt 12: 5 phiếu/ngày/tài khoản (`consult:<user_id>`); Turnstile nếu bật | Thấp |
| T31 *(v0.2)* | Bệnh nhân sửa giá gói ở trình duyệt / gửi gói của chương trình khác | Tampering | ✅ Đợt 9: server lấy giá từ `course_plans` đúng chương trình, gói phải đang bán (TC-75) | Thấp |
| T32 *(v0.2)* | Kéo dài hạn học trái phép | Elevation | ✅ Đợt 9: hạn học chỉ do trigger tính khi duyệt; người có phiên đăng nhập không ghi được `access_*` (TC-76) | Thấp |
| T30 *(v0.2)* | Upload file lạ làm ảnh bìa (bucket public) | Tampering | ✅ Đợt 8: chỉ admin (RLS storage, E2E khách / nhân viên bị chặn); kiểm tra magic bytes, ≤ 2MB; MIME theo nội dung | Thấp |
| T31 *(v0.2)* | Cookie phiên giả / hết hạn vượt qua middleware (middleware chỉ đọc cookie – ADR-016) | Spoofing | ✅ Mọi trang cần quyền gọi `requireUserPage` / `requireStaffPage` / `requireAdminPage` (xác thực `getUser()`); RLS là lớp cuối | Thấp – không lộ dữ liệu, chỉ bị chuyển trang ở bước render |
| T32 *(v0.2)* | Nhân viên tự gọi API tạo đơn sai quy tắc (đơn web, đơn chờ, gói chương trình khác, số tiền âm) | Tampering | ✅ Đợt 11: policy `registrations_staff_insert` + trigger `registrations_stamp_insert` (E2E kiểm tra qua API) | Thấp |

## 6. Bảo vệ dữ liệu cá nhân (tham chiếu Nghị định 13/2023/NĐ-CP)

| Yêu cầu | Hiện trạng | Việc cần làm |
| --- | --- | --- |
| Thông báo/đồng ý xử lý dữ liệu | ✅ Đợt 8 (nội dung chờ trung tâm rà soát – roadmap A-7) | **v0.2 bắt buộc (Đợt 8)**: trang `/chinh-sach-bao-mat`, ô đồng ý ở box đăng ký, nhân viên xác nhận khi tạo tài khoản, hộp đồng ý cho tài khoản cũ; lưu `consent_at`, `consent_version` |
| Dữ liệu sức khỏe (nhạy cảm) | ✅ Đợt 10, 12: tiến độ tập, phiếu tham vấn – chỉ bệnh nhân đó + nhân viên / admin; chính sách nêu mục đích | Chủ trung tâm duyệt nội dung chính sách (A-7); quy trình xóa theo yêu cầu (xóa tài khoản → phiếu giữ họ tên / SĐT: cần xóa tay nếu bệnh nhân yêu cầu xóa hẳn) |
| Tối thiểu hóa | Chỉ thu tên, SĐT, email (tùy chọn), ảnh CK | Đạt |
| Quyền truy cập/sửa | Học viên tự sửa ở `/account` | Đạt |
| Quyền xóa | Chưa có chức năng | Quy trình xóa theo yêu cầu (xóa user + ảnh) |
| Hạn lưu trữ ảnh CK | Không giới hạn | Đề xuất xóa ảnh sau N tháng kể từ khi duyệt |
| Bảo mật lưu trữ | Bucket private, RLS, HTTPS | Đạt |

## 7. Header bảo mật (✅ đã cấu hình Đợt 5 – RV-16)

Đã áp dụng trong `next.config.mjs`: CSP (`frame-ancestors 'none'`, `object-src 'none'`, nguồn cho YouTube/TikTok, VietQR, Supabase,
Turnstile), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS, tắt X-Powered-By (E2E kiểm tra). Bản gốc đề xuất:

```js
// next.config.mjs
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }]
}
```
CSP cần cho phép `frame-src` YouTube/TikTok, `img-src` `img.vietqr.io`, Supabase Storage và `blob:` (preview ảnh).

## 8. Checklist bảo mật cho mỗi thay đổi

- [ ] Bảng mới đã `enable row level security` và có policy tối thiểu cần thiết?
- [ ] Action mới đã validate input ở server và kiểm quyền?
- [ ] Trang mới cần quyền đã gọi `requireUserPage` / `requireStaffPage` / `requireAdminPage` (middleware không kiểm tra vai trò)?
- [ ] Trigger chặn sửa cột có khóa ngoại `on delete set null`: đã cho phép cột về null (bài học RK-22, RK-29)?
- [ ] Dữ liệu nội bộ (ghi chú nhân viên) có tách khỏi bảng mà người dùng đọc được dòng của mình?
- [ ] Không import `lib/supabase/admin` vào client component?
- [ ] Không log/hiển thị dữ liệu nhạy cảm (mật khẩu, mã, token)?
- [ ] Bucket mới: public hay private? Policy đọc/ghi?
- [ ] Redirect dùng giá trị từ người dùng đã qua kiểm tra?
- [ ] E2E có bước kiểm tra RLS cho dữ liệu mới?
