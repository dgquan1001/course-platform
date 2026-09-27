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
| `/register` | Công khai | `?course=<uuid>&plan=<uuid>` (Đợt 9) | ISR 300s | Trang đăng ký riêng |
| `/login` | Công khai | `?error=<msg>&next=<path>` | Động | Đăng nhập |
| `/forgot-password` | Công khai | — | Động | Quên mật khẩu 2 giai đoạn |
| `/account` | Đăng nhập | — | Động | Tài khoản của tôi |
| `/courses` | Đăng nhập | `?registered=1` | Động | Khóa học của tôi |
| `/courses/[courseId]` | Khóa miễn phí: công khai; khóa khác: đăng nhập (trang tự chuyển `/login?next=`) | `courseId: uuid` | Động | Chi tiết khóa; 404 nếu không đọc được khóa; khóa premium → `/khoa-hoc/[id]` |
| `/courses/[courseId]/[lessonId]` | Như trên + quyền khóa | `courseId, lessonId: uuid`; `?finished=1` (thẻ chúc mừng) | Động | Trình học theo buổi (Đợt 10): bài bị khóa hiện lý do, nút "Hoàn thành & bài tiếp theo" / "Bỏ đánh dấu" |
| `/khoa-hoc/[courseId]` | Công khai | `courseId: uuid` | ISR 300s | Trang giới thiệu khóa (Đợt 8): đề cương qua RPC `course_outline`, khóa premium có hộp liên hệ Zalo |
| `/chinh-sach-bao-mat` | Công khai | — | Tĩnh | Chính sách bảo mật (Đợt 8) |
| `/admin/leads` | Nhân viên, admin | `?status=new\|contacted\|converted\|closed` | Động | Khách quan tâm premium (Đợt 8) |
| `/courses/consultation` | Đăng nhập | `?course=<uuid>` chọn sẵn chương trình, `?origin=manual\|course_end\|expiring` | Động | Phiếu tham vấn bác sĩ (Đợt 12) |
| `/admin` | Nhân viên, admin | `?status=` (đường dẫn cũ → `/admin/registrations?status=`) | Động | **Tổng quan** (Đợt 13): thẻ chỉ số, việc cần làm, tiến độ theo chương trình; doanh thu chỉ admin |
| `/admin/registrations` | Nhân viên, admin | `?status=pending\|approved\|rejected\|all\|refund` (mặc định pending) | Động | Đơn đăng ký |
| `/admin/patients` | Nhân viên, admin | `?q=`, `?source=web\|zalo`, `?status=active\|expiring\|expired\|inactive\|none`, `?new=7\|30`, `?role=team` (chỉ admin: Nhân viên & Admin) | Động | Bệnh nhân (Đợt 11, thay `/admin/users`); admin đổi vai trò |
| `/admin/patients/new` | Nhân viên, admin | — | Động | Tạo bệnh nhân (khách Zalo) + cấp gói |
| `/admin/patients/[id]` | Nhân viên, admin | `id: uuid` | Động | Hồ sơ bệnh nhân: gói, tiến độ, đơn, phiếu, nhật ký; cấp gói, sửa, cấp lại mật khẩu |
| `/admin/users` | Nhân viên, admin | `?q=`, `?role=team` | Động | Đường dẫn cũ → `/admin/patients` (giữ bộ lọc) |
| `/admin/consultations` | Nhân viên, admin | `?status=new\|contacted\|done\|cancelled` | Động | Phiếu tham vấn (Đợt 12) |
| `/admin/courses` | Admin | `?kind=program\|free\|premium` (mặc định: tất cả, chia nhóm) | Động | Khóa học theo loại, gói |
| `/admin/courses/[courseId]` | Admin | `courseId: uuid` | Động | Buổi – bài của khóa |
| `/admin/settings/consultation` | Admin | — | Động | Mẫu phiếu tham vấn (`/admin/settings` chuyển tới đây) |
| `/icon.svg` | Công khai | — | Tĩnh | Favicon |
| *(khác)* | — | — | — | `app/not-found.tsx` |

## 2. Middleware (`middleware.ts`)

- **Matcher**: `/courses/:path*`, `/admin/:path*`, `/account/:path*`. Trang khóa `/courses/<uuid>/**` công khai với khóa miễn phí
  (middleware chỉ làm mới phiên; trang tự chuyển khách tới đăng nhập nếu khóa không miễn phí).
- **Nhẹ (ADR-016)**: chỉ `getSession()` – đọc phiên từ cookie, không gọi mạng (trừ khi token hết hạn thì làm mới + ghi cookie).
  **Không** truy vấn vai trò.

| Điều kiện | Kết quả |
| --- | --- |
| Không có phiên và không phải `/courses/<uuid>/**` | `307 → /login?next=<pathname + query>` |
| Còn lại | Cho qua |

Kiểm tra quyền thật nằm ở trang (`lib/auth.ts`, `getCurrentUser` cache theo request):

| Hàm (gọi đầu trang) | Không thỏa | Dùng ở |
| --- | --- | --- |
| `requireUserPage(next)` | Phiên không hợp lệ → `/login?next=` | `/courses`, `/account`, `/courses/consultation` |
| `requireStaffPage()` | Không phải nhân viên / admin → `/courses` | Layout `/admin` + mọi trang `/admin/**` |
| `requireAdminPage()` | Nhân viên → `/admin` | `/admin/courses/**`, `/admin/settings/**` |

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
| `courseId` | ✓ | tồn tại, `published` và `kind = 'program'`; lưu kèm snapshot `course_title`, `amount` vào đơn |
| `planId` | ✓ | Gói `active` của đúng chương trình ("Gói không hợp lệ hoặc đã ngừng bán, vui lòng chọn lại."); học phí = giá gói; lưu `plan_id`, `plan_months`, `plan_sessions`, `source = web`, `payment_method = bank_transfer` (Đợt 9) |
| `consent` | khách ✓ | `= 'yes'` → "Vui lòng đồng ý Chính sách bảo mật để tạo tài khoản."; lưu `consent_at`, `consent_version` vào profile |
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
| Bạn đã đăng ký khóa này và đang chờ xác nhận. | đã đăng nhập, đã có đơn chờ duyệt cho khóa này (đã sở hữu thì được gia hạn – Đợt 9) |
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

Tất cả đi qua `run(message, op, invalid, { staff?, errors?, notFound? })`: `requireAdmin()` (hoặc `requireStaff()` khi `staff: true` – chỉ `setRegistrationStatus`) → nếu dữ liệu không hợp lệ trả `invalid` → thực thi bằng **server client (RLS)** với `.select('id')` →
lỗi DB trả `error.message`; 0 dòng → "Không tìm thấy dữ liệu, vui lòng tải lại trang."; thành công →
`revalidatePath('/', 'layout')` và `{ ok: true, message }`.

| Action | Tham số (bind) | FormData | Ghi DB | Thông báo thành công |
| --- | --- | --- | --- | --- |
| `setRegistrationStatus` | `registrationId` (UUID), `status` ∈ pending/approved/rejected, `expected` = trạng thái admin đang thấy (khác `status`) | `note` (lý do, ≤ 500 ký tự, chỉ dùng khi từ chối/thu hồi) | `registrations.status`, `review_note`, điều kiện `status = expected` (0 dòng → "Đơn đã thay đổi (có thể người khác vừa xử lý), vui lòng tải lại trang."). Quyền: nhân viên hoặc admin; trigger `registrations_stamp_review` ghi `reviewed_at`, `reviewed_by`, `reviewed_by_name` (xóa nếu pending) và 1 dòng `registration_events`. Duyệt chỉ áp dụng khi `course_id is not null` và `user_id is not null` (khóa/tài khoản chưa bị xóa); khóa đang ẩn vẫn duyệt được (BR-39). Lỗi `23505` (học viên đã có đơn khác đang hiệu lực) → "Học viên đã có một đơn khác đang chờ duyệt hoặc đã được duyệt cho khóa này." | "Đã duyệt đơn, khóa học đã được mở cho học viên." / "Đã cập nhật đơn sang trạng thái Từ chối." / "Đã chuyển đơn về trạng thái Chờ duyệt." |
| `createCourse` | — | (Đợt 9: chương trình có `price` > 0 → tự tạo gói 1 tháng; Đợt 10: `session_count` × `lessons_per_session` → tạo khung buổi) `title, description, price, sort_order, status`, `kind`, `category`, `summary`, `outcomes` (mỗi dòng 1 ý), `cover` (file) | Tải ảnh bìa lên `course-covers` (server client, RLS admin) rồi insert `courses`; lỗi thì xóa ảnh vừa tải | `Đã thêm khóa học "<title>".` |
| `updateCourse` | `courseId` | như trên + `remove_cover` | Chặn đổi loại khóa khi đã có đơn; thay ảnh bìa (xóa file cũ) | "Đã lưu thông tin khóa học." |
| `createPlan` | `courseId` | `months` ∈ 1/3/6/12, `price`, `sessions` (trống = 12 × tháng) | insert `course_plans`; `23505` → "Chương trình đã có gói N tháng, hãy sửa gói đó." (Đợt 9) | `Đã thêm gói N tháng.` |
| `updatePlan` | `planId`, `months` | `price`, `sessions`, `active` (checkbox) | update `course_plans` | `Đã lưu gói N tháng.` |
| `deletePlan` | `planId` | — | delete (đơn giữ snapshot gói, `plan_id` → null) | "Đã xóa gói." |
| `setLeadStatus` | `leadId`, `expected` (trạng thái đang thấy) | `status` ∈ new/contacted/converted/closed, `staff_note` ≤ 500 | update `leads` `.eq('status', expected)` (nhân viên, admin); 0 dòng → "Yêu cầu đã thay đổi (có thể người khác vừa xử lý)…" | "Đã ghi nhận: đã liên hệ khách."… |
| `setCourseStatus` | `courseId`, `status` | — | update `courses.status` | "Khóa học đã hiển thị trên website." / "Đã ẩn khóa học khỏi website (học viên đã mua vẫn học được)." |
| `deleteCourse` | `courseId` | — | delete `courses` (cascade bài học; đơn giữ lại, `course_id` = null) | "Đã xóa khóa học. Đơn đăng ký và lịch sử thanh toán vẫn được giữ lại." |
| `setUserRole` | `userId` (UUID, khác chính mình) | `role` ∈ user/staff/admin ("Vai trò không hợp lệ.") | update `profiles.role` (chỉ admin); trigger `profiles_guard_role` chặn người không phải admin, tự gỡ quyền, gỡ admin cuối cùng ("Chỉ admin được thay đổi vai trò tài khoản." / "Bạn không thể tự gỡ quyền admin của chính mình." / "Phải còn ít nhất 1 tài khoản admin.") và ghi `role_events` | "Đã cấp quyền admin." / "Đã chuyển vai trò thành Nhân viên." / "Đã chuyển vai trò thành Học viên." |
| `createLesson` | `courseId` | `title, video_url` (không bắt buộc từ Đợt 10), `description, sort_order`, `session_id` (trống = buổi cuối; chưa có buổi → tạo "Buổi 1") | insert `lessons` | `Đã thêm bài học "<title>".` |
| `generateSkeleton` | `courseId` | `session_count` 1–200, `lessons_per_session` 1–20 | tạo "Buổi k" nối tiếp + "Bài 1…M" chưa có video (tối đa 500 buổi / khóa) – Đợt 10 | `Đã tạo N buổi × M bài.` |
| `createSession` / `updateSession` / `deleteSession` | `courseId` / `sessionId` | `title`, `description` | thêm (cuối khóa) / sửa / xóa (xóa kèm bài + tiến độ) | … |
| `moveSession` | `courseId`, `sessionId`, `up`\|`down` | — | đổi chỗ với buổi kề, đánh lại thứ tự 1…n | "Đã đổi thứ tự buổi." |
| `duplicateSession` | `courseId`, `sessionId` | — | tạo "Buổi n+1" ở cuối, sao chép các bài (tên, mô tả, link video) | "Đã sao chép buổi." |
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
| `kind` | `free` \| `program` \| `premium` (free → học phí 0) | "Loại khóa học không hợp lệ." |
| `category` | trống \| `veo_lung` \| `veo_nguc` | "Nhóm bệnh không hợp lệ." |
| `summary` | ≤ 300 ký tự | "Mô tả ngắn tối đa 300 ký tự." |
| `outcomes` | ≤ 12 dòng, mỗi dòng ≤ 200 ký tự | … |
| `cover` | JPG/PNG/WEBP theo magic bytes, ≤ 2MB | "Ảnh bìa phải là ảnh JPG, PNG hoặc WEBP hợp lệ." / "Ảnh bìa tối đa 2MB." |
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

## 7. Phiên bản 0.2 – route & action (✅ đã triển khai Đợt 7 → 13)

Thiết kế theo ADR-011 → ADR-016. Route đầy đủ ở §1, middleware ở §2; bảng dưới giữ làm mục lục theo đợt.

### 7.1. Routes

| Route | Quyền | Mô tả | Đợt |
| --- | --- | --- | --- |
| `/khoa-hoc/[courseId]` | Công khai | Trang giới thiệu khóa kiểu Udemy (đề cương, gói, premium CTA); ISR, làm mới khi admin sửa | 8 |
| `/chinh-sach-bao-mat` | Công khai | Chính sách bảo mật (tĩnh) | 8 |
| `/courses` | Đăng nhập | Khóa học của tôi: thẻ có % tiến độ, hạn học, Tiếp tục, Gia hạn; mục "Phiếu tham vấn của tôi" | 9–12 |
| `/courses/[courseId]` | Công khai (khóa free) / đăng nhập | Trang khóa của bệnh nhân: tiến độ + đề cương có trạng thái 🔒/✓ | 10 |
| `/courses/[courseId]/[lessonId]` | Công khai (khóa free) / theo `can_view_lesson` | Trình học; bài bị khóa hiện lý do | 10 |
| `/courses/consultation` | Đăng nhập | ✅ Form phiếu tham vấn (`?course=`, `?origin=`) | 12 |
| `/admin` | Staff, admin | ✅ **Tổng quan** (dashboard) | 13 |
| `/admin/registrations` | Staff, admin | ✅ Đơn đăng ký (chuyển từ `/admin`; `/admin?status=` chuyển hướng sang đây) | 7 |
| `/admin/patients` (thay `/admin/users`) | Staff, admin | ✅ Bệnh nhân: lọc nguồn, trạng thái gói, mới N ngày; admin có tab Nhân viên & Admin | 11 |
| `/admin/patients/new` | Staff, admin | ✅ Tạo bệnh nhân + cấp gói | 11 |
| `/admin/patients/[id]` | Staff, admin | ✅ Hồ sơ bệnh nhân | 11 |
| `/admin/consultations` | Staff, admin | ✅ Phiếu tham vấn | 12 |
| `/admin/leads` | Staff, admin | Khách quan tâm premium | 8 |
| `/admin/courses`, `/admin/courses/[courseId]` | Admin | Khóa học: loại, ảnh bìa, gói; nội dung buổi – bài | 8–10 |
| `/admin/settings/consultation` | Admin | ✅ Mẫu phiếu tham vấn | 12 |

### 7.2. Middleware

- ✅ Xem §2. Từ Đợt 11 (ADR-016) vai trò được kiểm tra ở trang, middleware chỉ kiểm tra đăng nhập bằng cookie.

### 7.3. Server actions mới / thay đổi

| Action | File | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| `requireStaff()` | `lib/auth.ts` | — | ✅ Đợt 7: như `requireAdmin` cho `staff`/`admin`; `getCurrentUser()` (cache theo request) trả `role`, `isStaff`, `mustChangePassword` (Đợt 11); thêm `requireUserPage` / `requireStaffPage` / `requireAdminPage` cho trang (ADR-016) |
| `setUserRole(userId, formData)` | `app/admin/actions.ts` | Admin | ✅ Đợt 7 – `role ∈ user/staff/admin` (xem §3.6) |
| `registerAction` | `app/register/actions.ts` | Công khai | ✅ `consent` (Đợt 8), `planId` + giá theo gói + chỉ chặn đơn pending (Đợt 9) |
| `createCourse` / `updateCourse` | admin | Admin | Thêm `kind`, `category`, `summary`, `outcomes`, `cover` (file ≤ 2MB, magic bytes). RK-18: form sửa chương trình không có ô Giá → `updateCourse` giữ nguyên `price` |
| `createPlan` / `updatePlan` / `deletePlan` | admin | Admin | ✅ Đợt 9 – xem §3.6 |
| `generateSkeleton(courseId, formData)` | admin | Admin | `sessionCount` 1–200, `lessonsPerSession` 1–20; nối tiếp sau buổi cuối hiện có |
| `createSession` / `updateSession` / `deleteSession` / `duplicateSession` / `moveSession` | admin | Admin | Quản lý buổi |
| `createLesson` / `updateLesson` | admin | Admin | Thêm `session_id`; `video_url` không bắt buộc |
| `completeLessonAction(courseId, lessonId, nextLessonId)` / `uncompleteLessonAction(courseId, lessonId)` | `app/courses/actions.ts` | Bệnh nhân | ✅ Đợt 10 – tick (redirect sang bài kế tiếp nếu `can_view_lesson`, không thì `?finished=1`) / bỏ tick (ActionResult); server client, RLS quyết định |
| `acceptConsentAction()` | `app/account/actions.ts` | Đăng nhập | ✅ Đợt 8 – ghi `consent_at`, `consent_version` (service role, theo phiên) |
| ~~`dismissPasswordReminder()`~~ | — | — | Không cần action: "Để sau" lưu `sessionStorage` trong `components/LoginReminders.tsx` |
| `changePasswordAction` | `app/account/actions.ts` | Đăng nhập | ✅ Đợt 11: thành công → `must_change_password = false`. Vẫn bắt nhập mật khẩu hiện tại (mật khẩu nhân viên cấp) |
| `createPatientAction(prev, formData)` | `app/admin/patients/actions.ts` | Staff | ✅ Đợt 11 – `fullName`*, `phone`*, `email`, `note` (≤ 1000, vào `patient_notes`), `consent=yes`*, tùy chọn cấp gói. Kiểm tra trùng SĐT / email → tạo user (service role) → cập nhật profile (`source='zalo'`, `created_by`, `must_change_password`, `consent_*`) → ghi chú → cấp gói → `account_events.created`. Lỗi giữa chừng → xóa tài khoản vừa tạo. Trả `SecretResult { ok, message, password, patientId, name, phone }` (dùng với `useFormState`) |
| `grantPlanAction(userId, formData)` | như trên | Staff | ✅ Đợt 11 – chỉ tài khoản `role = user`; `planId`* (gói đang bán của chương trình trả phí), `amount`* 0 – 1 tỷ, `paymentMethod`* `bank_transfer\|cash\|other`, `paymentNote` ≤ 500, `proof` (ảnh ≤ 5MB, magic bytes, service role upload) → insert đơn `approved` bằng **server client** (policy + trigger) |
| `updatePatientAction(userId, formData)` | như trên | Staff | ✅ Đợt 11 – họ tên, SĐT, email (đổi email đăng nhập như trang Tài khoản), ghi chú nội bộ; chỉ tài khoản `role = user`; ghi `account_events.profile_updated` |
| `resetPatientPasswordAction(userId)` | như trên | Staff | ✅ Đợt 11 – chỉ tài khoản `role = user`; sinh mật khẩu mới (`lib/generate-password.ts`), `must_change_password = true`, ghi `account_events.password_reset`; trả `SecretResult` |
| `submitConsultationAction(prev, formData)` | `app/courses/actions.ts` | Đăng nhập | ✅ Đợt 12 – câu hỏi đang bật (`q_<id>`: check `yes\|no`*, scale `0–10`*, text ≤ 500), `note` ≤ 1000, `courseId` (chỉ chương trình đã được duyệt), `origin`; giới hạn 5 phiếu / ngày (`consult:<user_id>`, chỉ tính phiếu hợp lệ); insert service role kèm ảnh chụp câu hỏi, họ tên, SĐT → `redirect('/courses?consultation=sent')` + flash |
| `setConsultationStatus(id, expected, formData)` | `app/admin/actions.ts` | Staff | ✅ Đợt 12 – `status` (`new\|contacted\|done\|cancelled`), `staff_note` ≤ 1000; `.eq('status', expected)` – không ghi đè người khác |
| `createConsultQuestion` / `updateConsultQuestion` / `deleteConsultQuestion` / `moveConsultQuestion` | `app/admin/actions.ts` | Admin | ✅ Đợt 12 – `label` 1–300, `kind` `check\|scale\|text`, `active` (form sửa); ↑↓ đánh lại thứ tự 1…n |
| `createLeadAction(courseId, formData)` | `app/khoa-hoc/actions.ts` | Công khai | ✅ Đợt 8 – họ tên + SĐT (cả hai trống = lượt bấm ẩn danh), khóa phải là premium đang hiển thị, rate limit 20/giờ/IP. Client mở Zalo **ngay khi bấm** (không chờ action) để trình duyệt không chặn cửa sổ |
| `setLeadStatus(id, expected, formData)` | `app/admin/actions.ts` | Staff | ✅ Đợt 8 – xem §3.6 |

### 7.4. RPC gọi từ trang

| Nơi gọi | RPC | Mục đích |
| --- | --- | --- |
| Trình học | ~~`get_lesson_video`~~ → đọc `lessons` (RLS `can_view_lesson`) + `course_outline` | Link video nếu được xem; tên bài buổi khóa (Đợt 10) |
| Khóa học của tôi, trang khóa, trình học | `course_progress(course_id)` | % tiến độ, bài tiếp theo, hạn học |
| `/admin` | ✅ `dashboard_stats()`, `revenue_report(from, to)` (admin; tháng này + tháng trước theo giờ VN) | Dashboard |
| `/admin/patients`, `/admin/patients/[id]` | ✅ `admin_patients(…)`, `patient_progress(user)` | Danh sách, hồ sơ bệnh nhân |
| `/courses` | ✅ `my_consultations(10)` | Phiếu tham vấn của tôi |

## 8. Hướng dẫn thêm API mới

- Form trong trang → **Server Action** trả `ActionResult`, dùng `ActionForm` + `SubmitButton`.
- Webhook/tích hợp bên ngoài/app di động cần service role → **Route Handler** `app/api/<tên>/route.ts`,
  xác thực bằng chữ ký/secret header, không dùng cookie.
- Trang mới cần quyền: gọi `requireUserPage` / `requireStaffPage` / `requireAdminPage` đầu trang (middleware không kiểm tra vai trò – ADR-016).
- Luôn: validate server-side, kiểm quyền (`requireAdmin`/`requireStaff`/`getCurrentUser`), để RLS là lớp cuối, trả thông báo tiếng Việt,
  cập nhật bảng trong tài liệu này.
