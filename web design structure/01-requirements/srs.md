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
  - **Admin** – đã đăng nhập, `role = admin`.
  - **Hệ thống** – server Next.js, Supabase, dịch vụ email.

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
| FR-016 | Truy cập `/admin*` khi không phải admin → chuyển tới `/courses` | M | ✅ |

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
| FR-032 | Học viên đã đăng nhập: chặn đăng ký lại khóa đang `pending` hoặc đã `approved` | M | ✅ |
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
| FR-061 | Admin vào `/courses` thấy **tất cả** khóa học | S | ✅ |
| FR-062 | `?registered=1` hiển thị banner "Đăng ký thành công!" | S | ✅ |
| FR-063 | `/courses/[courseId]`: có quyền → danh sách bài + "Bắt đầu học"; không có quyền → thông báo khóa chưa mở + nút "Đăng ký khóa học này" | M | ✅ |
| FR-064 | `/courses/[courseId]/[lessonId]`: nhúng video, "Bài x/n", mô tả, danh sách bài bên cạnh, nút Bài trước / Bài tiếp theo | M | ✅ |
| FR-065 | YouTube (`watch?v=`, `youtu.be`, `/shorts/`, `/embed/`) và TikTok (`/video/`, `/embed/v2/`, `/player/v1/`) được chuyển thành link nhúng; Shorts/TikTok hiển thị khung dọc 9:16 | M | ✅ |
| FR-066 | Quyền xem bài học được kiểm soát ở **database** (RLS `has_course_access`) | M | ✅ |

### 2.7. Quản trị – Đơn đăng ký

| ID | Yêu cầu | Ưu tiên | TT |
| --- | --- | --- | --- |
| FR-070 | `/admin` hiển thị bảng đơn với 4 tab: Chờ duyệt (mặc định, cũ nhất trước), Đã duyệt, Từ chối, Tất cả (mới nhất trước) kèm số lượng | M | ✅ |
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
| FR-080 | `/admin/users` liệt kê tài khoản (mới nhất trước, tối đa 500): tên, badge Admin, email, SĐT, các khóa đã đăng ký + trạng thái, ngày tạo | M | ✅ |
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
| FR-104 | Menu Tài khoản: rê chuột (thiết bị có hover) hoặc bấm (cảm ứng); gồm Tài khoản của tôi, Khóa học của tôi, Quản trị (admin), Đăng xuất | M | ✅ |
| FR-105 | Trang 404 tùy biến; trang admin có `loading` và `error` boundary | S | ✅ |

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
| NFR-11 | Chi phí | Chạy trên gói miễn phí | Video YouTube/TikTok, QR VietQR miễn phí, Supabase/Vercel free tier |
| NFR-12 | Bản địa hóa | Tiếng Việt, VNĐ, giờ Việt Nam | `toLocaleString('vi-VN')`, `timeZone: 'Asia/Ho_Chi_Minh'` |
| NFR-13 | Quan sát | Lỗi hiển thị thân thiện cho người dùng | Thông báo tiếng Việt, error boundary admin. *Chưa có logging tập trung* (xem review) |

## 4. Ràng buộc giao diện ngoài

| Hệ thống | Giao tiếp | Ghi chú |
| --- | --- | --- |
| Supabase Auth | `@supabase/ssr` (cookie), `auth.admin.*` (service role) | Email + password |
| Supabase Postgres | PostgREST qua supabase-js, RPC `has_course_access` | |
| Supabase Storage | Bucket `payment-proofs` (private, 5MB, chỉ ảnh) | |
| SMTP | Nodemailer, cổng 465 (SSL) hoặc 587 | `MAIL_OUTBOX_DIR` ghi file khi test |
| VietQR | `https://img.vietqr.io/image/<BIN>-<STK>-compact2.png?amount=&addInfo=&accountName=` | Ảnh tĩnh, không API key |
| YouTube / TikTok | iframe embed | |
