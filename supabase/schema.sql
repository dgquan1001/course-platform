-- ============================================================
-- Trung tâm HV - Course Platform: toàn bộ cấu trúc database
-- Dán toàn bộ file vào Supabase > SQL Editor > Run.
-- An toàn khi chạy lại nhiều lần (không xóa dữ liệu).
-- ============================================================

-- ------------------------------------------------------------
-- Bảng profiles: thông tin user, gắn 1-1 với auth.users
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists phone text;
-- Số điện thoại dùng để đăng nhập nên không được trùng
create unique index if not exists profiles_phone_key on public.profiles (phone) where phone is not null;

-- Tự động tạo profile khi có user mới
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    -- Tài khoản chỉ có SĐT dùng email nội bộ @sdt.hv.invalid: không lưu vào profile
    case when new.email like '%@sdt.hv.invalid' then null else new.email end,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Bảng khóa học
-- ------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image text,
  price int not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.courses add column if not exists price int not null default 0;
alter table public.courses add column if not exists status text not null default 'published'
  check (status in ('draft', 'published'));

-- ------------------------------------------------------------
-- Bảng bài học
-- ------------------------------------------------------------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists lessons_course_id_idx on public.lessons (course_id, sort_order);

-- ------------------------------------------------------------
-- Dọn policy của phiên bản cũ (nếu có)
-- ------------------------------------------------------------
drop policy if exists "User xem được profile của chính mình, admin xem tất cả" on public.profiles;
drop policy if exists "Admin cập nhật được mọi profile" on public.profiles;
drop policy if exists "User đã duyệt hoặc admin xem được khóa học" on public.courses;
drop policy if exists "Ai cũng xem được danh sách khóa học" on public.courses;
drop policy if exists "Chỉ admin thêm khóa học" on public.courses;
drop policy if exists "Chỉ admin sửa khóa học" on public.courses;
drop policy if exists "User đã duyệt hoặc admin xem được bài học" on public.lessons;
drop policy if exists "Chỉ admin thêm bài học" on public.lessons;
drop policy if exists "Chỉ admin sửa bài học" on public.lessons;
drop policy if exists "Ai cũng tải lên được ảnh chuyển khoản" on storage.objects;

-- Phiên bản cũ duyệt theo tài khoản; nay duyệt theo từng khóa học (bảng registrations)
alter table public.profiles drop column if exists status;

-- ------------------------------------------------------------
-- Bảng đơn đăng ký khóa học (kèm ảnh chuyển khoản)
-- Đơn được tạo từ server bằng service role key, client không insert trực tiếp.
-- ------------------------------------------------------------
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  payment_proof_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
-- Email không bắt buộc khi đăng ký (khách có thể chỉ dùng số điện thoại)
alter table public.registrations alter column email drop not null;
create index if not exists registrations_user_idx on public.registrations (user_id, course_id, status);

-- ------------------------------------------------------------
-- Mã đặt lại mật khẩu (gửi qua email). Chỉ server (service role) đọc/ghi.
-- ------------------------------------------------------------
create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_user_idx on public.password_resets (user_id, created_at desc);
alter table public.password_resets enable row level security;
create index if not exists registrations_status_idx on public.registrations (status, created_at);

-- ------------------------------------------------------------
-- Hàm phân quyền dùng trong RLS
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- User được xem bài học của khóa khi có đơn đăng ký đã duyệt (admin xem tất cả)
create or replace function public.has_course_access(target_course uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.registrations
    where user_id = auth.uid() and course_id = target_course and status = 'approved'
  );
$$;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.registrations enable row level security;

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update
  using (public.is_admin());

-- courses: ai cũng xem được khóa đang hiển thị; admin toàn quyền
drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses for select
  using (status = 'published' or public.is_admin());
drop policy if exists "courses_admin_insert" on public.courses;
create policy "courses_admin_insert" on public.courses for insert
  with check (public.is_admin());
drop policy if exists "courses_admin_update" on public.courses;
create policy "courses_admin_update" on public.courses for update
  using (public.is_admin());
drop policy if exists "courses_admin_delete" on public.courses;
create policy "courses_admin_delete" on public.courses for delete
  using (public.is_admin());

-- lessons: chỉ học viên đã được duyệt khóa đó (hoặc admin)
drop policy if exists "lessons_select" on public.lessons;
create policy "lessons_select" on public.lessons for select
  using (public.has_course_access(course_id));
drop policy if exists "lessons_admin_insert" on public.lessons;
create policy "lessons_admin_insert" on public.lessons for insert
  with check (public.is_admin());
drop policy if exists "lessons_admin_update" on public.lessons;
create policy "lessons_admin_update" on public.lessons for update
  using (public.is_admin());
drop policy if exists "lessons_admin_delete" on public.lessons;
create policy "lessons_admin_delete" on public.lessons for delete
  using (public.is_admin());

-- registrations: user xem đơn của mình, admin xem & duyệt tất cả
drop policy if exists "Ai cũng gửi được đơn đăng ký" on public.registrations;
drop policy if exists "Admin xem đơn đăng ký" on public.registrations;
drop policy if exists "Admin cập nhật đơn đăng ký" on public.registrations;
drop policy if exists "registrations_select" on public.registrations;
create policy "registrations_select" on public.registrations for select
  using (auth.uid() = user_id or public.is_admin());
drop policy if exists "registrations_admin_update" on public.registrations;
create policy "registrations_admin_update" on public.registrations for update
  using (public.is_admin());

-- ------------------------------------------------------------
-- Storage: bucket riêng tư chứa ảnh chuyển khoản (tối đa 5MB, chỉ ảnh)
-- Upload từ server bằng service role; chỉ admin được xem.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

drop policy if exists "Admin xem ảnh chuyển khoản" on storage.objects;
drop policy if exists "payment_proofs_admin_select" on storage.objects;
create policy "payment_proofs_admin_select" on storage.objects for select
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- Làm mới cache schema của API
notify pgrst, 'reload schema';
