# Luồng người dùng (User Flows)

Các sơ đồ dùng Mermaid (xem được trên GitHub, VS Code với extension *Markdown Preview Mermaid Support*).

## UF-01 – Hành trình tổng thể của học viên

```mermaid
journey
  title Từ khách truy cập tới học viên
  section Tìm hiểu
    Xem trang chủ, bác sĩ, khóa học: 4: Khách
    Gọi hotline / Zalo (tùy chọn): 3: Khách
  section Đăng ký
    Chọn khóa, quét QR chuyển khoản: 4: Khách
    Chụp và tải ảnh chuyển khoản: 3: Khách
    Điền thông tin, gửi đơn: 4: Khách
  section Chờ duyệt
    Xem trạng thái "Đang chờ xác nhận": 3: Học viên
    Admin đối chiếu và duyệt: 4: Admin
  section Học
    Vào "Khóa học của tôi", xem video: 5: Học viên
```

## UF-02 – Đăng ký khóa học (khách mới)

```mermaid
flowchart TD
  A([Khách mở / hoặc /register]) --> B{Bấm "Đăng ký" trên thẻ khóa?}
  B -- Có --> C[Cuộn tới #dang-ky, chọn sẵn khóa]
  B -- Không --> D[Chọn khóa ở Bước 3]
  C --> E[Bước 1: Quét QR<br/>số tiền + nội dung = SĐT]
  D --> E
  E --> F[Bước 2: Chụp ảnh giao dịch]
  F --> G[Bước 3: Điền họ tên, SĐT, email?, mật khẩu]
  G --> H[Chọn ảnh]
  H --> I{Là ảnh hợp lệ?}
  I -- Không --> H1[Báo lỗi định dạng] --> H
  I -- Có --> J[Nén ảnh trên trình duyệt]
  J --> K{≤ 5MB?}
  K -- Không --> H2[Báo ảnh quá lớn] --> H
  K -- Có --> L[Bấm Đăng ký → registerAction]
  L --> M{Server kiểm tra hợp lệ<br/>khóa published, SĐT/email chưa dùng}
  M -- Lỗi --> N[Hiện lỗi ở đầu Bước 3, cuộn lên] --> G
  M -- OK --> O[Tạo user đã xác nhận] --> P[Upload ảnh vào payment-proofs]
  P -- Lỗi --> R1[Xóa user] --> N
  P -- OK --> Q[Insert registrations pending]
  Q -- Lỗi --> R2[Xóa ảnh + xóa user] --> N
  Q -- OK --> S[Đăng nhập tự động, flash toast]
  S --> T([/courses?registered=1<br/>"Đang chờ xác nhận"])
```

## UF-03 – Đăng ký thêm khóa (đã đăng nhập)

```mermaid
flowchart TD
  A([Học viên mở box đăng ký]) --> B[Client đọc phiên + profile<br/>điền sẵn họ tên, SĐT]
  B --> C[Ẩn ô email & mật khẩu<br/>"Bạn đang đăng nhập với …"]
  C --> D[Chọn khóa, tải ảnh, gửi]
  D --> E{Đã có đơn pending/approved<br/>cho khóa này?}
  E -- pending --> F[Báo "đang chờ xác nhận"]
  E -- approved --> G[Báo "đã sở hữu khóa học"]
  E -- Không / chỉ rejected --> H[Upload ảnh → tạo đơn pending]
  H --> I([/courses?registered=1])
```

## UF-04 – Đăng nhập

```mermaid
sequenceDiagram
  actor U as Người dùng
  participant P as /login (form)
  participant A as loginAction (server)
  participant DB as Supabase (service role)
  participant AU as Supabase Auth
  U->>P: Nhập email hoặc SĐT + mật khẩu
  P->>A: submit (identifier, password, next)
  A->>DB: findAccount(identifier)<br/>tra profiles theo email hoặc SĐT chuẩn hóa
  DB-->>A: userId → auth email (thật hoặc nội bộ)
  A->>AU: signInWithPassword(authEmail, password)
  alt Sai thông tin
    AU-->>A: error
    A-->>U: redirect /login?error=…&next=…
  else Đúng
    AU-->>A: session (cookie)
    A-->>U: setFlash + redirect next (chỉ đường dẫn nội bộ)
  end
```

## UF-05 – Quên mật khẩu

```mermaid
flowchart TD
  A([/forgot-password]) --> B[Nhập email hoặc SĐT]
  B --> C{Tìm thấy tài khoản?}
  C -- Không --> C1[Báo không tìm thấy] --> B
  C -- Có --> D{Có email thật?}
  D -- Không --> D1[Báo gọi hotline] --> Z([Kết thúc])
  D -- Có --> E{Lần gửi trước < 60s?}
  E -- Có --> E1[Báo đợi N giây] --> B
  E -- Không --> F[Vô hiệu mã cũ, tạo mã 6 số,<br/>lưu SHA-256, hạn 10 phút]
  F --> G{Gửi email OK?}
  G -- Không --> G1[Xóa mã, báo lỗi] --> B
  G -- Có --> H[Giai đoạn 2: nhập mã + mật khẩu mới]
  H --> I{Mã còn hạn & attempts < 5?}
  I -- Không --> I1[Yêu cầu gửi lại mã] --> B
  I -- Có --> J{Mã đúng?}
  J -- Không --> J1[attempts+1, báo còn N lần] --> H
  J -- Có --> K[Đánh dấu used_at, đổi mật khẩu,<br/>đăng nhập, flash]
  K --> L([/courses])
```

## UF-06 – Admin duyệt đơn

```mermaid
sequenceDiagram
  actor AD as Admin
  participant PG as /admin (Server Component)
  participant ST as Supabase Storage
  participant ACT as setRegistrationStatus
  participant DB as Postgres (RLS)
  AD->>PG: Mở tab "Chờ duyệt"
  PG->>DB: select registrations (RLS: is_admin) + đếm 3 trạng thái
  PG->>ST: createSignedUrls(ảnh, 3600s)
  PG-->>AD: Bảng đơn + thumbnail
  AD->>AD: Đối chiếu ảnh với sao kê (nội dung = SĐT, số tiền)
  AD->>ACT: Bấm "Duyệt"
  ACT->>ACT: requireAdmin()
  ACT->>DB: update status='approved', reviewed_at=now()
  DB-->>ACT: 1 dòng
  ACT->>ACT: revalidatePath('/', 'layout')
  ACT-->>AD: toast "Đã duyệt đơn…"
  Note over DB: Từ lúc này has_course_access() = true<br/>học viên xem được bài học
```

## UF-07 – Học bài

```mermaid
flowchart LR
  A([Header › Tài khoản › Khóa học của tôi]) --> B[/courses/]
  B --> C[/courses/:courseId/]
  C -->|has_course_access = false| C1[Thông báo chưa mở + Đăng ký khóa này]
  C -->|true| D[Bắt đầu học]
  D --> E[/courses/:courseId/:lessonId/]
  E --> F[Video + mô tả + danh sách bài]
  F -->|Bài tiếp theo| E
```

## UF-08 – Admin quản lý nội dung

```mermaid
flowchart TD
  A([/admin/courses]) --> B[Thêm khóa học<br/>form bên phải]
  A --> C[Sửa thông tin / Ẩn-Hiện / Xóa]
  A --> D[Quản lý bài học]
  D --> E([/admin/courses/:courseId])
  E --> F[Thêm bài: tên, link video, mô tả, thứ tự]
  E --> G[Sửa / Xóa bài]
  E --> H[Xem thử → /courses/:courseId/:lessonId]
  B & C & F & G --> R[revalidatePath → trang chủ cập nhật ngay]
```
