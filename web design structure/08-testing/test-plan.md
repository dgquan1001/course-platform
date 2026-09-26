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

**Lần chạy gần nhất**: 26/09/2026 · commit `0f6cfef` · Chrome · Supabase theo `.env.local` · **46/46 PASS** · dữ liệu test đã dọn sạch
(đã kiểm tra lại: 0 khóa `[E2E]`, 0 tài khoản `e2e-*`, 0 đơn test còn sót).

| TC | Vai trò | Kịch bản | Truy vết | Kết quả | Thời gian |
| --- | --- | --- | --- | --- | --- |
| TC-01 | Hệ thống | Database đủ bảng, bucket `payment-proofs`, cột snapshot `course_title`/`amount` | NFR-09, FR-097 | ✅ PASS | 1,8s |
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
| TC-24 | Admin | Bảng đơn đủ 11 cột ở cả 4 tab | US-05.01 | ✅ PASS | 8,0s |
| TC-25 | Admin | Xem ảnh chuyển khoản (tải được) và duyệt khóa A | US-05.02, US-05.03 | ✅ PASS | 3,8s |
| TC-26 | Admin | Từ chối đơn khóa B của học viên 1 | US-05.04 | ✅ PASS | 1,7s |
| TC-27 | Admin | Đơn không có email hiển thị "Không có email" | US-02.03 AC1 | ✅ PASS | <0,1s |
| TC-28 | Admin | Tab Đã duyệt / Từ chối / Tất cả đúng trạng thái, ngày xử lý, nút | US-05.01 | ✅ PASS | 3,1s |
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
| G-11 | Các risk case RK-01 → RK-10 (xem project-review.md §7) | Theo mức rủi ro | ⬜ Chờ duyệt phương án |

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
