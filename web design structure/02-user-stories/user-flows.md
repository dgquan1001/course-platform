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

## UF-09 *(v0.2)* – Khách từ website

```mermaid
flowchart TD
  A([Trang chủ / TikTok / Facebook]) --> B{Loại khóa}
  B -- Miễn phí --> F[Xem ngay, không cần đăng nhập]
  F --> F1[Gợi ý: đăng ký chương trình / nhắn Zalo]
  B -- Premium --> P[Trang premium: ảnh bìa, thông tin, giá]
  P --> P1[Liên hệ Zalo nhận ưu đãi<br/>lưu lead → mở Zalo] --> Z([Nhân viên tư vấn: UF-10])
  B -- Chương trình --> C[/khoa-hoc/:id: đề cương, gói/]
  C --> D[Chọn gói → box đăng ký<br/>QR theo giá gói, tick đồng ý]
  D --> E[Tài khoản tạo tự động, source = web<br/>đơn pending]
  E --> G{Staff đối chiếu chuyển khoản<br/>có thể gọi điện hướng dẫn}
  G -- Duyệt --> H[access_until = lúc duyệt + số tháng]
  G -- Từ chối kèm lý do --> R[Bệnh nhân thấy lý do, gọi hotline]
  H --> L([Học: UF-12])
```

## UF-10 *(v0.2)* – Khách từ Zalo (nhân viên tạo tài khoản)

```mermaid
sequenceDiagram
  actor K as Khách (Zalo)
  actor S as Nhân viên
  participant W as /admin/patients/new
  participant A as createPatientAction (service role)
  participant DB as Supabase
  K->>S: Hỏi tư vấn, chốt gói, thanh toán (CK / tiền mặt)
  S->>W: Nhập họ tên, SĐT, email?, tick "đã đồng ý", chọn chương trình + gói, số tiền, hình thức
  W->>A: submit
  A->>A: requireStaff, kiểm tra SĐT/email trùng, sinh mật khẩu 8 ký tự
  A->>DB: auth.admin.createUser (email thật hoặc nội bộ)
  A->>DB: profiles: source=zalo, created_by, must_change_password, consent_at
  A->>DB: insert registrations approved, source=staff (trigger: người xử lý, lịch sử, hạn học)
  alt lỗi giữa chừng
    A->>DB: xóa user vừa tạo
    A-->>S: báo lỗi
  else thành công
    A-->>S: Hiện mật khẩu một lần + "Chép tin nhắn gửi Zalo"
    S->>K: Gửi SĐT đăng nhập + mật khẩu + link qua Zalo
    K->>W: Đăng nhập → hộp "Bạn nên đổi mật khẩu" [Đổi ngay] / [Để sau]
  end
```

## UF-11 *(v0.2)* – Gia hạn

```mermaid
flowchart LR
  A{Còn ≤ 7 ngày / đã hết hạn} --> B[Thẻ khóa: "Còn N ngày" / "Đã hết hạn" + Gia hạn]
  A --> S[Dashboard: nhân viên gọi nhắc]
  B --> C[Box đăng ký chọn sẵn chương trình → chọn gói → CK → đơn pending]
  S --> D[Nhân viên cấp gói trên trang bệnh nhân]
  C --> E[Duyệt]
  D --> E
  E --> F[access_until = max(now, hạn cũ) + tháng<br/>số buổi mở += plan_sessions]
  F --> G([Học tiếp từ buổi đang dở])
```

## UF-12 *(v0.2)* – Tập theo buổi

```mermaid
flowchart TD
  A([Khóa học của tôi]) --> B[Thẻ khóa: ảnh bìa, x/y bài · z%, Còn N ngày<br/>Tiếp tục Buổi X – Bài Y]
  B --> C[Trình học: video + cột Nội dung]
  C --> D{Bài thuộc buổi đang mở?}
  D -- Không: buổi trước chưa xong --> D1[🔒 Hoàn thành Buổi k để mở]
  D -- Không: vượt số buổi đã mua / hết hạn --> D2[🔒 Gia hạn để mở]
  D -- Có --> E[Đọc bài – RLS can_view_lesson → phát video]
  E --> F[Hoàn thành & bài tiếp theo → tick]
  F --> G{Buổi đã tick đủ?}
  G -- Chưa --> C
  G -- Rồi --> H{Còn buổi đã mua?}
  H -- Còn --> I[Bắt đầu Buổi k+1] --> C
  H -- Hết --> J[Chúc mừng! Gửi phiếu tham vấn · Gia hạn]
  C -. bất cứ lúc nào .-> K[Gửi phiếu tham vấn: UF-13]
```

## UF-13 *(v0.2)* – Phiếu tham vấn

```mermaid
sequenceDiagram
  actor P as Bệnh nhân
  actor S as Nhân viên
  participant W as Website
  participant DB as Supabase
  P->>W: Bấm "Gửi phiếu tham vấn" (trình học / Khóa học của tôi / thẻ hoàn thành)
  W->>DB: Đọc mẫu câu hỏi đang bật
  P->>W: Trả lời (có/không, thang 0–10, ghi chú) → Gửi
  W->>DB: consultations (snapshot câu hỏi + trả lời), status = new
  S->>W: Dashboard / Phiếu tham vấn: thấy phiếu mới
  S->>P: Gọi / Zalo hẹn tham vấn bác sĩ
  S->>W: Đổi "Đã liên hệ" → "Hoàn tất" + ghi chú nội bộ
  P->>W: Thấy trạng thái phiếu trong "Phiếu tham vấn của tôi"
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
