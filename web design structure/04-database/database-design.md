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
    text role "user | admin"
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
    uuid user_id FK "→ auth.users, cascade"
    uuid course_id FK "→ courses, set null khi xóa khóa"
    text course_title "snapshot tên khóa"
    int amount "snapshot học phí"
    text full_name "snapshot"
    text email "snapshot, nullable"
    text phone "snapshot"
    text payment_proof_path
    text status "pending | approved | rejected"
    timestamptz reviewed_at
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
| `role` | text | ✗ | `'user'` | `check (role in ('user','admin'))` |
| `created_at` | timestamptz | ✗ | `now()` | |

### 2.2. `public.courses`

| Cột | Kiểu | Null | Mặc định | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | uuid | ✗ | `gen_random_uuid()` | PK |
| `title` | text | ✗ | — | Tên khóa học |
| `description` | text | ✓ | — | Mô tả ngắn (hiển thị tối đa 3 dòng ở thẻ) |
| `cover_image` | text | ✓ | — | **Dự phòng**, chưa dùng ở UI (roadmap R-03) |
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
| `user_id` | uuid | ✗ | — | FK `auth.users(id)` cascade |
| `course_id` | uuid | ✓ | — | FK `courses(id)` **on delete set null** – `null` nghĩa là khóa đã bị xóa, đơn vẫn giữ làm lịch sử |
| `course_title` | text | ✓ | — | Snapshot tên khóa lúc đăng ký (đơn cũ được điền tự động khi chạy schema) |
| `amount` | int | ✓ | — | Snapshot học phí lúc đăng ký (VNĐ) – dùng cho lịch sử thanh toán / báo cáo doanh thu |
| `full_name` | text | ✗ | — | Snapshot tại thời điểm đăng ký |
| `email` | text | ✓ | — | Snapshot email thật (đã bỏ `not null`) |
| `phone` | text | ✗ | — | Snapshot SĐT |
| `payment_proof_path` | text | ✗ | — | Đường dẫn trong bucket `payment-proofs` |
| `status` | text | ✗ | `'pending'` | `check (status in ('pending','approved','rejected'))` |
| `reviewed_at` | timestamptz | ✓ | — | Thời điểm admin xử lý gần nhất |
| `created_at` | timestamptz | ✗ | `now()` | |

Index: `registrations_user_idx (user_id, course_id, status)` – phục vụ `has_course_access` và kiểm tra trùng;
`registrations_status_idx (status, created_at)` – phục vụ tab admin.

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

## 3. Hàm & trigger

| Tên | Loại | Bảo mật | Mô tả |
| --- | --- | --- | --- |
| `handle_new_user()` | trigger function | `security definer`, `search_path = public` | Sau khi insert `auth.users`: tạo profile với `email` (bỏ email nội bộ), `full_name`, `phone` từ `raw_user_meta_data`; `on conflict (id) do nothing` |
| `on_auth_user_created` | trigger | — | `after insert on auth.users for each row` |
| `is_admin()` | SQL, `stable` | `security definer` | `exists(profiles where id = auth.uid() and role = 'admin')` |
| `has_course_access(target_course uuid)` | SQL, `stable` | `security definer` | `is_admin() or exists(registrations where user_id = auth.uid() and course_id = target_course and status = 'approved')`. Được gọi cả trong RLS lẫn qua RPC ở trang chi tiết khóa |

> Lưu ý: nếu SĐT trong `raw_user_meta_data` trùng một profile khác, trigger vi phạm unique index →
> **toàn bộ** việc tạo user thất bại ("Database error creating new user"). Ứng dụng kiểm tra trùng trước (`isPhoneTaken`).

## 4. Row Level Security

| Bảng | Thao tác | Policy | Điều kiện |
| --- | --- | --- | --- |
| profiles | SELECT | `profiles_select` | `auth.uid() = id or is_admin()` |
| profiles | UPDATE | `profiles_admin_update` | `is_admin()` |
| profiles | INSERT/DELETE | — | Không ai (chỉ trigger/service role) |
| courses | SELECT | `courses_select` | `status = 'published' or has_course_access(id)` (đã gồm `is_admin()`; học viên đã duyệt đọc được khóa đang ẩn) |
| courses | INSERT / UPDATE / DELETE | `courses_admin_*` | `is_admin()` |
| lessons | SELECT | `lessons_select` | `has_course_access(course_id)` |
| lessons | INSERT / UPDATE / DELETE | `lessons_admin_*` | `is_admin()` |
| registrations | SELECT | `registrations_select` | `auth.uid() = user_id or is_admin()` |
| registrations | UPDATE | `registrations_admin_update` | `is_admin()` |
| registrations | INSERT/DELETE | — | Chỉ service role |
| password_resets | Mọi thao tác | — (RLS bật, không policy) | Chỉ service role |
| storage.objects (`payment-proofs`) | SELECT | `payment_proofs_admin_select` | `bucket_id = 'payment-proofs' and is_admin()` |
| storage.objects (`payment-proofs`) | INSERT/UPDATE/DELETE | — | Chỉ service role |

Ma trận quyền theo vai trò: [07-security/security-design.md](../07-security/security-design.md#3-ma-trận-phân-quyền).

## 5. Storage

| Bucket | Public | Giới hạn | MIME cho phép | Cấu trúc đường dẫn |
| --- | --- | --- | --- | --- |
| `payment-proofs` | ✗ | 5 MB (5242880) | image/png, image/jpeg, image/webp, image/heic, image/heif | `<user_id>/<uuid>.<ext>` |

Truy cập đọc: admin tạo signed URL 1 giờ (`createSignedUrls(paths, 3600)`).

> Khi xóa khóa học, đơn vẫn còn nên ảnh vẫn được tham chiếu. Khi xóa **tài khoản**, đơn bị xóa theo nhưng file ảnh **không** → ảnh mồ côi (RV-08).

## 6. Truy vấn chính & index phục vụ

| Nghiệp vụ | Truy vấn | Index |
| --- | --- | --- |
| Trang chủ | `courses where status='published' order by sort_order` | (bảng nhỏ, không cần) |
| Kiểm tra quyền xem bài | `registrations where user_id=? and course_id=? and status='approved'` | `registrations_user_idx` |
| Tab admin | `registrations where status=? order by created_at limit 200` + đếm theo status | `registrations_status_idx` |
| Danh sách bài | `lessons where course_id=? order by sort_order` | `lessons_course_id_idx` |
| Đăng nhập bằng SĐT | `profiles where phone=?` | `profiles_phone_key` |
| Đăng nhập bằng email | `profiles where email=?` | *Chưa có index* (đề xuất `create index on profiles(email)`) |
| Mã reset gần nhất | `password_resets where user_id=? [and used_at is null] order by created_at desc limit 1` | `password_resets_user_idx` |
| Tìm học viên | `profiles where full_name/email/phone ilike '%q%'` | Full scan (chấp nhận với < 10k dòng; lớn hơn dùng `pg_trgm`) |

## 7. Vòng đời dữ liệu & xóa

| Hành động | Ảnh hưởng |
| --- | --- |
| Xóa user trong Supabase Auth | Cascade xóa `profiles`, `registrations`, `password_resets` (ảnh trong Storage **còn lại**) – ⚠️ mất lịch sử thanh toán của user, xem RK-03 |
| Xóa khóa học | Cascade xóa `lessons`; `registrations.course_id` → `null`, **đơn và ảnh chuyển khoản được giữ** |
| Xóa bài học | Chỉ xóa bài học |
| Thu hồi đơn | `status = 'rejected'`, giữ nguyên dữ liệu |

## 8. Dữ liệu cấu hình ngoài database

Thông tin ngân hàng, hotline, bác sĩ nằm trong `lib/site-config.ts` (thay đổi cần deploy lại).
Nếu muốn admin tự sửa trên giao diện → tạo bảng `settings` (roadmap R-11).

## 9. Đề xuất cải tiến schema (chưa áp dụng)

```sql
-- Chặn trùng đơn đang hiệu lực ở tầng DB (BR-34)
create unique index if not exists registrations_active_unique
  on public.registrations (user_id, course_id) where status in ('pending', 'approved');

-- Truy vết người duyệt & lý do (US-09.05, US-09.06)
alter table public.registrations add column if not exists reviewed_by uuid references auth.users (id);
alter table public.registrations add column if not exists review_note text;

-- Tra cứu đăng nhập bằng email
create index if not exists profiles_email_idx on public.profiles (email);
```
