# ADR-004: Thanh toán chuyển khoản + VietQR + admin duyệt thủ công

- **Trạng thái**: Accepted

## Bối cảnh
Khách Việt Nam quen chuyển khoản bằng QR. Cổng thanh toán (VNPay, MoMo…) cần đăng ký doanh nghiệp, phí giao dịch,
tích hợp phức tạp. Khối lượng đơn thấp (vài – vài chục đơn/ngày).

## Quyết định
- Hiển thị ảnh QR từ `img.vietqr.io` với số tiền = giá khóa và nội dung = SĐT khách.
- Khách tải **ảnh chụp chuyển khoản** làm bằng chứng; admin đối chiếu với sao kê rồi bấm Duyệt.
- Đơn có vòng đời `pending → approved/rejected` (xem business-rules.md).

## Hệ quả
- ✅ Không phí cổng thanh toán, triển khai ngay.
- ✅ Nội dung = SĐT giúp đối chiếu sao kê nhanh.
- ⚠️ Có độ trễ duyệt (phụ thuộc giờ làm việc admin).
- ⚠️ Dễ bị ảnh giả → admin **phải** đối chiếu sao kê, không chỉ nhìn ảnh.
- ⚠️ Phụ thuộc dịch vụ ảnh VietQR bên thứ ba (nếu lỗi, khách vẫn chuyển được theo thông tin chữ).
- 🔜 Nâng cấp: webhook đối soát tự động (Casso/SePay) – roadmap R-08.
