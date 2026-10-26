# Kế hoạch kiểm thử

## 1. Chiến lược

| Cấp độ | Hiện trạng | Công cụ | Mục tiêu đề xuất |
| --- | --- | --- | --- |
| Static | ✅ | TypeScript, ESLint (`next lint`), build OpenNext (Cloudflare) | Chạy trong CI trên mọi PR |
| Unit | ❌ Chưa có | Đề xuất Vitest | Hàm thuần: `normalizePhone`, `getVideoEmbed`, `formatPrice`, `vietQrUrl`, `safeNext`, `maskEmail` |
| Integration (DB/RLS) | 🟡 Nằm trong E2E | supabase-js với anon/service role | Tách riêng bộ test RLS chạy trên Supabase local |
| End-to-end | ✅ | `scripts/e2e.mjs` – playwright-core + Chrome/Edge thật + Supabase thật; chạy trên Node hoặc Cloudflare workerd (`--workers`) | Giữ nguyên, bổ sung theo tính năng mới |
| Manual / UAT | 🟡 | Checklist mục 5 | Trước mỗi lần release |

## 2. Môi trường E2E

- Yêu cầu: bản build, `.env.local` đầy đủ (có service role), Chrome hoặc Edge, `supabase/schema.sql` mới nhất đã chạy.
- Chạy thông thường: `npm run build` rồi `npm run test:e2e` (tùy chọn `E2E_PORT`, `BROWSER_CHANNEL=msedge`).
- **Khi đang chạy `npm run dev`** (dev server ghi đè thư mục `.next` làm hỏng bản build), build vào thư mục riêng:

      $env:NEXT_DIST_DIR=".next-e2e"; npm run build; npm run test:e2e      # PowerShell
      NEXT_DIST_DIR=.next-e2e npm run build && NEXT_DIST_DIR=.next-e2e npm run test:e2e   # bash

- **Chế độ workers khi đang chạy `npm run dev`** (Đợt 20): `npx opennextjs-cloudflare build` luôn build vào `.next` – trùng thư mục dev server đang ghi
  → lỗi `Invariant: no direct app page entry found for /account`. Cách làm: tắt dev server, **hoặc** chép mã nguồn sang thư mục riêng (bỏ `node_modules`, `.next*`,
  `.open-next`, `.wrangler`, `.git`), chạy `npm ci` + `npm install-scripts approve esbuild workerd unrs-resolver` + `npm rebuild` trong bản sao rồi build +
  `node scripts/e2e.mjs --workers` ở đó. **Không dùng junction `node_modules`**: OpenNext gom nhầm `sharp` (đường dẫn ngoài thư mục app) → build lỗi `.node`.
- Script tự khởi động server cổng 3123 kèm hộp thư giả HTTP (`MAIL_OUTBOX_URL` – thư JSON ghi vào `test-results/mail-outbox` để đọc mã).
  Hai chế độ (Đợt 17):
  - `npm run test:e2e` – **Node** (`next start`, cần `npm run build`).
  - `npm run test:e2e:workers` – **Cloudflare Workers / workerd** (`opennextjs-cloudflare preview`, cần `npx opennextjs-cloudflare build`):
    giống production, **là chuẩn nghiệm thu** (RK-50). Script tạo `.dev.vars` tạm từ `.env.local` và xóa khi kết thúc; IP giả lập qua
    header `cf-connecting-ip` (Node: `x-forwarded-for`). Bước TC-102 chỉ chạy ở chế độ này.
- Dữ liệu test: tài khoản `e2e-*@example.com`, SĐT `09<8 số>`/`08<8 số>`, khóa `[E2E] … <timestamp>`; **tự xóa khi kết thúc**
  (kể cả khi lỗi; mọi khóa mang timestamp của lần chạy đều bị xóa).
- Kết quả: log từng bước ✔/✘, ảnh chụp màn hình trong `test-results/` (khi lỗi: `loi-<n>.png` của mọi trang đang mở),
  kiểm tra không có lỗi JavaScript trên trang.
- Thiết bị giả lập: điện thoại iPhone 13 (học viên 1) và máy tính 1366×900 (học viên 2, admin).

> ⚠️ E2E dùng **Supabase thật** trong `.env.local`. Nên trỏ tới project staging, không chạy trên production giờ cao điểm.

## 3. Danh mục test case E2E & kết quả

**Lần chạy gần nhất**: **17/10/2026** · sau Đợt 21 bảo mật phiên đăng nhập (project-review §7.13) · Node 105/105 · Workers 106/106 (11 lỗi hydration RK-54 ở trang quản trị ghi riêng – trước 18)
· sau Đợt 20 song ngữ + giao diện hiện đại (§7.12) · Node 102/102 · Workers 103/103 (18 lỗi hydration RK-54 ở trang quản trị ghi riêng, không liên quan Đợt 20)
· sau Đợt 19 (§7.11): Node 101/101 · Workers 102/102 (14 lỗi RK-54 ghi riêng)
· trước đó 05/10/2026: Node 99/99, Workers 100/100 (17 lỗi hydration ghi nhận riêng – RK-54) · Chrome · Supabase theo `.env.local` với `E2E_SUPABASE_REF` đặt tạm (chưa có staging) · dữ liệu test dọn sạch.

**Các lần chạy theo thời gian (cũ → mới)**:

| Ngày | Sau đợt | Kết quả |
| --- | --- | --- |
| 26/09/2026 | Đợt 1 (review vòng 1) | 46/46 |
| 26/09/2026 | Đợt 2 → 3 | 53/53 → 57/57 |
| 26/09/2026 | Đợt 4 → 5 | **63/63** (TC-01 → TC-64; TC-49 nằm trong bước TC-26) – chi tiết dọn dữ liệu ở đoạn dưới |
| 27/09/2026 | Đợt 7 / 8 / 9 / 10 | 67/67 / 73/73 / 78/78 / 83/83 |
| 27/09/2026 | Đợt 11 → 13 | 96/96 |
| 29/09/2026 | Đợt 15 | 98/98 |
| 04/10/2026 | Đợt 17 P0 → P2 (Next 15, Cloudflare) | Node 99/99 · Workers 100/100 (12 lỗi RK-54 ghi riêng) |
| 05/10/2026 | Rà soát performance & security | Node 99/99 · Workers 100/100 (17 lỗi RK-54 ghi riêng) |
| 17/10/2026 | Đợt 19 (trang chủ mới) | Node 101/101 · Workers 102/102 (14 lỗi RK-54 ghi riêng) |
| 17/10/2026 | Đợt 20 (song ngữ, giao diện hiện đại) | Node 102/102 · Workers 103/103 (18 lỗi hydration RK-54 ở trang quản trị ghi riêng, không liên quan Đợt 20) |
| 17/10/2026 | Đợt 21 (bảo mật phiên đăng nhập) | Node 105/105 · Workers 106/106 (11 lỗi hydration RK-54 ở trang quản trị ghi riêng – trước 18) |
| 17/10/2026 | Sau khi dọn dự án (build sạch, trước khi push) | Node 105/105 · Workers 106/106 (13 lỗi hydration RK-54 ghi riêng) |

Ghi chú lần chạy 26/09/2026 (Đợt 4 – 5): dữ liệu test đã dọn sạch
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

### 3.1. Test case phiên bản 0.2 (✅ Đợt 7 → 13 đã chạy)

Mỗi đợt thêm các bước dưới đây vào `scripts/e2e.mjs`. Vai trò mới: **Staff** (tài khoản `e2e-staff-*`), **Khách** dùng khóa miễn phí.
Dữ liệu test mới (gói, buổi, tiến độ, phiếu, lead, ảnh bìa `[E2E]`) phải được dọn khi kết thúc như hiện nay.

| TC | Đợt | Vai trò | Kịch bản | Truy vết |
| --- | --- | --- | --- | --- |
| TC-65 | 7 | Admin / Hệ thống | ✅ PASS (bước "[Admin] Chuyển tài khoản sang vai trò Nhân viên…"): admin đổi vai trò qua UI ghi `role_events`; staff gọi API tự nâng quyền (0 dòng), cấp quyền cho học viên ("Chỉ admin…"), sửa profile admin / sửa khóa học (0 dòng) bị chặn; staff đọc được đơn | US-10.01, BR-70 → BR-73 |
| TC-66 | 7 | Staff | ✅ PASS (2 bước): vào `/admin` → `/admin/registrations`, menu chỉ có Đơn đăng ký + Học viên, `/admin/courses` bị chuyển về, không có ô đổi vai trò; duyệt đơn trên UI → `reviewed_by` = staff | US-10.02, US-10.03 |
| TC-67 | 7 | Hệ thống | ✅ PASS: `/admin?status=approved` chuyển sang `/admin/registrations?status=approved`, tab Đã duyệt được chọn | FR-070 |
| TC-68 | 8 | Admin | ✅ PASS – Tạo khóa free / program (Vẹo lưng) / premium 1:1 có ảnh bìa (nén, magic bytes); staff/anon không upload được vào `course-covers` | US-11.02, T30 |
| TC-69 | 8 | Khách | ✅ PASS – Trang chủ 3 nhóm, lọc Vẹo lưng / Vẹo ngực; `/khoa-hoc/:id` có đề cương, **không** có link video trong HTML | US-11.01, US-11.03 |
| TC-70 | 8 | Khách | ✅ PASS – Khóa free: xem video không đăng nhập; khách đọc bài chương trình qua API không nhận được dòng / link (Đợt 10: RLS `can_view_lesson`, thay `get_lesson_video`) | US-11.04, BR-75, BR-93 |
| TC-71 | 8 | Khách | ✅ PASS – Premium: gửi lead (họ tên + SĐT) → lead lưu đúng, trang mở tab Zalo; "Mở Zalo ngay" lưu lượt ẩn danh; anon không đọc được `leads` | US-11.05, BR-104 |
| TC-72 | 8 | Staff | ✅ PASS – `/admin/leads` thấy lead mới, chuyển "Đã liên hệ"; 2 staff cùng xử lý → người sau bị từ chối | FR-175 |
| TC-73 | 8 | Khách | ✅ PASS – Box đăng ký không tick đồng ý → lỗi (cả khi bỏ qua trình duyệt); tick → `consent_at` được ghi; `/chinh-sach-bao-mat` truy cập được | US-11.06, BR-106 |
| TC-74 | 9 | Admin | ✅ PASS – Thêm gói 1 tháng / 3 tháng (số buổi mặc định 12 / 36); gói 1 tháng thứ 2 bị chặn trùng | US-12.01, BR-77 |
| TC-75 | 9 | Khách | ✅ PASS – Chọn Vẹo lưng – 3 tháng → QR đúng số tiền; gửi form sửa giá → server lưu giá gói; đơn lưu snapshot gói | US-12.02, BR-78, BR-79 |
| TC-76 | 9 | Staff | ✅ PASS – Duyệt → `access_until` ≈ now + 1 tháng; gia hạn khi còn hạn → cộng dồn; hạn cũ đặt về quá khứ rồi gia hạn → tính từ lúc duyệt; 2 lần duyệt đồng thời không cộng sai | US-12.03, BR-80 |
| TC-77 | 9 | Khách hàng | ✅ PASS – Đơn chờ thứ 2 cùng chương trình bị chặn (UI + unique index); đã approved vẫn gửi được đơn gia hạn | BR-84 |
| TC-78 | 9 | Khách hàng | ✅ PASS – Hết hạn (sửa `access_until` về quá khứ): "Đã hết hạn", tiến độ còn, video không phát, nút Gia hạn chọn sẵn chương trình | US-12.04, US-12.05, BR-85 |
| TC-79 | 10 | Admin | ✅ PASS – Tạo chương trình kèm khung 3 buổi × 2 bài (bài chưa có video lưu được); sao chép buổi → Buổi 4, xóa buổi (xác nhận); ↓/↑ đổi thứ tự buổi; thêm video cho bài; cảnh báo bài chưa có video. Link sai bị chặn: TC-09 | US-13.01, US-13.02 |
| TC-80 | 10 | Khách hàng | ✅ PASS – Trước khi xong Buổi 1: Buổi 2 🔒 "Hoàn thành Buổi 1 để mở", không có iframe, đọc bài Buổi 2 qua API không trả dòng, insert tiến độ Buổi 2 bị RLS chặn; tick 2 bài Buổi 1 bằng "Hoàn thành & bài tiếp theo" → chuyển thẳng sang Buổi 2 – Bài 1 | US-13.03, US-13.04, BR-89 |
| TC-81 | 10 | Khách hàng | ✅ PASS – Gói mở 2 buổi (sửa `plan_sessions` cho test): Buổi 3 🔒 "Gia hạn để mở buổi này"; xong Buổi 2 → thẻ "Chúc mừng! Bạn đã hoàn thành các buổi tập đã mở"; insert tiến độ Buổi 3 bị chặn | BR-83, BR-91 |
| TC-82 | 10 | Khách hàng | ✅ PASS – Bỏ tick 1 bài Buổi 1 (hộp xác nhận "Buổi sau có thể bị khóa lại") → Buổi 2 khóa lại; tick lại → mở | BR-90 |
| TC-83 | 10 | Khách hàng | ✅ PASS – "Khóa học của tôi": thanh tiến độ, "Tiếp tục Buổi 2 – Bài 1" mở đúng bài | US-13.05, US-13.06 |
| TC-84 | 10 | Staff | ✅ PASS – Xem trước mọi buổi (kể cả buổi khách hàng chưa mở), không có nút tick, không ghi tiến độ | US-13.07 |
| TC-85 | 11 | Staff | ✅ PASS – Tạo khách hàng (không email) + cấp gói tiền mặt (số tiền tự điền theo giá gói, sửa được) → mật khẩu 8 ký tự đúng bảng chữ dễ đọc hiện một lần + tin nhắn Zalo; `source = zalo`, `created_by`, `must_change_password`, `consent_at`; đơn `approved` `source = staff`, người tạo / xử lý = staff, lịch sử `new → approved`, hạn = lúc tạo + 1 tháng; `account_events.created`; ghi chú nội bộ vào `patient_notes`; tạo trùng SĐT bị chặn | US-14.01, BR-94 → BR-97 |
| TC-86 | 11 | Khách hàng | ✅ PASS – Đăng nhập bằng SĐT + mật khẩu được cấp (điện thoại) → hộp "Bạn nên đổi mật khẩu"; "Để sau" vào học được, không hỏi lại trong phiên; đổi mật khẩu → cờ tắt, phiên mới không còn hộp | US-14.02, BR-96 |
| TC-87 | 11 | Staff | ✅ PASS – Hồ sơ khách hàng: cấp thêm gói chuyển khoản kèm ảnh → hạn cộng dồn; sửa họ tên + ghi chú; cấp lại mật khẩu → mật khẩu cũ bị từ chối, mới đăng nhập được, cờ nhắc bật lại, nhật ký `created, profile_updated, password_reset`; hồ sơ admin không có nút | US-14.03, US-14.04, BR-99 |
| TC-88 | 11 | Staff | ✅ PASS – Lọc nguồn Zalo / Web, "Đang học", "Chưa có gói", "Sắp hết hạn" (sau khi đưa hạn về 3 ngày) | US-14.05 |
| TC-89 | 12 | Admin | ✅ PASS – Thêm câu hỏi thang 0–10, đưa lên trên (↑); staff thêm câu hỏi qua API bị chặn; cuối kịch bản xóa câu hỏi – phiếu đã gửi vẫn giữ câu trả lời | US-15.01 |
| TC-90 | 12 | Khách hàng | ✅ PASS – Từ trình học mở phiếu (chương trình chọn sẵn); gửi thiếu câu bắt buộc (bỏ qua trình duyệt) → server từ chối; gửi đủ → "Phiếu tham vấn của tôi" hiện Mới, phiếu lưu ảnh chụp câu hỏi, SĐT, chương trình; hết 5 lượt / ngày → bị chặn; khách hàng khác không đọc được | US-15.02, BR-101, BR-103 |
| TC-91 | 12 | Khách hàng | ✅ PASS – Thẻ chúc mừng (hết buổi đã mở) có "Gửi phiếu tham vấn bác sĩ" (`origin=course_end`) | US-15.03 |
| TC-92 | 12 | Staff | ✅ PASS – Xem câu trả lời, chuyển "Đã liên hệ" + ghi chú nội bộ (ghi người xử lý); staff sửa câu trả lời qua API bị trigger giữ nguyên; khách hàng thấy "Đã liên hệ", không thấy ghi chú (giao diện, `my_consultations()`, đọc bảng trực tiếp = 0 dòng) | US-15.04, BR-102 |
| TC-93 | 13 | Admin | ✅ PASS – Thẻ Khách hàng / Đơn chờ / Sắp hết hạn / Phiếu mới khớp `dashboard_stats()`; khách hàng Zalo mới được đếm; việc cần làm có khách hàng sắp hết hạn; tiến độ theo chương trình; bấm thẻ → danh sách lọc sẵn; doanh thu có tiền mặt 200.000đ theo hình thức và theo nhân viên | US-16.01 → US-16.03 |
| TC-94 | 13 | Staff | ✅ PASS – Tổng quan không có khối Doanh thu; `revenue_report()` báo "Chỉ admin…"; khách / khách hàng gọi `dashboard_stats()` nhận null | US-16.03 AC2 |
| TC-95 | + | Admin | ✅ PASS – `/admin/courses` chia 3 nhóm; tab Premium chỉ còn khóa premium, form thêm khóa chọn sẵn loại theo tab (kể cả khi chuyển tab bằng link); sửa chương trình không có ô Giá, lưu không đổi giá (RK-18) | SCR-26, RK-18 |
| TC-96 | 11 | Hệ thống | ✅ PASS – Qua API, staff không tạo được: đơn nguồn web, đơn chờ, gói của chương trình khác, gói cho chính tài khoản nhân viên (RK-34); khách hàng không đọc được `patient_notes`, `account_events`, `consultations`, không gọi được `admin_patients`, `patient_progress`, `_patient_courses` | BR-97, BR-103, T32 |
| TC-97 | + | Khách / Staff | ✅ PASS – Middleware nhẹ (ADR-016): khách vào `/courses/consultation`, `/admin/customers` → đăng nhập; staff vào `/admin/courses`, `/admin/courses/:id`, `/admin/settings/consultation` → `/admin`; tài khoản bị gỡ quyền admin vào `/admin`, `/admin/customers` → `/courses`; staff không thấy tab "Nhân viên & Admin"; menu staff = Tổng quan, Đơn đăng ký, Khách hàng, Phiếu tham vấn, Khách quan tâm | ADR-016, T31 |
| TC-98 | 12 | Admin / Hệ thống | ✅ PASS – Xóa khóa premium còn khách quan tâm → lead giữ lại, `course_id` về null; xóa tài khoản đã gửi phiếu → phiếu giữ họ tên, SĐT, `user_id` về null (RK-29) | RK-29, database-design §7 |
| TC-99 | 15 | Khách | ✅ PASS – Trang đăng nhập: gõ mật khẩu, bấm "Hiện mật khẩu" → ô thành `text`, giữ nội dung, không gửi form; bấm "Ẩn mật khẩu" → `password`; trang đăng ký có nút mắt. Các bước cũ điền `#password`, `#currentPassword`… chạy nguyên | FR-191, UI-01 |
| TC-100 | 15 | Admin | ✅ PASS – Máy tính 1366px: menu quản trị đúng 7 mục theo thứ tự mới, xếp dọc, nằm bên trái nội dung; số cạnh "Đơn đăng ký" = số đơn `pending` trong database (không có đơn chờ thì không hiện). iPhone 13: cùng thứ tự, hàng ngang, cuộn ngang được. Nhân viên: 5 mục (TC-97) | FR-192, UI-02 |
| TC-101 | 15 | Khách hàng | ✅ PASS – Vòng tiến độ `aria-valuenow` 0 → 50 → 100 kèm chữ "0/4 bài", "2/4 bài", "4/4 bài" ở trang khóa, trình học, thẻ "Khóa học của tôi" (thay kiểm tra chữ "x/y bài · %" của TC-81, TC-83); ảnh chụp `course-tile-progress.png`, `desktop-lesson-progress.png` | FR-193, UI-03 |
| TC-102 | 17 | Khách | ✅ PASS (workers) *(chỉ chế độ workers)* Đăng nhập sai 5 lần, mỗi lần đổi `X-Forwarded-For` / `x-real-ip` giả (cùng `cf-connecting-ip`) → lần 6 vẫn "Bạn đã nhập sai quá nhiều lần" | RK-43, T33 |
| TC-103 | 17 | Admin / Khách | ✅ PASS (Node + workers) – Trang chủ và `/khoa-hoc/<id>` đã lưu đệm (ISR); admin sửa tên khóa → cả 2 trang hiện tên mới ngay (≤ 5 giây), đổi lại tên cũ cũng cập nhật | RK-45, ADR-008 |
| TC-111 | 19 | Khách | ✅ PASS – Trang chủ mới (máy tính): số liệu dừng đúng "10+ · 13.000+ · 3 · 1:1"; dải chuyên môn lặp 2 lần, bản lặp `aria-hidden`; `#bac-si` có "Học vấn & chứng chỉ" (Schroth SSOL), `#chuyen-mon` đủ 4 lĩnh vực, "Quá trình công tác" 3 mốc, 6 ảnh tải được (`naturalWidth > 0`, không bị CSP chặn); chân trang 3 cơ sở; trong `<main>` không còn banner `trung-tam-hv.jpg` và khối "Sẵn sàng chăm sóc cột sống"; tên bác sĩ chỉ là tiêu đề H2 một lần; ảnh `desktop-home-bac-si.png` | FR-195 → FR-197, UI-05 → UI-07 |
| TC-112 | 19 | Khách | ✅ PASS – `html.reveal-ready` sau khi tải; khối FAQ cuối trang chưa `is-visible` → cuộn tới thì `is-visible` + `opacity: 1`; hero hiện ngay. Ngữ cảnh `reducedMotion: 'reduce'`: mọi `[data-reveal]` hiện ngay, không gắn `reveal-ready`, dải chuyên môn `animation-name: none` | FR-194, UI-04, NFR-04 |
| TC-113 | 20 | Khách | ✅ PASS – `/`: nav "Chọn ngôn ngữ", VI `aria-current`; bấm "English" → `/en`, H1 "Holistic spine…", `<html lang="en">`, `<main lang="en">`, hreflang vi / en; menu "Doctor" → `/en#bac-si`, "Sign in"; list "Areas of expertise", H2 "Dr. Do Manh Cuong", `#chuyen-mon` có "Scoliosis"; thẻ khóa A: nhãn "Lumbar scoliosis", "Register" → `/?course=<A>#dang-ky`; lọc "Thoracic scoliosis" chỉ còn khóa B, "All" hiện lại; `#dang-ky` không có form, có nút → `/#dang-ky`; chân trang "Our clinics" 3 cơ sở; ảnh `desktop-home-en.png`. Từ `/en#bac-si` bấm "Tiếng Việt" → `/#bac-si`, `lang="vi"`. `/login` không có nút chuyển ngữ | FR-198 → FR-201, UI-08, ADR-018 |
| TC-114 | 21 | Học viên, admin | ✅ PASS – đăng nhập không chọn ghi nhớ: cookie `sb-*-auth-token` và `hv-activity` là cookie tạm (`expires = -1`), không có `hv-remember`; học viên chọn "Ghi nhớ": cookie phiên hạn 30 ngày + `hv-remember=1`, 3 giờ không thao tác vẫn vào `/courses`; admin chọn "Ghi nhớ" vẫn là cookie tạm, `hv-activity` có cờ `s` | FR-203, SEC-13 |
| TC-115 | 21 | Admin, học viên | ✅ PASS – admin 31 phút không thao tác → `/admin/registrations` chuyển `/login?error=timeout` + thông báo, cookie bị xóa; gắn lại cookie cũ (giả lập bị đánh cắp) → vẫn về `/login` (phiên đã thu hồi); học viên đăng nhập từ 13 giờ trước → trang chủ hiện như khách, cookie bị xóa; tab đang mở 121 phút không thao tác → sự kiện focus → toast "Phiên đăng nhập đã hết hạn", header hiện "Đăng nhập" | FR-204, FR-205 |
| TC-116 | 21 | Khách, học viên | ✅ PASS – `/login?error=<chữ tùy ý>` không hiện chữ đó, không có hộp lỗi; học viên đổi mật khẩu: thiết bị đang dùng vẫn đăng nhập, thiết bị khác vào `/courses` bị chuyển `/login` (bước đổi mật khẩu ở phần 8) | FR-205, FR-206, SEC-14, SEC-15 |
| TC-108 | 24 | Admin | ✅ PASS – thẻ khóa B ở `/admin/courses` có link Sửa · Quản lý buổi – bài · Xem trang giới thiệu · Xóa và nút "Ẩn khóa học"; "Sửa" chương trình → `/admin/courses/<id>/edit`: form không có ô Giá, có bảng "Gói theo thời hạn", lưu mô tả ngắn không đổi giá | FR-210, QL-06 |
| TC-109 | 24 | Admin | ✅ PASS – "Xóa" khóa B (còn 1 đơn chờ) → `edit#xoa-khoa-hoc`: ghi chú "… 1 đơn chờ duyệt …", không có nút xóa; từ chối đơn → tải lại: gõ sai tên → nút khóa; gõ đúng → "Đã xóa khóa học", về danh sách, khóa B biến mất; 2 đơn giữ `course_title`, học phí; bảng đơn hiện "(khóa học đã xóa)", không có nút Duyệt. Xóa khóa premium (không đơn) bằng gõ tên → lead giữ tên khóa | FR-211, QL-08 |
| TC-110 | 24 | Admin | ✅ PASS – tab Premium → "+ Thêm khóa học" → `/admin/courses/new?kind=premium`, ô Loại = premium; mọi lần tạo khóa trong E2E đi qua nút này và chuyển tới `/admin/courses/<id>/edit`; nhân viên vào `/admin/courses/new`, `…/edit` bị chuyển về `/admin` | FR-209, QL-07 |
| TC-117 | 26 | Admin, nhân viên, khách | ✅ PASS – menu admin 8 mục (thêm "Nhân viên" trước "Mẫu phiếu"), nhân viên vẫn 5 mục; `/admin/customers?role=team` và `/admin/users?role=team` → `/admin/staff`; `/admin/patients?q=` → `/admin/customers?q=`; danh mục Nhân viên ghi "Cấp quyền bởi …", dòng của mình "(bạn)" không có Xóa, hồ sơ của mình không có ô vai trò; khách hàng không hiện ở danh mục Nhân viên, nhân viên không hiện ở danh sách khách hàng; nhân viên vào `/admin/staff`, `/admin/staff/new`, `/admin/staff/<id>` → `/admin`; nhân viên mở hồ sơ admin ở `/admin/customers/<id>` → 404; khách vào `/admin/staff` → `/login` | FR-212, FR-213 |
| TC-118 | 26 | Nhân viên | ✅ PASS – khách hàng Zalo còn gói: vùng "Xóa khách hàng" chỉ có lý do "còn N gói còn hạn", không có ô xác nhận; khách hàng hết gói (1 đơn từ chối + 1 phiếu tham vấn): nút "Xóa <tên>" ở danh sách → `#xoa-khach-hang`; gõ sai SĐT nút bị khóa; gõ đúng → "Đã xóa khách hàng …", về danh sách; profile + tài khoản Auth bị xóa, phiếu tham vấn bị xóa, đơn còn (`user_id` null, giữ họ tên); nhật ký `deleted` ghi đúng nhân viên (khi đã chạy schema) | FR-216 → FR-218, BR-122 |
| TC-119 | 26 | Admin | ✅ PASS – "Thêm nhân viên" → mật khẩu 8 ký tự hiện 1 lần + "Chép tin nhắn gửi nhân viên"; profile `role = staff`, `created_by` = admin, `must_change_password`; `role_events` ghi admin; nhân viên mới đăng nhập bằng SĐT, thấy "Bạn đang dùng mật khẩu được cấp"; "Sửa <tên>" ở danh sách → lưu họ tên; cấp lại mật khẩu → mật khẩu cũ không đăng nhập được, phiên đang mở của nhân viên bị chuyển `/login`; xóa (gõ SĐT) → hết đăng nhập, nhật ký xóa hiện ở trang Nhân viên | FR-214, FR-215, BR-123 |

Kết quả Đợt 7 (27/09/2026, Chrome, Supabase theo `.env.local` với `E2E_SUPABASE_REF` đặt tạm, schema mới đã chạy): **67/67 bước PASS**, dữ liệu test đã dọn.
Lần chạy đầu đỏ 1 bước (TC-66) do test đọc URL trước khi trang `/admin` chuyển tiếp phía trình duyệt – đã sửa test chờ URL cuối.
Kết quả Đợt 8 (27/09/2026, schema mới đã chạy): **73/73 bước PASS**, dữ liệu test (khóa, bài, khách quan tâm, ảnh bìa) đã dọn. 2 lần chạy đầu đỏ do test:
đọc URL trước khi trang khóa trả phí chuyển khách tới đăng nhập (redirect phía trình duyệt), và locator "Lộ trình riêng" khớp 2 chỗ – đã sửa test.
Đợt 7 đã sửa các TC cũ: TC-01 (hàm `is_staff`), TC-24/25/28/56/57… (route `/admin/registrations`),
TC-55/TC-58 (ô chọn vai trò, tab "Nhân viên & Admin"), TC-56 (thông báo "có thể người khác vừa xử lý").

Đợt 9 (phase "9c" của `e2e.mjs`, dùng chương trình + khách hàng riêng): TC-74 ↔ bước "[Admin] Tạo chương trình có học phí…", TC-75 ↔ "[Khách] Trang giới thiệu chọn gói 3 tháng…", TC-76 ↔ "[Nhân viên] Duyệt đơn gói 1 tháng…" + "[Khách hàng] Gia hạn gói 3 tháng…", TC-77 ↔ phần đơn chờ thứ 2 của bước gia hạn, TC-78 ↔ "[Khách hàng] Hết hạn…". Đã sửa TC-24/28 (thêm cột Gói, Hạn học).
Kết quả Đợt 9 (27/09/2026): **78/78 PASS**. Lần chạy đầu đỏ ở TC-44 (xóa khóa B) – **lỗi thật RK-22**: trigger khóa `plan_id` làm hỏng `on delete set null` khi xóa chương trình có đơn; đã sửa trigger, chạy lại schema, PASS.

Đợt 10 (phase "9d", chương trình 3 buổi × 2 bài, gói mở 2 buổi, khách hàng của phase 9c): TC-79 ↔ "[Admin] Tạo chương trình kèm khung…", TC-80 + TC-81 ↔ "[Khách hàng] Buổi mở lần lượt…" và phần cuối bước bỏ tick, TC-82 ↔ "[Khách hàng] Bỏ tick…", TC-83 ↔ "[Khách hàng] Checklist buổi 1…", TC-84 ↔ "[Nhân viên] Xem trước…".
Kết quả Đợt 10 (27/09/2026, schema mới đã chạy): **83/83 PASS**, dữ liệu test đã dọn. Các lần chạy trước đỏ do 2 **lỗi thật**, đã sửa trong schema:
RK-27 (admin không thêm được bài học – `can_view_lesson` phải xét `is_staff()` trước) và RK-28 (bài cũ chưa thuộc buổi nào, VD bài nhập tay của TC-51,
đứng **đầu** đề cương / "bài tiếp theo" – nay xếp cuối). TC cũ chỉ sửa nhỏ: TC-01 (kiểm tra thêm bảng `course_sessions`, `lesson_progress`), TC-68 (nút "Quản lý buổi – bài"); các bước trình học cũ (TC-21, TC-30, TC-47, TC-51) chạy nguyên trên trình học mới.

Đợt 11 → 13 (phase "9e" → "9h" của `e2e.mjs`, chạy chung một lượt): TC-95 ↔ "[Admin] Trang khóa học chia theo loại…", TC-85 ↔ "[Nhân viên] Tạo khách hàng Zalo…",
TC-96 ↔ "[Hệ thống] Database chặn nhân viên tạo đơn sai quy tắc…", TC-86 ↔ "[Khách hàng Zalo] Đăng nhập…", TC-87 ↔ "[Nhân viên] Hồ sơ khách hàng…",
TC-88 ↔ "[Nhân viên] Lọc khách hàng…", TC-89 ↔ "[Admin] Mẫu phiếu…", TC-90 ↔ "[Khách hàng] Gửi phiếu tham vấn…", TC-91 ↔ "[Khách hàng] Hoàn thành các buổi…",
TC-92 ↔ "[Nhân viên] Phiếu tham vấn…", TC-93 ↔ "[Admin] Tổng quan…", TC-94 ↔ "[Nhân viên] Tổng quan không có doanh thu…", TC-98 ↔ "[Admin] Xóa khóa premium còn khách quan tâm…";
TC-97 nằm trong các bước cũ đã sửa: "[Khách] Vào /admin, /courses, …", "[Nhân viên] Vào trang quản trị…", "[Admin] Gỡ quyền admin 2…".
Bước cũ sửa theo giao diện mới: TC-29 (`/admin/users` → `/admin/customers`, trạng thái từng khóa), TC-55 / TC-58 (ô vai trò ở tab Khách hàng /
Nhân viên & Admin), TC-66 (menu nhân viên, `/admin` = Tổng quan), bước chuyển vai trò nhân viên (kiểm tra ở tab Nhân viên & Admin).
Kết quả Đợt 11 → 13 (27/09/2026, schema mới đã chạy): **96/96 PASS**, dữ liệu test dọn sạch (kể cả phiếu, nhật ký tài khoản, câu hỏi thử,
bộ đếm phiếu / ngày). Các lần chạy trước đỏ: TC-95 lần 1 là **lỗi thật** (form thêm khóa không đổi loại khi chuyển tab bằng link → thêm `key`), lần 2 do locator
của test bắt nhầm ô giá trong bảng Gói; TC-88 do từ khóa tìm (SĐT test) trùng dãy số trong email test khác → tìm theo tên. Rà soát code khi viết test phát hiện RK-29, RK-34 (đã sửa, xem project-review §7.6).

Đợt 15 (29/09/2026, không đổi schema): TC-99 ↔ "[Khách] Ô mật khẩu có nút con mắt…", TC-100 ↔ "[Admin] Menu quản trị: cột dọc bên trái…",
TC-101 nằm trong các bước Đợt 10 đã sửa ("[Khách hàng] Buổi mở lần lượt…", "Checklist buổi 1…", "Bỏ tick…"); bước "[Nhân viên] Vào trang quản trị…" đọc nhãn menu
qua `[data-nav-label]` (bỏ số đếm). Kết quả: **98/98 PASS** ngay lần chạy đầu, dữ liệu test dọn sạch; chạy thêm 2 lần để chụp ảnh vòng tiến độ (98/98).

Đợt 17 P0 → P2 (04/10/2026, không đổi schema; Supabase theo `.env.local` với `E2E_SUPABASE_REF` đặt tạm): script có 2 chế độ (Node / `--workers`), hộp thư giả HTTP (`MAIL_OUTBOX_URL`), IP giả lập theo chế độ, in URL tài nguyên lỗi, `E2E_VERBOSE=1` in log Playwright khi lỗi. TC-103 ↔ "[Admin] Sửa tên khóa → trang chủ và trang giới thiệu khóa (đang lưu đệm) hiện tên mới ngay"; TC-102 ↔ "[Khách] Đổi X-Forwarded-For giả…" (chỉ chế độ workers). Không sửa bước cũ nào.
Kết quả Node: lần 1 – 35/36 (bước "Đơn đăng ký hiển thị dạng bảng…"); lần 2 – 77/78 ("Checklist buổi 1…"): **lỗi thật RK-53** do Next 15 – router hủy điều hướng khi có `loading.tsx` (đổi tab `?status=`, redirect sau "Hoàn thành & bài tiếp theo"), đã bỏ `app/admin/loading.tsx`, `app/courses/loading.tsx`; lần 3, 4 – 98/99: 24 lỗi console 404 do Next 15 prefetch trang `/khoa-hoc/<id>` của khóa đang ẩn từ danh sách khóa admin → `prefetch={false}`; **lần 5 – 99/99 PASS**, dữ liệu test dọn sạch.
Kết quả Workers (`npm run test:e2e:workers`): lần 1 – server không khởi động (`opennextjs-cloudflare preview` treo ở bước tạo bảng D1 trên Windows → script tự tạo bảng + `wrangler dev`); lần 2 – 6/7 (header `cf-connecting-ip` gửi kèm tới Supabase bị chặn CORS → chỉ gắn cho yêu cầu tới website); lần 3 → 6 – 99/100: mọi bước chức năng PASS (kể cả TC-102, TC-103), bước "không có lỗi JavaScript" đỏ vì 8 – 13 lỗi React #418 lác đác ở `/admin/**` (RK-54 – đã điều tra, chưa rõ nguyên nhân gốc, chức năng không ảnh hưởng); **lần 7 – 100/100 PASS** sau khi chế độ workers ghi #418 ở trang quản trị là vấn đề đã biết (in số lượng, không làm đỏ test), dữ liệu test dọn sạch. Cùng ngày: **Node 99/99 PASS** trên đúng mã nguồn đó; `next dev` mở được trang công khai, trang cần đăng nhập chuyển `/login`, log không lỗi.

Đợt 19 (17/10/2026, không đổi schema): TC-111 ↔ "[Khách] Trang chủ mới: số liệu đếm tăng, dải chuyên môn, hồ sơ bác sĩ…", TC-112 ↔ "[Khách] Hiệu ứng hiện dần khi cuộn; bật giảm chuyển động…" (đặt ngay sau bước trang chủ của phase 4). **Không sửa bước cũ nào** – TC-11 (tiêu đề H1 "Trị liệu cột sống", H2 tên bác sĩ, FAQ, box 3 bước), TC-69 (3 nhóm, lọc), TC-12 ("Đăng ký" chọn sẵn khóa), TC-103 (ISR) chạy nguyên trên bố cục mới.
Mã TC-104 → TC-110 giữ cho Đợt 18 (roadmap §3.5).
Đợt 26 (18/10/2026, schema đổi nhỏ – A-30): TC-117 ↔ các bước "[Admin] Cấp quyền admin…; danh mục Nhân viên…", "[Admin] Danh sách khách hàng…/admin/patients…", "[Nhân viên] Vào trang quản trị…" (đã sửa theo cấu trúc mới); TC-118, TC-119 ↔ phần "9f2. THÊM / SỬA / XÓA KHÁCH HÀNG & NHÂN VIÊN". Đổi vai trò trong E2E làm ở hồ sơ (khách hàng › Phân quyền, nhân viên › Vai trò). TC-104 (sửa từ danh sách) và TC-107 (chặn xóa còn gói) gộp vào TC-118; TC-106 (nhân viên không xóa được) **bỏ** – chủ dự án đổi quyết định Q-6. Lần chạy: Node lần 1 – 88/89 (lỗi test: tìm link theo tên khách hàng khớp cả link "Sửa / Xóa <tên>" của cột Thao tác mới → tìm chính xác), lần 2 – 96/97 (lỗi test: còn 1 biểu thức chờ `/admin/patients?status=` – trang đã chuyển đúng sang `/admin/customers`; lần này cũng lộ lỗi console 404 của bước cố ý mở hồ sơ admin bằng tài khoản nhân viên → script bỏ qua 404 của đúng đường dẫn đó), **lần 3 – 107/107 PASS**; **Workers 108/108 PASS** ngay lần đầu (20 lỗi #418 RK-54 ghi riêng). Database chưa chạy schema Đợt 26 → script in 2 "lưu ý database" (nhật ký xóa), không làm đỏ test. **Sau khi chủ dự án chạy schema (18/10): Node 107/107 · Workers 108/108, không còn lưu ý, nhật ký xóa kiểm đúng người xóa (TC-118, TC-119).** Dữ liệu test dọn sạch.
Đợt 22 → 24 (17/10/2026, không đổi schema): TC-108 → TC-110 (mã giữ từ kế hoạch Đợt 18) ↔ bước "[Admin] Hàng thao tác ở thẻ khóa…", "Tạo / sửa khóa"; các bước tạo khóa đi qua trang mới. Đo hiệu năng: `scripts/perf.mjs` (§5). Lần chạy: Node 105/105 · Workers 106/106 (11 lỗi hydration RK-54 ở trang quản trị ghi riêng – trước 18)
Đợt 21 (17/10/2026, không đổi schema): TC-114 → TC-116 ↔ phần "10. HỆ THỐNG – bảo mật" ([Bảo mật] …) + bước đổi mật khẩu ở phần 8. Lần chạy: Node 105/105 · Workers 106/106 (11 lỗi hydration RK-54 ở trang quản trị ghi riêng – trước 18)
Đợt 20 (17/10/2026, không đổi schema): TC-113 ↔ "[Khách] Chuyển ngữ VI ↔ EN ở trang chủ…" (sau TC-112). TC-111, TC-112 và các bước cũ chạy nguyên trên giao diện mới (không sửa). Lần chạy: E2E: Node 102/102, Workers 103/103 (17/10/2026). Lần chạy Node đầu dừng ở TC-113 vì script so hreflang `vi` với chuỗi kết thúc "/" trong khi Next ghi URL gốc không có "/" cuối – trang đúng, sửa script so theo pathname Lần chạy: Node lần 1 – 16/17 (TC-111: `scrollIntoViewIfNeeded` chờ ảnh bồng bềnh "đứng yên" – lỗi của test, RK-56), lần 2 – 16/17 (test bắt nhầm `og:image` trong `<head>`), lần 3 – 100/101 (**lỗi thật nhỏ**: Chrome xin `/favicon.ico` → 404 trong console; thêm `public/favicon.ico`), **lần 4 – 101/101 PASS**; **Workers 102/102 PASS** ngay lần đầu (14 lỗi #418 ở `/admin/**` ghi riêng – RK-54, như trước). Dữ liệu test dọn sạch.

**TC cũ phải sửa khi triển khai v0.2**: TC-01 (bảng/cột mới), TC-10 (RLS: đề cương công khai, `video_url` ẩn), TC-07/TC-08 (form khóa có loại, bài thuộc buổi),
TC-13/TC-14 (chọn gói), TC-18/TC-19 (ô đồng ý), TC-21/TC-30 (trình học mới), TC-23 + TC-48 (unique index chỉ còn `pending`),
TC-24/TC-28 (`/admin/registrations`, cột gói/nguồn), TC-29/TC-55/TC-58 (`/admin/customers`, chọn vai trò – từ Đợt 26 ở hồ sơ), TC-42/TC-43 (quyền theo hạn học).

## 4. Khoảng trống kiểm thử (cần bổ sung)

| # | Kịch bản chưa được test tự động | Ưu tiên | Trạng thái |
| --- | --- | --- | --- |
| G-01 | Học viên đã được duyệt khi khóa bị **ẩn** | Cao | ✅ Đã có (TC-42) |
| G-02 | Rollback khi upload ảnh / insert đơn thất bại (US-02.06) | Cao | ⬜ |
| G-03 | Mã reset hết hạn sau 10 phút; khóa sau 5 lần sai | Trung bình | ⬜ |
| G-04 | Open redirect `next=//evil.com`, `next=/\evil.com` | Trung bình | 🟡 Đã thăm dò thủ công 26/09/2026: không khai thác được; chưa có bước E2E |
| G-05 | Xóa khóa học: bài học bị xóa, đơn được giữ | Trung bình | ✅ Đã có (TC-44) |
| G-06 | Sửa/Xóa bài học, sửa khóa học | Trung bình | 🟡 Sửa bài (TC-79), sửa chương trình (TC-95), xóa buổi (TC-79); chưa có xóa bài học |
| G-07 | Tìm kiếm / lọc khách hàng | Thấp | ✅ TC-29, TC-88 |
| G-08 | Video TikTok / Shorts hiển thị khung dọc | Thấp | 🟡 Lưu link TikTok có trong TC-09, chưa kiểm tra khung hiển thị |
| G-09 | Ảnh HEIC từ iPhone | Thấp | ⬜ Test thủ công trên thiết bị thật |
| G-10 | Unit test các hàm thuần trong `lib/` (`normalizePhone`, `isSupportedVideoUrl`…) | Trung bình | ⬜ |
| G-11 | Các risk case (xem project-review.md §7) | Theo mức rủi ro | 🟡 RK-01 → 09, 11 → 14 có TC; RK-22, 27, 28, 29, 34 có TC; RK-43 (TC-102), RK-45 (TC-103), RK-53 (bước đổi tab / chuyển bài cũ) có TC; còn RK-02, 10, 15 (chưa làm) |
| G-13 | Turnstile bật trên production (widget hiện, token hợp lệ / hết hạn) | Trung bình | ⬜ Thủ công sau khi có khóa (roadmap A-4) |
| G-14 | Gửi email thật qua `lib/smtp-workers.ts` trên Cloudflare (E2E dùng hộp thư giả) | Cao | ⬜ Thủ công CF-05 sau khi có App Password Gmail (A-12) – P0 đã thử tới bước AUTH với Gmail và gửi trọn thư tới máy chủ SMTP giả |
| G-15 | Bộ nhớ đệm R2 / D1 / Durable Object **thật** trên Cloudflare (E2E chạy bản giả lập local của wrangler) | Trung bình | ⬜ CF-09 sau deploy |
| G-12 | Chặn gỡ **admin cuối cùng** (không test được trên database dùng chung vì luôn có admin thật; cần staging – RK-10) | Trung bình | ⬜ Đã kiểm tra bằng đọc code trigger |

## 5. Checklist kiểm thử thủ công trước release

**Thiết bị**: iPhone Safari, Android Chrome, máy tính Chrome/Edge; màn hình 360px, 768px, 1280px+.

- [ ] Trang chủ hiển thị đúng, ảnh không vỡ, font tiếng Việt đúng dấu; hiệu ứng cuộn mượt trên điện thoại tầm trung (Đợt 19 – 20, RK-58); nút VI | EN chuyển đúng, bản `/en` không còn chữ tiếng Việt ngoài tên khóa (Đợt 20), bật "Giảm chuyển động" (iOS: Trợ năng › Chuyển động) thì nội dung hiện ngay.
- [ ] QR quét được bằng app ngân hàng thật, số tiền & nội dung đúng.
- [ ] Đăng ký trên điện thoại thật với ảnh chụp màn hình thật (kể cả HEIC trên iPhone).
- [ ] Nhận email mã quên mật khẩu thật (kiểm tra cả hộp Spam), tiêu đề/nội dung đúng thương hiệu.
- [ ] Video YouTube & TikTok phát được trên điện thoại.
- [ ] Admin xem ảnh chuyển khoản, duyệt, học viên thấy khóa mở ngay.
- [ ] Bàn phím: Tab qua menu, form; focus nhìn thấy.
- [ ] Lighthouse mobile trang chủ: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90. Đo tự động nhiều trang (cả trang đăng nhập): `E2E_SUPABASE_REF=<ref> PERF_BASE=<url> PERF_LABEL=<nhãn> node scripts/perf.mjs` (Lighthouse 3 lần / trang, điện thoại + máy tính, tạo / xóa admin tạm) – kết quả `test-results/perf-<nhãn>.json`, bảng Markdown in ra màn hình (Đợt 22).
- [ ] Trên Cloudflare (từ Đợt 17): checklist nghiệm thu CF-01 → CF-41 ở [cloudflare-migration.md §5](../09-operations/cloudflare-migration.md#5-checklist-nghiệm-thu-inspection).

## 6. Tiêu chí hoàn thành (Definition of Done)

Một tính năng được coi là xong khi:
1. Tất cả AC trong user story đạt.
2. `npm run lint` và `npm run build` không lỗi.
3. `npm run test:e2e:workers` (chuẩn, giống production) và `npm run test:e2e` (Node) pass; tính năng mới có bước E2E (hoặc lý do bỏ qua được ghi lại).
4. RLS cho dữ liệu mới được kiểm tra với anon/học viên/admin.
5. Tài liệu liên quan đã cập nhật (SRS, user story, DB, API, screen spec).
6. Kiểm thử thủ công trên điện thoại thật cho thay đổi UI.

## 7. Mẫu báo lỗi
Xem [../templates/bug-report.md](../templates/bug-report.md).
