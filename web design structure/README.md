# Bộ tài liệu thiết kế – Trung tâm HV Course Platform

Bộ tài liệu này mô tả **toàn bộ** hệ thống website bán & dạy khóa học online của Trung tâm HV
(Holistic Therapy Center for Vietnamese), từ nghiệp vụ, user story, kiến trúc, database,
API, UI/UX, bảo mật, kiểm thử đến vận hành. Mục tiêu: người mới (dev, BA, designer, tester)
đọc xong có thể **sửa, mở rộng hoặc viết lại** hệ thống mà không phải đoán ý đồ thiết kế.

> Tài liệu được viết dựa trên mã nguồn thực tế (bản 0.1.0 ngày 26/09/2026, cập nhật tới **v0.2 – 27/09/2026**).
> Khi code thay đổi, **cập nhật tài liệu trong cùng một lần commit** (xem mục "Quy tắc cập nhật").
>
> **v0.2 (27/09/2026) – ✅ đã triển khai toàn bộ (Đợt 7 → 13, E2E 96/96)**: chương trình phục hồi chức năng cho bệnh nhân, gói tháng,
> buổi – bài, checklist, phiếu tham vấn, premium, vai trò nhân viên, luồng web ⇄ Zalo, dashboard. Các phần v0.2 được đánh dấu *(v0.2)*
> kèm đợt triển khai. Hiện trạng + việc tiếp theo: [roadmap §0](10-review/roadmap.md#0-tóm-tắt-hiện-trạng) và
> [project-review §0](10-review/project-review.md#0-tóm-tắt-hiện-trạng-27092026); yêu cầu: [project-overview §9](00-overview/project-overview.md#9-định-vị-lại--phiên-bản-02-chốt-27092026).

## Mục lục

| # | Thư mục / file | Nội dung | Người đọc chính |
| --- | --- | --- | --- |
| 00 | [00-overview/project-overview.md](00-overview/project-overview.md) | Tầm nhìn, phạm vi, stakeholder, công nghệ | Tất cả |
| 00 | [00-overview/glossary.md](00-overview/glossary.md) | Thuật ngữ nghiệp vụ & kỹ thuật | Tất cả |
| 01 | [01-requirements/srs.md](01-requirements/srs.md) | Đặc tả yêu cầu phần mềm: chức năng (FR) & phi chức năng (NFR) | BA, Dev, QA |
| 01 | [01-requirements/business-rules.md](01-requirements/business-rules.md) | Quy tắc nghiệp vụ (BR) | BA, Dev, QA |
| 02 | [02-user-stories/personas.md](02-user-stories/personas.md) | Chân dung người dùng | BA, Designer |
| 02 | [02-user-stories/user-stories.md](02-user-stories/user-stories.md) | Epic, user story, tiêu chí chấp nhận (Given/When/Then) | BA, Dev, QA |
| 02 | [02-user-stories/user-flows.md](02-user-stories/user-flows.md) | Sơ đồ luồng người dùng & vòng đời đơn đăng ký | BA, Designer, Dev |
| 03 | [03-architecture/system-architecture.md](03-architecture/system-architecture.md) | Kiến trúc tổng thể (C4), luồng dữ liệu, chiến lược render | Dev, Tech lead |
| 03 | [03-architecture/source-structure.md](03-architecture/source-structure.md) | Cấu trúc mã nguồn, trách nhiệm từng module | Dev |
| 03 | [03-architecture/adr/](03-architecture/adr/README.md) | Architecture Decision Records – vì sao chọn giải pháp này | Dev, Tech lead |
| 04 | [04-database/database-design.md](04-database/database-design.md) | ERD, từ điển dữ liệu, RLS, hàm, trigger, storage | Dev, DBA |
| 05 | [05-api/api-specification.md](05-api/api-specification.md) | Đặc tả route, middleware, server action, RPC | Dev, QA |
| 06 | [06-ui-ux/sitemap-navigation.md](06-ui-ux/sitemap-navigation.md) | Sitemap, điều hướng, phân quyền theo trang | Designer, Dev |
| 06 | [06-ui-ux/design-system.md](06-ui-ux/design-system.md) | Màu, chữ, khoảng cách, component, trạng thái | Designer, Dev |
| 06 | [06-ui-ux/screen-specifications.md](06-ui-ux/screen-specifications.md) | Đặc tả & wireframe từng màn hình | Designer, Dev, QA |
| 07 | [07-security/security-design.md](07-security/security-design.md) | Xác thực, phân quyền, ma trận quyền, threat model | Dev, Tech lead |
| 08 | [08-testing/test-plan.md](08-testing/test-plan.md) | Chiến lược kiểm thử, test case, ma trận truy vết | QA, Dev |
| 09 | [09-operations/deployment-runbook.md](09-operations/deployment-runbook.md) | Cài đặt, biến môi trường, deploy, vận hành, sự cố | Dev, DevOps |
| 09 | [09-operations/development-guide.md](09-operations/development-guide.md) | Quy ước code, quy trình thêm tính năng, Git | Dev |
| 10 | [10-review/project-review.md](10-review/project-review.md) | Kết quả review dự án: lỗi, rủi ro, nợ kỹ thuật | Tech lead, PO |
| 10 | [10-review/roadmap.md](10-review/roadmap.md) | Tóm tắt hiện trạng, báo cáo theo đợt, việc chủ dự án, kế hoạch tiếp, checklist, thiết kế sơ bộ R-xx | PO, Tech lead |
| — | [templates/](templates/README.md) | Mẫu: user story, ADR, đặc tả tính năng, bug report, checklist release | Tất cả |

## Thứ tự đọc gợi ý

- **Người mới vào dự án**: 00 → 02 (user-flows) → 03 → 04 → 09/development-guide.
- **Làm tính năng mới**: 10/roadmap → 01 → 02 → dùng `templates/feature-spec.md` → cập nhật 04/05/06/08.
- **Kiểm thử / nghiệm thu**: 02/user-stories (tiêu chí chấp nhận) → 08.
- **Triển khai / vận hành**: 09/deployment-runbook.

## Hệ thống mã định danh (dùng để truy vết)

| Tiền tố | Ý nghĩa | Ví dụ | Định nghĩa tại |
| --- | --- | --- | --- |
| `EP-xx` | Epic | EP-02 Đăng ký khóa học | user-stories.md |
| `US-xx.yy` | User story | US-02.03 Đăng ký không có email | user-stories.md |
| `FR-xxx` | Yêu cầu chức năng | FR-020 Tạo tài khoản khi đăng ký | srs.md |
| `NFR-xx` | Yêu cầu phi chức năng | NFR-05 Bảo mật dữ liệu | srs.md |
| `BR-xx` | Quy tắc nghiệp vụ | BR-07 Mỗi SĐT một tài khoản | business-rules.md |
| `SCR-xx` | Màn hình | SCR-03 Box đăng ký 3 bước | screen-specifications.md |
| `ADR-xxx` | Quyết định kiến trúc | ADR-003 Email nội bộ cho tài khoản SĐT | 03-architecture/adr |
| `TC-xx` | Test case | TC-17 Đăng ký không email | test-plan.md |
| `RV-xx` | Phát hiện khi review | RV-01 Ẩn khóa học khóa luôn học viên cũ | project-review.md |
| `V-xx` | Yêu cầu định vị lại v0.2 | V-02 Gói 1/3/6/12 tháng cộng dồn | project-overview.md §9 |
| `UF-xx` | Luồng người dùng | UF-10 Khách từ Zalo | user-flows.md |
| `RK-xx` | Risk case (review các vòng sau) | RK-34 Nhân viên tự cấp gói cho mình | project-review.md §7 |
| `A-xx` | Việc chủ dự án cần làm | A-7 Duyệt chính sách bảo mật | roadmap.md §2 |
| `G-xx` | Khoảng trống kiểm thử | G-12 Chặn gỡ admin cuối cùng | test-plan.md §4 |

## Quy tắc cập nhật tài liệu

1. Mọi thay đổi hành vi (UI, nghiệp vụ, database, quyền) phải cập nhật tài liệu liên quan **trong cùng PR**.
2. Thay đổi quyết định kiến trúc → thêm ADR mới (không sửa ADR cũ, chỉ đổi trạng thái thành *Superseded*).
3. Thêm cột/bảng/policy → cập nhật `04-database/database-design.md` **và** `supabase/schema.sql`.
4. Thêm user story → gán ID mới, không tái sử dụng ID đã xóa.
5. Ghi lịch sử thay đổi vào bảng "Lịch sử tài liệu" bên dưới.

## Lịch sử tài liệu

| Ngày | Phiên bản | Nội dung | Người thực hiện |
| --- | --- | --- | --- |
| 26/09/2026 | 1.0 | Tạo bộ tài liệu đầy đủ từ mã nguồn phiên bản 0.1.0 | Claude (AI) |
| 26/09/2026 | 1.1 | Cập nhật theo bản sửa RV-01, RV-02, RV-05, RV-09, git init; bảng 46 test case E2E (PASS); risk case RK-01 → RK-10 | Claude (AI) |
| 26/09/2026 | 1.2 | Xử lý RK-01, RK-03, RK-05 (chốt), RK-07, RK-09; thêm người xử lý đơn (`reviewed_by`); TC-47 → TC-54 | Claude (AI) |
| 26/09/2026 | 1.3 | Đợt 3 – nhiều admin: RK-11 (không ghi đè), RK-12 + R-05 (lịch sử xử lý, lý do từ chối), RK-13 (cấp/gỡ quyền admin), RK-14; TC-55 → TC-58 | Claude (AI) |
| 02/10/2026 | 3.4 | **Kế hoạch chạy thử MVP (Đợt 14 viết lại)**: 7 giai đoạn (hạ tầng & cấu hình → dữ liệu sạch → nội dung → nhân viên → nghiệm thu → chạy thử ~4 tuần → đánh giá), mỗi bước có cách làm + tiêu chí "xong khi", nhật ký chạy thử; A-14 ✅ (2 workflow chạy thật), sửa Node 22; việc chủ dự án sắp theo bước, thêm A-17, A-1 staging đề xuất làm trước chạy thử. Runbook §7.1, §10, §10.1; roadmap §0, §1, §2, §3.1, §3.2, §4, §5; project-review §0, §7.8, §8; SRS FR-190; project-overview; database-design; development-guide (Node 22+); README gốc | Claude (AI) |
| 02/10/2026 | 3.3 | **Đợt 16 – Hạ tầng gói Free**: đánh giá hạ tầng cho 100–500 người cùng lúc / 1.000 bệnh nhân, risk case RK-35 → RK-42; chủ dự án chốt thử nghiệm trên Supabase Free + Vercel Hobby, lộ trình chuyển gói theo ngưỡng; `vercel.json` (vùng `sin1`), workflow `keepalive.yml`, `backup.yml`, `scripts/backup-storage.mjs`. Runbook §7.1, §8, §11, §12; roadmap §0, §1, §2 (A-13 → A-16), §3.3, §4, §5; project-review §0, §7.8; source-structure; README gốc | Claude (AI) |
| 29/09/2026 | 3.2 | **Đợt 15 hoàn thành** – UI-01 `PasswordInput` (7 ô mật khẩu), UI-02 sidebar quản trị bên trái + thứ tự mới + số đếm (`NavCount`), UI-03 `ProgressRing` thay `ProgressBar`; E2E **98/98 PASS** (TC-99 → TC-101); SRS FR-191 → 193, design-system §8, screen-specs SCR-04 / SCR-10 / SCR-18, sitemap §4 / §6.3, source-structure, user-stories, test-plan, roadmap, project-review §7.7 | Claude (AI) |
| 29/09/2026 | 3.1 | Review README / roadmap / project-review (sửa link hỏng, câu lỗi thời về giá khóa, trạng thái RK cũ); **kế hoạch Đợt 15 – cải tiến giao diện** UI-01 (icon mắt mật khẩu), UI-02 (menu quản trị dọc bên trái, thứ tự mới), UI-03 (vòng tròn % tiến độ): roadmap §3.0, §4, §5.5; project-review §7.7 | Claude (AI) |
| 27/09/2026 | 3.0 | **Đợt 11 → 13 (làm song song) + cải tiến**: bệnh nhân từ Zalo (tạo tài khoản, mật khẩu một lần, cấp gói, hồ sơ, cấp lại mật khẩu, nhắc đổi mật khẩu), phiếu tham vấn (mẫu câu hỏi, form, xử lý), dashboard + doanh thu; khóa học theo loại; RK-18; **ADR-016** middleware nhẹ; sửa RK-29, RK-34; E2E **96/96** (TC-85 → TC-98). Cập nhật toàn bộ: SRS, BR, user stories, database (§2.9 – 2.12, §3, §4, §7, §10), API, UI, bảo mật (T31, T32), test-plan, ADR-011/014/015, source-structure, system-architecture, runbook, development-guide; **roadmap viết lại** (§0 tóm tắt, §2 việc chủ dự án, §3 go-live MVP + backlog, §7 quy ước cập nhật); project-review §0, §7.6 | Claude (AI) |
| 27/09/2026 | 2.5 | Đợt 10 hoàn thành: E2E **83/83 PASS** (TC-79 → TC-84); sửa RK-27 (admin không thêm được bài), RK-28 (bài chưa thuộc buổi đứng đầu đề cương); đồng bộ tài liệu với ADR-013 §Điều chỉnh (bỏ `get_lesson_video`, `session_position` ở database-design §10, system-architecture §10, UF-12, US-11.04, US-13.04, ma trận quyền); roadmap §1.1, §1.2, §2.5; project-review §7.5 | Claude (AI) |
| 27/09/2026 | 2.4 | Đợt 10 – buổi → bài tập, khung N × M, quản lý buổi, trình học theo buổi, checklist tick, mở buổi lần lượt, % tiến độ; ADR-013 điều chỉnh (RLS theo dòng); roadmap §2.5 **checklist chi tiết theo đợt**; project-review RK-23 → RK-26; TC-79 → TC-84 | Claude (AI) |
| 27/09/2026 | 2.3 | Đợt 9 – gói 1/3/6/12 tháng, chọn gói khi đăng ký, hạn học cộng dồn, gia hạn, "Gói đã hết hạn"; project-review §7.5 (review v0.2 Đợt 7 → 9, RK-16 → RK-21); TC-74 → TC-78, E2E 78/78 PASS; sửa RK-22 (trigger chặn xóa chương trình có đơn) | Claude (AI) |
| 27/09/2026 | 2.2 | Đợt 8 – loại khóa (miễn phí / chương trình / premium), nhóm bệnh, ảnh bìa, trang chủ 3 nhóm, `/khoa-hoc/[id]`, khóa miễn phí công khai, khách quan tâm premium + `/admin/leads`, Chính sách bảo mật + đồng ý; TC-68 → TC-73, E2E 73/73 PASS | Claude (AI) |
| 27/09/2026 | 2.1 | Đợt 7 – vai trò staff: schema (`is_staff`, policy staff, trigger chỉ admin đổi vai trò), `/admin/registrations`, ô chọn vai trò, menu theo quyền; TC-65 → TC-67, E2E 67/67 PASS | Claude (AI) |
| 27/09/2026 | 2.0 | **Định vị lại v0.2** (thiết kế, chưa code): V-01 → V-12; ADR-011 → ADR-015; FR-110 → FR-190, NFR-14 → 16; BR-70 → BR-107; persona P6, P7; EP-10 → EP-16; UF-09 → UF-13; database §10; API §7; sitemap §6; SCR-15 → SCR-28; ma trận quyền 3 vai trò, T24 → T30; TC-65 → TC-94 (dự kiến); runbook §10; roadmap Đợt 7 → 13 kèm kế hoạch code | Claude (AI) |
| 26/09/2026 | 1.4 | Đợt 4 (rào chặn E2E/staging, CI GitHub Actions, index email, mật khẩu ≥ 8) + Đợt 5 (giới hạn tần suất, Turnstile tùy chọn, kiểm tra ảnh theo nội dung, đơn của khóa đã xóa, security headers/CSP); roadmap có báo cáo, checklist, lộ trình theo thứ tự; TC-59 → TC-64 | Claude (AI) |
