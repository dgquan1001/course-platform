# Báo cáo review dự án

- **Phạm vi**: `README.md`, `supabase/schema.sql`, toàn bộ `app/`, `components/`, `lib/`, `middleware.ts`, `scripts/`, cấu hình.
- **Ngày**: 26/09/2026 · **Phiên bản**: 0.1.0 → 0.2 · cập nhật 27/09/2026 (v0.2 Đợt 7 → 13, xem §7.5 – §7.6) · 29/09/2026 (review tài liệu, kế hoạch Đợt 15 – §7.7) · 02/10/2026 (hạ tầng gói Free, kế hoạch chạy thử – §7.8) · 04/10/2026 (chuyển Cloudflare Workers, thêm / sửa / xóa – §7.9; rà soát performance & security – §7.10) · 17/10/2026 (thiết kế lại trang chủ, Đợt 19 – §7.11; song ngữ + giao diện hiện đại, Đợt 20 – §7.12) · 18/10/2026 (khách hàng / nhân viên tách riêng, gỡ Vercel, rà soát rủi ro – Đợt 26, §7.16)
- **Phương pháp**: đọc mã nguồn, đối chiếu README với hành vi thực tế, phân tích RLS, luồng dữ liệu, bảo mật, khả năng mở rộng;
  mỗi đợt chạy `typecheck`, `lint`, `build`, E2E trên Supabase thật (kiểm tra cả API / RLS, không chỉ giao diện).

## 0. Tóm tắt hiện trạng (27/09/2026)

| Hạng mục | Hiện trạng |
| --- | --- |
| Chức năng | v0.2 hoàn tất (Đợt 7 → 13): 3 vai trò, 3 loại khóa, gói tháng + hạn học cộng dồn, buổi – bài + tiến độ, khách hàng từ Zalo, phiếu tham vấn, dashboard + doanh thu |
| Kiểm thử | 17/10 sau Đợt 19 (trang chủ mới): E2E **Node 101/101**, **Workers 102/102** (§7.11); 04/10 sau Đợt 17 P0 → P2: E2E **Node 99/99**, **Cloudflare Workers 100/100** (RK-54 ghi nhận riêng); 29/09 sau Đợt 15: 98/98; lỗi thật do E2E phát hiện và đã sửa trong v0.2: RK-22, RK-27, RK-28, và form khóa học theo tab (Đợt 11 → 13) |
| Bảo mật | RLS trên mọi bảng mới; dữ liệu sức khỏe chỉ nhân viên / admin + chính khách hàng (qua hàm); trigger chặn sửa tay gói / học phí / hạn / câu trả lời; nhân viên không tạo được đơn sai quy tắc qua API (RK-34) |
| Hiệu năng | ADR-016: middleware không gọi mạng khi token còn hạn, xác thực 1 lần / request, profile phía trình duyệt dùng chung; danh sách khách hàng / dashboard 1 lần gọi hàm SQL (theo dõi RK-30 khi > vài nghìn khách hàng) |
| Hạ tầng (02/10 → 04/10) | Supabase Free, keepalive + sao lưu tuần đang chạy (Đợt 16, A-14 ✅). **04/10: chốt chuyển web sang Cloudflare Workers Paid** (ADR-017, Đợt 17) thay Vercel; rà soát ảnh hưởng phát hiện **RK-43 🔴** (IP giả qua `X-Forwarded-For`) – §7.9 |
| Còn mở quan trọng | RK-43 → RK-52 (chuyển hạ tầng, thêm / sửa / xóa – §7.9), RK-20 (nội dung chính sách chờ duyệt – A-7), RK-33 (chưa có thông báo phiếu / lead mới), RK-10 (staging để sau), RK-35 / RK-37 (giới hạn gói Free – theo dõi), RV-20 (giám sát lỗi) |
| Tiếp theo | **Đợt 17** (chuyển Cloudflare: P0 → P1) → **Đợt 18** (thêm / sửa / xóa khách hàng & khóa học) → Đợt 17 P2 → P5 → tiếp **Đợt 14 – Chạy thử MVP (pilot)**, 7 giai đoạn ([roadmap §3.1](roadmap.md#31-đợt-14--chạy-thử-mvp-pilot--kế-hoạch-từng-bước), cách làm ở runbook §10) – tạm dừng ở bước 1.2 chờ Đợt 17; Đợt 15 – cải tiến giao diện ✅ 29/09 (§7.7); Đợt 16 – hạ tầng gói Free ✅ 02/10 (§7.8) |

Điểm đánh giá bên dưới (§1) là của bản 0.1 (26/09); v0.2 cải thiện: Kiểm thử 3.5 → 4.5 (96 bước, có kiểm tra API), Vận hành 3 → 3.5 (git, CI,
rào chặn E2E, runbook; còn thiếu staging, giám sát).

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

### 7.5. Review phiên bản 0.2 – Đợt 7 → 10 (cập nhật 27/09/2026)

Định vị lại sản phẩm (chương trình phục hồi chức năng cho khách hàng) – yêu cầu ở [project-overview §9](../00-overview/project-overview.md#9-định-vị-lại--phiên-bản-02-chốt-27092026),
kế hoạch ở [roadmap §4](roadmap.md#4-checklist-chi-tiết-theo-đợt-mới-nhất-ở-trên).

| Đợt | Nội dung | Trạng thái | Kiểm thử |
| --- | --- | --- | --- |
| 7 | Vai trò `staff` (ADR-011): `is_staff()`, RLS, trigger chỉ admin đổi vai trò, `/admin/registrations`, ô chọn vai trò, menu theo quyền | ✅ `c3d08a5` | E2E 67/67 (TC-65 → TC-67) |
| 8 | Loại khóa, nhóm bệnh, ảnh bìa, trang chủ 3 nhóm, `/khoa-hoc/[id]`, khóa miễn phí công khai, khách quan tâm premium + `/admin/leads`, Chính sách bảo mật + đồng ý (RV-17) | ✅ `1251587` (nội dung chính sách chờ A-7) | E2E 73/73 (TC-68 → TC-73) |
| 9 | Gói 1/3/6/12 tháng (`course_plans`), chọn gói khi đăng ký, snapshot gói trên đơn, hạn học cộng dồn do trigger tính, chỉ 1 đơn chờ duyệt / khóa, "Gói đã hết hạn" + gia hạn, cột Gói / Hạn học ở bảng đơn | ✅ `b46f232` + sửa RK-22 `da23361` | E2E 78/78 (TC-74 → TC-78) |
| 10 | Buổi → bài tập (`course_sessions`, `lessons.session_id`), khung N × M, quản lý buổi (↑↓, sao chép, xóa), `lesson_progress`, `can_view_lesson` (RLS bài học), `course_progress`, trình học kiểu Udemy, checklist tick / bỏ tick, mở buổi lần lượt, % tiến độ, "Tiếp tục Buổi X – Bài Y" | ✅ `c713566` + sửa RK-27 `fa16156`, RK-28 `0ff7b35` | E2E 83/83 (TC-79 → TC-84) |
| 11 → 13 | Xem §7.6 | ✅ | E2E 96/96 (TC-85 → TC-98) |

**Risk case mới phát hiện khi làm v0.2**

| ID | Mức | Risk case | Bằng chứng | Tác động | Xử lý / đề xuất |
| --- | --- | --- | --- | --- | --- |
| RK-16 | 🟡 | Thu hồi một đơn nằm giữa chuỗi gia hạn không dời hạn của các đơn sau → có "khoảng trống" | 📖 trigger tính hạn theo `max(access_until)` lúc duyệt | Khách hàng có thể mất vài ngày / tháng hạn học nếu nhân viên thu hồi nhầm rồi duyệt lại | Chấp nhận theo ADR-012. ✅ Đợt 11: nhân viên cấp gói bù ở hồ sơ khách hàng (số tiền 0đ, ghi chú lý do); runbook §6 |
| RK-17 | 🔵 | Chuyển hướng trong server component (`redirect()` ở trang khóa khi khách chưa đăng nhập, `/admin` → `/admin/registrations`) được thực hiện **phía trình duyệt** sau khi trang bắt đầu trả về | 👁 E2E Đợt 7, 8 phải chờ URL cuối | Không lộ dữ liệu (nội dung trả phí không render), chỉ thêm 1 bước tải | Chấp nhận. Có thể chuyển các kiểm tra này vào middleware nếu cần mã 307 thật (VD SEO) |
| RK-18 | 🟡 | `courses.price` của chương trình chỉ dùng để tạo sẵn gói 1 tháng khi tạo khóa; sửa ô "Giá" sau đó **không** đổi giá gói | 📖 `createCourse`, `PlanTable` | Admin có thể nhầm tưởng đã đổi học phí | ✅ 27/09 (chủ dự án chốt): form sửa chương trình không còn ô Giá, `updateCourse` giữ nguyên `price` khi không gửi ô Giá (E2E TC-95) |
| RK-19 | 🟡 | Chương trình tắt / xóa hết gói → không nhận đăng ký, khách hàng không tự gia hạn được trên web | 📖 `getRegistrableCourses` | Mất doanh thu gia hạn nếu admin tắt nhầm | Bảng gói cảnh báo đỏ "chưa có gói". Đợt 11: nhân viên cấp gói được cho cả chương trình đang ẩn, nhưng vẫn cần ít nhất 1 gói đang bán (form cấp gói báo "Chưa có chương trình nào đang bán gói") |
| RK-20 | 🟠 | Nội dung Chính sách bảo mật do đội phát triển soạn, có cam kết (thời hạn lưu, phản hồi 72 giờ) chưa được trung tâm / pháp lý duyệt | 📖 `app/chinh-sach-bao-mat/page.tsx` | Rủi ro pháp lý khi thu thập dữ liệu sức khỏe | Chủ dự án duyệt trước khi quảng bá (roadmap A-7) |
| RK-22 | 🔴 | Trigger Đợt 9 khóa cột `plan_id` / `created_by` với người đăng nhập → khi admin xóa chương trình đã có đơn, khóa ngoại `on delete set null` bị trigger trả lại giá trị cũ → **không xóa được khóa học** | 👁 E2E TC-44 đỏ lần chạy đầu Đợt 9 | Admin không xóa được chương trình có đơn / không xóa được tài khoản nhân viên đã tạo đơn | ✅ Đã sửa: 2 cột này được phép về null (như `reviewed_by`); chạy lại schema |
| RK-27 | 🔴 | `can_view_lesson` tra bài học trong bảng trước khi xét nhân viên / admin; khi admin **thêm** bài, RLS kiểm tra dòng vừa thêm (câu `insert … returning`) mà truy vấn trong hàm chưa thấy dòng đó → "new row violates row-level security policy" → **admin không thêm được bài học** | 👁 E2E Đợt 10 (bước thêm bài khóa A) + 🔬 thử trực tiếp | Không soạn được nội dung | ✅ Đã sửa: xét `is_staff()` trước; policy `lessons_select using (is_staff() or can_view_lesson(id))`; chạy lại schema |
| RK-28 | 🟠 | Bài học **chưa thuộc buổi nào** (dữ liệu nhập tay / cũ, `session_id` null) đứng **đầu** đề cương và được chọn làm "bài tiếp theo" (`course_outline` sắp `nulls first`, `course_progress` coi vị trí buổi = 0) | 👁 E2E Đợt 10 (bước bài có link video cũ, TC-51: trình học hiện "Bài 1/1") | Khách hàng bị dẫn vào bài lạc chỗ trước Buổi 1 | ✅ Đã sửa: `course_outline` `order by s.pos nulls last`, `course_progress` coi bài không buổi đứng sau mọi buổi và luôn tính vào tổng (không bị giới hạn số buổi đã mua); chạy lại schema |
| RK-23 | 🟡 | Buổi **không có bài** nằm giữa 2 buổi: database coi buổi rỗng là "đã xong" nên mở buổi sau nó, trong khi giao diện xét buổi có bài liền trước → hiển thị khóa / mở có thể lệch | 📖 `can_view_lesson`, `buildSessions` | Hiếm (khung tạo nhanh luôn có bài); khách hàng thấy 🔒 nhưng vẫn mở được bài | Cảnh báo "Buổi chưa có bài tập" ở trang admin; nếu cần, cho `buildSessions` nhận cả buổi rỗng |
| RK-24 | 🟡 | `can_view_lesson` chạy cho **từng dòng** bài học (RLS): khóa rất nhiều bài × nhiều buổi có thể chậm khi khách hàng đọc cả danh sách | 📖 | Hiện chỉ đọc 1 bài / trang (đề cương qua `course_outline`) nên không ảnh hưởng | Theo dõi khi có khóa > 500 bài; tránh `select` toàn bộ `lessons` phía khách hàng |
| RK-25 | 🔵 | Tiến độ dựa trên khách hàng **tự tick** (video YouTube / TikTok nhúng, không biết đã xem hết) | 📖 ADR-013 | Tiến độ có thể không phản ánh việc tập thật | Chấp nhận; nhân viên theo dõi qua phiếu tham vấn (Đợt 12) và lần tập gần nhất (Đợt 13) |
| RK-26 | 🟡 | Xóa buổi xóa luôn bài và tiến độ đã tick của các bài đó (cascade) | 📖 | Khách hàng mất tiến độ nếu admin xóa nhầm | Hộp xác nhận nêu rõ; sao lưu trước khi sửa lớn nội dung |
| RK-21 | 🟡 | Tính hạn "+ N tháng" theo lịch UTC của Postgres: duyệt ngày 31 → tháng sau không có ngày 31 thì về ngày cuối tháng | 📖 `make_interval(months => n)` | Chênh 1–3 ngày ở cuối tháng, hiển thị theo giờ Việt Nam | Chấp nhận; ghi chú trong BR-80 |

Xác minh Đợt 7, 8, 9, 10: schema đã chạy trên Supabase, E2E PASS (67 → 73 → 78 → 83 bước), dữ liệu test dọn sạch. RK-22 (Đợt 9), RK-27 và RK-28 (Đợt 10) phát hiện nhờ E2E và đã sửa trong cùng đợt.
Còn mở từ v0.2 (tại thời điểm Đợt 10): RK-18, RK-16/RK-19 – đã xử lý ở Đợt 11 → 13 (§7.6); RK-23, RK-24 (theo dõi), RK-20 (chờ A-7).
Còn mở từ trước: RK-02, RK-10 (staging), RK-15, G-12.

### 7.6. Review Đợt 11 → 13 + cải tiến (cập nhật 27/09/2026)

| Đợt | Nội dung | Trạng thái | Kiểm thử |
| --- | --- | --- | --- |
| 11 | Khách hàng từ Zalo (ADR-014): `/admin/customers` (lọc nguồn / trạng thái gói / mới / không tập, % tiến độ), tạo khách hàng + mật khẩu tự sinh hiện 1 lần + tin nhắn Zalo, cấp gói / gia hạn (tiền mặt, chuyển khoản, khác, ảnh tùy chọn), sửa thông tin + ghi chú nội bộ (`patient_notes`), cấp lại mật khẩu, nhắc đổi mật khẩu, nhật ký `account_events` | ✅ | TC-85 → TC-88, TC-96 |
| 12 | Phiếu tham vấn (ADR-015): mẫu câu hỏi do admin soạn, form phiếu (5 / ngày), nút ở trình học / Khóa học của tôi / thẻ chúc mừng / gói sắp hết hạn, "Phiếu tham vấn của tôi" (`my_consultations()`), `/admin/consultations` | ✅ | TC-89 → TC-92 |
| 13 | Dashboard: `dashboard_stats()`, `revenue_report()` (chỉ admin), 8 thẻ chỉ số, việc cần làm, tiến độ theo chương trình, không tập > 7 ngày, doanh thu 4 chiều | ✅ | TC-93, TC-94 |
| + | `/admin/courses` chia theo loại; RK-18; hiệu năng middleware / xác thực (ADR-016) | ✅ | TC-95, TC-97, TC-98 |

**Risk case mới – vòng review Đợt 11 → 13**

| ID | Mức | Risk case | Bằng chứng | Tác động | Xử lý / đề xuất |
| --- | --- | --- | --- | --- | --- |
| RK-29 | 🔴 | Trigger `stamp_lead` (Đợt 8) trả lại `course_id` / `user_id` cũ → khi xóa khóa premium có lead hoặc xóa tài khoản đã để lại lead, khóa ngoại `on delete set null` bị trigger chặn → **không xóa được** (cùng loại RK-22). E2E cũ không bắt được vì bước dọn dữ liệu xóa lead trước | 📖 rà soát trigger khi viết `consultations_stamp` | Admin không xóa được khóa premium / tài khoản | ✅ Đã sửa: 2 cột chỉ được về null; áp dụng cùng quy tắc cho `consultations_stamp`, `patient_notes_stamp`. Thêm mục vào checklist bảo mật §8 + development-guide. E2E TC-98: xóa khóa premium còn lead, xóa tài khoản đã gửi phiếu |
| RK-30 | 🟡 | `_patient_courses()` tính tiến độ mọi cặp (khách hàng, chương trình) mỗi lần mở danh sách khách hàng / dashboard | 📖 | Chậm dần khi > vài nghìn khách hàng × nhiều bài | Hiện nhỏ, 1 lần gọi. Khi cần: bảng tổng hợp cập nhật bằng trigger `lesson_progress` hoặc materialized view làm mới định kỳ |
| RK-31 | 🔵 | Sau ADR-016, chuyển hướng theo vai trò (nhân viên mở trang chỉ admin, khách hàng mở `/admin`) xảy ra khi trang render (phía trình duyệt) thay vì mã 307 ở middleware | 👁 E2E chờ URL cuối | Không lộ dữ liệu; thêm 1 bước tải | Chấp nhận (đổi lại middleware nhẹ); ghi trong ADR-016 |
| RK-32 | 🔵 | Doanh thu tính theo `reviewed_at` của đơn đang `approved`: thu hồi rồi duyệt lại → doanh thu chuyển sang tháng duyệt lại; đơn web tính theo giá gói, không phải số tiền thực chuyển | 📖 `revenue_report` | Lệch nhỏ khi đối soát | Chấp nhận; ghi chú dưới số liệu doanh thu. Khi làm R-08 lưu số tiền thực nhận |
| RK-33 | 🟡 | Không có thông báo khi có đơn / phiếu tham vấn / lead mới – nhân viên phải mở Tổng quan | 📖 | Phiếu tham vấn (dữ liệu sức khỏe, có thể cần gọi sớm) bị chậm xử lý | Backlog ưu tiên 1 (R-01): email tóm tắt / Zalo OA; tạm thời: quy trình mở Tổng quan đầu mỗi ca |
| RK-34 | 🟡 | Nhân viên gọi thẳng API có thể "cấp gói" cho **tài khoản nhân viên / admin** (giao diện chỉ cho khách hàng) → doanh thu ảo, số liệu dashboard sai | 📖 rà soát policy `registrations_staff_insert` | Sai báo cáo doanh thu | ✅ Đã sửa: trigger `registrations_stamp_insert` chỉ nhận tài khoản `role = 'user'` (E2E TC-96) |

Kiểm tra thêm trong vòng này – **không** phải rủi ro:

| Nghi vấn | Kết quả |
| --- | --- |
| Khách hàng đọc được ghi chú nội bộ qua API | 🔬 E2E: `patient_notes`, `account_events`, `consultations` trả 0 dòng với phiên khách hàng; `my_consultations()` không có `staff_note` |
| Khách hàng / khách gọi được hàm quản trị | 🔬 `admin_patients` rỗng, `dashboard_stats` null, `patient_progress` rỗng, `_patient_courses` bị từ chối, `revenue_report` lỗi với nhân viên |
| Nhân viên sửa câu trả lời phiếu / thông tin khách để lại | 🔬 Trigger giữ nguyên (E2E) |
| Mật khẩu cũ còn dùng được sau khi cấp lại | 🔬 E2E: mật khẩu cũ bị từ chối, mật khẩu mới đăng nhập được |
| Form tạo trùng SĐT tạo tài khoản dở dang | 🔬 Kiểm tra trùng trước khi tạo; lỗi sau khi tạo thì xóa tài khoản vừa tạo |

Xác minh Đợt 11 → 13: schema đã chạy trên Supabase, `typecheck` / `lint` / `build` sạch, E2E **96/96 PASS**, dữ liệu test dọn sạch.
Các lần chạy trước đỏ: (1) **lỗi thật** – form "Thêm khóa học" không đổi loại chọn sẵn khi chuyển tab bằng link (component được giữ lại) → sửa bằng `key` theo tab;
(2) locator của test bắt nhầm ô giá trong bảng Gói; (3) từ khóa tìm khách hàng (SĐT test) trùng dãy số trong email test của khách hàng khác → test tìm theo tên. (2), (3) là lỗi của test.

### 7.7. Review tài liệu & yêu cầu giao diện (29/09/2026)

**Review README, roadmap, project-review** – đối chiếu với code hiện tại:

| Phát hiện | Xử lý |
| --- | --- |
| README (mục Quản trị) còn câu "Khóa học: … **đặt giá**" – từ RK-18 giá chương trình chỉ sửa ở bảng gói | ✅ Sửa câu (29/09) |
| project-review §7.5 trỏ tới mục roadmap "§3 Lộ trình gợi ý…" không còn tồn tại (link hỏng) | ✅ Trỏ tới roadmap §4 |
| project-review §7.5 dòng "Còn mở từ v0.2" vẫn ghi RK-16, RK-18, RK-19 đang chờ – đã xử lý ở Đợt 11 → 13 | ✅ Ghi rõ "tại thời điểm Đợt 10" |
| sitemap §6.3 thiết kế `AdminNav` có số đếm (đơn chờ, phiếu mới, khách mới) và nút "+ Tạo khách hàng" – code chưa có | Đưa vào Đợt 15 (UI-02, tùy chọn) |
| Số liệu E2E 96/96, trạng thái Đợt 7 → 13, việc chủ dự án A-x, backlog | ✅ Khớp giữa README – roadmap – project-review |

**Yêu cầu giao diện của chủ dự án (29/09/2026)** – kế hoạch chi tiết và các điểm chủ dự án đã chốt ở [roadmap §3.0](roadmap.md#30-đợt-15--cải-tiến-giao-diện-yêu-cầu-chủ-dự-án-29092026---kế-hoạch-đã-chốt):

| Mã | Yêu cầu | Rủi ro / lưu ý khi làm |
| --- | --- | --- |
| UI-01 | Icon mắt hiện / ẩn mật khẩu | Nút mắt phải là `type="button"` (không gửi form); trình quản lý mật khẩu vẫn nhận `autoComplete`; không lưu trạng thái "hiện" giữa các lần tải trang |
| UI-02 | Menu quản trị dọc bên trái, Khóa học lên thứ 4 | Sidebar chiếm ~220px → bảng Đơn đăng ký 11 cột bị hẹp hơn (cột Thao tác vẫn cố định bên phải); cần giữ `aria-label="Menu quản trị"` (E2E dùng); số đếm trên menu thêm truy vấn mỗi lần mở trang admin – phải giữ nhẹ theo ADR-016 |
| UI-03 | Vòng tròn % tiến độ | Vòng tròn chiếm chiều cao hơn thanh → bố cục dòng "không tập > 7 ngày" và header trình học phải chỉnh; giữ `role="progressbar"` cho trình đọc màn hình; E2E TC-81, TC-84 đang kiểm tra chữ "x/y bài · %" cần sửa theo |

**Kết quả Đợt 15 (29/09/2026)** – ✅ cả 3 yêu cầu; `typecheck` / `lint` / `build` sạch; E2E **98/98 PASS** ngay lần chạy đầu (TC-99 → TC-101), không đổi schema.

| Mã | Đã làm | Ghi chú review |
| --- | --- | --- |
| UI-01 | `components/PasswordInput.tsx` cho 7 ô (đăng nhập, đăng ký, quên mật khẩu ×2, tài khoản ×3); giữ nguyên `id`, `name`, `autoComplete` | Nút `type="button"` + `aria-pressed`; không đổi hành vi gửi form (E2E) |
| UI-02 | `app/admin/layout.tsx` sidebar trái ≥ 1024px (sticky), tab cuộn ngang trên điện thoại; `AdminNav` thứ tự mới + icon; `NavCount` đếm đơn chờ / phiếu mới / khách mới (bọc `Suspense`, không chặn trang) | 3 truy vấn `count` nhẹ mỗi lần tải trang admin (không gọi `dashboard_stats()` – tránh RK-30). Trang admin 2 cột chuyển mốc chia cột `lg` → `xl` để không chật. Số đếm không tự cập nhật theo thời gian thực (RK-33 vẫn mở) |
| UI-03 | `components/ProgressRing.tsx` (SVG, 2 cỡ) thay `ProgressBar` ở 5 chỗ + cột tiến độ danh sách khách hàng (tiến độ trung bình) | "Tiến độ theo chương trình" ở Tổng quan **giữ thanh ngang**: đó là so sánh nhiều chương trình, thanh dễ so hơn vòng tròn |

Không phát sinh risk case mới.

### 7.8. Đánh giá hạ tầng – quy mô 500 người học cùng lúc (02/10/2026)

**Yêu cầu chủ dự án**: tối đa 100–500 người học cùng lúc, database lưu tới 1.000 người. **Giai đoạn đầu** (thử nghiệm hiệu quả) chỉ vài chục
người cùng lúc → chủ dự án chốt chạy **Supabase Free + Vercel Hobby**, chuyển gói theo ngưỡng ([roadmap §3.3](roadmap.md#33-lộ-trình-hạ-tầng--chuyển-gói-chủ-dự-án-chốt-02102026)).

**Kết luận**: kiến trúc chịu được 500 người cùng lúc – video ở YouTube / TikTok (không tốn băng thông của mình), trang công khai ISR,
mọi truy vấn qua PostgREST (không cạn kết nối database từ serverless). Giới hạn nằm ở **gói dịch vụ** và vài cấu hình ứng dụng.

**Ước tính tải** (500 cùng lúc / 1.000 khách hàng): 3–8 request động/giây (cao điểm 10–20), 20–100 truy vấn/giây; database < 100 MB/năm;
ảnh chuyển khoản ~2 GB/năm; băng thông web 25–40 GB/tháng. Sức chứa gói Free chi tiết: [runbook §12.1](../09-operations/deployment-runbook.md#121-gói-free-chứa-được-bao-nhiêu)
– khoảng 50 người cùng lúc, 300–500 khách hàng hoạt động.

| ID | Mức | Risk case | Bằng chứng | Tác động | Xử lý / đề xuất |
| --- | --- | --- | --- | --- | --- |
| RK-35 | 🟠 | Vercel Hobby chỉ cho mục đích **phi thương mại**; trung tâm thu tiền gói | 📖 điều khoản Vercel | Có thể bị khóa dự án | 🟡 04/10: chuyển sang Cloudflare Workers Paid (ADR-017, Đợt 17) – đóng khi cutover xong |
| RK-36 | 🔴 | Supabase Free **tạm dừng sau 7 ngày** không truy cập, **không có backup** | 📖 runbook §7 | Website ngừng; mất dữ liệu sức khỏe / thanh toán nếu sự cố | ✅ Đợt 16: `keepalive.yml` (3 ngày / lần), `backup.yml` (DB hằng tuần, Storage hằng tháng, mã hóa AES-256, giữ 90 ngày) – chạy thật thành công 02/10 |
| RK-37 | 🟡 | Storage Free 1 GB ≈ 2.000 ảnh chuyển khoản tích lũy | 📖 ảnh nén ~0,5 MB; ảnh HEIC trên Chrome không nén được | Hết chỗ → không đăng ký / gia hạn được | Theo dõi hằng tháng (A-16); > 600 MB → Supabase Pro |
| RK-38 | 🟠 | Không có `vercel.json` → hàm server có thể chạy ở vùng mặc định (Mỹ) trong khi Supabase ở Singapore; mỗi trang 3–6 lượt gọi qua lại | 📖 | Mỗi trang chậm thêm 1–2 giây, khó đạt NFR-16 | ✅ Đợt 16: `vercel.json` `regions: ["sin1"]`. Chờ A-15 xác nhận vùng Supabase |
| RK-39 | 🟡 | Giới hạn **30 lần đăng nhập sai / IP / 15 phút**, 20 đơn / IP / giờ; mạng di động Việt Nam dùng CGNAT (nhiều thuê bao chung IP), Wi-Fi phòng khám cũng vậy | 📖 `lib/rate-limit.ts` | Giờ cao điểm, lỗi gõ sai của nhiều người cộng dồn → khóa cả IP 15 phút | Giai đoạn 2: nới giới hạn theo IP (VD 150), giữ giới hạn theo tài khoản là chính, bật Turnstile (A-4) |
| RK-40 | 🟡 | Đăng nhập chạy phía server (`signInWithPassword` trong server action) → Supabase Auth thấy mọi lượt đăng nhập từ vài IP của Vercel; Auth có giới hạn theo IP | 📖 `app/login/actions.ts` | 300–500 người đăng nhập trong vài phút đầu buổi có thể bị "quá nhiều yêu cầu" | Giai đoạn 2: kiểm tra / nâng Supabase › Auth › Rate Limits; thử tải trước giai đoạn 3 |
| RK-41 | 🟡 | Danh sách admin chỉ hiện **200 dòng** (đơn, khách hàng, phiếu, khách) – RV-12 | 📖 `.limit(200)` / `p_limit: 200` | > 200 khách hàng: nhân viên không thấy đủ | Giai đoạn 2 (backlog 2b, R-06) – **bắt buộc trước khi tới 1.000 khách hàng** |
| RK-42 | 🔵 | Gmail SMTP ~500 thư/ngày | 📖 | Chưa ảnh hưởng (chỉ quên mật khẩu) | Khi làm R-01: Google Workspace / dịch vụ gửi thư |

Không phải rủi ro ở quy mô 1.000 khách hàng: RK-30 (dashboard chỉ vài nhân viên mở), RK-24, kết nối database.

**Kết quả Đợt 16 (02/10/2026)**: `vercel.json`, `keepalive.yml`, `backup.yml`, `scripts/backup-storage.mjs`; không đổi schema / giao diện
nên không chạy lại E2E. `npm run backup:storage` chạy thử trên project hiện tại: 4 file / 2 bucket, giữ đúng đường dẫn. YAML hợp lệ,
typecheck / lint sạch.

**Chạy thật trên GitHub (02/10/2026)**: lần chạy đầu "Sao lưu production" lỗi ở bước ảnh Storage – `@supabase/supabase-js` 2.117 cần
**Node 22+** ("native WebSocket not found") trong khi workflow đặt Node 20 (lỗi của dev; bước dump database đã qua). Sửa `aea7eb1`:
mọi workflow dùng Node 22, `package.json` `engines.node >= 22` (Vercel cũng phải chạy Node 22+). Sau khi sửa, chủ dự án chạy thử thành công
cả 2 workflow → **RK-36 đóng**, A-14 ✅. Còn lại: thử khôi phục bản sao lưu vào một project trống 1 lần (có thể dùng staging – A-1).

### 7.9. Rà soát chuyển hạ tầng sang Cloudflare Workers (04/10/2026)

**Bối cảnh**: chủ dự án chốt Supabase Free + Cloudflare Workers Paid (ADR-017) vì chi phí và lợi ích lâu dài; đồng thời yêu cầu thêm / sửa / xóa ở
danh sách khách hàng và khóa học (Đợt 18). Rà soát toàn bộ `app/`, `lib/`, `middleware.ts`, `next.config.mjs`, `scripts/`, workflow, schema
(khóa ngoại khi xóa tài khoản / khóa học). Bảng ảnh hưởng đầy đủ I-01 → I-32 và checklist CF-01 → CF-41:
[cloudflare-migration.md](../09-operations/cloudflare-migration.md).

| ID | Mức | Risk case | Bằng chứng | Tác động | Xử lý / đề xuất |
| --- | --- | --- | --- | --- | --- |
| RK-43 | 🔴 | `clientIp()` lấy phần tử **đầu** `x-forwarded-for`. Cloudflare giữ header người dùng gửi và nối IP thật vào cuối → người dùng tự đặt được IP | 📖 `lib/rate-limit.ts:24-27`; tài liệu header Cloudflare | Vượt giới hạn đăng nhập sai / đăng ký / gửi mã quên mật khẩu / lead; `remoteip` Turnstile sai | Đợt 17 P2: dùng `cf-connecting-ip`; TC-102 giả header vẫn bị chặn. **Bắt buộc trước khi chạy thật trên Cloudflare** |
| RK-44 | 🟠 | OpenNext đã ngừng hỗ trợ Next 14 → phải nâng Next 15 / React 19 | 📖 tài liệu OpenNext; `package.json` | 19 file đổi API async, 5 file đổi hook form; lỗi ngầm nếu sót | Đợt 17 P1 tách riêng, E2E 98/98 trên Node trước khi đụng Cloudflare |
| RK-45 | 🟠 | Trang ISR (`revalidate = 300` ×3) + ~22 lần `revalidatePath` cần cache R2 + tag cache D1 + queue DO | 📖 tài liệu OpenNext caching | Thiếu cấu hình → trang chủ không làm mới sau khi admin sửa khóa, hoặc render động mỗi lần | Đợt 17 P2.2; TC-103 |
| RK-46 | 🟠 | Email `nodemailer` (SMTP/TCP) chưa chắc chạy trên workerd; hộp thư giả E2E dùng `fs` | 📖 `lib/mailer.ts` | Quên mật khẩu hỏng; E2E không đọc được mã | P0 thử thật; dự phòng Resend (HTTP); hộp thư giả qua HTTP |
| RK-47 | 🟡 | `next/image` trên Workers cần binding Images (tính phí) | 📖 3 chỗ dùng | Ảnh bìa lỗi / phát sinh phí | Giai đoạn đầu `unoptimized` (ảnh đã nén ở trình duyệt) |
| RK-48 | 🟠 | `NEXT_PUBLIC_*` nhúng lúc build, khóa bí mật lúc chạy; CSP đọc URL Supabase lúc build | 📖 `next.config.mjs` | Sai chỗ → CSP chặn Supabase, trang lỗi, hoặc lộ service role nếu ghi vào file cấu hình | Bảng biến ở cloudflare-migration P3.4; CF-12 |
| RK-49 | 🟡 | Đổi URL website: Supabase Site URL, Turnstile hostname, `NEXT_PUBLIC_SITE_URL`, ảnh chia sẻ, chính sách bảo mật ghi "Vercel" | 📖 `app/chinh-sach-bao-mat/page.tsx:86` | Link sai, Turnstile lỗi, thông tin pháp lý sai | P5 + CF-24, CF-35, CF-38 |
| RK-50 | 🟠 | E2E hiện chạy `next start` (Node) – PASS trên Node không bảo đảm chạy trên workerd | 📖 `scripts/e2e.mjs` | Lỗi chỉ lộ ra trên production | E2E chế độ workers (`opennextjs-cloudflare preview`) là chuẩn nghiệm thu |
| RK-51 | 🟠 | Chưa có khóa / xóa khách hàng; xóa tài khoản sẽ cascade tiến độ, ghi chú; phiếu tham vấn (dữ liệu sức khỏe) còn lại với `user_id = null` | 📖 `schema.sql` khóa ngoại | Không đáp ứng yêu cầu xóa dữ liệu; xóa nhầm mất tiến độ | Đợt 18 QL-03 / QL-04: khóa trước, xóa chỉ admin + điều kiện + gõ SĐT; Q-5 |
| RK-52 | 🟠 | Xóa khóa học được cả khi còn học viên có gói còn hạn (chỉ cảnh báo) | 📖 `app/admin/courses/page.tsx:136-143` | Khách hàng đã trả tiền mất khóa đang học | Đợt 18 QL-08: chặn ở server + database, gợi ý Ẩn (Q-7) |
| RK-53 | 🔴 | *(phát hiện khi chạy E2E sau khi nâng Next 15)* Bấm tab ở **Đơn đăng ký** (`?status=`) không chuyển trang: router Next 15.5 hủy điều hướng khi nhánh `/admin` có `loading.tsx`, trang chỉ đổi tham số và dữ liệu đủ lớn (trang nhỏ như Khách quan tâm không bị) | 🔬 E2E bước "Đơn đăng ký hiển thị dạng bảng…" đỏ 2 lần; tái hiện bằng tài khoản admin tạm: RSC trả 200 rồi bị hủy, không tải lại trang; thu hẹp 10 bản build: bỏ ảnh / form / lịch sử vẫn lỗi, 0 dòng thì chạy, thêm chữ dài vào bản tối giản thì lỗi, tắt middleware vẫn lỗi, **bỏ `app/admin/loading.tsx` thì hết** | Nhân viên không lọc được đơn theo trạng thái; khách hàng không chuyển được sang bài tiếp theo | ✅ Đợt 17: xóa `app/admin/loading.tsx` và `app/courses/loading.tsx` (cùng lỗi: bấm "Hoàn thành & bài tiếp theo" không chuyển bài – E2E Node lần 3); thanh tiến trình vẫn báo đang tải; ghi chú trong `app/admin/layout.tsx`, runbook §8 |
| RK-54 | 🟡 | *(chỉ khi chạy trên workerd của `wrangler dev`)* Lỗi hydration React #418 lác đác ở trang quản trị `/admin/**` (8 – 13 lần / lượt E2E, mỗi lượt ~150 lần mở trang quản trị); React tự dựng lại trang phía trình duyệt, **mọi chức năng vẫn đúng** (99/99 bước) | 🔬 Đã loại trừ (04/10): định dạng ngày / số (`Intl` của workerd giống Node), ký tự UTF-8 bị cắt (0 ký tự U+FFFD trong HTML trình duyệt nhận), dữ liệu RSC lệch HTML (khớp), số đếm menu stream qua Suspense (đếm sẵn vẫn lỗi – đã hoàn tác), Playwright chặn yêu cầu tải trang (chỉ chặn POST vẫn lỗi). Không lỗi trên Node (`next start`) và ở `/courses` | Trang quản trị dựng lại phía trình duyệt: chậm hơn một chút, có thể nháy | 🟡 Mở – E2E chế độ workers ghi nhận riêng (không làm đỏ test); **kiểm lại trên Cloudflare thật** (checklist CF-41) – nếu còn: thử bản Next / OpenNext mới hơn, hoặc build React development phía trình duyệt để xem phần lệch |

**Kết quả Đợt 17 P0 → P2 (04/10/2026)**: code chạy được trên Cloudflare Workers (bản giả lập workerd của wrangler) – E2E **100/100** (TC-102, TC-103 mới), Node **99/99**, `next dev` chạy bình thường. Lỗi thật phát hiện nhờ E2E: **RK-53** (đã sửa), RK-54 (mở, không ảnh hưởng chức năng); thêm 2 lỗi nhỏ do Next 15: prefetch trang giới thiệu khóa đang ẩn gây 404 trong console (`prefetch={false}`), trang `/khoa-hoc/[id]` mất ISR (thêm `generateStaticParams`). Đã deploy (04/10 từ máy; **06/10 tự động từ `main` qua Workers Builds**, PR #8) – https://hv-web.bsdomanhcuong.workers.dev; chủ dự án nghiệm thu 06/10.

**Không phải rủi ro khi chuyển**: `keepalive.yml`, `backup.yml`, script sao lưu / tạo admin (gọi thẳng Supabase); kết nối database (qua
PostgREST, không cần Hyperdrive); phông chữ (tự host lúc build); thời gian chạy (CPU 30 giây / request trên gói Paid); `crypto` / `Buffer`
(có trong `nodejs_compat` – vẫn kiểm tra bằng E2E).

### 7.10. Rà soát performance & security toàn dự án (04/10/2026, sau khi deploy Cloudflare)

**Phạm vi**: toàn bộ `app/`, `lib/`, `middleware.ts`, `next.config.mjs`, `wrangler.jsonc`, `open-next.config.ts`, `scripts/`, `supabase/schema.sql`,
cấu hình Supabase Auth (đọc `/auth/v1/settings`), website thật `https://hv-web.bsdomanhcuong.workers.dev` (đo bằng `curl`), `npm audit`.

**Security**

| ID | Mức | Phát hiện | Bằng chứng | Xử lý |
| --- | --- | --- | --- | --- |
| SEC-01 | 🟠 | Supabase **cho phép đăng ký công khai** (`disable_signup: false`) – ai có khóa `anon` (công khai trong trang) gọi được `/auth/v1/signup` tạo tài khoản, bỏ qua form đăng ký, giới hạn tần suất và Turnstile của website | 🔬 `GET /auth/v1/settings`; website không dùng `signUp` (mọi tài khoản tạo bằng service role) | ✅ 06/10/2026 (A-24): chủ dự án tắt **Allow new users to sign up**; dev kiểm `disable_signup: true` |
| SEC-02 | 🟡 | Quên mật khẩu / form khách quan tâm trả **nguyên văn lỗi kỹ thuật** cho khách (VD lỗi SMTP lộ máy chủ thư, lỗi database) | 📖 `app/forgot-password/actions.ts`, `app/khoa-hoc/actions.ts` | ✅ Thông báo chung cho khách, chi tiết ghi `console.error` → Workers Logs |
| SEC-03 | 🟡 | Module chỉ dành cho server (service role, gửi mail, giới hạn tần suất, sinh mật khẩu, tìm tài khoản) chưa có rào chặn import nhầm vào client | 📖 | ✅ `import 'server-only'` ở `lib/supabase/admin.ts`, `lib/rate-limit.ts`, `lib/mailer.ts`, `lib/smtp-workers.ts`, `lib/generate-password.ts`, `lib/accounts.ts` – import nhầm thì build lỗi |
| SEC-04 | ✅ | Khóa `service_role` không lọt vào file gửi trình duyệt | 🔬 tìm 30 ký tự cuối của khóa trong `.open-next/assets`, `.next-e2e/static`, `public/`: 0 kết quả (khớp phần đầu chỉ là JWT header chung với khóa `anon`) | — |
| SEC-05 | ✅ | RLS bật **16/16 bảng**; mọi hàm `security definer` có `set search_path`; hàm quản trị chỉ cấp cho `authenticated` và tự kiểm vai trò (TC-96) | 🔬 quét `schema.sql` | — |
| SEC-06 | ✅ | Mọi server action kiểm tra quyền (`requireStaff` / `requireAdmin` / `run()` / `getUser`) hoặc là action công khai có giới hạn tần suất (đăng nhập, đăng ký, quên mật khẩu, lead) | 🔬 quét 39 action | — |
| SEC-07 | ✅ | Header bảo mật trên Cloudflare: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; không `x-powered-by` | 🔬 `curl -I` website thật | — |
| SEC-08 | 🟡 | `npm audit`: 9 lỗ hổng (1 moderate, 8 high) – **chỉ ở công cụ build / dev** (postcss trong Next lúc build, eslint-config-next, tailwind → chokidar / micromatch / braces); không có trong Worker chạy thật | 🔬 `npm audit`; `npm audit fix` không sửa được (cần nâng major) | 🟡 Chấp nhận; sửa khi nâng Next 16 (chờ OpenNext) / eslint 9 |
| SEC-09 | 🟡 | Quên mật khẩu cho biết tài khoản có tồn tại / có email hay không (dò danh sách tài khoản) | 📖 | 🟡 Chấp nhận (khách hàng lớn tuổi cần hướng dẫn rõ; đã giới hạn 10 lần / giờ / IP); xem lại trước khi quảng bá |
| SEC-10 | 🟡 | Tài khoản Cloudflare đăng nhập bằng GitHub cá nhân, chỉ 1 thành viên | 📖 | ⬜ A-25: mời email trung tâm làm Super Administrator + 2FA khi chốt email |
| SEC-11 | 🟡 | Turnstile chưa bật trên website công khai `workers.dev` (RK-06) | 📖 | ⬜ A-4 trước khi quảng bá |
| SEC-12 | 🔵 | CSP còn `'unsafe-inline'` cho script (Next chèn script nội tuyến); chuyển sang nonce làm mọi trang thành động (mất ISR) | 📖 | Giữ nguyên |

**Performance** (đo từ máy chủ dự án ở Việt Nam, 04/10/2026)

| ID | Phát hiện | Số đo | Xử lý |
| --- | --- | --- | --- |
| PERF-01 | Mạng được Cloudflare định tuyến qua **Hồng Kông (HKG)**, không phải PoP Việt Nam như ước tính ở ADR-017 (phụ thuộc nhà mạng) | `cdn-cgi/trace`: `colo=HKG`, `loc=VN`; kết nối TCP ~0,27 giây; file tĩnh TTFB 0,39 – 0,50 giây | Không do code. Ghi nhận; đo lại từ 4G / Wi-Fi khác khi nghiệm thu (CF-20) |
| PERF-02 | Trang ISR đã lưu đệm (`/`, `/register`, `/khoa-hoc/[id]`) TTFB 0,54 – 1,5 giây → Worker tốn ~0,1 – 0,4 giây ngoài phần mạng | `x-nextjs-cache: HIT` | ✅ Bật `enableCacheInterception` – đo lại 05/10 (bản `a400e7a4`): `x-opennext-cache: HIT`, `/register` 0,37 – 1,0 giây, `/login` 0,22 – 0,89, `/` 0,65 – 1,2 |
| PERF-03 | Trang động (đăng nhập, quản trị) gọi Supabase Singapore từ Worker ở HKG: mỗi truy vấn thêm ~35 ms | `cf-placement: local-HKG` | Smart Placement đã bật – Cloudflare tự dời Worker gần Supabase khi đủ lưu lượng |
| PERF-04 | Dung lượng: HTML trang chủ 12 KB (nén), JS tải lần đầu 103 KB, Worker 1,6 MiB nén, khởi động 16 ms; ảnh `public/` 40 KB + 128 KB; tài nguyên tĩnh cache 1 năm | 🔬 | Đạt |
| PERF-05 | Ảnh không tối ưu ở server (`unoptimized`, RK-47) – khi có nhiều khóa có ảnh bìa, trang chủ nặng dần | Ảnh bìa đã nén ≤ 1600px phía trình duyệt | Theo dõi; > 12 khóa có ảnh → cân nhắc Cloudflare Images / ảnh nhỏ cho thẻ khóa |
| PERF-06 | Danh sách quản trị giới hạn 200 dòng (RV-12, RK-41) | 📖 | Backlog 2b – trước khi > 200 khách hàng |
| PERF-07 | RK-54: lỗi hydration lác đác ở trang quản trị trên workerd (React dựng lại phía trình duyệt) | E2E workers | CF-41 kiểm trên Cloudflare thật |

**Kết quả**: sửa SEC-02, SEC-03, PERF-02 trong lượt rà soát; việc còn lại đưa vào [roadmap §0.1](roadmap.md#01-việc-cần-làm-tiếp-theo--từng-bước-to-do) (A-24, A-25, A-4).

### Đã kiểm tra – **không** phải rủi ro

| Nghi vấn | Kết quả |
| --- | --- |
| Open redirect qua `next=/\example.com`, `//example.com`, `/%5Cexample.com` | 🔬 Không khai thác được: luôn ở lại localhost (Next.js chuẩn hóa URL; `safeNext` chặn `//`) |
| Phiên đăng nhập cũ còn dùng được sau khi đặt lại mật khẩu | 🔬👁 Supabase thu hồi phiên cũ (TC-42 phải đăng nhập lại học viên 2 sau khi reset) |
| Học viên chưa mua đọc được khóa đang ẩn sau khi đổi policy | 🔬 TC-41, TC-42: khách và học viên chưa mua nhận 404 / 0 dòng |
| Đơn cũ thiếu snapshot sau khi chạy schema | 🔬 0 đơn có `course_title` null |
| Xóa tài khoản admin làm lỗi khóa ngoại `reviewed_by` (trigger chặn sửa người xử lý) | 📖 Trigger cho phép `reviewed_by` về null nên `on delete set null` chạy được; `reviewed_by_name` vẫn giữ |
| Unique index chặn đơn trùng không tạo được do dữ liệu cũ | 🔬 Trước khi chạy schema: 0 cặp trùng; TC-48 xác nhận index hoạt động |

### 7.11. Đợt 19 – Thiết kế lại trang chủ (17/10/2026)

Yêu cầu chủ dự án 17/10: trang chủ có chuyển động (tham khảo irc.coach/dich-vu-dieu-tri), câu chữ thu hút, ảnh + hồ sơ bác sĩ
(tham khảo bsdomanhcuong.com/bac-si.html#chuyen-mon), giữ mọi chức năng cũ, bỏ phần trùng. Không đổi schema / API / quyền.

| Hạng mục | Kết quả |
| --- | --- |
| Chuyển động | Tự viết, **không thêm thư viện** (trang tham khảo dùng Elementor/WordPress): `RevealObserver` (IntersectionObserver), `CountUp`, keyframes Tailwind `float` / `blob` / `marquee` / `fade-up-slow`, `.card-lift`. Chỉ animate `opacity` / `transform`. JS trang chủ +~1 kB (First Load 196 kB) |
| Nội dung bác sĩ | `lib/site-config.ts`: `doctor.summary / education / expertise / career`, `branches` (3 cơ sở); 6 ảnh hoạt động tải từ website bác sĩ, nén ≤ 800px (23 – 63 KB) vào `public/images/bac-si/` – CSP `img-src 'self'` không cần nới |
| Bỏ trùng | Banner `trung-tam-hv.jpg` (chữ trong ảnh = 4 dòng tiểu sử), hàng ✓ hero, 3 ô "10+ / YHCT / 1:1", khối CTA cuối trang; gộp Vấn đề + Lợi ích. `credentials[]` thay bằng `summary` (trang `/khoa-hoc/[id]` dùng) |
| Giữ chức năng | Neo `#bac-si`, `#mien-phi`, `#khoa-hoc`, `#premium`, `#dang-ky`, `#lien-he`; lọc chương trình, "Đăng ký" chọn sẵn khóa, box 3 bước, FAQ, thanh CTA điện thoại – các bước E2E cũ chạy nguyên, không sửa |
| Khả năng tiếp cận | `prefers-reduced-motion` → hiện ngay, không đếm, dải chữ đứng yên; tắt JS vẫn thấy nội dung (chỉ ẩn khi `html.reveal-ready`); bản lặp dải chữ `aria-hidden`; số liệu dạng `dl` |
| Kiểm thử | **Node 101/101, Workers 102/102**. TC-111 (nội dung, ảnh tải được, bỏ trùng), TC-112 (hiện dần khi cuộn, giảm chuyển động). Lần chạy đầu đỏ ở TC-111 do **chính test**: Playwright `scrollIntoViewIfNeeded` chờ phần tử "đứng yên" mà ảnh chứng nhận bồng bềnh liên tục → cuộn bằng `el.scrollIntoView()`; lần 2 đỏ do test bắt nhầm `og:image` (banner vẫn là ảnh chia sẻ) trong `<head>` → chỉ kiểm `<main>`; lần 3 – 100/101: **lỗi thật nhỏ** – Chrome xin `/favicon.ico` (chỉ có `app/icon.svg`) nhận 404 trong console → thêm `public/favicon.ico` (16/32/48px, sinh từ `icon.svg`) |

| Mã | Mức | Rủi ro | Xử lý |
| --- | --- | --- | --- |
| RK-55 | 🟡 | Ảnh lấy từ website bác sĩ có **học viên / người tham dự** (workshop, hội nghị); số liệu "13.000+ người theo dõi", "3 cơ sở", lịch sử công tác viết cứng trong code – có thể cũ đi hoặc chưa được người trong ảnh đồng ý | Chủ dự án xác nhận quyền dùng ảnh + số liệu (A-26); thay ảnh / số trong `lib/site-config.ts`, `public/images/bac-si/` khi cần (đổi xong deploy là cập nhật) |
| RK-56 | 🟢 | Phần tử có hiệu ứng chạy liên tục (`animate-float`, `marquee`) không bao giờ "đứng yên" → Playwright `click` / `scrollIntoViewIfNeeded` lên chúng sẽ treo | Ghi chú trong design-system §5; E2E cuộn bằng DOM; không đặt nút bấm bên trong phần tử bồng bềnh |

### 7.12. Đợt 20 – Song ngữ trang chủ + giao diện hiện đại hơn (17/10/2026)

Yêu cầu chủ dự án 17/10: ô chuyển ngôn ngữ Việt ↔ Anh như irc.coach (bản tiếng Anh ở `/en/`), hiệu ứng mạnh hơn, thiết kế hiện đại hơn, giữ màu
xanh nước biển – trắng – vàng và các chức năng chính; dev tự quyết. Không đổi schema / API / quyền.

**Nghiên cứu** (tóm tắt): xu hướng 2026 – bento grid cho phần dịch vụ / lợi ích (6 – 9 ô, 1 cột trên điện thoại), chuyển động gắn với cuộn trang
(CSS scroll-driven: Chrome / Edge 115+, Safari 26; Firefox chưa chắc → dùng `@supports`), kinetic typography vừa phải; tránh 3D / WebGL vì tốn hiệu năng
(nguồn: line25.com/articles/web-design-trends-2026, tinyfrog.com/web-design-trends, developer.chrome.com/blog/scroll-triggered-animations, flaviocopes.com/css-scroll-driven-animations).

| Hạng mục | Kết quả |
| --- | --- |
| Song ngữ | ADR-018: `/en` + từ điển tĩnh `lib/i18n.ts`; nút `LangSwitch` (chỉ trang chủ); header, chân trang, thẻ khóa, bộ lọc theo ngôn ngữ; hreflang + canonical + metadata en; `<html lang>`. Không widget dịch máy (giữ CSP, không nháy chữ, SEO được) |
| Giao diện | `components/home/HomePage.tsx` dùng chung 2 ngôn ngữ: hero nền tối + lưới + tiêu đề hiện từng từ, viền conic xoay, 2 dải chéo, số liệu gradient, bento, cột ảnh bác sĩ dính + trích dẫn **nguyên văn** từ website bác sĩ (không tự viết lời bác sĩ), đường thời gian tự vẽ, parallax + thanh tiến độ cuộn, `.spotlight`, `.btn-shine`, chân trang tối |
| Giữ chức năng | Neo, lọc chương trình, "Đăng ký" chọn sẵn khóa, box 3 bước (bản Việt), FAQ, thanh CTA điện thoại; mọi bước E2E cũ chạy nguyên trên giao diện mới |
| Hiệu năng | Không thêm thư viện; JS trang chủ +~0,5 kB (First Load 197 kB); hiệu ứng theo cuộn bằng CSS (không lắng nghe cuộn bằng JS); `/en` cũng tĩnh |
| Kiểm thử | TC-113 (chuyển ngữ 2 chiều, giữ #mục, `lang`, hreflang, thẻ khóa / lọc / Register, `/en` không nhúng form, chân trang en, trang khác không có nút) + TC-111, TC-112 trên giao diện mới. E2E: Node 102/102, Workers 103/103 (17/10/2026). Lần chạy Node đầu dừng ở TC-113 vì script so hreflang `vi` với chuỗi kết thúc "/" trong khi Next ghi URL gốc không có "/" cuối – trang đúng, sửa script so theo pathname |

| Mã | Mức | Rủi ro | Xử lý |
| --- | --- | --- | --- |
| RK-57 | 🟡 | Chỉ trang chủ có tiếng Anh: tên / mô tả khóa, form đăng ký, đăng nhập, học tập vẫn tiếng Việt – khách nước ngoài có thể bỏ dở | Chấp nhận (khách chính là người Việt); ghi rõ "(in Vietnamese)" ở nút; mở rộng `title_en`, dịch form khi có nhu cầu (ADR-018); A-27 duyệt bản dịch |
| RK-58 | 🟡 | Hiệu ứng nặng hơn (nhiều lớp `blur-3xl`, `backdrop-blur`, chữ hiện từng từ) có thể giảm mượt / Lighthouse trên điện thoại yếu | Chỉ `opacity` / `transform` / `filter`; giảm chuyển động tắt hết; đo Lighthouse mobile sau deploy (test-plan §5), quá ngưỡng thì bỏ bớt vệt mờ ở hero |

Ghi nhận khi làm: build `next build` trên Windows có lần worker thoát mã `3221226505` (0xC0000409) ở bước "Generating static pages" – chạy lại thì qua, không do mã nguồn (Workers Builds chạy Linux).
`npx opennextjs-cloudflare build` khi `npm run dev` đang chạy cùng thư mục làm hỏng `.next` (lỗi `Invariant: no direct app page entry found for /account`, dev server trả 500) → build workers ở bản sao riêng (test-plan §2); đã xóa `.next` hỏng ở thư mục chính, `npm run dev` tự tạo lại.

### 7.13. Đợt 21 – Rà soát bảo mật + phiên đăng nhập (17/10/2026)

Yêu cầu chủ dự án 17/10: "đăng nhập vào, tắt website đi nhưng lúc sau vào vẫn đang lưu session – fix lỗi bảo mật này; rà soát thật kỹ các lỗi bảo mật có thể có".
**Phạm vi**: `middleware.ts`, `lib/supabase/*`, mọi server action (`'use server'`), trang quản trị, `supabase/schema.sql` (RLS, Storage), file `.env*` trong git, `npm audit`;
so với lượt rà soát 04/10 (§7.10). Không đổi schema – chủ dự án **không** cần chạy SQL.

| ID | Mức | Phát hiện | Bằng chứng | Xử lý |
| --- | --- | --- | --- | --- |
| SEC-13 | 🔴 | **Phiên đăng nhập sống 400 ngày**: `@supabase/ssr` 0.12.7 luôn ghi cookie với Max-Age 400 ngày (bỏ qua `cookieOptions.maxAge`) – tắt trình duyệt, máy dùng chung, quên đăng xuất ở máy trung tâm → người sau vào thẳng tài khoản (kể cả admin) | 🔬 `node_modules/@supabase/ssr/dist/main/cookies.js` (`maxAge: DEFAULT_COOKIE_OPTIONS.maxAge`); `utils/constants.js` 400 × 24 × 60 × 60 | ✅ `lib/session-policy.ts`: cookie tạm + tự đăng xuất (30 phút nhân viên / 2 giờ học viên, tối đa 12 giờ), "Ghi nhớ 30 ngày" chỉ học viên; middleware chạy mọi trang, thu hồi phiên ở Supabase khi hết hạn; `SessionGuard` cho tab đang mở (TC-114, TC-115). **Mọi người đang đăng nhập phải đăng nhập lại 1 lần sau khi deploy** |
| SEC-14 | 🟠 | Trang đăng nhập hiển thị nguyên văn `?error=` → kẻ gian gửi link `/login?error=Tài khoản bị khóa, gọi 09…` hiện chữ lừa đảo trong hộp lỗi đỏ của website (không phải XSS – React đã thoát ký tự) | 📖 `app/login/page.tsx` | ✅ Chỉ nhận mã (`app/login/errors.ts`), mã lạ không hiện gì (TC-116) |
| SEC-15 | 🟡 | Đổi mật khẩu dùng admin API `updateUserById` – E2E cho thấy Supabase thu hồi **mọi** phiên, kể cả máy đang đổi: thiết bị khác bị đăng xuất (đúng) nhưng người đang đổi cũng âm thầm mất phiên ở lần tải trang sau (lỗi trải nghiệm, trước đây test không phát hiện vì không tải lại trang) | 🔬 E2E Đợt 21 lần 1: `/account` → `/login?next=%2Faccount` sau khi đổi | ✅ Đổi bằng phiên của chính người dùng (`auth.updateUser`) + `signOut({ scope: 'others' })`: máy đang dùng giữ phiên, máy khác bị đăng xuất (TC-116); đặt lại mật khẩu qua mã email: thu hồi mọi phiên rồi đăng nhập mới. Nhân viên cấp lại mật khẩu khách hàng (`updateUserById`) cũng thu hồi mọi phiên của khách hàng |
| SEC-16 | 🟡 | Form đăng ký công khai trả nguyên văn lỗi kỹ thuật (tạo tài khoản, tải ảnh, lưu đơn) – sót từ SEC-02 | 📖 `app/register/actions.ts` | ✅ Thông báo chung + `console.error` (Workers Logs) |
| SEC-17 | 🔵 | Link xem ảnh chuyển khoản (chứng từ tài chính) sống 1 giờ – lộ link là người ngoài xem được | 📖 `app/admin/registrations/page.tsx` | ✅ Giảm còn 15 phút |
| SEC-18 | 🟡 | `npm audit` (gói chạy thật): `sharp` (wrangler / miniflare), `source-map-js` có bản sửa | 🔬 `npm audit --omit=dev` | ✅ `npm audit fix` (không nâng major); còn `postcss` trong Next = SEC-08 (chỉ lúc build, chờ Next 16) |
| SEC-19 | 🔵 | Bucket công khai `course-covers` cho liệt kê tên file (policy select toàn bucket) | 📖 `schema.sql` | Chấp nhận – ảnh bìa vốn công khai, tên file là UUID |

**Đã kiểm tra – đạt**: 9 file `'use server'` – mọi action quản trị qua `run()` (`requireAdmin` / `requireStaff`), action học viên gọi `getUser()`, action công khai có giới hạn tần suất (đăng nhập, đăng ký + Turnstile, quên mật khẩu, lead); 10/12 trang `/admin/**` gọi `requireStaffPage` / `requireAdminPage` (2 trang còn lại chỉ chuyển hướng; layout `/admin` cũng kiểm tra); không có `dangerouslySetInnerHTML` / `eval`; bucket `payment-proofs` riêng tư, chỉ nhân viên đọc; `profiles`: học viên không tự sửa vai trò (không có policy tự sửa, trigger `guard_role_change`); `.env.production` trong git chỉ có biến công khai; CSP / header (§7.10 SEC-07) giữ nguyên.

**Còn mở**: SEC-08 (Next 16), SEC-09, SEC-10 (A-25), SEC-11 Turnstile (A-4), SEC-12.

| Mã | Mức | Rủi ro | Xử lý |
| --- | --- | --- | --- |
| RK-59 | 🟡 | Sau deploy Đợt 21, mọi người đang đăng nhập bị đăng xuất 1 lần (chưa có cookie mốc thời gian) | Chấp nhận – báo trước nhân viên; chưa có khách hàng thật |
| RK-60 | 🔵 | Khách hàng xem video dài trên điện thoại không chạm màn hình > 2 giờ bị đăng xuất | Chấp nhận (2 giờ đủ 1 buổi tập); học viên dùng máy riêng chọn "Ghi nhớ" |

Kiểm thử: TC-114 → TC-116 + E2E toàn bộ – Node 105/105 · Workers 106/106 (11 lỗi hydration RK-54 ở trang quản trị ghi riêng – trước 18).

### 7.14. Đợt 22 – Đo và sửa hiệu năng (17/10/2026)

**Cách đo**: `scripts/perf.mjs` (mới) – Lighthouse 12.8 chế độ mặc định (điện thoại: CPU chậm 4×, mạng 4G chậm mô phỏng; máy tính: preset desktop),
**3 lần / trang, lấy trung vị**, 10 trang gồm trang cần đăng nhập (tạo admin tạm, gửi cookie). Server: `next start` bản production trên máy dev
(Supabase ở Singapore nên TTFB trang đăng nhập cao hơn trên Cloudflare – PERF-03). Kết quả chi tiết: `test-results/perf-truoc.json`, `perf-sau.json`.

**Trước khi sửa**

| Chế độ | Trang | Điểm | FCP (s) | LCP (s) | TBT (ms) | CLS | Speed Index (s) | TTFB (ms) | Tải về (kB) | JS (kB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Điện thoại | `/` | 86 | 2.12 | 3.83 | 24 | 0.002 | 2.14 | 8 | 527 | 219 |
| Điện thoại | `/en` | 89 | 1.83 | 3.64 | 19 | 0.002 | 2.02 | 6 | 498 | 219 |
| Điện thoại | `/login` | 88 | 1.97 | 3.63 | 57 | 0.000 | 1.97 | 9 | 389 | 227 |
| Điện thoại | `/register` | 88 | 1.97 | 3.64 | 97 | 0.001 | 1.97 | 4 | 430 | 219 |
| Điện thoại | `/khoa-hoc/[id]` | 87 | 1.98 | 3.58 | 125 | 0.000 | 2.76 | 6 | 415 | 223 |
| Điện thoại | `/courses` | 81 | 2.02 | 3.36 | 327 | 0.000 | 3.06 | 1088 | 380 | 219 |
| Điện thoại | `/admin` | 76 | 2.20 | 3.58 | 444 | 0.020 | 3.05 | 726 | 396 | 225 |
| Điện thoại | `/admin/registrations` | 78 | 2.17 | 3.52 | 382 | 0.001 | 3.34 | 1115 | 630 | 230 |
| Điện thoại | `/admin/customers` | 86 | 2.18 | 3.29 | 177 | 0.000 | 3.17 | 1120 | 409 | 227 |
| Điện thoại | `/admin/courses` | 71 | 2.21 | 3.73 | 643 | 0.003 | 3.41 | 813 | 422 | 230 |
| Máy tính | `/` | 98 | 0.53 | 1.01 | 4 | 0.023 | 0.90 | 13 | 716 | 221 |
| Máy tính | `/en` | 99 | 0.50 | 0.94 | 5 | 0.014 | 1.00 | 12 | 687 | 221 |
| Máy tính | `/login` | 100 | 0.48 | 0.78 | 14 | 0.002 | 0.51 | 13 | 396 | 228 |
| Máy tính | `/register` | 100 | 0.48 | 0.77 | 0 | 0.014 | 0.50 | 7 | 430 | 219 |
| Máy tính | `/khoa-hoc/[id]` | 98 | 0.55 | 0.92 | 69 | 0.002 | 1.08 | 19 | 429 | 225 |
| Máy tính | `/courses` | 99 | 0.54 | 0.83 | 41 | 0.002 | 1.10 | 643 | 398 | 221 |
| Máy tính | `/admin` | 98 | 0.59 | 0.89 | 37 | 0.002 | 1.29 | 739 | 411 | 226 |
| Máy tính | `/admin/registrations` | 98 | 0.58 | 0.89 | 56 | 0.003 | 1.39 | 975 | 635 | 230 |
| Máy tính | `/admin/customers` | 99 | 0.52 | 0.70 | 0 | 0.005 | 1.03 | 982 | 436 | 230 |
| Máy tính | `/admin/courses` | 99 | 0.50 | 0.72 | 0 | 0.003 | 0.97 | 947 | 434 | 231 |

**Phân tích**

| ID | Mức | Phát hiện | Bằng chứng | Xử lý |
| --- | --- | --- | --- | --- |
| PERF-08 | 🟠 | Thư viện Supabase phía trình duyệt (**68 kB gzip**) tải ở **mọi trang**, kể cả khách chưa đăng nhập (header đọc phiên) – "First Load JS" của Next không tính phần layout nên con số build báo thấp hơn thực tế (~200 kB gzip mỗi trang) | 🔬 `app-build-manifest.json`: chunk `322-…`, `44530001-…` (supabase/ssr, auth-js) nằm trong `/layout` | ✅ `lib/browser-cookies.ts`: kiểm tra cookie phiên trước, chỉ `import()` Supabase khi đã đăng nhập (header, hộp nhắc, form đăng ký, hộp lead, đăng xuất) |
| PERF-09 | 🟠 | **LCP điện thoại 3,3 – 3,8 giây** ở mọi trang dù HTML / CSS nhỏ: phần tử LCP (tiêu đề hero, thẻ đăng nhập) có hiệu ứng hiện dần **từ opacity 0** → trình duyệt chỉ tính là "đã vẽ" khi hiệu ứng chạy (render delay 87 – 89% LCP) | 🔬 Lighthouse `largest-contentful-paint-element`: `/` H1 render delay 3,57 s; `/login` render delay 3,20 s | ✅ `word-in` (tiêu đề hero) chỉ trồi + bớt mờ (không đổi opacity), thẻ đăng nhập / quên mật khẩu dùng `animate-rise` (chỉ trồi lên) – giữ chuyển động, chữ hiện ngay từ lần vẽ đầu |
| PERF-10 | 🟡 | Trang cần đăng nhập: `getCurrentUser` gọi Supabase **tuần tự** (xác thực → profile) trước mọi truy vấn của trang; TTFB 0,7 – 1,1 s trên máy dev | 📖 `lib/auth.ts` | ✅ Gửi truy vấn profile song song với `getUser()` (id lấy từ JWT, chỉ dùng khi `getUser` xác nhận đúng người) – bớt 1 lượt gọi mạng mỗi trang |
| PERF-11 | 🔵 | `/admin/registrations` tải 630 kB: ô ảnh chuyển khoản 48 px dùng ảnh gốc (đã nén ≤ 1600 px khi tải lên) | 🔬 Lighthouse tổng tải về | Chấp nhận – đã `loading="lazy"`; ảnh thu nhỏ cần Supabase Image Transformation (gói Pro) hoặc tạo ảnh nhỏ khi tải lên – để backlog |
| PERF-12 | 🟡 | TBT điện thoại trang quản trị 177 – 643 ms (`/admin/courses` cao nhất: mỗi khóa có form sửa + bảng gói ẩn trong thẻ → nhiều component phải hydrate) | 🔬 Lighthouse | ✅ Đợt 24: form sửa + bảng gói chuyển sang trang sửa riêng, danh sách chỉ còn nút |

**Sau khi sửa** (cùng máy, cùng cách đo)

| Chế độ | Trang | Điểm | FCP (s) | LCP (s) | TBT (ms) | CLS | Speed Index (s) | TTFB (ms) | Tải về (kB) | JS (kB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Điện thoại | `/` | 90 | 2.13 | 3.38 | 18 | 0.002 | 2.13 | 9 | 457 | 149 |
| Điện thoại | `/en` | 91 | 1.82 | 3.27 | 18 | 0.002 | 1.99 | 6 | 428 | 149 |
| Điện thoại | `/login` | 94 | 1.97 | 2.81 | 41 | 0.000 | 1.97 | 8 | 319 | 157 |
| Điện thoại | `/register` | 92 | 1.97 | 3.17 | 45 | 0.001 | 1.97 | 5 | 360 | 149 |
| Điện thoại | `/khoa-hoc/[id]` | 94 | 1.97 | 2.80 | 43 | 0.000 | 1.97 | 4 | 345 | 152 |
| Điện thoại | `/courses` | 94 | 1.97 | 2.81 | 50 | 0.000 | 1.98 | 494 | 311 | 149 |
| Điện thoại | `/admin` | 93 | 2.12 | 2.84 | 35 | 0.001 | 2.12 | 530 | 331 | 155 |
| Điện thoại | `/admin/registrations` | 93 | 2.12 | 2.95 | 34 | 0.000 | 2.34 | 809 | 547 | 159 |
| Điện thoại | `/admin/customers` | 93 | 2.12 | 2.79 | 28 | 0.000 | 2.51 | 947 | 341 | 159 |
| Điện thoại | `/admin/courses` | 93 | 2.12 | 2.95 | 41 | 0.001 | 2.44 | 892 | 340 | 159 |
| Máy tính | `/` | 100 | 0.50 | 0.72 | 0 | 0.024 | 0.66 | 6 | 646 | 151 |
| Máy tính | `/en` | 100 | 0.46 | 0.68 | 0 | 0.015 | 0.66 | 7 | 618 | 151 |
| Máy tính | `/login` | 100 | 0.46 | 0.58 | 0 | 0.002 | 0.46 | 9 | 326 | 159 |
| Máy tính | `/register` | 100 | 0.46 | 0.59 | 0 | 0.014 | 0.46 | 4 | 361 | 149 |
| Máy tính | `/khoa-hoc/[id]` | 100 | 0.47 | 0.58 | 0 | 0.002 | 0.47 | 6 | 359 | 155 |
| Máy tính | `/courses` | 99 | 0.52 | 0.65 | 7 | 0.002 | 1.06 | 925 | 328 | 151 |
| Máy tính | `/admin` | 100 | 0.54 | 0.62 | 0 | 0.000 | 0.86 | 681 | 347 | 156 |
| Máy tính | `/admin/registrations` | 99 | 0.55 | 0.69 | 0 | 0.001 | 1.20 | 950 | 559 | 161 |
| Máy tính | `/admin/customers` | 98 | 0.59 | 0.75 | 21 | 0.025 | 1.50 | 1334 | 360 | 161 |
| Máy tính | `/admin/courses` | 100 | 0.53 | 0.62 | 0 | 0.009 | 0.81 | 714 | 363 | 160 |

| So sánh (điện thoại, trung vị 3 lần) | Trước | Sau |
| --- | --- | --- |
| Điểm Performance | 71 – 89 | **90 – 94** |
| LCP | 3,29 – 3,83 s | 2,79 – 3,38 s |
| TBT trang quản trị | 177 – 643 ms | **28 – 41 ms** |
| JS tải về (gzip, cả layout) | 219 – 230 kB | **149 – 159 kB** |
| Máy tính: điểm / LCP | 98 – 100 / 0,70 – 1,01 s | 98 – 100 / 0,58 – 0,75 s |

| ID | Mức | Còn lại | Xử lý |
| --- | --- | --- | --- |
| PERF-13 | 🟡 | LCP điện thoại (mô phỏng 4G chậm) còn 2,8 – 3,4 s > 2,5 s: render delay do **12 file font** Be Vietnam Pro (4 độ đậm × latin / latin-ext / vietnamese, ~110 kB, ưu tiên cao) tải trước khi vẽ chữ bằng font chính. Thử nghiệm bỏ hẳn hiệu ứng tiêu đề hero chỉ bớt ~0,14 s → không phải do hiệu ứng | Chưa sửa (ảnh hưởng nhận diện chữ): phương án – bỏ độ đậm 500 (dùng 400 / 600), hoặc chỉ preload độ đậm 700 + 400; đo lại trên Cloudflare thật sau deploy (mạng thật nhanh hơn mô phỏng) – roadmap backlog |
| PERF-03 | 🔵 | TTFB trang đăng nhập 0,5 – 1,3 s trên máy dev (gọi Supabase Singapore từ Việt Nam) | Trên Cloudflare ~35 ms / lượt gọi (Smart Placement); PERF-10 đã bớt 1 lượt |

### 7.15. Đợt 23 – 24: Giao diện quản trị mới + thêm / sửa / xóa khóa học (17/10/2026)

Yêu cầu chủ dự án 17/10: "rà soát roadmap để thực hiện thêm tính năng thêm sửa xóa cho khóa học" + "thiết kế lại trang quản trị sao cho hiện đại, dễ dùng và chuyên nghiệp hơn".
Roadmap đã có thiết kế QL-06 → QL-08 (Đợt 18, chủ dự án chốt Q-7: còn học viên thì chặn xóa) → làm phần khóa học trên giao diện mới; phần khách hàng
(QL-02 → QL-05, cần đổi schema) để Đợt 25. Không đổi schema – chủ dự án **không** cần chạy SQL.

| Hạng mục | Kết quả |
| --- | --- |
| UI-10 khung quản trị | Thanh bên tối `ocean-950` (thương hiệu, vai trò + tên, menu icon, số việc cần làm vàng, "Xem website"), nội dung nền xám nhạt, tối đa 1400 px; điện thoại: dải tối + tab cuộn ngang; header bỏ menu neo trang chủ, ẩn chân trang trong khu quản trị (design-system §9) |
| Tiêu đề + bộ lọc | `PageHeader` cho 10 trang (tên, mô tả việc chính, nút chính); bộ lọc dạng viên `.seg` cho đơn, phiếu, khách, loại khóa, khách hàng / nhân viên; trạng thái rỗng có icon + nút |
| Tổng quan | Thẻ KPI có icon theo mức + chữ "Cần xử lý / Cần chú ý" (không chỉ dựa vào màu), lời chào theo tên |
| QL-06 | Thẻ khóa: ảnh 16:10, nhãn, giá "Từ … · gói", số bài / học viên; **hàng thao tác luôn hiện** Sửa · Quản lý buổi – bài · Ẩn / Hiển thị · Xem trang ↗ · Xóa; trang sửa riêng (thông tin, bảng gói, hiển thị, xóa) + tab "Thông tin & gói" / "Buổi – bài" |
| QL-07 | Nút "+ Thêm khóa học" đầu danh sách, chọn sẵn loại theo tab → `/admin/courses/new` → tạo xong chuyển sang trang sửa (`ActionResult.redirectTo`) |
| QL-08 | Xóa: chặn khi còn đơn đã duyệt còn hạn (hoặc không hạn – dữ liệu cũ) / đơn chờ (`courseUsage`), thông báo + gợi ý Ẩn; phải gõ đúng tên khóa (nút khóa tới khi đúng, server kiểm tra lại); xóa ảnh bìa; đơn cũ giữ tên khóa + học phí |

| Mã | Mức | Rủi ro | Xử lý |
| --- | --- | --- | --- |
| RK-61 | 🟡 | Điều kiện chặn xóa khóa chỉ kiểm ở server action – admin gọi thẳng API Supabase (`delete from courses`) vẫn xóa được khóa còn học viên | Chấp nhận – chỉ admin có quyền xóa (RLS), không phải lỗ hổng cho người ngoài; nếu cần chặt hơn: trigger `before delete` trong schema (Đợt 25 cùng QL-03 / QL-04) |
| RK-62 | 🔵 | Đổi giao diện quản trị → nhân viên quen bố cục cũ cần làm quen (menu cùng thứ tự UI-02, chỉ đổi màu / vị trí nút) | Báo nhân viên khi deploy; tên menu, thứ tự giữ nguyên |

Kiểm thử: TC-108 → TC-110 + mọi bước E2E cũ chạy trên giao diện mới (bước tạo khóa đi qua nút "+ Thêm khóa học"; bước "đơn chờ của khóa đã xóa" chuyển thành kiểm tra dữ liệu cũ). Node 105/105 · Workers 106/106 (11 lỗi hydration RK-54 ở trang quản trị ghi riêng – trước 18)

### 7.16. Đợt 26 – Khách hàng & Nhân viên tách riêng, thêm / sửa / xóa; gỡ Vercel; rà soát rủi ro (18/10/2026)

Yêu cầu chủ dự án 18/10 (8 mục – roadmap §3.7): gọi chung "khách hàng"; tách danh mục nhân viên / khách hàng; thêm / sửa / xóa cả hai; nhân viên không
thêm / sửa / xóa khóa học nhưng được thêm / sửa / xóa khách hàng; gỡ Vercel, bảo đảm Cloudflare ổn định; rà soát risk case; hiệu năng + bảo mật.
**Đổi schema** (nhỏ, tương thích ngược) → chủ dự án chạy `supabase/schema.sql` (A-30); khi chưa chạy, mọi chức năng vẫn hoạt động, chỉ chưa lưu nhật ký xóa.

**Rà soát tài liệu trước khi làm** (đọc roadmap, project-review, SRS, security, runbook, cloudflare-migration): yêu cầu mới **thay** 2 quyết định cũ – Q-6
(04/10: chỉ admin xóa khách hàng → nay nhân viên cũng xóa) và đường lùi Vercel tới 20/10 (chủ dự án xác nhận Cloudflare ổn định sớm 2 ngày). Phần QL-02 / QL-04 của
Đợt 25 làm luôn ở đợt này; QL-03 (khóa tài khoản), QL-05 (sửa gói) giữ ở Đợt 25.

| Hạng mục | Kết quả |
| --- | --- |
| Thuật ngữ | "bệnh nhân" → "khách hàng" ở 28 file mã (giao diện, thông báo, chú thích, lời báo lỗi database), E2E, README, 30 file tài liệu; `/admin/customers` (chuyển hướng `/admin/patients/**`); tên database giữ nguyên (D-1) |
| Tách danh mục | Menu **Nhân viên** (`/admin/staff`, chỉ admin) – danh sách, người cấp quyền, lọc vai trò, nhật ký xóa; **Khách hàng** chỉ `role = user`, cột Thao tác; đổi vai trò chuyển vào hồ sơ |
| Nhân viên CRUD | Thêm (mật khẩu 1 lần, vai trò ghi bằng phiên admin → `role_events`), sửa, đổi vai trò, cấp lại mật khẩu (thu hồi mọi phiên), xóa (gõ SĐT, không tự xóa, còn ≥ 1 admin) |
| Khách hàng CRUD | Thêm / sửa như cũ; **xóa** cho nhân viên + admin: chặn khi còn gói còn hạn / đơn chờ, gõ SĐT, xóa phiếu tham vấn, giữ đơn + ảnh |
| Mã dùng chung | `lib/managed-accounts.ts` (server-only): đọc liên hệ, kiểm trùng, tạo / sửa / đặt lại mật khẩu / xóa tài khoản, nhật ký – trang khách hàng và nhân viên dùng chung, không lặp logic |
| Gỡ Vercel | Xóa `vercel.json`, mục deploy Vercel trong README, ghi chú trong mã; runbook §4.1 + cloudflare-migration §7 đổi đường lùi thành Rollback Cloudflare / `deploy:win`; còn A-31 (xóa project + app Vercel) |

**Rà soát rủi ro (risk case)** – mục 7 của yêu cầu:

| Mã | Mức | Rủi ro | Xử lý |
| --- | --- | --- | --- |
| RK-63 | 🟡 | Nhân viên (nay được xóa) xóa nhầm / cố ý xóa khách hàng – không hoàn tác | ✅ Chặn khi còn gói còn hạn / đơn chờ; gõ đúng SĐT (nút khóa + server kiểm lại); đơn, ảnh chuyển khoản, doanh thu giữ nguyên; nhật ký xóa (người xóa + tên) ở trang Nhân viên; sao lưu tuần. Còn lại: admin rà nhật ký; nếu cần giữ lịch sử thì làm QL-03 "khóa tài khoản" (Đợt 25) |
| RK-64 | 🔵 | Xóa nhân viên → khách hàng do người đó tạo mất dòng "Tạo bởi …" (khóa ngoại về null); đơn / phiếu / lead vẫn giữ tên người xử lý | Chấp nhận – thông tin phụ |
| RK-65 | 🟡 | Schema Đợt 26 chưa chạy: chưa lưu nhật ký xóa, chưa có trigger chặn xóa admin cuối ở database (ứng dụng vẫn chặn) | ✅ 18/10: chủ dự án đã chạy `supabase/schema.sql` (A-30); E2E chạy lại Node 107/107 · Workers 108/108, nhật ký xóa ghi đúng người xóa |
| RK-66 | 🟡 | Project Vercel + app Vercel GitHub vẫn còn trên tài khoản: tạo check "Vercel Preview Comments", có thể deploy bản cũ lên `*.vercel.app` với khóa cũ | A-31 xóa project + gỡ app; nếu project Vercel còn biến `SUPABASE_SERVICE_ROLE_KEY` thì xóa biến trước |
| RK-67 🔴→✅ | 🔴 | **Đã sửa ngay**: phiên đăng nhập của nhân viên bị xóa / hạ quyền / được cấp lại mật khẩu có tiếp tục dùng được không? | Kiểm tra: mọi trang và action gọi `getUser()` (xác thực với Supabase) + `is_staff()` đọc vai trò từ database mỗi lần → hạ quyền có hiệu lực ngay; xóa tài khoản / cấp lại mật khẩu thu hồi phiên (E2E TC-119 kiểm phiên cũ bị chuyển `/login`). Không cần sửa thêm |
| RK-68 | 🟠→✅ | Tài khoản nhân viên mới dùng mật khẩu admin gửi qua tin nhắn – hộp nhắc đổi mật khẩu cũ chỉ hiện với khách hàng | ✅ Sửa ngay: dải nhắc "Bạn đang dùng mật khẩu được cấp – Đổi mật khẩu ngay" trong khu quản trị (TC-119) |
| RK-69 | 🟠→✅ | Trang Nhân viên (trước là tab trong trang khách hàng) tải **toàn bộ** `role_events` không giới hạn | ✅ Giới hạn 500 dòng mới nhất; nhật ký xóa giới hạn 20 + index `account_events_action_idx` |
| RK-70 | 🔵 | Hai admin xóa lẫn nhau cùng lúc | ✅ Ứng dụng kiểm còn admin khác; trigger `guard_admin_delete` (khóa tư vấn chung với đổi vai trò) chặn ở database sau khi chạy SQL |

**Bảo mật** (mục 8): mọi action mới kiểm quyền ở server (`requireStaff` / `requireAdmin`) + đúng loại tài khoản (khách hàng: `role = user`; nhân viên: `staff` / `admin`),
id kiểm UUID, đầu vào giới hạn độ dài, ô tìm kiếm bỏ ký tự đặc biệt của bộ lọc PostgREST; service role chỉ ở `lib/managed-accounts.ts` (`server-only`); nhân viên mở
`/admin/staff/**` → Tổng quan, mở hồ sơ admin ở `/admin/customers/<id>` → 404; RLS cũ không đổi (staff chỉ sửa dòng `role = user`, không xóa được qua API vì không có policy delete).
Threat model thêm T37 → T40 (security-design §5).

**Hiệu năng** (mục 8): danh sách khách hàng không thêm truy vấn (cột Thao tác là link); hồ sơ khách hàng thêm 2 truy vấn `count` chạy **song song** cùng 7 truy vấn có sẵn
(không thêm lượt chờ); trang Nhân viên 3 truy vấn song song có giới hạn; JS trang mới 106 – 114 kB (như các trang quản trị khác). Middleware không đổi.

**Cloudflare – bảo đảm deploy ổn định** (mục 6): CI và Workers Builds chỉ build OpenNext (không còn cấu hình Vercel nào được đọc); chuyển hướng
`/admin/patients/**` dùng `redirects()` của Next – OpenNext hỗ trợ; trang mới đều động (không thêm ISR / cache); không thêm thư viện; thao tác xóa tài khoản dùng
Supabase Admin API qua `fetch` (chạy trên workerd); E2E chế độ Workers chạy trên bản build OpenNext. Lùi phiên bản: Rollback (runbook §4.1).

Kiểm thử: TC-117 → TC-119 (mới) + các bước cũ sửa theo cấu trúc mới (đổi vai trò ở hồ sơ, danh mục Nhân viên, nhân viên bị chặn `/admin/staff/**`). Node 107/107 · Workers 108/108 (20 lỗi hydration RK-54 ở trang quản trị ghi riêng)

### 7.17. Lỗi build Cloudflare – Next 15 hết hạn hỗ trợ (26/10/2026)

Workers Builds đỏ ngay đầu bước build: `ERROR Next.js version 15.5.28 is not supported by the Next.js team … use the --dangerouslyUseUnsupportedNextVersion flag`.

| Mã | Mức | Rủi ro | Xử lý |
| --- | --- | --- | --- |
| RK-71 | 🔴 | OpenNext (`checkNextVersionSupport`) chặn build khi bản Next quá 2 năm kể từ ngày ra mắt; Next 15 ra 21/10/2024 → **từ 21/10/2026 mọi lần build / deploy đều dừng** (mã không lỗi, chặn theo ngày; nâng OpenNext 1.20.13 cũng vậy). Ngoài ra Next 15 không còn bản vá bảo mật | ✅ Tạm thời (dev, 26/10): script `npm run build:cf` có cờ `--dangerouslyUseUnsupportedNextVersion`, CI + `deploy:win` + `preview` / `deploy` dùng chung; build sạch trên bản sao (`npm ci`) PASS. ⬜ A-33: đổi Build command của Workers Builds thành `npm run build:cf`. ⬜ Đợt 27: nâng Next 16 (OpenNext ≥ 1.20.13 yêu cầu `next >= 16.4.1`), bỏ cờ, E2E Node + Workers |

## 8. Kế hoạch xử lý đề xuất

| Đợt | Hạng mục | Ước lượng |
| --- | --- | --- |
| ~~Ngay~~ | ~~RV-10 (git), RV-09, RV-01, RV-02, RV-05~~ – ✅ xong 26/09/2026 | — |
| ~~Tiếp theo~~ | ~~RK-01, RK-07, RK-05 (chốt), RK-09, RK-03~~ + người xử lý đơn (RV-11 một phần) – ✅ xong 26/09/2026 (xem §7.1) | — |
| ~~Đợt 3 – Nhiều admin~~ | ~~RK-11, RK-14, RK-12 + R-05, RK-13~~ – ✅ xong 26/09/2026, E2E 57/57 (xem §7.3) | — |
| ~~Đợt 4 – Vận hành an toàn~~ | ~~RK-10 (rào chặn + hướng dẫn staging), CI, RV-13, RV-03~~ – ✅ 26/09/2026, chờ chủ dự án tạo staging (xem §7.4) | — |
| ~~Đợt 5 – Chống lạm dụng & dữ liệu~~ | ~~RK-06 / RV-04, RK-08, RK-04, RV-16~~ – ✅ 26/09/2026 (xem §7.4) | — |
| ~~Đợt 7 – Vai trò staff~~ | ✅ 27/09/2026, E2E 67/67 (xem §7.5) | — |
| ~~Đợt 8 – Danh mục, premium, chính sách~~ | ✅ 27/09/2026, E2E 73/73 (xem §7.5) | — |
| ~~Đợt 9 – Gói tháng & hạn học~~ | ✅ 27/09/2026, E2E 78/78, sửa RK-22 (xem §7.5) | — |
| ~~Đợt 10 – Buổi – bài & trình học~~ | ✅ 27/09/2026, E2E 83/83, sửa RK-27, RK-28 (xem §7.5) | — |
| ~~Đợt 11 → 13~~ | ✅ 27/09/2026, E2E 96/96, sửa RK-18, RK-29, RK-34 (xem §7.6) | — |
| ~~Đợt 15 – Cải tiến giao diện~~ | UI-01 → UI-03 – ✅ 29/09/2026, E2E 98/98 (xem §7.7) | S |
| ~~Đợt 16 – Hạ tầng gói Free~~ | RK-36, RK-38 – ✅ 02/10/2026, workflow đang chạy; RK-38 chờ A-15 (xem §7.8) | XS |
| **Tiếp theo** | **Đợt 14 – Chạy thử MVP (pilot)** ([roadmap §3.1](roadmap.md#31-đợt-14--chạy-thử-mvp-pilot--kế-hoạch-từng-bước)); sau đó đánh giá → chuyển gói hạ tầng / backlog roadmap §3.2 | — |

**Thứ tự ưu tiên (lịch sử)**: Đợt 4 tiếp theo – E2E hiện vẫn chạy trên database thật (RK-10), bộ test đã tạo/xóa tài khoản admin và đổi quyền;
có staging mới test được "admin cuối cùng" (G-12). Sau đó Đợt 5 (chống lạm dụng) trước khi quảng bá rộng.

### Chi tiết Đợt 3 (đã thực hiện – giữ làm tham chiếu)

| Hạng mục | Thay đổi | Kiểm thử E2E mới |
| --- | --- | --- |
| RK-11 | `setRegistrationStatus(id, status, expected)`; bảng admin truyền `r.status` vào action; update thêm `.eq('status', expected)` | 2 trang admin cùng mở; trang 1 duyệt, trang 2 bấm Từ chối → báo "đã được admin khác xử lý", trạng thái vẫn `approved` |
| RK-12 + R-05 | Bảng `registration_events` (RLS: admin đọc; không ai sửa/xóa), trigger ghi mỗi lần đổi trạng thái; cột `review_note`; form Từ chối/Thu hồi có ô lý do; bảng admin có nút "Lịch sử" | Duyệt → Thu hồi (kèm lý do) → Duyệt: lịch sử đủ 3 dòng đúng người; học viên thấy lý do |
| RK-13 | Tab "Admin" trong `/admin/users`, action `setUserRole` (chặn tự gỡ quyền và gỡ admin cuối cùng) | Admin cấp quyền cho học viên → học viên vào được /admin; gỡ quyền → bị chặn |
| RK-14 | `run(message, op, invalid, errors?)` | Nằm trong TC-48 / kiểm thử RK-11 |
