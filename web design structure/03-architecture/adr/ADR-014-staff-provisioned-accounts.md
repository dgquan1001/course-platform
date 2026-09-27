# ADR-014: Nhân viên tạo tài khoản cho bệnh nhân đến từ Zalo (mật khẩu hệ thống sinh)

- **Trạng thái**: Accepted (thiết kế v0.2, chưa triển khai)
- **Ngày**: 27/09/2026
- **Người quyết định**: Chủ dự án

## Bối cảnh
Khách đi qua lại giữa Zalo và website. Khách đến từ website tự đăng ký (ADR-006). Khách chốt đơn trên Zalo
(thanh toán chuyển khoản / tiền mặt) cần được nhân viên nhập lên hệ thống để mọi thông tin quản trị tập trung trên website.

## Quyết định
- Trang `/admin/patients/new` (staff, admin): họ tên*, SĐT*, email (tùy chọn), ghi chú, xác nhận "bệnh nhân đã đồng ý chính sách
  bảo mật"*, tùy chọn cấp gói ngay: khóa + gói + số tiền* + hình thức thanh toán* (`bank_transfer`, `cash`, `other`)
  + ảnh chuyển khoản (tùy chọn) + ghi chú thanh toán.
- Server action dùng service role (như ADR-006): kiểm tra `requireStaff()`, trùng SĐT/email, tạo user `email_confirm: true`
  (email nội bộ nếu không có email – ADR-003), `profiles.source = 'zalo'`, `created_by = staff`, `must_change_password = true`,
  `consent_at`, `consent_source = 'staff'`.
- **Mật khẩu do hệ thống sinh**: 8 ký tự dễ đọc qua điện thoại (bỏ ký tự dễ nhầm `0/O`, `1/l/I`), CSPRNG. Hiển thị **một lần**
  cho staff kèm nút "Chép tin nhắn gửi Zalo" (SĐT đăng nhập + mật khẩu + link). Không lưu mật khẩu rõ ở đâu.
- Cấp gói: tạo đơn `source = 'staff'`, `status = 'approved'` ngay; `payment_proof_path` được phép `null` khi `source = 'staff'`.
  Đơn được insert bằng **server client của nhân viên** (policy `registrations_staff_insert`, `created_by = auth.uid()`) chứ không
  bằng service role, để trigger `before insert` ghi người xử lý = nhân viên, lịch sử `registration_events` (`from_status = 'new'`)
  và tính hạn học (ADR-012). Ảnh chuyển khoản (nếu có) vẫn upload bằng service role.
  Lỗi giữa chừng → xóa tài khoản vừa tạo (rollback như `registerAction`).
- **Đổi mật khẩu lần đầu**: không bắt buộc. Khi `must_change_password = true`, sau đăng nhập hiện hộp "Bạn nên đổi mật khẩu
  do nhân viên cấp" với [Đổi ngay] / [Để sau]; đổi thành công (qua Supabase Auth, `changePasswordAction`) thì cờ về `false`.
- **Cấp lại mật khẩu** (staff, admin – gộp roadmap R-02): sinh mật khẩu mới, đặt lại cờ `must_change_password`; chỉ áp dụng
  cho tài khoản `role = 'user'`; ghi vào nhật ký `account_events`.
- Staff cấp thêm gói / gia hạn cho bệnh nhân đã có tài khoản từ trang chi tiết bệnh nhân (cùng form thanh toán).

## Hệ quả
- ✅ Website là nơi quản trị tập trung, song song với Zalo; biết được nguồn khách (`web` / `zalo`).
- ✅ Bệnh nhân lớn tuổi nhận tài khoản sẵn, chỉ cần SĐT + mật khẩu.
- ⚠️ Mật khẩu đi qua tin nhắn Zalo → khuyến nghị đổi (hộp nhắc), staff không xem lại được mật khẩu cũ.
- ⚠️ Staff có quyền tạo đơn đã duyệt không cần ảnh → phải ghi rõ người tạo, số tiền, hình thức để đối soát; dashboard admin có
  doanh thu theo hình thức thanh toán và theo nhân viên.

## Phương án đã cân nhắc
- *Staff tự nhập mật khẩu*: dễ đặt mật khẩu yếu / trùng nhau cho mọi khách; không chọn.
- *Bắt buộc đổi mật khẩu lần đầu*: an toàn hơn nhưng gây khó cho người lớn tuổi; chủ dự án chọn "nên đổi".
- *Gửi link kích hoạt qua SMS/Zalo ZNS*: tốn phí, cần tài khoản OA; để sau.
