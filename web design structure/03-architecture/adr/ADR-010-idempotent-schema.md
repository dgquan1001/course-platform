# ADR-010: Một file `schema.sql` idempotent thay cho migrations

- **Trạng thái**: Accepted (đề xuất xem xét thay thế khi có nhiều môi trường)

## Bối cảnh
Người vận hành không chuyên kỹ thuật cần thiết lập database bằng cách dán SQL vào Supabase SQL Editor.

## Quyết định
- Toàn bộ cấu trúc nằm trong `supabase/schema.sql`, chạy lại nhiều lần an toàn:
  `create table if not exists`, `add column if not exists`, `create or replace function`,
  `drop policy if exists` + `create policy`, `on conflict do nothing`, dọn policy/cột của phiên bản cũ.
- Kết thúc bằng `notify pgrst, 'reload schema'`.

## Hệ quả
- ✅ Đơn giản, một bước, không cần CLI.
- ⚠️ Không có lịch sử phiên bản schema, khó rollback, khó biết production đang ở phiên bản nào.
- ⚠️ Thay đổi kiểu cột/đổi tên cột không thể diễn đạt idempotent dễ dàng.
- 🔜 Khi có staging/production: chuyển sang **Supabase CLI migrations** (`supabase/migrations/<timestamp>_*.sql`),
  giữ `schema.sql` làm ảnh chụp tổng hợp. Xem development-guide.md mục "Thay đổi database".
