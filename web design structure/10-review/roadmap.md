# Lộ trình mở rộng (Roadmap)

Mỗi hạng mục có thiết kế sơ bộ để khi triển khai chỉ cần chi tiết hóa bằng
[templates/feature-spec.md](../templates/feature-spec.md).
Nguồn gốc các mã: **RV-xx** (review vòng 1), **RK-xx** (risk case vòng 2–3) trong [project-review.md](project-review.md);
**R-xx** là tính năng mở rộng (chi tiết thiết kế ở cuối file); **G-xx** là khoảng trống kiểm thử trong [test-plan](../08-testing/test-plan.md).

Cập nhật: 26/09/2026.

## 1. Báo cáo tiến độ (report)

### 1.1. Theo đợt

| Đợt | Nội dung | Hạng mục | Trạng thái | Hoàn thành | Kiểm thử | Kết quả E2E |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sửa lỗi review vòng 1 | RV-01, RV-02, RV-05, RV-09, RV-10 (git) | ✅ Xong | 26/09/2026 (`0f6cfef`, `05b16c5`) | TC-01 → TC-46 | 46/46 PASS |
| 2 | Risk case vòng 2 + người xử lý | RK-01, RK-03, RK-05, RK-07 (= RV-07), RK-09, người xử lý (RV-11) | ✅ Xong | 26/09/2026 | TC-47 → TC-54 | 53/53 PASS |
| 3 | Nhiều admin | RK-11, RK-12 + R-05, RK-13, RK-14 | ✅ Xong | 26/09/2026 | TC-55 → TC-58 | 57/57 PASS |
| 4 | Vận hành an toàn | RK-10 (rào chặn E2E + hướng dẫn staging), CI GitHub Actions, RV-13, RV-03 | ✅ Xong (staging chờ A-1) | 26/09/2026 | TC-59; rào chặn E2E và build CI kiểm tra thủ công | 63/63 PASS |
| 5 | Chống lạm dụng & dữ liệu | RK-06 / RV-04 (giới hạn tần suất + Turnstile tùy chọn), RK-08, RK-04, RV-16 | ✅ Xong (Turnstile chờ A-4) | 26/09/2026 | TC-60 → TC-64 | 63/63 PASS |

### 1.2. Tổng hợp theo nguồn

| Nguồn | Tổng | ✅ Xong | 🟡 Một phần / chờ cấu hình | ⬜ Chưa làm |
| --- | --- | --- | --- | --- |
| RV (review vòng 1) | 20 | 10 | 1 (RV-10) | 9 |
| RK (risk case) | 15 | 12 | 1 (RK-10) | 2 |
| R (tính năng mở rộng, gồm R-00) | 14 | 2 | — | 12 |
| G (khoảng trống kiểm thử) | 12 | 2 | 4 | 6 |

### 1.3. Việc cần chủ dự án làm (không tự động hóa được)

| # | Việc | Liên quan | Trạng thái |
| --- | --- | --- | --- |
| A-1 | Tạo project Supabase **staging**, chạy `schema.sql`, tạo env staging có `E2E_SUPABASE_REF` (runbook §1.1) | RK-10, G-12 | ⬜ |
| A-2 | Thêm secrets + variable `E2E_ENABLED` trên GitHub để CI chạy E2E trên staging | RK-10, RV-10 | ⬜ |
| A-3 | Push nhánh / mở PR để CI chạy lần đầu; bật "Require status checks" cho `main` | RV-10 | ⬜ |
| A-4 | Tạo khóa Cloudflare Turnstile cho domain production, đặt 2 biến trên Vercel, thử đăng ký trên điện thoại | RK-06 | ⬜ |
| A-5 | Chạy `supabase/schema.sql` mới nhất trên **production** (sau khi sao lưu) trước khi deploy code Đợt 3–5 | Tất cả | ⬜ |
| A-6 | Xác nhận email liên hệ trong `site-config.ts` là email chính thức | RV-19 | ⬜ |

## 2. Checklist hoàn thành

### 2.1. Review vòng 1 (RV)

- [x] RV-01 Ẩn khóa không thu hồi quyền học của học viên đã mua
- [x] RV-02 Xóa khóa học giữ đơn đăng ký (snapshot tên khóa, học phí)
- [x] RV-03 Mật khẩu tối thiểu 8 ký tự (Đợt 4)
- [x] RV-04 Giới hạn tần suất đăng ký / đăng nhập / quên mật khẩu; Turnstile tùy chọn (Đợt 5) – bật Turnstile: A-4
- [x] RV-05 Validate dữ liệu admin phía server
- [ ] RV-06 Ảnh HEIC không có thumbnail trên Chrome/Edge
- [x] RV-07 Chống trùng đơn ở database (RK-07)
- [ ] RV-08 Ảnh chuyển khoản mồ côi
- [x] RV-09 Nội dung lỗi thời ("Gmail")
- [ ] RV-10 Git + CI – 🟡 đã có git, remote GitHub, workflow CI; chờ A-2, A-3
- [x] RV-11 Người xử lý đơn + lý do từ chối + lịch sử (Đợt 2–3)
- [ ] RV-12 Phân trang danh sách admin
- [x] RV-13 Index `profiles.email` (Đợt 4)
- [ ] RV-14 `updateProfileAction` không hoàn tác khi lỗi giữa chừng
- [ ] RV-15 Thông báo kỹ thuật khi trùng SĐT do race
- [x] RV-16 Security headers + CSP (Đợt 5)
- [ ] RV-17 Chính sách bảo mật / đồng ý xử lý dữ liệu (NĐ 13/2023)
- [ ] RV-18 Link video có thể bị chia sẻ ra ngoài (→ R-10)
- [ ] RV-19 Xác nhận email liên hệ chính thức (A-6)
- [ ] RV-20 Logging / giám sát lỗi, backup Storage

### 2.2. Risk case (RK)

- [x] RK-01 Chặn nhập email nội bộ `@sdt.hv.invalid`
- [ ] RK-02 Xác minh email khi đăng ký / đổi email
- [x] RK-03 Xóa tài khoản giữ đơn đăng ký
- [x] RK-04 Đơn chờ duyệt của khóa đã xóa: hướng dẫn hoàn tiền (Đợt 5)
- [x] RK-05 Chốt nghiệp vụ: đơn của khóa ẩn vẫn duyệt được
- [x] RK-06 Chống spam / dò mật khẩu (Đợt 5)
- [x] RK-07 Unique index chặn đơn trùng
- [x] RK-08 Kiểm tra ảnh theo nội dung file (Đợt 5)
- [x] RK-09 Cảnh báo link video không hợp lệ
- [ ] RK-10 E2E trên staging – 🟡 đã có rào chặn + hướng dẫn + CI; chờ A-1, A-2
- [x] RK-11 Không ghi đè khi 2 admin cùng xử lý
- [x] RK-12 Lịch sử xử lý đơn
- [x] RK-13 Cấp / gỡ quyền admin trên giao diện
- [x] RK-14 Thông báo lỗi database theo từng thao tác
- [ ] RK-15 Ghi "Hệ thống" khi duyệt tự động (làm cùng R-08)

### 2.3. Tính năng mở rộng (R)

- [x] R-00 Xử lý kết quả review (Đợt 1 → 5)
- [x] R-05 Lý do từ chối + lịch sử xử lý + người xử lý
- [ ] R-01 Thông báo email khi đơn được duyệt / từ chối
- [ ] R-02 Admin đặt lại mật khẩu học viên
- [ ] R-03 Ảnh bìa khóa học
- [ ] R-04 Tiến độ học
- [ ] R-06 Phân trang, lọc, xuất Excel đơn
- [ ] R-07 Báo cáo doanh thu
- [ ] R-08 Xác nhận thanh toán tự động
- [ ] R-09 Kéo thả bài học, chia chương
- [ ] R-10 Video riêng tư
- [ ] R-11 Cấu hình trung tâm trên giao diện
- [ ] R-12 Vai trò nhân viên
- [ ] R-13 Mã giảm giá / combo

## 3. Lộ trình gợi ý (theo thứ tự thực hiện)

| Thứ tự | Đợt | Hạng mục | Vì sao làm ở thứ tự này | Phụ thuộc | Công sức |
| --- | --- | --- | --- | --- | --- |
| 1 | **Đợt 6 – Hoàn tất hạ tầng** | A-1 → A-5; test G-12 (gỡ admin cuối cùng) trên staging; backup Storage định kỳ (một phần RV-20) | Mọi thay đổi sau cần E2E trên staging và CI chặn lỗi trước khi merge | Chủ dự án tạo tài khoản / khóa | XS–S |
| 2 | **Đợt 7 – Tài khoản & thông báo** | R-01 (email báo duyệt/từ chối, kèm lý do), R-02 (admin đặt lại mật khẩu cho học viên không có email), RK-02 (xác minh email bằng mã 6 số), RV-15, RV-14 | Giảm cuộc gọi hỗ trợ ngay khi có nhiều admin; tái dùng `lib/mailer.ts`, `password_resets` | Đợt 6 (test email trên staging) | S–M |
| 3 | **Đợt 8 – Quy mô dữ liệu** | RV-12 + R-06 (phân trang, lọc theo khóa/ngày, xuất CSV), R-07 (báo cáo doanh thu theo `amount`), RV-08 (dọn ảnh mồ côi), RV-06 (HEIC → JPEG) | Danh sách admin đang giới hạn 200 đơn / 500 tài khoản | — | M |
| 4 | **Đợt 9 – Pháp lý & giám sát** | RV-17 (chính sách bảo mật, ô đồng ý ở form đăng ký), RV-20 (Sentry / log drain, cảnh báo đơn chờ > 24h), RV-19 | Bắt buộc trước khi quảng bá rộng, thu thập dữ liệu cá nhân | — | S |
| 5 | **Đợt 10 – Trải nghiệm học** | R-04 (tiến độ học), R-03 (ảnh bìa), R-09 (chia chương) | Tăng tỷ lệ học xong, hình ảnh chuyên nghiệp hơn | — | M |
| 6 | **Đợt 11 – Vận hành mở rộng** | R-12 (vai trò nhân viên – nền đã có ở Đợt 3), R-11 (cấu hình trên giao diện), R-13 (mã giảm giá) | Khi có nhân viên không cần toàn quyền | Đợt 3 | M |
| 7 | **Đợt 12 – Tự động hóa & bảo vệ nội dung** | R-08 (webhook ngân hàng) + RK-15, R-10 (video riêng tư) + RV-18 | Giá trị cao nhưng tốn chi phí dịch vụ, cần số liệu thật trước khi đầu tư | Đợt 7, 8 | L |

Công sức: XS < 0,5 ngày · S 1–2 ngày · M 3–5 ngày · L > 1 tuần.

## 4. Danh mục tính năng mở rộng

| ID | Hạng mục | Story | Giá trị | Công sức | Đợt gợi ý |
| --- | --- | --- | --- | --- | --- |
| R-01 | Thông báo khi đơn được duyệt / từ chối | US-09.01 | Cao | S | 7 |
| R-02 | Admin đặt lại mật khẩu học viên | US-09.02 | Cao | XS | 7 |
| R-05 | ✅ Lý do từ chối + lịch sử xử lý đơn + người xử lý | ~~US-09.05~~, ~~09.06~~ | Cao | S | ✅ Đợt 3 |
| R-06 | Phân trang, lọc, xuất Excel đơn | US-09.07 | Trung bình | S | 8 |
| R-07 | Báo cáo doanh thu | US-09.08 | Trung bình | S | 8 |
| R-03 | Ảnh bìa khóa học | US-09.03 | Trung bình | S | 10 |
| R-04 | Tiến độ học | US-09.04 | Cao | M | 10 |
| R-09 | Sắp xếp bài học kéo thả, chia chương | US-09.10 | Thấp | M | 10 |
| R-12 | Vai trò nhân viên (nền: quản lý admin RK-13) | — | Trung bình | S | 11 |
| R-11 | Cấu hình trung tâm trên giao diện | — | Thấp | S | 11 |
| R-13 | Mã giảm giá / combo khóa học | — | Trung bình | M | 11 |
| R-08 | Xác nhận thanh toán tự động (webhook ngân hàng) | US-09.09 | Rất cao | L | 12 |
| R-10 | Video riêng tư (chống chia sẻ) | — | Cao | L | 12 |

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
- ✅ Người xử lý: cột `reviewed_by`, `reviewed_by_name` do trigger `registrations_stamp_review` ghi; bảng admin có cột "Người xử lý".
- Còn lại: cột `review_note text` (xem database-design §9); form Từ chối/Thu hồi có ô lý do.
- Học viên thấy lý do ở "Đơn chưa được xác nhận".
- ✅ Đợt 3: bảng `registration_events` do trigger `registrations_stamp_review` ghi (RK-12); cột `review_note`, ô lý do khi Từ chối/Thu hồi, học viên thấy lý do.
- ✅ Chống ghi đè khi 2 admin cùng xử lý (RK-11); nhật ký phân quyền `role_events` (RK-13).
- Mở rộng sau: bảng `audit_log(actor, action, entity, entity_id, data jsonb, created_at)` cho khóa học, bài học, phân quyền.

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
- ✅ `registrations.amount` (giá lúc đăng ký) đã có (RV-02): báo cáo dùng `sum(r.amount)` và `r.course_title`, không join giá hiện tại; tính cả đơn của khóa đã xóa.
- Trang `/admin/reports` với biểu đồ (tuân theo design system).

## R-08 – Xác nhận thanh toán tự động
- Dùng dịch vụ đọc biến động số dư (Casso, SePay, PayOS) → webhook `POST app/api/webhooks/bank/route.ts`.
- Xác thực chữ ký/secret header → trích SĐT từ nội dung chuyển khoản → tìm đơn `pending` có `phone` khớp và số tiền ≥ giá → `approved`, `reviewed_by = null`, `reviewed_by_name = 'Hệ thống'` (sửa trigger, RK-15), `review_note = 'Tự động: <mã GD>'`.
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
- Nền đã có (Đợt 3): nút cấp/gỡ quyền ở `/admin/users`, trigger `profiles_guard_role`, `role_events` → chỉ cần thêm giá trị `staff` và nút chọn vai trò.

## R-13 – Mã giảm giá / combo
- Bảng `coupons(code, percent|amount, valid_from, valid_to, max_uses, course_ids uuid[])`.
- `registrations.amount`, `coupon_code`; QR dùng số tiền sau giảm; server tính lại giá, không tin client.
