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
  role text not null default 'user',
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists phone text;
-- Vai trò: user (bệnh nhân / học viên), staff (nhân viên), admin (quyền cao nhất)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'staff', 'admin'));
-- Số điện thoại dùng để đăng nhập nên không được trùng
create unique index if not exists profiles_phone_key on public.profiles (phone) where phone is not null;
-- Đồng ý Chính sách bảo mật (thời điểm + phiên bản chính sách). Tài khoản cũ chưa đồng ý được hỏi khi đăng nhập.
alter table public.profiles add column if not exists consent_at timestamptz;
alter table public.profiles add column if not exists consent_version text;

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

-- Loại khóa (v0.2): free = miễn phí, ai cũng xem · program = chương trình trả phí (khóa cũ mặc định là loại này)
-- · premium = 1:4, 1:2, 1:1, chỉ có thông tin + liên hệ Zalo, không có bài học, không nhận đơn.
-- Nhóm bệnh: vẹo lưng / vẹo ngực. Đối tượng: bệnh nhân (đội chuyên gia để giai đoạn sau).
alter table public.courses add column if not exists kind text not null default 'program';
alter table public.courses drop constraint if exists courses_kind_check;
alter table public.courses add constraint courses_kind_check check (kind in ('free', 'program', 'premium'));
alter table public.courses add column if not exists category text;
alter table public.courses drop constraint if exists courses_category_check;
alter table public.courses add constraint courses_category_check check (category in ('veo_lung', 'veo_nguc'));
alter table public.courses add column if not exists audience text not null default 'patient';
alter table public.courses drop constraint if exists courses_audience_check;
alter table public.courses add constraint courses_audience_check check (audience in ('patient', 'expert'));
-- Mô tả ngắn trên thẻ khóa và danh sách "Bạn sẽ đạt được" ở trang giới thiệu khóa
alter table public.courses add column if not exists summary text;
alter table public.courses add column if not exists outcomes text[] not null default '{}';

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
-- Buổi tập (v0.2, ADR-013): khóa gồm các buổi, mỗi buổi gồm các bài tập (bảng lessons, cột session_id).
-- Admin tạo khung nhanh "N buổi × M bài"; bài tập chưa có video vẫn tick được.
-- ------------------------------------------------------------
create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists course_sessions_course_idx on public.course_sessions (course_id, sort_order);

alter table public.lessons add column if not exists session_id uuid references public.course_sessions (id) on delete cascade;
create index if not exists lessons_session_idx on public.lessons (session_id, sort_order);
-- Bài tập chưa có video (khung mới tạo): trang học hiện "Video đang được cập nhật"
alter table public.lessons alter column video_url drop not null;

-- Bài học cũ chưa thuộc buổi nào: gom vào "Buổi 1" của khóa đó
do $$
declare
  c record;
  new_session uuid;
begin
  for c in select distinct course_id from public.lessons where session_id is null loop
    select id into new_session from public.course_sessions where course_id = c.course_id order by sort_order, created_at limit 1;
    if new_session is null then
      insert into public.course_sessions (course_id, title, sort_order) values (c.course_id, 'Buổi 1', 1) returning id into new_session;
    end if;
    update public.lessons set session_id = new_session where course_id = c.course_id and session_id is null;
  end loop;
end $$;

-- Tiến độ: bệnh nhân tick từng bài đã tập (checklist buổi = danh sách bài của buổi). course_id điền tự động để đếm nhanh.
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index if not exists lesson_progress_course_idx on public.lesson_progress (user_id, course_id);

create or replace function public.fill_lesson_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.course_id := (select course_id from public.lessons where id = new.lesson_id);
  new.completed_at := now();
  return new;
end;
$$;

drop trigger if exists lesson_progress_fill on public.lesson_progress;
create trigger lesson_progress_fill
  before insert on public.lesson_progress
  for each row execute procedure public.fill_lesson_progress();

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

-- Mỗi học viên chỉ có 1 đơn đang CHỜ DUYỆT cho mỗi khóa (chặn gửi 2 đơn cùng lúc). Từ v0.2 được có nhiều đơn
-- đã duyệt cho cùng khóa (gia hạn gói, ADR-012) nên bỏ index cũ registrations_active_key (chờ duyệt + đã duyệt).
drop index if exists public.registrations_active_key;
do $$
begin
  if exists (
    select 1 from public.registrations
    where status = 'pending' and user_id is not null and course_id is not null
    group by user_id, course_id having count(*) > 1
  ) then
    raise warning 'Có đơn trùng (cùng học viên, cùng khóa, đang chờ duyệt): chưa tạo được registrations_pending_key';
  else
    create unique index if not exists registrations_pending_key
      on public.registrations (user_id, course_id) where status = 'pending';
  end if;
end $$;

-- Người xử lý đơn (duyệt / từ chối / thu hồi). Lưu kèm tên để vẫn biết ai xử lý khi tài khoản admin bị xóa.
alter table public.registrations add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;
alter table public.registrations add column if not exists reviewed_by_name text;

-- Lý do từ chối / thu hồi (học viên thấy ở "Đơn chưa được xác nhận")
alter table public.registrations add column if not exists review_note text;

-- ------------------------------------------------------------
-- Gói theo thời hạn của chương trình (v0.2, ADR-012): 1 / 3 / 6 / 12 tháng, giá riêng từng chương trình,
-- số buổi được mở (mặc định 12 × số tháng). Chỉ admin sửa; ai cũng xem gói đang bán.
-- ------------------------------------------------------------
create table if not exists public.course_plans (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  months int not null check (months in (1, 3, 6, 12)),
  sessions int not null check (sessions between 1 and 500),
  price int not null check (price between 0 and 1000000000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (course_id, months)
);

-- Chương trình cũ có học phí nhưng chưa có gói: tạo gói 1 tháng (12 buổi) theo học phí cũ
insert into public.course_plans (course_id, months, sessions, price)
select c.id, 1, 12, c.price
from public.courses c
where c.kind = 'program' and c.price > 0
  and not exists (select 1 from public.course_plans p where p.course_id = c.id)
on conflict (course_id, months) do nothing;

-- Đơn đăng ký lưu ảnh chụp gói lúc đăng ký, nguồn đơn, hình thức thanh toán và hạn học.
-- Đơn cũ (v0.1) không có gói: hạn học null = không thời hạn, mở mọi buổi.
alter table public.registrations add column if not exists plan_id uuid references public.course_plans (id) on delete set null;
alter table public.registrations add column if not exists plan_months int;
alter table public.registrations add column if not exists plan_sessions int;
-- web: khách tự đăng ký (bắt buộc ảnh chuyển khoản) · staff: nhân viên cấp gói (ảnh không bắt buộc – Đợt 11)
alter table public.registrations add column if not exists source text not null default 'web';
alter table public.registrations drop constraint if exists registrations_source_check;
alter table public.registrations add constraint registrations_source_check check (source in ('web', 'staff'));
alter table public.registrations add column if not exists payment_method text not null default 'bank_transfer';
alter table public.registrations drop constraint if exists registrations_payment_method_check;
alter table public.registrations add constraint registrations_payment_method_check
  check (payment_method in ('bank_transfer', 'cash', 'other'));
alter table public.registrations add column if not exists payment_note text;
alter table public.registrations add column if not exists created_by uuid references public.profiles (id) on delete set null;
alter table public.registrations add column if not exists access_starts_at timestamptz;
alter table public.registrations add column if not exists access_until timestamptz;
alter table public.registrations alter column payment_proof_path drop not null;
alter table public.registrations drop constraint if exists registrations_proof_check;
alter table public.registrations add constraint registrations_proof_check
  check (source = 'staff' or payment_proof_path is not null);
create index if not exists registrations_access_idx on public.registrations (user_id, course_id, status, access_until);

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
  current_until timestamptz;
begin
  -- Người dùng đăng nhập (nhân viên, admin) chỉ đổi trạng thái và lý do: gói, học phí, nguồn, thanh toán, hạn học
  -- giữ nguyên. Service role (server, script) được sửa trực tiếp.
  if auth.uid() is not null then
    -- plan_id / created_by chỉ được về null: khóa ngoại tự đặt null khi xóa gói (xóa khóa học) / xóa tài khoản nhân viên
    if new.plan_id is not null then
      new.plan_id := old.plan_id;
    end if;
    if new.created_by is not null then
      new.created_by := old.created_by;
    end if;
    new.plan_months := old.plan_months;
    new.plan_sessions := old.plan_sessions;
    new.amount := old.amount;
    new.source := old.source;
    new.payment_method := old.payment_method;
    new.payment_note := old.payment_note;
    new.access_starts_at := old.access_starts_at;
    new.access_until := old.access_until;
  end if;

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

    -- Hạn học (ADR-012): duyệt → tính từ max(bây giờ, hạn cuối hiện tại của học viên cho khóa này) + số tháng của gói
    -- (gia hạn khi còn hạn thì cộng dồn). Đơn không có gói (v0.1) = không thời hạn. Rời trạng thái duyệt → xóa hạn.
    if new.status = 'approved' then
      if new.plan_months is null or new.user_id is null or new.course_id is null then
        new.access_starts_at := null;
        new.access_until := null;
      else
        -- Xếp hàng các lần duyệt của cùng học viên + khóa để không cộng dồn sai khi duyệt đồng thời
        perform pg_advisory_xact_lock(hashtext('registration_access:' || new.user_id || ':' || new.course_id));
        select max(access_until) into current_until
        from public.registrations
        where user_id = new.user_id and course_id = new.course_id and status = 'approved' and id <> new.id;
        new.access_starts_at := greatest(now(), coalesce(current_until, now()));
        new.access_until := new.access_starts_at + make_interval(months => new.plan_months);
      end if;
    elsif old.status = 'approved' then
      new.access_starts_at := null;
      new.access_until := null;
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
-- Phân quyền: chỉ admin đổi vai trò (user / staff / admin) của tài khoản khác trên giao diện.
-- Không tự gỡ quyền của mình, luôn còn ít nhất 1 admin; mỗi lần đổi quyền được ghi lại.
-- Script / service role (không có phiên đăng nhập) vẫn đổi được, VD npm run create-admin.
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
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Chỉ admin được thay đổi vai trò tài khoản.';
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
-- Khách quan tâm khóa premium: bấm "Liên hệ Zalo nhận ưu đãi" (để lại họ tên, SĐT) hoặc "Mở Zalo ngay"
-- (lượt bấm ẩn danh: phone = null, chỉ để thống kê). Chỉ server (service role) ghi; nhân viên, admin xử lý.
-- ------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete set null,
  course_title text,
  user_id uuid references auth.users (id) on delete set null,
  full_name text,
  phone text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  staff_note text,
  handled_by uuid references public.profiles (id) on delete set null,
  handled_by_name text,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists leads_status_idx on public.leads (status, created_at);

-- Người xử lý và thời điểm do database ghi theo phiên đăng nhập khi đổi trạng thái / ghi chú
create or replace function public.stamp_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nhân viên chỉ đổi trạng thái và ghi chú; thông tin khách để lại giữ nguyên
  new.course_id := old.course_id;
  new.course_title := old.course_title;
  new.user_id := old.user_id;
  new.full_name := old.full_name;
  new.phone := old.phone;
  new.created_at := old.created_at;
  if new.status is distinct from old.status or new.staff_note is distinct from old.staff_note then
    new.handled_by := auth.uid();
    new.handled_by_name := (select coalesce(nullif(full_name, ''), email, phone) from public.profiles where id = auth.uid());
    new.handled_at := now();
  else
    new.handled_at := old.handled_at;
    new.handled_by_name := old.handled_by_name;
    if new.handled_by is not null then
      new.handled_by := old.handled_by;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists leads_stamp on public.leads;
create trigger leads_stamp
  before update on public.leads
  for each row execute procedure public.stamp_lead();

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

-- Nhân viên hoặc admin: duyệt đơn, quản lý bệnh nhân, xem trước nội dung khóa học
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

-- User được xem bài học của khóa khi có đơn đăng ký đã duyệt CÒN HẠN (nhân viên, admin xem tất cả).
-- Đơn cũ không có gói (access_until null) = không thời hạn. Hết hạn: mất quyền xem bài, vẫn thấy đơn / tiến độ.
create or replace function public.has_course_access(target_course uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_staff() or exists (
    select 1 from public.registrations
    where user_id = auth.uid() and course_id = target_course and status = 'approved'
      and (access_until is null or access_until > now())
  );
$$;

-- Số buổi đã mua của người đang đăng nhập cho một chương trình: tổng số buổi các gói đã duyệt (kể cả đã hết hạn,
-- để gia hạn thì học tiếp). null = không giới hạn (có đơn cũ không có gói). Dùng cho mở buổi tuần tự (Đợt 10).
create or replace function public.purchased_sessions(target_course uuid)
returns int
language sql
security definer
stable
set search_path = public
as $$
  select case
    when bool_or(plan_sessions is null) then null
    else sum(plan_sessions)::int
  end
  from public.registrations
  where user_id = auth.uid() and course_id = target_course and status = 'approved';
$$;

-- Khóa miễn phí đang hiển thị: ai cũng xem được bài học, không cần đăng nhập
create or replace function public.is_free_course(target_course uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.courses
    where id = target_course and kind = 'free' and status = 'published'
  );
$$;

-- Đề cương công khai (trang giới thiệu khóa, cột nội dung ở trình học): buổi → bài theo thứ tự – KHÔNG trả link video.
-- Chỉ với khóa đang hiển thị (hoặc người đã có quyền xem khóa), không áp dụng khóa premium.
-- session_position: số thứ tự buổi (1, 2, …); has_video: bài đã có video hay chưa.
drop function if exists public.course_outline(uuid);
create or replace function public.course_outline(target_course uuid)
returns table (
  id uuid, title text, description text, sort_order int,
  session_id uuid, session_title text, session_position int, has_video boolean
)
language sql
security definer
stable
set search_path = public
as $$
  with s as (
    select cs.id, cs.title, row_number() over (order by cs.sort_order, cs.created_at)::int as pos
    from public.course_sessions cs
    where cs.course_id = target_course
  )
  select l.id, l.title, l.description, l.sort_order, s.id, s.title, s.pos, l.video_url is not null
  from public.lessons l
  join public.courses c on c.id = l.course_id
  left join s on s.id = l.session_id
  where l.course_id = target_course
    and c.kind <> 'premium'
    and (c.status = 'published' or public.has_course_access(c.id))
  -- Bài chưa thuộc buổi nào (hiếm: dữ liệu nhập tay) xếp cuối
  order by s.pos nulls last, l.sort_order, l.created_at;
$$;
grant execute on function public.course_outline(uuid) to anon, authenticated;

-- Người đang đăng nhập đã tick đủ mọi bài của buổi chưa (buổi không có bài coi như đã xong)
create or replace function public.session_completed(target_session uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from public.lessons l
    where l.session_id = target_session
      and not exists (select 1 from public.lesson_progress p where p.user_id = auth.uid() and p.lesson_id = l.id)
  );
$$;

-- Người đang đăng nhập có xem được bài này không (ADR-013, BR-89):
-- nhân viên / admin: luôn được · khóa miễn phí đang hiển thị: ai cũng được, không khóa tuần tự ·
-- chương trình: còn hạn học + buổi nằm trong số buổi đã mua + buổi trước đã tick đủ (buổi 1 luôn mở).
create or replace function public.can_view_lesson(target_lesson uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  lesson_course uuid;
  lesson_session uuid;
  course_kind text;
  course_status text;
  pos int;
  previous_session uuid;
  purchased int;
begin
  -- Nhân viên / admin xét trước: khi admin thêm bài, RLS kiểm tra dòng vừa thêm mà truy vấn bên dưới chưa thấy dòng đó
  if public.is_staff() then
    return true;
  end if;
  select l.course_id, l.session_id, c.kind, c.status into lesson_course, lesson_session, course_kind, course_status
  from public.lessons l join public.courses c on c.id = l.course_id
  where l.id = target_lesson;
  if lesson_course is null then
    return false;
  end if;
  if course_kind = 'free' then
    return course_status = 'published';
  end if;
  if course_kind <> 'program' or not public.has_course_access(lesson_course) then
    return false;
  end if;
  if lesson_session is null then
    return true;
  end if;
  select s.pos, s.previous into pos, previous_session
  from (
    select cs.id,
           row_number() over (order by cs.sort_order, cs.created_at)::int as pos,
           lag(cs.id) over (order by cs.sort_order, cs.created_at) as previous
    from public.course_sessions cs
    where cs.course_id = lesson_course
  ) s
  where s.id = lesson_session;
  purchased := public.purchased_sessions(lesson_course);
  if purchased is not null and pos > purchased then
    return false;
  end if;
  return previous_session is null or public.session_completed(previous_session);
end;
$$;
grant execute on function public.can_view_lesson(uuid) to anon, authenticated;

-- Tiến độ của người đang đăng nhập trong một khóa: số bài đã tick / tổng số bài trong các buổi đã mua
-- (khóa miễn phí / đơn cũ không gói: toàn khóa), bài tiếp theo cần tập, lần tập gần nhất.
create or replace function public.course_progress(target_course uuid)
returns table (done int, total int, next_lesson_id uuid, purchased int, last_activity timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  with purchased as (
    select case
      when (select kind from public.courses where id = target_course) = 'free' then null
      else public.purchased_sessions(target_course)
    end as value
  ),
  s as (
    select cs.id, row_number() over (order by cs.sort_order, cs.created_at)::int as pos
    from public.course_sessions cs
    where cs.course_id = target_course
  ),
  included as (
    select l.id, coalesce(s.pos, 1000000) as pos, l.sort_order, l.created_at,
           exists (select 1 from public.lesson_progress p where p.user_id = auth.uid() and p.lesson_id = l.id) as is_done
    from public.lessons l
    left join s on s.id = l.session_id
    where l.course_id = target_course
      and ((select value from purchased) is null or s.pos is null or s.pos <= (select value from purchased))
  )
  select
    (select count(*) from included where is_done)::int,
    (select count(*) from included)::int,
    (select id from included where not is_done order by pos, sort_order, created_at limit 1),
    (select value from purchased),
    (select max(completed_at) from public.lesson_progress where user_id = auth.uid() and course_id = target_course);
$$;
grant execute on function public.course_progress(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.registrations enable row level security;

-- profiles: nhân viên xem mọi tài khoản nhưng chỉ sửa tài khoản bệnh nhân (role = user);
-- đổi vai trò do trigger guard_role_change kiểm tra (chỉ admin)
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_staff());
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update
  using (public.is_admin());
drop policy if exists "profiles_staff_update" on public.profiles;
create policy "profiles_staff_update" on public.profiles for update
  using (public.is_staff() and role = 'user')
  with check (role = 'user');

-- courses: ai cũng xem được khóa đang hiển thị; khóa đang ẩn (ngừng nhận đăng ký) vẫn hiện
-- với học viên đã được duyệt khóa đó; nhân viên xem tất cả, chỉ admin sửa (has_course_access đã gồm is_staff)
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

-- course_plans: ai cũng xem gói đang bán (trang giới thiệu, box đăng ký); chỉ admin thêm / sửa / xóa và xem gói đã tắt
alter table public.course_plans enable row level security;
drop policy if exists "course_plans_select" on public.course_plans;
create policy "course_plans_select" on public.course_plans for select
  using (active or public.is_admin());
drop policy if exists "course_plans_admin_insert" on public.course_plans;
create policy "course_plans_admin_insert" on public.course_plans for insert
  with check (public.is_admin());
drop policy if exists "course_plans_admin_update" on public.course_plans;
create policy "course_plans_admin_update" on public.course_plans for update
  using (public.is_admin());
drop policy if exists "course_plans_admin_delete" on public.course_plans;
create policy "course_plans_admin_delete" on public.course_plans for delete
  using (public.is_admin());

-- lessons (kèm link video): theo can_view_lesson – khóa miễn phí đang hiển thị ai cũng xem; chương trình theo hạn học,
-- số buổi đã mua và mở buổi lần lượt; nhân viên, admin xem trước. Tên bài của buổi bị khóa lấy qua course_outline().
drop policy if exists "lessons_select" on public.lessons;
create policy "lessons_select" on public.lessons for select
  using (public.is_staff() or public.can_view_lesson(id));

-- course_sessions: đọc được khi đọc được khóa (đề cương công khai); chỉ admin thêm / sửa / xóa
alter table public.course_sessions enable row level security;
drop policy if exists "course_sessions_select" on public.course_sessions;
create policy "course_sessions_select" on public.course_sessions for select
  using (exists (select 1 from public.courses c where c.id = course_id));
drop policy if exists "course_sessions_admin_insert" on public.course_sessions;
create policy "course_sessions_admin_insert" on public.course_sessions for insert
  with check (public.is_admin());
drop policy if exists "course_sessions_admin_update" on public.course_sessions;
create policy "course_sessions_admin_update" on public.course_sessions for update
  using (public.is_admin());
drop policy if exists "course_sessions_admin_delete" on public.course_sessions;
create policy "course_sessions_admin_delete" on public.course_sessions for delete
  using (public.is_admin());

-- lesson_progress: bệnh nhân đọc tiến độ của mình (kể cả khi hết hạn), nhân viên / admin đọc tất cả;
-- chỉ tick / bỏ tick bài đang xem được (không tick trước buổi bị khóa, không tick khi đã hết hạn)
alter table public.lesson_progress enable row level security;
drop policy if exists "lesson_progress_select" on public.lesson_progress;
create policy "lesson_progress_select" on public.lesson_progress for select
  using (auth.uid() = user_id or public.is_staff());
drop policy if exists "lesson_progress_insert" on public.lesson_progress;
create policy "lesson_progress_insert" on public.lesson_progress for insert
  with check (auth.uid() = user_id and public.can_view_lesson(lesson_id));
drop policy if exists "lesson_progress_delete" on public.lesson_progress;
create policy "lesson_progress_delete" on public.lesson_progress for delete
  using (auth.uid() = user_id and public.can_view_lesson(lesson_id));
drop policy if exists "lessons_admin_insert" on public.lessons;
create policy "lessons_admin_insert" on public.lessons for insert
  with check (public.is_admin());
drop policy if exists "lessons_admin_update" on public.lessons;
create policy "lessons_admin_update" on public.lessons for update
  using (public.is_admin());
drop policy if exists "lessons_admin_delete" on public.lessons;
create policy "lessons_admin_delete" on public.lessons for delete
  using (public.is_admin());

-- registrations: user xem đơn của mình, nhân viên và admin xem & duyệt tất cả
drop policy if exists "Ai cũng gửi được đơn đăng ký" on public.registrations;
drop policy if exists "Admin xem đơn đăng ký" on public.registrations;
drop policy if exists "Admin cập nhật đơn đăng ký" on public.registrations;
drop policy if exists "registrations_select" on public.registrations;
create policy "registrations_select" on public.registrations for select
  using (auth.uid() = user_id or public.is_staff());
drop policy if exists "registrations_admin_update" on public.registrations;
drop policy if exists "registrations_staff_update" on public.registrations;
create policy "registrations_staff_update" on public.registrations for update
  using (public.is_staff());

-- Lịch sử xử lý đơn (nhân viên, admin đọc) & phân quyền (admin đọc): chỉ trigger ghi
-- (không có policy insert/update/delete)
alter table public.registration_events enable row level security;
drop policy if exists "registration_events_admin_select" on public.registration_events;
drop policy if exists "registration_events_staff_select" on public.registration_events;
create policy "registration_events_staff_select" on public.registration_events for select
  using (public.is_staff());
alter table public.role_events enable row level security;
drop policy if exists "role_events_admin_select" on public.role_events;
create policy "role_events_admin_select" on public.role_events for select
  using (public.is_admin());

-- Khách quan tâm premium: nhân viên, admin đọc & cập nhật trạng thái; chỉ server (service role) thêm
alter table public.leads enable row level security;
drop policy if exists "leads_staff_select" on public.leads;
create policy "leads_staff_select" on public.leads for select
  using (public.is_staff());
drop policy if exists "leads_staff_update" on public.leads;
create policy "leads_staff_update" on public.leads for update
  using (public.is_staff());

-- ------------------------------------------------------------
-- Storage: bucket riêng tư chứa ảnh chuyển khoản (tối đa 5MB, chỉ ảnh)
-- Upload từ server bằng service role; chỉ nhân viên và admin được xem.
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
drop policy if exists "payment_proofs_staff_select" on storage.objects;
create policy "payment_proofs_staff_select" on storage.objects for select
  using (bucket_id = 'payment-proofs' and public.is_staff());

-- ------------------------------------------------------------
-- Storage: bucket CÔNG KHAI chứa ảnh bìa khóa học (tối đa 2MB, JPG/PNG/WEBP). Chỉ admin tải lên / xóa.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-covers', 'course-covers', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Ảnh bìa là công khai (hiển thị trên trang chủ); Storage cần quyền đọc để trả kết quả sau khi tải lên
drop policy if exists "course_covers_select" on storage.objects;
create policy "course_covers_select" on storage.objects for select
  using (bucket_id = 'course-covers');
drop policy if exists "course_covers_admin_insert" on storage.objects;
create policy "course_covers_admin_insert" on storage.objects for insert
  with check (bucket_id = 'course-covers' and public.is_admin());
drop policy if exists "course_covers_admin_update" on storage.objects;
create policy "course_covers_admin_update" on storage.objects for update
  using (bucket_id = 'course-covers' and public.is_admin());
drop policy if exists "course_covers_admin_delete" on storage.objects;
create policy "course_covers_admin_delete" on storage.objects for delete
  using (bucket_id = 'course-covers' and public.is_admin());

-- Làm mới cache schema của API
notify pgrst, 'reload schema';
