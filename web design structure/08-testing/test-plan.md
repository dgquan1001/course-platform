# Kế hoạch kiểm thử

## 1. Chiến lược

| Cấp độ | Hiện trạng | Công cụ | Mục tiêu đề xuất |
| --- | --- | --- | --- |
| Static | ✅ | TypeScript, ESLint (`next lint`) | Chạy trong CI trên mọi PR |
| Unit | ❌ Chưa có | Đề xuất Vitest | Hàm thuần: `normalizePhone`, `getVideoEmbed`, `formatPrice`, `vietQrUrl`, `safeNext`, `maskEmail` |
| Integration (DB/RLS) | 🟡 Nằm trong E2E | supabase-js với anon/service role | Tách riêng bộ test RLS chạy trên Supabase local |
| End-to-end | ✅ | `scripts/e2e.mjs` – playwright-core + Chrome/Edge thật + Supabase thật | Giữ nguyên, bổ sung theo tính năng mới |
| Manual / UAT | 🟡 | Checklist mục 5 | Trước mỗi lần release |

## 2. Môi trường E2E

- Yêu cầu: bản build, `.env.local` đầy đủ (có service role), Chrome hoặc Edge, `supabase/schema.sql` mới nhất đã chạy.
- Chạy thông thường: `npm run build` rồi `npm run test:e2e` (tùy chọn `E2E_PORT`, `BROWSER_CHANNEL=msedge`).
- **Khi đang chạy `npm run dev`** (dev server ghi đè thư mục `.next` làm hỏng bản build), build vào thư mục riêng:

      $env:NEXT_DIST_DIR=".next-e2e"; npm run build; npm run test:e2e      # PowerShell
      NEXT_DIST_DIR=.next-e2e npm run build && NEXT_DIST_DIR=.next-e2e npm run test:e2e   # bash

- Script tự khởi động `next start` cổng 3123 với `MAIL_OUTBOX_DIR` (email ghi ra file JSON để đọc mã).
- Dữ liệu test: tài khoản `e2e-*@example.com`, SĐT `09<8 số>`/`08<8 số>`, khóa `[E2E] … <timestamp>`; **tự xóa khi kết thúc**
  (kể cả khi lỗi; mọi khóa mang timestamp của lần chạy đều bị xóa).
- Kết quả: log từng bước ✔/✘, ảnh chụp màn hình trong `test-results/` (khi lỗi: `loi-<n>.png` của mọi trang đang mở),
  kiểm tra không có lỗi JavaScript trên trang.
- Thiết bị giả lập: điện thoại iPhone 13 (học viên 1) và máy tính 1366×900 (học viên 2, admin).

> ⚠️ E2E dùng **Supabase thật** trong `.env.local`. Nên trỏ tới project staging, không chạy trên production giờ cao điểm.

## 3. Danh mục test case E2E & kết quả

**Lần chạy gần nhất**: 27/09/2026 · sau Đợt 8 · **73/73 bước PASS** (xem §3.1). Sau Đợt 7: 67/67. Lần trước: 26/09/2026 · sau Đợt 4–5 · Chrome · Supabase theo `.env.local` (chạy với `E2E_SUPABASE_REF` đặt tạm theo yêu cầu, chưa có staging) ·
**63/63 bước PASS** (TC-01 → TC-64; TC-49 nằm trong bước TC-26) · dữ liệu test đã dọn sạch
(0 khóa `[E2E]`, 0 tài khoản `e2e-*`, 0 đơn test, 0 khóa `rate_limits` của lần chạy; 1 dòng `role_events` còn lại là thao tác thật của admin lúc 09:21 UTC, không phải dữ liệu test).
Ghi chú Đợt 4–5: 3 lần chạy đầu đỏ ở TC-46 do lỗi "A network error occurred." phát sinh **trong iframe YouTube** (bên thứ ba) trên trang bài học điện thoại –
đã xác minh: vẫn xảy ra khi build không có header bảo mật, và Playwright báo lỗi iframe khác domain là lỗi của trang (stack rỗng).
E2E nay bỏ qua lỗi không có stack khi trang đang nhúng iframe bên thứ ba (vẫn in số lượng), lỗi của website (stack trỏ về BASE) vẫn làm test đỏ;
lỗi JavaScript được ghi kèm tên bước + URL, và được in ra cả khi E2E dừng giữa chừng.

| TC | Vai trò | Kịch bản | Truy vết | Kết quả | Thời gian |
| --- | --- | --- | --- | --- | --- |
| TC-01 | Hệ thống | Database đủ bảng, bucket `payment-proofs`, cột snapshot `course_title`/`amount`, cột người xử lý `reviewed_by`/`reviewed_by_name` | NFR-09, FR-097 | ✅ PASS | 1,8s |
| TC-02 | Hệ thống | Database chặn học phí âm (`courses_price_nonnegative`) | BR-21, RV-05 | ✅ PASS | 0,3s |
| TC-03 | Hệ thống | Tạo admin test, trigger tự sinh profile | BR-01 | ✅ PASS | 1,1s |
| TC-04 | Khách | `/admin`, `/courses`, `/account` chuyển tới đăng nhập kèm `next` | US-03.02 | ✅ PASS | 0,5s |
| TC-05 | Admin | Đăng nhập sai mật khẩu hiển thị lỗi | US-03.01 AC2 | ✅ PASS | 1,5s |
| TC-06 | Admin | Đăng nhập bằng email, có toast, nút "Quản trị" tô nổi bật | US-03.01, US-08.02 | ✅ PASS | 2,0s |
| TC-07 | Admin | Tạo 2 khóa mở đăng ký và 1 khóa ẩn qua UI | US-07.01 | ✅ PASS | 6,1s |
| TC-08 | Admin | Thêm bài học YouTube cho khóa A | US-07.05 | ✅ PASS | 1,9s |
| TC-09 | Admin | Server từ chối: tên rỗng, tên > 200 ký tự, học phí âm / chữ / thập phân, trạng thái lạ; link video `example.com`, `http://`, `javascript:`, domain giả; nhận link TikTok hợp lệ | US-07.07, RV-05 | ✅ PASS | 54,3s |
| TC-10 | Hệ thống | RLS: khách chỉ thấy khóa mở; không thấy khóa ẩn, bài học, đơn, mã reset | US-04.04, NFR-05 | ✅ PASS | 0,7s |
| TC-11 | Khách | Trang chủ có thông tin trung tâm, bác sĩ, box 3 bước; FAQ nói "số điện thoại (hoặc email)", không còn "Gmail" | US-01.01, RV-09 | ✅ PASS | 0,6s |
| TC-12 | Khách | Nút "Đăng ký" của khóa cuộn tới form và chọn sẵn khóa | US-01.03 | ✅ PASS | 0,1s |
| TC-13 | Khách | Ô chọn khóa chỉ có khóa đang mở, kèm giá | US-02.07 | ✅ PASS | <0,1s |
| TC-14 | Khách | QR cập nhật theo khóa và SĐT | US-02.01 | ✅ PASS | <0,1s |
| TC-15 | Khách | File không phải ảnh bị từ chối trên trình duyệt | US-02.04 AC1 | ✅ PASS | <0,1s |
| TC-16 | Khách | Ảnh 10,4MB được nén còn ~482KB trước khi upload | US-02.04 AC2 | ✅ PASS | 0,1s |
| TC-17 | Khách | SĐT sai: báo lỗi, không lưu gì | US-02.03 AC3 | ✅ PASS | 2,2s |
| TC-18 | Khách | Đăng ký có email (điện thoại): tạo tài khoản, đơn `pending` kèm snapshot tên khóa & học phí, ảnh JPG đã nén | US-02.02, FR-097 | ✅ PASS | 6,6s |
| TC-19 | Khách | Đăng ký không email (máy tính): email nội bộ `@sdt.hv.invalid`, profile email null | US-02.03 | ✅ PASS | 2,3s |
| TC-20 | Khách | Trùng email hoặc SĐT bị từ chối | US-02.02 AC2, US-02.03 AC2 | ✅ PASS | 2,6s |
| TC-21 | Học viên | Thấy đơn đang chờ; khóa A còn khóa; không vào được `/admin` | US-02.08, US-04.02 AC2 | ✅ PASS | 2,2s |
| TC-22 | Học viên | Đăng ký thêm khóa B: điền sẵn, không hỏi email/mật khẩu | US-02.05 AC1 | ✅ PASS | 1,4s |
| TC-23 | Học viên | Đăng ký lại khóa A đang chờ bị chặn | US-02.05 AC2 | ✅ PASS | 1,2s |
| TC-24 | Admin | Bảng đơn đủ 12 cột (thêm "Người xử lý") ở cả 4 tab | US-05.01 | ✅ PASS | 8,0s |
| TC-25 | Admin | Xem ảnh chuyển khoản (tải được) và duyệt khóa A | US-05.02, US-05.03 | ✅ PASS | 3,8s |
| TC-26 | Admin | Từ chối đơn khóa B của học viên 1 | US-05.04 | ✅ PASS | 1,7s |
| TC-27 | Admin | Đơn không có email hiển thị "Không có email" | US-02.03 AC1 | ✅ PASS | <0,1s |
| TC-28 | Admin | Tab Đã duyệt / Từ chối / Tất cả đúng trạng thái, ngày xử lý, người xử lý, nút | US-05.01 | ✅ PASS | 3,1s |
| TC-29 | Admin | Danh sách học viên đúng trạng thái từng khóa | US-06.01 | ✅ PASS | 1,2s |
| TC-30 | Học viên | Khóa A đã mở, khóa B báo chưa xác nhận; xem được video YouTube | US-04.01, US-04.03 | ✅ PASS | 5,4s |
| TC-31 | Học viên | Điện thoại: menu Tài khoản → Đăng xuất; đăng nhập lại bằng email | US-03.03, US-08.03 | ✅ PASS | 3,3s |
| TC-32 | Học viên | Đăng nhập bằng SĐT có dấu cách, dạng `+84` | US-03.01 AC1 | ✅ PASS | 1,5s |
| TC-33 | Học viên | Rê chuột "Tài khoản" hiện menu đủ mục, không có "Quản trị" | US-08.03 | ✅ PASS | 1,0s |
| TC-34 | Học viên | Trang Tài khoản hiển thị thông tin; cập nhật họ tên | US-03.06 AC1 | ✅ PASS | 1,1s |
| TC-35 | Học viên | Đổi mật khẩu: sai mật khẩu hiện tại bị từ chối, đúng thì thành công | US-03.07 | ✅ PASS | 2,3s |
| TC-36 | Học viên | Đăng xuất, đăng nhập lại bằng SĐT + mật khẩu mới | US-03.07 | ✅ PASS | 1,7s |
| TC-37 | Học viên | Quên mật khẩu khi chưa có email: báo hotline, không gửi thư | US-03.05 | ✅ PASS | 2,0s |
| TC-38 | Học viên | Thêm email, đăng nhập được bằng cả email và SĐT | US-03.06 AC2 | ✅ PASS | 4,5s |
| TC-39 | Hệ thống | Gửi mã 6 số qua email, mã lưu dạng băm, chặn gửi lại < 60s | US-03.04 AC1–2 | ✅ PASS | 2,6s |
| TC-40 | Học viên | Sai mã báo "còn 4 lần"; đúng mã → đăng nhập, mật khẩu cũ hết hiệu lực, mã bị vô hiệu | US-03.04 AC3–4 | ✅ PASS | 5,7s |
| TC-41 | Admin | Ẩn khóa A → biến mất khỏi form đăng ký; khách (anon) không đọc được | US-07.03 AC1 | ✅ PASS | 2,3s |
| TC-42 | Học viên | Khóa A đang ẩn: học viên đã duyệt vẫn thấy khóa & học được; học viên chưa mua nhận 404 | US-07.03 AC2, RV-01 | ✅ PASS | 3,6s |
| TC-43 | Admin | Thu hồi quyền học khóa A → bài học báo chưa mở, khóa biến khỏi "đã mở" | US-05.05, BR-42 | ✅ PASS | 3,2s |
| TC-44 | Admin | Xóa khóa B → 2 đơn còn nguyên (course_id null, tên & học phí giữ), bảng admin "(khóa học đã xóa)", không còn nút Duyệt, học viên vẫn thấy lịch sử | US-07.04, RV-02 | ✅ PASS | 4,4s |
| TC-45 | Hệ thống | Chụp màn hình giao diện máy tính | — | ✅ PASS | 0,9s |
| TC-46 | Hệ thống | Không có lỗi JavaScript trên mọi trình duyệt đã dùng | NFR-13 | ✅ PASS | 0s |

**Bổ sung 26/09/2026** (RK-01, RK-03, RK-05, RK-07, RK-09, người xử lý). Cột "Vị trí" là bước đứng trước trong kịch bản.
Cần chạy `supabase/schema.sql` mới nhất trước khi chạy E2E.

| TC | Vị trí | Vai trò | Kịch bản | Truy vết | Kết quả | Thời gian |
| --- | --- | --- | --- | --- | --- | --- |
| TC-47 | sau TC-09 | Admin | Bài học cũ có link video không hợp lệ (ghi thẳng DB): danh sách khóa hiện "1 bài lỗi link video", trang bài học có cảnh báo đỏ; bài hợp lệ không bị cảnh báo | RK-09, BR-24 | ✅ PASS | 1,3s |
| TC-48 | sau TC-23 | Hệ thống | Insert đơn `pending` thứ 2 cùng học viên + khóa → lỗi `23505` | RK-07, BR-34 | ✅ PASS | 0,1s |
| TC-49 | sau TC-26 | Admin | Duyệt / Từ chối ghi `reviewed_by` = admin đang đăng nhập, `reviewed_by_name` = "Admin E2E" | BR-37, US-09.06 | ✅ PASS | (trong TC-26) |
| TC-50 | sau TC-49 | Hệ thống | Sửa tay `reviewed_by_name`/`reviewed_at` qua API không có tác dụng; chuyển đơn về `pending` xóa thông tin xử lý | BR-37 | ✅ PASS | 0,8s |
| TC-51 | sau TC-30 | Học viên | Bài có link không hợp lệ: không có iframe, hiện "Video bài học đang được cập nhật" | RK-09, T11 | ✅ PASS | 0,3s |
| TC-52 | sau TC-37 | Học viên | Nhập email `<SĐT>@SDT.hv.invalid` ở trang Tài khoản → "Địa chỉ email không hợp lệ", email đăng nhập không đổi | RK-01, BR-05 | ✅ PASS | 0,9s |
| TC-53 | sau TC-42 | Admin | Đơn chờ duyệt của khóa đang ẩn hiện "(khóa đang ẩn)", duyệt được → học viên vào được khóa | RK-05, BR-39 | ✅ PASS | 2,2s |
| TC-54 | sau TC-53 | Hệ thống | Xóa tài khoản trong Auth → đơn còn nguyên (`user_id` null, họ tên & học phí giữ); admin thấy "(tài khoản đã xóa)", không có nút Duyệt | RK-03, BR-31 | ✅ PASS | 1,2s |
| TC-55 | sau TC-06 | Admin | Cấp quyền admin cho tài khoản 2 trên trang Học viên (có xác nhận); `role_events` ghi người cấp; tab "Admin" hiện "Cấp quyền bởi Admin E2E"; dòng của mình không có nút; gọi API tự gỡ quyền bị database chặn | RK-13, BR-03 | ✅ PASS | ~5,0s |
| TC-56 | sau TC-29 | Admin | 2 admin mở cùng đơn: admin 2 duyệt, admin 1 (trang cũ) từ chối → "Đơn đã thay đổi…", đơn vẫn `approved`, người xử lý = admin 2 | RK-11, RK-14, BR-36 | ✅ PASS | 2,9s |
| TC-57 | sau TC-56 | Admin | Duyệt (admin 2) → Thu hồi kèm lý do (admin 1) → Duyệt lại: `registration_events` đủ 3 dòng đúng người & lý do; duyệt lại xóa lý do; "Lịch sử (3)" trên giao diện; admin không tự ghi/xóa được lịch sử | RK-12, BR-47 | ✅ PASS | 4,4s |
| TC-58 | trước TC-45 | Admin | Gỡ quyền admin 2 (có xác nhận) → admin 2 vào /admin bị chuyển về /courses; nhật ký `user>admin, admin>user` | RK-13 | ✅ PASS | 2,1s |
| TC-59 | sau TC-16 | Khách | Ô mật khẩu có `minlength=8`; bỏ qua kiểm tra trình duyệt, gửi mật khẩu 7 ký tự → server báo "Mật khẩu cần ít nhất 8 ký tự" | RV-03, BR-09 | ✅ PASS | 2,3s |
| TC-60 | sau TC-59 | Khách | File chữ đổi tên `.png` (MIME image/png) vượt qua trình duyệt → server từ chối theo nội dung file, không tạo tài khoản | RK-08, BR-32 | ✅ PASS | 0,7s |
| TC-61 | sau TC-44 | Admin | Đơn chờ duyệt của khóa B đã xóa: học viên 2 thấy "Khóa học đã ngừng"; admin mở tab "Khóa đã xóa – cần hoàn tiền", chỉ có đơn đúng diện; Từ chối kèm lý do "Đã hoàn tiền…" → học viên thấy lý do | RK-04, BR-49 | ✅ PASS | 3,6s |
| TC-62 | sau TC-58 | Hệ thống | `/`, `/login`, `/register` có CSP (`frame-ancestors 'none'`, `object-src 'none'`), X-Frame-Options DENY, nosniff, Referrer-Policy; không có X-Powered-By | RV-16 | ✅ PASS | 0,1s |
| TC-63 | sau TC-62 | Hệ thống | `hit_rate_limit`: giới hạn 2 → lần 3 bị chặn, kiểm tra không ghi đúng; khách không gọi được hàm, không đọc được `rate_limits` | RK-06 | ✅ PASS | 0,6s |
| TC-64 | sau TC-63 | Khách | Sai mật khẩu 5 lần cho 1 SĐT (không tồn tại) từ 1 IP → lần 6 báo "Bạn đã nhập sai quá nhiều lần"; người dùng ở IP khác vẫn đăng nhập được | RK-06, BR-12 | ✅ PASS | 8,9s |

Kiểm tra thủ công Đợt 4 (26/09/2026): `npm run test:e2e` trên project chưa khai báo `E2E_SUPABASE_REF` → từ chối chạy (RK-10);
build với `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co` (giống job `check` của CI) → thành công.
Mỗi lần chạy E2E dùng header `x-forwarded-for: e2e-<timestamp>` để giới hạn tần suất không cộng dồn giữa các lần chạy; khóa được dọn khi kết thúc.
Turnstile chưa kiểm thử tự động (cần khóa Cloudflare) – kiểm tra thủ công sau A-4.

Các TC cũ được mở rộng ở Đợt 3: TC-01 (bảng `registration_events`, `role_events`, cột `review_note`), TC-10 (khách không đọc được 2 bảng lịch sử),
TC-26 (từ chối kèm lý do), TC-28 (dòng "Lý do: …"), TC-30 (học viên thấy lý do), TC-43 (thu hồi qua ô lý do), TC-50 (lý do không sửa tay được).

### 3.1. Test case dự kiến phiên bản 0.2 (⬜ chưa triển khai)

Mỗi đợt thêm các bước dưới đây vào `scripts/e2e.mjs`. Vai trò mới: **Staff** (tài khoản `e2e-staff-*`), **Khách** dùng khóa miễn phí.
Dữ liệu test mới (gói, buổi, tiến độ, phiếu, lead, ảnh bìa `[E2E]`) phải được dọn khi kết thúc như hiện nay.

| TC | Đợt | Vai trò | Kịch bản | Truy vết |
| --- | --- | --- | --- | --- |
| TC-65 | 7 | Admin / Hệ thống | ✅ PASS (bước "[Admin] Chuyển tài khoản sang vai trò Nhân viên…"): admin đổi vai trò qua UI ghi `role_events`; staff gọi API tự nâng quyền (0 dòng), cấp quyền cho học viên ("Chỉ admin…"), sửa profile admin / sửa khóa học (0 dòng) bị chặn; staff đọc được đơn | US-10.01, BR-70 → BR-73 |
| TC-66 | 7 | Staff | ✅ PASS (2 bước): vào `/admin` → `/admin/registrations`, menu chỉ có Đơn đăng ký + Học viên, `/admin/courses` bị chuyển về, không có ô đổi vai trò; duyệt đơn trên UI → `reviewed_by` = staff | US-10.02, US-10.03 |
| TC-67 | 7 | Hệ thống | ✅ PASS: `/admin?status=approved` chuyển sang `/admin/registrations?status=approved`, tab Đã duyệt được chọn | FR-070 |
| TC-68 | 8 | Admin | ✅ PASS – Tạo khóa free / program (Vẹo lưng) / premium 1:1 có ảnh bìa (nén, magic bytes); staff/anon không upload được vào `course-covers` | US-11.02, T30 |
| TC-69 | 8 | Khách | ✅ PASS – Trang chủ 3 nhóm, lọc Vẹo lưng / Vẹo ngực; `/khoa-hoc/:id` có đề cương, **không** có link video trong HTML | US-11.01, US-11.03 |
| TC-70 | 8 | Khách | ✅ PASS – Khóa free: xem video không đăng nhập; gọi `get_lesson_video` bài chương trình trả `null` | US-11.04, BR-75, BR-93 |
| TC-71 | 8 | Khách | ✅ PASS – Premium: gửi lead (họ tên + SĐT) → lead lưu đúng, trang mở tab Zalo; "Mở Zalo ngay" lưu lượt ẩn danh; anon không đọc được `leads` | US-11.05, BR-104 |
| TC-72 | 8 | Staff | ✅ PASS – `/admin/leads` thấy lead mới, chuyển "Đã liên hệ"; 2 staff cùng xử lý → người sau bị từ chối | FR-175 |
| TC-73 | 8 | Khách | ✅ PASS – Box đăng ký không tick đồng ý → lỗi (cả khi bỏ qua trình duyệt); tick → `consent_at` được ghi; `/chinh-sach-bao-mat` truy cập được | US-11.06, BR-106 |
| TC-74 | 9 | Admin | ✍️ Thêm gói 1 tháng / 3 tháng (số buổi mặc định 12 / 36); gói 1 tháng thứ 2 bị chặn trùng | US-12.01, BR-77 |
| TC-75 | 9 | Khách | ✍️ Chọn Vẹo lưng – 3 tháng → QR đúng số tiền; gửi form sửa giá → server lưu giá gói; đơn lưu snapshot gói | US-12.02, BR-78, BR-79 |
| TC-76 | 9 | Staff | ✍️ Duyệt → `access_until` ≈ now + 1 tháng; gia hạn khi còn hạn → cộng dồn; hạn cũ đặt về quá khứ rồi gia hạn → tính từ lúc duyệt; 2 lần duyệt đồng thời không cộng sai | US-12.03, BR-80 |
| TC-77 | 9 | Bệnh nhân | ✍️ Đơn chờ thứ 2 cùng chương trình bị chặn (UI + unique index); đã approved vẫn gửi được đơn gia hạn | BR-84 |
| TC-78 | 9 | Bệnh nhân | ✍️ Hết hạn (sửa `access_until` về quá khứ): "Đã hết hạn", tiến độ còn, video không phát, nút Gia hạn chọn sẵn chương trình | US-12.04, US-12.05, BR-85 |
| TC-79 | 10 | Admin | Tạo khung 3 buổi × 6 bài; sao chép buổi; bài không có video lưu được; link sai bị chặn; cảnh báo thiếu buổi / thiếu video | US-13.01, US-13.02 |
| TC-80 | 10 | Bệnh nhân | Tick 6 bài Buổi 1 bằng "Hoàn thành & bài tiếp theo" → Buổi 2 mở; trước đó Buổi 2 🔒 và insert tiến độ Buổi 2 qua API bị RLS chặn | US-13.03, US-13.04, BR-89 |
| TC-81 | 10 | Bệnh nhân | Gói 1 buổi (sửa `sessions = 1` cho test) → Buổi 2 🔒 "Gia hạn để mở"; % = 6/6 · 100% | BR-83, BR-91 |
| TC-82 | 10 | Bệnh nhân | Bỏ tick 1 bài Buổi 1 (xác nhận) → Buổi 2 khóa lại; tick lại → mở | BR-90 |
| TC-83 | 10 | Bệnh nhân | "Khóa học của tôi": thanh tiến độ, "Tiếp tục Buổi X – Bài Y" mở đúng bài | US-13.05, US-13.06 |
| TC-84 | 10 | Staff | Xem trước mọi buổi, không có ô tick | US-13.07 |
| TC-85 | 11 | Staff | Tạo bệnh nhân (không email) + cấp gói tiền mặt → mật khẩu 8 ký tự hiện một lần; `source = zalo`, đơn `approved` `source = staff`, người xử lý = staff, lịch sử `new → approved`, hạn đúng | US-14.01, BR-94 → BR-97 |
| TC-86 | 11 | Bệnh nhân | Đăng nhập bằng SĐT + mật khẩu được cấp → hộp nhắc đổi; "Để sau" vào học được; đổi mật khẩu → hộp không còn, đăng nhập bằng mật khẩu mới | US-14.02, BR-96 |
| TC-87 | 11 | Staff | SĐT trùng bị báo; cấp gia hạn cho bệnh nhân có sẵn (cộng dồn); cấp lại mật khẩu → mật khẩu cũ hết hiệu lực, `account_events` ghi; không có nút với tài khoản admin | US-14.03, US-14.04, BR-99 |
| TC-88 | 11 | Staff | Lọc bệnh nhân theo nguồn Zalo + sắp hết hạn | US-14.05 |
| TC-89 | 12 | Admin | Thêm câu hỏi thang 0–10 vào mẫu phiếu; staff không sửa được mẫu | US-15.01 |
| TC-90 | 12 | Bệnh nhân | Gửi phiếu từ trình học → trạng thái Mới; phiếu thứ 6 trong ngày bị chặn; bệnh nhân khác không đọc được | US-15.02, BR-101, BR-103 |
| TC-91 | 12 | Bệnh nhân | Tick bài cuối buổi cuối đã mua → thẻ chúc mừng có nút phiếu tham vấn | US-15.03 |
| TC-92 | 12 | Staff | Xem câu trả lời, chuyển Đã liên hệ kèm ghi chú nội bộ; bệnh nhân thấy trạng thái nhưng không thấy ghi chú nội bộ | US-15.04, BR-102 |
| TC-93 | 13 | Admin | Dashboard: số liệu khớp dữ liệu test (bệnh nhân mới Web/Zalo, đơn chờ, sắp hết hạn, phiếu mới, lead mới); doanh thu theo hình thức | US-16.01, US-16.03 |
| TC-94 | 13 | Staff | Dashboard không có doanh thu; `revenue_report()` bị từ chối | US-16.03 AC2 |

Kết quả Đợt 7 (27/09/2026, Chrome, Supabase theo `.env.local` với `E2E_SUPABASE_REF` đặt tạm, schema mới đã chạy): **67/67 bước PASS**, dữ liệu test đã dọn.
Lần chạy đầu đỏ 1 bước (TC-66) do test đọc URL trước khi trang `/admin` chuyển tiếp phía trình duyệt – đã sửa test chờ URL cuối.
Kết quả Đợt 8 (27/09/2026, schema mới đã chạy): **73/73 bước PASS**, dữ liệu test (khóa, bài, khách quan tâm, ảnh bìa) đã dọn. 2 lần chạy đầu đỏ do test:
đọc URL trước khi trang khóa trả phí chuyển khách tới đăng nhập (redirect phía trình duyệt), và locator "Lộ trình riêng" khớp 2 chỗ – đã sửa test.
Đợt 7 đã sửa các TC cũ: TC-01 (hàm `is_staff`), TC-24/25/28/56/57… (route `/admin/registrations`),
TC-55/TC-58 (ô chọn vai trò, tab "Nhân viên & Admin"), TC-56 (thông báo "có thể người khác vừa xử lý").

Đợt 9 (phase "9c" của `e2e.mjs`, dùng chương trình + bệnh nhân riêng): TC-74 ↔ bước "[Admin] Tạo chương trình có học phí…", TC-75 ↔ "[Khách] Trang giới thiệu chọn gói 3 tháng…", TC-76 ↔ "[Nhân viên] Duyệt đơn gói 1 tháng…" + "[Bệnh nhân] Gia hạn gói 3 tháng…", TC-77 ↔ phần đơn chờ thứ 2 của bước gia hạn, TC-78 ↔ "[Bệnh nhân] Hết hạn…". Đã sửa TC-24/28 (thêm cột Gói, Hạn học).

**TC cũ phải sửa khi triển khai v0.2**: TC-01 (bảng/cột mới), TC-10 (RLS: đề cương công khai, `video_url` ẩn), TC-07/TC-08 (form khóa có loại, bài thuộc buổi),
TC-13/TC-14 (chọn gói), TC-18/TC-19 (ô đồng ý), TC-21/TC-30 (trình học mới), TC-23 + TC-48 (unique index chỉ còn `pending`),
TC-24/TC-28 (`/admin/registrations`, cột gói/nguồn), TC-29/TC-55/TC-58 (`/admin/patients`, chọn vai trò), TC-42/TC-43 (quyền theo hạn học).

## 4. Khoảng trống kiểm thử (cần bổ sung)

| # | Kịch bản chưa được test tự động | Ưu tiên | Trạng thái |
| --- | --- | --- | --- |
| G-01 | Học viên đã được duyệt khi khóa bị **ẩn** | Cao | ✅ Đã có (TC-42) |
| G-02 | Rollback khi upload ảnh / insert đơn thất bại (US-02.06) | Cao | ⬜ |
| G-03 | Mã reset hết hạn sau 10 phút; khóa sau 5 lần sai | Trung bình | ⬜ |
| G-04 | Open redirect `next=//evil.com`, `next=/\evil.com` | Trung bình | 🟡 Đã thăm dò thủ công 26/09/2026: không khai thác được; chưa có bước E2E |
| G-05 | Xóa khóa học: bài học bị xóa, đơn được giữ | Trung bình | ✅ Đã có (TC-44) |
| G-06 | Sửa/Xóa bài học, sửa khóa học | Trung bình | ⬜ |
| G-07 | Tìm kiếm học viên | Thấp | 🟡 Dùng gián tiếp trong TC-29 |
| G-08 | Video TikTok / Shorts hiển thị khung dọc | Thấp | 🟡 Lưu link TikTok có trong TC-09, chưa kiểm tra khung hiển thị |
| G-09 | Ảnh HEIC từ iPhone | Thấp | ⬜ Test thủ công trên thiết bị thật |
| G-10 | Unit test các hàm thuần trong `lib/` (`normalizePhone`, `isSupportedVideoUrl`…) | Trung bình | ⬜ |
| G-11 | Các risk case RK-01 → RK-15 (xem project-review.md §7) | Theo mức rủi ro | 🟡 RK-01, 03, 05, 07, 09 có TC-47 → TC-54; RK-11 → RK-14 có TC-55 → TC-58; còn RK-02, 04, 06, 08, 10, 15 |
| G-13 | Turnstile bật trên production (widget hiện, token hợp lệ / hết hạn) | Trung bình | ⬜ Thủ công sau khi có khóa (roadmap A-4) |
| G-12 | Chặn gỡ **admin cuối cùng** (không test được trên database dùng chung vì luôn có admin thật; cần staging – RK-10) | Trung bình | ⬜ Đã kiểm tra bằng đọc code trigger |

## 5. Checklist kiểm thử thủ công trước release

**Thiết bị**: iPhone Safari, Android Chrome, máy tính Chrome/Edge; màn hình 360px, 768px, 1280px+.

- [ ] Trang chủ hiển thị đúng, ảnh không vỡ, font tiếng Việt đúng dấu.
- [ ] QR quét được bằng app ngân hàng thật, số tiền & nội dung đúng.
- [ ] Đăng ký trên điện thoại thật với ảnh chụp màn hình thật (kể cả HEIC trên iPhone).
- [ ] Nhận email mã quên mật khẩu thật (kiểm tra cả hộp Spam), tiêu đề/nội dung đúng thương hiệu.
- [ ] Video YouTube & TikTok phát được trên điện thoại.
- [ ] Admin xem ảnh chuyển khoản, duyệt, học viên thấy khóa mở ngay.
- [ ] Bàn phím: Tab qua menu, form; focus nhìn thấy.
- [ ] Lighthouse mobile trang chủ: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90.

## 6. Tiêu chí hoàn thành (Definition of Done)

Một tính năng được coi là xong khi:
1. Tất cả AC trong user story đạt.
2. `npm run lint` và `npm run build` không lỗi.
3. `npm run test:e2e` pass; tính năng mới có bước E2E (hoặc lý do bỏ qua được ghi lại).
4. RLS cho dữ liệu mới được kiểm tra với anon/học viên/admin.
5. Tài liệu liên quan đã cập nhật (SRS, user story, DB, API, screen spec).
6. Kiểm thử thủ công trên điện thoại thật cho thay đổi UI.

## 7. Mẫu báo lỗi
Xem [../templates/bug-report.md](../templates/bug-report.md).
