# ADR-001: Dùng Next.js App Router + Supabase

- **Trạng thái**: Accepted – phần "triển khai trên Vercel" được thay bởi [ADR-017](ADR-017-cloudflare-workers.md) (Cloudflare Workers, 04/10/2026)
- **Ngày**: phiên bản 0.1.0

## Bối cảnh
Cần một website vừa làm landing page (SEO tốt), vừa có đăng nhập, phân quyền, upload file, trang quản trị;
đội phát triển nhỏ, ngân sách thấp, triển khai nhanh.

## Quyết định
- **Next.js App Router** (Server Components + Server Actions) – bản đầu Next 14 trên **Vercel**; từ Đợt 17: Next 15 trên **Cloudflare Workers** (ADR-017).
- **Supabase** cung cấp Auth, Postgres, Storage; không tự viết backend riêng.
- **Tailwind CSS** cho giao diện, không dùng thư viện component.

## Hệ quả
- ✅ Một codebase duy nhất cho frontend + backend; SEO tốt nhờ SSR/ISR.
- ✅ Gói miễn phí đủ cho quy mô hiện tại; không phải quản lý server.
- ✅ Server Actions giảm boilerplate API (không cần viết REST cho form).
- ⚠️ Phụ thuộc nhà cung cấp (Cloudflare / OpenNext, Supabase). Có thể tự host Next.js (Node) và Supabase (self-host) nếu cần.
- ⚠️ Server Actions mặc định giới hạn body 1MB → đã nâng lên 6MB trong `next.config.mjs`.
- ✅ Đợt 17 (04/10/2026): đã nâng **Next.js 15 / React 19** – `await cookies()` / `headers()` / `params`, `useActionState`, `createClient()` phía server là hàm async.

## Phương án đã cân nhắc
- *WordPress + LearnDash*: nhanh nhưng khó tùy biến luồng đăng ký bằng SĐT/duyệt thủ công, chi phí plugin.
- *Firebase*: không có Postgres/RLS kiểu SQL, truy vấn quan hệ kém hơn.
