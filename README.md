# Trung tâm HV – Nền tảng khóa học online

**Holistic Therapy Center for Vietnamese – Trị liệu toàn diện cho người Việt.**
Website bán và dạy khóa học nắn chỉnh, trị liệu cột sống – cơ xương khớp của
Bác sĩ Đỗ Mạnh Cường. Video bài học được nhúng từ YouTube hoặc TikTok.

Công nghệ: Next.js 14 (App Router) + Supabase (Auth, Postgres, Storage) + Tailwind CSS.

> **Định hướng phiên bản 0.2 (chốt 27/09/2026, đang triển khai theo đợt)**: nền tảng chương trình tập luyện, phục hồi chức năng
> cho **bệnh nhân** (vẹo lưng, vẹo ngực) theo gói 1/3/6/12 tháng; khóa miễn phí công khai; khóa premium 1:4 / 1:2 / 1:1 liên hệ Zalo;
> lộ trình theo **buổi → bài tập** mở lần lượt, checklist, % tiến độ; phiếu tham vấn bác sĩ; vai trò **user / staff / admin**;
> nhân viên tạo tài khoản cho khách đến từ Zalo; dashboard quản trị tập trung. Phần "Tính năng" bên dưới mô tả mã nguồn **hiện tại (0.1.0)**.
> Thiết kế và kế hoạch: [`web design structure/10-review/roadmap.md`](web%20design%20structure/10-review/roadmap.md) §3.

## Tính năng

**Học viên**
- Trang giới thiệu (`/`): thông tin trung tâm, bác sĩ, danh sách khóa học kèm giá
  và box đăng ký ngay trên trang (mọi nút "Đăng ký" đều cuộn tới box này)
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
- Khóa học của tôi (`/courses`): khóa đã mở, đơn đang chờ xác nhận, đơn bị từ chối
- Xem bài học: video YouTube/TikTok (tự hiển thị khung dọc cho TikTok/Shorts),
  danh sách bài, nút bài trước/bài tiếp theo
- Học viên đã có tài khoản có thể đăng nhập và đăng ký thêm khóa khác

**Admin** (`/admin`)
- Đơn đăng ký: **bảng** dùng chung cho cả 4 tab Chờ duyệt / Đã duyệt / Từ chối / Tất cả,
  các cột: STT, Ảnh chuyển khoản, Họ và tên, Email, Số điện thoại, Khóa học, Học phí,
  Ngày đăng ký, Trạng thái, Ngày xử lý, Thao tác (Duyệt / Từ chối / Thu hồi). Cột Thao tác
  luôn cố định bên phải khi bảng phải cuộn ngang trên màn hình nhỏ
- Học viên: danh sách tài khoản, số điện thoại, các khóa đã đăng ký và trạng thái, tìm kiếm
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
3. Admin vào `/admin`, xem ảnh chuyển khoản, bấm **Duyệt**
4. Học viên vào **Khóa học của tôi** thấy khóa đã mở và xem được video.
   Quyền xem bài học được kiểm soát theo **từng khóa** bằng Row Level Security
   (hàm `has_course_access`) ngay trong database.

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
| `[Admin]` | Đăng nhập sai/đúng; nút Quản trị được tô nổi bật; tạo khóa (mở/ẩn), bài học; xem ảnh chuyển khoản; duyệt / từ chối / thu hồi; hiển thị "Không có email"; danh sách học viên; ẩn khóa học |

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
      courses/                  Khóa học của tôi, chi tiết khóa, xem bài học
      admin/
        page.tsx                Đơn đăng ký
        users/                  Học viên
        courses/                Khóa học; courses/[courseId] là bài học của từng khóa
        actions.ts              Server action của admin (trả kết quả để hiện toast)
        layout.tsx, AdminNav.tsx, loading.tsx, error.tsx
    components/
      SiteHeader.tsx, SiteFooter.tsx
      Toaster.tsx               Thông báo nổi
      NavigationProgress.tsx    Thanh tiến trình khi chuyển trang
      ActionForm.tsx            Form gọi server action rồi hiện toast
      SubmitButton.tsx          Nút submit có trạng thái đang xử lý / hỏi xác nhận
      StatusBadge.tsx, icons.tsx
    lib/
      site-config.ts            Thông tin thương hiệu, liên hệ, ngân hàng, QR
      auth.ts                   Lấy user hiện tại, kiểm tra quyền admin
      accounts.ts               Tìm tài khoản theo email/SĐT, kiểm tra trùng
      phone.ts                  Chuẩn hóa SĐT, email nội bộ cho tài khoản không email
      mailer.ts                 Gửi email (SMTP) + mẫu email mã đặt lại mật khẩu
      action-result.ts          Kiểu kết quả server action (để hiện toast)
      flash.ts                  Gửi thông báo sang trang tiếp theo sau khi redirect
      video.ts                  Chuyển link YouTube/TikTok sang link nhúng
      supabase/                 Client: server (cookie), client (trình duyệt), public (trang tĩnh), admin (service role)
    middleware.ts               /courses, /account cần đăng nhập; /admin cần quyền admin
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

- Gửi email / Zalo tự động khi đơn được duyệt (đã có sẵn `lib/mailer.ts`)
- Admin đặt lại mật khẩu cho học viên không có email (hiện hướng dẫn gọi hotline)
- Upload ảnh bìa cho khóa học qua Supabase Storage
- Để video YouTube ở chế độ **Unlisted** để tránh bị tìm thấy công khai
