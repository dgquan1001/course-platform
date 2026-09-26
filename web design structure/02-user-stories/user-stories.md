# User Stories

Định dạng: **Là** `<vai trò>`, **tôi muốn** `<mục tiêu>`, **để** `<lợi ích>`.
Tiêu chí chấp nhận (AC) viết theo Gherkin (Given / When / Then).
Ước lượng theo Story Point (SP, Fibonacci). Trạng thái: ✅ Done · 🟡 Partial · ⬜ Backlog.

## Bản đồ Epic

| Epic | Tên | Stories | Persona |
| --- | --- | --- | --- |
| EP-01 | Tìm hiểu trung tâm & khóa học | US-01.01 → 01.04 | P5, P1 |
| EP-02 | Đăng ký & thanh toán khóa học | US-02.01 → 02.08 | P1, P2 |
| EP-03 | Xác thực & tài khoản | US-03.01 → 03.07 | P1, P2 |
| EP-04 | Học tập | US-04.01 → 04.04 | P1, P2 |
| EP-05 | Quản trị đơn đăng ký | US-05.01 → 05.05 | P3 |
| EP-06 | Quản trị học viên | US-06.01 → 06.02 | P3 |
| EP-07 | Quản trị khóa học & bài học | US-07.01 → 07.06 | P3, P4 |
| EP-08 | Trải nghiệm & phản hồi chung | US-08.01 → 08.03 | Tất cả |
| EP-09 | Backlog mở rộng | US-09.xx | — |

---

## EP-01 – Tìm hiểu trung tâm & khóa học

### US-01.01 – Xem trang giới thiệu ✅ (3 SP)
**Là** khách, **tôi muốn** xem thông tin trung tâm, bác sĩ và lợi ích khóa học, **để** quyết định có nên học không.
- FR: FR-001, FR-009 · Màn hình: SCR-01
- **AC1** Given tôi mở `/` When trang tải xong Then tôi thấy hero, phần bác sĩ, vấn đề thường gặp, lợi ích, khóa học, box đăng ký, FAQ, CTA và footer liên hệ.
- **AC2** Given tôi dùng điện thoại When cuộn trang Then thanh "Gọi ngay / Đăng ký học" luôn cố định dưới màn hình.

### US-01.02 – Xem danh sách khóa học và giá ✅ (2 SP)
**Là** khách, **tôi muốn** xem các khóa đang mở kèm giá, **để** chọn khóa phù hợp.
- FR: FR-002, FR-003, FR-005
- **AC1** Given có khóa `published` và `draft` When tôi xem mục Khóa học Then chỉ thấy khóa `published`, theo `sort_order`.
- **AC2** Given khóa có giá 0 Then giá hiển thị "Liên hệ".
- **AC3** Given không có khóa nào Then thấy thông báo "Khóa học đang được cập nhật" kèm hotline.

### US-01.03 – Đăng ký ngay từ thẻ khóa học ✅ (2 SP)
**Là** khách, **tôi muốn** bấm "Đăng ký" trên một khóa và được đưa tới form đã chọn sẵn khóa đó, **để** không phải chọn lại.
- FR: FR-004
- **AC1** Given tôi bấm "Đăng ký" ở khóa B When trang cuộn tới `#dang-ky` Then ô "Chọn khóa học" đang là khóa B và QR hiển thị giá khóa B.

### US-01.04 – Liên hệ tư vấn ✅ (1 SP)
**Là** khách, **tôi muốn** gọi hotline hoặc nhắn Zalo ngay, **để** được tư vấn trước khi mua.
- **AC1** Given tôi bấm số hotline Then điện thoại mở trình gọi (`tel:`).
- **AC2** Given tôi bấm "Tư vấn qua Zalo" Then Zalo mở trong tab mới.

---

## EP-02 – Đăng ký & thanh toán

### US-02.01 – Chuyển khoản bằng QR ✅ (3 SP)
**Là** khách, **tôi muốn** quét mã QR đã điền sẵn số tiền và nội dung, **để** chuyển khoản không bị sai.
- FR: FR-021 · BR: BR-30
- **AC1** Given tôi chọn khóa giá 1.500.000đ và nhập SĐT `0912 345 678` Then QR chứa `amount=1500000` và `addInfo=0912345678`.
- **AC2** Given tôi chưa nhập SĐT Then nội dung hiển thị "SDT cua ban".
- **AC3** Given tôi bấm "Chép" cạnh số tài khoản Then giá trị được chép vào clipboard và nút đổi thành "Đã chép" trong 1,5 giây.

### US-02.02 – Đăng ký có email ✅ (5 SP)
**Là** khách có email, **tôi muốn** tạo tài khoản và gửi đơn trong một lần, **để** theo dõi trạng thái và lấy lại mật khẩu khi cần.
- FR: FR-023, FR-029 → FR-036 · BR: BR-06, BR-08, BR-10, BR-33
- **AC1** Given tôi điền đủ họ tên, SĐT hợp lệ, email, mật khẩu ≥ 6, chọn khóa, tải ảnh When bấm "Đăng ký" Then tài khoản được tạo, ảnh được lưu, đơn ở trạng thái `pending`, tôi được đăng nhập và chuyển tới `/courses?registered=1` với banner "Đăng ký thành công!".
- **AC2** Given email đã có tài khoản Then báo "Email này đã có tài khoản. Vui lòng đăng nhập trước…" và không tạo dữ liệu nào.

### US-02.03 – Đăng ký không cần email ✅ (5 SP)
**Là** khách không dùng email, **tôi muốn** đăng ký chỉ bằng số điện thoại, **để** vẫn mua và học được.
- FR: FR-030 · BR: BR-04, BR-05, BR-07 · ADR-003
- **AC1** Given tôi để trống email When đăng ký thành công Then tài khoản đăng nhập bằng email nội bộ `<SĐT>@sdt.hv.invalid`, `profiles.email = null`, admin thấy "Không có email".
- **AC2** Given SĐT đã có tài khoản Then báo "Số điện thoại này đã có tài khoản…".
- **AC3** Given SĐT sai định dạng (VD `12345`) Then báo "Số điện thoại không hợp lệ" và không lưu gì.

### US-02.04 – Tải ảnh chuyển khoản dễ dàng ✅ (5 SP)
**Là** khách dùng điện thoại, **tôi muốn** tải ảnh chụp màn hình lớn mà không bị lỗi, **để** gửi đơn nhanh.
- FR: FR-026 → FR-028 · BR: BR-32
- **AC1** Given tôi chọn file PDF Then báo "Chỉ nhận ảnh định dạng JPG, PNG, WEBP hoặc HEIC." và xóa file đã chọn.
- **AC2** Given tôi chọn ảnh PNG 8MB Then ảnh được nén thành JPEG ≤ 1600px, hiện "Đã tối ưu: 8.0MB → …KB" và ảnh xem trước.
- **AC3** Given ảnh sau nén vẫn > 5MB Then báo lỗi và không cho gửi.
- **AC4** Given đang nén Then nút "Đăng ký" bị vô hiệu và hiện "Đang tối ưu ảnh…".

### US-02.05 – Đăng ký thêm khóa khi đã có tài khoản ✅ (3 SP)
**Là** học viên, **tôi muốn** đăng ký khóa khác mà không phải nhập lại email/mật khẩu, **để** mua thêm nhanh.
- FR: FR-024, FR-032
- **AC1** Given tôi đã đăng nhập When mở box đăng ký Then họ tên/SĐT được điền sẵn, không có ô email và mật khẩu, có dòng "Bạn đang đăng nhập với …".
- **AC2** Given tôi đã có đơn `pending` cho khóa A When đăng ký lại khóa A Then báo "Bạn đã đăng ký khóa này và đang chờ xác nhận."
- **AC3** Given khóa A đã `approved` Then báo "Bạn đã sở hữu khóa học này…".

### US-02.06 – Không để lại dữ liệu rác khi lỗi ✅ (3 SP)
**Là** chủ trung tâm, **tôi muốn** hệ thống hoàn tác khi đăng ký lỗi giữa chừng, **để** dữ liệu sạch và khách có thể thử lại.
- FR: FR-035
- **AC1** Given upload ảnh lỗi Then tài khoản vừa tạo bị xóa.
- **AC2** Given tạo đơn lỗi Then ảnh vừa upload và tài khoản vừa tạo bị xóa.

### US-02.07 – Chỉ đăng ký được khóa đang mở ✅ (1 SP)
- FR: FR-025, FR-029 · BR: BR-20
- **AC1** Given khóa A bị ẩn Then khóa A không có trong ô chọn khóa học.
- **AC2** Given ai đó gửi form với `courseId` của khóa ẩn Then server báo "Khóa học không tồn tại hoặc đã ngừng nhận đăng ký."

### US-02.08 – Theo dõi trạng thái đơn ✅ (2 SP)
**Là** học viên, **tôi muốn** biết đơn của mình đang chờ, đã duyệt hay bị từ chối, **để** biết cần làm gì tiếp.
- FR: FR-060
- **AC1** Given đơn `pending` Then thấy trong "Đang chờ xác nhận" với biểu tượng đồng hồ.
- **AC2** Given đơn `rejected` Then thấy trong "Đơn chưa được xác nhận" kèm hotline.

---

## EP-03 – Xác thực & tài khoản

### US-03.01 – Đăng nhập bằng email hoặc SĐT ✅ (3 SP)
- FR: FR-010 → FR-013
- **AC1** Given tài khoản có SĐT `0912345678` When tôi nhập `+84 912 345 678` và đúng mật khẩu Then đăng nhập thành công, toast "Đăng nhập thành công…".
- **AC2** Given sai mật khẩu Then báo "Email/số điện thoại hoặc mật khẩu không đúng."
- **AC3** Given URL `/login?next=//evil.com` Then sau đăng nhập chuyển tới `/courses` (chặn open redirect).

### US-03.02 – Bảo vệ trang cần đăng nhập ✅ (2 SP)
- FR: FR-015, FR-016
- **AC1** Given chưa đăng nhập When mở `/courses/abc` Then chuyển tới `/login?next=/courses/abc`.
- **AC2** Given học viên thường When mở `/admin` Then chuyển tới `/courses`.

### US-03.03 – Đăng xuất ✅ (1 SP)
- FR: FR-014, FR-104
- **AC1** Given đã đăng nhập When chọn "Đăng xuất" trong menu Tài khoản Then toast "Đã đăng xuất", về trang chủ, header hiện "Đăng nhập / Đăng ký học".

### US-03.04 – Quên mật khẩu qua email ✅ (5 SP)
- FR: FR-040 → FR-046 · BR: BR-50 → BR-53
- **AC1** Given tài khoản có email When nhập SĐT/email và bấm gửi mã Then nhận email chứa mã 6 số, màn hình chuyển sang bước nhập mã và hiện email đã che.
- **AC2** Given vừa gửi mã < 60 giây Then báo "Vui lòng đợi N giây…".
- **AC3** Given nhập sai mã Then báo "Mã không đúng. Bạn còn N lần thử."; sai lần thứ 5 thì phải gửi lại mã.
- **AC4** Given mã đúng, mật khẩu mới hợp lệ Then mật khẩu được đổi, tôi được đăng nhập, mật khẩu cũ hết hiệu lực.
- **AC5** Given mã quá 10 phút Then báo "Mã đã hết hạn hoặc không tồn tại."

### US-03.05 – Quên mật khẩu khi không có email ✅ (1 SP)
- FR: FR-041
- **AC1** Given tài khoản chỉ có SĐT Then báo "Tài khoản này chưa có email… Vui lòng gọi <hotline>" và không gửi thư.

### US-03.06 – Cập nhật thông tin cá nhân ✅ (3 SP)
- FR: FR-050 → FR-053 · BR: BR-07, BR-08, BR-11
- **AC1** Given tôi sửa họ tên Then toast "Đã cập nhật thông tin tài khoản." và form hiển thị giá trị mới.
- **AC2** Given tôi thêm email Then sau đó đăng nhập được bằng email đó và dùng được "Quên mật khẩu".
- **AC3** Given SĐT/email mới trùng tài khoản khác Then báo lỗi tương ứng, không thay đổi gì.

### US-03.07 – Đổi mật khẩu ✅ (2 SP)
- FR: FR-054
- **AC1** Given mật khẩu hiện tại sai Then báo "Mật khẩu hiện tại không đúng."
- **AC2** Given đúng Then toast "Đã đổi mật khẩu thành công.", form được xóa trắng, phiên đăng nhập vẫn giữ.

---

## EP-04 – Học tập

### US-04.01 – Xem khóa học của tôi ✅ (3 SP)
- FR: FR-060 → FR-062
- **AC1** Given tôi có 1 khóa `approved` Then thẻ khóa hiển thị số bài học và "Vào học".
- **AC2** Given tôi là admin Then thấy tất cả khóa học.

### US-04.02 – Xem nội dung khóa học ✅ (2 SP)
- FR: FR-063
- **AC1** Given có quyền Then thấy danh sách bài và nút "Bắt đầu học" mở bài đầu tiên.
- **AC2** Given không có quyền Then thấy "Khóa học chưa được mở cho tài khoản của bạn" + nút "Đăng ký khóa học này" (`/register?course=<id>`).

### US-04.03 – Xem video bài học ✅ (5 SP)
- FR: FR-064, FR-065
- **AC1** Given bài học có link YouTube `watch?v=XXXXXXXXXXX` Then iframe `youtube.com/embed/XXXXXXXXXXX?rel=0&modestbranding=1` tỉ lệ 16:9.
- **AC2** Given link TikTok hoặc YouTube Shorts Then khung dọc 9:16.
- **AC3** Given bài 2/5 Then có "Bài trước" và "Bài tiếp theo"; bài hiện tại được tô trong danh sách bên phải.

### US-04.04 – Nội dung trả phí được bảo vệ ✅ (5 SP)
- FR: FR-066 · BR: BR-40 → BR-42
- **AC1** Given tôi chưa được duyệt khóa A When gọi API Supabase trực tiếp bằng anon key Then không đọc được bài học nào của khóa A.
- **AC2** Given admin thu hồi đơn Then lần tải trang kế tiếp tôi không xem được bài học.

---

## EP-05 – Quản trị đơn đăng ký

### US-05.01 – Xem đơn chờ duyệt ✅ (5 SP)
**Là** admin, **tôi muốn** thấy các đơn chờ duyệt, đơn cũ nhất lên đầu, **để** xử lý theo thứ tự.
- FR: FR-070 → FR-072, FR-076
- **AC1** Given mở `/admin` Then tab "Chờ duyệt" được chọn, mỗi tab hiện số lượng.
- **AC2** Given bảng rộng hơn màn hình Then cột Thao tác vẫn cố định bên phải.

### US-05.02 – Xem ảnh chuyển khoản ✅ (2 SP)
- FR: FR-075 · BR: BR-44
- **AC1** Given đơn có ảnh Then thumbnail 48×48; bấm vào mở ảnh gốc ở tab mới (signed URL 1 giờ).

### US-05.03 – Duyệt đơn ✅ (2 SP)
- FR: FR-073, FR-074
- **AC1** Given đơn `pending` When bấm "Duyệt" Then trạng thái `approved`, có Ngày xử lý và Người xử lý (admin đang đăng nhập), toast "Đã duyệt đơn, khóa học đã được mở cho học viên."

### US-05.04 – Từ chối đơn ✅ (1 SP)
- **AC1** Given đơn `pending` When bấm "Từ chối" Then trạng thái `rejected`, học viên thấy đơn trong "Đơn chưa được xác nhận".

### US-05.05 – Thu hồi quyền học ✅ (2 SP)
- **AC1** Given đơn `approved` When bấm "Thu hồi" Then hiện hộp xác nhận "Thu hồi quyền học "<khóa>" của <tên>?"; đồng ý → `rejected`.

---

## EP-06 – Quản trị học viên

### US-06.01 – Danh sách học viên ✅ (3 SP)
- FR: FR-080, FR-082
- **AC1** Given có học viên đăng ký 2 khóa Then dòng của họ liệt kê 2 khóa kèm badge trạng thái.

### US-06.02 – Tìm học viên ✅ (1 SP)
- FR: FR-081
- **AC1** Given nhập "0912" Then chỉ hiện tài khoản có tên/email/SĐT chứa "0912".

---

## EP-07 – Quản trị khóa học & bài học

### US-07.01 – Thêm khóa học ✅ (2 SP)
- FR: FR-091
- **AC1** Given điền tên, giá, trạng thái "Hiển thị" When bấm "Thêm khóa học" Then khóa xuất hiện trong danh sách, trên trang chủ (sau revalidate), form được xóa trắng.

### US-07.02 – Sửa khóa học ✅ (2 SP)
- FR: FR-092 · **AC1** Given sửa giá Then trang chủ và QR cập nhật giá mới.

### US-07.03 – Ẩn / hiện khóa học ✅ (1 SP)
- FR: FR-092 · BR: BR-20
- **AC1** Given bấm "Ẩn khóa học" Then badge "Đang ẩn", khóa biến mất khỏi trang chủ và ô chọn khóa.
- **AC2** Given học viên đã được duyệt khóa đó When khóa bị ẩn Then học viên vẫn thấy khóa trong "Khóa học của tôi" và xem được bài học; khách/học viên chưa mua nhận 404.

### US-07.04 – Xóa khóa học ✅ (1 SP)
- BR: BR-23 · **AC1** Given bấm "Xóa khóa học" Then hỏi xác nhận (nêu rõ đơn và lịch sử thanh toán được giữ); đồng ý → xóa khóa và bài học.
- **AC2** Then mọi đơn của khóa vẫn còn với tên khóa, học phí đã lưu; bảng admin hiện "(khóa học đã xóa)", không còn nút Duyệt; học viên vẫn thấy đơn trong lịch sử.

### US-07.07 – Dữ liệu nhập sai bị chặn ở server ✅ (2 SP)
**Là** chủ trung tâm, **tôi muốn** hệ thống từ chối dữ liệu khóa học/bài học không hợp lệ kể cả khi bị gửi thẳng lên server, **để** website không hiển thị giá sai hay nhúng link lạ.
- FR: FR-096 · BR: BR-21, BR-24, BR-26
- **AC1** Given tên chỉ có khoảng trắng / > 200 ký tự Then báo lỗi, không lưu.
- **AC2** Given học phí âm, số thập phân hoặc chữ Then báo lỗi; database cũng chặn học phí âm.
- **AC3** Given link video không phải https YouTube/TikTok (kể cả `javascript:`, `http://`) Then báo lỗi.

### US-07.05 – Quản lý bài học ✅ (3 SP)
- FR: FR-093
- **AC1** Given thêm bài với link YouTube Then bài xuất hiện với thứ tự mặc định = số bài + 1.
- **AC2** Given bấm "Xem thử" Then mở trang xem bài như học viên.

### US-07.06 – Thống kê nhanh theo khóa ✅ (1 SP)
- FR: FR-090 · **AC1** Then mỗi khóa hiện số bài học, số học viên đã duyệt, số đơn chờ duyệt.

---

## EP-08 – Trải nghiệm chung

### US-08.01 – Phản hồi sau mỗi thao tác ✅ (3 SP)
- FR: FR-100, FR-102 · **AC1** Given mọi thao tác tạo/sửa/xóa/duyệt/đăng nhập/đăng xuất Then có toast thành công hoặc lỗi, tự ẩn sau 4 giây, đóng được.

### US-08.02 – Biết mình đang ở đâu ✅ (1 SP)
- FR: FR-101, FR-103 · **AC1** Given đang ở `/admin` Then nút "Quản trị" có `aria-current="page"` và được tô nổi bật.

### US-08.03 – Menu tài khoản trên mọi thiết bị ✅ (2 SP)
- FR: FR-104 · **AC1** Given máy tính Then rê chuột mở menu. **AC2** Given điện thoại Then bấm mở menu, bấm ra ngoài thì đóng.

---

## EP-09 – Backlog mở rộng (chưa làm)

| ID | Story | Ưu tiên | SP | Ghi chú thiết kế |
| --- | --- | --- | --- | --- |
| US-09.01 | Là học viên, tôi muốn nhận email/Zalo khi đơn được duyệt | S | 3 | Dùng `lib/mailer.ts`; xem roadmap R-01 |
| US-09.02 | Là admin, tôi muốn đặt lại mật khẩu cho học viên không có email | S | 2 | Action mới dùng `auth.admin.updateUserById`; roadmap R-02 |
| US-09.03 | Là admin, tôi muốn tải ảnh bìa cho khóa học | C | 3 | Cột `cover_image` đã có sẵn; bucket public mới; R-03 |
| US-09.04 | Là học viên, tôi muốn đánh dấu bài đã học và thấy % tiến độ | C | 5 | Bảng `lesson_progress`; R-04 |
| ~~US-09.05~~ | Là admin, tôi muốn ghi lý do từ chối để học viên biết | S | 2 | ✅ Đã làm (Đợt 3): cột `review_note`, BR-46 |
| ~~US-09.11~~ | Là admin, tôi muốn cấp/gỡ quyền admin cho người khác và biết ai đã cấp | S | 2 | ✅ Đã làm (Đợt 3): tab "Admin" ở `/admin/users`, `role_events`, BR-03 |
| ~~US-09.12~~ | Là admin, tôi muốn xem lịch sử xử lý của từng đơn và không bị admin khác ghi đè | S | 2 | ✅ Đã làm (Đợt 3): `registration_events`, BR-36, BR-47 |
| ~~US-09.06~~ | Là admin, tôi muốn biết ai đã duyệt đơn | S | 1 | ✅ Đã làm 26/09/2026: cột "Người xử lý" (`reviewed_by`, `reviewed_by_name`), BR-37 |
| US-09.07 | Là admin, tôi muốn phân trang/lọc đơn theo khóa & ngày, xuất Excel | C | 5 | R-06 |
| US-09.08 | Là chủ trung tâm, tôi muốn xem báo cáo doanh thu theo tháng/khóa | C | 5 | View SQL; R-07 |
| US-09.09 | Là khách, tôi muốn thanh toán tự động xác nhận qua webhook ngân hàng | W | 13 | R-08 (Casso/SePay) |
| US-09.10 | Là admin, tôi muốn sắp xếp bài học bằng kéo thả | C | 3 | R-09 |
