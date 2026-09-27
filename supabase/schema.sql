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
-- Nguồn tài khoản (v0.2 Đợt 11, ADR-014): web = khách tự đăng ký · zalo = nhân viên tạo cho khách chốt qua Zalo.
-- must_change_password: mật khẩu do nhân viên cấp → nhắc (không bắt buộc) đổi sau khi đăng nhập.
alter table public.profiles add column if not exists source text not null default 'web';
alter table public.profiles drop constraint if exists profiles_source_check;
alter table public.profiles add constraint profiles_source_check check (source in ('web', 'zalo'));
alter table public.profiles add column if not exists created_by uuid references public.profiles (id) on delete set null;
alter table public.profiles add column if not exists must_change_password boolean not null default false;

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

-- Nhân viên cấp gói (v0.2 Đợt 11, ADR-014): đơn tạo thẳng "Đã duyệt" bằng phiên đăng nhập của nhân viên.
-- Database tự điền gói (theo plan_id của đúng chương trình), tên khóa, người tạo / người xử lý và hạn học
-- (cộng dồn như khi duyệt). Đơn khách tự đăng ký tạo bằng service role (không có phiên) giữ nguyên.
create or replace function public.stamp_registration_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_until timestamptz;
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.source is distinct from 'staff' or new.status is distinct from 'approved' then
    raise exception 'Nhân viên chỉ tạo được đơn cấp gói (nguồn nhân viên, đã duyệt).';
  end if;
  if new.user_id is null or new.course_id is null then
    raise exception 'Thiếu bệnh nhân hoặc chương trình.';
  end if;
  -- Chỉ cấp gói cho tài khoản bệnh nhân (không tự cấp cho tài khoản nhân viên / admin – làm sai doanh thu, RK-34)
  if not exists (select 1 from public.profiles where id = new.user_id and role = 'user') then
    raise exception 'Chỉ cấp gói cho tài khoản bệnh nhân.';
  end if;
  select p.months, p.sessions, c.title into new.plan_months, new.plan_sessions, new.course_title
  from public.course_plans p
  join public.courses c on c.id = p.course_id
  where p.id = new.plan_id and p.course_id = new.course_id and c.kind = 'program';
  if not found then
    raise exception 'Gói không thuộc chương trình đã chọn.';
  end if;
  if new.amount is null or new.amount < 0 or new.amount > 1000000000 then
    raise exception 'Số tiền phải từ 0 đến 1.000.000.000đ.';
  end if;
  new.created_by := auth.uid();
  new.reviewed_at := now();
  new.reviewed_by := auth.uid();
  new.reviewed_by_name := (select coalesce(nullif(full_name, ''), email, phone) from public.profiles where id = auth.uid());
  new.review_note := null;
  -- Hạn học như khi duyệt đơn (ADR-012): nối tiếp hạn cuối hiện tại của bệnh nhân cho chương trình này
  perform pg_advisory_xact_lock(hashtext('registration_access:' || new.user_id || ':' || new.course_id));
  select max(access_until) into current_until
  from public.registrations
  where user_id = new.user_id and course_id = new.course_id and status = 'approved';
  new.access_starts_at := greatest(now(), coalesce(current_until, now()));
  new.access_until := new.access_starts_at + make_interval(months => new.plan_months);
  return new;
end;
$$;

drop trigger if exists registrations_stamp_insert on public.registrations;
create trigger registrations_stamp_insert
  before insert on public.registrations
  for each row execute procedure public.stamp_registration_insert();

-- Lịch sử của đơn nhân viên cấp: "Tạo mới → Đã duyệt" (ghi sau khi đơn đã có trong bảng)
create or replace function public.log_registration_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source = 'staff' and new.status = 'approved' then
    insert into public.registration_events (registration_id, actor, actor_name, from_status, to_status, note)
    values (new.id, new.reviewed_by, new.reviewed_by_name, 'new', new.status, new.payment_note);
  end if;
  return null;
end;
$$;

drop trigger if exists registrations_log_insert on public.registrations;
create trigger registrations_log_insert
  after insert on public.registrations
  for each row execute procedure public.log_registration_insert();

-- ------------------------------------------------------------
-- Bệnh nhân do nhân viên quản lý (v0.2 Đợt 11, ADR-014)
-- account_events: nhật ký tạo tài khoản / cấp lại mật khẩu / sửa thông tin (chỉ server ghi, không lưu mật khẩu).
-- patient_notes: ghi chú nội bộ về bệnh nhân – tách khỏi profiles để bệnh nhân không đọc được.
-- ------------------------------------------------------------
create table if not exists public.account_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  user_name text,
  actor uuid references public.profiles (id) on delete set null,
  actor_name text,
  action text not null check (action in ('created', 'password_reset', 'profile_updated')),
  created_at timestamptz not null default now()
);
create index if not exists account_events_user_idx on public.account_events (user_id, created_at desc);

create table if not exists public.patient_notes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 1000),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_by_name text,
  updated_at timestamptz not null default now()
);

create or replace function public.stamp_patient_note()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Khóa ngoại đặt updated_by về null khi xóa tài khoản nhân viên (không có phiên): giữ nguyên ghi chú
  if tg_op = 'UPDATE' and auth.uid() is null then
    return new;
  end if;
  new.note := btrim(new.note);
  new.updated_by := auth.uid();
  new.updated_by_name := (select coalesce(nullif(full_name, ''), email, phone) from public.profiles where id = auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists patient_notes_stamp on public.patient_notes;
create trigger patient_notes_stamp
  before insert or update on public.patient_notes
  for each row execute procedure public.stamp_patient_note();

-- ------------------------------------------------------------
-- Phiếu tham vấn bác sĩ (v0.2 Đợt 12, ADR-015)
-- consult_questions: một mẫu phiếu chung do admin soạn (check = có/không, scale = thang 0–10, text = trả lời ngắn).
-- consultations: phiếu bệnh nhân gửi – lưu ảnh chụp câu hỏi + câu trả lời (sửa mẫu không làm sai phiếu cũ).
-- Chỉ server (service role) ghi phiếu; nhân viên, admin đổi trạng thái + ghi chú nội bộ; bệnh nhân đọc phiếu của mình
-- qua hàm my_consultations() (không thấy ghi chú nội bộ). Dữ liệu sức khỏe: không hiển thị công khai.
-- ------------------------------------------------------------
create table if not exists public.consult_questions (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(btrim(label)) between 1 and 300),
  kind text not null check (kind in ('check', 'scale', 'text')),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Câu hỏi mẫu (database-design §10.8): chỉ thêm khi mẫu phiếu còn trống, admin sửa được sau
do $$
begin
  if not exists (select 1 from public.consult_questions) then
    insert into public.consult_questions (label, kind, sort_order) values
      ('Mức đau lưng / lưng ngực hiện tại', 'scale', 1),
      ('Đau tăng lên khi tập hoặc sau khi tập', 'check', 2),
      ('Có tê bì tay chân', 'check', 3),
      ('Đã tập đều theo lịch (≥ 3 buổi/tuần)', 'check', 4),
      ('Động tác khó thực hiện hoặc chưa chắc tập đúng', 'text', 5),
      ('Thời gian thuận tiện để bác sĩ / nhân viên liên hệ', 'text', 6);
  end if;
end $$;

-- origin: manual = tự gửi · course_end = từ thẻ chúc mừng hoàn thành · expiring = gói sắp hết hạn
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  full_name text,
  phone text,
  course_id uuid references public.courses (id) on delete set null,
  course_title text,
  answers jsonb not null default '[]'::jsonb,
  note text check (char_length(note) <= 1000),
  origin text not null default 'manual' check (origin in ('manual', 'course_end', 'expiring')),
  status text not null default 'new' check (status in ('new', 'contacted', 'done', 'cancelled')),
  staff_note text check (char_length(staff_note) <= 1000),
  handled_by uuid references public.profiles (id) on delete set null,
  handled_by_name text,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists consultations_status_idx on public.consultations (status, created_at);
create index if not exists consultations_user_idx on public.consultations (user_id, created_at desc);

-- Nhân viên chỉ đổi trạng thái và ghi chú nội bộ; người xử lý và thời điểm do database ghi theo phiên đăng nhập
create or replace function public.stamp_consultation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- user_id / course_id chỉ được về null: khóa ngoại tự đặt null khi xóa tài khoản / khóa học
  if new.user_id is not null then
    new.user_id := old.user_id;
  end if;
  if new.course_id is not null then
    new.course_id := old.course_id;
  end if;
  new.full_name := old.full_name;
  new.phone := old.phone;
  new.course_title := old.course_title;
  new.answers := old.answers;
  new.note := old.note;
  new.origin := old.origin;
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

drop trigger if exists consultations_stamp on public.consultations;
create trigger consultations_stamp
  before update on public.consultations
  for each row execute procedure public.stamp_consultation();

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
  -- Nhân viên chỉ đổi trạng thái và ghi chú; thông tin khách để lại giữ nguyên.
  -- course_id / user_id chỉ được về null: khóa ngoại tự đặt null khi xóa khóa premium / tài khoản (RK-29)
  if new.course_id is not null then
    new.course_id := old.course_id;
  end if;
  if new.user_id is not null then
    new.user_id := old.user_id;
  end if;
  new.course_title := old.course_title;
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
-- Số liệu quản trị (v0.2 Đợt 11 – 13)
-- _patient_courses: mỗi cặp (bệnh nhân, chương trình) đã được duyệt: hạn học (infinity = không thời hạn), lần duyệt đầu,
-- số buổi đã mua, số bài đã tick / tổng số bài trong các buổi đã mua, lần tập gần nhất. Hàm nội bộ: không cấp quyền gọi
-- cho người dùng, chỉ dùng bên trong các hàm security definer bên dưới (đã kiểm tra nhân viên / admin).
-- ------------------------------------------------------------
create or replace function public._patient_courses(p_user uuid default null)
returns table (
  user_id uuid, course_id uuid, course_title text, until timestamptz, started_at timestamptz,
  purchased int, done int, total int, last_activity timestamptz
)
language sql
stable
as $$
  with acc as (
    select r.user_id, r.course_id,
           case when bool_or(r.plan_months is null) then 'infinity'::timestamptz else max(r.access_until) end as until,
           min(coalesce(r.access_starts_at, r.reviewed_at, r.created_at)) as started_at,
           case when bool_or(r.plan_sessions is null) then null else sum(r.plan_sessions)::int end as purchased
    from public.registrations r
    where r.status = 'approved' and r.user_id is not null and r.course_id is not null
      and (p_user is null or r.user_id = p_user)
    group by r.user_id, r.course_id
  ),
  pos as (
    select cs.id, row_number() over (partition by cs.course_id order by cs.sort_order, cs.created_at)::int as pos
    from public.course_sessions cs
    where cs.course_id in (select a.course_id from acc a)
  ),
  included as (
    select a.user_id, a.course_id, l.id as lesson_id
    from acc a
    join public.lessons l on l.course_id = a.course_id
    left join pos p on p.id = l.session_id
    where a.purchased is null or p.pos is null or p.pos <= a.purchased
  ),
  counts as (
    select i.user_id, i.course_id, count(*)::int as total, count(lp.lesson_id)::int as done
    from included i
    left join public.lesson_progress lp on lp.user_id = i.user_id and lp.lesson_id = i.lesson_id
    group by i.user_id, i.course_id
  ),
  recent as (
    select lp.user_id, lp.course_id, max(lp.completed_at) as last_activity
    from public.lesson_progress lp
    where lp.user_id in (select a.user_id from acc a)
    group by lp.user_id, lp.course_id
  )
  select a.user_id, a.course_id, c.title, a.until, a.started_at, a.purchased,
         coalesce(n.done, 0), coalesce(n.total, 0), rc.last_activity
  from acc a
  join public.courses c on c.id = a.course_id
  left join counts n on n.user_id = a.user_id and n.course_id = a.course_id
  left join recent rc on rc.user_id = a.user_id and rc.course_id = a.course_id;
$$;
revoke execute on function public._patient_courses(uuid) from public, anon, authenticated;

-- Danh sách bệnh nhân (tài khoản role = user) cho trang quản trị: lọc theo từ khóa, nguồn, trạng thái gói, mới tạo N ngày.
-- p_status: active (đang học) · expiring (còn ≤ 7 ngày) · expired (có chương trình đã hết hạn chưa gia hạn)
-- · none (chưa có gói) · inactive (đang học nhưng không tập > 7 ngày). Người không phải nhân viên / admin nhận danh sách rỗng.
create or replace function public.admin_patients(
  p_q text default '', p_source text default '', p_status text default '', p_new_days int default 0, p_limit int default 300
)
returns table (
  id uuid, full_name text, email text, phone text, source text, created_at timestamptz, created_by_name text,
  active_courses int, nearest_until timestamptz, has_expiring boolean, has_expired boolean, inactive boolean,
  last_activity timestamptz, avg_percent int
)
language sql
stable
security definer
set search_path = public
as $$
  with pc as (
    select * from public._patient_courses()
  ),
  agg as (
    select pc.user_id,
           count(*) filter (where pc.until > now())::int as active_courses,
           min(pc.until) filter (where pc.until > now() and pc.until <> 'infinity') as nearest_until,
           bool_or(pc.until > now() and pc.until <= now() + interval '7 days') as has_expiring,
           bool_or(pc.until <= now()) as has_expired,
           bool_or(pc.until > now() and coalesce(pc.last_activity, pc.started_at) < now() - interval '7 days') as inactive,
           max(pc.last_activity) as last_activity,
           floor(avg(pc.done * 100.0 / pc.total) filter (where pc.until > now() and pc.total > 0))::int as avg_percent
    from pc
    group by pc.user_id
  )
  select p.id, p.full_name, p.email, p.phone, p.source, p.created_at,
         coalesce(nullif(cb.full_name, ''), cb.email, cb.phone),
         coalesce(a.active_courses, 0), a.nearest_until, coalesce(a.has_expiring, false), coalesce(a.has_expired, false),
         coalesce(a.inactive, false), a.last_activity, a.avg_percent
  from public.profiles p
  left join agg a on a.user_id = p.id
  left join public.profiles cb on cb.id = p.created_by
  where public.is_staff()
    and p.role = 'user'
    and (coalesce(p_q, '') = '' or p.full_name ilike '%' || p_q || '%' or p.email ilike '%' || p_q || '%' or p.phone ilike '%' || p_q || '%')
    and (coalesce(p_source, '') = '' or p.source = p_source)
    and (coalesce(p_new_days, 0) <= 0 or p.created_at >= now() - make_interval(days => p_new_days))
    and case coalesce(p_status, '')
          when 'active' then coalesce(a.active_courses, 0) > 0
          when 'expiring' then coalesce(a.has_expiring, false)
          when 'expired' then coalesce(a.has_expired, false)
          when 'none' then a.user_id is null
          when 'inactive' then coalesce(a.inactive, false)
          else true
        end
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 300), 1), 1000);
$$;
grant execute on function public.admin_patients(text, text, text, int, int) to authenticated;

-- Tiến độ từng chương trình của một bệnh nhân (trang chi tiết bệnh nhân). until null + unlimited = không thời hạn.
create or replace function public.patient_progress(p_user uuid)
returns table (
  course_id uuid, course_title text, until timestamptz, unlimited boolean, purchased int, done int, total int, last_activity timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select pc.course_id, pc.course_title, nullif(pc.until, 'infinity'), pc.until = 'infinity', pc.purchased, pc.done, pc.total, pc.last_activity
  from public._patient_courses(p_user) pc
  where public.is_staff()
  order by pc.course_title;
$$;
grant execute on function public.patient_progress(uuid) to authenticated;

-- Dashboard (SCR-22): mọi chỉ số trong 1 lần gọi. Chỉ nhân viên / admin (người khác nhận null). Không có doanh thu.
create or replace function public.dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with pc as (
    select pc.*, p.full_name, p.phone
    from public._patient_courses() pc
    join public.profiles p on p.id = pc.user_id and p.role = 'user'
  ),
  patients as (
    select p.source, p.created_at from public.profiles p where p.role = 'user'
  )
  select case when not public.is_staff() then null else jsonb_build_object(
    'patients', (select count(*) from patients),
    'new_7d_web', (select count(*) from patients where source = 'web' and created_at >= now() - interval '7 days'),
    'new_7d_zalo', (select count(*) from patients where source = 'zalo' and created_at >= now() - interval '7 days'),
    'new_30d_web', (select count(*) from patients where source = 'web' and created_at >= now() - interval '30 days'),
    'new_30d_zalo', (select count(*) from patients where source = 'zalo' and created_at >= now() - interval '30 days'),
    'pending_registrations', (select count(*) from public.registrations where status = 'pending'),
    'oldest_pending_at', (select min(created_at) from public.registrations where status = 'pending'),
    'active_plans', (select count(*) from pc where until > now()),
    'active_patients', (select count(distinct user_id) from pc where until > now()),
    'expiring_7d', (select count(*) from pc where until > now() and until <= now() + interval '7 days'),
    'expired', (select count(*) from pc where until <= now()),
    'inactive_7d', (select count(distinct user_id) from pc where until > now() and coalesce(last_activity, started_at) < now() - interval '7 days'),
    'consultations_new', (select count(*) from public.consultations where status = 'new'),
    'leads_new', (select count(*) from public.leads where status = 'new' and phone is not null),
    'expiring', (
      select coalesce(jsonb_agg(x order by x.until), '[]'::jsonb) from (
        select user_id, full_name, phone, course_id, course_title, until from pc
        where until > now() and until <= now() + interval '7 days' order by until limit 10
      ) x
    ),
    'inactive', (
      select coalesce(jsonb_agg(x order by x.last_seen nulls first), '[]'::jsonb) from (
        select user_id, full_name, phone, course_title, last_activity, coalesce(last_activity, started_at) as last_seen, done, total from pc
        where until > now() and coalesce(last_activity, started_at) < now() - interval '7 days'
        order by coalesce(last_activity, started_at) limit 10
      ) x
    ),
    'programs', (
      select coalesce(jsonb_agg(x order by x.patients desc, x.course_title), '[]'::jsonb) from (
        select course_id, course_title, count(*)::int as patients,
               coalesce(floor(avg(done * 100.0 / total) filter (where total > 0)), 0)::int as avg_percent
        from pc where until > now() group by course_id, course_title
      ) x
    )
  ) end;
$$;
grant execute on function public.dashboard_stats() to authenticated;

-- Doanh thu (chỉ admin): tổng số tiền đơn đang "Đã duyệt" theo thời điểm duyệt trong [p_from, p_to),
-- theo chương trình / hình thức thanh toán / nguồn / người xử lý. Đơn bị thu hồi không tính.
create or replace function public.revenue_report(p_from timestamptz, p_to timestamptz)
returns table (dimension text, label text, orders int, revenue bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin được xem doanh thu.';
  end if;
  return query
  with r as (
    select coalesce(reg.course_title, 'Khóa học') as course_title, reg.payment_method, reg.source,
           coalesce(reg.reviewed_by_name, '—') as handler, coalesce(reg.amount, 0)::bigint as amount
    from public.registrations reg
    where reg.status = 'approved' and reg.reviewed_at >= p_from and reg.reviewed_at < p_to
  )
  select 'total'::text, 'Tổng'::text, count(*)::int, coalesce(sum(r.amount), 0)::bigint from r
  union all
  select 'course', r.course_title, count(*)::int, sum(r.amount)::bigint from r group by r.course_title
  union all
  select 'method', r.payment_method, count(*)::int, sum(r.amount)::bigint from r group by r.payment_method
  union all
  select 'source', r.source, count(*)::int, sum(r.amount)::bigint from r group by r.source
  union all
  select 'handler', r.handler, count(*)::int, sum(r.amount)::bigint from r group by r.handler;
end;
$$;
grant execute on function public.revenue_report(timestamptz, timestamptz) to authenticated;

-- Phiếu tham vấn của người đang đăng nhập (không có ghi chú nội bộ của nhân viên)
create or replace function public.my_consultations(p_limit int default 20)
returns table (id uuid, course_title text, status text, created_at timestamptz, handled_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.course_title, c.status, c.created_at, c.handled_at
  from public.consultations c
  where c.user_id = auth.uid()
  order by c.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;
grant execute on function public.my_consultations(int) to authenticated;

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

-- Nhân viên cấp gói cho bệnh nhân (Đợt 11): chỉ tạo đơn nguồn "staff" đã duyệt, người tạo là chính mình.
-- Trigger registrations_stamp_insert điền gói, hạn học, người xử lý; khách tự đăng ký vẫn chỉ qua server (service role).
drop policy if exists "registrations_staff_insert" on public.registrations;
create policy "registrations_staff_insert" on public.registrations for insert
  with check (public.is_staff() and source = 'staff' and status = 'approved' and created_by = auth.uid());

-- Nhật ký tài khoản (nhân viên, admin đọc; chỉ server ghi) và ghi chú nội bộ về bệnh nhân (nhân viên, admin đọc / ghi)
alter table public.account_events enable row level security;
drop policy if exists "account_events_staff_select" on public.account_events;
create policy "account_events_staff_select" on public.account_events for select
  using (public.is_staff());
alter table public.patient_notes enable row level security;
drop policy if exists "patient_notes_staff_select" on public.patient_notes;
create policy "patient_notes_staff_select" on public.patient_notes for select
  using (public.is_staff());
drop policy if exists "patient_notes_staff_insert" on public.patient_notes;
create policy "patient_notes_staff_insert" on public.patient_notes for insert
  with check (public.is_staff());
drop policy if exists "patient_notes_staff_update" on public.patient_notes;
create policy "patient_notes_staff_update" on public.patient_notes for update
  using (public.is_staff());

-- Mẫu phiếu tham vấn: người đăng nhập đọc câu hỏi đang bật; admin đọc tất cả và thêm / sửa / xóa
alter table public.consult_questions enable row level security;
drop policy if exists "consult_questions_select" on public.consult_questions;
create policy "consult_questions_select" on public.consult_questions for select
  using ((active and auth.uid() is not null) or public.is_admin());
drop policy if exists "consult_questions_admin_insert" on public.consult_questions;
create policy "consult_questions_admin_insert" on public.consult_questions for insert
  with check (public.is_admin());
drop policy if exists "consult_questions_admin_update" on public.consult_questions;
create policy "consult_questions_admin_update" on public.consult_questions for update
  using (public.is_admin());
drop policy if exists "consult_questions_admin_delete" on public.consult_questions;
create policy "consult_questions_admin_delete" on public.consult_questions for delete
  using (public.is_admin());

-- Phiếu tham vấn: nhân viên, admin đọc & cập nhật trạng thái; bệnh nhân đọc qua my_consultations(); chỉ server thêm; không ai xóa
alter table public.consultations enable row level security;
drop policy if exists "consultations_staff_select" on public.consultations;
create policy "consultations_staff_select" on public.consultations for select
  using (public.is_staff());
drop policy if exists "consultations_staff_update" on public.consultations;
create policy "consultations_staff_update" on public.consultations for update
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
