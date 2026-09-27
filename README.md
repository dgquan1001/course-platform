# Trung tâm HV – Nền tảng khóa học online

**Holistic Therapy Center for Vietnamese – Trị liệu toàn diện cho người Việt.**
Website bán và dạy khóa học nắn chỉnh, trị liệu cột sống – cơ xương khớp của
Bác sĩ Đỗ Mạnh Cường. Video bài học được nhúng từ YouTube hoặc TikTok.

Công nghệ: Next.js 14 (App Router) + Supabase (Auth, Postgres, Storage) + Tailwind CSS.

> **Phiên bản 0.2 (27/09/2026 – ✅ code hoàn tất, E2E 96/96)**: nền tảng chương trình tập luyện, phục hồi chức năng
> cho **bệnh nhân** (vẹo lưng, vẹo ngực) theo gói 1/3/6/12 tháng; khóa miễn phí công khai; khóa premium 1:4 / 1:2 / 1:1 liên hệ Zalo;
> lộ trình theo **buổi → bài tập** mở lần lượt, checklist, % tiến độ; phiếu tham vấn bác sĩ; vai trò **bệnh nhân / nhân viên / admin**;
> nhân viên tạo tài khoản cho khách đến từ Zalo; dashboard quản trị tập trung. Bước tiếp theo: **go-live MVP** –
> [`web design structure/10-review/roadmap.md`](web%20design%20structure/10-review/roadmap.md) §3.1.

## Tính năng

**Bệnh nhân / học viên**
- Trang giới thiệu (`/`): thông tin trung tâm, bác sĩ; khóa học chia 3 nhóm **Miễn phí** · **Chương trình phục hồi**
  (lọc vẹo lưng / vẹo ngực) · **Premium** 1:4 / 1:2 / 1:1, có ảnh bìa; box đăng ký ngay trên trang (mọi nút "Đăng ký" đều cuộn tới box này)
- Trang giới thiệu từng khóa (`/khoa-hoc/<id>`): "Bạn sẽ đạt được", đề cương (không lộ link video), bác sĩ hướng dẫn
- Khóa **miễn phí** xem ngay, không cần tài khoản. Khóa **premium**: để lại họ tên + SĐT hoặc bấm "Mở Zalo ngay" →
  website lưu khách quan tâm và mở Zalo của trung tâm
- **Chương trình bán theo gói** 1 / 3 / 6 / 12 tháng (giá riêng từng chương trình): chọn gói ở trang giới thiệu hoặc box đăng ký,
  QR theo giá gói. Hạn học tính từ lúc duyệt; **gia hạn cộng dồn** vào hạn cũ. "Khóa học của tôi" hiện "Còn N ngày", nút Gia hạn;
  hết hạn thì không xem được video nhưng vẫn thấy khóa và danh sách bài
- **Tập theo buổi**: khóa gồm các buổi, mỗi buổi nhiều bài tập. Trình học kiểu Udemy: video + cột nội dung theo buổi, bấm
  "Hoàn thành & bài tiếp theo" để tick bài (bỏ tick được), buổi sau mở khi tick đủ buổi trước, buổi vượt gói đã mua cần gia hạn.
  Thanh tiến độ "x/y bài · %" và nút "Tiếp tục Buổi X – Bài Y" ở trang khóa và "Khóa học của tôi"
- **Chính sách bảo mật** (`/chinh-sach-bao-mat`); khách tạo tài khoản phải tick đồng ý, tài khoản cũ được hỏi một lần khi đăng nhập
- Box đăng ký 3 bước (dùng chung cho trang chủ `#dang-ky` và trang riêng `/register`):
  1. Chuyển khoản: mã QR VietQR tự điền số tiền theo khóa đã chọn + nội dung là SĐT
  2. Chụp lại ảnh chuyển khoản
  3. Điền họ tên, số điện thoại, email (**không bắt buộc**), mật khẩu, chọn khóa học
     (chỉ các khóa đang mở đăng ký), tải ảnh chuyển khoản (JPG/PNG/WEBP/HEIC). Ảnh được
     **nén ngay trên trình duyệt** (tối đa 1600px, JPEG) nên ảnh 10MB chỉ còn khoảng 0,5MB khi upload
- Đăng nhập (`/login`) bằng **email hoặc số điện thoại** (nhận cả dạng `0912 345 678`, `+84912345678`)
- Quên mật khẩu (`/forgot-password`): nhận **mã 6 số qua email**, mã hết hạn sau 10 phút,
  tối đa 5 lần nhập sai, 60 giây mới được gửi lại. Tài khoản không có email được hướng dẫn gọi hotline
- Menu **Tài khoản** trên header (rê chuột trên máy tính, bấm trên điện thoại): Tài khoản
  của tôi, Khóa học của tôi, Quản trị (admin), Đăng xuất
- Tài khoản của tôi (`/account`): sửa họ tên, số điện thoại, thêm/sửa email, đổi mật khẩu
- Khóa học của tôi (`/courses`): khóa đã mở, đơn đang chờ xác nhận, đơn bị từ chối, **Phiếu tham vấn của tôi** (trạng thái)
- **Phiếu tham vấn bác sĩ** (`/courses/consultation`): gửi bất cứ lúc nào (nút ở trình học, Khóa học của tôi, thẻ chúc mừng khi xong
  các buổi đã mở, thẻ khóa còn ≤ 7 ngày): câu Có/Không, thang đau 0–10, trả lời ngắn, ghi chú; tối đa 5 phiếu / ngày
- Tài khoản do nhân viên tạo (khách chốt qua Zalo): đăng nhập bằng SĐT + mật khẩu được cấp, được **nhắc đổi mật khẩu** (không bắt buộc)
- Xem bài học: video YouTube/TikTok (tự hiển thị khung dọc cho TikTok/Shorts),
  danh sách bài, nút bài trước/bài tiếp theo
- Học viên đã có tài khoản có thể đăng nhập và đăng ký thêm khóa khác

**Quản trị** (`/admin`) – vai trò **Admin** (toàn quyền) và **Nhân viên** (vận hành hằng ngày; không sửa khóa học, không phân quyền, không xem doanh thu)
- **Tổng quan** (`/admin`): 8 thẻ chỉ số bấm được (bệnh nhân, mới 30 ngày Web / Zalo, đơn chờ, gói hiệu lực, sắp hết hạn, đã hết hạn,
  phiếu tham vấn mới, khách premium mới), việc cần làm (kèm Gọi / Zalo bệnh nhân sắp hết hạn), tiến độ trung bình theo chương trình,
  bệnh nhân không tập > 7 ngày; **doanh thu** tháng này / tháng trước theo chương trình, hình thức, nguồn, người xử lý (chỉ admin)
- **Bệnh nhân** (`/admin/patients`): lọc nguồn Web / Zalo, trạng thái gói (đang học, sắp hết hạn, hết hạn, không tập > 7 ngày, chưa có gói),
  mới 7 / 30 ngày; % tiến độ, lần tập gần nhất. **Tạo bệnh nhân** cho khách Zalo (mật khẩu tự sinh hiện một lần + nút chép tin nhắn gửi Zalo,
  cấp gói ngay: số tiền, tiền mặt / chuyển khoản / khác, ảnh tùy chọn). **Hồ sơ bệnh nhân**: gói & tiến độ, lịch sử đơn, phiếu tham vấn,
  nhật ký; cấp gói / gia hạn (cộng dồn), sửa thông tin + ghi chú nội bộ, **cấp lại mật khẩu**. Admin đổi vai trò, tab "Nhân viên & Admin"
- **Phiếu tham vấn** (`/admin/consultations`): xem câu trả lời, gọi / Zalo, chuyển Mới → Đã liên hệ → Hoàn tất / Hủy kèm ghi chú nội bộ
  (bệnh nhân không thấy); **Mẫu phiếu** (`/admin/settings/consultation`, chỉ admin): thêm / sửa / bật tắt / sắp xếp câu hỏi
- Đơn đăng ký (`/admin/registrations`, nhân viên và admin): **bảng** dùng chung cho cả 4 tab Chờ duyệt / Đã duyệt / Từ chối / Tất cả,
  các cột: STT, Ảnh chuyển khoản, Họ và tên, Email, Số điện thoại, Khóa học, Học phí,
  Ngày đăng ký, Trạng thái, Ngày xử lý, Thao tác (Duyệt / Từ chối / Thu hồi). Cột Thao tác
  luôn cố định bên phải khi bảng phải cuộn ngang trên màn hình nhỏ
- Khóa học, bài học: **chỉ admin**, danh sách **chia theo loại** (Chương trình / Miễn phí / Premium). Khóa có loại, nhóm bệnh, ảnh bìa
  (nén trên trình duyệt, bucket công khai `course-covers`), mô tả ngắn, "Bạn sẽ đạt được"
- Nội dung khóa (admin): tạo nhanh khung "N buổi × M bài" (khi tạo khóa hoặc ở trang nội dung), thêm / sửa / xóa / đổi thứ tự / sao chép buổi,
  bài tập thuộc buổi, video có thể thêm sau; cảnh báo bài chưa có video, số buổi ít hơn gói dài nhất
- Gói theo thời hạn của từng chương trình (admin): thêm / sửa giá, số buổi, đang bán / xóa; tạo chương trình có học phí tự có gói 1 tháng
  (giá chương trình chỉ sửa ở bảng gói).
  Bảng đơn có cột **Gói** (kèm nguồn, hình thức thanh toán) và **Hạn học**
- Khách quan tâm (`/admin/leads`, nhân viên và admin): khách để lại SĐT ở khóa premium, gọi / nhắn Zalo, cập nhật trạng thái kèm ghi chú
- Khóa học: thêm / sửa / ẩn / hiện / xóa khóa học, đặt giá, xem số học viên.
  **Ẩn** = ngừng nhận đăng ký (học viên đã được duyệt vẫn học bình thường).
  **Xóa** = xóa khóa và bài học, nhưng **giữ nguyên đơn đăng ký** (tên khóa & học phí lúc đăng ký) làm lịch sử thanh toán
- Dữ liệu khóa học / bài học được kiểm tra ở server (tên, học phí 0 – 1 tỷ, link video YouTube/TikTok https)
- Bài học: thêm / sửa / xóa bài học của từng khóa

**Trải nghiệm chung**
- Header tô nổi bật trang đang mở; nút có hiệu ứng nhấn và vòng xoay khi đang xử lý
- Thanh tiến trình trên đầu trang khi chuyển trang
- Thông báo nổi (toast) báo thành công / thất bại sau mỗi thao tác: đăng nhập, đăng ký,
  đăng xuất, duyệt đơn, thêm / sửa / xóa khóa học và bài học

## Cài đặt

### 1. Cài thư viện

    npm install

### 2. Tạo database trên Supabase

1. Vào https://supabase.com, tạo project (hoặc dùng project có sẵn)
2. Vào **SQL Editor**, dán toàn bộ nội dung file `supabase/schema.sql`, bấm **Run**.
   File an toàn khi chạy lại nhiều lần, dùng được cho cả database cũ.

### 3. Cấu hình biến môi trường

Copy `.env.local.example` thành `.env.local`, điền các khóa lấy ở
Supabase > **Project Settings > API**:

| Biến | Ý nghĩa |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khóa `anon` / `publishable` |
| `SUPABASE_SERVICE_ROLE_KEY` | Khóa `service_role` / `secret`. **Bí mật**, chỉ dùng ở server để tạo tài khoản và lưu ảnh chuyển khoản |
| `NEXT_PUBLIC_SITE_URL` | Tên miền khi deploy (VD `https://hv.vn`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Gửi email mã quên mật khẩu (xem bên dưới) |

**Cấu hình gửi email bằng Gmail của trung tâm**

1. Bật **Xác minh 2 bước** cho tài khoản Gmail: https://myaccount.google.com/security
2. Tạo **Mật khẩu ứng dụng**: https://myaccount.google.com/apppasswords (đặt tên "Website HV"),
   Google cấp một mật khẩu 16 ký tự
3. Điền vào `.env.local`:

       SMTP_HOST=smtp.gmail.com
       SMTP_PORT=465
       SMTP_USER=email-cua-trung-tam@gmail.com
       SMTP_PASS=mat-khau-ung-dung-16-ky-tu
       MAIL_FROM=Trung tâm HV <email-cua-trung-tam@gmail.com>

Chưa cấu hình thì trang Quên mật khẩu sẽ báo "Hệ thống chưa cấu hình gửi email".

### 4. Tạo tài khoản admin

    npm run create-admin -- admin@gmail.com MatKhauManh123 "Tên Admin"

Nếu Gmail đã có tài khoản, lệnh sẽ nâng quyền lên admin và đặt lại mật khẩu.

### 5. Chạy

    npm run dev          # môi trường phát triển: http://localhost:3000
    npm run build        # build production
    npm start            # chạy bản production

Đăng nhập bằng tài khoản admin, vào **Quản trị > Khóa học** để thêm khóa học và bài học.

## Luồng hoạt động

1. Học viên dùng box đăng ký (trang chủ `/#dang-ky` hoặc trang `/register`): quét
   QR chuyển khoản, chụp ảnh chuyển khoản, điền thông tin, chọn khóa và tải ảnh lên
2. Server (dùng service role key):
   - tạo tài khoản đã xác nhận (không cần email xác nhận, vì admin duyệt thanh toán).
     Khách **không có email** được tạo tài khoản với email nội bộ `<SĐT>@sdt.hv.invalid`
     (đuôi `.invalid` không bao giờ nhận thư) và đăng nhập bằng số điện thoại; mỗi SĐT
     chỉ gắn với một tài khoản
   - lưu ảnh vào bucket riêng tư `payment-proofs`
   - tạo đơn trong bảng `registrations` với `status = pending`
   - đăng nhập luôn cho học viên và chuyển tới `/courses` để theo dõi trạng thái
   - nếu một bước lỗi, các bước trước được hoàn tác (không để lại tài khoản rác)
3. Nhân viên / admin vào `/admin/registrations`, xem ảnh chuyển khoản, bấm **Duyệt** → database tính hạn học (cộng dồn khi gia hạn)
4. Bệnh nhân vào **Khóa học của tôi** thấy khóa đã mở, tập theo buổi (mở lần lượt). Quyền xem bài học được kiểm soát
   ngay trong database bằng Row Level Security (hàm `can_view_lesson`: hạn học, số buổi đã mua, buổi trước đã tick đủ)
5. Khách chốt qua **Zalo**: nhân viên tạo tài khoản ở `/admin/patients/new`, cấp gói (ghi số tiền, hình thức thanh toán),
   gửi mật khẩu cho khách qua Zalo; khách đăng nhập bằng SĐT và được nhắc đổi mật khẩu
6. Bệnh nhân gửi **phiếu tham vấn** bất cứ lúc nào → nhân viên xem ở `/admin/consultations`, hẹn bác sĩ qua điện thoại / Zalo

Middleware chỉ kiểm tra đăng nhập bằng cookie (không gọi mạng); quyền nhân viên / admin được kiểm tra ở từng trang
(`requireStaffPage` / `requireAdminPage`) và trong database (RLS) – xem ADR-016.

## Kiểm thử end-to-end

Bộ test chạy trên trình duyệt Chrome thật và Supabase thật, tự tạo dữ liệu test
rồi **xóa sạch khi kết thúc** (không đụng tới dữ liệu thật). Script tự khởi động server
ở cổng 3123 với `MAIL_OUTBOX_DIR` (email được ghi ra file thay vì gửi thật) để đọc được
mã quên mật khẩu. Mỗi bước được gắn nhãn theo vai trò:

| Vai trò | Nội dung kiểm tra |
| --- | --- |
| `[Hệ thống]` | Bảng, bucket, trigger; RLS: khách không đọc được bài học, đơn đăng ký, mã đặt lại mật khẩu, khóa đang ẩn; email mã 6 số, mã lưu dạng băm, chặn gửi lại liên tục |
| `[Khách]` | Trang cần đăng nhập bị chặn (`/admin`, `/courses`, `/account`); box đăng ký 3 bước; nút "Đăng ký" cuộn tới form và chọn sẵn khóa; dropdown chỉ có khóa đang mở; QR đúng số tiền; chặn file không phải ảnh; nén ảnh lớn; báo lỗi SĐT sai; đăng ký có email (điện thoại) và **không email** (máy tính); chặn email trùng, SĐT trùng |
| `[Học viên]` | Khóa chưa duyệt bị khóa; không vào được admin; đăng ký thêm khóa khi đã đăng nhập; chặn đăng ký trùng khóa đang chờ; xem video sau khi duyệt; đăng nhập bằng email, bằng SĐT (cả dạng `+84`); menu Tài khoản (rê chuột / bấm); sửa thông tin, thêm email; đổi mật khẩu; quên mật khẩu (không email → báo hotline; có email → mã sai bị chặn, mã đúng đặt được mật khẩu mới, mật khẩu cũ hết hiệu lực) |
| `[Bệnh nhân]` | Gói tháng: hạn học, gia hạn cộng dồn, hết hạn mất video nhưng còn đề cương; buổi mở lần lượt, checklist "Hoàn thành & bài tiếp theo", bỏ tick khóa lại buổi sau, buổi vượt gói cần gia hạn, database chặn tick / đọc video buổi chưa mở; tiến độ + "Tiếp tục Buổi X – Bài Y"; tài khoản Zalo: nhắc đổi mật khẩu; gửi phiếu tham vấn (5 / ngày), không đọc được ghi chú nội bộ / dữ liệu người khác |
| `[Nhân viên]` | Menu quản trị đúng quyền, bị chặn trang chỉ admin, duyệt đơn, xử lý khách quan tâm premium, xem trước mọi buổi (không tick); tạo bệnh nhân Zalo + cấp gói, hồ sơ bệnh nhân (gia hạn, sửa, cấp lại mật khẩu), lọc bệnh nhân, xử lý phiếu tham vấn, Tổng quan không có doanh thu; không tự nâng quyền / sửa khóa học / sửa tài khoản admin / tạo đơn sai quy tắc qua API |
| `[Admin]` | Đăng nhập sai/đúng; nút Quản trị được tô nổi bật; tạo khóa (miễn phí / chương trình / premium, ảnh bìa, mở/ẩn), khóa theo loại, gói tháng, khung N buổi × M bài, sao chép / xóa / đổi thứ tự buổi, bài học; xem ảnh chuyển khoản; duyệt / từ chối / thu hồi; danh sách bệnh nhân; mẫu phiếu tham vấn; Tổng quan khớp database + doanh thu; xóa khóa / tài khoản vẫn giữ lead, phiếu, đơn |

Lần chạy gần nhất: 27/09/2026, sau Đợt 11 → 13 – **96/96 bước PASS** (chi tiết: `web design structure/08-testing/test-plan.md`).

    npm run build
    npm run test:e2e

Nếu đang chạy `npm run dev` (dev server ghi đè thư mục `.next`), build và test vào thư mục riêng:

    $env:NEXT_DIST_DIR=".next-e2e"; npm run build; npm run test:e2e

Ảnh chụp màn hình được lưu trong `test-results/` (thư mục tự tạo, không commit).

Biến tùy chọn: `E2E_PORT` (mặc định `3123`) và `BROWSER_CHANNEL` (mặc định `chrome`,
máy không có Chrome thì dùng `msedge`). Ví dụ trên Windows PowerShell:

    $env:BROWSER_CHANNEL="msedge"; npm run test:e2e

⚠️ Không đặt `MAIL_OUTBOX_DIR` trên môi trường thật (email sẽ không được gửi đi).

## Tùy chỉnh

- **Thông tin trung tâm, bác sĩ, hotline, email, Zalo, tài khoản ngân hàng**: `lib/site-config.ts`
- **Màu sắc** (xanh nước biển dịu `ocean`, vàng kem `gold`): `tailwind.config.ts`
- **Nút, ô nhập, thẻ dùng chung**: `app/globals.css`
- **Ảnh**: `public/images/`

## Deploy (Vercel)

1. Đẩy code lên GitHub (file `.env.local` đã được bỏ qua, không bị đẩy lên)
2. Vào https://vercel.com, **Import** repo, thêm các biến môi trường ở bước 3 (gồm cả SMTP), **Deploy**

## Cấu trúc thư mục

    app/
      layout.tsx                Khung chung: font, header, footer, toast, thanh tiến trình
      page.tsx                  Trang giới thiệu + box đăng ký (tĩnh, tự làm mới khi admin sửa khóa học)
      icon.svg, not-found.tsx   Favicon, trang 404
      register/
        page.tsx                Trang đăng ký riêng
        RegisterForm.tsx        Box đăng ký 3 bước (dùng chung với trang chủ), nén ảnh
        actions.ts              Server action: tạo tài khoản, lưu ảnh, tạo đơn
      login/                    Đăng nhập bằng email hoặc số điện thoại
      forgot-password/          Quên mật khẩu: gửi mã qua email, đặt mật khẩu mới
      account/                  Tài khoản của tôi: sửa thông tin, đổi mật khẩu
      chinh-sach-bao-mat/       Chính sách bảo mật
      khoa-hoc/                 Trang giới thiệu khóa công khai, chọn gói, liên hệ Zalo (premium)
      courses/                  Khóa học của tôi, trang khóa, trình học theo buổi, phiếu tham vấn (consultation/)
      admin/
        page.tsx                Tổng quan (dashboard)
        registrations/          Đơn đăng ký
        patients/               Bệnh nhân: danh sách, tạo mới (new/), hồ sơ ([id]/), actions
        consultations/          Phiếu tham vấn
        leads/                  Khách quan tâm premium
        courses/                Khóa học theo loại, gói; courses/[courseId] là buổi – bài (chỉ admin)
        settings/consultation/  Mẫu phiếu tham vấn (chỉ admin)
        users/                  Đường dẫn cũ → patients
        actions.ts              Server action quản trị dùng chung (trả kết quả để hiện toast)
        layout.tsx, AdminNav.tsx, loading.tsx, error.tsx
    components/
      SiteHeader.tsx, SiteFooter.tsx
      Toaster.tsx               Thông báo nổi
      NavigationProgress.tsx    Thanh tiến trình khi chuyển trang
      ActionForm.tsx            Form gọi server action rồi hiện toast
      SubmitButton.tsx          Nút submit có trạng thái đang xử lý / hỏi xác nhận
      StatusBadge.tsx, icons.tsx
      LoginReminders.tsx        Hộp đồng ý chính sách / nhắc đổi mật khẩu sau đăng nhập
      OneTimeSecret.tsx         Mật khẩu hiện một lần + tin nhắn gửi Zalo
      StatCard.tsx, ProgressBar.tsx, SessionOutline.tsx, CourseCard.tsx, CourseCover.tsx, ProgramGrid.tsx
    lib/
      site-config.ts            Thông tin thương hiệu, liên hệ, ngân hàng, QR
      auth.ts                   User hiện tại (cache theo request), kiểm tra quyền cho action và trang
      use-profile.ts            Profile dùng chung phía trình duyệt (header, hộp nhắc)
      generate-password.ts      Mật khẩu hệ thống sinh (chỉ server)
      courses.ts, progress.ts, consultation.ts, format.ts   Nghiệp vụ khóa – gói – buổi, tiến độ, phiếu tham vấn, định dạng
      accounts.ts               Tìm tài khoản theo email/SĐT, kiểm tra trùng
      phone.ts                  Chuẩn hóa SĐT, email nội bộ cho tài khoản không email
      mailer.ts                 Gửi email (SMTP) + mẫu email mã đặt lại mật khẩu
      action-result.ts          Kiểu kết quả server action (để hiện toast)
      flash.ts                  Gửi thông báo sang trang tiếp theo sau khi redirect
      video.ts                  Chuyển link YouTube/TikTok sang link nhúng
      supabase/                 Client: server (cookie), client (trình duyệt), public (trang tĩnh), admin (service role)
    middleware.ts               /courses, /account, /admin cần đăng nhập (đọc cookie, không gọi mạng); quyền kiểm tra ở trang
    public/images/              Ảnh bác sĩ, ảnh giới thiệu trung tâm
    supabase/schema.sql         Toàn bộ bảng, RLS, trigger, storage bucket
    scripts/
      create-admin.mjs          Tạo / nâng quyền tài khoản admin
      e2e.mjs                   Kiểm thử end-to-end
      env.mjs                   Đọc .env.local cho các script

## Tài liệu thiết kế

Bộ tài liệu đầy đủ (yêu cầu, user story, kiến trúc, database, API, UI/UX, bảo mật, kiểm thử, vận hành, review):
[`web design structure/README.md`](web%20design%20structure/README.md).

## Gợi ý mở rộng

Danh sách ưu tiên sau khi go-live: `web design structure/10-review/roadmap.md` §3.2. Tóm tắt:
- Thông báo email / Zalo khi đơn được duyệt, khi có phiếu tham vấn / khách premium mới (đã có sẵn `lib/mailer.ts`)
- Giám sát lỗi, sao lưu ảnh chuyển khoản; staging + CI chạy E2E
- Phân trang, xuất Excel đơn / bệnh nhân / doanh thu
- Để video YouTube ở chế độ **Unlisted** để tránh bị tìm thấy công khai
