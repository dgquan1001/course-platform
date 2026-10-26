// Kết quả trả về của server action, dùng để hiện thông báo (toast) ở client.
// redirectTo: sau khi thành công chuyển sang trang này (VD vừa tạo khóa → trang sửa khóa, vừa xóa → danh sách)
export type ActionResult = { ok: true; message: string; redirectTo?: string } | { ok: false; error: string }
