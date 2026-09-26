# ADR-001: Dùng Next.js App Router + Supabase

- **Trạng thái**: Accepted
- **Ngày**: phiên bản 0.1.0

## Bối cảnh
Cần một website vừa làm landing page (SEO tốt), vừa có đăng nhập, phân quyền, upload file, trang quản trị;
đội phát triển nhỏ, ngân sách thấp, triển khai nhanh.

## Quyết định
- **Next.js 14 App Router** (Server Components + Server Actions) triển khai trên **Vercel**.
- **Supabase** cung cấp Auth, Postgres, Storage; không tự viết backend riêng.
- **Tailwind CSS** cho giao diện, không dùng thư viện component.

## Hệ quả
- ✅ Một codebase duy nhất cho frontend + backend; SEO tốt nhờ SSR/ISR.
- ✅ Gói miễn phí đủ cho quy mô hiện tại; không phải quản lý server.
- ✅ Server Actions giảm boilerplate API (không cần viết REST cho form).
- ⚠️ Phụ thuộc nhà cung cấp (Vercel, Supabase). Có thể tự host Next.js (Node) và Supabase (self-host) nếu cần.
- ⚠️ Server Actions mặc định giới hạn body 1MB → đã nâng lên 6MB trong `next.config.mjs`.
- ⚠️ Next 14 dùng `cookies()` đồng bộ, `useFormState`; khi nâng lên Next 15 cần chuyển sang `await cookies()` và `useActionState`.

## Phương án đã cân nhắc
- *WordPress + LearnDash*: nhanh nhưng khó tùy biến luồng đăng ký bằng SĐT/duyệt thủ công, chi phí plugin.
- *Firebase*: không có Postgres/RLS kiểu SQL, truy vấn quan hệ kém hơn.
