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
| Phiên | Cookie HTTP do `@supabase/ssr` quản lý; middleware làm mới token |
| Kiểm tra phiên ở server | Luôn dùng `auth.getUser()` (xác minh với Supabase), **không** tin `getSession()` ở server |
| Ở client | `getSession()` chỉ dùng để hiển thị (header, form), không dùng để quyết định quyền |
| Mật khẩu | ≥ 6 ký tự (khuyến nghị nâng lên ≥ 8 – RV-03) |
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
| Đổi `role` | ❌ | ❌ | ✅ (qua SQL, chưa có UI) | ✅ |

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

## 6. Bảo vệ dữ liệu cá nhân (tham chiếu Nghị định 13/2023/NĐ-CP)

| Yêu cầu | Hiện trạng | Việc cần làm |
| --- | --- | --- |
| Thông báo/đồng ý xử lý dữ liệu | Chưa có | Thêm ô đồng ý + trang Chính sách bảo mật |
| Tối thiểu hóa | Chỉ thu tên, SĐT, email (tùy chọn), ảnh CK | Đạt |
| Quyền truy cập/sửa | Học viên tự sửa ở `/account` | Đạt |
| Quyền xóa | Chưa có chức năng | Quy trình xóa theo yêu cầu (xóa user + ảnh) |
| Hạn lưu trữ ảnh CK | Không giới hạn | Đề xuất xóa ảnh sau N tháng kể từ khi duyệt |
| Bảo mật lưu trữ | Bucket private, RLS, HTTPS | Đạt |

## 7. Header bảo mật đề xuất (chưa cấu hình)

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
- [ ] Không import `lib/supabase/admin` vào client component?
- [ ] Không log/hiển thị dữ liệu nhạy cảm (mật khẩu, mã, token)?
- [ ] Bucket mới: public hay private? Policy đọc/ghi?
- [ ] Redirect dùng giá trị từ người dùng đã qua kiểm tra?
- [ ] E2E có bước kiểm tra RLS cho dữ liệu mới?
