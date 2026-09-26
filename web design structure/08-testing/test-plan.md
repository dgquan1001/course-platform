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

- Yêu cầu: `npm run build`, `.env.local` đầy đủ (có service role), Chrome hoặc Edge.
- Chạy: `npm run test:e2e` (tùy chọn `E2E_PORT`, `BROWSER_CHANNEL=msedge`).
- Script tự khởi động `next start` cổng 3123 với `MAIL_OUTBOX_DIR` (email ghi ra file JSON để đọc mã).
- Dữ liệu test: tài khoản `e2e-*@example.com`, SĐT `09<8 số>`/`08<8 số>`, khóa `[E2E] …`; **tự xóa khi kết thúc** (kể cả khi lỗi).
- Kết quả: log từng bước ✓/✗, ảnh chụp màn hình trong `test-results/`, kiểm tra không có lỗi JavaScript trên trang.
- Thiết bị giả lập: điện thoại (học viên 1) và máy tính (học viên 2, admin).

> ⚠️ E2E dùng **Supabase thật** trong `.env.local`. Nên trỏ tới project staging, không chạy trên production giờ cao điểm.

## 3. Danh mục test case E2E & truy vết

| TC | Vai trò | Kịch bản | User story / FR |
| --- | --- | --- | --- |
| TC-01 | Hệ thống | Database có đủ bảng và bucket `payment-proofs` | NFR-09 |
| TC-02 | Hệ thống | Tạo admin test, trigger tự sinh profile | BR-01 |
| TC-03 | Khách | `/admin`, `/courses`, `/account` chuyển tới đăng nhập | US-03.02 |
| TC-04 | Admin | Đăng nhập sai mật khẩu hiển thị lỗi | US-03.01 AC2 |
| TC-05 | Admin | Đăng nhập bằng email, có toast, nút "Quản trị" tô nổi bật | US-03.01, US-08.02 |
| TC-06 | Admin | Tạo 2 khóa mở đăng ký và 1 khóa ẩn qua UI | US-07.01 |
| TC-07 | Admin | Thêm bài học YouTube cho khóa A | US-07.05 |
| TC-08 | Hệ thống | RLS: anon chỉ thấy khóa mở; không thấy khóa ẩn, bài học, đơn, mã reset | US-04.04, NFR-05 |
| TC-09 | Khách | Trang chủ có thông tin trung tâm, bác sĩ, box 3 bước | US-01.01 |
| TC-10 | Khách | Nút "Đăng ký" của khóa cuộn tới form và chọn sẵn khóa | US-01.03 |
| TC-11 | Khách | Ô chọn khóa chỉ có khóa đang mở, kèm giá | US-02.07 |
| TC-12 | Khách | QR cập nhật theo khóa và SĐT | US-02.01 |
| TC-13 | Khách | File không phải ảnh bị từ chối trên trình duyệt | US-02.04 AC1 |
| TC-14 | Khách | Ảnh lớn được nén trước khi upload | US-02.04 AC2 |
| TC-15 | Khách | SĐT sai: báo lỗi, không lưu gì | US-02.03 AC3 |
| TC-16 | Khách | Đăng ký có email (điện thoại): tạo tài khoản, đơn, ảnh đã nén | US-02.02 |
| TC-17 | Khách | Đăng ký không email (máy tính) thành công | US-02.03 |
| TC-18 | Khách | Trùng email hoặc SĐT bị từ chối | US-02.02 AC2, US-02.03 AC2 |
| TC-19 | Học viên | Thấy đơn đang chờ; khóa A còn khóa; không vào được `/admin` | US-02.08, US-04.02 AC2 |
| TC-20 | Học viên | Đăng ký thêm khóa B: điền sẵn, không hỏi email/mật khẩu | US-02.05 AC1 |
| TC-21 | Học viên | Đăng ký lại khóa A đang chờ bị chặn | US-02.05 AC2 |
| TC-22 | Admin | Bảng đơn đủ cột ở cả 4 tab | US-05.01 |
| TC-23 | Admin | Xem ảnh chuyển khoản (tải được) và duyệt khóa A | US-05.02, US-05.03 |
| TC-24 | Admin | Từ chối đơn khóa B của học viên 1 | US-05.04 |
| TC-25 | Admin | Đơn không có email hiển thị "Không có email" | US-02.03 AC1 |
| TC-26 | Admin | Tab Đã duyệt / Từ chối / Tất cả đúng trạng thái, ngày xử lý, nút | US-05.01 |
| TC-27 | Admin | Danh sách học viên đúng trạng thái từng khóa | US-06.01 |
| TC-28 | Học viên | Khóa A đã mở, khóa B báo chưa xác nhận; xem được video | US-04.01, US-04.03 |
| TC-29 | Học viên | Điện thoại: bấm "Tài khoản" → Đăng xuất; đăng nhập lại bằng email | US-03.03, US-08.03 |
| TC-30 | Học viên | Đăng nhập bằng SĐT có dấu cách, dạng `+84` | US-03.01 AC1 |
| TC-31 | Học viên | Rê chuột "Tài khoản" hiện menu đủ mục | US-08.03 |
| TC-32 | Học viên | Trang Tài khoản hiển thị thông tin; cập nhật họ tên | US-03.06 AC1 |
| TC-33 | Học viên | Đổi mật khẩu: sai mật khẩu hiện tại bị từ chối, đúng thì thành công | US-03.07 |
| TC-34 | Học viên | Đăng xuất, đăng nhập lại bằng SĐT + mật khẩu mới | US-03.07 |
| TC-35 | Học viên | Quên mật khẩu khi chưa có email: báo hotline, không gửi thư | US-03.05 |
| TC-36 | Học viên | Thêm email vào tài khoản, đăng nhập được bằng email | US-03.06 AC2 |
| TC-37 | Hệ thống | Gửi mã 6 số qua email, mã lưu dạng băm, chặn gửi lại liên tục | US-03.04 AC1–2 |
| TC-38 | Học viên | Sai mã bị báo; đúng mã + mật khẩu mới thì đăng nhập, mật khẩu cũ hết hiệu lực | US-03.04 AC3–4 |
| TC-39 | Admin | Thu hồi quyền học khóa A → học viên không xem được nữa | US-05.05, BR-42 |
| TC-40 | Admin | Ẩn khóa A → biến mất khỏi ô chọn khóa | US-07.03 |
| TC-41 | Hệ thống | Chụp màn hình giao diện máy tính | — |
| TC-42 | Hệ thống | Không có lỗi JavaScript trên mọi trình duyệt đã dùng | NFR-13 |

## 4. Khoảng trống kiểm thử (cần bổ sung)

| # | Kịch bản chưa được test tự động | Ưu tiên |
| --- | --- | --- |
| G-01 | Học viên đã được duyệt khi khóa bị **ẩn** (RV-01) | Cao |
| G-02 | Rollback khi upload ảnh / insert đơn thất bại (US-02.06) | Cao |
| G-03 | Mã reset hết hạn sau 10 phút; khóa sau 5 lần sai | Trung bình |
| G-04 | Open redirect `next=//evil.com` | Trung bình |
| G-05 | Xóa khóa học cascade bài học + đơn | Trung bình |
| G-06 | Sửa/Xóa bài học, sửa khóa học | Trung bình |
| G-07 | Tìm kiếm học viên | Thấp |
| G-08 | Video TikTok / Shorts hiển thị khung dọc | Thấp |
| G-09 | Ảnh HEIC từ iPhone | Thấp (test thủ công trên thiết bị thật) |
| G-10 | Unit test các hàm thuần trong `lib/` | Trung bình |

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
