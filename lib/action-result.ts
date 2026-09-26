// Kết quả trả về của server action, dùng để hiện thông báo (toast) ở client
export type ActionResult = { ok: true; message: string } | { ok: false; error: string }
