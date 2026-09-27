# Chân dung người dùng (Personas)

## P1 – Cô Lan, học viên lớn tuổi (persona chính)

| | |
| --- | --- |
| Tuổi / nghề | 52 tuổi, nhân viên văn phòng sắp nghỉ hưu |
| Thiết bị | Điện thoại Android màn hình lớn, app ngân hàng, Zalo |
| Kỹ năng số | Biết chuyển khoản bằng QR, chụp màn hình; **không dùng email** |
| Vấn đề | Đau cổ vai gáy, thoái hóa cột sống nhẹ |
| Mục tiêu | Đăng ký nhanh, học theo video ở nhà, xem lại nhiều lần |
| Nỗi lo | Chuyển khoản rồi không được mở khóa; quên mật khẩu |
| Thiết kế đáp ứng | Đăng nhập bằng SĐT, QR tự điền số tiền, nút lớn ≥ 44px, hotline/Zalo luôn hiện, trạng thái đơn rõ ràng |

## P2 – Anh Minh, dân văn phòng trẻ

| | |
| --- | --- |
| Tuổi / nghề | 30 tuổi, lập trình viên |
| Thiết bị | Laptop + iPhone (ảnh HEIC) |
| Kỹ năng số | Thành thạo; dùng Gmail |
| Mục tiêu | Mua nhiều khóa, học trên máy tính giờ nghỉ trưa |
| Thiết kế đáp ứng | Đăng ký thêm khóa khi đã đăng nhập (không nhập lại thông tin), hỗ trợ HEIC, quên mật khẩu tự phục vụ qua email |

## P3 – Chị Hà, admin của trung tâm

| | |
| --- | --- |
| Vai trò | Nhân viên tư vấn kiêm kế toán |
| Thiết bị | Máy tính văn phòng + điện thoại |
| Công việc | Mỗi ngày đối chiếu sao kê ngân hàng với đơn đăng ký, duyệt đơn, trả lời khách, đăng bài học mới |
| Mục tiêu | Thấy ngay đơn chờ duyệt, xem ảnh chuyển khoản to rõ, duyệt 1 chạm, gọi lại khách từ bảng |
| Nỗi lo | Duyệt nhầm, lỡ tay xóa khóa học |
| Thiết kế đáp ứng | Tab "Chờ duyệt" mặc định & đơn cũ nhất lên đầu, thumbnail bấm mở ảnh lớn, link `tel:`, cột Thao tác cố định, hộp xác nhận khi Thu hồi/Xóa, toast phản hồi |

## P4 – Bác sĩ Cường, chủ trung tâm

| | |
| --- | --- |
| Vai trò | Chủ sản phẩm, người quay video |
| Mục tiêu | Thương hiệu chuyên nghiệp, uy tín y khoa, nội dung không bị lộ tràn lan |
| Thiết kế đáp ứng | Landing page giới thiệu chuyên môn, bảng màu xanh y tế – vàng kem, khóa học chỉ mở theo từng khóa đã thanh toán |

## P6 – Chị Mai, bệnh nhân vẹo cột sống (v0.2 – persona chính)

| | |
| --- | --- |
| Tuổi / nghề | 38 tuổi, kế toán; con gái 14 tuổi cũng bị vẹo lưng nhẹ |
| Thiết bị | Điện thoại Android, Zalo, app ngân hàng |
| Kênh | Xem video TikTok của bác sĩ → nhắn Zalo hỏi → được nhân viên tạo tài khoản |
| Vấn đề | Vẹo cột sống ngực, đau lưng khi ngồi lâu; không biết tập đúng hay sai |
| Mục tiêu | Tập đều mỗi ngày theo lộ trình, biết hôm nay tập buổi nào, thấy mình tiến bộ, được bác sĩ xem lại tình trạng |
| Nỗi lo | Tập sai gây đau thêm; bỏ dở giữa chừng; hết hạn mất dữ liệu |
| Thiết kế đáp ứng | Buổi mở lần lượt, checklist từng bài, % tiến độ, nút "Tiếp tục Buổi X", phiếu tham vấn bất cứ lúc nào, hết hạn vẫn còn tiến độ, gia hạn học tiếp |

## P7 – Bạn Tuấn, nhân viên tư vấn (staff, v0.2)

| | |
| --- | --- |
| Vai trò | Trả lời Zalo, chốt gói, đối chiếu chuyển khoản, gọi nhắc bệnh nhân |
| Thiết bị | Máy tính văn phòng (Zalo PC mở song song) + điện thoại |
| Công việc | Tạo tài khoản cho khách Zalo, gửi mật khẩu, duyệt đơn web, gọi nhắc gia hạn, chuyển phiếu tham vấn cho bác sĩ |
| Mục tiêu | Tạo tài khoản + cấp gói trong < 1 phút; một màn hình biết hôm nay cần gọi ai |
| Nỗi lo | Gõ nhầm SĐT, cấp nhầm gói, quên khách sắp hết hạn |
| Thiết kế đáp ứng | Form tạo bệnh nhân 1 trang + mật khẩu tự sinh + nút "Chép tin nhắn gửi Zalo", dashboard việc cần làm, không có quyền sửa khóa học |

> P3 (chị Hà) từ v0.2 là **admin**: quản lý nội dung, gói giá, nhân viên, xem doanh thu.

## P5 – Khách tìm hiểu

| | |
| --- | --- |
| Hành vi | Đến từ Facebook/TikTok/Zalo, đọc lướt trên điện thoại |
| Mục tiêu | Hiểu khóa học có phù hợp không, hỏi tư vấn |
| Thiết kế đáp ứng | Hero rõ ràng, danh sách vấn đề thường gặp, FAQ, nút "Gọi ngay"/"Tư vấn qua Zalo", thanh CTA cố định |
