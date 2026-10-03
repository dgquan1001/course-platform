# ADR-017: Chạy website trên Cloudflare Workers (OpenNext), giữ Supabase Free

- **Trạng thái**: Accepted – kế hoạch Đợt 17 (chưa triển khai)
- **Ngày**: 04/10/2026
- **Người quyết định**: Chủ dự án (chọn Supabase Free + Cloudflare Workers Paid vì chi phí và lợi ích lâu dài); dev đề xuất, rà soát ảnh hưởng

## Bối cảnh
- Đợt 16 chốt chạy thử trên Supabase Free + Vercel Hobby. Vercel Hobby **cấm dùng thương mại** (RK-35) – trung tâm thu tiền gói tháng
  nên phải lên Vercel Pro (20 USD/tháng / người deploy) trước ngày thu tiền đầu tiên.
- Supabase Free **không** cấm thương mại; sức chứa đủ cho giai đoạn đầu (runbook §12.1). Điểm yếu là sao lưu – đã bù bằng `backup.yml`.
- Dự án phụ thuộc sâu vào Supabase (Auth, Postgres + 44 policy RLS + 25 hàm, Storage) → **không** thay Supabase.
- Chưa có bệnh nhân thật (Đợt 14 đang ở giai đoạn 1, chưa cấu hình Vercel production) → thời điểm đổi nơi chạy ít rủi ro nhất.

## Quyết định
- Phần web (Next.js) chạy trên **Cloudflare Workers gói Paid (5 USD/tháng / tài khoản)** qua adapter mã nguồn mở `@opennextjs/cloudflare`.
- **Giữ Supabase Free** làm mặc định; chỉ nâng Pro khi chạm hạn mức (runbook §12.2), không nâng theo lịch.
- Nâng **Next.js 14 → 15** (latest minor) + React 19: OpenNext đã ngừng hỗ trợ Next 14. Không lên Next 16 ở đợt này (middleware Node / `proxy`
  chưa được OpenNext hỗ trợ đầy đủ).
- Bộ nhớ đệm trang tĩnh (ISR, `revalidatePath`): R2 (incremental cache) + D1 (tag cache) + Durable Objects (queue) – đều nằm trong hạn mức gói Paid.
- IP người dùng lấy từ `cf-connecting-ip` (Cloudflare đặt, người dùng không giả được) thay cho phần tử đầu `x-forwarded-for` (RK-43).
- Gửi email: thử SMTP Gmail qua `nodemailer` trên Workers (bước thử nghiệm 0); không chạy được → dịch vụ gửi thư qua HTTP (VD Resend).
- Tên miền quản lý DNS trên Cloudflare (gói Free của zone); `.vn` mua ở nhà đăng ký Việt Nam rồi trỏ nameserver về Cloudflare.
- Triển khai bằng **Workers Builds** (kết nối GitHub, tự build khi push `main`, có link xem trước cho nhánh).

Kế hoạch chi tiết, rà soát ảnh hưởng và checklist nghiệm thu: [cloudflare-migration.md](../../09-operations/cloudflare-migration.md).

## Hệ quả
- ✅ Hợp lệ thương mại từ đầu; chi phí giai đoạn đầu ~5 USD/tháng (Vercel Pro: 20 USD), không tính theo số người quản trị.
- ✅ Máy chủ Cloudflare tại Hà Nội / TP.HCM phục vụ tài nguyên tĩnh; Workers không khởi động nguội; Smart Placement đặt phần chạy truy vấn gần Supabase.
- ✅ Chống DDoS / WAF / Turnstile chung một chỗ; R2, Email Routing, Cron, Queues, Stream sẵn cho R-01, R-10, RK-37 sau này.
- ⚠️ Môi trường chạy là `workerd`, không phải Node đầy đủ: mọi thư viện dùng `fs`, TCP, `sharp`… phải kiểm tra; E2E phải chạy trên bản preview
  của Workers (không chỉ `next start`).
- ⚠️ Next.js trên Cloudflare kém "trơn" hơn Vercel; cấu hình bộ nhớ đệm do mình tự quản.
- ⚠️ Công chuyển đổi ~4–6 ngày dev (nâng Next 15, bộ nhớ đệm, email, IP, bộ E2E trên Workers, tài liệu).

## Phương án đã cân nhắc
- *Giữ Vercel, lên Pro trước ngày thu tiền*: không sửa code, nhưng 20 USD/tháng / người deploy, log 1 ngày, phải dùng dịch vụ ngoài cho tính năng sau.
- *Cloudflare Workers Free*: 0đ nhưng giới hạn 10 ms CPU / request và 3 MiB bản build – Next.js dễ vượt, lỗi ngẫu nhiên.
- *Chuyển hẳn sang Cloudflare (D1 + R2 + tự viết đăng nhập)*: viết lại Auth / RLS / Storage 2–4 tuần, rủi ro cao, không tiết kiệm thêm.
