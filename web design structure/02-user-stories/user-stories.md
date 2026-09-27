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
| EP-10 | *(v0.2)* Vai trò nhân viên | US-10.01 → 10.03 | P3, P7 |
| EP-11 | *(v0.2)* Danh mục khóa, khóa miễn phí, premium, chính sách bảo mật | US-11.01 → 11.06 | P5, P6 |
| EP-12 | *(v0.2)* Gói tháng, hạn học, gia hạn | US-12.01 → 12.05 | P6, P7 |
| EP-13 | *(v0.2)* Buổi tập, checklist, tiến độ | US-13.01 → 13.07 | P6, P3 |
| EP-14 | *(v0.2)* Nhân viên tạo tài khoản & cấp gói (Zalo) | US-14.01 → 14.05 | P7, P6 |
| EP-15 | *(v0.2)* Phiếu tham vấn bác sĩ | US-15.01 → 15.04 | P6, P7, P3 |
| EP-16 | *(v0.2)* Dashboard quản trị tập trung | US-16.01 → 16.03 | P3, P7 |

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

> US-09.02 (đặt lại mật khẩu), US-09.03 (ảnh bìa), US-09.04 (tiến độ học), US-09.10 (chia chương) được gộp vào v0.2:
> US-14.04, US-11.02, EP-13.

---

# Phiên bản 0.2 (chốt 27/09/2026 – ✅ triển khai Đợt 7 → 13)

## EP-10 – Vai trò nhân viên

### US-10.01 – Phân vai trò ✅ (3 SP)
**Là** admin, **tôi muốn** chọn vai trò Bệnh nhân / Nhân viên / Admin cho một tài khoản, **để** nhân viên làm việc vận hành mà không có toàn quyền.
- FR: FR-110, FR-113 · BR: BR-70, BR-71 · ADR-011
- **AC1** Given tôi là admin When chọn "Nhân viên" cho tài khoản B và xác nhận Then B có `role = staff`, `role_events` ghi tôi là người đổi.
- **AC2** Given tôi là staff When gọi API đổi vai trò của ai đó Then database từ chối.
- **AC3** Given tôi là admin duy nhất When tự đổi vai trò Then bị chặn.

### US-10.02 – Nhân viên chỉ thấy việc của mình ✅ (3 SP)
**Là** nhân viên, **tôi muốn** vào trang quản trị để xử lý đơn, bệnh nhân, phiếu tham vấn, **để** làm việc hằng ngày.
- FR: FR-111, FR-112 · BR: BR-72, BR-73
- **AC1** Given tôi là staff When mở `/admin` Then thấy menu Tổng quan, Đơn đăng ký, Bệnh nhân, Phiếu tham vấn, Khách quan tâm; **không** có Khóa học, Cài đặt. *(Đợt 7: menu hiện có Đơn đăng ký, Học viên; các mục khác thêm theo đợt.)*
- **AC2** Given tôi là staff When mở `/admin/courses` Then bị chuyển về `/admin`; gọi API sửa khóa học bị RLS chặn.
- **AC3** Given tôi là staff When xem dashboard Then không thấy doanh thu.

### US-10.03 – Nhân viên duyệt đơn ✅ (1 SP)
- FR: FR-114 · BR: BR-72
- **AC1** Given tôi là staff When duyệt đơn chờ Then đơn `approved`, người xử lý là tôi, hạn học được tính.

## EP-11 – Danh mục khóa, miễn phí, premium

### US-11.01 – Xem khóa theo nhóm ✅ (3 SP)
**Là** khách, **tôi muốn** thấy khóa miễn phí, chương trình phục hồi (vẹo lưng / vẹo ngực) và premium tách riêng, **để** chọn đúng.
- FR: FR-120, FR-122
- **AC1** Given có khóa 3 loại When mở trang chủ Then thấy 3 nhóm; chương trình có nút lọc Vẹo lưng / Vẹo ngực; thẻ có ảnh bìa, số buổi, giá "từ …đ".

### US-11.02 – Admin tải ảnh bìa ✅ (2 SP)
- FR: FR-121
- **AC1** Given admin chọn ảnh 5MB When lưu Then ảnh được nén, lưu vào `course-covers`, trang chủ hiển thị ảnh mới.
- **AC2** Given staff/khách gọi API upload vào `course-covers` Then bị chặn.

### US-11.03 – Trang giới thiệu khóa kiểu Udemy ✅ (Đợt 8–9; đề cương theo buổi ở Đợt 10) (5 SP)
**Là** khách, **tôi muốn** xem đề cương, lợi ích, giá các gói trước khi mua, **để** yên tâm đăng ký.
- FR: FR-123, FR-157
- **AC1** Given chương trình có 36 buổi When mở `/khoa-hoc/<id>` Then thấy các buổi (thu gọn), mở ra thấy tên bài; không có link video trong HTML.
- **AC2** Given chọn gói 3 tháng ở khung giá Then nút "Đăng ký gói 3 tháng" dẫn tới box đăng ký chọn sẵn chương trình + gói.

### US-11.04 – Học khóa miễn phí không cần tài khoản ✅ (3 SP)
- FR: FR-124 · BR: BR-75
- **AC1** Given khách chưa đăng nhập When mở bài của khóa miễn phí Then xem được video; thấy gợi ý "Đăng nhập để lưu tiến độ".
- **AC2** Given khách đọc bảng `lessons` qua API cho bài của chương trình trả phí Then không nhận được dòng nào (không có link) – RLS `can_view_lesson` (Đợt 10).

### US-11.05 – Liên hệ Zalo khóa premium ✅ (3 SP)
**Là** khách, **tôi muốn** bấm liên hệ Zalo để nhận ưu đãi khóa 1:1, **để** được tư vấn trực tiếp.
- FR: FR-125, FR-174, FR-175 · BR: BR-76, BR-104, BR-105 · ADR-015
- **AC1** Given tôi nhập họ tên + SĐT When bấm "Gửi & mở Zalo" Then lead được lưu (khóa 1:1, SĐT chuẩn hóa) và Zalo mở ở tab mới.
- **AC2** Given tôi bấm "Mở Zalo ngay" Then Zalo mở, một lượt bấm ẩn danh được lưu.
- **AC3** Given nhân viên mở `/admin/leads` Then thấy lead mới, đổi được sang "Đã liên hệ".

### US-11.06 – Chính sách bảo mật & đồng ý ✅ (2 SP)
- FR: FR-126, FR-132 · BR: BR-106, BR-107 · RV-17
- **AC1** Given tôi là khách mới When gửi đơn mà không tick đồng ý Then báo "Vui lòng đồng ý Chính sách bảo mật" (cả ở server).
- **AC2** Given tôi là học viên cũ chưa đồng ý When đăng nhập Then hiện hộp đồng ý một lần.

## EP-12 – Gói tháng, hạn học, gia hạn

### US-12.01 – Admin đặt giá gói ✅ (3 SP)
- FR: FR-130 · BR: BR-77
- **AC1** Given chương trình Vẹo lưng When admin thêm gói 1 tháng 990.000đ, 3 tháng 2.500.000đ Then số buổi mặc định 12, 36; trang giới thiệu hiện 2 gói.
- **AC2** Given thêm gói 1 tháng lần thứ 2 cho cùng chương trình Then báo trùng.

### US-12.02 – Đăng ký chọn gói ✅ (3 SP)
- FR: FR-131, FR-133 · BR: BR-78, BR-79
- **AC1** Given tôi chọn Vẹo lưng – 3 tháng Then QR có số tiền 2.500.000đ; đơn lưu `plan_months = 3`, `plan_sessions = 36`, `amount = 2500000`.
- **AC2** Given ai đó sửa form gửi giá 1.000đ Then server vẫn lưu giá theo gói.

### US-12.03 – Hạn học tính từ lúc duyệt, cộng dồn ✅ (5 SP)
- FR: FR-134, FR-135 · BR: BR-80, BR-84
- **AC1** Given đơn gói 1 tháng được duyệt lúc T Then `access_until = T + 1 tháng`.
- **AC2** Given tôi còn hạn tới H và gia hạn gói 3 tháng, được duyệt Then hạn mới = H + 3 tháng.
- **AC3** Given đã hết hạn và gia hạn Then hạn mới = lúc duyệt + số tháng; tôi học tiếp từ buổi đang dở.
- **AC4** Given tôi đã có 1 đơn chờ duyệt cho chương trình Then không gửi được đơn thứ 2.

### US-12.04 – Thấy hạn học và gia hạn ✅ (3 SP)
- FR: FR-136
- **AC1** Given còn 5 ngày Then thẻ khóa hiện "Còn 5 ngày" màu vàng và nút "Gia hạn".
- **AC2** Given bấm "Gia hạn" Then box đăng ký chọn sẵn chương trình, tôi chọn gói.

### US-12.05 – Hết hạn vẫn giữ tiến độ ✅ (2 SP)
- FR: FR-137 · BR: BR-85
- **AC1** Given đã hết hạn When mở chương trình Then thấy đề cương, bài đã tick, 40%; video không phát, hiện "Gói đã hết hạn – Gia hạn để tập tiếp".

## EP-13 – Buổi tập, checklist, tiến độ

### US-13.01 – Tạo khung buổi nhanh ✅ (3 SP)
**Là** admin, **tôi muốn** nhập "36 buổi × 6 bài" để có sẵn khung, **để** không phải tạo tay 216 bài.
- FR: FR-140 · BR: BR-86
- **AC1** Given nhập 36 × 6 Then có Buổi 1…36, mỗi buổi Bài 1…6 "Chưa có video".
- **AC2** Given nhập 0 hoặc 201 buổi Then báo lỗi.

### US-13.02 – Quản lý buổi và bài ✅ (5 SP)
- FR: FR-141 → FR-143 · BR: BR-87
- **AC1** Given Buổi 2 có 6 bài When "Sao chép buổi" Then Buổi mới có 6 bài cùng tên, mô tả, link video.
- **AC2** Given bài không có link Then lưu được; có link sai Then báo lỗi như cũ.
- **AC3** Then trang nội dung cảnh báo "12 bài chưa có video", "Gói 12 tháng cần 144 buổi, hiện có 36".

### US-13.03 – Checklist từng buổi ✅ (3 SP)
**Là** bệnh nhân, **tôi muốn** tick từng bài đã tập, **để** biết buổi hôm nay đã xong chưa.
- FR: FR-150, FR-151 · BR: BR-88
- **AC1** Given tôi đang ở Bài 2 Buổi 1 When bấm "Hoàn thành & bài tiếp theo" Then Bài 2 có ✓ và mở Bài 3.
- **AC2** Given bỏ tick một bài Then hỏi xác nhận, bài bỏ ✓.

### US-13.04 – Buổi mở lần lượt ✅ (5 SP)
- FR: FR-152 · BR: BR-89, BR-90
- **AC1** Given tôi chưa tick đủ Buổi 1 Then Buổi 2 hiện 🔒 "Hoàn thành Buổi 1 để mở"; đọc bài Buổi 2 qua API không trả dòng nào (RLS `can_view_lesson`); insert tiến độ bài Buổi 2 bị RLS chặn.
- **AC2** Given tick đủ 6 bài Buổi 1 Then Buổi 2 mở, nút "Bắt đầu Buổi 2".
- **AC3** Given tôi mua gói 1 tháng (12 buổi) Then Buổi 13 hiện 🔒 "Gia hạn để mở".

### US-13.05 – Thấy tiến độ ✅ (2 SP)
- FR: FR-153 · BR: BR-91
- **AC1** Given đã tick 18/72 bài (gói 1 tháng × 6 bài) Then thanh tiến độ "18/72 bài · 25%" ở trình học và thẻ khóa.

### US-13.06 – Nút hành động khi tập ✅ (2 SP)
- FR: FR-154
- **AC1** Given tôi đang dở Buổi 3 Bài 4 Then thẻ khóa và trang khóa có nút "Tiếp tục Buổi 3 – Bài 4".

### US-13.07 – Nhân viên xem trước nội dung ✅ (1 SP)
- FR: FR-156 · BR: BR-92
- **AC1** Given tôi là staff Then mở được mọi buổi, không có ô tick.

## EP-14 – Nhân viên tạo tài khoản & cấp gói

### US-14.01 – Tạo tài khoản bệnh nhân từ Zalo ✅ (5 SP)
**Là** nhân viên, **tôi muốn** nhập thông tin khách Zalo và cấp gói trong một form, **để** khách học được ngay.
- FR: FR-160 → FR-162 · BR: BR-94, BR-95, BR-97 · ADR-014
- **AC1** Given nhập họ tên, SĐT, tick đồng ý, chọn Vẹo ngực – 1 tháng, số tiền 990.000đ, "Tiền mặt" When bấm Tạo Then tài khoản `source = zalo`, đơn `approved` `source = staff`, hạn = bây giờ + 1 tháng, người xử lý là tôi; màn hình hiện mật khẩu 8 ký tự một lần và nút "Chép tin nhắn gửi Zalo".
- **AC2** Given SĐT đã có tài khoản Then báo "Số điện thoại này đã có tài khoản. Hãy tìm bệnh nhân đó và cấp gói ở trang chi tiết." (Đợt 11: chưa kèm link trực tiếp).
- **AC3** Given tạo đơn lỗi Then tài khoản vừa tạo bị xóa.

### US-14.02 – Bệnh nhân đăng nhập bằng tài khoản được cấp ✅ (3 SP)
- FR: FR-165 · BR: BR-96
- **AC1** Given tôi đăng nhập bằng SĐT + mật khẩu được cấp Then hiện hộp "Bạn nên đổi mật khẩu" [Đổi ngay] / [Để sau].
- **AC2** Given tôi đổi mật khẩu Then đăng nhập được bằng mật khẩu mới (Supabase Auth), hộp không hiện nữa.
- **AC3** Given tôi bấm "Để sau" Then vào học bình thường, không hỏi lại trong phiên trình duyệt này; mở trình duyệt lần sau vẫn được nhắc (tới khi đổi mật khẩu).

### US-14.03 – Cấp gói / gia hạn cho bệnh nhân có sẵn ✅ (3 SP)
- FR: FR-163 · BR: BR-80, BR-97
- **AC1** Given bệnh nhân còn hạn tới H When nhân viên cấp thêm gói 3 tháng Then hạn = H + 3 tháng.

### US-14.04 – Cấp lại mật khẩu ✅ (2 SP)
- FR: FR-164 · BR: BR-99
- **AC1** Given bệnh nhân quên mật khẩu (không có email) When nhân viên bấm "Cấp lại mật khẩu" và xác nhận Then mật khẩu cũ hết hiệu lực, mật khẩu mới hiện một lần, `account_events` ghi lại.
- **AC2** Given tài khoản là staff/admin Then không có nút này; gọi action bị từ chối.

### US-14.05 – Tìm và lọc bệnh nhân ✅ (2 SP)
- FR: FR-166
- **AC1** Given lọc "Zalo" + "Sắp hết hạn" Then chỉ hiện bệnh nhân nhân viên tạo có gói hết hạn trong 7 ngày.
- **AC2** (Đợt 11, thêm) Lọc "Không tập > 7 ngày", "Chưa có gói", "Mới 7 / 30 ngày"; danh sách có % tiến độ và lần tập gần nhất.

## EP-15 – Phiếu tham vấn

### US-15.01 – Admin soạn mẫu phiếu ✅ (2 SP)
- FR: FR-170 · BR: BR-100
- **AC1** Given admin thêm câu "Mức đau lưng hiện tại" dạng thang 0–10 Then phiếu mới có câu này; phiếu cũ không đổi.

### US-15.02 – Gửi phiếu bất cứ lúc nào ✅ (3 SP)
**Là** bệnh nhân, **tôi muốn** điền phiếu tình trạng và gửi cho nhân viên lúc nào cũng được, **để** được bác sĩ tư vấn kịp thời.
- FR: FR-171, FR-172 · BR: BR-101
- **AC1** Given tôi đang ở Buổi 5 When bấm "Phiếu tham vấn" (chương trình được chọn sẵn), điền và gửi Then phiếu trạng thái "Mới", tôi thấy nó trong "Phiếu tham vấn của tôi".
- **AC2** Given đã gửi 5 phiếu hôm nay Then báo đợi ngày mai hoặc gọi hotline.

### US-15.03 – Nhắc khi kết thúc khóa ✅ (2 SP)
- FR: FR-155
- **AC1** Given tôi tick xong bài cuối của buổi cuối đã mua Then hiện thẻ chúc mừng với "Gửi phiếu tham vấn bác sĩ" và "Gia hạn để tập tiếp".

### US-15.04 – Nhân viên xử lý phiếu ✅ (3 SP)
- FR: FR-173 · BR: BR-102, BR-103
- **AC1** Given phiếu mới Then nhân viên xem toàn bộ câu trả lời, gọi/Zalo bệnh nhân, chuyển "Đã liên hệ" kèm ghi chú nội bộ.
- **AC2** Given 2 nhân viên cùng xử lý Then người sau nhận "Phiếu đã thay đổi, vui lòng tải lại trang".
- **AC3** Given bệnh nhân khác gọi API đọc phiếu của tôi Then không đọc được.

## EP-16 – Dashboard quản trị

### US-16.01 – Tổng quan ✅ (5 SP)
- FR: FR-180, FR-181
- **AC1** Given mở `/admin` Then thấy thẻ: tổng bệnh nhân, mới 7/30 ngày (Web / Zalo), đơn chờ, gói hiệu lực, sắp hết hạn, đã hết hạn, phiếu mới, lead mới; bấm thẻ mở danh sách đã lọc.

### US-16.02 – Việc cần làm hôm nay ✅ (3 SP)
- FR: FR-182, FR-183
- **AC1** Then có danh sách: đơn chờ lâu nhất, bệnh nhân sắp hết hạn (nút gọi / Zalo), phiếu mới, lead mới, bệnh nhân không tập > 7 ngày kèm %.

### US-16.03 – Doanh thu (chỉ admin) ✅ (3 SP)
- FR: FR-184 · BR: BR-73
- **AC1** Given tôi là admin Then thấy doanh thu tháng này / tháng trước theo chương trình, hình thức thanh toán, nguồn, nhân viên.
- **AC2** Given tôi là staff Then không có mục doanh thu; gọi hàm `revenue_report()` bị từ chối. (Staff vẫn thấy học phí từng đơn vì cần đối chiếu chuyển khoản.)
