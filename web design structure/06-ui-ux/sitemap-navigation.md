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

## 6. Luồng chuyển hướng sau hành động

| Hành động | Đích |
| --- | --- |
| Đăng nhập thành công | `next` hoặc `/courses` |
| Đăng ký thành công | `/courses?registered=1` |
| Đặt lại mật khẩu thành công | `/courses` |
| Đăng xuất | `/` |
| Học viên vào `/admin` | `/courses` |
| "Đăng nhập" trong box đăng ký | `/login?next=/register` |
| "Đăng ký khóa học này" (khóa chưa mở) | `/register?course=<id>` |
