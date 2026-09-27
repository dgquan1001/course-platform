# Architecture Decision Records (ADR)

ADR ghi lại **vì sao** một quyết định kiến trúc được đưa ra, để người sau không vô tình phá vỡ
giả định hoặc lặp lại tranh luận cũ. Mẫu: [../../templates/adr-template.md](../../templates/adr-template.md).

| ID | Tiêu đề | Trạng thái |
| --- | --- | --- |
| [ADR-001](ADR-001-nextjs-supabase.md) | Dùng Next.js App Router + Supabase | Accepted |
| [ADR-002](ADR-002-rls-authorization.md) | Phân quyền bằng Row Level Security trong database | Accepted |
| [ADR-003](ADR-003-phone-login-internal-email.md) | Đăng nhập bằng SĐT qua email nội bộ `@sdt.hv.invalid` | Accepted |
| [ADR-004](ADR-004-bank-transfer-manual-approval.md) | Thanh toán chuyển khoản + VietQR + admin duyệt thủ công | Accepted |
| [ADR-005](ADR-005-embedded-video.md) | Video nhúng từ YouTube/TikTok | Accepted |
| [ADR-006](ADR-006-server-side-registration.md) | Tạo tài khoản & đơn đăng ký ở server bằng service role | Accepted |
| [ADR-007](ADR-007-custom-reset-code.md) | Tự quản lý mã đặt lại mật khẩu 6 số qua SMTP | Accepted |
| [ADR-008](ADR-008-static-public-pages.md) | Trang công khai tĩnh (ISR), header đọc phiên ở client | Accepted |
| [ADR-009](ADR-009-client-image-compression.md) | Nén ảnh chuyển khoản ngay trên trình duyệt | Accepted |
| [ADR-010](ADR-010-idempotent-schema.md) | Một file `schema.sql` idempotent thay cho migrations | Accepted (xem xét thay thế) |
| [ADR-011](ADR-011-staff-role.md) | Ba vai trò user / staff / admin | Accepted – Đợt 7 |
| [ADR-012](ADR-012-course-kinds-and-plans.md) | Loại khóa học (miễn phí / chương trình / premium) và gói theo thời hạn cộng dồn | Accepted – Đợt 8 (loại khóa) · Đợt 9 (gói, hạn học) |
| [ADR-013](ADR-013-sessions-sequential-progress.md) | Buổi → Bài tập, mở buổi tuần tự, video đọc qua hàm kiểm quyền | Accepted – v0.2, chưa triển khai |
| [ADR-014](ADR-014-staff-provisioned-accounts.md) | Nhân viên tạo tài khoản cho bệnh nhân từ Zalo, mật khẩu hệ thống sinh | Accepted – v0.2, chưa triển khai |
| [ADR-015](ADR-015-consultation-and-leads.md) | Phiếu tham vấn bác sĩ và khách quan tâm premium | Accepted – Đợt 8 (khách quan tâm) · Đợt 12 (phiếu tham vấn) |

> ADR-002 (RLS) và ADR-004 (chuyển khoản, duyệt thủ công) vẫn giữ nguyên, được mở rộng bởi ADR-011 → ADR-015.
> ADR-006 (tạo tài khoản ở server) được mở rộng bởi ADR-014 cho luồng nhân viên tạo tài khoản.

Trạng thái hợp lệ: `Proposed` · `Accepted` · `Deprecated` · `Superseded by ADR-xxx`.
