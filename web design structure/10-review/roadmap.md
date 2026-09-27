# Lộ trình mở rộng (Roadmap)

Mỗi hạng mục có thiết kế sơ bộ để khi triển khai chỉ cần chi tiết hóa bằng
[templates/feature-spec.md](../templates/feature-spec.md).
Nguồn gốc các mã: **RV-xx** (review vòng 1), **RK-xx** (risk case vòng 2–3) trong [project-review.md](project-review.md);
**R-xx** là tính năng mở rộng (chi tiết thiết kế ở cuối file); **G-xx** là khoảng trống kiểm thử trong [test-plan](../08-testing/test-plan.md).

Cập nhật: 27/09/2026 – **định vị lại v0.2** (chương trình phục hồi chức năng cho bệnh nhân, gói tháng, vai trò staff, luồng web ⇄ Zalo).
Yêu cầu: [project-overview §9](../00-overview/project-overview.md#9-định-vị-lại--phiên-bản-02-chốt-27092026). Lộ trình cũ (Đợt 6 → 12 bản 26/09) được thay bằng §3 bên dưới.

## 1. Báo cáo tiến độ (report)

### 1.1. Theo đợt

| Đợt | Nội dung | Hạng mục | Trạng thái | Hoàn thành | Kiểm thử | Kết quả E2E |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sửa lỗi review vòng 1 | RV-01, RV-02, RV-05, RV-09, RV-10 (git) | ✅ Xong | 26/09/2026 (`0f6cfef`, `05b16c5`) | TC-01 → TC-46 | 46/46 PASS |
| 2 | Risk case vòng 2 + người xử lý | RK-01, RK-03, RK-05, RK-07 (= RV-07), RK-09, người xử lý (RV-11) | ✅ Xong | 26/09/2026 | TC-47 → TC-54 | 53/53 PASS |
| 3 | Nhiều admin | RK-11, RK-12 + R-05, RK-13, RK-14 | ✅ Xong | 26/09/2026 | TC-55 → TC-58 | 57/57 PASS |
| 4 | Vận hành an toàn | RK-10 (rào chặn E2E + hướng dẫn staging), CI GitHub Actions, RV-13, RV-03 | ✅ Xong (staging chờ A-1) | 26/09/2026 | TC-59; rào chặn E2E và build CI kiểm tra thủ công | 63/63 PASS |
| 5 | Chống lạm dụng & dữ liệu | RK-06 / RV-04 (giới hạn tần suất + Turnstile tùy chọn), RK-08, RK-04, RV-16 | ✅ Xong (Turnstile chờ A-4) | 26/09/2026 | TC-60 → TC-64 | 63/63 PASS |
| — | Định vị lại v0.2 (tài liệu) | Yêu cầu V-01 → V-12, ADR-011 → ADR-015, FR-110 → FR-190, BR-70 → BR-107, EP-10 → EP-16, SCR-15 → SCR-28 | ✅ Tài liệu | 27/09/2026 | TC-65 → TC-94 (dự kiến) | — |
| 6 | Hạ tầng (song song) | A-1 → A-5 | ⬜ Chờ chủ dự án | — | — | — |
| 7 | Vai trò staff | R-12 | ✅ Xong | 27/09/2026 (`c3d08a5`) | TC-65 → TC-67 | 67/67 PASS |
| 8 | Danh mục khóa, premium, chính sách | R-03, RV-17 | ✅ Xong (nội dung chính sách chờ A-7) | 27/09/2026 (`1251587`) | TC-68 → TC-73 | 73/73 PASS |
| 9 | Gói tháng & hạn học | — | 🟡 Code xong, chờ chạy schema + E2E | 27/09/2026 | TC-74 → TC-78 | Chờ chạy |
| 10 | Buổi – bài, trình học, tiến độ | R-04, R-09 | ⬜ | — | TC-79 → TC-84 | — |
| 11 | Nhân viên tạo bệnh nhân (Zalo) | R-02 | ⬜ | — | TC-85 → TC-88 | — |
| 12 | Phiếu tham vấn | — | ⬜ | — | TC-89 → TC-92 | — |
| 13 | Dashboard tập trung | R-07 (một phần) | ⬜ | — | TC-93 → TC-94 | — |

### 1.2. Tổng hợp theo nguồn

| Nguồn | Tổng | ✅ Xong | 🟡 Một phần / chờ cấu hình | ⬜ Chưa làm |
| --- | --- | --- | --- | --- |
| RV (review vòng 1) | 20 | 10 | 1 (RV-10) | 9 |
| RK (risk case) | 15 | 12 | 1 (RK-10) | 2 |
| R (tính năng mở rộng, gồm R-00) | 14 | 2 | — | 12 |
| G (khoảng trống kiểm thử) | 12 | 2 | 4 | 6 |

### 1.3. Việc cần chủ dự án làm (không tự động hóa được)

| # | Việc | Liên quan | Trạng thái |
| --- | --- | --- | --- |
| A-1 | Tạo project Supabase **staging**, chạy `schema.sql`, tạo env staging có `E2E_SUPABASE_REF` (runbook §1.1) | RK-10, G-12 | ⬜ |
| A-2 | Thêm secrets + variable `E2E_ENABLED` trên GitHub để CI chạy E2E trên staging | RK-10, RV-10 | ⬜ |
| A-3 | Push nhánh / mở PR để CI chạy lần đầu; bật "Require status checks" cho `main` | RV-10 | ⬜ |
| A-4 | Tạo khóa Cloudflare Turnstile cho domain production, đặt 2 biến trên Vercel, thử đăng ký trên điện thoại | RK-06 | ⬜ |
| A-5 | Chạy `supabase/schema.sql` mới nhất trên **production** (sau khi sao lưu) trước khi deploy code Đợt 3–7 (27/09: đã chạy trên project hiện tại – đang là dữ liệu test) | Tất cả | 🟡 |
| A-6 | Xác nhận email liên hệ trong `site-config.ts` là email chính thức | RV-19 | ⬜ |
| A-7 | Nội dung **Chính sách bảo mật** (dữ liệu sức khỏe) – ✅ dev đã soạn (`/chinh-sach-bao-mat`, 27/09/2026); chủ trung tâm cần duyệt: thời hạn lưu (24 tháng / 12 tháng), cam kết phản hồi 72 giờ, danh sách nhà cung cấp, email liên hệ | RV-17, Đợt 8 | 🟡 |
| A-8 | (Đợt 9: admin đã tự nhập được giá gói trên giao diện) Ảnh bìa, mô tả, giá gói 1/3/6/12 tháng cho Vẹo lưng, Vẹo ngực; thông tin + giá 3 khóa premium; link video các bài tập | Đợt 8 → 10 | ⬜ |
| A-9 | Danh sách nhân viên cần cấp vai trò `staff` | Đợt 7 | ⬜ |
| A-10 | Duyệt câu hỏi mẫu phiếu tham vấn (database-design §10.8) | Đợt 12 | ⬜ |

## 2. Checklist hoàn thành

### 2.1. Review vòng 1 (RV)

- [x] RV-01 Ẩn khóa không thu hồi quyền học của học viên đã mua
- [x] RV-02 Xóa khóa học giữ đơn đăng ký (snapshot tên khóa, học phí)
- [x] RV-03 Mật khẩu tối thiểu 8 ký tự (Đợt 4)
- [x] RV-04 Giới hạn tần suất đăng ký / đăng nhập / quên mật khẩu; Turnstile tùy chọn (Đợt 5) – bật Turnstile: A-4
- [x] RV-05 Validate dữ liệu admin phía server
- [ ] RV-06 Ảnh HEIC không có thumbnail trên Chrome/Edge
- [x] RV-07 Chống trùng đơn ở database (RK-07)
- [ ] RV-08 Ảnh chuyển khoản mồ côi
- [x] RV-09 Nội dung lỗi thời ("Gmail")
- [ ] RV-10 Git + CI – 🟡 đã có git, remote GitHub, workflow CI; chờ A-2, A-3
- [x] RV-11 Người xử lý đơn + lý do từ chối + lịch sử (Đợt 2–3)
- [ ] RV-12 Phân trang danh sách admin
- [x] RV-13 Index `profiles.email` (Đợt 4)
- [ ] RV-14 `updateProfileAction` không hoàn tác khi lỗi giữa chừng
- [ ] RV-15 Thông báo kỹ thuật khi trùng SĐT do race
- [x] RV-16 Security headers + CSP (Đợt 5)
- [ ] RV-17 Chính sách bảo mật / đồng ý xử lý dữ liệu (NĐ 13/2023) – 🟡 Đợt 8 xong phần kỹ thuật (E2E 73/73), nội dung chờ A-7
- [ ] RV-18 Link video có thể bị chia sẻ ra ngoài (→ R-10)
- [ ] RV-19 Xác nhận email liên hệ chính thức (A-6)
- [ ] RV-20 Logging / giám sát lỗi, backup Storage

### 2.2. Risk case (RK)

- [x] RK-01 Chặn nhập email nội bộ `@sdt.hv.invalid`
- [ ] RK-02 Xác minh email khi đăng ký / đổi email
- [x] RK-03 Xóa tài khoản giữ đơn đăng ký
- [x] RK-04 Đơn chờ duyệt của khóa đã xóa: hướng dẫn hoàn tiền (Đợt 5)
- [x] RK-05 Chốt nghiệp vụ: đơn của khóa ẩn vẫn duyệt được
- [x] RK-06 Chống spam / dò mật khẩu (Đợt 5)
- [x] RK-07 Unique index chặn đơn trùng
- [x] RK-08 Kiểm tra ảnh theo nội dung file (Đợt 5)
- [x] RK-09 Cảnh báo link video không hợp lệ
- [ ] RK-10 E2E trên staging – 🟡 đã có rào chặn + hướng dẫn + CI; chờ A-1, A-2
- [x] RK-11 Không ghi đè khi 2 admin cùng xử lý
- [x] RK-12 Lịch sử xử lý đơn
- [x] RK-13 Cấp / gỡ quyền admin trên giao diện
- [x] RK-14 Thông báo lỗi database theo từng thao tác
- [ ] RK-15 Ghi "Hệ thống" khi duyệt tự động (làm cùng R-08)

### 2.3. Tính năng mở rộng (R)

- [x] R-00 Xử lý kết quả review (Đợt 1 → 5)
- [x] R-05 Lý do từ chối + lịch sử xử lý + người xử lý
- [ ] R-01 Thông báo email khi đơn được duyệt / từ chối
- [ ] R-02 Admin đặt lại mật khẩu học viên → **Đợt 11** (nhân viên cấp lại mật khẩu)
- [x] R-03 Ảnh bìa khóa học → **Đợt 8**
- [ ] R-04 Tiến độ học → **Đợt 10** (checklist buổi, %)
- [ ] R-06 Phân trang, lọc, xuất Excel đơn
- [ ] R-07 Báo cáo doanh thu → **Đợt 13** (doanh thu trên dashboard admin); xuất Excel để sau
- [ ] R-08 Xác nhận thanh toán tự động
- [ ] R-09 Kéo thả bài học, chia chương → **Đợt 10** (buổi = chương; sắp xếp bằng nút ↑↓, kéo thả để sau)
- [ ] R-10 Video riêng tư
- [ ] R-11 Cấu hình trung tâm trên giao diện
- [x] R-12 Vai trò nhân viên → **Đợt 7**
- [ ] R-13 Mã giảm giá / combo

### 2.4. Phiên bản 0.2 (V-01 → V-12)

- [x] Chốt yêu cầu & cập nhật tài liệu (27/09/2026)
- [x] Đợt 7 – Vai trò staff (V-09) – 27/09/2026, E2E 67/67
- [x] Đợt 8 – Danh mục khóa, khóa miễn phí, premium + lead, chính sách bảo mật (V-01, V-10, V-11) – ✅ 27/09/2026, E2E 73/73
- [ ] Đợt 9 – Gói tháng, hạn học, gia hạn (V-02, V-07) – 🟡 code + tài liệu xong 27/09/2026, chờ chạy `schema.sql` + E2E
- [ ] Đợt 10 – Buổi – bài, trình học kiểu Udemy, checklist, tiến độ (V-03, V-04)
- [ ] Đợt 11 – Nhân viên tạo bệnh nhân từ Zalo, cấp gói, cấp lại mật khẩu (V-08)
- [ ] Đợt 12 – Phiếu tham vấn bác sĩ (V-05)
- [ ] Đợt 13 – Dashboard quản trị tập trung (V-06)
- [ ] Chuyển đổi dữ liệu & dọn dữ liệu test trước go-live (V-12)

## 3. Lộ trình gợi ý (theo thứ tự thực hiện)

Mỗi đợt là **một PR**: `schema.sql` (idempotent) + code + tài liệu (chuyển mục v0.2 từ ⬜ sang ✅, dời từ "dự kiến" vào phần chính)
+ bước E2E. Xong đợt nào thì hệ thống vẫn chạy được đầy đủ (không để trạng thái nửa vời trên `main`).

| Thứ tự | Đợt | Hạng mục | Vì sao ở thứ tự này | Phụ thuộc | Công sức |
| --- | --- | --- | --- | --- | --- |
| 0 | **Đợt 6 – Hạ tầng** (song song) | A-1 → A-5: staging, secrets CI, chạy schema production | v0.2 thay schema nhiều lần; nên có staging để E2E không chạm dữ liệu thật | Chủ dự án | XS–S |
| 1 | **Đợt 7 – Vai trò staff** | `is_staff`, `requireStaff`, middleware, RLS, chọn vai trò, `/admin/registrations`, menu theo quyền | Mọi màn hình quản trị sau đều phân biệt staff/admin | — | S |
| 2 | **Đợt 8 – Danh mục & công khai** | `kind/category/audience/summary/outcomes`, ảnh bìa, trang chủ 3 nhóm, `/khoa-hoc/[id]` (chưa có gói – hiện giá khóa), khóa free công khai (bài phẳng như cũ), premium + lead + `/admin/leads`, chính sách bảo mật + đồng ý | Có mặt tiền bán hàng mới sớm; premium/lead độc lập với gói | 7 | M |
| 3 | **Đợt 9 – Gói & hạn học** | `course_plans`, chọn gói ở box đăng ký, snapshot gói, `access_until` cộng dồn, unique pending, hết hạn / gia hạn, cột gói/nguồn ở bảng đơn | Nền kinh doanh; cần trước buổi–bài (số buổi đã mua) | 8 | M |
| 4 | **Đợt 10 – Buổi – bài & trình học** | `course_sessions`, `session_id`, tạo khung N × M, sao chép buổi, `lesson_progress`, `can_view_lesson`, `get_lesson_video`, trình học kiểu Udemy, % tiến độ, CTA | Phần lớn nhất; dựa trên số buổi đã mua (Đợt 9) | 9 | L |
| 5 | **Đợt 11 – Bệnh nhân từ Zalo** | `/admin/patients` (+ new, [id]), tạo tài khoản + cấp gói + mật khẩu tự sinh, nhắc đổi mật khẩu, cấp lại mật khẩu, lọc nguồn/hạn | Cần gói (9) để cấp; nên có trình học (10) để bệnh nhân Zalo học ngay | 7, 9 | M |
| 6 | **Đợt 12 – Phiếu tham vấn** | Mẫu câu hỏi, form phiếu, nhắc khi xong khóa, `/admin/consultations` | Cần tiến độ (10) để nhắc cuối khóa | 10 | S–M |
| 7 | **Đợt 13 – Dashboard** | `/admin` tổng quan, `dashboard_stats`, `revenue_report`, việc cần làm, tiến độ theo chương trình | Tổng hợp dữ liệu của mọi đợt trước | 8 → 12 | M |
| 8 | Sau v0.2 | R-01 (email/Zalo khi duyệt), RK-02, RV-12 + R-06 (phân trang, xuất Excel), RV-20 (giám sát), RV-06, RV-08, RV-14, RV-15, R-08, R-10, R-11, R-13, khóa cho đội chuyên gia | Theo số liệu vận hành thật | — | — |

Công sức: XS < 0,5 ngày · S 1–2 ngày · M 3–5 ngày · L > 1 tuần. Tổng v0.2 (Đợt 7 → 13): khoảng 4–5 tuần làm việc.

### 3.1. Chi tiết kế hoạch code từng đợt v0.2

#### Đợt 7 – Vai trò staff (ADR-011)
| Lớp | Thay đổi |
| --- | --- |
| Schema | `role` check thêm `staff`; `is_staff()`; policy `registrations_select/update`, `registration_events_select`, `profiles_select` → `is_staff()`; `profiles_staff_update` (chỉ dòng `role = 'user'`); storage `payment-proofs` select → `is_staff()`; `guard_role_change` chặn người không phải admin |
| `lib/auth.ts` | `getCurrentUser()` trả `role`, `isStaff`; thêm `requireStaff()` |
| `middleware.ts` | `/admin/**` cho staff/admin; `/admin/courses/**`, `/admin/settings/**` chỉ admin |
| `app/admin/` | Chuyển bảng đơn `page.tsx` → `registrations/page.tsx` (`/admin` tạm redirect sang đây tới Đợt 13); `AdminNav` theo vai trò; `setRegistrationStatus` dùng `requireStaff`; `setUserRole(userId, 'user'\|'staff'\|'admin')` + ô chọn vai trò ở trang Học viên (tab "Nhân viên & Admin") |
| UI chung | Header: "Quản trị" cho staff; `StatusBadge` `staff` |
| E2E | TC-65 → TC-67; sửa TC-24, TC-28, TC-55, TC-58 theo route/nút mới |

#### Đợt 8 – Danh mục, khóa miễn phí, premium & lead, chính sách bảo mật (ADR-012, ADR-015)
| Lớp | Thay đổi |
| --- | --- |
| Schema | Cột `courses.kind/category/audience/summary/outcomes`; bucket public `course-covers` + policy admin; `profiles.consent_at/consent_version`; bảng `leads` + trigger stamp + RLS; `lessons_select` cho khóa `free` đang hiển thị (tạm thời, trước khi có `can_view_lesson` ở Đợt 10) |
| Admin | Form khóa: loại, nhóm, ảnh bìa (nén client như ảnh chuyển khoản, magic bytes ở server), mô tả ngắn, "Bạn sẽ đạt được"; khóa premium ẩn phần bài học |
| Công khai | Trang chủ 3 nhóm (SCR-15), `/khoa-hoc/[id]` (SCR-16 – giá khóa, đề cương phẳng), footer + menu neo mới; `next.config.mjs` thêm domain Storage vào `images.remotePatterns` + CSP `img-src` |
| Khóa free | `/courses/[id]/**` bỏ khỏi middleware; trang tự chuyển `/login?next=` nếu khóa không phải free và chưa đăng nhập |
| Premium | `LeadDialog` + `createLeadAction` (rate limit `lead:<IP>`), mở `siteConfig.zaloUrl`; `/admin/leads` + `setLeadStatus` |
| Chính sách | `/chinh-sach-bao-mat`; `ConsentCheckbox` ở box đăng ký (server kiểm tra); hộp đồng ý cho tài khoản cũ (SCR-21) + `acceptConsent` |
| Dữ liệu | Khóa cũ → `program` |
| E2E | TC-68 → TC-73; sửa TC-11, TC-18/19 (ô đồng ý) |

#### Đợt 9 – Gói tháng & hạn học (ADR-012)
| Lớp | Thay đổi |
| --- | --- |
| Schema | Bảng `course_plans` + RLS; cột gói / `source` / `payment_method` / `payment_note` / `created_by` / `access_*` ở `registrations`; `payment_proof_path` nullable + check theo `source`; thay `registrations_active_key` bằng `registrations_pending_key`; trigger tính hạn (advisory lock), `has_course_access` theo hạn, `purchased_sessions()`; tạo gói 1 tháng từ giá cũ |
| Admin | Bảng gói trong thẻ chương trình (`upsertPlan`, `deletePlan`); bảng đơn thêm cột Gói, Nguồn, Hình thức, Hạn học |
| Đăng ký | `RegisterForm`: chọn chương trình → gói, QR theo giá gói, `?plan=`; `registerAction`: `planId`, giá theo gói, BR-84; thông báo cộng dồn khi đang còn hạn |
| Bệnh nhân | "Khóa học của tôi": hạn học, cảnh báo ≤ 7 ngày, Gia hạn; hết hạn chặn xem bài (qua `has_course_access`) nhưng vẫn hiện khóa |
| Trang giới thiệu | Khung giá chọn gói (SCR-16) |
| E2E | TC-74 → TC-78; sửa TC-13/14, TC-23, TC-48 (unique pending), TC-42/43 |

#### Đợt 10 – Buổi – bài, trình học kiểu Udemy, checklist, tiến độ (ADR-013)
| Lớp | Thay đổi |
| --- | --- |
| Schema | `course_sessions`, `lessons.session_id`, `video_url` nullable + `revoke select (video_url)`; `lesson_progress` + trigger điền `course_id`; hàm `session_position`, `session_completed`, `can_view_lesson`, `get_lesson_video`, `course_progress`; RLS `lesson_progress` (insert/delete khi `can_view_lesson`); đề cương đọc công khai; bài cũ → "Buổi 1" |
| Admin | Trang nội dung (SCR-27): tạo khung N × M (`generateSkeleton`), thêm/sửa/xóa/↑↓/sao chép buổi, bài thuộc buổi, video không bắt buộc, cảnh báo thiếu video/thiếu buổi; form tạo chương trình có ô số buổi × số bài; admin đọc `video_url` bằng service role ở trang admin (đã `requireAdmin`) |
| Trình học | `page.tsx` (server: đề cương + trạng thái khóa + `get_lesson_video`), `LessonPlayer.tsx` (client: tick, "Hoàn thành & bài tiếp theo", xác nhận bỏ tick, thẻ xong buổi), `SessionAccordion`, `ProgressBar`, mobile 2 tab + nút cố định đáy; staff xem trước |
| Trang khóa / Khóa học của tôi | Thanh tiến độ, "Tiếp tục Buổi X – Bài Y" (từ `course_progress`) |
| `app/courses/actions.ts` | `toggleLessonProgress` (server client, RLS quyết định) |
| E2E | TC-79 → TC-84; sửa TC-08, TC-10, TC-21, TC-30, TC-47, TC-51 |

#### Đợt 11 – Nhân viên tạo bệnh nhân từ Zalo (ADR-014)
| Lớp | Thay đổi |
| --- | --- |
| Schema | `profiles.source/created_by/must_change_password/staff_note`; bảng `account_events`; policy `registrations_staff_insert`; trigger `stamp_registration_review` chạy cả `before insert` (lịch sử `new → approved`) |
| `lib/password.ts` | `generatePassword()` (CSPRNG, bảng chữ dễ đọc, 8 ký tự) |
| `app/admin/patients/` | Danh sách (thay `/admin/users`, lọc nguồn/hạn, tab Nhân viên & Admin cho admin), `new` (SCR-23), `[id]` (SCR-24); actions `createPatientAction` (rollback), `grantPlanAction`, `updatePatientAction`, `resetPatientPasswordAction`; `OneTimeSecret` + tin nhắn mẫu Zalo |
| Đăng nhập | `LoginReminders` (SCR-21): nhắc đổi mật khẩu (cookie "để sau" theo phiên); `changePasswordAction` tắt cờ |
| E2E | TC-85 → TC-88; sửa TC-29 |

#### Đợt 12 – Phiếu tham vấn (ADR-015)
| Lớp | Thay đổi |
| --- | --- |
| Schema | `consult_questions` (+ seed 6 câu), `consultations` + trigger stamp + RLS |
| Admin | `/admin/settings/consultation` (mẫu câu hỏi), `/admin/consultations` (SCR-25) + `setConsultationStatus` (không ghi đè) |
| Bệnh nhân | `/courses/consultation` (SCR-20), nút ở trình học / Khóa học của tôi, thẻ chúc mừng cuối khóa + khi còn ≤ 7 ngày; "Phiếu tham vấn của tôi"; `submitConsultationAction` (rate limit 5/ngày) |
| E2E | TC-89 → TC-92 |

#### Đợt 13 – Dashboard tập trung
| Lớp | Thay đổi |
| --- | --- |
| Schema | `dashboard_stats()` (`is_staff`), `revenue_report(from, to)` (`is_admin`), index phục vụ (`registrations (status, access_until)`, `lesson_progress (course_id, completed_at)`) |
| Admin | `/admin` = Tổng quan (SCR-22): `StatCard` link tới danh sách lọc sẵn, việc cần làm, tiến độ theo chương trình, bệnh nhân không tập > 7 ngày; khối doanh thu chỉ admin (theo `dataviz`/design system) |
| E2E | TC-93, TC-94 |

### 3.2. Rủi ro kế hoạch v0.2

| Rủi ro | Ảnh hưởng | Giảm thiểu |
| --- | --- | --- |
| Thay đổi RLS `lessons` (ẩn `video_url`) làm hỏng trang cũ | Bệnh nhân không xem được video | Làm trọn trong Đợt 10 cùng trình học mới; E2E RLS cho anon / bệnh nhân / staff |
| Tính hạn cộng dồn sai khi duyệt đồng thời | Sai hạn học | Advisory lock trong trigger; TC-76 duyệt song song |
| Nhân viên cấp gói không có chứng từ | Thất thoát | Bắt buộc số tiền + hình thức, ghi người tạo, doanh thu theo nhân viên (Đợt 13) |
| Bỏ tick làm khóa lại buổi sau, bệnh nhân bối rối | Hỗ trợ tăng | Hộp xác nhận trước khi bỏ tick; nêu rõ lý do khóa |
| E2E vẫn chạy trên database thật (chưa có staging) | Dữ liệu test lẫn dữ liệu thật | Hiện toàn bộ là dữ liệu test; vẫn khuyến nghị A-1 trước Đợt 9 |

## 4. Danh mục tính năng mở rộng

| ID | Hạng mục | Story | Giá trị | Công sức | Đợt gợi ý |
| --- | --- | --- | --- | --- | --- |
| R-01 | Thông báo khi đơn được duyệt / từ chối | US-09.01 | Cao | S | Sau v0.2 |
| R-02 | Nhân viên cấp lại mật khẩu bệnh nhân | US-14.04 | Cao | XS | 11 |
| R-05 | ✅ Lý do từ chối + lịch sử xử lý đơn + người xử lý | ~~US-09.05~~, ~~09.06~~ | Cao | S | ✅ Đợt 3 |
| R-06 | Phân trang, lọc, xuất Excel đơn | US-09.07 | Trung bình | S | Sau v0.2 |
| R-07 | Báo cáo doanh thu | US-16.03 | Trung bình | S | 13 (dashboard) |
| R-03 | Ảnh bìa khóa học | US-11.02 | Cao | S | 8 |
| R-04 | Tiến độ học (checklist buổi, %) | EP-13 | Cao | M | 10 |
| R-09 | Chia chương (= buổi), sắp xếp bằng ↑↓ | US-13.02 | Cao | M | 10 |
| R-12 | Vai trò nhân viên | EP-10 | Cao | S | 7 |
| R-11 | Cấu hình trung tâm trên giao diện | — | Thấp | S | Sau v0.2 |
| R-13 | Mã giảm giá / combo khóa học | — | Trung bình | M | Sau v0.2 |
| R-08 | Xác nhận thanh toán tự động (webhook ngân hàng) | US-09.09 | Rất cao | L | Sau v0.2 |
| R-10 | Video riêng tư (chống chia sẻ) | — | Cao | L | Sau v0.2 |

---

## R-01 – Thông báo khi đơn được xử lý
- **Thiết kế**: trong `setRegistrationStatus`, sau khi update thành công và `status ∈ {approved, rejected}`, lấy email thật từ `registrations.email`
  → gửi qua `sendMail` (mẫu mới trong `lib/mailer.ts`: `approvedEmail(courseTitle, link)`, `rejectedEmail(courseTitle, note)`).
- Gửi thất bại **không** được làm hỏng thao tác duyệt (try/catch, chỉ ghi log).
- Học viên không có email: hiển thị nút "Gọi" / "Nhắn Zalo" trong bảng admin (đã có link `tel:`). Mở rộng Zalo OA ZNS nếu cần (tốn phí).
- Test: E2E đọc outbox sau khi duyệt.

## R-02 – Admin đặt lại mật khẩu
- Action `adminResetPassword(userId, formData)` → `requireAdmin()` → `createAdminClient().auth.admin.updateUserById(userId, { password })`.
- UI: trong `/admin/users`, mỗi dòng có "Đặt lại mật khẩu" (form nhỏ + xác nhận). Không hiển thị mật khẩu cũ.
- Ghi audit (R-05).

## R-03 – Ảnh bìa khóa học
- Cột `courses.cover_image` đã có. Tạo bucket **public** `course-covers` (policy insert/update/delete: `is_admin()`).
- Admin upload trong `CourseFields`; lưu URL public; trang chủ dùng `next/image` (thêm domain Supabase vào `images.remotePatterns`).

## R-04 – Tiến độ học
```sql
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
create policy "progress_own" on public.lesson_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
- Nút "Đánh dấu đã học" ở SCR-09; ✓ trong danh sách bài; % ở thẻ khóa (SCR-07); "Tiếp tục học" mở bài chưa học đầu tiên.

## R-05 – Lý do từ chối & người duyệt
- ✅ Người xử lý: cột `reviewed_by`, `reviewed_by_name` do trigger `registrations_stamp_review` ghi; bảng admin có cột "Người xử lý".
- Còn lại: cột `review_note text` (xem database-design §9); form Từ chối/Thu hồi có ô lý do.
- Học viên thấy lý do ở "Đơn chưa được xác nhận".
- ✅ Đợt 3: bảng `registration_events` do trigger `registrations_stamp_review` ghi (RK-12); cột `review_note`, ô lý do khi Từ chối/Thu hồi, học viên thấy lý do.
- ✅ Chống ghi đè khi 2 admin cùng xử lý (RK-11); nhật ký phân quyền `role_events` (RK-13).
- Mở rộng sau: bảng `audit_log(actor, action, entity, entity_id, data jsonb, created_at)` cho khóa học, bài học, phân quyền.

## R-06 – Phân trang, lọc, xuất Excel
- Query param `?page=&course=&from=&to=&q=`; dùng `.range()` + `count: 'exact'`.
- Xuất CSV qua Route Handler `app/admin/export/route.ts` (kiểm tra admin, stream CSV UTF-8 BOM để Excel đọc đúng tiếng Việt).

## R-07 – Báo cáo doanh thu
- View SQL (chỉ admin đọc qua hàm `security definer` hoặc RLS):
```sql
create or replace view public.revenue_by_month as
select date_trunc('month', r.reviewed_at) as month, c.title, count(*) as orders, sum(c.price) as revenue
from public.registrations r join public.courses c on c.id = r.course_id
where r.status = 'approved' group by 1, 2;
```
- ✅ `registrations.amount` (giá lúc đăng ký) đã có (RV-02): báo cáo dùng `sum(r.amount)` và `r.course_title`, không join giá hiện tại; tính cả đơn của khóa đã xóa.
- Trang `/admin/reports` với biểu đồ (tuân theo design system).

## R-08 – Xác nhận thanh toán tự động
- Dùng dịch vụ đọc biến động số dư (Casso, SePay, PayOS) → webhook `POST app/api/webhooks/bank/route.ts`.
- Xác thực chữ ký/secret header → trích SĐT từ nội dung chuyển khoản → tìm đơn `pending` có `phone` khớp và số tiền ≥ giá → `approved`, `reviewed_by = null`, `reviewed_by_name = 'Hệ thống'` (sửa trigger, RK-15), `review_note = 'Tự động: <mã GD>'`.
- Lưu giao dịch vào bảng `bank_transactions` (idempotent theo mã giao dịch).
- Không khớp → giữ `pending` cho admin xử lý tay. Ảnh chuyển khoản có thể trở thành tùy chọn.
- Nên đổi nội dung chuyển khoản sang **mã đơn ngắn** (VD `HV1234`) để khớp chính xác hơn SĐT.

## R-09 – Kéo thả bài học, chia chương
- Bảng `sections(id, course_id, title, sort_order)`, `lessons.section_id` nullable.
- Kéo thả: client component, gửi mảng `id` theo thứ tự → action cập nhật `sort_order` hàng loạt (RPC `reorder_lessons(ids uuid[])`).

## R-10 – Video riêng tư
- Chuyển sang Bunny Stream / Cloudflare Stream / Mux; lưu `video_provider`, `video_id` thay vì URL công khai.
- Server tạo **signed URL/token ngắn hạn** chỉ khi `has_course_access` đúng; `lib/video.ts` trả về iframe/player tương ứng.
- Thêm watermark động (tên/SĐT học viên) để giảm quay màn hình.

## R-11 – Cấu hình trên giao diện
- Bảng `settings(key text primary key, value jsonb)`; RLS: đọc công khai các key không nhạy cảm, ghi `is_admin()`.
- Chuyển hotline, Zalo, ngân hàng, thông tin bác sĩ từ `site-config.ts` sang bảng; cache bằng `unstable_cache` + `revalidateTag('settings')`.

## R-12 – Vai trò nhân viên
- ➜ Thiết kế chốt ở **ADR-011** (Đợt 7): `is_staff()` thay cho `has_role(...)`; `requireStaff()` bên cạnh `requireAdmin()`.
- Staff: duyệt đơn, tạo/sửa bệnh nhân, cấp gói, cấp lại mật khẩu, phiếu tham vấn, lead, dashboard không doanh thu; không sửa khóa học, không phân quyền.
- Nền đã có (Đợt 3): nút cấp/gỡ quyền ở `/admin/users`, trigger `profiles_guard_role`, `role_events` → thay bằng ô chọn vai trò.

## R-13 – Mã giảm giá / combo
- Bảng `coupons(code, percent|amount, valid_from, valid_to, max_uses, course_ids uuid[])`.
- `registrations.amount`, `coupon_code`; QR dùng số tiền sau giảm; server tính lại giá, không tin client.
