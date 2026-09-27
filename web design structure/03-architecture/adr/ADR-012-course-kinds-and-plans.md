# ADR-012: Loại khóa học và gói theo thời hạn (có cộng dồn)

- **Trạng thái**: Accepted (thiết kế v0.2, chưa triển khai)
- **Ngày**: 27/09/2026
- **Người quyết định**: Chủ dự án

## Bối cảnh
v0.1 bán khóa học một lần, học vĩnh viễn. v0.2 có 3 loại:
- **Miễn phí**: ai cũng xem được, không cần đăng nhập.
- **Chương trình** (trả phí, theo nhóm bệnh: vẹo lưng, vẹo ngực): bán theo gói 1 / 3 / 6 / 12 tháng, **giá riêng từng chương trình**;
  1 tháng = 12 buổi, 3 tháng = 36 buổi…; thời hạn **tính từ lúc duyệt**, **cộng dồn** khi gia hạn;
  hết hạn thì mất quyền xem bài nhưng vẫn thấy tiến độ cũ và nút Gia hạn.
- **Premium** 1:4, 1:2, 1:1: chỉ có ảnh bìa, thông tin, giá và nút liên hệ Zalo; không có bài học.

## Quyết định
- `courses.kind in ('free','program','premium')`, `courses.category` (`veo_lung`, `veo_nguc`, null), `courses.audience`
  (`patient` mặc định, `expert` để dành cho giai đoạn sau – chưa có UI).
- Bảng `course_plans(course_id, months, sessions, price, active)`: mỗi chương trình có tối đa 1 gói cho mỗi số tháng;
  `sessions` mặc định = `months × 12`, admin sửa được.
- Đơn đăng ký lưu **snapshot gói** (`plan_id`, `plan_months`, `plan_sessions`, `amount`) như snapshot tên khóa/học phí hiện có.
- Khi đơn được duyệt, trigger tính:
  `access_starts_at = greatest(now(), hạn cuối hiện tại của bệnh nhân cho khóa đó)`, `access_until = access_starts_at + plan_months`.
  → Gia hạn khi còn hạn thì **cộng dồn** vào hạn cũ; đã hết hạn thì tính lại từ lúc duyệt.
- **Số buổi được mở** = tổng `plan_sessions` của mọi đơn đã duyệt cho khóa đó (cộng dồn cả đơn đã hết hạn), để bệnh nhân
  gia hạn thì học tiếp từ buổi đang dở chứ không học lại từ đầu.
- Quyền xem bài chương trình ⇔ có đơn `approved` còn hạn (`access_until > now()`); đơn cũ v0.1 có `access_until = null`
  được coi là không thời hạn.
- Unique index chống trùng đổi thành **chỉ 1 đơn `pending`** / bệnh nhân / khóa (cho phép nhiều đơn `approved` nối tiếp nhau).
- Khóa `premium` dùng `courses.price` để hiển thị giá; không có gói, không có bài học, không nhận đơn đăng ký.

## Hệ quả
- ✅ Một chương trình dài (VD 144 buổi) phục vụ mọi gói; mua thêm là học tiếp.
- ✅ Báo cáo doanh thu vẫn dựa trên `registrations.amount`.
- ⚠️ Thu hồi một đơn nằm giữa chuỗi gia hạn không dời các đơn sau (có thể tạo "khoảng trống"); chấp nhận, staff xử lý tay.
- ⚠️ Admin phải tạo đủ số buổi cho gói dài nhất; nếu thiếu, bệnh nhân thấy "Buổi tiếp theo đang được cập nhật".
- 🔜 Nếu cần khuyến mãi / mã giảm giá: bổ sung vào `course_plans` hoặc bảng `coupons` (roadmap R-13).

## Phương án đã cân nhắc
- *Mỗi gói là một khóa riêng* (VD "Vẹo lưng – 3 tháng"): đơn giản nhưng gia hạn phải học lại từ đầu, dữ liệu nội dung bị nhân bản.
- *Gói chỉ là thời hạn, nội dung chung 12 buổi*: không khớp yêu cầu "3 tháng = 36 buổi".
