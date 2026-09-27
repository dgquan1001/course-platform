# Thiết kế cơ sở dữ liệu

Nguồn sự thật: `supabase/schema.sql` (PostgreSQL trên Supabase). Tài liệu này giải thích ý nghĩa và
ràng buộc; khi hai nơi lệch nhau, **sửa cả hai**.

## 1. Sơ đồ quan hệ (ERD)

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "1-1 (trigger tạo)"
  AUTH_USERS ||--o{ REGISTRATIONS : "đặt đơn"
  AUTH_USERS ||--o{ PASSWORD_RESETS : "yêu cầu mã"
  COURSES ||--o{ LESSONS : "gồm"
  COURSES |o--o{ REGISTRATIONS : "được đăng ký (set null khi xóa khóa)"
  REGISTRATIONS }o--|| STORAGE_OBJECTS : "payment_proof_path"

  AUTH_USERS {
    uuid id PK
    text email "email thật hoặc <SĐT>@sdt.hv.invalid"
    text encrypted_password
    jsonb raw_user_meta_data "full_name, phone"
  }
  PROFILES {
    uuid id PK,FK "→ auth.users.id, cascade"
    text email "email thật, null nếu chỉ có SĐT"
    text full_name
    text phone "unique khi not null"
    text role "user | staff | admin"
    timestamptz created_at
  }
  COURSES {
    uuid id PK
    text title
    text description
    text cover_image "chưa dùng"
    int price "VNĐ, 0 = Liên hệ"
    text status "draft | published"
    int sort_order
    timestamptz created_at
  }
  LESSONS {
    uuid id PK
    uuid course_id FK "cascade"
    text title
    text description
    text video_url
    int sort_order
    timestamptz created_at
  }
  REGISTRATIONS {
    uuid id PK
    uuid user_id FK "→ auth.users, set null khi xóa tài khoản"
    uuid course_id FK "→ courses, set null khi xóa khóa"
    text course_title "snapshot tên khóa"
    int amount "snapshot học phí"
    text full_name "snapshot"
    text email "snapshot, nullable"
    text phone "snapshot"
    text payment_proof_path
    text status "pending | approved | rejected"
    timestamptz reviewed_at
    uuid reviewed_by FK "→ profiles, set null"
    text reviewed_by_name "snapshot tên admin"
    timestamptz created_at
  }
  PASSWORD_RESETS {
    uuid id PK
    uuid user_id FK "cascade"
    text code_hash "sha256(userId:code)"
    int attempts
    timestamptz expires_at
    timestamptz used_at
    timestamptz created_at
  }
  STORAGE_OBJECTS {
    text bucket_id "payment-proofs"
    text name "<userId>/<uuid>.<ext>"
  }
```

## 2. Từ điển dữ liệu

### 2.1. `public.profiles`
Thông tin hồ sơ, 1-1 với `auth.users`. Tạo tự động bởi trigger.

| Cột | Kiểu | Null | Mặc định | Ràng buộc / ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | — | PK, FK `auth.users(id)` **on delete cascade** |
| `email` | text | ✓ | — | Email thật (chữ thường). `null` với tài khoản chỉ có SĐT. **Không** unique ở DB (unique do Auth) |
| `full_name` | text | ✓ | — | Họ tên |
| `phone` | text | ✓ | — | SĐT chuẩn hóa `0xxxxxxxxx`. Unique index một phần `profiles_phone_key … where phone is not null` |
| `role` | text | ✗ | `'user'` | Constraint `profiles_role_check`: `role in ('user','staff','admin')` (staff từ Đợt 7 – ADR-011) |
| `consent_at` | timestamptz | ✓ | — | Thời điểm đồng ý Chính sách bảo mật (Đợt 8) |
| `consent_version` | text | ✓ | — | Phiên bản chính sách đã đồng ý (`lib/consent.ts`) |
| `created_at` | timestamptz | ✗ | `now()` | |

### 2.2. `public.courses`

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | `gen_random_uuid()` | PK |
| `title` | text | ✗ | — | Tên khóa học |
| `description` | text | ✓ | — | Mô tả ngắn (hiển thị tối đa 3 dòng ở thẻ) |
| `cover_image` | text | ✓ | — | URL công khai ảnh bìa trong bucket `course-covers` (Đợt 8) |
| `kind` | text | ✗ | `'program'` | `courses_kind_check`: `free` / `program` / `premium` (ADR-012) |
| `category` | text | ✓ | — | `courses_category_check`: `veo_lung` / `veo_nguc` |
| `audience` | text | ✗ | `'patient'` | `patient` / `expert` (chưa có UI) |
| `summary` | text | ✓ | — | Mô tả ngắn trên thẻ khóa (≤ 300 ký tự, kiểm tra ở server) |
| `outcomes` | text[] | ✗ | `'{}'` | "Bạn sẽ đạt được" (≤ 12 ý × 200 ký tự) |
| `price` | int | ✗ | `0` | Học phí VNĐ. `constraint courses_price_nonnegative check (price >= 0)`; server giới hạn ≤ 1 tỷ |
| `status` | text | ✗ | `'published'` | `check (status in ('draft','published'))` |
| `sort_order` | int | ✗ | `0` | Thứ tự hiển thị tăng dần |
| `created_at` | timestamptz | ✗ | `now()` | |

### 2.3. `public.lessons`

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | `gen_random_uuid()` | PK |
| `course_id` | uuid | ✗ | — | FK `courses(id)` **on delete cascade** |
| `title` | text | ✗ | — | |
| `description` | text | ✓ | — | Hiển thị giữ xuống dòng (`whitespace-pre-line`) |
| `video_url` | text | ✗ | — | Link YouTube/TikTok gốc (xem ADR-005) |
| `sort_order` | int | ✗ | `0` | |
| `created_at` | timestamptz | ✗ | `now()` | |

Index: `lessons_course_id_idx (course_id, sort_order)`.

### 2.4. `public.registrations`

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✓ | — | FK `auth.users(id)` **on delete set null** – `null` nghĩa là tài khoản đã bị xóa, đơn vẫn giữ làm lịch sử (RK-03) |
| `course_id` | uuid | ✓ | — | FK `courses(id)` **on delete set null** – `null` nghĩa là khóa đã bị xóa, đơn vẫn giữ làm lịch sử |
| `course_title` | text | ✓ | — | Snapshot tên khóa lúc đăng ký (đơn cũ được điền tự động khi chạy schema) |
| `amount` | int | ✓ | — | Snapshot học phí lúc đăng ký (VNĐ) – dùng cho lịch sử thanh toán / báo cáo doanh thu |
| `full_name` | text | ✗ | — | Snapshot tại thời điểm đăng ký |
| `email` | text | ✓ | — | Snapshot email thật (đã bỏ `not null`) |
| `phone` | text | ✗ | — | Snapshot SĐT |
| `payment_proof_path` | text | ✗ | — | Đường dẫn trong bucket `payment-proofs` |
| `status` | text | ✗ | `'pending'` | `check (status in ('pending','approved','rejected'))` |
| `reviewed_at` | timestamptz | ✓ | — | Thời điểm admin xử lý gần nhất (trigger ghi) |
| `reviewed_by` | uuid | ✓ | — | Admin xử lý gần nhất, FK `profiles(id)` **on delete set null** (trigger ghi `auth.uid()`) |
| `reviewed_by_name` | text | ✓ | — | Snapshot tên admin lúc xử lý (`full_name` → `email` → `phone`), hiển thị ở cột "Người xử lý" |
| `review_note` | text | ✓ | — | Lý do từ chối / thu hồi (học viên thấy). Trigger xóa khi về pending; không đổi được nếu `status` không đổi |
| `created_at` | timestamptz | ✗ | `now()` | |

Index: `registrations_user_idx (user_id, course_id, status)` – phục vụ `has_course_access` và kiểm tra trùng;
`registrations_status_idx (status, created_at)` – phục vụ tab admin;
`registrations_active_key` **unique** `(user_id, course_id) where status in ('pending','approved')` – chặn đơn trùng kể cả khi gửi đồng thời (BR-34, RK-07).
Nếu dữ liệu cũ đang có đơn trùng, `schema.sql` bỏ qua bước tạo index và in cảnh báo; xử lý đơn trùng rồi chạy lại.

### 2.5. `public.password_resets`

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✗ | — | FK `auth.users(id)` cascade |
| `code_hash` | text | ✗ | — | `sha256(userId:code)` dạng hex |
| `attempts` | int | ✗ | `0` | Số lần nhập sai |
| `expires_at` | timestamptz | ✗ | — | `created_at + 10 phút` |
| `used_at` | timestamptz | ✓ | — | Đã dùng / bị vô hiệu |
| `created_at` | timestamptz | ✗ | `now()` | Dùng để giới hạn gửi lại 60 giây |

Index: `password_resets_user_idx (user_id, created_at desc)`.

### 2.6. `public.registration_events` (lịch sử xử lý đơn)

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | `gen_random_uuid()` | PK |
| `registration_id` | uuid | ✗ | — | FK `registrations(id)` on delete cascade |
| `actor` | uuid | ✓ | — | Admin thực hiện, FK `profiles(id)` on delete set null; null = service role / hệ thống |
| `actor_name` | text | ✓ | — | Snapshot tên admin |
| `from_status`, `to_status` | text | ✗ | — | Trạng thái trước → sau |
| `note` | text | ✓ | — | Lý do (nếu có) |
| `created_at` | timestamptz | ✗ | `now()` | |

Index: `registration_events_registration_idx (registration_id, created_at)`. Chỉ trigger `registrations_stamp_review` ghi.

### 2.7. `public.role_events` (nhật ký phân quyền)

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ✓ | — | Tài khoản được đổi quyền, FK `profiles(id)` on delete set null |
| `user_name` | text | ✓ | — | Snapshot tên tài khoản |
| `actor`, `actor_name` | uuid, text | ✓ | — | Admin thực hiện (null = script / service role) |
| `from_role`, `to_role` | text | ✗ | — | `user` ↔ `admin` |
| `created_at` | timestamptz | ✗ | `now()` | |

Index: `role_events_user_idx (user_id, created_at desc)`. Chỉ trigger `profiles_guard_role` ghi.

### 2.7b. `public.leads` (khách quan tâm khóa premium – Đợt 8)

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | `gen_random_uuid()` | PK |
| `course_id` | uuid | ✓ | — | FK `courses` on delete set null |
| `course_title` | text | ✓ | — | Snapshot tên khóa |
| `user_id` | uuid | ✓ | — | Tài khoản đang đăng nhập khi bấm (nếu có), FK `auth.users` on delete set null |
| `full_name`, `phone` | text | ✓ | — | Khách để lại; `phone is null` = lượt bấm "Mở Zalo ngay" ẩn danh (chỉ thống kê) |
| `status` | text | ✗ | `'new'` | `new` / `contacted` / `converted` / `closed` |
| `staff_note` | text | ✓ | — | Ghi chú nội bộ (≤ 500) |
| `handled_by`, `handled_by_name`, `handled_at` | uuid, text, timestamptz | ✓ | — | Trigger `leads_stamp` ghi theo phiên khi đổi trạng thái / ghi chú |
| `created_at` | timestamptz | ✗ | `now()` | |

Index `leads_status_idx (status, created_at)`. Chỉ service role thêm (`createLeadAction`, giới hạn 20 lần/giờ/IP).

### 2.8. `public.rate_limits` (giới hạn tần suất)

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `key` | text | ✗ | — | PK. VD `register:<IP>`, `login-fail:<IP>:<SĐT/email>`, `login-fail-ip:<IP>`, `forgot:<IP>` |
| `window_start` | timestamptz | ✗ | `now()` | Bắt đầu khung đếm hiện tại |
| `hits` | int | ✗ | `0` | Số lần trong khung |

RLS bật, không policy (chỉ service role). Hàm `hit_rate_limit(p_key, p_limit, p_window_seconds, p_increment default true)`:
`security definer`, chỉ `service_role` được `execute`; cửa sổ cố định; `p_increment = false` chỉ kiểm tra;
thỉnh thoảng (1%) dọn khóa cũ hơn 1 ngày.

## 3. Hàm & trigger

| Tên | Loại | Bảo mật | Mô tả |
| --- | --- | --- | --- |
| `handle_new_user()` | trigger function | `security definer`, `search_path = public` | Sau khi insert `auth.users`: tạo profile với `email` (bỏ email nội bộ), `full_name`, `phone` từ `raw_user_meta_data`; `on conflict (id) do nothing` |
| `on_auth_user_created` | trigger | — | `after insert on auth.users for each row` |
| `is_admin()` | SQL, `stable` | `security definer` | `exists(profiles where id = auth.uid() and role = 'admin')` |
| `is_free_course(course)` | SQL, `stable` | `security definer` | Khóa `kind = 'free'` và `published` (Đợt 8) – dùng trong `lessons_select` |
| `course_outline(course)` | SQL, `stable` | `security definer`, `grant execute` cho anon/authenticated | Đề cương công khai: `id, title, description, sort_order` (không có `video_url`) của khóa đang hiển thị hoặc người đã có quyền; bỏ khóa premium (Đợt 8) |
| `stamp_lead()` / trigger `leads_stamp` | trigger | `security definer` | `before update on leads`: giữ nguyên thông tin khách để lại; đổi trạng thái / ghi chú thì ghi `handled_by`, `handled_by_name`, `handled_at` |
| `is_staff()` | SQL, `stable` | `security definer` | `exists(profiles where id = auth.uid() and role in ('staff','admin'))` (Đợt 7) |
| `has_course_access(target_course uuid)` | SQL, `stable` | `security definer` | `is_staff() or exists(registrations where user_id = auth.uid() and course_id = target_course and status = 'approved')` (nhân viên, admin xem trước mọi khóa). Được gọi cả trong RLS lẫn qua RPC ở trang chi tiết khóa |
| `stamp_registration_review()` | trigger function | `security definer`, `search_path = public` | Khi `status` đổi: về `pending` → xóa `reviewed_at/by/by_name`; trạng thái khác → `now()`, `auth.uid()`, tên admin từ `profiles`. Khi `status` không đổi → giữ nguyên giá trị cũ (không sửa tay được; riêng `reviewed_by` được về `null` để khóa ngoại hoạt động khi xóa admin) |
| `guard_role_change()` | trigger function | `security definer`, `search_path = public` | Khi `profiles.role` đổi: người có phiên đăng nhập mà không phải admin → "Chỉ admin được thay đổi vai trò tài khoản." (service role/script vẫn đổi được); chặn tự gỡ quyền admin của mình; `pg_advisory_xact_lock` rồi chặn gỡ admin cuối cùng; ghi `role_events` |
| `profiles_guard_role` | trigger | — | `before update of role on profiles for each row` |
| `registrations_stamp_review` | trigger | — | `before update on registrations for each row`. Mỗi lần đổi `status` ghi thêm 1 dòng `registration_events` (kèm `review_note`). Cập nhật bằng service role (không có phiên) → `reviewed_by` null |

> Lưu ý: nếu SĐT trong `raw_user_meta_data` trùng một profile khác, trigger vi phạm unique index →
> **toàn bộ** việc tạo user thất bại ("Database error creating new user"). Ứng dụng kiểm tra trùng trước (`isPhoneTaken`).

## 4. Row Level Security

| Bảng | Thao tác | Policy | Điều kiện |
| --- | --- | --- | --- |
| profiles | SELECT | `profiles_select` | `auth.uid() = id or is_staff()` |
| profiles | UPDATE | `profiles_admin_update` | `is_admin()` |
| profiles | UPDATE | `profiles_staff_update` | using `is_staff() and role = 'user'`, with check `role = 'user'` (nhân viên chỉ sửa tài khoản học viên; đổi vai trò bị trigger chặn) |
| profiles | INSERT/DELETE | — | Không ai (chỉ trigger/service role) |
| courses | SELECT | `courses_select` | `status = 'published' or has_course_access(id)` (đã gồm `is_staff()`; học viên đã duyệt đọc được khóa đang ẩn) |
| courses | INSERT / UPDATE / DELETE | `courses_admin_*` | `is_admin()` |
| lessons | SELECT | `lessons_select` | `is_free_course(course_id) or has_course_access(course_id)` (khóa miễn phí đang hiển thị: ai cũng xem) |
| lessons | INSERT / UPDATE / DELETE | `lessons_admin_*` | `is_admin()` |
| registrations | SELECT | `registrations_select` | `auth.uid() = user_id or is_staff()` |
| registrations | UPDATE | `registrations_staff_update` | `is_staff()` |
| registrations | INSERT/DELETE | — | Chỉ service role |
| password_resets | Mọi thao tác | — (RLS bật, không policy) | Chỉ service role |
| registration_events | SELECT | `registration_events_staff_select` | `is_staff()`. Không có policy ghi/sửa/xóa (chỉ trigger) |
| role_events | SELECT | `role_events_admin_select` | `is_admin()`. Không có policy ghi/sửa/xóa (chỉ trigger) |
| storage.objects (`payment-proofs`) | SELECT | `payment_proofs_staff_select` | `bucket_id = 'payment-proofs' and is_staff()` |
| storage.objects (`payment-proofs`) | INSERT/UPDATE/DELETE | — | Chỉ service role |
| leads | SELECT / UPDATE | `leads_staff_select` / `leads_staff_update` | `is_staff()`; INSERT/DELETE chỉ service role |
| storage.objects (`course-covers`) | SELECT | `course_covers_select` | `bucket_id = 'course-covers'` (bucket công khai) |
| storage.objects (`course-covers`) | INSERT / UPDATE / DELETE | `course_covers_admin_*` | `bucket_id = 'course-covers' and is_admin()` |

Ma trận quyền theo vai trò: [07-security/security-design.md](../07-security/security-design.md#3-ma-trận-phân-quyền).

## 5. Storage

| Bucket | Public | Giới hạn | MIME cho phép | Cấu trúc đường dẫn |
| --- | --- | --- | --- | --- |
| `payment-proofs` | ✗ | 5 MB (5242880) | image/png, image/jpeg, image/webp, image/heic, image/heif | `<user_id>/<uuid>.<ext>` |
| `course-covers` (Đợt 8) | ✓ | 2 MB (2097152) | image/png, image/jpeg, image/webp | `<uuid>.<ext>`; file cũ bị xóa khi đổi / xóa ảnh bìa hoặc xóa khóa |

Truy cập đọc: admin tạo signed URL 1 giờ (`createSignedUrls(paths, 3600)`).

> Khi xóa khóa học hoặc tài khoản, đơn vẫn còn nên ảnh vẫn được tham chiếu. Ảnh chỉ mồ côi khi đơn bị xóa thủ công (RV-08).

## 6. Truy vấn chính & index phục vụ

| Nghiệp vụ | Truy vấn | Index |
| --- | --- | --- |
| Trang chủ | `courses where status='published' order by sort_order` | (bảng nhỏ, không cần) |
| Kiểm tra quyền xem bài | `registrations where user_id=? and course_id=? and status='approved'` | `registrations_user_idx` |
| Tab admin | `registrations where status=? order by created_at limit 200` + đếm theo status | `registrations_status_idx` |
| Danh sách bài | `lessons where course_id=? order by sort_order` | `lessons_course_id_idx` |
| Đăng nhập bằng SĐT | `profiles where phone=?` | `profiles_phone_key` |
| Đăng nhập bằng email | `profiles where email=?` | `profiles_email_idx` (RV-13) |
| Mã reset gần nhất | `password_resets where user_id=? [and used_at is null] order by created_at desc limit 1` | `password_resets_user_idx` |
| Tìm học viên | `profiles where full_name/email/phone ilike '%q%'` | Full scan (chấp nhận với < 10k dòng; lớn hơn dùng `pg_trgm`) |

## 7. Vòng đời dữ liệu & xóa

| Hành động | Ảnh hưởng |
| --- | --- |
| Xóa user trong Supabase Auth | Cascade xóa `profiles`, `password_resets`; `registrations.user_id` → `null`, **đơn và ảnh chuyển khoản được giữ** (RK-03). Nếu user là admin: `registrations.reviewed_by` → `null`, `reviewed_by_name` vẫn còn |
| Xóa khóa học | Cascade xóa `lessons`; `registrations.course_id` → `null`, **đơn và ảnh chuyển khoản được giữ** |
| Xóa bài học | Chỉ xóa bài học |
| Thu hồi đơn | `status = 'rejected'`, giữ nguyên dữ liệu |

## 8. Dữ liệu cấu hình ngoài database

Thông tin ngân hàng, hotline, bác sĩ nằm trong `lib/site-config.ts` (thay đổi cần deploy lại).
Nếu muốn admin tự sửa trên giao diện → tạo bảng `settings` (roadmap R-11).

## 9. Đề xuất cải tiến schema (chưa áp dụng)

Đã áp dụng 26/09/2026: unique index chặn trùng đơn (`registrations_active_key`), người xử lý (`reviewed_by`, `reviewed_by_name`);
Đợt 3: `review_note`, `registration_events`, `role_events`. Các đề xuất tiếp theo nằm ở §10.

## 10. Thiết kế phiên bản 0.2 (chốt 27/09/2026 – chưa áp dụng vào `schema.sql`)

Nguồn: ADR-011 → ADR-015, business-rules BR-70 → BR-107. Mỗi đợt triển khai đưa phần tương ứng vào `supabase/schema.sql`
(idempotent, ADR-010) và chuyển mục ở đây sang §2 / §3 / §4.

### 10.1. ERD bổ sung

```mermaid
erDiagram
  PROFILES ||--o{ REGISTRATIONS : "đặt / được cấp"
  PROFILES ||--o{ LESSON_PROGRESS : "tick"
  PROFILES ||--o{ CONSULTATIONS : "gửi phiếu"
  PROFILES |o--o{ LEADS : "bấm liên hệ (có thể ẩn danh)"
  PROFILES ||--o{ ACCOUNT_EVENTS : "được tạo / cấp lại MK"
  COURSES ||--o{ COURSE_PLANS : "gói"
  COURSES ||--o{ COURSE_SESSIONS : "buổi"
  COURSE_SESSIONS ||--o{ LESSONS : "bài tập"
  LESSONS ||--o{ LESSON_PROGRESS : ""
  COURSE_PLANS |o--o{ REGISTRATIONS : "snapshot gói"
  COURSES |o--o{ CONSULTATIONS : "đang học (tùy chọn)"
  COURSES |o--o{ LEADS : "khóa premium"

  PROFILES {
    text role "user | staff | admin"
    text source "web | zalo"
    uuid created_by "nhân viên tạo"
    bool must_change_password
    timestamptz consent_at
    text consent_version
    text staff_note "ghi chú nội bộ"
  }
  COURSES {
    text kind "free | program | premium"
    text category "veo_lung | veo_nguc | null"
    text audience "patient | expert"
    text cover_image "URL public course-covers"
    text summary "mô tả ngắn"
    text[] outcomes "Bạn sẽ đạt được"
  }
  COURSE_PLANS {
    uuid id PK
    uuid course_id FK
    int months "1 | 3 | 6 | 12"
    int sessions "mặc định 12 × months"
    int price
    bool active
  }
  COURSE_SESSIONS {
    uuid id PK
    uuid course_id FK
    text title
    text description
    int sort_order
  }
  LESSONS {
    uuid session_id FK "mới"
    text video_url "nullable, không cấp select cho client"
  }
  LESSON_PROGRESS {
    uuid user_id PK
    uuid lesson_id PK
    uuid course_id "denormalize để đếm nhanh"
    timestamptz completed_at
  }
  REGISTRATIONS {
    uuid plan_id FK "set null"
    int plan_months "snapshot"
    int plan_sessions "snapshot"
    text source "web | staff"
    text payment_method "bank_transfer | cash | other"
    text payment_note
    uuid created_by "nhân viên tạo đơn"
    timestamptz access_starts_at
    timestamptz access_until
  }
  CONSULT_QUESTIONS {
    uuid id PK
    text label
    text kind "check | scale | text"
    int sort_order
    bool active
  }
  CONSULTATIONS {
    uuid id PK
    uuid user_id FK
    uuid course_id FK "nullable"
    text course_title "snapshot"
    jsonb answers "[{label, kind, value}]"
    text note
    text trigger "manual | course_end | expiring"
    text status "new | contacted | done | cancelled"
    uuid handled_by
    text handled_by_name
    text staff_note
    timestamptz handled_at
  }
  LEADS {
    uuid id PK
    uuid course_id FK
    text course_title
    uuid user_id "nullable"
    text full_name
    text phone "null = lượt bấm ẩn danh"
    text status "new | contacted | converted | closed"
    uuid handled_by
    text staff_note
  }
  ACCOUNT_EVENTS {
    uuid id PK
    uuid user_id
    uuid actor
    text actor_name
    text action "created | password_reset | profile_updated"
  }
```

### 10.2. Thay đổi bảng hiện có

| Bảng | Thay đổi | Đợt |
| --- | --- | --- |
| `profiles` | ✅ Đợt 7: `role` check thêm `staff`. ✅ Đợt 8: `consent_at`, `consent_version`. Còn lại: thêm `source text not null default 'web' check in ('web','zalo')`, `created_by uuid → profiles on delete set null`, `must_change_password bool not null default false`, `consent_at timestamptz`, `consent_version text`, `staff_note text` | 7, 8, 11 |
| `courses` | ✅ Đợt 8 – thêm `kind text not null default 'program' check in ('free','program','premium')`, `category text check in ('veo_lung','veo_nguc')`, `audience text not null default 'patient' check in ('patient','expert')`, `summary text`, `outcomes text[] not null default '{}'`; dùng `cover_image` | 8 |
| `lessons` | thêm `session_id uuid → course_sessions on delete cascade`; `video_url` **bỏ `not null`**; `revoke select (video_url)` khỏi `anon`, `authenticated` | 10 |
| `registrations` | thêm `plan_id → course_plans on delete set null`, `plan_months int`, `plan_sessions int`, `source text not null default 'web' check in ('web','staff')`, `payment_method text not null default 'bank_transfer' check in (...)`, `payment_note text`, `created_by uuid → profiles on delete set null`, `access_starts_at`, `access_until timestamptz`; `payment_proof_path` bỏ `not null` + `check (source = 'staff' or payment_proof_path is not null)`; unique index `registrations_active_key` **thay bằng** `registrations_pending_key (user_id, course_id) where status = 'pending'` | 9, 11 |
| `registration_events` | `from_status` nhận thêm giá trị `'new'` (đơn tạo thẳng `approved` bởi nhân viên) | 11 |

### 10.3. Bảng mới

| Bảng | Khóa / ràng buộc | Ghi chú |
| --- | --- | --- |
| `course_plans` | PK `id`; unique `(course_id, months)`; `months in (1,3,6,12)`; `sessions between 1 and 500`; `price between 0 and 1000000000`; FK `course_id` cascade | Chỉ dùng cho `kind = 'program'` |
| `course_sessions` | PK `id`; FK `course_id` cascade; index `(course_id, sort_order)` | |
| `lesson_progress` | PK `(user_id, lesson_id)`; FK `user_id → auth.users` cascade, `lesson_id` cascade; `course_id` (điền bởi trigger từ bài học); index `(user_id, course_id)` | |
| `consult_questions` | PK `id`; `kind in ('check','scale','text')`; `label` ≤ 300 ký tự | Seed sẵn ~6 câu mẫu (xem §10.8) |
| `consultations` | PK `id`; FK `user_id → auth.users on delete set null`; `status` check; index `(status, created_at)`, `(user_id, created_at desc)` | Dữ liệu sức khỏe |
| `leads` | ✅ Đợt 8 – PK `id`; FK `course_id on delete set null`; `status` check; index `(status, created_at)` | Xem §2.7b |
| `account_events` | PK `id`; `user_id`, `actor` → profiles on delete set null; `action` check | Chỉ server ghi |

### 10.4. Hàm

| Hàm | Mô tả |
| --- | --- |
| `is_staff()` | ✅ Đợt 7 – `exists(profiles where id = auth.uid() and role in ('staff','admin'))`, `security definer`, `stable` |
| `has_course_access(course)` | **Sửa** (✅ phần `is_staff()` ở Đợt 7; phần hạn học ở Đợt 9): `is_staff() or exists(registrations approved của mình cho course với access_until is null or access_until > now())` |
| `purchased_sessions(course)` | Tổng `plan_sessions` của đơn approved (đơn không có gói → `null` = không giới hạn) |
| `session_position(session)` | Thứ tự 1-based của buổi trong khóa (`row_number() over (order by sort_order, created_at)`) |
| `session_completed(user, session)` | Mọi bài của buổi đã có trong `lesson_progress` của user (buổi rỗng = true) |
| `can_view_lesson(lesson)` | `is_staff()` ∨ (khóa `free` và `published`) ∨ (khóa `program` ∧ `has_course_access` ∧ vị trí buổi ≤ `purchased_sessions` ∧ (vị trí = 1 ∨ buổi liền trước `session_completed`)) |
| `get_lesson_video(lesson)` | `security definer`; trả `video_url` nếu `can_view_lesson`, ngược lại `null`; `grant execute` cho `anon`, `authenticated` |
| `course_progress(course)` | Trả `(done, total, percent, next_lesson_id, access_until, purchased_sessions)` cho người gọi – dùng cho thẻ khóa, trình học |
| `revenue_report(from, to)` | Chỉ `is_admin()`; tổng `amount` đơn approved theo chương trình, hình thức, nguồn, nhân viên |
| `dashboard_stats()` | `is_staff()`; đếm các chỉ số FR-181 trong 1 lần gọi |

### 10.5. Trigger

| Trigger | Thay đổi |
| --- | --- |
| `registrations_stamp_review` | Chạy cả `before insert` (đơn tạo thẳng `approved`: ghi người xử lý, lịch sử `new → approved`) và `before update`. Khi chuyển sang `approved`: tính `access_starts_at`, `access_until` theo BR-80 (khóa `pg_advisory_xact_lock` theo `user_id + course_id` để 2 lần duyệt đồng thời không cộng sai); rời `approved` → xóa 2 cột này. Đơn không có `plan_months` (v0.1) → `access_until = null` |
| `guard_role_change` | ✅ Đợt 7 – Chặn nếu người đổi không phải `is_admin()` (trừ service role/script); giữ các luật cũ; nhận `staff` |
| `lesson_progress_fill` (mới) | `before insert`: điền `course_id` từ bài học |
| `consultations_stamp` (mới) | Khi đổi `status`: ghi `handled_by`, `handled_by_name`, `handled_at` theo phiên (như BR-37) |
| `leads_stamp` (mới) | Như trên cho `leads` |

### 10.6. RLS (thêm / sửa)

| Bảng | Thao tác | Điều kiện |
| --- | --- | --- |
| profiles | SELECT | `auth.uid() = id or is_staff()` |
| profiles | UPDATE | `is_admin()` (mọi dòng) **hoặc** `is_staff() and role = 'user'` (chỉ tài khoản bệnh nhân); đổi `role` do trigger kiểm tra thêm |
| courses | SELECT | `status = 'published' or has_course_access(id)` (đã gồm staff) |
| courses, course_plans, course_sessions, lessons | INSERT/UPDATE/DELETE | `is_admin()` |
| course_plans | SELECT | gói `active` của khóa đọc được, hoặc `is_admin()` |
| course_sessions | SELECT | khóa đọc được (đề cương công khai) |
| lessons | SELECT (trừ cột `video_url`) | khóa đọc được và `kind <> 'premium'`; `video_url` chỉ qua `get_lesson_video` (staff/admin đọc qua RPC hoặc service role ở trang admin) |
| lesson_progress | SELECT | `auth.uid() = user_id or is_staff()` |
| lesson_progress | INSERT | `auth.uid() = user_id and can_view_lesson(lesson_id)` |
| lesson_progress | DELETE | `auth.uid() = user_id and can_view_lesson(lesson_id)` |
| registrations | SELECT | `auth.uid() = user_id or is_staff()` |
| registrations | UPDATE | `is_staff()` |
| registrations | INSERT | Chỉ service role (web: `registerAction`; nhân viên: action kiểm tra `requireStaff` rồi insert bằng **server client** qua policy `registrations_staff_insert with check (is_staff() and source = 'staff' and created_by = auth.uid())` để trigger ghi đúng người xử lý) |
| registration_events, role_events | SELECT | `is_staff()` / `is_admin()` |
| consult_questions | SELECT | `active or is_admin()` (ai đăng nhập cũng đọc câu hỏi đang bật) |
| consult_questions | INSERT/UPDATE/DELETE | `is_admin()` |
| consultations | SELECT | `auth.uid() = user_id or is_staff()` |
| consultations | UPDATE | `is_staff()` (chỉ `status`, `staff_note`; trigger giữ nguyên các cột khác) |
| consultations | INSERT | Chỉ service role (`submitConsultationAction` – kiểm tra giới hạn, dựng snapshot) |
| leads | SELECT / UPDATE | `is_staff()` |
| leads | INSERT | Chỉ service role (`createLeadAction`) |
| account_events | SELECT | `is_staff()`; ghi chỉ service role |
| storage `course-covers` (public) | INSERT/UPDATE/DELETE | ✅ Đợt 8 – `is_admin()`; đọc công khai |
| storage `payment-proofs` | SELECT | `is_staff()` (nhân viên xem ảnh chuyển khoản) |

### 10.7. Chuyển đổi dữ liệu (FR-190)

Dữ liệu hiện tại là dữ liệu test (27/09/2026). Script chuyển đổi trong `schema.sql` vẫn phải chạy an toàn trên database có dữ liệu:

1. `courses.kind` mặc định `program` → mọi khóa cũ thành chương trình.
2. Khóa có bài học mà chưa có buổi → tạo "Buổi 1", gán mọi bài học vào buổi đó.
3. Khóa `program` chưa có gói và `price > 0` → tạo gói 1 tháng, `price` cũ, 12 buổi, `active = true`.
4. Đơn cũ: `source = 'web'`, `payment_method = 'bank_transfer'`, `plan_months`/`access_until` = `null` (không thời hạn, mở mọi buổi).
5. Trước go-live: xóa dữ liệu test theo checklist ở deployment-runbook §10 (bước 5).

### 10.8. Câu hỏi mẫu phiếu tham vấn (seed, admin sửa được)

| # | Câu hỏi | Loại |
| --- | --- | --- |
| 1 | Mức đau lưng / lưng ngực hiện tại | `scale` 0–10 |
| 2 | Đau tăng lên khi tập hoặc sau khi tập | `check` |
| 3 | Có tê bì tay chân | `check` |
| 4 | Đã tập đều theo lịch (≥ 3 buổi/tuần) | `check` |
| 5 | Động tác khó thực hiện hoặc chưa chắc tập đúng | `text` |
| 6 | Thời gian thuận tiện để bác sĩ / nhân viên liên hệ | `text` |
