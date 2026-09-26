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

## 6. Trạng thái xử lý (cập nhật 26/09/2026, sau vòng sửa RK – E2E 53/53 PASS)

| ID | Trạng thái | Cách xử lý | Kiểm thử |
| --- | --- | --- | --- |
| RV-01 | ✅ Đã sửa | Chốt "Ẩn = chỉ ngừng nhận đăng ký". Policy `courses_select`: `status = 'published' or has_course_access(id)` | TC-41, TC-42 |
| RV-02 | ✅ Đã sửa | `registrations.course_title`, `amount` (snapshot, đơn cũ tự điền); FK `on delete set null`; UI hiện "(khóa học đã xóa)", chặn duyệt đơn của khóa đã xóa | TC-18, TC-44 |
| RV-05 | ✅ Đã sửa | Validate server trong `app/admin/actions.ts` + `isSupportedVideoUrl`; DB `check (price >= 0)` | TC-02, TC-09 |
| RV-09 | ✅ Đã sửa | FAQ, placeholder admin, hướng dẫn `create-admin` | TC-11 |
| RV-11 | 🟡 Một phần | Người xử lý đơn: `reviewed_by`, `reviewed_by_name` do trigger ghi, cột "Người xử lý" ở bảng admin. Chưa có lý do từ chối (R-05) | TC-49, TC-50 |
| RV-07 | ✅ Đã sửa | Xem RK-07 | TC-48 |
| RV-10 | 🟡 Một phần | `git init` (nhánh `main`), `.gitattributes`, 2 commit. Chưa có remote GitHub & CI | — |
| Còn lại | ⬜ | RV-03, 04, 06, 08, 12 → 20 giữ nguyên đề xuất | — |

## 7. Risk case phát hiện ở vòng review thứ 2

Phương pháp: review lại toàn bộ code sau khi sửa, **thăm dò thực tế** trên bản build local với Supabase thật
(script tạm, đã xóa dữ liệu), và quan sát từ lần chạy E2E.
Cột "Bằng chứng": 🔬 đã tái hiện thực tế · 📖 suy ra từ code · 👁 quan sát khi chạy E2E.

| ID | Mức | Risk case | Bằng chứng | Tác động | Đề xuất xử lý | Công sức |
| --- | --- | --- | --- | --- | --- | --- |
| RK-01 | 🟠 | Học viên nhập email dạng `<SĐT người khác>@sdt.hv.invalid` ở trang Tài khoản (hoặc form đăng ký) → chiếm email đăng nhập nội bộ của SĐT đó | 🔬 Probe: auth email đổi thành `03…@sdt.hv.invalid` thành công | Chủ thật của SĐT đó **không đăng ký được** nếu không có email ("Email này đã có tài khoản") | `isValidEmail` từ chối mọi email đuôi `@sdt.hv.invalid`; thêm TC | XS |
| RK-02 | 🟠 | Email không được xác minh khi đăng ký / thêm / đổi email (`email_confirm: true`) | 📖 `registerAction`, `updateProfileAction` | Có thể "giữ chỗ" email của người khác → họ không đăng ký được bằng email của mình; admin liên hệ nhầm người | Gửi mã 6 số xác nhận trước khi lưu email mới (tái dùng cơ chế `password_resets`) | M |
| RK-03 | 🟠 | Xóa tài khoản trong Supabase Auth xóa luôn mọi đơn của tài khoản (`user_id … on delete cascade`) | 📖 schema | Mất lịch sử thanh toán – cùng loại rủi ro RV-02 nhưng phía học viên | `user_id` nullable + `on delete set null` (đơn đã có snapshot họ tên, SĐT, email); hướng dẫn runbook | S |
| RK-04 | 🟡 | Đơn `pending` của khóa đã bị xóa: học viên thấy "Đang chờ xác nhận" mãi; admin chỉ có thể Từ chối | 📖 + 👁 TC-44 | Khách đã chuyển tiền nhưng không có hướng xử lý rõ ràng | Học viên thấy "Khóa học đã ngừng – liên hệ hotline để hoàn tiền"; admin có bộ lọc "Đơn của khóa đã xóa" | S |
| RK-05 | 🟡 | Đơn `pending` của khóa **đang ẩn** vẫn duyệt được → học viên được mở khóa đã ngừng bán | 📖 | Có thể là mong muốn (khách đã trả tiền trước khi ẩn) | **Cần chốt nghiệp vụ**; nếu đúng ý thì chỉ ghi vào BR | XS |
| RK-06 | 🟠 | Chưa có rate limit / CAPTCHA cho đăng ký, đăng nhập, quên mật khẩu (RV-04) | 📖 | Spam tạo tài khoản + upload ảnh bằng service role, tốn Storage | Cloudflare Turnstile ở form đăng ký + giới hạn theo IP | M |
| RK-07 | 🟡 | Gửi 2 đơn cùng lúc cho cùng khóa tạo 2 đơn `pending` (RV-07) | 📖 kiểm tra trùng chỉ ở tầng ứng dụng | Admin duyệt trùng, số liệu sai | Unique index một phần `(user_id, course_id) where status in ('pending','approved')` | XS |
| RK-08 | 🟡 | Server tin MIME do trình duyệt khai báo; file không phải ảnh đổi đuôi `.png` vẫn được lưu | 📖 `registerAction` | Admin thấy ảnh lỗi; lưu file rác | Đọc magic bytes / `sharp(buffer).metadata()` trước khi upload | S |
| RK-09 | 🟡 | Bài học tạo trước RV-05 có thể chứa link không hợp lệ; khi sửa bài đó admin buộc phải sửa link | 📖 | Admin bất ngờ bị báo lỗi | Chạy 1 truy vấn rà soát `lessons.video_url`; hiển thị cảnh báo trong trang admin | XS |
| RK-10 | 🟠 | E2E chạy trên Supabase trong `.env.local` (có thể là production) | 👁 Lần chạy lỗi giữa chừng từng để sót 2 khóa `[E2E]` (đã dọn; đã vá `cleanup()`) | Dữ liệu test lẫn vào dữ liệu thật; khách có thể thấy khóa test trong vài phút | Tạo project Supabase staging cho E2E | S |

### 7.1. Trạng thái xử lý risk case (cập nhật 26/09/2026)

| ID | Trạng thái | Cách xử lý | Kiểm thử |
| --- | --- | --- | --- |
| RK-01 | ✅ Đã sửa | `isValidEmail` từ chối mọi email đuôi `@sdt.hv.invalid` (không phân biệt hoa thường) → áp dụng cho form đăng ký và trang Tài khoản | TC-52 |
| RK-03 | ✅ Đã sửa | `registrations.user_id` nullable, FK `on delete set null`; server chặn duyệt đơn `user_id is null`; bảng admin hiện "(tài khoản đã xóa)"; cập nhật runbook | TC-54 |
| RK-05 | ✅ Đã chốt | Nghiệp vụ: đơn chờ duyệt của khóa ẩn **vẫn duyệt được**; khóa ẩn không có trong form đăng ký và server từ chối đơn mới → không phát sinh đơn mới (BR-39). Bảng admin ghi "(khóa đang ẩn)" | TC-13, TC-41, TC-53 |
| RK-07 | ✅ Đã sửa | Unique index một phần `registrations_active_key (user_id, course_id) where status in ('pending','approved')`; lỗi `23505` → thông báo thân thiện ở form đăng ký và khi admin duyệt lại đơn cũ | TC-48 |
| RK-09 | ✅ Đã sửa | Rà soát dữ liệu thật: 3/3 bài học có link hợp lệ. Admin thấy "N bài lỗi link video" ở danh sách khóa + cảnh báo đỏ ở bài; trang học không nhúng link lạ, hiện "Video bài học đang được cập nhật" | TC-47, TC-51 |
| Người xử lý | ✅ Mới | Trigger `registrations_stamp_review` ghi `reviewed_at`, `reviewed_by` (= `auth.uid()`), `reviewed_by_name` khi đổi trạng thái; không sửa tay được. Bảng admin có cột "Người xử lý" | TC-49, TC-50 |

Xác minh: schema đã chạy trên Supabase; E2E **53/53 PASS** (26/09/2026), dữ liệu test dọn sạch. Còn mở: RK-02, RK-04, RK-06, RK-08, RK-10 và RK-11 → RK-15 (§7.2).

### 7.2. Risk case mới – vòng review thứ 3 (nhiều admin, người xử lý)

Phát hiện khi review bản sửa ở §7.1, trong bối cảnh sắp có **nhiều tài khoản admin quyền ngang nhau**.

| ID | Mức | Risk case | Bằng chứng | Tác động | Đề xuất xử lý | Công sức |
| --- | --- | --- | --- | --- | --- | --- |
| RK-11 | 🟠 | Hai admin xử lý cùng một đơn từ trang cũ (VD admin A bấm Duyệt, admin B chưa tải lại và bấm Từ chối) → thao tác sau **ghi đè** thao tác trước, không cảnh báo | 📖 `setRegistrationStatus` chỉ lọc theo `id` | Học viên vừa được mở khóa lại bị khóa; cột "Người xử lý" chỉ còn người bấm sau | Truyền trạng thái đang thấy vào action, update thêm `.eq('status', expected)`; 0 dòng → "Đơn đã được admin khác xử lý, vui lòng tải lại trang." | XS |
| RK-12 | 🟡 | Chỉ lưu **lần xử lý gần nhất**: Duyệt → Thu hồi → Duyệt lại thì mất dấu ai làm gì trước đó | 📖 trigger ghi đè `reviewed_*` | Không truy vết được khi có tranh chấp thanh toán giữa các admin | Bảng `registration_events(registration_id, actor, actor_name, from_status, to_status, note, created_at)` do chính trigger ghi (gộp với R-05 `review_note`) | S |
| RK-13 | 🟡 | Admin tạo bằng script / sửa DB, không có trang quản lý admin; muốn biết ai đang có quyền hoặc gỡ quyền phải vào Supabase | 📖 BR-03 | Nhân viên nghỉ việc vẫn còn quyền duyệt | Tab "Admin" trong `/admin/users`, nút cấp/gỡ quyền (không tự gỡ chính mình, luôn còn ≥ 1 admin); thay đổi quyền ghi vào lịch sử | S |
| RK-14 | 🟡 | Mọi lỗi `23505` trong admin actions đều hiện thông báo "Học viên đã có một đơn khác…" | 📖 `dbErrors` dùng chung trong `run()` | Khi sau này thêm unique index cho bảng khác, thông báo sẽ sai ngữ cảnh | Cho `run()` nhận bảng thông báo lỗi riêng theo action | XS |
| RK-15 | 🔵 | Cập nhật trạng thái đơn bằng service role (script, webhook tự động R-08) → `reviewed_by`/`reviewed_by_name` = null, cột "Người xử lý" hiện "—" | 🔬 TC-50 | Không phân biệt "hệ thống tự duyệt" với dữ liệu cũ | Khi làm R-08: trigger ghi `reviewed_by_name = 'Hệ thống'` khi không có phiên đăng nhập | XS |

### 7.3. Trạng thái Đợt 3 – nhiều admin (cập nhật 26/09/2026)

| ID | Trạng thái | Cách xử lý | Kiểm thử |
| --- | --- | --- | --- |
| RK-11 | ✅ Đã sửa | `setRegistrationStatus(id, status, expected)`: update thêm `.eq('status', expected)`; 0 dòng → "Đơn đã thay đổi (có thể admin khác vừa xử lý), vui lòng tải lại trang." | TC-56 |
| RK-12 + R-05 | ✅ Đã sửa | Bảng `registration_events` do trigger ghi mỗi lần đổi trạng thái (admin chỉ đọc); cột `review_note`; Từ chối/Thu hồi có ô lý do; bảng admin hiện "Lý do" + "Lịch sử (n)"; học viên thấy lý do | TC-26, TC-30, TC-57 |
| RK-13 | ✅ Đã sửa | Trang Học viên: tab "Admin", nút Cấp/Gỡ quyền admin (có xác nhận, không có ở dòng của mình), "Cấp quyền bởi …". Trigger `profiles_guard_role`: chặn tự gỡ, khóa tuần tự + chặn gỡ admin cuối cùng, ghi `role_events` | TC-55, TC-58 (admin cuối cùng: G-12) |
| RK-14 | ✅ Đã sửa | `run(message, op, invalid, { notFound, errors })`: thông báo lỗi theo từng thao tác | TC-48, TC-56 |

Xác minh: schema Đợt 3 đã chạy trên Supabase; E2E **57/57 PASS** (26/09/2026), dữ liệu test dọn sạch.
Còn mở: chặn gỡ **admin cuối cùng** mới kiểm tra bằng đọc code (G-12, cần staging – RK-10).

### 7.4. Trạng thái Đợt 4 – vận hành an toàn & Đợt 5 – chống lạm dụng (cập nhật 26/09/2026)

| ID | Trạng thái | Cách xử lý | Kiểm thử |
| --- | --- | --- | --- |
| RK-10 | 🟡 Một phần | `npm run test:e2e` từ chối chạy nếu `E2E_SUPABASE_REF` ≠ mã project trong `NEXT_PUBLIC_SUPABASE_URL`; `scripts/env.mjs` nhận biến từ CI; hướng dẫn staging (runbook §1.1). **Chờ chủ dự án tạo project staging** (roadmap A-1) | Thủ công: chạy trên project hiện tại → bị từ chối |
| RV-10 (CI) | 🟡 Một phần | `.github/workflows/ci.yml`: job `check` (typecheck, lint, build – không cần Supabase), job `e2e` trên staging khi bật `E2E_ENABLED`; thêm script `npm run typecheck`. Chờ push / cấu hình secrets (A-2, A-3) | Thủ công: build với Supabase giả thành công |
| RV-13 | ✅ Đã sửa | `create index profiles_email_idx on profiles (email)` | Schema |
| RV-03 | ✅ Đã sửa | `lib/password.ts` (`MIN_PASSWORD_LENGTH = 8`) dùng cho 3 form + 3 server action + `create-admin`; tài khoản cũ vẫn đăng nhập được | TC-59 |
| RK-06 / RV-04 | ✅ Đã sửa (Turnstile chờ khóa) | Bảng `rate_limits` + hàm `hit_rate_limit` (chỉ service role): đăng ký 20/giờ/IP, sai mật khẩu 5 lần/15 phút/tài khoản+IP và 30/IP → khóa tạm, quên mật khẩu 10/giờ/IP. Turnstile bật khi có khóa (A-4) | TC-63, TC-64 |
| RK-08 | ✅ Đã sửa | `lib/image-type.ts`: nhận diện JPG/PNG/WEBP/HEIC theo magic bytes; MIME lưu theo nội dung | TC-60 |
| RK-04 | ✅ Đã sửa | Học viên: "Khóa học đã ngừng… hoàn tiền"; admin: tab "Khóa đã xóa – cần hoàn tiền" (chỉ hiện khi có đơn) → Từ chối kèm lý do | TC-61 |
| RV-16 | ✅ Đã sửa | `next.config.mjs`: CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS, tắt X-Powered-By. E2E bắt lỗi console nên vi phạm CSP sẽ làm test đỏ | TC-62, TC-46 (không lỗi JavaScript / vi phạm CSP) |

Xác minh: schema Đợt 4–5 đã chạy trên Supabase; E2E **63/63 PASS** (26/09/2026), dữ liệu test dọn sạch.
Còn mở sau Đợt 5: RK-02, RK-15, G-12 và các RV chưa làm – xem [roadmap.md](roadmap.md) §2–3.

### Đã kiểm tra – **không** phải rủi ro

| Nghi vấn | Kết quả |
| --- | --- |
| Open redirect qua `next=/\example.com`, `//example.com`, `/%5Cexample.com` | 🔬 Không khai thác được: luôn ở lại localhost (Next.js chuẩn hóa URL; `safeNext` chặn `//`) |
| Phiên đăng nhập cũ còn dùng được sau khi đặt lại mật khẩu | 🔬👁 Supabase thu hồi phiên cũ (TC-42 phải đăng nhập lại học viên 2 sau khi reset) |
| Học viên chưa mua đọc được khóa đang ẩn sau khi đổi policy | 🔬 TC-41, TC-42: khách và học viên chưa mua nhận 404 / 0 dòng |
| Đơn cũ thiếu snapshot sau khi chạy schema | 🔬 0 đơn có `course_title` null |
| Xóa tài khoản admin làm lỗi khóa ngoại `reviewed_by` (trigger chặn sửa người xử lý) | 📖 Trigger cho phép `reviewed_by` về null nên `on delete set null` chạy được; `reviewed_by_name` vẫn giữ |
| Unique index chặn đơn trùng không tạo được do dữ liệu cũ | 🔬 Trước khi chạy schema: 0 cặp trùng; TC-48 xác nhận index hoạt động |

## 8. Kế hoạch xử lý đề xuất

| Đợt | Hạng mục | Ước lượng |
| --- | --- | --- |
| ~~Ngay~~ | ~~RV-10 (git), RV-09, RV-01, RV-02, RV-05~~ – ✅ xong 26/09/2026 | — |
| ~~Tiếp theo~~ | ~~RK-01, RK-07, RK-05 (chốt), RK-09, RK-03~~ + người xử lý đơn (RV-11 một phần) – ✅ xong 26/09/2026 (xem §7.1) | — |
| ~~Đợt 3 – Nhiều admin~~ | ~~RK-11, RK-14, RK-12 + R-05, RK-13~~ – ✅ xong 26/09/2026, E2E 57/57 (xem §7.3) | — |
| ~~Đợt 4 – Vận hành an toàn~~ | ~~RK-10 (rào chặn + hướng dẫn staging), CI, RV-13, RV-03~~ – ✅ 26/09/2026, chờ chủ dự án tạo staging (xem §7.4) | — |
| ~~Đợt 5 – Chống lạm dụng & dữ liệu~~ | ~~RK-06 / RV-04, RK-08, RK-04, RV-16~~ – ✅ 26/09/2026 (xem §7.4) | — |
| **Tiếp theo** | Theo thứ tự trong [roadmap.md](roadmap.md) §3: Đợt 6 hoàn tất hạ tầng → Đợt 7 tài khoản & thông báo → Đợt 8 quy mô dữ liệu → … | — |

**Thứ tự ưu tiên (lịch sử)**: Đợt 4 tiếp theo – E2E hiện vẫn chạy trên database thật (RK-10), bộ test đã tạo/xóa tài khoản admin và đổi quyền;
có staging mới test được "admin cuối cùng" (G-12). Sau đó Đợt 5 (chống lạm dụng) trước khi quảng bá rộng.

### Chi tiết Đợt 3 (đã thực hiện – giữ làm tham chiếu)

| Hạng mục | Thay đổi | Kiểm thử E2E mới |
| --- | --- | --- |
| RK-11 | `setRegistrationStatus(id, status, expected)`; bảng admin truyền `r.status` vào action; update thêm `.eq('status', expected)` | 2 trang admin cùng mở; trang 1 duyệt, trang 2 bấm Từ chối → báo "đã được admin khác xử lý", trạng thái vẫn `approved` |
| RK-12 + R-05 | Bảng `registration_events` (RLS: admin đọc; không ai sửa/xóa), trigger ghi mỗi lần đổi trạng thái; cột `review_note`; form Từ chối/Thu hồi có ô lý do; bảng admin có nút "Lịch sử" | Duyệt → Thu hồi (kèm lý do) → Duyệt: lịch sử đủ 3 dòng đúng người; học viên thấy lý do |
| RK-13 | Tab "Admin" trong `/admin/users`, action `setUserRole` (chặn tự gỡ quyền và gỡ admin cuối cùng) | Admin cấp quyền cho học viên → học viên vào được /admin; gỡ quyền → bị chặn |
| RK-14 | `run(message, op, invalid, errors?)` | Nằm trong TC-48 / kiểm thử RK-11 |
