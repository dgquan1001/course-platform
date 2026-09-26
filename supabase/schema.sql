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
-- Học phí không được âm
alter table public.courses drop constraint if exists courses_price_nonnegative;
alter table public.courses add constraint courses_price_nonnegative check (price >= 0);

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
  user_id uuid references auth.users (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  course_title text,
  amount int,
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

-- Xóa khóa học vẫn giữ đơn đăng ký (lịch sử thanh toán): đơn lưu lại tên khóa và học phí
-- tại thời điểm đăng ký, course_id chuyển về null khi khóa bị xóa.
alter table public.registrations add column if not exists course_title text;
alter table public.registrations add column if not exists amount int;
update public.registrations r
  set course_title = coalesce(r.course_title, c.title), amount = coalesce(r.amount, c.price)
  from public.courses c
  where c.id = r.course_id and (r.course_title is null or r.amount is null);
alter table public.registrations alter column course_id drop not null;
alter table public.registrations drop constraint if exists registrations_course_id_fkey;
alter table public.registrations add constraint registrations_course_id_fkey
  foreign key (course_id) references public.courses (id) on delete set null;

-- Xóa tài khoản cũng giữ đơn đăng ký (đơn đã lưu họ tên, SĐT, email lúc đăng ký), user_id chuyển về null
alter table public.registrations alter column user_id drop not null;
alter table public.registrations drop constraint if exists registrations_user_id_fkey;
alter table public.registrations add constraint registrations_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

-- Mỗi học viên chỉ có 1 đơn đang chờ duyệt hoặc đã duyệt cho mỗi khóa (chặn gửi 2 đơn cùng lúc).
-- Nếu dữ liệu cũ đang có đơn trùng thì bỏ qua và cảnh báo: xử lý đơn trùng rồi chạy lại file này.
do $$
begin
  if exists (
    select 1 from public.registrations
    where status in ('pending', 'approved') and user_id is not null and course_id is not null
    group by user_id, course_id having count(*) > 1
  ) then
    raise warning 'Có đơn trùng (cùng học viên, cùng khóa, đang chờ/đã duyệt): chưa tạo được registrations_active_key';
  else
    create unique index if not exists registrations_active_key
      on public.registrations (user_id, course_id) where status in ('pending', 'approved');
  end if;
end $$;

-- Người xử lý đơn (duyệt / từ chối / thu hồi). Lưu kèm tên để vẫn biết ai xử lý khi tài khoản admin bị xóa.
alter table public.registrations add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;
alter table public.registrations add column if not exists reviewed_by_name text;

-- Lý do từ chối / thu hồi (học viên thấy ở "Đơn chưa được xác nhận")
alter table public.registrations add column if not exists review_note text;

-- Lịch sử xử lý đơn: mỗi lần đổi trạng thái ghi 1 dòng. Chỉ trigger ghi; admin chỉ đọc, không ai sửa/xóa qua API.
create table if not exists public.registration_events (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  actor uuid references public.profiles (id) on delete set null,
  actor_name text,
  from_status text not null,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists registration_events_registration_idx
  on public.registration_events (registration_id, created_at);

-- Thời điểm, người xử lý và lý do do database tự ghi theo phiên đăng nhập (admin không tự khai được);
-- chuyển đơn về "Chờ duyệt" thì xóa thông tin xử lý. Mỗi lần đổi trạng thái được lưu vào lịch sử.
create or replace function public.stamp_registration_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text := (
    select coalesce(nullif(full_name, ''), email, phone) from public.profiles where id = auth.uid()
  );
begin
  if new.status is distinct from old.status then
    new.review_note := nullif(btrim(new.review_note), '');
    if new.status = 'pending' then
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.reviewed_by_name := null;
      new.review_note := null;
    else
      new.reviewed_at := now();
      new.reviewed_by := auth.uid();
      new.reviewed_by_name := actor_name;
    end if;
    insert into public.registration_events (registration_id, actor, actor_name, from_status, to_status, note)
    values (new.id, auth.uid(), actor_name, old.status, new.status, new.review_note);
  else
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by_name := old.reviewed_by_name;
    new.review_note := old.review_note;
    -- Chỉ cho về null: khóa ngoại tự đặt null khi tài khoản admin bị xóa
    if new.reviewed_by is not null then
      new.reviewed_by := old.reviewed_by;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_stamp_review on public.registrations;
create trigger registrations_stamp_review
  before update on public.registrations
  for each row execute procedure public.stamp_registration_review();

-- ------------------------------------------------------------
-- Phân quyền admin: admin cấp/gỡ quyền cho nhau trên giao diện.
-- Không tự gỡ quyền của mình, luôn còn ít nhất 1 admin; mỗi lần đổi quyền được ghi lại.
-- ------------------------------------------------------------
create table if not exists public.role_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  user_name text,
  actor uuid references public.profiles (id) on delete set null,
  actor_name text,
  from_role text not null,
  to_role text not null,
  created_at timestamptz not null default now()
);
create index if not exists role_events_user_idx on public.role_events (user_id, created_at desc);

create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is not distinct from old.role then
    return new;
  end if;
  if old.role = 'admin' then
    if new.id = auth.uid() then
      raise exception 'Bạn không thể tự gỡ quyền admin của chính mình.';
    end if;
    -- Xếp hàng các lần gỡ quyền: 2 admin gỡ quyền của nhau cùng lúc thì lần sau thấy kết quả lần trước
    perform pg_advisory_xact_lock(hashtext('profiles_admin_role'));
    if not exists (select 1 from public.profiles where role = 'admin' and id <> new.id) then
      raise exception 'Phải còn ít nhất 1 tài khoản admin.';
    end if;
  end if;
  insert into public.role_events (user_id, user_name, actor, actor_name, from_role, to_role)
  values (
    new.id,
    coalesce(nullif(new.full_name, ''), new.email, new.phone),
    auth.uid(),
    (select coalesce(nullif(full_name, ''), email, phone) from public.profiles where id = auth.uid()),
    old.role,
    new.role
  );
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update of role on public.profiles
  for each row execute procedure public.guard_role_change();

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
-- Đăng nhập / quên mật khẩu bằng email tra theo profiles.email
create index if not exists profiles_email_idx on public.profiles (email);

-- ------------------------------------------------------------
-- Giới hạn tần suất (chống spam đăng ký, dò mật khẩu). Chỉ server (service role) gọi.
-- Cửa sổ cố định: mỗi khóa (VD "register:<IP>") đếm số lần trong p_window_seconds giây.
-- ------------------------------------------------------------
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);
alter table public.rate_limits enable row level security;

-- p_increment = true: ghi nhận 1 lần, trả về true nếu vẫn trong giới hạn (hits <= p_limit).
-- p_increment = false: chỉ kiểm tra còn được thử thêm không (hits < p_limit).
create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int, p_increment boolean default true)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  window_begin timestamptz := now() - make_interval(secs => p_window_seconds);
  current_hits int;
begin
  if not p_increment then
    select hits into current_hits from public.rate_limits where key = p_key and window_start >= window_begin;
    return coalesce(current_hits, 0) < p_limit;
  end if;
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < window_begin then 1 else r.hits + 1 end,
    window_start = case when r.window_start < window_begin then now() else r.window_start end
  returning hits into current_hits;
  -- Thỉnh thoảng dọn các khóa đã hết hạn lâu
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return current_hits <= p_limit;
end;
$$;
revoke execute on function public.hit_rate_limit(text, int, int, boolean) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int, boolean) to service_role;

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

-- courses: ai cũng xem được khóa đang hiển thị; khóa đang ẩn (ngừng nhận đăng ký) vẫn hiện
-- với học viên đã được duyệt khóa đó; admin toàn quyền (has_course_access đã gồm is_admin)
drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses for select
  using (status = 'published' or public.has_course_access(id));
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

-- Lịch sử xử lý đơn & phân quyền: admin chỉ đọc; chỉ trigger ghi (không có policy insert/update/delete)
alter table public.registration_events enable row level security;
drop policy if exists "registration_events_admin_select" on public.registration_events;
create policy "registration_events_admin_select" on public.registration_events for select
  using (public.is_admin());
alter table public.role_events enable row level security;
drop policy if exists "role_events_admin_select" on public.role_events;
create policy "role_events_admin_select" on public.role_events for select
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
