# ADR-008: Trang công khai tĩnh (ISR), header đọc phiên ở client

- **Trạng thái**: Accepted

## Bối cảnh
Trang chủ nhận phần lớn traffic từ quảng cáo/mạng xã hội. Nếu layout đọc cookie để hiển thị trạng thái đăng nhập,
Next.js buộc mọi trang render động → chậm hơn, tốn tài nguyên serverless.

## Quyết định
- `/` và `/register`: `export const revalidate = 300`, dữ liệu lấy bằng `lib/supabase/public.ts` (anon, không cookie).
- `SiteHeader` và phần "đang đăng nhập" của `RegisterForm` là client component, đọc phiên bằng browser client.
- Admin sửa dữ liệu → `revalidatePath('/', 'layout')` làm mới ngay.
- Thông báo sau redirect đi qua cookie `flash` do client đọc (không làm trang động).

## Hệ quả
- ✅ Trang chủ phục vụ từ CDN, nhanh.
- ⚠️ Header có khoảnh khắc chưa biết trạng thái (`user === undefined`) → hiện vùng trống cố định `min-h-[44px]` để không nhảy layout.
- ⚠️ Không được thêm `cookies()`/`headers()` vào `app/layout.tsx` hoặc `app/page.tsx`, nếu không sẽ mất ISR.
