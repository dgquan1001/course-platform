# ADR-016: Middleware nhẹ – đọc phiên từ cookie, kiểm tra quyền ở trang (cache theo request)

- **Trạng thái**: Accepted – triển khai cùng Đợt 11 → 13 (27/09/2026)
- **Ngày**: 27/09/2026
- **Người quyết định**: Chủ dự án yêu cầu tối ưu hiệu năng, đặc biệt middleware; dev đề xuất

## Bối cảnh
Middleware chạy trước **mọi** trang `/courses/**`, `/account/**`, `/admin/**`. Trước đây mỗi lần chuyển trang nó:
1. gọi `supabase.auth.getUser()` – một lượt mạng tới Supabase Auth để xác thực token;
2. với `/admin/**`: truy vấn thêm `profiles.role`.

Sau đó layout và trang lại gọi `getCurrentUser()` (lại `getUser()` + truy vấn profile), có trang gọi 2–3 lần trong cùng request.
Header (client) và hộp nhắc đồng ý chính sách cũng tự truy vấn profile mỗi lần đổi trang. Một lần mở trang quản trị tốn
khoảng 4–6 lượt mạng chỉ để biết "ai đang đăng nhập".

## Quyết định
- **Middleware** chỉ gọi `supabase.auth.getSession()`: đọc phiên từ cookie, **không gọi mạng** (trừ khi access token hết hạn
  thì làm mới và ghi lại cookie như cũ). Không có phiên và không phải trang khóa công khai (`/courses/<uuid>/**`) → `/login?next=`.
  Middleware **không** truy vấn vai trò nữa.
- **Kiểm tra thật ở server** (`lib/auth.ts`):
  - `getCurrentUser()` bọc bằng `React.cache` → mỗi request chỉ 1 lần `getUser()` (xác thực token với Supabase) + 1 truy vấn profile,
    dùng chung cho layout, trang, `loadLearning`…
  - `requireUserPage(next)`, `requireStaffPage()`, `requireAdminPage()` dùng trong **mọi** trang cần quyền (kể cả layout `/admin`):
    phiên không hợp lệ → đăng nhập; không phải nhân viên → `/courses`; nhân viên vào trang chỉ-admin → `/admin`.
  - Server action vẫn `requireStaff()` / `requireAdmin()`; RLS vẫn là lớp cuối (ADR-002).
- **Client**: `lib/use-profile.ts` – header và `LoginReminders` dùng chung 1 bản profile, cache 60 giây theo tài khoản, gộp các
  lần đọc đồng thời; tài khoản đang cần nhắc (chưa đồng ý chính sách / nên đổi mật khẩu) luôn đọc lại để hộp nhắc tắt ngay.

## Hệ quả
- ✅ Chuyển trang trong khu vực đăng nhập: middleware ~0 lượt mạng (trước: 1–2); trang quản trị: 1 lần xác thực + 1 truy vấn profile
  (trước: 2–3 lần mỗi thứ). Header/hộp nhắc: thường 0 truy vấn khi chuyển trang (trước: 2).
- ✅ Quyền được kiểm tra bằng phiên đã xác thực ở server, không dựa vào cookie chưa kiểm chứng.
- ⚠️ Cookie giả vượt qua middleware nhưng bị chặn ở trang (`getUser()` trả null → đăng nhập) và RLS – không lộ dữ liệu.
- ⚠️ Chuyển hướng theo vai trò (VD nhân viên mở `/admin/courses`) giờ xảy ra khi trang render (phía trình duyệt, như RK-17) thay vì
  mã 307 ở middleware. Nội dung trang chỉ-admin không được render.
- ⚠️ Trang mới cần quyền **phải** gọi `requireStaffPage()` / `requireAdminPage()` (quy ước ở development-guide, source-structure).

## Phương án đã cân nhắc
- *Giữ truy vấn vai trò ở middleware*: đơn giản nhưng tốn 1 truy vấn mỗi lần chuyển trang quản trị, và trang vẫn phải kiểm tra lại.
- *Đưa vai trò vào JWT (Custom Access Token Hook của Supabase)*: middleware đọc vai trò không cần truy vấn, nhưng cần cấu hình Auth hook
  trên dashboard và vai trò chỉ cập nhật khi token làm mới; để sau nếu cần.
- *Nâng cấp `@supabase/supabase-js` để dùng `getClaims()` (xác thực JWT tại chỗ)*: tốt hơn nữa cho server, cân nhắc khi nâng cấp thư viện.
