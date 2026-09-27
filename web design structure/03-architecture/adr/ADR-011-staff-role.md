# ADR-011: Ba vai trò user / staff / admin

- **Trạng thái**: Accepted – triển khai ở Đợt 7 (27/09/2026)
- **Ngày**: 27/09/2026
- **Người quyết định**: Chủ dự án

## Bối cảnh
Phiên bản 0.1 chỉ có `user` và `admin`, các admin quyền ngang nhau (Đợt 3). Từ v0.2 trung tâm có nhân viên tư vấn
làm việc song song trên Zalo và website: kiểm tra đơn, tạo tài khoản cho bệnh nhân đến từ Zalo, cấp khóa, theo dõi
tiến độ và phiếu tham vấn. Nhân viên không được sửa nội dung khóa học hay phân quyền.

## Quyết định
- `profiles.role in ('user', 'staff', 'admin')`. Admin luôn là quyền cao nhất.
- Hai hàm dùng trong RLS: `is_admin()` (giữ nguyên) và `is_staff()` = `role in ('staff','admin')`.
- **Staff**: duyệt / từ chối / thu hồi đơn; tạo và sửa thông tin bệnh nhân (`role = 'user'`); cấp gói khóa học kèm ghi
  nhận thanh toán; cấp lại mật khẩu; xử lý phiếu tham vấn và khách quan tâm premium; xem dashboard **không có doanh thu**;
  xem trước nội dung khóa học (chỉ đọc).
- **Chỉ admin**: thêm/sửa/xóa khóa học, buổi, bài tập, gói giá; sửa mẫu phiếu tham vấn; cấp/gỡ quyền `staff`/`admin`;
  xem doanh thu; sửa thông tin tài khoản staff/admin.
- Server: `requireAdmin()` được bổ sung `requireStaff()` (`lib/auth.ts`); `getCurrentUser()` trả `role`.
- ~~Middleware: `/admin/**` cho staff và admin; các trang chỉ-admin (`/admin/courses/**`, `/admin/settings/**`) chặn staff.~~
  Từ Đợt 11 (ADR-016): middleware chỉ kiểm tra đăng nhập; layout `/admin` và từng trang gọi `requireStaffPage()`,
  trang chỉ-admin gọi `requireAdminPage()` (nhân viên về `/admin`). Database vẫn là lớp kiểm tra cuối (ADR-002).
- Trigger `guard_role_change` mở rộng: chỉ admin đổi được `role`; giữ luật không tự đổi quyền mình và luôn còn ≥ 1 admin;
  ghi `role_events` như cũ.

## Hệ quả
- ✅ Nhân viên làm được toàn bộ việc vận hành hằng ngày mà không có quyền phá nội dung.
- ✅ Tận dụng nền phân quyền Đợt 3 (`role_events`, trigger, nút phân quyền) – thay nút cấp/gỡ admin bằng ô chọn vai trò.
- ⚠️ Mọi policy đang dùng `is_admin()` phải rà lại: chỗ nào staff cần quyền thì đổi sang `is_staff()`.
- ⚠️ Staff sửa `profiles` của bệnh nhân qua policy riêng chỉ áp dụng cho dòng `role = 'user'`, tránh staff sửa tài khoản admin.

## Phương án đã cân nhắc
- *Bảng quyền chi tiết (permission table)*: linh hoạt nhưng thừa với 3 vai trò; để dành khi có vai trò chuyên gia.
- *Dùng custom claims trong JWT*: nhanh hơn nhưng phải đăng xuất mới cập nhật quyền; không cần ở quy mô hiện tại.
