# Lộ trình (Roadmap)

> **Cách dùng file này**
> - Đọc nhanh: **§0 Tóm tắt** (1 màn hình) → **§2 Việc chủ dự án cần làm** → **§3 Kế hoạch tiếp theo**.
> - Chi tiết từng đợt: **§4 Checklist theo đợt** (mới nhất ở trên). Danh mục mã RV / RK / R / G: **§5**.
> - Cách cập nhật khi xong một đợt: xem **§7 Quy ước** (thêm 1 dòng §1, 1 khối §4, tick §5, cập nhật project-review).
>
> Mã: **RV-xx** review vòng 1, **RK-xx** risk case ([project-review.md](project-review.md)); **R-xx** tính năng mở rộng (thiết kế ở §6);
> **G-xx** khoảng trống kiểm thử ([test-plan](../08-testing/test-plan.md)); **A-xx** việc chủ dự án; **V-xx** yêu cầu v0.2
> ([project-overview §9](../00-overview/project-overview.md#9-định-vị-lại--phiên-bản-02-chốt-27092026)).

Cập nhật: **27/09/2026** – xong Đợt 11, 12, 13 (làm song song theo yêu cầu chủ dự án) → **toàn bộ v0.2 đã có code + E2E**.

## 0. Tóm tắt hiện trạng

| Hạng mục | Trạng thái |
| --- | --- |
| Phiên bản | **v0.2 hoàn tất code** (Đợt 7 → 13): vai trò nhân viên, khóa miễn phí / chương trình / premium, gói tháng + hạn học, buổi – bài + tiến độ, bệnh nhân từ Zalo, phiếu tham vấn, dashboard |
| Kiểm thử | E2E **96/96 PASS** (27/09/2026, chạy trên project Supabase hiện tại – dữ liệu test) |
| Hiệu năng | Middleware nhẹ (không gọi mạng khi token còn hạn), xác thực 1 lần / request, header + hộp nhắc dùng chung profile (ADR-016) |
| Việc tiếp theo | **Đợt 14 – Go-live MVP** (§3.1): chủ yếu là việc của chủ dự án (A-5, A-7, A-8, A-9, A-11 → A-13) |
| Rủi ro còn mở cần chú ý | RK-20 (nội dung chính sách chưa duyệt), RK-10 (chưa có staging – chủ dự án chọn để sau), RK-30 (hiệu năng khi > vài nghìn bệnh nhân), RK-33 (chưa có thông báo khi có phiếu / lead mới) |

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
| 14 | **Go-live MVP** | A-5, A-7 → A-13, V-12 | ⬜ **Tiếp theo** | — | Smoke test runbook §10 | — |

### 1.2. Tổng hợp theo nguồn

| Nguồn | Tổng | ✅ Xong | 🟡 Một phần / chấp nhận có theo dõi | ⬜ Chưa làm |
| --- | --- | --- | --- | --- |
| RV (review vòng 1) | 20 | 10 | 3 (RV-10, RV-12, RV-17) | 7 |
| RK vòng 2–3 (RK-01 → 15) | 15 | 12 | 1 (RK-10) | 2 (RK-02, RK-15) |
| RK v0.2 (RK-16 → 34) | 19 | 7 (RK-16, 18, 22, 27, 28, 29, 34) | 10 chấp nhận / theo dõi (RK-17, 19, 21, 23, 24, 25, 26, 30, 31, 32) | 2 (RK-20 chờ A-7, RK-33) |
| R (tính năng mở rộng, gồm R-00) | 14 | 7 (R-00, 02, 03, 04, 05, 09, 12) | 1 (R-07) | 6 |
| G (khoảng trống kiểm thử) | 12 | 2 | 4 | 6 |

## 2. Việc cần chủ dự án làm (không tự động hóa được)

| # | Việc | Liên quan | Khi nào | Trạng thái |
| --- | --- | --- | --- | --- |
| A-5 | Chạy `supabase/schema.sql` mới nhất trên **production** (sau khi sao lưu) trước khi deploy | Tất cả | Đợt 14 | 🟡 đã chạy trên project hiện tại (dữ liệu test) |
| A-7 | Duyệt nội dung **Chính sách bảo mật** (`/chinh-sach-bao-mat`): thời hạn lưu, cam kết phản hồi 72 giờ, nhà cung cấp, email liên hệ | RV-17, RK-20 | **Trước go-live** | 🟡 dev đã soạn |
| A-8 | Nhập nội dung thật: ảnh bìa, mô tả, giá gói 1/3/6/12 tháng (Vẹo lưng, Vẹo ngực), khung buổi + link video bài tập, khóa miễn phí, 3 khóa premium | Đợt 8 → 10 | **Trước go-live** | ⬜ (admin tự nhập trên giao diện) |
| A-9 | Danh sách nhân viên → cấp vai trò `staff` ở Quản trị › Bệnh nhân | Đợt 7 | Đợt 14 | ⬜ |
| A-10 | Duyệt / sửa 6 câu hỏi mẫu phiếu tham vấn ở Quản trị › Mẫu phiếu | Đợt 12 | Đợt 14 | ⬜ |
| A-11 | Quyết định **dọn dữ liệu test** trên production (xóa khóa `[E2E]`, tài khoản / đơn test; giữ admin) – dev chuẩn bị danh sách, chủ dự án xác nhận | V-12, FR-190 | Đợt 14 | ⬜ |
| A-12 | Domain + Vercel production: `NEXT_PUBLIC_SITE_URL`, SMTP (email quên mật khẩu), Supabase Site URL (runbook §2, §4) | — | Đợt 14 | ⬜ |
| A-13 | Supabase gói **Pro** (không tự tạm dừng, có backup hằng ngày) hoặc lịch `pg_dump` thủ công | RV-20 | Đợt 14 | ⬜ |
| A-6 | Xác nhận email liên hệ trong `site-config.ts` là email chính thức | RV-19 | Đợt 14 | ⬜ |
| A-4 | Tạo khóa Cloudflare Turnstile cho domain production, đặt 2 biến trên Vercel | RK-06 | Khi có domain | ⬜ |
| A-1 | Project Supabase **staging** cho E2E (runbook §1.1) | RK-10, G-12 | ⏸ Sau MVP (chủ dự án chốt 27/09) | ⬜ |
| A-2, A-3 | Secrets GitHub cho CI E2E; push / PR để CI chạy, bật "Require status checks" | RV-10 | ⏸ Sau A-1 | ⬜ |

## 3. Kế hoạch tiếp theo

### 3.1. Đợt 14 – Go-live MVP (ưu tiên số 1)

Mục tiêu: chạy thật trên production với nội dung thật, nhân viên dùng được hằng ngày. Chi tiết thao tác: [runbook §10](../09-operations/deployment-runbook.md#10-chuyển-lên-phiên-bản-02--go-live-mvp-roadmap-đợt-14).

| # | Việc | Ai | Ghi chú |
| --- | --- | --- | --- |
| 1 | Sao lưu → chạy `schema.sql` trên production (A-5) | Chủ dự án | An toàn khi chạy lại |
| 2 | Cấu hình Vercel + domain + SMTP (A-12), Supabase Pro / backup (A-13) | Chủ dự án | |
| 3 | Dọn dữ liệu test (A-11) | Dev chuẩn bị SQL + chủ dự án xác nhận | Không tự chạy lệnh xóa trên production khi chưa xác nhận |
| 4 | Nhập nội dung thật (A-8), duyệt chính sách (A-7), câu hỏi phiếu (A-10) | Chủ dự án / admin | |
| 5 | Cấp vai trò nhân viên (A-9) | Admin | |
| 6 | Smoke test theo runbook §10 bước 7 | Dev + chủ dự án | |
| 7 | Tuần đầu: theo dõi Tổng quan hằng ngày, đối soát tiền mặt theo nhân viên cuối tuần | Admin | |

### 3.2. Sau MVP – backlog ưu tiên (chủ dự án sắp lại khi có số liệu thật)

| Ưu tiên | Mã | Hạng mục | Vì sao | Công sức |
| --- | --- | --- | --- | --- |
| 1 | RK-33 / R-01 | Thông báo cho nhân viên khi có đơn / phiếu / lead mới (email hoặc Zalo OA) và cho bệnh nhân khi đơn được duyệt | Không phải mở dashboard liên tục | S – M |
| 2 | RV-20 | Giám sát lỗi (Sentry / Vercel logs), backup Storage ảnh chuyển khoản | Vận hành thật | S |
| 3 | A-1, A-2, A-3 | Staging + CI E2E | Thay đổi schema an toàn | S |
| 4 | RV-12 + R-06 | Phân trang, lọc, xuất Excel đơn / bệnh nhân / doanh thu | Khi > 200 đơn / bệnh nhân | S |
| 5 | — | Trình học điện thoại tách 2 tab "Bài này / Nội dung" | Chủ dự án chốt để sau (27/09) | S |
| 6 | RK-02 | Xác minh email khi đăng ký / đổi email | Tránh giữ chỗ email người khác | M |
| 7 | R-08 | Xác nhận chuyển khoản tự động (webhook ngân hàng) | Giảm việc duyệt tay | L |
| 8 | R-10 | Video riêng tư (chống chia sẻ link) | Bảo vệ nội dung trả phí | L |
| — | RV-06, RV-08, RV-14, RV-15, R-11, R-13, RK-23 | Cải tiến nhỏ, cấu hình trên giao diện, mã giảm giá, khóa cho đội chuyên gia | Theo nhu cầu | — |

## 4. Checklist chi tiết theo đợt (mới nhất ở trên)

Làm xong đợt nào tick đợt đó. Mục **"Để lại / đề xuất"** là căn cứ để chủ dự án sắp xếp lại các đợt sau.

#### Đợt 14 – Go-live MVP ⬜
- [ ] A-5 schema production · [ ] A-12 Vercel / domain / SMTP · [ ] A-13 backup · [ ] A-11 dọn dữ liệu test
- [ ] A-8 nội dung thật · [ ] A-7 chính sách · [ ] A-10 câu hỏi phiếu · [ ] A-9 nhân viên
- [ ] Smoke test production (runbook §10) · [ ] Ghi kết quả vào project-review

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
- [ ] Chuyển đổi dữ liệu ✅ (schema) · dọn dữ liệu test trước go-live ⬜ (V-12 → Đợt 14)

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
- [ ] RV-20 Logging / giám sát lỗi, backup Storage

### 5.3. Risk case (RK)
- [x] RK-01 · [ ] RK-02 · [x] RK-03 · [x] RK-04 · [x] RK-05 · [x] RK-06 · [x] RK-07 · [x] RK-08 · [x] RK-09
- [ ] RK-10 E2E trên staging – 🟡 rào chặn + hướng dẫn có; staging ⏸ sau MVP
- [x] RK-11 · [x] RK-12 · [x] RK-13 · [x] RK-14 · [ ] RK-15 (làm cùng R-08)
- v0.2 (chi tiết ở [project-review §7.5 – §7.6](project-review.md#75-review-phiên-bản-02--đợt-7--10-cập-nhật-27092026)):
  [x] RK-16 (có công cụ cấp bù) · 🔵 RK-17 · [x] RK-18 · 🟡 RK-19 · [ ] RK-20 (A-7) · 🔵 RK-21 · [x] RK-22 · 🟡 RK-23 · 🟡 RK-24 · 🔵 RK-25 ·
  🔵 RK-26 · [x] RK-27 · [x] RK-28 · [x] RK-29 · 🟡 RK-30 · 🔵 RK-31 · 🔵 RK-32 · [ ] RK-33 · [x] RK-34

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
