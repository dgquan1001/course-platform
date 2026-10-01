# Lộ trình (Roadmap)

> **Cách dùng file này**
> - Đọc nhanh: **§0 Tóm tắt** (1 màn hình) → **§2 Việc chủ dự án cần làm** → **§3 Kế hoạch tiếp theo**.
> - Chi tiết từng đợt: **§4 Checklist theo đợt** (mới nhất ở trên). Danh mục mã RV / RK / R / G: **§5**.
> - Cách cập nhật khi xong một đợt: xem **§7 Quy ước** (thêm 1 dòng §1, 1 khối §4, tick §5, cập nhật project-review).
>
> Mã: **RV-xx** review vòng 1, **RK-xx** risk case ([project-review.md](project-review.md)); **R-xx** tính năng mở rộng (thiết kế ở §6);
> **G-xx** khoảng trống kiểm thử ([test-plan](../08-testing/test-plan.md)); **A-xx** việc chủ dự án; **V-xx** yêu cầu v0.2
> ([project-overview §9](../00-overview/project-overview.md#9-định-vị-lại--phiên-bản-02-chốt-27092026)); **UI-xx** yêu cầu giao diện
> sau v0.2 (§3.0).

Cập nhật: **02/10/2026** – **Đợt 16 – Hạ tầng gói Free ✅** (§3.3): chủ dự án chốt chạy thử trên Supabase Free + Vercel Hobby, chuyển gói
theo ngưỡng; vùng server Singapore; 2 workflow giữ Supabase hoạt động + sao lưu hằng tuần **đã chạy thử thành công** (A-14 ✅).
**Đợt 14 viết lại thành kế hoạch chạy thử (pilot) 7 giai đoạn** – theo dõi ở §3.1, cách làm từng bước ở runbook §10.
29/09/2026: xong Đợt 15 – Cải tiến giao diện (UI-01 → UI-03) · E2E 98/98. 27/09/2026: xong Đợt 11, 12, 13 → **toàn bộ v0.2 đã có code + E2E**.

## 0. Tóm tắt hiện trạng

| Hạng mục | Trạng thái |
| --- | --- |
| Phiên bản | **v0.2 hoàn tất code** (Đợt 7 → 13): vai trò nhân viên, khóa miễn phí / chương trình / premium, gói tháng + hạn học, buổi – bài + tiến độ, bệnh nhân từ Zalo, phiếu tham vấn, dashboard |
| Kiểm thử | E2E **98/98 PASS** (29/09/2026, sau Đợt 15, chạy trên project Supabase hiện tại – dữ liệu test) |
| Hiệu năng | Middleware nhẹ (không gọi mạng khi token còn hạn), xác thực 1 lần / request, header + hộp nhắc dùng chung profile (ADR-016) |
| Hạ tầng | **Chạy thử trên gói Free** (Supabase Free + Vercel Hobby, vùng `sin1`); keepalive + sao lưu tuần ✅ đang chạy (02/10); chuyển gói theo ngưỡng ở §3.3 / runbook §12 |
| Việc tiếp theo | **Đợt 14 – Chạy thử MVP (pilot)** (§3.1): giai đoạn 1 hạ tầng & cấu hình → 2 dữ liệu sạch → 3 nội dung → 4 nhân viên → 5 nghiệm thu → 6 chạy thử ~4 tuần → 7 đánh giá. Việc dev: script dọn dữ liệu test (bước 2.1), hỗ trợ nghiệm thu |
| Rủi ro còn mở cần chú ý | RK-20 (nội dung chính sách chưa duyệt), RK-10 (chưa có staging – đề xuất làm trước chạy thử, bước 2.5), RK-33 (chưa có thông báo khi có phiếu / lead mới – nhân viên mở Tổng quan đầu ca), RK-35 (Vercel Hobby phi thương mại – chấp nhận khi thử nghiệm), RK-37 (Storage Free 1 GB) |

## 1. Báo cáo tiến độ

### 1.1. Theo đợt

| Đợt | Nội dung | Hạng mục | Trạng thái | Hoàn thành | Kiểm thử | E2E |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sửa lỗi review vòng 1 | RV-01, 02, 05, 09, 10 (git) | ✅ | 26/09/2026 (`0f6cfef`, `05b16c5`) | TC-01 → 46 | 46/46 |
| 2 | Risk case vòng 2 + người xử lý | RK-01, 03, 05, 07, 09, RV-11 | ✅ | 26/09/2026 | TC-47 → 54 | 53/53 |
| 3 | Nhiều admin | RK-11 → 14, R-05 | ✅ | 26/09/2026 | TC-55 → 58 | 57/57 |
| 4 | Vận hành an toàn | RK-10 (rào chặn), CI, RV-13, RV-03 | ✅ (staging chờ A-1) | 26/09/2026 | TC-59 | 63/63 |
| 5 | Chống lạm dụng & dữ liệu | RK-06/RV-04, RK-08, RK-04, RV-16 | ✅ (Turnstile chờ A-4) | 26/09/2026 | TC-60 → 64 | 63/63 |
| — | Định vị lại v0.2 (tài liệu) | V-01 → V-12, ADR-011 → 015 | ✅ | 27/09/2026 | — | — |
| 6 | Hạ tầng (song song) | A-1 → A-5 | ⏸ Chủ dự án để sau (ưu tiên MVP) | — | — | — |
| 7 | Vai trò nhân viên | R-12 | ✅ | 27/09/2026 (`c3d08a5`) | TC-65 → 67 | 67/67 |
| 8 | Danh mục khóa, premium, chính sách | R-03, RV-17 | ✅ (nội dung chờ A-7) | 27/09/2026 (`1251587`) | TC-68 → 73 | 73/73 |
| 9 | Gói tháng & hạn học | RK-22 | ✅ | 27/09/2026 (`b46f232`, `da23361`) | TC-74 → 78 | 78/78 |
| 10 | Buổi – bài, trình học, tiến độ | R-04, R-09, RK-27, RK-28 | ✅ | 27/09/2026 (`c713566` → `2f41289`) | TC-79 → 84 | 83/83 |
| 11 | Bệnh nhân từ Zalo | R-02, RK-16 (cấp bù), RK-34 | ✅ | 27/09/2026 (`b25430e`) | TC-85 → 88, TC-96 | 96/96 (chạy chung 11 → 13) |
| 12 | Phiếu tham vấn | RK-29 | ✅ | 27/09/2026 | TC-89 → 92 | ↑ |
| 13 | Dashboard | R-07 (doanh thu trên dashboard) | ✅ | 27/09/2026 | TC-93 → 94 | ↑ |
| + | Khóa học theo loại, RK-18, hiệu năng (ADR-016) | RK-18 | ✅ | 27/09/2026 | TC-95, TC-97, TC-98 | ↑ |
| 14 | **Chạy thử MVP (pilot)** – 7 giai đoạn (§3.1) | A-1, A-4 → A-12, A-15, A-17, V-12 | 🟡 **Đang làm** – giai đoạn 1 (bước 1.1 ✅) | — | Nghiệm thu runbook §10 giai đoạn 5 | — |
| 15 | **Cải tiến giao diện** (yêu cầu 29/09) | UI-01 → UI-03 | ✅ | 29/09/2026 (`c17f476`) | TC-99 → TC-101 | 98/98 |
| 16 | **Hạ tầng gói Free** (đánh giá + lộ trình chuyển gói) | RK-35 → RK-42, RV-20 (một phần) | ✅ | 02/10/2026 (`9e1e7b0`, sửa Node 22 `aea7eb1`) | 2 workflow chạy thật trên GitHub ✅ (A-14) | — (không đổi giao diện) |

### 1.2. Tổng hợp theo nguồn

| Nguồn | Tổng | ✅ Xong | 🟡 Một phần / chấp nhận có theo dõi | ⬜ Chưa làm |
| --- | --- | --- | --- | --- |
| RV (review vòng 1) | 20 | 10 | 4 (RV-10, RV-12, RV-17, RV-20) | 6 |
| RK vòng 2–3 (RK-01 → 15) | 15 | 12 | 1 (RK-10) | 2 (RK-02, RK-15) |
| RK v0.2 (RK-16 → 34) | 19 | 7 (RK-16, 18, 22, 27, 28, 29, 34) | 10 chấp nhận / theo dõi (RK-17, 19, 21, 23, 24, 25, 26, 30, 31, 32) | 2 (RK-20 chờ A-7, RK-33) |
| RK hạ tầng (RK-35 → 42) | 8 | 2 (RK-36, RK-38 chờ A-15) | 3 chấp nhận / theo dõi (RK-35, 37, 42) | 3 (RK-39, 40, 41 – giai đoạn 2) |
| R (tính năng mở rộng, gồm R-00) | 14 | 7 (R-00, 02, 03, 04, 05, 09, 12) | 1 (R-07) | 6 |
| G (khoảng trống kiểm thử) | 12 | 2 | 4 | 6 |
| UI (yêu cầu giao diện 29/09) | 3 | 3 | 0 | 0 |

## 2. Việc cần chủ dự án làm (không tự động hóa được)

Sắp theo thứ tự làm trong kế hoạch chạy thử (cột "Bước" ↔ runbook §10).

| # | Việc | Liên quan | Bước (§3.1) | Trạng thái |
| --- | --- | --- | --- | --- |
| A-14 | Cấu hình GitHub secrets / variables cho sao lưu + giữ hoạt động (runbook §7.1), merge `main`, chạy tay lần đầu, lưu `BACKUP_PASSPHRASE` | RK-36, RV-20 | 1.1 | ✅ 02/10/2026 |
| A-15 | Xác nhận project Supabase ở vùng **Singapore**; nếu khác, báo dev đổi `vercel.json` | RK-38 | 1.2 | ⬜ |
| A-12 | Vercel production (Node 22, biến môi trường), domain / `NEXT_PUBLIC_SITE_URL`, Supabase Site URL, SMTP Gmail trung tâm | — | 1.3 → 1.6 | ⬜ |
| A-4 | Cloudflare Turnstile (2 biến trên Vercel) | RK-06 | 1.7 | ⬜ tùy chọn khi chạy thử, bắt buộc trước quảng bá |
| A-11 | Xác nhận & chạy **dọn dữ liệu test** (script dev chuẩn bị, sao lưu trước) | V-12, FR-190 | 2.1 → 2.3 | ⬜ chờ dev viết script |
| A-5 | `supabase/schema.sql` mới nhất trên production | Tất cả | 2.4 | 🟡 đã chạy trên project này (cùng là production) – kiểm tra lần chạy gần nhất sau Đợt 13 |
| A-1 | Project Supabase **staging** cho E2E (runbook §1.1) | RK-10, G-12 | 2.5 | ⬜ **đề xuất đưa lên trước chạy thử** (Free cho 2 project; sau khi dọn dữ liệu không chạy E2E trên production được nữa) |
| A-6 | Xác nhận hotline, Zalo, **email liên hệ** (hiện Gmail cá nhân), tài khoản ngân hàng trong `site-config.ts` | RV-19 | 3.1 | ⬜ |
| A-7 | Duyệt nội dung **Chính sách bảo mật** | RV-17, RK-20 | 3.2 | 🟡 dev đã soạn |
| A-8 | Nhập nội dung thật: khóa miễn phí, 2 chương trình (gói 1/3/6/12 tháng, buổi – bài, video), 3 khóa premium | Đợt 8 → 10 | 3.3 → 3.5 | ⬜ |
| A-10 | Duyệt / sửa câu hỏi mẫu phiếu tham vấn | Đợt 12 | 3.6 | ⬜ |
| A-9 | Tài khoản nhân viên, cấp vai trò `staff`; hướng dẫn nhân viên; mẫu tin nhắn Zalo; phân công | Đợt 7 | 4.1 → 4.4 | ⬜ |
| A-17 | Chốt nhóm chạy thử: số người, nhóm bệnh, thời gian, giá / ưu đãi | — | 6.1 | ⬜ |
| A-16 | Mỗi tháng ghi Usage (Supabase, Vercel) vào runbook §12.2 | RK-35, 37 | 6.5 | ⬜ hằng tháng |
| A-13 | Supabase **Pro** trước, rồi Vercel Pro | RV-20, RK-35 → 37 | 7 (khi đạt ngưỡng §3.3) | ⏸ |
| A-2, A-3 | Secrets GitHub cho CI E2E trên staging, bật "Require status checks" | RV-10 | Sau A-1 | ⏸ |

## 3. Kế hoạch tiếp theo

### 3.0. Đợt 15 – Cải tiến giao diện (yêu cầu chủ dự án 29/09/2026) – ✅ xong 29/09/2026 (E2E 98/98)

Không đổi schema (chủ dự án **không** cần chạy SQL); làm song song được với Đợt 14. Ước lượng tổng: S.

**Chủ dự án đã chốt (29/09/2026):**
1. UI-01: icon mắt ở **tất cả 7 ô mật khẩu** (đăng nhập, đăng ký, quên mật khẩu ×2, tài khoản ×3).
2. UI-02 trên màn hình < 1024px: giữ **hàng tab cuộn ngang** (theo thứ tự mới); ≥ 1024px: cột dọc bên trái.
3. UI-02: **có số đếm** cạnh mục Đơn đăng ký (đơn chờ duyệt), Phiếu tham vấn (phiếu mới), Khách quan tâm (khách mới) – 3 truy vấn
   `count` chạy song song trong `app/admin/layout.tsx` (quyền theo RLS nhân viên), **không** gọi `dashboard_stats()` để tránh RK-30.
4. UI-03: vòng tròn **thay tất cả** 5 chỗ đang dùng `ProgressBar` + cột % ở danh sách bệnh nhân; bỏ `ProgressBar`.

| Mã | Yêu cầu | Hiện trạng (review 29/09) | Kế hoạch | Công sức |
| --- | --- | --- | --- | --- |
| UI-01 | Ô mật khẩu có **icon con mắt** để hiện / ẩn mật khẩu | 7 ô `type="password"` thuần: đăng nhập (1), đăng ký (1), quên mật khẩu (2), tài khoản (3); chưa có nút hiện mật khẩu | Component mới `components/PasswordInput.tsx` (client): ô nhập + nút mắt bên phải (`type="button"`, `aria-label` "Hiện mật khẩu" / "Ẩn mật khẩu", `aria-pressed`, vùng chạm 44px); thêm `EyeIcon`, `EyeOffIcon` vào `components/icons.tsx`; dùng cho các ô trên (phạm vi chờ chốt) | XS |
| UI-02 | Menu quản trị chuyển sang **cột dọc bên trái**, thứ tự mới: Tổng quan · Đơn đăng ký · Bệnh nhân · **Khóa học** · Phiếu tham vấn · Khách quan tâm · Mẫu phiếu | `AdminNav` là hàng tab gạch chân nằm ngang dưới tiêu đề "Bảng quản trị"; Khóa học đứng thứ 6 | `app/admin/layout.tsx` thành 2 cột từ màn hình `lg` (≥ 1024px): sidebar ~220px, dính khi cuộn (`sticky`), mỗi mục có icon + nhãn, mục đang mở tô nền `ocean-50` + vạch trái; nội dung bên phải. Giữ `nav aria-label="Menu quản trị"`, quy tắc `adminOnly` (nhân viên thấy 5 mục: Tổng quan, Đơn đăng ký, Bệnh nhân, Phiếu tham vấn, Khách quan tâm). Màn hình nhỏ: chờ chốt. Tùy chọn: số đếm (đơn chờ / phiếu mới / khách mới) cạnh mục như thiết kế [sitemap §6.3](../06-ui-ux/sitemap-navigation.md) | S |
| UI-03 | Tiến độ hiển thị bằng **vòng tròn %** | `ProgressBar` (thanh 6px + chữ "x/y bài · %") dùng ở 5 chỗ: Khóa học của tôi, trang khóa, trình học, Tổng quan (không tập > 7 ngày), hồ sơ bệnh nhân; danh sách bệnh nhân chỉ ghi "%" | Component `components/ProgressRing.tsx` (SVG): vòng nền `slate-100`, cung `ocean-500` (100% → `emerald-500`), số % ở giữa, bên cạnh "x/y bài hoàn thành"; 2 cỡ: `md` ~56px (thẻ khóa, trang khóa, hồ sơ) và `sm` ~36px (trình học, danh sách admin); giữ `role="progressbar"` + `aria-valuenow`; chuyển động tắt khi `prefers-reduced-motion`. Phạm vi thay chờ chốt | S |

Kiểm thử dự kiến (E2E): **TC-99** bấm mắt ở trang đăng nhập → ô thành `text`, bấm lại → `password`, vẫn đăng nhập được;
**TC-100** admin thấy menu dọc đúng 7 mục theo thứ tự mới, nhân viên thấy 5 mục; **TC-101** vòng tiến độ 0% → 50% → 100% (thay các bước
đang kiểm tra chữ "x/y bài · %" ở TC-81, TC-84). Chạy lại toàn bộ E2E (96 bước) vì đổi bố cục admin.

Tài liệu cập nhật khi xong: design-system (§8 component), screen-specifications (đăng nhập, khung admin), sitemap-navigation §4, §6.3,
source-structure, SRS (FR mới cho UI-01 → 03), test-plan, README gốc, project-review, roadmap, lịch sử tài liệu.

### 3.1. Đợt 14 – Chạy thử MVP (pilot) – kế hoạch từng bước

**Mục tiêu**: chạy thật với nội dung thật cho một nhóm nhỏ bệnh nhân (đề xuất 10–30 người, ~4 tuần – chủ dự án chốt ở bước 6.1) để đo hiệu quả
trước khi tốn chi phí hạ tầng / quảng bá. Hạ tầng: gói Free (§3.3). **Cách làm chi tiết từng bước, tiêu chí "xong khi"**:
[runbook §10](../09-operations/deployment-runbook.md#10-chạy-thử-mvp-pilot--hướng-dẫn-từng-bước-roadmap-đợt-14).

**Cách theo dõi**: làm xong bước nào đổi ⬜ → ✅ và ghi ngày ở cột "Trạng thái"; vướng thì ghi 🟡 + lý do. Giai đoạn sau chỉ bắt đầu khi
giai đoạn trước xong (trừ giai đoạn 3 – nội dung, có thể nhập song song với giai đoạn 1).

| Bước | Việc | Ai | Mã | Trạng thái |
| --- | --- | --- | --- | --- |
| **1** | **Hạ tầng & cấu hình** (~1 buổi) | | | |
| 1.1 | Sao lưu + giữ Supabase hoạt động trên GitHub | Chủ dự án | A-14 | ✅ 02/10/2026 |
| 1.2 | Xác nhận vùng Supabase = Singapore | Chủ dự án | A-15 | ⬜ |
| 1.3 | Vercel production: nhánh `main`, Node 22.x, biến môi trường, vùng sin1 | Chủ dự án | A-12 | ⬜ |
| 1.4 | Tên miền (tạm `*.vercel.app` hoặc domain riêng) → `NEXT_PUBLIC_SITE_URL` | Chủ dự án | A-12 | ⬜ |
| 1.5 | Supabase Auth: Site URL, tắt Confirm email, mật khẩu ≥ 8 | Chủ dự án | A-12 | ⬜ |
| 1.6 | SMTP Gmail trung tâm, thử quên mật khẩu | Chủ dự án | A-12 | ⬜ |
| 1.7 | Turnstile (tùy chọn khi chạy thử) | Chủ dự án | A-4 | ⬜ |
| **2** | **Dữ liệu sạch** | | | |
| 2.1 | Script dọn dữ liệu test (xem trước + xóa, giữ admin & mẫu phiếu) | **Dev** | A-11 | ⬜ |
| 2.2 | Sao lưu thủ công ngay trước khi xóa | Chủ dự án | — | ⬜ |
| 2.3 | Chạy xem trước → xác nhận → xóa; dọn ảnh test trong Storage | Chủ dự án | A-11, V-12 | ⬜ |
| 2.4 | Schema mới nhất | Chủ dự án | A-5 | 🟡 kiểm tra |
| 2.5 | Project staging cho E2E (đề xuất) | Chủ dự án + dev | A-1 | ⬜ |
| **3** | **Nội dung** (có thể làm song song giai đoạn 1) | | | |
| 3.1 | Thông tin trung tâm, email chính thức, tài khoản ngân hàng / QR | Chủ dự án (dev sửa nếu cần) | A-6 | ⬜ |
| 3.2 | Duyệt chính sách bảo mật | Chủ trung tâm | A-7 | ⬜ |
| 3.3 | Khóa miễn phí (video Unlisted) | Admin | A-8 | ⬜ |
| 3.4 | 2 chương trình: gói 1/3/6/12 tháng, buổi × bài, video | Admin | A-8 | ⬜ |
| 3.5 | 3 khóa premium | Admin | A-8 | ⬜ |
| 3.6 | Mẫu phiếu tham vấn | Bác sĩ / admin | A-10 | ⬜ |
| **4** | **Nhân viên & quy trình** | | | |
| 4.1 | Tài khoản nhân viên, vai trò `staff` | Admin | A-9 | ⬜ |
| 4.2 | Hướng dẫn nhân viên (~30 phút, làm thử trên tài khoản test) | Chủ dự án | A-9 | ⬜ |
| 4.3 | Mẫu tin nhắn Zalo (mời, gửi tài khoản, nhắc tập, nhắc gia hạn) | Chủ dự án | — | ⬜ |
| 4.4 | Phân công: mở Tổng quan đầu ca, đối soát tiền, liên hệ dev | Chủ dự án | — | ⬜ |
| **5** | **Nghiệm thu** (~1 giờ, iPhone + Android + máy tính; checklist runbook §10 giai đoạn 5) | Dev + chủ dự án | — | ⬜ |
| **6** | **Chạy thử** | | | |
| 6.1 | Chốt nhóm: số người ___, nhóm bệnh ___, từ ___ đến ___, giá / ưu đãi ___ | Chủ dự án | A-17 | ⬜ |
| 6.2 | Tuần 1 mời 5–10 người → sửa lỗi → mời thêm | Chủ dự án | — | ⬜ |
| 6.3 – 6.6 | Hằng ngày Tổng quan · hằng tuần đối soát + kiểm tra sao lưu + nhật ký · hằng tháng Usage (A-16) | Nhân viên / admin | A-16 | ⬜ |
| **7** | **Đánh giá & quyết định** (chỉ số ở runbook §10 giai đoạn 7): mở rộng → A-13 + Turnstile + quảng bá / điều chỉnh backlog §3.2 / dừng | Chủ dự án | A-13 | ⬜ |

**Trong lúc chạy thử – dev hỗ trợ**: sửa lỗi phát sinh từ nhật ký (runbook §10.1). Nếu nhân viên bỏ sót phiếu tham vấn / đơn chờ
vì phải tự mở Tổng quan, đưa **R-01 thông báo** (backlog 1) lên làm ngay trong đợt chạy thử.

### 3.2. Sau MVP – backlog ưu tiên (chủ dự án sắp lại khi có số liệu thật)

| Ưu tiên | Mã | Hạng mục | Vì sao | Công sức |
| --- | --- | --- | --- | --- |
| 1 | RK-33 / R-01 | Thông báo cho nhân viên khi có đơn / phiếu / lead mới (email hoặc Zalo OA) và cho bệnh nhân khi đơn được duyệt | Không phải mở dashboard liên tục; có thể kéo vào đợt chạy thử nếu bỏ sót phiếu | S – M |
| 2 | RV-20 | Giám sát lỗi (Sentry / Vercel logs). Backup DB + Storage ✅ Đợt 16 (đang chạy) | Vận hành thật | XS |
| 2b | RK-39 → 41, RV-12 | Chuẩn bị giai đoạn 2 (§3.3): phân trang danh sách admin, nới giới hạn đăng nhập theo IP, giới hạn Supabase Auth | Trước khi > 200 bệnh nhân / > 100 người cùng lúc | S |
| 3 | A-1, A-2, A-3 | Staging + CI E2E (A-1 đề xuất làm ngay ở bước 2.5) | Thay đổi schema an toàn; sau khi dọn dữ liệu không chạy E2E trên production | S |
| 4 | RV-12 + R-06 | Phân trang, lọc, xuất Excel đơn / bệnh nhân / doanh thu | Khi > 200 đơn / bệnh nhân | S |
| 5 | — | Trình học điện thoại tách 2 tab "Bài này / Nội dung" | Chủ dự án chốt để sau (27/09) | S |
| 6 | RK-02 | Xác minh email khi đăng ký / đổi email | Tránh giữ chỗ email người khác | M |
| 7 | R-08 | Xác nhận chuyển khoản tự động (webhook ngân hàng) | Giảm việc duyệt tay | L |
| 8 | R-10 | Video riêng tư (chống chia sẻ link) | Bảo vệ nội dung trả phí | L |
| — | RV-06, RV-08, RV-14, RV-15, R-11, R-13, RK-23 | Cải tiến nhỏ, cấu hình trên giao diện, mã giảm giá, khóa cho đội chuyên gia | Theo nhu cầu | — |

### 3.3. Lộ trình hạ tầng & chuyển gói (chủ dự án chốt 02/10/2026)

Giai đoạn thử nghiệm (vài chục người cùng lúc) chạy **gói Free**; chuyển gói khi gặp **một** dấu hiệu ở cột "Chuyển khi".
Phân tích tải: [project-review §7.8](project-review.md#78-đánh-giá-hạ-tầng--quy-mô-500-người-học-cùng-lúc-02102026);
sức chứa gói Free, bảng theo dõi hằng tháng: [runbook §12](../09-operations/deployment-runbook.md#12-giai-đoạn-thử-nghiệm-trên-gói-free--lộ-trình-chuyển-gói-chốt-02102026).

| Giai đoạn | Chuyển khi | Hạ tầng | Việc dev | Chi phí / tháng |
| --- | --- | --- | --- | --- |
| **0. Thử nghiệm** ← hiện tại | — | Supabase Free + Vercel Hobby `sin1`, keepalive, backup tuần (đang chạy từ 02/10) | ✅ Đợt 16 | 0đ |
| **1. Kinh doanh** | ≥ ~30 bệnh nhân trả phí / thu tiền đều · chạy quảng cáo · Storage > 600 MB · Vercel CPU > 70% · egress > 3,5 GB | **Supabase Pro trước**, Vercel Pro (A-13) | Không cần | ~45 USD |
| **2. Mở rộng** | > 200 bệnh nhân · > 100 người cùng lúc · trang chậm > 1 giây giờ cao điểm | Như 1 | RV-12 phân trang, RK-39, RK-40, Sentry (backlog 2b) | ~45 USD |
| **3. Mục tiêu** (300–500 cùng lúc, ~1.000 bệnh nhân) | CPU database > 60% giờ cao điểm | + Supabase compute Small, staging (A-1) | Chạy thử tải (k6) trên staging | ~60–80 USD |

## 4. Checklist chi tiết theo đợt (mới nhất ở trên)

Làm xong đợt nào tick đợt đó. Mục **"Để lại / đề xuất"** là căn cứ để chủ dự án sắp xếp lại các đợt sau.

#### Đợt 14 – Chạy thử MVP (pilot) 🟡 (bắt đầu 02/10/2026)
- [x] Kế hoạch 7 giai đoạn (§3.1) + hướng dẫn từng bước (runbook §10), nhật ký chạy thử (runbook §10.1)
- [x] Giai đoạn 1: [x] 1.1 sao lưu + keepalive · [ ] 1.2 vùng Supabase · [ ] 1.3 Vercel · [ ] 1.4 tên miền · [ ] 1.5 Supabase Auth · [ ] 1.6 SMTP · [ ] 1.7 Turnstile (tùy chọn)
- [ ] Giai đoạn 2: [ ] 2.1 script dọn dữ liệu (dev) · [ ] 2.2 sao lưu · [ ] 2.3 dọn · [ ] 2.4 schema · [ ] 2.5 staging
- [ ] Giai đoạn 3: [ ] 3.1 thông tin trung tâm · [ ] 3.2 chính sách · [ ] 3.3 khóa miễn phí · [ ] 3.4 chương trình · [ ] 3.5 premium · [ ] 3.6 mẫu phiếu
- [ ] Giai đoạn 4: [ ] 4.1 nhân viên · [ ] 4.2 hướng dẫn · [ ] 4.3 tin nhắn Zalo · [ ] 4.4 phân công
- [ ] Giai đoạn 5 nghiệm thu · [ ] Giai đoạn 6 chạy thử · [ ] Giai đoạn 7 đánh giá → ghi kết quả vào project-review
- Để lại / đề xuất: A-1 staging đưa lên trước chạy thử; R-01 thông báo kéo vào nếu bỏ sót phiếu / đơn

#### Đợt 16 – Hạ tầng gói Free ✅ (02/10/2026)
- [x] Đánh giá hạ tầng cho 100–500 người cùng lúc / 1.000 bệnh nhân → RK-35 → RK-42 (project-review §7.8)
- [x] Chủ dự án chốt: thử nghiệm trên gói Free, chuyển gói theo ngưỡng (§3.3)
- [x] `vercel.json`: vùng server `sin1` (Singapore) – RK-38
- [x] `.github/workflows/keepalive.yml`: mỗi 3 ngày đọc danh sách khóa → Supabase Free không bị tạm dừng – RK-36
- [x] `.github/workflows/backup.yml`: database hằng tuần (Supabase CLI), ảnh Storage tuần đầu mỗi tháng, mã hóa AES-256, artifact 90 ngày – RK-36, RV-20
- [x] `scripts/backup-storage.mjs` (`npm run backup:storage`): chạy thử trên project hiện tại – tải đủ 4 file / 2 bucket, giữ cấu trúc thư mục
- [x] typecheck / lint · [x] tài liệu (runbook §7.1, §12; project-review §7.8; README)
- [x] Sửa workflow dùng Node 22 (`supabase-js` 2.117 cần Node 22+), `engines.node >= 22` (`aea7eb1`)
- [x] A-14 chủ dự án cấu hình secrets + merge `main` + chạy thử 2 workflow (02/10/2026) · [ ] A-15 xác nhận vùng Supabase (→ Đợt 14 bước 1.2)
- Để lại / đề xuất: RK-39 → 41 làm ở giai đoạn 2 hạ tầng; thử khôi phục bản sao lưu vào một project trống (có thể dùng chính project staging ở bước 2.5)

#### Đợt 15 – Cải tiến giao diện ✅ (29/09/2026 · E2E 98/98)
- [x] Chủ dự án chốt: 7 ô mật khẩu, tab cuộn ngang trên điện thoại, có số đếm trên menu, vòng tiến độ thay tất cả (§3.0)
- [x] UI-01 `PasswordInput` + icon mắt · [x] áp dụng 7 ô mật khẩu
- [x] UI-02 sidebar quản trị bên trái, thứ tự mới · [x] tab cuộn ngang < 1024px · [x] số đếm đơn chờ / phiếu mới / khách mới (`NavCount`, stream qua Suspense)
- [x] Trang admin 2 cột (nội dung + form) chia cột từ `xl` thay vì `lg` để không chật cạnh sidebar
- [x] UI-03 `ProgressRing` · [x] thay 5 chỗ + cột % danh sách bệnh nhân · [x] xóa `ProgressBar`
- [x] typecheck / lint / build · [x] E2E TC-99 → TC-101 + chạy lại toàn bộ (98/98) · [x] tài liệu (SRS FR-191 → 193, design-system, screen-specs, sitemap, source-structure, user-stories, test-plan)
- Để lại / đề xuất: "Tiến độ theo chương trình" ở Tổng quan giữ thanh ngang (so sánh nhiều chương trình – thanh dễ so hơn vòng tròn); số đếm trên menu chỉ làm mới khi tải trang / sau thao tác (không tự cập nhật theo thời gian thực – RK-33 vẫn mở)

#### Đợt 11 → 13 + cải tiến (làm song song) ✅ (27/09/2026 · E2E 96/96)
**Đợt 11 – Bệnh nhân từ Zalo**
- [x] Schema: `profiles.source / created_by / must_change_password`, `account_events`, `patient_notes` (ghi chú nội bộ tách khỏi profiles), policy `registrations_staff_insert`, trigger `registrations_stamp_insert` + `registrations_log_insert`
- [x] `/admin/patients` (lọc nguồn, trạng thái gói, mới 7/30 ngày, không tập > 7 ngày; % tiến độ; tab Nhân viên & Admin cho admin), `/admin/users` tự chuyển
- [x] `/admin/patients/new`: mật khẩu tự sinh hiện 1 lần + "Chép tin nhắn gửi Zalo"; cấp gói ngay (số tiền, hình thức, ảnh tùy chọn)
- [x] `/admin/patients/[id]`: gói & tiến độ, lịch sử đơn, phiếu, nhật ký; cấp gói / gia hạn (cấp bù RK-16), sửa thông tin + ghi chú, cấp lại mật khẩu (R-02)
- [x] Hộp nhắc đổi mật khẩu (`LoginReminders`), đổi mật khẩu tắt cờ
- [x] Chặn qua API: đơn web / đơn chờ / gói chương trình khác / tự cấp cho tài khoản nhân viên (RK-34)

**Đợt 12 – Phiếu tham vấn**
- [x] `consult_questions` (seed 6 câu), `consultations` + trigger + RLS, `my_consultations()`
- [x] Form phiếu (chọn sẵn chương trình), nút ở trình học / Khóa học của tôi / thẻ chúc mừng / thẻ khóa còn ≤ 7 ngày; "Phiếu tham vấn của tôi"; 5 phiếu / ngày
- [x] `/admin/consultations` (không ghi đè), `/admin/settings/consultation` (thêm / sửa / bật tắt / ↑↓ / xóa)
- [x] Sửa RK-29 (trigger `stamp_lead` chặn xóa khóa premium / tài khoản có lead)

**Đợt 13 – Dashboard**
- [x] `dashboard_stats()`, `revenue_report()` (chỉ admin), hàm nội bộ `_patient_courses()` dùng chung
- [x] `/admin` Tổng quan: 8 thẻ chỉ số bấm được, việc cần làm, tiến độ theo chương trình, không tập > 7 ngày, doanh thu tháng này / tháng trước theo 4 chiều

**Cải tiến theo yêu cầu 27/09**
- [x] `/admin/courses` chia theo loại (Tất cả · Chương trình · Miễn phí · Premium), form thêm khóa chọn sẵn loại
- [x] RK-18: sửa chương trình không còn ô Giá (giá ở bảng gói)
- [x] Hiệu năng (ADR-016): middleware chỉ đọc cookie, bỏ truy vấn vai trò; `getCurrentUser` cache theo request; profile phía trình duyệt dùng chung
- [x] E2E TC-85 → TC-98; tài liệu toàn bộ (SRS, BR, user stories, database, API, UI, bảo mật, test-plan, ADR-014 → 016, runbook, README)
- Để lại / đề xuất: thông báo khi có phiếu / lead mới (RK-33); link "tới bệnh nhân đó" khi tạo trùng SĐT (US-14.01 AC2); phân trang danh sách > 200 (RV-12)

#### Đợt 10 – Buổi – bài, trình học, checklist, tiến độ ✅ (27/09/2026 · E2E 83/83)
- [x] Schema: `course_sessions`, `lessons.session_id` (bài cũ → "Buổi 1"), `video_url` không bắt buộc, `lesson_progress`; `can_view_lesson`, `session_completed`, `course_progress`; `course_outline` theo buổi
- [x] Admin: khung N × M, thêm / sửa / xóa / ↑↓ / sao chép buổi, bài thuộc buổi, cảnh báo thiếu video / thiếu buổi
- [x] Trình học kiểu Udemy, "Hoàn thành & bài tiếp theo", bỏ tick (xác nhận), thẻ chúc mừng, xem trước cho nhân viên; tiến độ + "Tiếp tục Buổi X – Bài Y"
- [x] Sửa RK-27 (admin không thêm được bài), RK-28 (bài chưa thuộc buổi đứng đầu)
- Để lại: điện thoại tách 2 tab (⏸ chủ dự án để sau); kéo thả bài (chỉ ↑↓)

#### Đợt 9 – Gói tháng & hạn học ✅ (27/09/2026 · E2E 78/78)
- [x] `course_plans` 1/3/6/12 tháng; box đăng ký chọn gói, QR theo giá gói; hạn học cộng dồn (trigger + khóa tuần tự); "Còn N ngày", Gia hạn, "Gói đã hết hạn"; sửa RK-22

#### Đợt 8 – Danh mục, khóa miễn phí, premium, chính sách ✅ (27/09/2026 · E2E 73/73)
- [x] Loại khóa, nhóm bệnh, ảnh bìa; trang chủ 3 nhóm; `/khoa-hoc/[id]`; khóa miễn phí không cần đăng nhập; lead premium + Zalo; chính sách bảo mật + đồng ý

#### Đợt 7 – Vai trò nhân viên ✅ (27/09/2026 · E2E 67/67)
- [x] `role` user/staff/admin, `is_staff()`, policy nhân viên, trigger chỉ admin đổi vai trò; `/admin/registrations`; ô chọn vai trò; menu theo vai trò

#### Đợt 1 → 5 (v0.1) ✅ (26/09/2026 · E2E 63/63)
- [x] Sửa review vòng 1, risk case vòng 2–3, nhiều admin, vận hành an toàn, chống lạm dụng – chi tiết [project-review §6 → §7.4](project-review.md#6-trạng-thái-xử-lý-cập-nhật-26092026-sau-vòng-sửa-rk--e2e-5353-pass)

## 5. Danh mục mã (checklist)

### 5.1. Phiên bản 0.2 (V-01 → V-12)
- [x] Chốt yêu cầu & tài liệu (27/09/2026)
- [x] Đợt 7 – Vai trò staff (V-09)
- [x] Đợt 8 – Danh mục khóa, khóa miễn phí, premium + lead, chính sách bảo mật (V-01, V-10, V-11)
- [x] Đợt 9 – Gói tháng, hạn học, gia hạn (V-02, V-07)
- [x] Đợt 10 – Buổi – bài, trình học, checklist, tiến độ (V-03, V-04)
- [x] Đợt 11 – Nhân viên tạo bệnh nhân từ Zalo, cấp gói, cấp lại mật khẩu (V-08)
- [x] Đợt 12 – Phiếu tham vấn bác sĩ (V-05)
- [x] Đợt 13 – Dashboard quản trị tập trung (V-06)
- [ ] Chuyển đổi dữ liệu ✅ (schema) · dọn dữ liệu test trước chạy thử ⬜ (V-12 → Đợt 14 bước 2.1 → 2.3)

### 5.2. Review vòng 1 (RV)
- [x] RV-01 Ẩn khóa không thu hồi quyền học của học viên đã mua
- [x] RV-02 Xóa khóa học giữ đơn đăng ký
- [x] RV-03 Mật khẩu tối thiểu 8 ký tự
- [x] RV-04 Giới hạn tần suất; Turnstile tùy chọn (bật: A-4)
- [x] RV-05 Validate dữ liệu admin phía server
- [ ] RV-06 Ảnh HEIC không có thumbnail trên Chrome/Edge
- [x] RV-07 Chống trùng đơn ở database
- [ ] RV-08 Ảnh chuyển khoản mồ côi
- [x] RV-09 Nội dung lỗi thời ("Gmail")
- [ ] RV-10 Git + CI – 🟡 có git, remote, workflow CI; chờ A-2, A-3
- [x] RV-11 Người xử lý đơn + lý do + lịch sử
- [ ] RV-12 Phân trang admin – 🟡 Đợt 11: trang Bệnh nhân không còn tải toàn bộ bảng đơn (chỉ đơn của 200 người đang hiển thị); chưa phân trang
- [x] RV-13 Index `profiles.email`
- [ ] RV-14 `updateProfileAction` không hoàn tác khi lỗi giữa chừng (cùng mẫu ở `updatePatientAction`)
- [ ] RV-15 Thông báo kỹ thuật khi trùng SĐT do race
- [x] RV-16 Security headers + CSP
- [ ] RV-17 Chính sách bảo mật – 🟡 kỹ thuật xong, nội dung chờ A-7
- [ ] RV-18 Link video có thể bị chia sẻ (→ R-10)
- [ ] RV-19 Xác nhận email liên hệ chính thức (A-6)
- [ ] RV-20 Logging / giám sát lỗi, backup Storage – 🟡 Đợt 16: backup DB + Storage bằng GitHub Actions; còn giám sát lỗi

### 5.3. Risk case (RK)
- [x] RK-01 · [ ] RK-02 · [x] RK-03 · [x] RK-04 · [x] RK-05 · [x] RK-06 · [x] RK-07 · [x] RK-08 · [x] RK-09
- [ ] RK-10 E2E trên staging – 🟡 rào chặn + hướng dẫn có; staging ⏸ sau MVP
- [x] RK-11 · [x] RK-12 · [x] RK-13 · [x] RK-14 · [ ] RK-15 (làm cùng R-08)
- v0.2 (chi tiết ở [project-review §7.5 – §7.6](project-review.md#75-review-phiên-bản-02--đợt-7--10-cập-nhật-27092026)):
  [x] RK-16 (có công cụ cấp bù) · 🔵 RK-17 · [x] RK-18 · 🟡 RK-19 · [ ] RK-20 (A-7) · 🔵 RK-21 · [x] RK-22 · 🟡 RK-23 · 🟡 RK-24 · 🔵 RK-25 ·
  🔵 RK-26 · [x] RK-27 · [x] RK-28 · [x] RK-29 · 🟡 RK-30 · 🔵 RK-31 · 🔵 RK-32 · [ ] RK-33 · [x] RK-34
- Hạ tầng (chi tiết ở [project-review §7.8](project-review.md#78-đánh-giá-hạ-tầng--quy-mô-500-người-học-cùng-lúc-02102026)):
  🟡 RK-35 (chấp nhận khi thử nghiệm) · [x] RK-36 (workflow đang chạy) · 🟡 RK-37 · [x] RK-38 (chờ A-15) · [ ] RK-39 · [ ] RK-40 · [ ] RK-41 (= RV-12) · 🔵 RK-42

### 5.4. Tính năng mở rộng (R)
- [x] R-00 Xử lý kết quả review (Đợt 1 → 5)
- [ ] R-01 Thông báo email / Zalo khi đơn được duyệt, khi có phiếu / lead mới → backlog ưu tiên 1
- [x] R-02 Nhân viên cấp lại mật khẩu bệnh nhân → Đợt 11
- [x] R-03 Ảnh bìa khóa học → Đợt 8
- [x] R-04 Tiến độ học → Đợt 10
- [x] R-05 Lý do từ chối + lịch sử + người xử lý → Đợt 3
- [ ] R-06 Phân trang, lọc, xuất Excel
- [ ] R-07 Báo cáo doanh thu – 🟡 Đợt 13: doanh thu tháng này / tháng trước trên dashboard (4 chiều); xuất Excel, chọn khoảng thời gian: để sau
- [ ] R-08 Xác nhận thanh toán tự động
- [x] R-09 Chia chương (= buổi), sắp xếp ↑↓ → Đợt 10 (kéo thả để sau)
- [ ] R-10 Video riêng tư
- [ ] R-11 Cấu hình trung tâm trên giao diện
- [x] R-12 Vai trò nhân viên → Đợt 7
- [ ] R-13 Mã giảm giá / combo

### 5.5. Yêu cầu giao diện (UI) – 29/09/2026
- [x] UI-01 Icon mắt hiện / ẩn mật khẩu → Đợt 15
- [x] UI-02 Menu quản trị dọc bên trái, thứ tự mới (Khóa học lên thứ 4), số đếm → Đợt 15
- [x] UI-03 Vòng tròn % tiến độ → Đợt 15

## 6. Phụ lục – thiết kế sơ bộ tính năng mở rộng (R-xx)

| ID | Hạng mục | Story | Giá trị | Công sức | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| R-01 | Thông báo khi đơn được xử lý / có phiếu, lead mới | US-09.01 | Cao | S – M | Backlog 1 |
| R-02 | Nhân viên cấp lại mật khẩu | US-14.04 | Cao | XS | ✅ Đợt 11 |
| R-03 | Ảnh bìa | US-11.02 | Cao | S | ✅ Đợt 8 |
| R-04 | Tiến độ học | EP-13 | Cao | M | ✅ Đợt 10 |
| R-05 | Lý do từ chối, lịch sử, người xử lý | — | Cao | S | ✅ Đợt 3 |
| R-06 | Phân trang, lọc, xuất Excel | US-09.07 | Trung bình | S | Backlog 4 |
| R-07 | Báo cáo doanh thu | US-16.03 | Trung bình | S | 🟡 Đợt 13 |
| R-08 | Xác nhận thanh toán tự động | US-09.09 | Rất cao | L | Backlog 7 |
| R-09 | Chia chương (buổi) | US-13.02 | Cao | M | ✅ Đợt 10 |
| R-10 | Video riêng tư | — | Cao | L | Backlog 8 |
| R-11 | Cấu hình trên giao diện | — | Thấp | S | Sau |
| R-12 | Vai trò nhân viên | EP-10 | Cao | S | ✅ Đợt 7 |
| R-13 | Mã giảm giá / combo | — | Trung bình | M | Sau |

**R-01 – Thông báo.** Trong `setRegistrationStatus` sau khi cập nhật thành công (`approved` / `rejected`) gửi email qua `sendMail`
(mẫu mới trong `lib/mailer.ts`); lỗi gửi không làm hỏng thao tác (try/catch, ghi log). Thêm: email tóm tắt hằng ngày cho nhân viên
(đơn chờ, phiếu mới, lead mới) bằng Vercel Cron gọi route handler có secret. Zalo OA ZNS nếu cần (tốn phí).

**R-06 – Phân trang, xuất Excel.** Query param `?page=&from=&to=&q=`; `.range()` + `count: 'exact'`. Xuất CSV qua route handler
`app/admin/export/route.ts` (kiểm tra quyền, UTF-8 BOM cho Excel). Với bệnh nhân: thêm `p_offset` cho `admin_patients()`.

**R-07 – Doanh thu (phần còn lại).** Chọn khoảng thời gian tùy ý (`revenue_report(from, to)` đã hỗ trợ), xuất Excel; biểu đồ theo tháng
(một chuỗi, cột theo tháng – theo `dataviz`/design system).

**R-08 – Xác nhận thanh toán tự động.** Casso / SePay / PayOS → webhook `app/api/webhooks/bank/route.ts` (xác thực chữ ký) → khớp mã đơn
ngắn trong nội dung chuyển khoản + số tiền ≥ giá → `approved`, `reviewed_by_name = 'Hệ thống'` (RK-15). Lưu `bank_transactions`
(idempotent theo mã giao dịch). Không khớp → giữ `pending`.

**R-10 – Video riêng tư.** Bunny Stream / Cloudflare Stream / Mux; lưu `video_provider`, `video_id`; server ký URL ngắn hạn khi
`can_view_lesson` đúng; watermark động (tên / SĐT).

**R-11 – Cấu hình trên giao diện.** Bảng `settings(key, value jsonb)`; RLS đọc công khai key không nhạy cảm, ghi `is_admin()`;
cache `unstable_cache` + `revalidateTag('settings')`.

**R-13 – Mã giảm giá.** Bảng `coupons(code, percent|amount, valid_from, valid_to, max_uses, course_ids)`; server tính lại giá, QR theo giá sau giảm.

Kế hoạch code chi tiết của Đợt 7 → 13 (lịch sử) nằm trong các khối checklist §4, ADR-011 → ADR-016 và mục "Điều chỉnh khi triển khai"
của từng ADR.

## 7. Quy ước cập nhật file này

Mỗi khi xong một đợt (hoặc một thay đổi lớn):
1. §0: cập nhật dòng "Kiểm thử", "Việc tiếp theo", "Rủi ro còn mở".
2. §1.1: thêm / sửa 1 dòng (trạng thái, ngày, commit, TC, kết quả E2E); §1.2: đếm lại.
3. §4: thêm khối checklist của đợt ở **trên cùng** (các hạng mục [x]/[ ] + "Để lại / đề xuất"); thu gọn khối của đợt cũ còn 1–3 dòng.
4. §5: tick mã liên quan; mã mới (RK-xx) ghi chi tiết ở project-review rồi thêm vào §5.3.
5. §2 / §3: thêm việc chủ dự án (A-xx) hoặc sắp lại backlog nếu chủ dự án đổi ưu tiên.
6. Cập nhật đồng thời: project-review (§0, §7.x), test-plan, tài liệu liên quan, `web design structure/README.md` (lịch sử), README gốc.
