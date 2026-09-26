# Lộ trình mở rộng (Roadmap)

Mỗi hạng mục có thiết kế sơ bộ để khi triển khai chỉ cần chi tiết hóa bằng
[templates/feature-spec.md](../templates/feature-spec.md).

## Tổng quan

| ID | Hạng mục | Story | Giá trị | Công sức | Giai đoạn |
| --- | --- | --- | --- | --- | --- |
| R-00 | Xử lý kết quả review (RV-01…RV-10) | — | Cao | S | **Ngay** |
| R-01 | Thông báo khi đơn được duyệt / từ chối | US-09.01 | Cao | S | Giai đoạn 1 |
| R-02 | Admin đặt lại mật khẩu học viên | US-09.02 | Cao | XS | Giai đoạn 1 |
| R-05 | Lý do từ chối + người duyệt | US-09.05, 09.06 | Trung bình | XS | Giai đoạn 1 |
| R-03 | Ảnh bìa khóa học | US-09.03 | Trung bình | S | Giai đoạn 2 |
| R-04 | Tiến độ học | US-09.04 | Cao | M | Giai đoạn 2 |
| R-06 | Phân trang, lọc, xuất Excel đơn | US-09.07 | Trung bình | S | Giai đoạn 2 |
| R-07 | Báo cáo doanh thu | US-09.08 | Trung bình | S | Giai đoạn 2 |
| R-09 | Sắp xếp bài học kéo thả, chia chương | US-09.10 | Thấp | M | Giai đoạn 3 |
| R-11 | Cấu hình trung tâm trên giao diện | — | Thấp | S | Giai đoạn 3 |
| R-12 | Vai trò nhân viên (duyệt đơn, không sửa nội dung) | — | Trung bình | S | Giai đoạn 3 |
| R-13 | Mã giảm giá / combo khóa học | — | Trung bình | M | Giai đoạn 3 |
| R-08 | Xác nhận thanh toán tự động (webhook ngân hàng) | US-09.09 | Rất cao | L | Giai đoạn 4 |
| R-10 | Video riêng tư (chống chia sẻ) | — | Cao | L | Giai đoạn 4 |

Công sức: XS < 0,5 ngày · S 1–2 ngày · M 3–5 ngày · L > 1 tuần.

---

## R-01 – Thông báo khi đơn được xử lý
- **Thiết kế**: trong `setRegistrationStatus`, sau khi update thành công và `status ∈ {approved, rejected}`, lấy email thật từ `registrations.email`
  → gửi qua `sendMail` (mẫu mới trong `lib/mailer.ts`: `approvedEmail(courseTitle, link)`, `rejectedEmail(courseTitle, note)`).
- Gửi thất bại **không** được làm hỏng thao tác duyệt (try/catch, chỉ ghi log).
- Học viên không có email: hiển thị nút "Gọi" / "Nhắn Zalo" trong bảng admin (đã có link `tel:`). Mở rộng Zalo OA ZNS nếu cần (tốn phí).
- Test: E2E đọc outbox sau khi duyệt.

## R-02 – Admin đặt lại mật khẩu
- Action `adminResetPassword(userId, formData)` → `requireAdmin()` → `createAdminClient().auth.admin.updateUserById(userId, { password })`.
- UI: trong `/admin/users`, mỗi dòng có "Đặt lại mật khẩu" (form nhỏ + xác nhận). Không hiển thị mật khẩu cũ.
- Ghi audit (R-05).

## R-03 – Ảnh bìa khóa học
- Cột `courses.cover_image` đã có. Tạo bucket **public** `course-covers` (policy insert/update/delete: `is_admin()`).
- Admin upload trong `CourseFields`; lưu URL public; trang chủ dùng `next/image` (thêm domain Supabase vào `images.remotePatterns`).

## R-04 – Tiến độ học
```sql
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
create policy "progress_own" on public.lesson_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
- Nút "Đánh dấu đã học" ở SCR-09; ✓ trong danh sách bài; % ở thẻ khóa (SCR-07); "Tiếp tục học" mở bài chưa học đầu tiên.

## R-05 – Lý do từ chối & người duyệt
- Cột `review_note text`, `reviewed_by uuid` (xem database-design §9).
- `setRegistrationStatus` ghi `reviewed_by = user.id`; form Từ chối/Thu hồi có ô lý do.
- Học viên thấy lý do ở "Đơn chưa được xác nhận"; admin thấy tên người duyệt ở cột Ngày xử lý.
- Mở rộng: bảng `audit_log(actor, action, entity, entity_id, data jsonb, created_at)`.

## R-06 – Phân trang, lọc, xuất Excel
- Query param `?page=&course=&from=&to=&q=`; dùng `.range()` + `count: 'exact'`.
- Xuất CSV qua Route Handler `app/admin/export/route.ts` (kiểm tra admin, stream CSV UTF-8 BOM để Excel đọc đúng tiếng Việt).

## R-07 – Báo cáo doanh thu
- View SQL (chỉ admin đọc qua hàm `security definer` hoặc RLS):
```sql
create or replace view public.revenue_by_month as
select date_trunc('month', r.reviewed_at) as month, c.title, count(*) as orders, sum(c.price) as revenue
from public.registrations r join public.courses c on c.id = r.course_id
where r.status = 'approved' group by 1, 2;
```
- ⚠️ Doanh thu tính theo **giá hiện tại** của khóa → nên lưu `registrations.amount` (giá tại thời điểm đăng ký) trước khi làm báo cáo.
- Trang `/admin/reports` với biểu đồ (tuân theo design system).

## R-08 – Xác nhận thanh toán tự động
- Dùng dịch vụ đọc biến động số dư (Casso, SePay, PayOS) → webhook `POST app/api/webhooks/bank/route.ts`.
- Xác thực chữ ký/secret header → trích SĐT từ nội dung chuyển khoản → tìm đơn `pending` có `phone` khớp và số tiền ≥ giá → `approved`, `reviewed_by = null`, `review_note = 'Tự động: <mã GD>'`.
- Lưu giao dịch vào bảng `bank_transactions` (idempotent theo mã giao dịch).
- Không khớp → giữ `pending` cho admin xử lý tay. Ảnh chuyển khoản có thể trở thành tùy chọn.
- Nên đổi nội dung chuyển khoản sang **mã đơn ngắn** (VD `HV1234`) để khớp chính xác hơn SĐT.

## R-09 – Kéo thả bài học, chia chương
- Bảng `sections(id, course_id, title, sort_order)`, `lessons.section_id` nullable.
- Kéo thả: client component, gửi mảng `id` theo thứ tự → action cập nhật `sort_order` hàng loạt (RPC `reorder_lessons(ids uuid[])`).

## R-10 – Video riêng tư
- Chuyển sang Bunny Stream / Cloudflare Stream / Mux; lưu `video_provider`, `video_id` thay vì URL công khai.
- Server tạo **signed URL/token ngắn hạn** chỉ khi `has_course_access` đúng; `lib/video.ts` trả về iframe/player tương ứng.
- Thêm watermark động (tên/SĐT học viên) để giảm quay màn hình.

## R-11 – Cấu hình trên giao diện
- Bảng `settings(key text primary key, value jsonb)`; RLS: đọc công khai các key không nhạy cảm, ghi `is_admin()`.
- Chuyển hotline, Zalo, ngân hàng, thông tin bác sĩ từ `site-config.ts` sang bảng; cache bằng `unstable_cache` + `revalidateTag('settings')`.

## R-12 – Vai trò nhân viên
- `role in ('user', 'staff', 'admin')`; hàm `has_role(variadic roles text[])`.
- Staff: đọc/duyệt đơn, xem học viên; không sửa khóa học/bài học. Cập nhật middleware, `requireAdmin` → `requireRole`.

## R-13 – Mã giảm giá / combo
- Bảng `coupons(code, percent|amount, valid_from, valid_to, max_uses, course_ids uuid[])`.
- `registrations.amount`, `coupon_code`; QR dùng số tiền sau giảm; server tính lại giá, không tin client.
