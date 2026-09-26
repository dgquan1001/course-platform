# Đặc tả API

Hệ thống **không có REST API tự viết**. "API" gồm 4 loại:

1. **Route (trang)** – Next.js App Router, kèm query/params.
2. **Middleware** – chặn truy cập theo phiên và vai trò.
3. **Server Actions** – hàm `'use server'` gọi từ form (POST nội bộ của Next.js).
4. **Supabase API** – PostgREST/RPC/Storage gọi trực tiếp với anon key (chịu RLS) hoặc service role (server).

## 1. Routes

| Route | Quyền | Params / Query | Render | Mô tả |
| --- | --- | --- | --- | --- |
| `/` | Công khai | `?course=<uuid>` chọn sẵn khóa; `#dang-ky`, `#khoa-hoc`, `#bac-si`, `#lien-he` | ISR 300s | Landing + box đăng ký |
| `/register` | Công khai | `?course=<uuid>` | ISR 300s | Trang đăng ký riêng |
| `/login` | Công khai | `?error=<msg>&next=<path>` | Động | Đăng nhập |
| `/forgot-password` | Công khai | — | Động | Quên mật khẩu 2 giai đoạn |
| `/account` | Đăng nhập | — | Động | Tài khoản của tôi |
| `/courses` | Đăng nhập | `?registered=1` | Động | Khóa học của tôi |
| `/courses/[courseId]` | Đăng nhập | `courseId: uuid` | Động | Chi tiết khóa; 404 nếu không đọc được khóa |
| `/courses/[courseId]/[lessonId]` | Đăng nhập + quyền khóa | `courseId, lessonId: uuid` | Động | Xem bài học |
| `/admin` | Admin | `?status=pending\|approved\|rejected\|all` (mặc định pending) | Động | Đơn đăng ký |
| `/admin/users` | Admin | `?q=<từ khóa>` | Động | Học viên |
| `/admin/courses` | Admin | — | Động | Khóa học |
| `/admin/courses/[courseId]` | Admin | `courseId: uuid` | Động | Bài học của khóa |
| `/icon.svg` | Công khai | — | Tĩnh | Favicon |
| *(khác)* | — | — | — | `app/not-found.tsx` |

## 2. Middleware (`middleware.ts`)

- **Matcher**: `/courses/:path*`, `/admin/:path*`, `/account/:path*`.
- Làm mới phiên Supabase (ghi lại cookie nếu token được refresh).

| Điều kiện | Kết quả |
| --- | --- |
| Không có user | `302 → /login?next=<pathname>` |
| Path bắt đầu `/admin` và `profiles.role ≠ 'admin'` | `302 → /courses` |
| Còn lại | Cho qua |

## 3. Server Actions

Quy ước chung:
- Input là `FormData` (tên trường = thuộc tính `name` của input). Mọi giá trị được `trim()`.
- Hai kiểu output:
  - **ActionResult** `{ ok: true, message } | { ok: false, error }` → `ActionForm` hiện toast.
  - **State** (dùng với `useFormState`) hoặc **redirect** + cookie `flash`.
- Mọi thông báo là tiếng Việt, hiển thị trực tiếp cho người dùng.

### 3.1. `registerAction(prev: RegisterState, formData)` – `app/register/actions.ts`

| Trường | Bắt buộc | Kiểm tra |
| --- | --- | --- |
| `fullName` | ✓ | không rỗng |
| `phone` | ✓ | `normalizePhone` ≠ null |
| `email` | khách: tùy chọn; đã đăng nhập: bỏ qua | `isValidEmail`, lưu chữ thường |
| `password` | khách: bắt buộc, ≥ 8 ký tự | "Mật khẩu cần ít nhất 8 ký tự." |
| `paymentProof` | ≤ 5MB, định dạng theo magic bytes (JPG/PNG/WEBP/HEIC) | "Ảnh chuyển khoản phải là ảnh JPG, PNG, WEBP hoặc HEIC hợp lệ." |
| `cf-turnstile-response` | chỉ khi bật Turnstile | "Vui lòng xác nhận bạn không phải robot rồi bấm Đăng ký lại." |
| (IP) | ≤ 20 đơn / giờ | "Bạn đã gửi quá nhiều đơn đăng ký. Vui lòng thử lại sau hoặc gọi … để được hỗ trợ." |
| `password` | khách ✓ | ≥ 6 ký tự |
| `courseId` | ✓ | tồn tại và `published`; lưu kèm snapshot `course_title`, `amount` vào đơn |
| `paymentProof` | ✓ | File, MIME/đuôi ∈ {png, jpg/jpeg, webp, heic, heif}, ≤ 5MB |

- **Client dùng**: service role (tạo user, upload, insert), server client (đọc phiên, đăng nhập).
- **Output lỗi**: `{ error: string }`. **Thành công**: `revalidatePath('/admin')`, flash, `redirect('/courses?registered=1')`.

| Thông báo lỗi | Điều kiện |
| --- | --- |
| Vui lòng nhập họ và tên. | fullName rỗng |
| Địa chỉ email không hợp lệ. | email sai định dạng (khách) |
| Số điện thoại không hợp lệ (VD: 0912345678). | SĐT sai |
| Mật khẩu cần ít nhất 6 ký tự. | khách, mật khẩu ngắn |
| Vui lòng chọn khóa học. | thiếu courseId |
| Vui lòng tải lên ảnh chụp chuyển khoản. | thiếu file |
| Ảnh chuyển khoản phải là JPG, PNG, WEBP hoặc HEIC. | sai định dạng |
| Ảnh chuyển khoản tối đa 5MB. | quá lớn |
| Khóa học không tồn tại hoặc đã ngừng nhận đăng ký. | khóa không `published` |
| Bạn đã sở hữu khóa học này… / Bạn đã đăng ký khóa này và đang chờ xác nhận. | đã đăng nhập, trùng đơn |
| Số điện thoại này đã có tài khoản… | khách, SĐT trùng |
| Email này đã có tài khoản… | khách, email trùng |
| Không tạo được tài khoản / Không tải được ảnh / Không gửi được đơn: `<chi tiết>` | lỗi hạ tầng (đã rollback) |

### 3.2. `loginAction(formData)` – `app/login/actions.ts`

| Trường | Ghi chú |
| --- | --- |
| `identifier` | email hoặc SĐT |
| `password` | |
| `next` | chỉ chấp nhận chuỗi bắt đầu `/` và không bắt đầu `//`; mặc định `/courses` |

Lỗi → `redirect('/login?error=<msg>&next=<next>')`. Thành công → flash "Đăng nhập thành công…", `redirect(next)`.

### 3.3. `forgotPasswordAction(prev: ForgotState, formData)` – `app/forgot-password/actions.ts`

```ts
type ForgotState = {
  stage: 'request' | 'verify'
  identifier: string
  maskedEmail: string | null
  error: string | null
  info: string | null
}
```

| `intent` | Trường | Kết quả thành công |
| --- | --- | --- |
| (khác `verify`) | `identifier` | `stage: 'verify'`, `info: "Đã gửi mã 6 số tới ab***@…"` |
| `verify` | `identifier`, `code` (6 số, bỏ khoảng trắng), `password` (≥ 6), `confirmPassword` | Đổi mật khẩu, đăng nhập, flash, `redirect('/courses')` |

Hằng số: `CODE_TTL_MINUTES = 10`, `RESEND_SECONDS = 60`, `MAX_ATTEMPTS = 5`.

### 3.4. `updateProfileAction(formData): ActionResult` – `app/account/actions.ts`

| Trường | Bắt buộc | Kiểm tra |
| --- | --- | --- |
| `fullName` | ✓ | không rỗng |
| `phone` | ✓ | hợp lệ, không trùng tài khoản khác |
| `email` | | hợp lệ, không trùng tài khoản khác |

Nếu auth email thay đổi → `auth.admin.updateUserById(id, { email, email_confirm: true })`.
Cập nhật `profiles`, `revalidatePath('/', 'layout')`. Thành công: "Đã cập nhật thông tin tài khoản."

### 3.5. `changePasswordAction(formData): ActionResult`

| Trường | Kiểm tra |
| --- | --- |
| `currentPassword` | Xác minh bằng một Supabase client riêng không lưu phiên |
| `newPassword` | ≥ 6 |
| `confirmPassword` | = newPassword |

### 3.6. Admin actions – `app/admin/actions.ts`

Tất cả đi qua `run(message, op, invalid)`: `requireAdmin()` → nếu dữ liệu không hợp lệ trả `invalid` → thực thi bằng **server client (RLS)** với `.select('id')` →
lỗi DB trả `error.message`; 0 dòng → "Không tìm thấy dữ liệu, vui lòng tải lại trang."; thành công →
`revalidatePath('/', 'layout')` và `{ ok: true, message }`.

| Action | Tham số (bind) | FormData | Ghi DB | Thông báo thành công |
| --- | --- | --- | --- | --- |
| `setRegistrationStatus` | `registrationId` (UUID), `status` ∈ pending/approved/rejected, `expected` = trạng thái admin đang thấy (khác `status`) | `note` (lý do, ≤ 500 ký tự, chỉ dùng khi từ chối/thu hồi) | `registrations.status`, `review_note`, điều kiện `status = expected` (0 dòng → "Đơn đã thay đổi (có thể admin khác vừa xử lý), vui lòng tải lại trang."); trigger `registrations_stamp_review` ghi `reviewed_at`, `reviewed_by`, `reviewed_by_name` (xóa nếu pending) và 1 dòng `registration_events`. Duyệt chỉ áp dụng khi `course_id is not null` và `user_id is not null` (khóa/tài khoản chưa bị xóa); khóa đang ẩn vẫn duyệt được (BR-39). Lỗi `23505` (học viên đã có đơn khác đang hiệu lực) → "Học viên đã có một đơn khác đang chờ duyệt hoặc đã được duyệt cho khóa này." | "Đã duyệt đơn, khóa học đã được mở cho học viên." / "Đã cập nhật đơn sang trạng thái Từ chối." / "Đã chuyển đơn về trạng thái Chờ duyệt." |
| `createCourse` | — | `title, description, price, sort_order, status` | insert `courses` | `Đã thêm khóa học "<title>".` |
| `updateCourse` | `courseId` | như trên | update `courses` | "Đã lưu thông tin khóa học." |
| `setCourseStatus` | `courseId`, `status` | — | update `courses.status` | "Khóa học đã hiển thị trên website." / "Đã ẩn khóa học khỏi website (học viên đã mua vẫn học được)." |
| `deleteCourse` | `courseId` | — | delete `courses` (cascade bài học; đơn giữ lại, `course_id` = null) | "Đã xóa khóa học. Đơn đăng ký và lịch sử thanh toán vẫn được giữ lại." |
| `setUserRole` | `userId` (UUID, khác chính mình), `role` ∈ admin/user | — | update `profiles.role`; trigger `profiles_guard_role` chặn tự gỡ quyền / gỡ admin cuối cùng ("Bạn không thể tự gỡ quyền admin của chính mình." / "Phải còn ít nhất 1 tài khoản admin.") và ghi `role_events` | "Đã cấp quyền admin." / "Đã gỡ quyền admin." |
| `createLesson` | `courseId` | `title, video_url, description, sort_order` | insert `lessons` | `Đã thêm bài học "<title>".` |
| `updateLesson` | `lessonId` | như trên | update `lessons` | "Đã lưu bài học." |
| `deleteLesson` | `lessonId` | — | delete `lessons` | "Đã xóa bài học." |

Kiểm tra ở server (RV-05):

| Trường | Quy tắc | Thông báo lỗi |
| --- | --- | --- |
| `title` | bắt buộc sau `trim`, ≤ 200 ký tự | "Vui lòng nhập tên khóa học/bài học." / "Tên … tối đa 200 ký tự." |
| `description` | ≤ 5000 ký tự; rỗng → `null` | "Mô tả tối đa 5000 ký tự." |
| `price` | số nguyên 0 – 1.000.000.000; trống = 0 | "Học phí phải là số nguyên." / "Học phí phải từ 0 đến 1.000.000.000." |
| `sort_order` | số nguyên ±100.000; trống = 0 | "Thứ tự … phải là số nguyên." |
| `status` | `draft` \| `published` | "Trạng thái khóa học không hợp lệ." |
| `video_url` | `isSupportedVideoUrl`: https + youtube.com/youtu.be/youtube-nocookie.com/tiktok.com và nhận dạng được ID | "Link video phải là link YouTube hoặc TikTok hợp lệ (…)" |
| ID (bind) | UUID | "Mã … không hợp lệ, vui lòng tải lại trang." |

## 4. Supabase API được gọi trực tiếp

| Nơi gọi | Client | API | Mục đích |
| --- | --- | --- | --- |
| `SiteHeader`, `RegisterForm` | Browser | `auth.getSession()`, `from('profiles').select(...)` | Hiển thị người dùng |
| `SiteHeader` | Browser | `auth.signOut()` | Đăng xuất |
| `/courses/[courseId]` | Server | `rpc('has_course_access', { target_course })` | Quyết định hiển thị |
| `/admin` | Server | `storage.from('payment-proofs').createSignedUrls(paths, 3600)` | Xem ảnh |
| `lib/accounts.ts` | Admin | `auth.admin.getUserById` | Lấy auth email |
| Actions | Admin | `auth.admin.createUser / deleteUser / updateUserById` | Quản lý tài khoản |

## 5. Dịch vụ ngoài

| Dịch vụ | Endpoint | Tham số |
| --- | --- | --- |
| VietQR | `GET https://img.vietqr.io/image/{BIN}-{STK}-compact2.png` | `accountName`, `amount` (nếu > 0), `addInfo` |
| YouTube | `https://www.youtube.com/embed/{id}?rel=0&modestbranding=1` | iframe |
| TikTok | `https://www.tiktok.com/player/v1/{id}?rel=0` | iframe |
| SMTP | `SMTP_HOST:SMTP_PORT` (465 → TLS) | `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` |

## 6. Cookie

| Cookie | Tạo bởi | Thời hạn | Nội dung |
| --- | --- | --- | --- |
| `sb-<project>-auth-token*` | @supabase/ssr | Theo phiên Supabase | Access/refresh token |
| `flash` | `setFlash()` | 60 giây | `{"message","type"}`; Toaster đọc rồi xóa |

## 7. Hướng dẫn thêm API mới

- Form trong trang → **Server Action** trả `ActionResult`, dùng `ActionForm` + `SubmitButton`.
- Webhook/tích hợp bên ngoài/app di động cần service role → **Route Handler** `app/api/<tên>/route.ts`,
  xác thực bằng chữ ký/secret header, không dùng cookie.
- Luôn: validate server-side, kiểm quyền (`requireAdmin`/`getCurrentUser`), để RLS là lớp cuối, trả thông báo tiếng Việt,
  cập nhật bảng trong tài liệu này.
