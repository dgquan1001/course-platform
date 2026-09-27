# ADR-015: Phiếu tham vấn bác sĩ và khách quan tâm premium lưu trên website

- **Trạng thái**: Accepted (thiết kế v0.2, chưa triển khai)
- **Ngày**: 27/09/2026
- **Người quyết định**: Chủ dự án

## Bối cảnh
- Bệnh nhân cần gửi **phiếu tham vấn** (checklist tình trạng) cho nhân viên **bất cứ lúc nào**, và được nhắc gửi khi kết thúc khóa.
  Staff phải xem được câu trả lời để hẹn tham vấn với bác sĩ (qua Zalo / điện thoại, không đặt lịch trên web).
- Khóa premium không bán trên web; nút "Liên hệ Zalo nhận ưu đãi" phải **lưu lại khách bấm** và **mở Zalo**.

## Quyết định
- **Mẫu phiếu chung** do admin soạn: bảng `consult_questions(label, kind, sort_order, active)`,
  `kind in ('check','scale','text')` (có/không, thang 0–10, trả lời ngắn).
- Bảng `consultations`: bệnh nhân (đăng nhập bắt buộc), khóa đang học (tùy chọn), `answers jsonb` = **snapshot** câu hỏi + câu trả lời
  (sửa mẫu không làm sai phiếu cũ), `note`, `trigger` (`manual` / `course_end`), trạng thái `new → contacted → done`
  (hoặc `cancelled`), `handled_by`, `handled_by_name`, `staff_note`, thời điểm.
  Ghi bằng server action (service role) sau khi kiểm tra; bệnh nhân đọc phiếu của mình; staff/admin đọc & cập nhật trạng thái.
  Giới hạn 5 phiếu / ngày / bệnh nhân.
- Nút **"Gửi phiếu tham vấn"** có ở: trình học (luôn hiện), Khóa học của tôi, và thẻ "Chúc mừng hoàn thành" khi tick xong buổi cuối
  đã mua (hoặc khi gói sắp hết hạn ≤ 7 ngày).
- **Khách quan tâm (lead)**: bảng `leads(course_id, course_title, user_id?, full_name?, phone?, note, source, status, handled_by…)`.
  Nút premium mở hộp nhỏ: Họ tên, SĐT (điền sẵn nếu đã đăng nhập) → [Gửi & mở Zalo]; hoặc [Mở Zalo ngay] (lưu lượt bấm ẩn danh,
  `phone = null`). Sau khi lưu, trình duyệt mở `siteConfig.zaloUrl` ở tab mới. Giới hạn tần suất theo IP.
  Staff xử lý tại `/admin/leads`: `new → contacted → converted / closed`.
- Dữ liệu phiếu tham vấn là **dữ liệu sức khỏe** (nhạy cảm theo NĐ 13/2023) → chỉ bệnh nhân đó, staff, admin đọc được; nằm trong
  phạm vi đồng ý ở chính sách bảo mật (RV-17).

## Hệ quả
- ✅ Nhân viên có danh sách việc cần gọi (phiếu mới, lead mới) ngay trên dashboard, không phụ thuộc lịch sử chat Zalo.
- ✅ Đếm được hiệu quả khóa premium (lượt bấm, số khách để lại SĐT, số chốt).
- ⚠️ Lượt bấm ẩn danh chỉ dùng thống kê, không liên hệ lại được.
- 🔜 Đặt lịch hẹn trên web / thông báo Zalo OA cho staff khi có phiếu mới – để sau.

## Phương án đã cân nhắc
- *Câu hỏi cố định trong code*: nhanh nhưng mỗi lần sửa câu hỏi phải deploy; chọn bảng do admin sửa.
- *Chỉ mở Zalo, không lưu*: không đo được, staff không chủ động gọi lại được.
