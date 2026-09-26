# Đặc tả màn hình

Wireframe dạng ASCII (low-fidelity) thể hiện bố cục trên **máy tính**; ghi chú khác biệt trên điện thoại.
Mỗi màn hình liệt kê: mục đích, dữ liệu, thành phần, trạng thái (loading / rỗng / lỗi / thành công), liên kết user story.

| ID | Màn hình | Route | Stories |
| --- | --- | --- | --- |
| SCR-00 | Header / Footer / Toast | (chung) | US-08.x |
| SCR-01 | Trang chủ | `/` | US-01.x |
| SCR-02 | Trang đăng ký | `/register` | US-02.x |
| SCR-03 | Box đăng ký 3 bước | `/#dang-ky`, `/register` | US-02.01–02.07 |
| SCR-04 | Đăng nhập | `/login` | US-03.01 |
| SCR-05 | Quên mật khẩu | `/forgot-password` | US-03.04, 03.05 |
| SCR-06 | Tài khoản của tôi | `/account` | US-03.06, 03.07 |
| SCR-07 | Khóa học của tôi | `/courses` | US-02.08, 04.01 |
| SCR-08 | Chi tiết khóa học | `/courses/:id` | US-04.02 |
| SCR-09 | Xem bài học | `/courses/:id/:lessonId` | US-04.03 |
| SCR-10 | Admin – Đơn đăng ký | `/admin` | US-05.x |
| SCR-11 | Admin – Học viên | `/admin/users` | US-06.x |
| SCR-12 | Admin – Khóa học | `/admin/courses` | US-07.01–07.04, 07.06 |
| SCR-13 | Admin – Bài học | `/admin/courses/:id` | US-07.05 |
| SCR-14 | 404 | (bất kỳ) | — |

---

## SCR-00 – Khung chung

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [≡HV] Trung tâm HV          Bác sĩ  Khóa học  Cách đăng ký  Liên hệ      │
│       Trị liệu toàn diện…                 [Đăng nhập] [Đăng ký học]      │  ← khách
│                                    [Quản trị] (C) Tài khoản ▾            │  ← đã đăng nhập
├──────────────────────────────────────────────────────────────────────────┤
│ ▔▔▔▔▔▔▔▔ thanh tiến trình khi chuyển trang                  ┌───────────┐│
│                                                             │✓ Toast… ✕ ││
│                         NỘI DUNG TRANG                      └───────────┘│
├──────────────────────────────────────────────────────────────────────────┤
│ Trung tâm HV (Holistic…)     Liên kết          Liên hệ                   │
│ Trị liệu toàn diện…          Khóa học          ☎ 0973 027 017           │
│ Mô tả                        Đăng ký học       ✉ email                   │
│                              Đăng nhập         Nhắn tin qua Zalo         │
│ © 2026 Trung tâm HV. Nội dung mang tính hướng dẫn, không thay thế…       │
└──────────────────────────────────────────────────────────────────────────┘
```
- Mobile: menu neo + nút khách gom vào hamburger; avatar vẫn hiện.
- Menu tài khoản: xem [sitemap-navigation.md](sitemap-navigation.md#3-header-componentssiteheadertsx).

## SCR-01 – Trang chủ

```text
┌─ HERO ───────────────────────────────────────────────────────────────────┐
│ [HOLISTIC THERAPY CENTER…]                        ┌───────────────┐      │
│ Trị liệu cột sống – cơ xương khớp                 │  Ảnh bác sĩ   │      │
│ TOÀN DIỆN cho người Việt                          │  (vuông)      │      │
│ Khóa học video do Bác sĩ … hướng dẫn…             └┬─────────────┬┘      │
│ [Đăng ký khóa học →]  [☎ 0973 027 017]             │BS Đỗ Mạnh C.│       │
│ ✓ 10 năm kinh nghiệm ✓ Mọi thiết bị ✓ Hỗ trợ       └─────────────┘       │
├─ #bac-si ────────────────────────────────────────────────────────────────┤
│ [Ảnh trung tâm]        CHUYÊN GIA ĐỒNG HÀNH / Tên / chức danh            │
│                        ✓ credential ×4   [10+] [YHCT] [1:1]              │
├─ VẤN ĐỀ ─────────────────────────────────────────────────────────────────┤
│ Những vấn đề cơ xương khớp phổ biến   │ [✓ đau cổ vai gáy] [✓ đau lưng]  │
│                                       │ [✓ lệch vai…]      [✓ tê bì…]    │
├─ LỢI ÍCH (4 thẻ) ────────────────────────────────────────────────────────┤
├─ #khoa-hoc ──────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                             │
│ │ ▶ Tên khóa │ │ …          │ │ …          │   grid 1 / 2 / 3 cột        │
│ │ mô tả 3 dòng│ │            │ │            │                            │
│ │ 1.500.000đ [Đăng ký]│      │ │            │                             │
│ └────────────┘ └────────────┘ └────────────┘                             │
├─ #dang-ky → SCR-03 ──────────────────────────────────────────────────────┤
├─ FAQ (details/summary, dấu + xoay 45° khi mở) ───────────────────────────┤
├─ CTA: Sẵn sàng chăm sóc cột sống? [Đăng ký học ngay →] [Tư vấn qua Zalo] ┤
└──────────────────────────────────────────────────────────────────────────┘
Mobile: thanh cố định đáy  [☎ Gọi ngay] [Đăng ký học]
```

| Trạng thái | Hiển thị |
| --- | --- |
| Không có khóa | Thẻ "Khóa học đang được cập nhật. Gọi <hotline>…"; select trong box đăng ký bị disable |
| Dữ liệu | Server render, ISR 300s |

## SCR-02 – Trang đăng ký `/register`
Tiêu đề trang + SCR-03. Metadata title "Đăng ký khóa học".

## SCR-03 – Box đăng ký 3 bước

```text
┌───────────────── Đăng ký khóa học (nền gradient ocean) ──────────────────┐
│        Chuyển khoản → Chụp ảnh chuyển khoản → Điền thông tin & gửi ảnh   │
├──────────────────────────────────┬───────────────────────────────────────┤
│ (1) Bước 1: Chuyển khoản         │ (3) Bước 3: Đăng ký thông tin & gửi ảnh│
│ ┌──────┐ Ngân hàng   Vietcombank[Chép]│ [!] lỗi (nếu có)                 │
│ │ QR   │ Số TK       0991…      [Chép]│ [✓] Bạn đang đăng nhập với … (*)  │
│ │      │ Chủ TK      ĐỖ MẠNH CƯỜNG[Chép]│ Họ và tên *        [__________]  │
│ └──────┘ Số tiền     1.500.000đ [Chép]│ SĐT * [_______] Email [_______]  │
│          Nội dung    0912345678 [Chép]│ Tạo mật khẩu * [________]        │
│ Số tiền & QR cập nhật theo khóa…      │   gợi ý… Đã có tài khoản? Đăng nhập│
│                                  │ Chọn khóa học * [Khóa A – 1.500.000đ ▾]│
│ (2) Bước 2: Chụp ảnh chuyển khoản│ Ảnh chụp chuyển khoản *               │
│ ✓ Chụp màn hình giao dịch…       │ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐   │
│ ✓ Thấy rõ số tiền, thời gian…    │ ╎  ⬆ Bấm để tải lên ảnh chuyển khoản ╎  │
│ ✓ Tải ảnh ở Bước 3…              │ ╎  JPG, PNG, WEBP, HEIC · tự động nén ╎  │
│                                  │ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘   │
│                                  │ ┌ Khóa học: Khóa A      1.500.000đ ┐ │
│                                  │ [            Đăng ký             ]   │
└──────────────────────────────────┴───────────────────────────────────────┘
(*) Khi đã đăng nhập: ẩn Email và Mật khẩu.
Mobile: 1 cột, Bước 1–2 ở trên, Bước 3 ở dưới.
```

| Trường | Loại | Ràng buộc client | Ghi chú |
| --- | --- | --- | --- |
| Họ và tên | text, `autoComplete=name` | required | |
| Số điện thoại | tel, `inputMode=tel` | required | Đồng thời cập nhật nội dung QR |
| Email | email | — | Chỉ khi chưa đăng nhập |
| Mật khẩu | password, `new-password` | required, minLength 6 | Chỉ khi chưa đăng nhập |
| Chọn khóa học | select | required | Mặc định khóa đầu tiên hoặc `?course=` |
| Ảnh chuyển khoản | file (`sr-only`), `accept` ảnh | required | Nén client, preview |

| Trạng thái | Hiển thị |
| --- | --- |
| Đang nén | Vùng upload: spinner "Đang tối ưu ảnh để tải lên nhanh hơn..."; nút Đăng ký disable |
| Đã chọn ảnh | Ảnh preview (max-h 56), "Đã tối ưu: 8.0MB → 420KB" hoặc "Dung lượng: …", "Bấm để chọn ảnh khác" |
| Lỗi file | Chữ đỏ dưới vùng upload, `role=alert` |
| Đang gửi | Nút: spinner "Đang gửi đăng ký..." |
| Lỗi server | `.alert-error` đầu Bước 3, cuộn box vào tầm nhìn |
| Thành công | Redirect `/courses?registered=1` + toast |

## SCR-04 – Đăng nhập

```text
          ┌──────────────── card max-w-md ────────────────┐
          │                  [≡HV]                        │
          │                Đăng nhập                      │
          │      Chào mừng bạn đến với Trung tâm HV       │
          │ [!] lỗi từ ?error                             │
          │ Email hoặc số điện thoại [__________________] │
          │ Mật khẩu              Quên mật khẩu?          │
          │ [__________________________________________]  │
          │ [               Đăng nhập                  ]  │
          │ Chưa có tài khoản? Đăng ký khóa học           │
          └───────────────────────────────────────────────┘
```

## SCR-05 – Quên mật khẩu

| Giai đoạn | Nội dung |
| --- | --- |
| `request` | Ô "Email hoặc số điện thoại đã đăng ký" + nút gửi mã; link quay lại đăng nhập |
| `verify` | Thông báo info "Đã gửi mã 6 số tới ab***@…"; "Mã xác nhận (6 số)", "Mật khẩu mới", "Nhập lại mật khẩu mới"; nút xác nhận; nút "Gửi lại mã" |
| Lỗi | `.alert-error` (không tìm thấy, chưa có email → hotline, đợi N giây, sai mã còn N lần, hết hạn…) |

## SCR-06 – Tài khoản của tôi

```text
┌ Xin chào, <tên> / Tài khoản của tôi ──────────────────────────────────────┐
├───────────────────────────────┬──────────────────────────────────────────┤
│ 👤 Thông tin cá nhân          │ 🔑 Đổi mật khẩu                           │
│ Họ và tên * [__________]      │ Mật khẩu hiện tại [________]              │
│ SĐT * (dùng để đăng nhập)     │ Mật khẩu mới      [________]              │
│ Email (không bắt buộc)        │ Nhập lại          [________]              │
│  ⚠ Thêm email để lấy lại MK…  │ [Đổi mật khẩu]                            │
│ [Lưu thông tin]               ├──────────────────────────────────────────┤
│                               │ Khóa học của tôi                       →  │
└───────────────────────────────┴──────────────────────────────────────────┘
```
Form thông tin có `key` theo dữ liệu → sau khi lưu hiển thị giá trị mới. Form mật khẩu reset khi thành công.

## SCR-07 – Khóa học của tôi

```text
Xin chào, <tên> / Khóa học của tôi
[✓ Đăng ký thành công! Trung tâm đang kiểm tra…]          ← chỉ khi ?registered=1
Đang chờ xác nhận
 ┌ ⏱ Khóa B · Đang kiểm tra chuyển khoản ┐
Khóa học đã mở
 ┌ Khóa A ──────────────┐
 │ mô tả…               │
 │ 📖 12 bài học  Vào học →│
 └──────────────────────┘
Đơn chưa được xác nhận
 ┌ Khóa C · Chưa xác nhận được chuyển khoản. Vui lòng liên hệ <hotline>  299.000đ ┐
            [Đăng ký thêm khóa học]
```
| Trạng thái | Hiển thị |
| --- | --- |
| Chưa có khóa, không có đơn chờ | "Bạn chưa có khóa học nào." + [Đăng ký khóa học] |
| Chưa có khóa, có đơn chờ | "Khóa học sẽ xuất hiện ở đây sau khi được xác nhận." |
| Loading | `app/courses/loading.tsx` |

## SCR-08 – Chi tiết khóa học

```text
← Khóa học của tôi
<Tên khóa>
<mô tả>
[Bắt đầu học →]                        ← chỉ khi có quyền và có bài
Nội dung khóa học (12 bài)
 ┌ (1) Bài 1: …  mô tả 1 dòng            → ┐   hover: số → ▶
 ├ (2) …                                   ┤
```
Không có quyền: thẻ 🛡 "Khóa học chưa được mở cho tài khoản của bạn" / "Nếu bạn đã đăng ký, vui lòng chờ…" / [Đăng ký khóa học này].
Khóa không đọc được (không tồn tại hoặc đang ẩn với học viên) → 404.

## SCR-09 – Xem bài học

```text
← <Tên khóa>
┌──────────────────────────────────────┐ ┌ Danh sách bài học ───────┐
│                                      │ │ (1) Bài 1                │
│        VIDEO 16:9 (hoặc 9:16)        │ │ (▶) Bài 2  ← đang xem    │
│                                      │ │ (3) Bài 3                │
└──────────────────────────────────────┘ │ …  (cuộn, max 60vh)      │
Bài 2/12                                 └──────────────────────────┘
<Tiêu đề bài>                              (sticky trên lg)
<mô tả giữ xuống dòng>
──────────────────────────────────────
[← Bài trước]                 [Bài tiếp theo →]
```
Mobile: video tràn viền (`-mx-4`), danh sách bài xuống dưới.
Không có quyền / không tìm thấy: "Không tìm thấy bài học hoặc khóa học chưa được mở cho bạn." + [Quay lại khóa học].

## SCR-10 – Admin: Đơn đăng ký

```text
Bảng quản trị
 Đơn đăng ký | Học viên | Khóa học
[Chờ duyệt (3)] [Đã duyệt (40)] [Từ chối (2)] [Tất cả (45)]
┌────┬──────┬──────────┬─────────┬──────────┬────────┬─────────┬──────────┬─────────┬──────────┬────────────────┐
│STT │Ảnh CK│Họ và tên │Email    │SĐT       │Khóa học│Học phí  │Ngày ĐK   │Trạng thái│Ngày xử lý│ Thao tác (sticky)│
├────┼──────┼──────────┼─────────┼──────────┼────────┼─────────┼──────────┼─────────┼──────────┼────────────────┤
│ 1  │[img] │Nguyễn A  │a@gm…    │0912…(tel)│Khóa A  │199.000đ │26/09/2026│Chờ duyệt│    —     │[Duyệt][Từ chối]│
│ 2  │[img] │Chị Lan   │Không có email│08…  │Khóa B  │299.000đ │…         │Đã duyệt │…         │   [Thu hồi]    │
└────┴──────┴──────────┴─────────┴──────────┴────────┴─────────┴──────────┴─────────┴──────────┴────────────────┘
```
| Trạng thái | Hiển thị |
| --- | --- |
| Rỗng | "Không có đơn đăng ký nào." |
| Không có ảnh | Ô xám "Không có ảnh" |
| Khóa đã xóa | "Khóa học đã xóa", học phí "—" |
| Lỗi truy vấn | `app/admin/error.tsx` |
| Loading | `app/admin/loading.tsx` |

## SCR-11 – Admin: Học viên

```text
[Tìm theo tên, Gmail hoặc số điện thoại_______] [Tìm]
37 tài khoản
┌ Học viên ─────────────┬ SĐT ──────┬ Khóa học ─────────────────┬ Ngày tạo ┐
│ Nguyễn A [Admin]      │ 0912…     │ Khóa A [Đã duyệt]         │ 26/09/2026│
│ a@gmail.com           │           │ Khóa B [Chờ duyệt]        │           │
```
Mobile (< md): mỗi tài khoản là một thẻ. Rỗng: "Không tìm thấy học viên."

## SCR-12 – Admin: Khóa học

```text
┌ Danh sách (trái) ───────────────────────────────┐ ┌ Thêm khóa học mới (sticky) ┐
│ Khóa A [Đang hiển thị]      [Quản lý bài học]   │ │ Tên khóa học *             │
│ 1.500.000đ                  [Ẩn khóa học]       │ │ Mô tả                      │
│ 📖 12 bài học  👥 40 học viên · 3 chờ duyệt      │ │ Giá (VNĐ, 0 = Liên hệ) | Thứ tự│
│ Sửa thông tin ▸ (mở: form + [Lưu thay đổi]       │ │ Trạng thái [Hiển thị ▾]    │
│                 ┄┄ [Xóa khóa học] (xác nhận))    │ │ [Thêm khóa học]            │
└─────────────────────────────────────────────────┘ └────────────────────────────┘
```

## SCR-13 – Admin: Bài học của khóa

```text
← Tất cả khóa học
<Tên khóa> [Đang hiển thị]
┌ (1) Bài 1 …                        [Xem thử] ┐ ┌ Thêm bài học (sticky) ┐
│     https://youtube.com/… (link)             │ │ Tên bài học *          │
│     Thứ tự: 1                                 │ │ Link video YT/TikTok * │
│ Sửa bài học ▸ (form + Lưu / Xóa bài học)      │ │ Mô tả                  │
└───────────────────────────────────────────────┘ │ Thứ tự bài (= n+1)     │
                                                  │ [Thêm bài học]         │
```

## SCR-14 – 404
"404" lớn màu ocean-200, "Không tìm thấy trang", mô tả, [Về trang chủ].
