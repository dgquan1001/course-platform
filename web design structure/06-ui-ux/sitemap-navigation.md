# Sitemap & điều hướng

## 1. Sitemap

```mermaid
flowchart TB
  root["/ Trang chủ"]
  root --> s1["#bac-si"]
  root --> s2["#khoa-hoc"]
  root --> s3["#dang-ky (box đăng ký)"]
  root --> s4["#lien-he (footer)"]
  root --> reg["/register"]
  root --> login["/login"]
  login --> fp["/forgot-password"]

  subgraph Học viên – cần đăng nhập
    acc["/account"]
    crs["/courses"]
    cd["/courses/:courseId"]
    ls["/courses/:courseId/:lessonId"]
    crs --> cd --> ls
  end

  subgraph Admin – cần role admin
    adm["/admin (Đơn đăng ký)"]
    au["/admin/users"]
    ac["/admin/courses"]
    acl["/admin/courses/:courseId"]
    ac --> acl
  end

  login --> crs
  reg --> crs
```

## 2. Ma trận truy cập trang

| Trang | Khách | Học viên | Admin | Hành vi khi không đủ quyền |
| --- | --- | --- | --- | --- |
| `/`, `/register`, `/login`, `/forgot-password` | ✅ | ✅ | ✅ | — |
| `/account`, `/courses` | ❌ | ✅ | ✅ | → `/login?next=…` |
| `/courses/:id` | ❌ | ✅ (thông báo "chưa mở" nếu chưa được duyệt) | ✅ | → `/login?next=…`; khóa ẩn → 404 |
| `/courses/:id/:lessonId` | ❌ | ✅ nếu được duyệt khóa | ✅ | Thông báo "Không tìm thấy bài học hoặc khóa học chưa được mở" |
| `/admin/**` | ❌ | ❌ | ✅ | Khách → `/login`; học viên → `/courses` |

## 3. Header (`components/SiteHeader.tsx`)

| Vùng | Máy tính (≥ lg) | Điện thoại / tablet (< lg) |
| --- | --- | --- |
| Logo | Icon cột sống + "Trung tâm HV" + tagline, về `/` | Như máy tính |
| Menu neo | Bác sĩ · Khóa học · Cách đăng ký · Liên hệ | Trong menu hamburger |
| Khách | "Đăng nhập" (ghost) · "Đăng ký học" (gold) | Trong menu hamburger |
| Đã đăng nhập | [Quản trị] (admin) · Avatar chữ cái + "Tài khoản" ▾ | Avatar ▾ (ẩn chữ "Tài khoản" < sm) |
| Menu Tài khoản | Tên + email/SĐT · Tài khoản của tôi · Khóa học của tôi · Quản trị (admin) · Đăng xuất (đỏ) | Như máy tính, mở bằng chạm |

Quy tắc:
- Trang hiện tại: class `nav-active` + `aria-current="page"`.
- Menu mở bằng hover **chỉ** trên thiết bị `(hover: hover)`, bằng click ở mọi thiết bị, bằng focus bàn phím (`group-focus-within`).
- Bấm ngoài menu → đóng. Chuyển trang → đóng mọi menu.

## 4. Điều hướng trong khu admin (`AdminNav`)

Tab gạch chân: **Đơn đăng ký** (`/admin`) · **Học viên** (`/admin/users`) · **Khóa học** (`/admin/courses`).
Trong tab Đơn đăng ký có bộ lọc dạng nút: Chờ duyệt · Đã duyệt · Từ chối · Tất cả (kèm số lượng).

## 5. Footer (`#lien-he`)

Tên + tên đầy đủ + tagline + mô tả · Liên kết (Khóa học, Đăng ký học, Đăng nhập) ·
Liên hệ (hotline `tel:`, email `mailto:`, Zalo) · Dòng miễn trừ y khoa.

## 6. Phiên bản 0.2 (chốt 27/09/2026, chưa triển khai)

### 6.1. Sitemap v0.2

```mermaid
flowchart TB
  root["/ Trang chủ<br/>Miễn phí · Chương trình (vẹo lưng / vẹo ngực) · Premium"]
  root --> kh["/khoa-hoc/:id (giới thiệu khóa)"]
  root --> reg["/register?course=&plan="]
  root --> csbm["/chinh-sach-bao-mat"]
  root --> login["/login"]

  subgraph Công khai với khóa miễn phí
    cd["/courses/:id"]
    ls["/courses/:id/:lessonId (trình học)"]
    cd --> ls
  end

  subgraph Bệnh nhân – cần đăng nhập
    acc["/account"]
    crs["/courses (Khóa học của tôi + Phiếu tham vấn của tôi)"]
    cs["/courses/consultation"]
    crs --> cd
    crs --> cs
  end

  subgraph Quản trị – staff & admin
    adm["/admin (Tổng quan)"]
    ar["/admin/registrations"]
    ap["/admin/patients"] --> apn["/admin/patients/new"]
    ap --> apd["/admin/patients/:id"]
    ac["/admin/consultations"]
    al["/admin/leads"]
  end

  subgraph Chỉ admin
    aco["/admin/courses"] --> acd["/admin/courses/:id (gói, buổi – bài)"]
    ast["/admin/settings/consultation"]
  end

  kh --> reg
  kh -->|khóa free| ls
  kh -->|premium: lead + Zalo| zalo[(Zalo)]
```

### 6.2. Ma trận truy cập trang v0.2

| Trang | Khách | Bệnh nhân | Staff | Admin |
| --- | --- | --- | --- | --- |
| `/`, `/khoa-hoc/:id`, `/register`, `/chinh-sach-bao-mat` | ✅ | ✅ | ✅ | ✅ |
| `/courses/:id/**` khóa **free** | ✅ | ✅ (lưu tiến độ) | ✅ | ✅ |
| `/courses/:id/**` khóa **program** | → `/login` | ✅ theo hạn học + buổi mở | ✅ xem trước | ✅ xem trước |
| `/courses`, `/courses/consultation`, `/account` | → `/login` | ✅ | ✅ | ✅ |
| `/admin`, `/admin/registrations`, `/admin/patients/**`, `/admin/consultations`, `/admin/leads` | → `/login` | → `/courses` | ✅ (dashboard không có doanh thu) | ✅ |
| `/admin/courses/**`, `/admin/settings/**` | → `/login` | → `/courses` | → `/admin` | ✅ |

### 6.3. Header & menu v0.2

- Menu neo: **Miễn phí** · **Chương trình** · **Premium** · Bác sĩ · Liên hệ.
- Menu Tài khoản thêm "Phiếu tham vấn của tôi"; staff/admin có "Quản trị".
- `AdminNav`: Tổng quan · Đơn đăng ký (số chờ) · Bệnh nhân · Phiếu tham vấn (số mới) · Khách quan tâm (số mới) · *Khóa học* · *Cài đặt*
  (*in nghiêng* = chỉ admin). Nút nổi bật "+ Tạo bệnh nhân" ở góc phải thanh quản trị.
- Footer: thêm link "Chính sách bảo mật".

## 7. Luồng chuyển hướng sau hành động

| Hành động | Đích |
| --- | --- |
| Đăng nhập thành công | `next` hoặc `/courses` |
| Đăng ký thành công | `/courses?registered=1` |
| Đặt lại mật khẩu thành công | `/courses` |
| Đăng xuất | `/` |
| Học viên vào `/admin` | `/courses` |
| "Đăng nhập" trong box đăng ký | `/login?next=/register` |
| "Đăng ký khóa học này" (khóa chưa mở) | `/register?course=<id>` |
| *(v0.2)* Chọn gói ở trang giới thiệu / "Gia hạn" | `/register?course=<id>&plan=<planId>` |
| *(v0.2)* Nhân viên tạo bệnh nhân thành công | `/admin/patients/<id>?created=1` (hiện mật khẩu một lần) |
| *(v0.2)* Gửi phiếu tham vấn | `/courses?consultation=sent` |
| *(v0.2)* Staff mở trang chỉ-admin | `/admin` |
