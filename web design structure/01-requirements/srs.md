# Đặc tả yêu cầu phần mềm (SRS)

Tài liệu tuân theo cấu trúc rút gọn của IEEE 830 / ISO/IEC/IEEE 29148.
Mức ưu tiên theo MoSCoW: **M** (Must), **S** (Should), **C** (Could), **W** (Won't – hiện tại).
Trạng thái: ✅ đã triển khai · 🟡 một phần · ⬜ chưa làm.

## 1. Giới thiệu

- **Mục đích**: mô tả đầy đủ hành vi mong đợi của hệ thống để làm căn cứ phát triển, kiểm thử, nghiệm thu.
- **Phạm vi**: xem [project-overview.md](../00-overview/project-overview.md#4-phạm-vi).
- **Tác nhân (Actors)**:
  - **Khách** – chưa đăng nhập.
  - **Học viên** – đã đăng nhập, `role = user`.
  - **Admin** – đã đăng nhập, `role = admin`. Từ v0.2: quyền cao nhất, toàn quyền.
  - **Staff** *(v0.2)* – nhân viên, `role = staff`: duyệt đơn, tạo tài khoản bệnh nhân, cấp gói, theo dõi, xử lý phiếu tham vấn và lead (ADR-011).
  - **Hệ thống** – server Next.js, Supabase, dịch vụ email.

> Từ v0.2, học viên được gọi là **bệnh nhân** trên giao diện. Yêu cầu v0.2 ở §2.11 → §2.19 (✅ đã triển khai Đợt 7 → 13, 27/09/2026);
> các FR cũ bị thay đổi được liệt kê ở §2.20.

## 2. Yêu cầu chức năng (FR)

### 2.1. Trang công khai (Landing)

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-001 | Trang chủ `/` hiển thị: hero, giới thiệu bác sĩ, vấn đề thường gặp, lợi ích, danh sách khóa học, box đăng ký, FAQ, CTA, footer liên hệ | M | ✅ |
| FR-002 | Danh sách khóa học chỉ gồm khóa `published`, sắp theo `sort_order` tăng dần, hiển thị tên, mô tả (tối đa 3 dòng), giá | M | ✅ |
| FR-003 | Giá `0` hiển thị "Liên hệ"; giá > 0 hiển thị định dạng `1.500.000đ` | M | ✅ |
| FR-004 | Nút "Đăng ký" của mỗi khóa chuyển tới `/?course=<id>#dang-ky`, cuộn tới box đăng ký và chọn sẵn khóa đó | M | ✅ |
| FR-005 | Khi không có khóa nào, hiển thị thông báo kèm hotline | S | ✅ |
| FR-006 | Trên điện thoại có thanh hành động cố định dưới màn hình: "Gọi ngay", "Đăng ký học" | S | ✅ |
| FR-007 | Header có menu neo: Bác sĩ, Khóa học, Cách đăng ký, Liên hệ; menu thu gọn (hamburger) dưới `lg` | M | ✅ |
| FR-008 | Trang chủ và `/register` là trang tĩnh (ISR 300 giây), làm mới ngay khi admin sửa khóa học | S | ✅ |
| FR-009 | SEO/Open Graph: title mẫu `%s \| Trung tâm HV`, mô tả, ảnh chia sẻ, `lang="vi"` | S | ✅ |

### 2.2. Xác thực

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-010 | Đăng nhập `/login` bằng **email hoặc số điện thoại** + mật khẩu | M | ✅ |
| FR-011 | SĐT được chuẩn hóa: chấp nhận khoảng trắng, dấu `.`/`-`/`()`, tiền tố `+84`/`84` | M | ✅ |
| FR-012 | Sai thông tin → thông báo chung "Email/số điện thoại hoặc mật khẩu không đúng." (không tiết lộ tài khoản có tồn tại) | M | ✅ |
| FR-013 | Sau đăng nhập chuyển tới tham số `next` (chỉ đường dẫn nội bộ), mặc định `/courses` | M | ✅ |
| FR-014 | Đăng xuất từ menu Tài khoản, hiện toast, về trang chủ | M | ✅ |
| FR-015 | Truy cập `/courses*`, `/account*` khi chưa đăng nhập → chuyển tới `/login?next=<path>` | M | ✅ |
| FR-016 | Truy cập `/admin*` khi không phải nhân viên / admin → chuyển tới `/courses`; nhân viên vào trang chỉ-admin → `/admin` (Đợt 7) | M | ✅ |

### 2.3. Đăng ký khóa học

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-020 | Box đăng ký 3 bước dùng chung ở `/#dang-ky` và `/register` | M | ✅ |
| FR-021 | Bước 1 hiển thị QR VietQR tự điền **số tiền** theo khóa đã chọn và **nội dung = SĐT** đang nhập; các trường ngân hàng, STK, chủ TK, số tiền, nội dung có nút "Chép" | M | ✅ |
| FR-022 | Bước 2 hướng dẫn chụp ảnh chuyển khoản | M | ✅ |
| FR-023 | Bước 3 – khách: Họ tên*, SĐT*, Email (tùy chọn), Mật khẩu* (≥ 6), Khóa học*, Ảnh chuyển khoản* | M | ✅ |
| FR-024 | Bước 3 – học viên đã đăng nhập: điền sẵn họ tên/SĐT, ẩn email & mật khẩu, hiện "Bạn đang đăng nhập với …" | M | ✅ |
| FR-025 | Ô chọn khóa học chỉ liệt kê khóa `published`, kèm giá | M | ✅ |
| FR-026 | Ảnh chuyển khoản: JPG/PNG/WEBP/HEIC/HEIF; từ chối file khác ngay trên trình duyệt | M | ✅ |
| FR-027 | Nén ảnh trên trình duyệt: cạnh dài ≤ 1600px, JPEG 82%; bỏ qua nếu JPEG ≤ 400KB hoặc trình duyệt không đọc được (HEIC trên Chrome); hiển thị dung lượng trước/sau | S | ✅ |
| FR-028 | Ảnh sau nén > 5MB → báo lỗi, không cho gửi | M | ✅ |
| FR-029 | Server kiểm tra lại toàn bộ dữ liệu (không tin client), khóa học phải tồn tại và `published` | M | ✅ |
| FR-030 | Khách mới: tạo tài khoản Supabase **đã xác nhận email**; không có email thì dùng email nội bộ theo SĐT | M | ✅ |
| FR-031 | Chặn SĐT đã có tài khoản và email đã có tài khoản → hướng dẫn đăng nhập trước | M | ✅ |
| FR-032 | Học viên đã đăng nhập: chặn đăng ký lại khóa đang `pending`; khóa đã `approved` được đăng ký **gia hạn** (Đợt 9, BR-84) | M | ✅ |
| FR-033 | Lưu ảnh vào bucket `payment-proofs` với đường dẫn `<userId>/<uuid>.<ext>` | M | ✅ |
| FR-034 | Tạo đơn `registrations` trạng thái `pending` | M | ✅ |
| FR-035 | Nếu một bước lỗi: xóa ảnh đã upload và tài khoản vừa tạo (rollback) | M | ✅ |
| FR-036 | Thành công: đăng nhập tự động (tài khoản mới), toast "Đã gửi đăng ký thành công!", chuyển tới `/courses?registered=1` | M | ✅ |
| FR-037 | Lỗi: hiển thị thông báo ở đầu Bước 3 và cuộn tới box | M | ✅ |

### 2.4. Quên mật khẩu

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-040 | Trang `/forgot-password` 2 giai đoạn: (1) nhập email/SĐT → gửi mã; (2) nhập mã + mật khẩu mới + nhập lại | M | ✅ |
| FR-041 | Tài khoản không có email thật → báo gọi hotline, không gửi thư | M | ✅ |
| FR-042 | Mã 6 chữ số ngẫu nhiên (CSPRNG), chỉ lưu **SHA-256(userId:code)** | M | ✅ |
| FR-043 | Mã hết hạn sau 10 phút; tối đa 5 lần nhập sai; gửi lại cách nhau ≥ 60 giây; tạo mã mới vô hiệu hóa mã cũ | M | ✅ |
| FR-044 | Hiển thị email đã che (`ab****@gmail.com`) | S | ✅ |
| FR-045 | Đúng mã → đặt mật khẩu mới, đăng nhập luôn, chuyển `/courses` | M | ✅ |
| FR-046 | Gửi email thất bại → xóa mã vừa tạo, báo lỗi | M | ✅ |

### 2.5. Tài khoản của tôi

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-050 | `/account`: sửa họ tên*, SĐT*, email (tùy chọn) | M | ✅ |
| FR-051 | SĐT/email mới không được trùng tài khoản khác | M | ✅ |
| FR-052 | Đổi email đăng nhập tương ứng: có email thật → dùng email thật; xóa email → quay về email nội bộ theo SĐT | M | ✅ |
| FR-053 | Tài khoản chưa có email hiển thị gợi ý thêm email để lấy lại mật khẩu | S | ✅ |
| FR-054 | Đổi mật khẩu: bắt buộc mật khẩu hiện tại đúng, mật khẩu mới ≥ 6 và nhập lại khớp | M | ✅ |

### 2.6. Học tập

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-060 | `/courses` hiển thị 3 nhóm: Đang chờ xác nhận, Khóa học đã mở (kèm số bài), Đơn chưa được xác nhận (bị từ chối, kèm hotline) | M | ✅ |
| FR-061 | Nhân viên, admin vào `/courses` thấy **tất cả** khóa học (xem trước) | S | ✅ |
| FR-062 | `?registered=1` hiển thị banner "Đăng ký thành công!" | S | ✅ |
| FR-063 | `/courses/[courseId]`: có quyền → danh sách bài + "Bắt đầu học"; không có quyền → thông báo khóa chưa mở + nút "Đăng ký khóa học này" | M | ✅ |
| FR-064 | `/courses/[courseId]/[lessonId]`: nhúng video, "Bài x/n", mô tả, danh sách bài bên cạnh, nút Bài trước / Bài tiếp theo | M | ✅ |
| FR-065 | YouTube (`watch?v=`, `youtu.be`, `/shorts/`, `/embed/`) và TikTok (`/video/`, `/embed/v2/`, `/player/v1/`) được chuyển thành link nhúng; Shorts/TikTok hiển thị khung dọc 9:16 | M | ✅ |
| FR-066 | Quyền xem bài học được kiểm soát ở **database** (RLS `has_course_access`) | M | ✅ |

### 2.7. Quản trị – Đơn đăng ký

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-070 | `/admin/registrations` (từ Đợt 7; `/admin?status=` chuyển hướng sang đây) hiển thị bảng đơn với 4 tab: Chờ duyệt (mặc định, cũ nhất trước), Đã duyệt, Từ chối, Tất cả (mới nhất trước) kèm số lượng | M | ✅ |
| FR-071 | Cột: STT, Ảnh chuyển khoản (thumbnail, bấm mở ảnh lớn), Họ tên, Email ("Không có email"), SĐT (link `tel:`), Khóa học (kèm "(khóa học đã xóa)" / "(khóa đang ẩn)" nếu có), Học phí (theo snapshot lúc đăng ký), Ngày đăng ký, Trạng thái, Ngày xử lý, Người xử lý, Thao tác. Họ tên kèm "(tài khoản đã xóa)" nếu có | M | ✅ |
| FR-072 | Cột Thao tác cố định bên phải khi bảng cuộn ngang | S | ✅ |
| FR-073 | Thao tác: Duyệt (khi ≠ approved), Từ chối (khi pending), Thu hồi (khi approved, có hộp xác nhận) | M | ✅ |
| FR-074 | Duyệt/Từ chối/Thu hồi ghi `reviewed_at` và người xử lý (`reviewed_by`, `reviewed_by_name`) bằng trigger; chuyển về pending xóa cả ba | M | ✅ |
| FR-075 | Ảnh chuyển khoản xem qua signed URL hiệu lực 1 giờ | M | ✅ |
| FR-077 | Từ chối / Thu hồi mở ô nhập lý do (tùy chọn) rồi mới xác nhận; học viên thấy lý do | S | ✅ |
| FR-078 | Mỗi đơn có "Lịch sử (n)": người xử lý, trạng thái trước → sau, lý do, thời điểm | S | ✅ |
| FR-079 | Không ghi đè khi 2 admin xử lý cùng một đơn: thao tác từ trang cũ báo "Đơn đã thay đổi (có thể admin khác vừa xử lý), vui lòng tải lại trang." | M | ✅ |
| FR-076 | Giới hạn 200 đơn mỗi lần tải | C | ✅ |

### 2.8. Quản trị – Học viên

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-080 | ✅ Đợt 11: `/admin/patients` (thay `/admin/users`, đường dẫn cũ tự chuyển) liệt kê bệnh nhân (mới nhất trước, tối đa 200 – lọc/tìm để thu hẹp): tên, nguồn Web/Zalo, người tạo, email, SĐT, các khóa + trạng thái + hạn, % tiến độ, ngày tạo; tab "Nhân viên & Admin" (chỉ admin) | M | ✅ |
| FR-081 | Tìm kiếm theo tên / email / SĐT (không phân biệt hoa thường) | M | ✅ |
| FR-082 | Máy tính dạng bảng, điện thoại dạng thẻ | S | ✅ |

### 2.9. Quản trị – Khóa học & bài học

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-090 | `/admin/courses`: danh sách khóa (tên, trạng thái, giá, số bài, số học viên đã duyệt, số đơn chờ) | M | ✅ |
| FR-091 | Thêm khóa: tên*, mô tả, giá (VNĐ, bước 1000), thứ tự, trạng thái | M | ✅ |
| FR-092 | Sửa thông tin khóa; Ẩn/Hiển thị nhanh (ẩn = ngừng nhận đăng ký, học viên đã mua vẫn học); Xóa (có xác nhận, xóa bài học, **giữ đơn đăng ký**) | M | ✅ |
| FR-093 | `/admin/courses/[courseId]`: danh sách bài học, thêm (thứ tự mặc định = số bài + 1), sửa, xóa (có xác nhận), "Xem thử" | M | ✅ |
| FR-094 | Mọi thao tác admin kiểm tra quyền ở server (`requireAdmin`) **và** ở database (RLS) | M | ✅ |
| FR-095 | Thao tác không ảnh hưởng dòng nào → báo "Không tìm thấy dữ liệu, vui lòng tải lại trang." | S | ✅ |
| FR-096 | Validate dữ liệu admin ở server (tên, mô tả, học phí, thứ tự, trạng thái, link video, ID) – xem api-specification §3.6 | M | ✅ |
| FR-097 | Đơn đăng ký lưu snapshot tên khóa & học phí; bảng admin, trang học viên hiển thị "(khóa học đã xóa)" khi khóa không còn | M | ✅ |

### 2.10. Trải nghiệm chung

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-100 | Toast thành công/thất bại sau mọi thao tác (kể cả sau redirect qua cookie flash) | M | ✅ |
| FR-101 | Thanh tiến trình trên đầu trang khi chuyển trang | S | ✅ |
| FR-102 | Nút submit hiển thị vòng xoay & bị vô hiệu khi đang xử lý | M | ✅ |
| FR-103 | Header tô nổi bật trang đang mở (`aria-current="page"`) | S | ✅ |
| FR-104 | Menu Tài khoản: rê chuột (thiết bị có hover) hoặc bấm (cảm ứng); gồm Tài khoản của tôi, Khóa học của tôi, Quản trị (nhân viên, admin), Đăng xuất | M | ✅ |
| FR-105 | Trang 404 tùy biến; trang admin có `loading` và `error` boundary | S | ✅ |

---

## Yêu cầu phiên bản 0.2 (chốt 27/09/2026)

Nguồn: [project-overview §9](../00-overview/project-overview.md#9-định-vị-lại--phiên-bản-02-chốt-27092026). Cột **Đợt** là đợt triển khai trong [roadmap](../10-review/roadmap.md).

### 2.11. Vai trò & phân quyền (ADR-011)

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-110 | Vai trò `user`, `staff`, `admin`. Admin có mọi quyền của staff và thêm: quản lý khóa học/buổi/bài/gói, mẫu phiếu tham vấn, phân quyền, doanh thu | M | 7 | ✅ |
| FR-111 | `/admin/**` cho staff và admin; `/admin/courses/**`, `/admin/settings/**` chỉ admin (staff → `/admin`) | M | 7 | ✅ |
| FR-112 | Menu quản trị và các nút thao tác hiển thị theo vai trò (staff không thấy nút sửa/xóa khóa học, phân quyền, doanh thu) | M | 7 | ✅ |
| FR-113 | Admin đổi vai trò tài khoản bằng ô chọn `Học viên / Nhân viên / Admin` (có xác nhận; "Học viên" đổi thành "Bệnh nhân" ở Đợt 11); không tự đổi quyền mình; luôn còn ≥ 1 admin; ghi `role_events` | M | 7 | ✅ |
| FR-114 | Mọi thao tác kiểm tra vai trò ở server (`requireStaff` / `requireAdmin`) **và** RLS (`is_staff` / `is_admin`) | M | 7 | ✅ |

### 2.12. Danh mục khóa học & trang công khai (ADR-012)

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-120 | Khóa có loại `free` / `program` / `premium`, nhóm bệnh (vẹo lưng / vẹo ngực / không), đối tượng (mặc định bệnh nhân), ảnh bìa, mô tả ngắn, mô tả chi tiết, "Bạn sẽ đạt được" (danh sách) | M | 8 | ✅ |
| FR-121 | Admin tải ảnh bìa (JPG/PNG/WEBP ≤ 2MB, nén ở trình duyệt) vào bucket công khai `course-covers` | M | 8 | ✅ |
| FR-122 | Trang chủ: mục khóa học chia nhóm **Miễn phí** · **Chương trình phục hồi** (lọc vẹo lưng / vẹo ngực) · **Premium chuyên sâu**; thẻ khóa có ảnh bìa, loại, số buổi, giá "từ …đ/tháng" (chương trình), "Miễn phí", giá premium | M | 8 | ✅ Đợt 8: 3 nhóm, lọc, ảnh bìa, nhãn · Đợt 9: "Từ …đ" theo gói rẻ nhất + danh sách gói · Đợt 10: số buổi ở trang giới thiệu (nhãn "Đang học · %" trên thẻ trang chủ: để sau – trang chủ tĩnh) |
| FR-123 | Trang giới thiệu khóa `/khoa-hoc/[courseId]` (công khai, kiểu Udemy): ảnh bìa, mô tả, "Bạn sẽ đạt được", **đề cương** (buổi → tên bài, thu gọn/mở rộng), bác sĩ hướng dẫn, khung giá bên phải (dính khi cuộn) có chọn gói và nút hành động | M | 8 | 🟡 Đợt 8: trang, đề cương phẳng qua `course_outline` (không có link video), khung giá theo học phí khóa · ✅ Đợt 9: chọn gói (`PlanPicker`, mức tiết kiệm so với gói 1 tháng) · ✅ Đợt 10: đề cương theo buổi (`SessionOutline`) |
| FR-124 | Khóa miễn phí: ai cũng xem được video, không cần đăng nhập; đăng nhập thì lưu tiến độ | M | 8 | ✅ Đợt 8: xem không cần đăng nhập · Đợt 10: đăng nhập thì tick / lưu tiến độ, khách thấy "Đăng nhập để lưu tiến độ" |
| FR-125 | Khóa premium: không có đề cương, không nhận đơn; nút "Liên hệ Zalo nhận ưu đãi" (xem §2.17) | M | 8 | ✅ |
| FR-126 | Trang `/chinh-sach-bao-mat`; link ở footer và ở mọi ô đồng ý | M | 8 | ✅ |

### 2.13. Gói, đăng ký & hạn học (ADR-012)

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-130 | Admin quản lý gói cho từng chương trình: 1 / 3 / 6 / 12 tháng, giá, số buổi mở (mặc định 12 × số tháng), bật/tắt bán | M | 9 | ✅ |
| FR-131 | Box đăng ký: chọn **chương trình** rồi **gói**; QR tự điền số tiền theo giá gói; chỉ liệt kê chương trình đang hiển thị có ít nhất 1 gói đang bán | M | 9 | ✅ |
| FR-132 | Ô đồng ý "Tôi đồng ý với Chính sách bảo mật và việc trung tâm xử lý thông tin sức khỏe…" bắt buộc khi khách tạo tài khoản; lưu `consent_at` | M | 8 | ✅ |
| FR-133 | Đơn lưu snapshot gói (`plan_months`, `plan_sessions`, `amount`), `source = web`, `payment_method = bank_transfer` | M | 9 | ✅ |
| FR-134 | Khi duyệt: `access_until` = max(bây giờ, hạn cuối hiện tại) + số tháng của gói (cộng dồn) | M | 9 | ✅ |
| FR-135 | Mỗi bệnh nhân chỉ có 1 đơn **chờ duyệt** cho mỗi chương trình; được đăng ký gia hạn khi đang còn hạn | M | 9 | ✅ |
| FR-136 | "Khóa học của tôi" hiển thị hạn học ("Còn N ngày", cảnh báo vàng ≤ 7 ngày, đỏ khi hết hạn) và nút **Gia hạn** (mở box đăng ký chọn sẵn chương trình) | M | 9 | ✅ |
| FR-137 | Hết hạn: không xem được video, vẫn thấy đề cương, bài đã tick, % tiến độ, nút Gia hạn | M | 9 | ✅ |
| FR-138 | Bảng đơn admin thêm cột Gói, Nguồn (Web / Nhân viên), Hình thức thanh toán, Hạn học | M | 9 | ✅ |

### 2.14. Nội dung buổi – bài tập (quản trị) (ADR-013)

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-140 | Khi tạo khóa (hoặc trên trang nội dung), admin nhập **số buổi** và **số bài mỗi buổi** → hệ thống tạo khung "Buổi 1…N" × "Bài 1…M" (tối đa 200 buổi, 20 bài/buổi) | M | 10 | ✅ |
| FR-141 | Admin thêm / sửa / xóa / đổi thứ tự buổi; thêm / sửa / xóa bài trong buổi; "Sao chép buổi" (nhân bản tên, mô tả, link video các bài) | M | 10 | ✅ |
| FR-142 | Bài tập có tên, mô tả (hướng dẫn, số hiệp/số lần), link video YouTube/TikTok **không bắt buộc**; bài chưa có video được đánh dấu "Chưa có video" ở trang admin | M | 10 | ✅ |
| FR-143 | Trang admin nội dung hiển thị cảnh báo: số bài chưa có video, số buổi ít hơn số buổi của gói dài nhất | S | 10 | ✅ |

### 2.15. Trình học, checklist & tiến độ (ADR-013)

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-150 | Trình học `/courses/[courseId]/[lessonId]` kiểu Udemy: video bên trái, cột **Nội dung khóa học** bên phải gồm các buổi thu gọn/mở rộng, mỗi bài có ô tick; trên điện thoại cột này nằm dưới video (tab "Nội dung") | M | 10 | ✅ |
| FR-151 | Checklist buổi = danh sách bài của buổi; bệnh nhân tick "Đã tập" từng bài (bỏ tick được); tick bài hiện tại tự chuyển sang bài tiếp theo | M | 10 | ✅ |
| FR-152 | Buổi mở lần lượt: buổi k+1 mở khi tick đủ mọi bài của buổi k; buổi bị khóa hiện 🔒 và lý do ("Hoàn thành Buổi k để mở", "Gia hạn để mở"); áp dụng ở database | M | 10 | ✅ |
| FR-153 | Thanh tiến độ nhỏ: "Đã hoàn thành 18/72 bài · 25%" ở trình học, trang khóa, thẻ khóa trong "Khóa học của tôi" | M | 10 | ✅ |
| FR-154 | Nút hành động nổi bật: "Tiếp tục Buổi X – Bài Y" (thẻ khóa, trang khóa), "Hoàn thành & bài tiếp theo" (trình học), "Bắt đầu Buổi X+1" khi xong buổi | M | 10 | ✅ |
| FR-155 | Hoàn thành buổi cuối đã mua: thẻ chúc mừng + nút "Gửi phiếu tham vấn bác sĩ" + "Gia hạn để tập tiếp" | M | 12 | ✅ Đợt 10 (thẻ chúc mừng, Gia hạn) + Đợt 12 (nút "Gửi phiếu tham vấn bác sĩ", `origin=course_end`) |
| FR-156 | Staff/admin xem trước mọi buổi (không bị khóa, không ghi tiến độ) | S | 10 | ✅ |
| FR-157 | Video chỉ đọc được khi `can_view_lesson` đúng (Đợt 10: RLS theo dòng trên `lessons` thay cho RPC `get_lesson_video`, xem ADR-013 §Điều chỉnh); đề cương công khai không chứa link video | M | 10 | ✅ |

### 2.16. Nhân viên tạo tài khoản & cấp gói (luồng Zalo, ADR-014)

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-160 | `/admin/patients/new`: họ tên*, SĐT*, email, ghi chú, "Bệnh nhân đã đồng ý chính sách bảo mật"*; tùy chọn cấp gói: chương trình + gói + số tiền* (mặc định giá gói) + hình thức thanh toán* + ảnh chuyển khoản (tùy chọn) + ghi chú thanh toán | M | 11 | ✅ Đợt 11 – `/admin/patients/new`, `createPatientAction` (số tiền điền sẵn theo giá gói, sửa được) |
| FR-161 | Mật khẩu hệ thống sinh 8 ký tự dễ đọc; hiện **một lần** sau khi tạo, nút "Chép tin nhắn gửi Zalo" | M | 11 | ✅ Đợt 11 – `lib/generate-password.ts`, `OneTimeSecret` |
| FR-162 | Tài khoản tạo bởi nhân viên: `source = zalo`, `created_by`, `must_change_password = true`; đơn cấp gói `approved` ngay, người xử lý = nhân viên | M | 11 | ✅ Đợt 11 – trigger `registrations_stamp_insert` + `registrations_log_insert` (lịch sử `new → approved`) |
| FR-163 | Trang chi tiết bệnh nhân `/admin/patients/[id]`: thông tin, nguồn, người tạo, các gói & hạn học, tiến độ từng khóa, phiếu tham vấn, lịch sử; nút Sửa thông tin, Cấp gói / Gia hạn, Cấp lại mật khẩu | M | 11 | ✅ Đợt 11 – `/admin/patients/[id]` (RPC `patient_progress`); ghi chú nội bộ ở `patient_notes` |
| FR-164 | Cấp lại mật khẩu (staff, admin) cho tài khoản bệnh nhân: sinh mật khẩu mới, hiện một lần, đặt lại cờ đổi mật khẩu | M | 11 | ✅ Đợt 11 – `resetPatientPasswordAction`, ghi `account_events` |
| FR-165 | Đăng nhập với `must_change_password = true`: hộp nhắc "Bạn nên đổi mật khẩu" [Đổi ngay] / [Để sau]; đổi thành công (Supabase Auth) thì tắt cờ | M | 11 | ✅ Đợt 11 – `components/LoginReminders.tsx` ("Để sau" lưu theo phiên trình duyệt); `changePasswordAction` tắt cờ |
| FR-166 | Danh sách bệnh nhân lọc theo nguồn (Web / Zalo), trạng thái gói (đang học / sắp hết hạn / hết hạn / chưa có gói), tìm theo tên/SĐT/email | M | 11 | ✅ Đợt 11 – RPC `admin_patients` (thêm lọc "Không tập > 7 ngày", "Mới 7/30 ngày") |

### 2.17. Phiếu tham vấn & khách quan tâm premium (ADR-015)

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-170 | Admin soạn **mẫu phiếu tham vấn chung**: câu hỏi dạng có/không, thang 0–10, trả lời ngắn; sắp thứ tự, bật/tắt | M | 12 | ✅ Đợt 12 – `/admin/settings/consultation` |
| FR-171 | Bệnh nhân đã đăng nhập gửi phiếu **bất cứ lúc nào**: nút "Gửi phiếu tham vấn" ở trình học, Khóa học của tôi; được nhắc khi hoàn thành buổi cuối đã mua hoặc gói còn ≤ 7 ngày | M | 12 | ✅ Đợt 12 – nút ở trình học, Khóa học của tôi (đầu trang + thẻ khóa còn ≤ 7 ngày), thẻ chúc mừng |
| FR-172 | Phiếu lưu snapshot câu hỏi + câu trả lời, khóa đang học, ghi chú; bệnh nhân xem lại phiếu đã gửi và trạng thái | M | 12 | ✅ Đợt 12 – `answers` jsonb; "Phiếu tham vấn của tôi" qua `my_consultations()` |
| FR-173 | `/admin/consultations`: danh sách phiếu (Mới / Đã liên hệ / Hoàn tất / Hủy), xem câu trả lời, gọi/Zalo bệnh nhân, đổi trạng thái kèm ghi chú nội bộ, người xử lý | M | 12 | ✅ Đợt 12 – `/admin/consultations`, `setConsultationStatus` (không ghi đè) |
| FR-174 | Khóa premium: nút "Liên hệ Zalo nhận ưu đãi" mở hộp Họ tên + SĐT (điền sẵn nếu đăng nhập) → lưu lead → mở Zalo tab mới; nút phụ "Mở Zalo ngay" vẫn lưu lượt bấm ẩn danh | M | 8 | ✅ |
| FR-175 | `/admin/leads`: danh sách lead theo khóa premium, trạng thái Mới / Đã liên hệ / Đã chốt / Đóng, ghi chú, người xử lý; lượt bấm ẩn danh chỉ đếm | M | 8 | ✅ |

### 2.18. Dashboard quản trị tập trung

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-180 | `/admin` là **Tổng quan**; bảng đơn chuyển sang `/admin/registrations` | M | 13 | ✅ Đợt 13 – `/admin` Tổng quan; `/admin?status=` chuyển sang bảng đơn |
| FR-181 | Thẻ chỉ số: tổng bệnh nhân; bệnh nhân mới 7/30 ngày tách theo nguồn Web / Zalo; đơn chờ duyệt; gói đang hiệu lực; gói hết hạn trong 7 ngày; gói đã hết hạn chưa gia hạn; phiếu tham vấn mới; lead premium mới | M | 13 | ✅ Đợt 13 – `dashboard_stats()`, thẻ bấm được tới danh sách lọc sẵn |
| FR-182 | Danh sách việc cần làm: đơn chờ duyệt lâu nhất, bệnh nhân sắp hết hạn (gọi nhắc gia hạn), phiếu tham vấn mới, lead mới, bệnh nhân không tập > 7 ngày | M | 13 | ✅ Đợt 13 |
| FR-183 | Tiến độ bệnh nhân: tiến độ trung bình theo chương trình; danh sách bệnh nhân kèm % và lần tập gần nhất | M | 13 | ✅ Đợt 13 – tiến độ trung bình theo chương trình, danh sách không tập > 7 ngày; % từng bệnh nhân ở `/admin/patients` |
| FR-184 | Chỉ admin: doanh thu tháng này / tháng trước theo chương trình, theo hình thức thanh toán, theo nguồn, theo nhân viên cấp | M | 13 | ✅ Đợt 13 – `revenue_report()` (chỉ admin), theo người duyệt / cấp gói |

### 2.19. Chuyển đổi dữ liệu

| ID | Yêu cầu | Ưu tiên | Đợt | TT |
| --- | --- | --- | --- | --- |
| FR-190 | Khóa hiện có → `kind = program`; bài học hiện có → "Buổi 1"; giá cũ → gói 1 tháng; đơn đã duyệt cũ `access_until = null` (không thời hạn). Dữ liệu hiện tại là dữ liệu test nên có thể xóa trước khi chạy thử | M | 8–10 | ✅ Chuyển đổi trong `schema.sql` (Đợt 8–10) · ⬜ dọn dữ liệu test trước chạy thử (roadmap Đợt 14, bước 2.1 → 2.3) |

### 2.20. FR cũ thay đổi ở v0.2

| FR cũ | Thay đổi | Đợt |
| --- | --- | --- |
| FR-002, FR-003, FR-004 | Danh sách khóa theo 3 nhóm; giá theo gói; "Đăng ký" dẫn tới trang giới thiệu khóa / box đăng ký chọn sẵn chương trình + gói | 8, 9 |
| FR-015, FR-016 | `/courses/[id]/**` không còn bắt đăng nhập ở middleware (khóa miễn phí công khai – Đợt 8); ✅ `/admin` cho cả staff (Đợt 7) | 7, 8 |
| FR-023, FR-025 | ✅ Thêm ô đồng ý (Đợt 8) và chọn gói (Đợt 9) | 8, 9 |
| FR-032 | ✅ Chặn khi có đơn **chờ duyệt**; đã sở hữu thì được gia hạn | 9 |
| FR-061 | ✅ Staff/admin thấy mọi khóa ở "Khóa học của tôi" (xem trước) – làm sớm ở Đợt 7 | 7 |
| FR-063, FR-064, FR-066 | ✅ Đợt 10: trang khóa + trình học theo buổi, quyền theo `can_view_lesson` | 10 |
| FR-063, FR-064 | Thay bằng FR-150 → FR-154 | 10 |
| FR-066 | Quyền xem theo `can_view_lesson` (hạn học + mở tuần tự + khóa miễn phí) | 10 |
| FR-070 → FR-079 | ✅ Đợt 7: chuyển sang `/admin/registrations`; staff được thao tác. `/admin` thành Tổng quan ở Đợt 13 | 7, 13 |
| FR-080 → FR-082 | ✅ Thành "Bệnh nhân" + chi tiết bệnh nhân (FR-163, FR-166) | 11 |
| FR-090 → FR-093 | Thêm loại, nhóm, ảnh bìa, gói, buổi (FR-120, FR-130, FR-140) | 8 → 10 |

### 2.21. Cải tiến giao diện (yêu cầu chủ dự án 29/09/2026 – Đợt 15)

| ID | Yêu cầu | Ưu tiên | Đợt | Trạng thái |
| --- | --- | --- | --- | --- |
| FR-191 | Mọi ô mật khẩu (đăng nhập, đăng ký, quên mật khẩu, tài khoản) có nút con mắt hiện / ẩn mật khẩu; nút không gửi form, có nhãn cho trình đọc màn hình (UI-01) | M | 15 | ✅ |
| FR-192 | Menu quản trị: từ màn hình ≥ 1024px là cột dọc bên trái (dính khi cuộn), nhỏ hơn là hàng tab cuộn ngang; thứ tự Tổng quan · Đơn đăng ký · Bệnh nhân · Khóa học · Phiếu tham vấn · Khách quan tâm · Mẫu phiếu (nhân viên không thấy Khóa học, Mẫu phiếu); số đơn chờ duyệt / phiếu mới / khách mới cạnh mục tương ứng (UI-02) | M | 15 | ✅ |
| FR-193 | Tiến độ học hiển thị bằng vòng tròn % (số % ở giữa, "x/y bài hoàn thành" bên cạnh) ở Khóa học của tôi, trang khóa, trình học, Tổng quan, hồ sơ và danh sách bệnh nhân (UI-03) | M | 15 | ✅ |

## 3. Yêu cầu phi chức năng (NFR)

| ID | Nhóm | Yêu cầu | Cách đáp ứng hiện tại |
| --- | --- | --- | --- |
| NFR-01 | Hiệu năng | Trang chủ tải nhanh trên 4G (LCP < 2,5s) | ISR tĩnh, `next/image` (blur, `sizes`), font `swap`, header đọc phiên ở client |
| NFR-02 | Hiệu năng | Upload ảnh chuyển khoản nhanh | Nén ảnh client (~0,5MB), giới hạn body server action 6MB |
| NFR-03 | Khả dụng | Dùng tốt trên điện thoại (mobile-first) | Tailwind responsive, nút ≥ 44px, `inputMode="tel"`, thanh CTA cố định |
| NFR-04 | Khả năng tiếp cận | WCAG 2.1 AA cơ bản | `label` cho input, `role="alert"/"status"`, `aria-live`, `aria-current`, `prefers-reduced-motion` |
| NFR-05 | Bảo mật | Học viên chỉ thấy dữ liệu của mình; bài học chỉ mở theo khóa đã duyệt | RLS trên mọi bảng, service role chỉ ở server |
| NFR-06 | Bảo mật | Ảnh chuyển khoản không công khai | Bucket private, chỉ admin đọc, signed URL 1 giờ |
| NFR-07 | Bảo mật | Mã đặt lại mật khẩu an toàn | Băm SHA-256, so sánh `timingSafeEqual`, TTL, giới hạn thử |
| NFR-08 | Toàn vẹn | Không để lại dữ liệu rác khi đăng ký lỗi | Rollback thủ công (xóa ảnh, xóa user) |
| NFR-09 | Bảo trì | Schema chạy lại an toàn (idempotent) | `if not exists`, `drop policy if exists`, `on conflict do nothing` |
| NFR-10 | Kiểm thử | Luồng chính có E2E tự động, tự dọn dữ liệu | `npm run test:e2e` |
| NFR-11 | Chi phí | Chi phí hạ tầng giai đoạn đầu ~5 USD/tháng | Video YouTube/TikTok, QR VietQR miễn phí, Supabase Free, Cloudflare Workers Paid (ADR-017) |
| NFR-12 | Bản địa hóa | Tiếng Việt, VNĐ, giờ Việt Nam | `toLocaleString('vi-VN')`, `timeZone: 'Asia/Ho_Chi_Minh'` |
| NFR-13 | Quan sát | Lỗi hiển thị thân thiện cho người dùng | Thông báo tiếng Việt, error boundary admin. *Chưa có logging tập trung* (xem review) |
| NFR-14 | Pháp lý (v0.2) | Dữ liệu sức khỏe (phiếu tham vấn, tiến độ tập) được xử lý có đồng ý, chỉ bệnh nhân đó / staff / admin đọc được | Trang chính sách bảo mật, `consent_at`, RLS (NĐ 13/2023) |
| NFR-15 | Khả dụng (v0.2) | Trình học dùng tốt trên điện thoại bằng một tay; nút tick ≥ 44px | Bố cục mobile-first, thanh tiến độ gọn |
| NFR-16 | Hiệu năng (v0.2) | Trình học mở bài tiếp theo < 1s sau khi tick | Server action + `revalidatePath` theo khóa, tính tiến độ bằng 1 truy vấn |

## 4. Ràng buộc giao diện ngoài

| Hệ thống | Giao tiếp | Ghi chú |
| --- | --- | --- |
| Supabase Auth | `@supabase/ssr` (cookie), `auth.admin.*` (service role) | Email + password |
| Supabase Postgres | PostgREST qua supabase-js, RPC `has_course_access` | |
| Supabase Storage | Bucket `payment-proofs` (private, 5MB, chỉ ảnh) | |
| SMTP | Nodemailer (Node) / `lib/smtp-workers.ts` (Cloudflare Workers, Đợt 17), cổng 465 (SSL) hoặc 587 (STARTTLS) | `MAIL_OUTBOX_URL` gửi tới hộp thư giả khi test |
| VietQR | `https://img.vietqr.io/image/<BIN>-<STK>-compact2.png?amount=&addInfo=&accountName=` | Ảnh tĩnh, không API key |
| YouTube / TikTok | iframe embed | |
