# ADR-009: Nén ảnh chuyển khoản ngay trên trình duyệt

- **Trạng thái**: Accepted

## Bối cảnh
Ảnh chụp màn hình điện thoại thường 2–10MB; mạng di động chậm; Server Action giới hạn body; Storage giới hạn 5MB.

## Quyết định
- Trước khi gửi: `createImageBitmap` → canvas, cạnh dài ≤ 1600px, JPEG chất lượng 0.82, nền trắng cho PNG trong suốt.
- Bỏ qua nén nếu JPEG ≤ 400KB, nếu trình duyệt không đọc được định dạng (HEIC trên Chrome), hoặc ảnh nén lớn hơn ảnh gốc.
- Thay file trong `<input type=file>` bằng `DataTransfer` để form submit bình thường (progressive enhancement).
- Server vẫn kiểm tra lại định dạng và 5MB.

## Hệ quả
- ✅ Upload nhanh (~150–500KB), tiết kiệm Storage.
- ⚠️ HEIC trên trình duyệt không hỗ trợ sẽ gửi ảnh gốc; admin dùng Chrome có thể **không xem được** thumbnail HEIC (RV-06).
- ⚠️ Chữ rất nhỏ có thể bị mờ ở 1600px – đủ cho ảnh giao dịch ngân hàng.
