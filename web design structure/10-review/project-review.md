# Báo cáo review dự án

- **Phạm vi**: `README.md`, `supabase/schema.sql`, toàn bộ `app/`, `components/`, `lib/`, `middleware.ts`, `scripts/`, cấu hình.
- **Ngày**: 26/09/2026 · **Phiên bản**: 0.1.0
- **Phương pháp**: đọc mã nguồn, đối chiếu README với hành vi thực tế, phân tích RLS, luồng dữ liệu, bảo mật, khả năng mở rộng.
  Chưa chạy lại `build`/`test:e2e` trong lần review này.

## 1. Đánh giá tổng quan

| Tiêu chí | Điểm (1–5) | Nhận xét |
| --- | --- | --- |
| Kiến trúc | 4.5 | Server-first rõ ràng, 4 loại Supabase client tách bạch, RLS làm lớp phân quyền cuối |
| Bảo mật | 4 | RLS đầy đủ, service role chỉ ở server, mã reset băm + timing-safe, chặn open redirect. Thiếu rate limit, header bảo mật |
| Chất lượng code | 4.5 | Ngắn gọn, nhất quán, comment tiếng Việt giải thích lý do, ít phụ thuộc |
| UX / Accessibility | 4.5 | Mobile-first, nút lớn, aria đầy đủ, reduced-motion, thông báo tiếng Việt thân thiện |
| Kiểm thử | 3.5 | E2E 42 bước bao phủ tốt luồng chính; chưa có unit test, CI, một số nhánh lỗi chưa test |
| Tài liệu | 4 | README chi tiết, chính xác. Nay bổ sung bộ tài liệu thiết kế này |
| Vận hành | 3 | Chưa có git, CI, giám sát lỗi, tách môi trường, backup Storage |

**Kết luận**: Dự án ở trạng thái tốt cho quy mô hiện tại. Có **1 lỗi nghiệp vụ mức Cao** (RV-01) và một số rủi ro vận hành nên xử lý trước khi mở rộng.

## 2. Review README.md

| Mục | Đánh giá |
| --- | --- |
| Tính năng | ✅ Khớp với code (đã đối chiếu từng mục: box 3 bước, nén ảnh, đăng nhập SĐT, quên mật khẩu, menu tài khoản, bảng admin 4 tab, cột Thao tác cố định…) |
| Cài đặt | ✅ Đủ bước. Nên bổ sung: cấu hình Supabase Auth (tắt "Allow new users to sign up" / "Confirm email"), Site URL |
| Luồng hoạt động | ✅ Chính xác, kể cả rollback và email nội bộ `.invalid` |
| Kiểm thử E2E | ✅ Chính xác. Nên ghi rõ E2E chạy trên Supabase thật → dùng project staging |
| Cấu trúc thư mục | ✅ Khớp |
| Thiếu | Link tới bộ tài liệu `web design structure/`; mục "Quy tắc nghiệp vụ khi ẩn khóa" (xem RV-01) |

## 3. Danh sách phát hiện

Mức độ: 🔴 Cao · 🟠 Trung bình · 🟡 Thấp · 🔵 Cải tiến

| ID | Mức | Hạng mục | Tóm tắt |
| --- | --- | --- | --- |
| RV-01 | 🔴 | Nghiệp vụ / RLS | Ẩn khóa học làm học viên đã mua mất khóa khỏi "Khóa học của tôi" và trang chi tiết trả 404 |
| RV-02 | 🟠 | Toàn vẹn dữ liệu | Xóa khóa học xóa luôn toàn bộ đơn đăng ký (mất lịch sử thanh toán) |
| RV-03 | 🟠 | Bảo mật | Mật khẩu tối thiểu chỉ 6 ký tự |
| RV-04 | 🟠 | Bảo mật / DoS | Không có rate limit / CAPTCHA cho đăng ký, đăng nhập, quên mật khẩu |
| RV-05 | 🟠 | Validate | Admin actions không validate server-side (tiêu đề rỗng, giá âm/NaN, URL video) |
| RV-06 | 🟡 | UX admin | Ảnh HEIC không hiển thị thumbnail trên Chrome/Edge |
| RV-07 | 🟡 | Toàn vẹn dữ liệu | Chống trùng đơn chỉ ở tầng ứng dụng (race condition) |
| RV-08 | 🟡 | Lưu trữ | Ảnh chuyển khoản mồ côi khi xóa đơn/khóa/tài khoản |
| RV-09 | 🟡 | Nội dung | FAQ và ô tìm kiếm admin còn nói "Gmail" (đã hỗ trợ SĐT) |
| RV-10 | 🟠 | Quy trình | Dự án chưa là git repository, chưa có CI |
| RV-11 | 🟡 | Kiểm toán | Không lưu người duyệt đơn (`reviewed_by`) và lý do từ chối |
| RV-12 | 🟡 | Hiệu năng | Admin tải tối đa 200 đơn / 500 tài khoản, trang Học viên & Khóa học tải toàn bộ registrations; không phân trang |
| RV-13 | 🟡 | Hiệu năng | `profiles.email` không có index (dùng khi đăng nhập bằng email) |
| RV-14 | 🟡 | Nhất quán | `updateProfileAction` đổi auth email trước khi cập nhật profile, không hoàn tác nếu bước sau lỗi |
| RV-15 | 🟡 | UX | Lỗi trùng SĐT do race ở trigger hiện thông báo kỹ thuật "Database error creating new user" |
| RV-16 | 🔵 | Bảo mật | Chưa cấu hình security headers (X-Frame-Options, CSP…) |
| RV-17 | 🔵 | Pháp lý | Chưa có chính sách bảo mật / đồng ý xử lý dữ liệu cá nhân (NĐ 13/2023) |
| RV-18 | 🔵 | Nội dung | Link video YouTube/TikTok có thể bị chia sẻ ra ngoài |
| RV-19 | 🔵 | Cấu hình | Email liên hệ công khai trong `site-config.ts` là Gmail cá nhân – xác nhận đây là email chính thức của trung tâm |
| RV-20 | 🔵 | Vận hành | Chưa có logging/giám sát lỗi tập trung, chưa backup Storage |

## 4. Chi tiết

### RV-01 🔴 Ẩn khóa học khóa luôn học viên đã được duyệt

- **Vị trí**: `supabase/schema.sql` policy `courses_select` (`status = 'published' or is_admin()`);
  `app/courses/page.tsx` (lọc `r.course &&`); `app/courses/[courseId]/page.tsx` (`if (!course) notFound()`).
- **Tái hiện**: học viên có đơn `approved` cho khóa A → admin bấm "Ẩn khóa học" A →
  học viên vào `/courses`: khóa A biến mất (join `courses(...)` trả `null` do RLS) → vào `/courses/<A>` bị 404.
  Trong khi đó link trực tiếp `/courses/<A>/<lessonId>` vẫn xem được (RLS `lessons` chỉ xét `has_course_access`) → hành vi không nhất quán.
- **Mâu thuẫn**: nhãn trong form admin là "Ẩn – chưa mở đăng ký", README nói "ẩn khóa học", nghĩa là ngừng bán, không phải thu hồi của người đã mua.
- **Đề xuất** (chốt với chủ sản phẩm; phương án A được khuyến nghị):
  - **A.** Cho người có quyền đọc khóa kể cả khi ẩn:
    ```sql
    drop policy if exists "courses_select" on public.courses;
    create policy "courses_select" on public.courses for select
      using (status = 'published' or public.has_course_access(id));
    ```
    (`has_course_access` đã bao gồm `is_admin()`.) Thêm TC mới vào E2E (G-01).
  - **B.** Giữ nguyên, ghi rõ quy tắc "Ẩn = gỡ khóa cho tất cả", đổi nhãn trong admin và thêm hộp xác nhận.

### RV-02 🟠 Xóa khóa học xóa lịch sử thanh toán
- `registrations.course_id … on delete cascade`. Nút "Xóa khóa học" có xác nhận nhưng hậu quả không thể hoàn tác.
- **Đề xuất**: soft delete (`courses.deleted_at` / `status = 'archived'`), hoặc chặn xóa khi còn đơn `approved`
  (`on delete restrict` + thông báo "Hãy ẩn khóa thay vì xóa").

### RV-03 🟠 Mật khẩu 6 ký tự
- **Đề xuất**: tối thiểu 8; cấu hình đồng bộ ở Supabase Auth › Password requirements, `minLength` các form, các action.

### RV-04 🟠 Thiếu giới hạn tần suất
- `registerAction` (tạo user + upload bằng service role), `loginAction`, `forgotPasswordAction` là endpoint công khai.
- **Đề xuất**: Cloudflare Turnstile trên form đăng ký; rate limit theo IP (Upstash Ratelimit / Vercel KV hoặc bảng đếm trong Postgres);
  giới hạn số mã reset / tài khoản / ngày.

### RV-05 🟠 Validate phía server cho admin
- `readCourse`: `Number('abc')` → `NaN` → lỗi DB khó hiểu; `title` chỉ có khoảng trắng → chuỗi rỗng vẫn được lưu; `price` âm không bị chặn ở DB.
- `readLesson`: `video_url` bất kỳ được nhúng vào iframe.
- **Đề xuất**: hàm validate trả thông báo tiếng Việt; `check (price >= 0)`; chỉ chấp nhận URL mà `getVideoEmbed` nhận dạng được (YouTube/TikTok).

### RV-06 🟡 Thumbnail HEIC
- Chrome không hỗ trợ nén HEIC → gửi ảnh gốc → `<img>` trong bảng admin không hiển thị.
- **Đề xuất**: chuyển HEIC → JPEG ở server bằng `sharp` (đã có trong dependencies; cần bản libvips hỗ trợ HEIF) hoặc dùng `heic2any` ở client; tối thiểu hiển thị nhãn "HEIC – bấm để tải".

### RV-07 🟡 Trùng đơn
- Hai request song song có thể tạo 2 đơn `pending` cho cùng khóa. **Đề xuất**: unique index một phần (xem database-design §9) và bắt lỗi `23505` thành thông báo thân thiện.

### RV-08 🟡 Ảnh mồ côi
- **Đề xuất**: khi xóa → xóa file tương ứng; hoặc job định kỳ đối chiếu `storage.objects` với `registrations.payment_proof_path`.

### RV-09 🟡 Nội dung lỗi thời
- `app/page.tsx:56` FAQ: "Bạn đăng nhập bằng **Gmail** và mật khẩu đã tạo…" → nên là "bằng **số điện thoại (hoặc email)** và mật khẩu đã tạo".
- `app/admin/users/page.tsx:41` placeholder "Tìm theo tên, Gmail hoặc số điện thoại" → "email".

### RV-10 🟠 Chưa có git & CI
- Không có lịch sử thay đổi, không rollback được code, không review được.
- **Đề xuất**: `git init` + GitHub private + CI (development-guide §6).

### RV-11 → RV-20
Xem bảng mục 3; phương án chi tiết nằm trong [roadmap.md](roadmap.md) và [security-design.md](../07-security/security-design.md).

## 5. Điểm mạnh nên giữ

1. **RLS theo từng khóa** bằng `has_course_access` – bảo vệ nội dung ngay ở database.
2. **Rollback** trong `registerAction` – không để lại tài khoản rác.
3. **Email nội bộ `.invalid`** – giải pháp gọn cho đăng nhập bằng SĐT không cần SMS.
4. **Mã reset** băm SHA-256 kèm userId, `timingSafeEqual`, TTL, giới hạn thử, gửi lại.
5. **ISR + header client** – trang chủ nhanh mà vẫn hiển thị trạng thái đăng nhập.
6. **Nén ảnh client** + fallback an toàn.
7. **`run()` helper** trong admin actions: kiểm quyền, bắt lỗi, phát hiện 0 dòng bị ảnh hưởng, revalidate thống nhất.
8. **E2E** tự tạo & tự dọn dữ liệu, gắn nhãn theo vai trò, kiểm tra cả RLS và lỗi JavaScript.
9. **Accessibility** tốt: label, aria, focus, reduced motion, vùng chạm 44px.
10. **Schema idempotent** dễ vận hành cho người không chuyên.

## 6. Kế hoạch xử lý đề xuất

| Đợt | Hạng mục | Ước lượng |
| --- | --- | --- |
| Ngay | RV-10 (git), RV-09 (nội dung), chốt & sửa RV-01 | 0,5 ngày |
| Sprint 1 | RV-02, RV-05, RV-07, RV-03, RV-13 | 2 ngày |
| Sprint 2 | RV-04, RV-16, RV-11, RV-06 | 3 ngày |
| Sau | RV-08, RV-12, RV-17, RV-20, RV-18 | Theo roadmap |
