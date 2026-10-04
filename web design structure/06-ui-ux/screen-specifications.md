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
| SCR-10 | Admin – Đơn đăng ký | `/admin/registrations` | US-05.x |
| SCR-11 | Admin – Học viên | `/admin/users` | US-06.x |
| SCR-12 | Admin – Khóa học | `/admin/courses` | US-07.01–07.04, 07.06 |
| SCR-13 | Admin – Bài học | `/admin/courses/:id` | US-07.05 |
| SCR-14 | 404 | (bất kỳ) | — |
| SCR-15 | *(v0.2)* Trang chủ – khóa theo nhóm | `/#khoa-hoc` | US-11.01 |
| SCR-16 | *(v0.2)* Giới thiệu khóa (kiểu Udemy) | `/khoa-hoc/:id` | US-11.03, 11.05, 12.02 |
| SCR-17 | *(v0.2)* Box đăng ký có chọn gói + đồng ý | `/#dang-ky`, `/register` | US-12.02, 11.06 |
| SCR-18 | *(v0.2)* Khóa học của tôi (tiến độ, hạn, phiếu) | `/courses` | US-12.04, 13.05, 13.06 |
| SCR-19 | *(v0.2)* Trình học (buổi, checklist) | `/courses/:id/:lessonId` | EP-13 |
| SCR-20 | *(v0.2)* Phiếu tham vấn | `/courses/consultation` | US-15.02 |
| SCR-21 | *(v0.2)* Hộp nhắc đổi mật khẩu / đồng ý | (sau đăng nhập) | US-14.02, 11.06 |
| SCR-22 | *(v0.2)* Admin – Tổng quan | `/admin` | EP-16 |
| SCR-23 | *(v0.2)* Admin – Tạo bệnh nhân | `/admin/patients/new` | US-14.01 |
| SCR-24 | *(v0.2)* Admin – Chi tiết bệnh nhân | `/admin/patients/:id` | US-14.03, 14.04 |
| SCR-25 | *(v0.2)* Admin – Phiếu tham vấn / Khách quan tâm | `/admin/consultations`, `/admin/leads` | US-15.04, 11.05 |
| SCR-26 | *(v0.2)* Admin – Khóa học: loại, ảnh bìa, gói | `/admin/courses` | US-11.02, 12.01 |
| SCR-27 | *(v0.2)* Admin – Nội dung buổi – bài | `/admin/courses/:id` | US-13.01, 13.02 |
| SCR-28 | *(v0.2)* Admin – Mẫu phiếu tham vấn | `/admin/settings/consultation` | US-15.01 |

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
          │ [______________________________________ 👁]  │  ← Đợt 15: nút mắt hiện / ẩn (mọi ô mật khẩu)
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
| Loading | Thanh tiến trình trên đầu trang (`NavigationProgress`). Không dùng `app/courses/loading.tsx` từ Đợt 17: Next 15.5 hủy điều hướng sau "Hoàn thành & bài tiếp theo" (RK-53) |

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
Khóa không đọc được (không tồn tại, hoặc đang ẩn với người chưa được duyệt) → 404. Khóa đang ẩn vẫn hiển thị bình thường với học viên đã được duyệt.

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

> Đợt 15 (UI-02): khung quản trị đổi thành sidebar trái trên máy tính – xem sơ đồ dưới; điện thoại vẫn là hàng tab cuộn ngang.
>
> ```text
> ┌─ Bảng quản trị ─┐  ┌──────────── nội dung trang ─────────────┐
> │ [Admin]         │  │ Tổng quan                 [+ Tạo bệnh nhân]│
> │▌⌂ Tổng quan     │  │ …                                          │
> │ ▤ Đơn đăng ký ③ │  │                                            │
> │ 👥 Bệnh nhân    │  │                                            │
> │ 📖 Khóa học     │  │                                            │
> │ 🩺 Phiếu t.vấn ① │  │                                            │
> │ ☆ Khách q.tâm   │  │                                            │
> │ ⚙ Mẫu phiếu     │  │                                            │
> └─────────────────┘  └────────────────────────────────────────────┘
> ```

```text
Bảng quản trị [Admin]            ← nhãn vai trò; nhân viên: [Nhân viên], không có tab Khóa học
 Đơn đăng ký | Học viên | Khóa học
[Chờ duyệt (3)] [Đã duyệt (40)] [Từ chối (2)] [Tất cả (45)]
Đợt 9 thêm cột **Gói** (sau Khóa học: "1 tháng · 12 buổi" + "Web · Chuyển khoản") và **Hạn học** (sau Trạng thái: ngày hết hạn, "Đã hết hạn", "Không thời hạn" với đơn cũ).
┌────┬──────┬──────────┬─────────┬──────────┬────────┬─────────┬──────────┬─────────┬──────────┬───────────┬────────────────┐
│STT │Ảnh CK│Họ và tên │Email    │SĐT       │Khóa học│Học phí  │Ngày ĐK   │Trạng thái│Ngày xử lý│Người xử lý│ Thao tác (sticky)│
├────┼──────┼──────────┼─────────┼──────────┼────────┼─────────┼──────────┼─────────┼──────────┼───────────┼────────────────┤
│ 1  │[img] │Nguyễn A  │a@gm…    │0912…(tel)│Khóa A  │199.000đ │26/09/2026│Chờ duyệt│    —     │     —     │[Duyệt][Từ chối]│
│ 2  │[img] │Chị Lan   │Không có email│08…  │Khóa B  │299.000đ │…         │Đã duyệt │…         │Admin Hùng │   [Thu hồi]    │
└────┴──────┴──────────┴─────────┴──────────┴────────┴─────────┴──────────┴─────────┴──────────┴───────────┴────────────────┘
```
| Trạng thái | Hiển thị |
| --- | --- |
| Rỗng | "Không có đơn đăng ký nào." |
| Không có ảnh | Ô xám "Không có ảnh" |
| Từ chối / Thu hồi | Bấm nút mở ô "Lý do (học viên sẽ thấy, không bắt buộc)" + nút "Xác nhận từ chối" / "Xác nhận thu hồi" (thay cho hộp xác nhận) |
| Trạng thái | Badge + dòng "Lý do: …" (nếu có) + "Lịch sử (n)" thu gọn: thời điểm, người xử lý, trạng thái trước → sau, lý do |
| Người khác vừa xử lý | Toast lỗi "Đơn đã thay đổi (có thể người khác vừa xử lý), vui lòng tải lại trang." |
| Người xử lý | Tên admin đã duyệt/từ chối/thu hồi gần nhất (họ tên → email → SĐT); "—" với đơn chờ duyệt hoặc đơn xử lý trước khi có cột này |
| Khóa đang ẩn | Dòng nhỏ "(khóa đang ẩn)" dưới tên khóa; vẫn có nút Duyệt |
| Tài khoản đã xóa | Dòng nhỏ "(tài khoản đã xóa)" dưới họ tên; không có nút Duyệt |
| Khóa đã xóa | Tên khóa đã lưu + dòng nhỏ "(khóa học đã xóa)", học phí theo snapshot; ẩn nút **Duyệt** |
| Lỗi truy vấn | `app/admin/error.tsx` |
| Loading | Thanh tiến trình trên đầu trang (`NavigationProgress`). Không dùng `app/admin/loading.tsx` từ Đợt 17: Next 15.5 hủy điều hướng đổi tab `?status=` khi trang lớn (RK-53) |

## SCR-11 – Admin: Học viên

```text
[Tất cả tài khoản] [Nhân viên & Admin (3)]
[Tìm theo tên, email hoặc số điện thoại_______] [Tìm]
37 tài khoản
┌ Học viên ─────────────────┬ SĐT ──────┬ Khóa học ─────────────────┬ Ngày tạo ─┬ Vai trò ────────────────────┐
│ Nguyễn A [Admin]          │ 0912…     │ Khóa A [Đã duyệt]         │ 26/09/2026│ [Admin ▾] [Lưu vai trò]     │
│ a@gmail.com               │           │ Khóa B [Chờ duyệt]        │           │                   │
│ Cấp quyền bởi Admin B · 26/09/2026                                                                 │
│ Admin B [Admin]           │ …         │ Chưa đăng ký              │ …         │ Tài khoản của bạn │
```
Mobile (< md): mỗi tài khoản là một thẻ, nút quyền ở cuối thẻ. Rỗng: "Không tìm thấy tài khoản."
Admin đổi vai trò bằng ô chọn Học viên / Nhân viên / Admin + [Lưu vai trò] (hộp xác nhận nêu quyền từng vai trò); dòng của chính mình không có ô chọn.
Nhân viên xem trang này nhưng cột Vai trò chỉ hiện nhãn, không đổi được.

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

---

# Màn hình phiên bản 0.2 (chốt 27/09/2026 – ✅ đã triển khai Đợt 8 → 13)

Bố cục học tập tham khảo **Udemy**: trang giới thiệu có khung giá dính bên phải, trình học có cột nội dung theo buổi,
thanh tiến độ nhỏ, nút hành động rõ ràng. Giữ màu ocean/gold và quy tắc mobile-first hiện có.

## SCR-15 – Trang chủ: khóa theo nhóm

> ✅ Đợt 8: 3 nhóm (Miễn phí `#mien-phi` – ẩn khi trống, Chương trình `#khoa-hoc` có nút lọc nhóm bệnh khi có ≥ 2 nhóm, Premium `#premium` nền tối); thẻ khóa `CourseCard`. Giá "từ …/tháng", số buổi, nhãn "Đang học" ở Đợt 9–10.

```text
├─ #mien-phi  Bắt đầu miễn phí ────────────────────────────────────────────┤
│ ┌[ảnh bìa 16:9]┐ ┌[ảnh bìa]┐ ┌[ảnh bìa]┐   nhãn [MIỄN PHÍ]              │
│ │ Tên khóa     │ │ …       │ │ …       │   "6 bài · 1 buổi"  [Xem ngay →] │
├─ #chuong-trinh  Chương trình phục hồi chức năng ──────────────────────────┤
│ [Tất cả] [Vẹo lưng] [Vẹo ngực]                                          │
│ ┌[ảnh bìa]──────────────┐  nhãn [VẸO LƯNG]                              │
│ │ Chương trình Vẹo lưng │  "Lộ trình 12 buổi/tháng · 6 bài/buổi"        │
│ │ từ 990.000đ / tháng   │  [Xem lộ trình →]                             │
├─ #premium  Premium chuyên sâu cùng bác sĩ ────────────────────────────────┤
│ ┌[ảnh bìa] 1:4 ┐ ┌[ảnh bìa] 1:2 ┐ ┌[ảnh bìa] 1:1 ┐  giá hoặc "Liên hệ"   │
│ │ [Liên hệ Zalo nhận ưu đãi] ┐ … (mở hộp SCR-16 §premium)                │
```
- Thẻ khóa đã mua (khi đăng nhập): góc thẻ hiện "Đang học · 25%".
- Không có khóa trong nhóm → ẩn cả nhóm.

## SCR-16 – Giới thiệu khóa `/khoa-hoc/:id`

> ✅ Đợt 8: dải tiêu đề, "Bạn sẽ đạt được", đề cương phẳng (tên bài, không có video), giới thiệu, bác sĩ; khung hành động dính bên phải (điện thoại: ngay dưới tiêu đề) với học phí khóa. Chọn gói ✅ Đợt 9 (`PlanPicker`: gói, số buổi, "tiết kiệm …" so với gói 1 tháng, nút "Đăng ký gói N tháng" → `/?course=&plan=#dang-ky`); đề cương theo buổi ở Đợt 10.

```text
┌─ Dải tiêu đề (nền ocean-900, chữ trắng) ───────────────────────┐ ┌ Khung giá (sticky lg) ────┐
│ [VẸO LƯNG]  Chương trình phục hồi vẹo lưng                     │ │ [ảnh bìa]                 │
│ Mô tả ngắn…                                                    │ │ ( ) 1 tháng   990.000đ    │
│ 👨‍⚕️ Bác sĩ Đỗ Mạnh Cường · 36 buổi · 216 bài tập               │ │ (•) 3 tháng 2.500.000đ    │
└────────────────────────────────────────────────────────────────┘ │     36 buổi · tiết kiệm…  │
┌ Bạn sẽ đạt được ─────────────────────────────┐                   │ ( ) 6 tháng …             │
│ ✓ …  ✓ …  (2 cột)                            │                   │ [ Đăng ký gói 3 tháng ]   │ ← gold
└──────────────────────────────────────────────┘                   │ [ Tư vấn qua Zalo ]       │
Nội dung chương trình  36 buổi · 216 bài          [Mở tất cả]      │ ✓ Học trên điện thoại     │
┌ ▸ Buổi 1 – Làm quen                      6 bài ┐                 │ ✓ Phiếu tham vấn bác sĩ   │
│ ▾ Buổi 2 – …                             6 bài │                 └───────────────────────────┘
│    ▶ Bài 1: Thở cơ hoành   (tên bài, không có video)
└────────────────────────────────────────────────┘
Mô tả chi tiết · Bác sĩ hướng dẫn · FAQ
Mobile: khung giá chuyển thành thanh cố định đáy "từ 990.000đ [Đăng ký]"; bấm mở danh sách gói.
```
| Loại | Khác biệt |
| --- | --- |
| Miễn phí | Khung giá: "Miễn phí" + [Bắt đầu học ngay] → bài đầu tiên; không có gói |
| Đã mua (đăng nhập) | Khung giá: thanh tiến độ + [Tiếp tục Buổi X] + "Còn N ngày" + [Gia hạn] |
| Premium | Không có đề cương. Khung: giá (hoặc "Liên hệ"), "Nhóm 1:4 / 1:2 / 1:1", [Liên hệ Zalo nhận ưu đãi] mở hộp: Họ tên, SĐT (điền sẵn nếu đăng nhập), [Gửi & mở Zalo], link nhỏ "Mở Zalo ngay" |
| Chưa có gói đang bán | Nút "Liên hệ tư vấn" (Zalo) thay nút đăng ký |

## SCR-17 – Box đăng ký có chọn gói (sửa SCR-03)

> ✅ Đợt 8: ô đồng ý Chính sách bảo mật (chỉ khách tạo tài khoản mới); ô chọn khóa chỉ có chương trình. ✅ Đợt 9: "Chọn chương trình" + nút chọn gói (radio `planId`), QR theo giá gói, dòng "Bạn đang học chương trình này tới … – gói mới sẽ cộng thêm".

- Bước 3: "Chọn chương trình *" rồi các nút chọn **gói** (1/3/6/12 tháng kèm giá, số buổi); QR và dòng "Số tiền" cập nhật theo gói.
- Ô tick bắt buộc (khách mới): "Tôi đồng ý với [Chính sách bảo mật] và cho phép trung tâm lưu thông tin sức khỏe để hướng dẫn tập luyện."
- Đã đăng nhập và đang còn hạn chương trình: dòng "Bạn đang học chương trình này tới dd/mm/yyyy – gói mới sẽ **cộng thêm** vào hạn".
- Có đơn chờ duyệt cho chương trình: báo ngay trên form, không cho gửi.

## SCR-18 – Khóa học của tôi (sửa SCR-07)

> ✅ Đợt 15: thanh tiến độ đổi thành vòng tròn % (`ProgressRing`) ở mọi nơi dưới đây. ✅ Đợt 10: thẻ khóa có thanh tiến độ "x/y bài · z%" và nút "Tiếp tục Buổi X – Bài Y" (chưa tập thì "Vào học"); trang khóa có tiến độ, nút tiếp tục, nội dung theo buổi (🔒 + lý do).
> ✅ Đợt 9: thẻ khóa có nhãn "Còn N ngày" (vàng khi ≤ 7 ngày), nút "Gia hạn" (chương trình có gói) và "Vào học"; mục riêng **"Gói đã hết hạn"** (nhãn đỏ, "Xem khóa học", "Gia hạn để tập tiếp"). Trang khóa khi hết hạn: "Gói tập đã hết hạn ngày …", đề cương không có video, nút gia hạn. Thanh tiến độ ở Đợt 10.

```text
Xin chào, Mai / Khóa học của tôi                           [📝 Gửi phiếu tham vấn]
┌[ảnh bìa]┬ Chương trình Vẹo ngực ─────────────────────────────────────┐
│         │ ████████░░░░░░░░ 18/72 bài · 25%        Còn 5 ngày (vàng)  │
│         │ [ Tiếp tục Buổi 4 – Bài 1 → ]   [Gia hạn]                   │
└─────────┴────────────────────────────────────────────────────────────┘
┌[ảnh bìa]┬ Khóa miễn phí: Bài tập thở ────── 3/6 bài · 50% [Tiếp tục]┐
Đang chờ xác nhận · Đơn chưa được xác nhận (như cũ, kèm tên gói)
Phiếu tham vấn của tôi: 27/09 · Mới │ 10/09 · Hoàn tất
```
| Trạng thái | Hiển thị |
| --- | --- |
| Hết hạn | Nhãn đỏ "Đã hết hạn dd/mm", nút chính đổi thành [Gia hạn để tập tiếp], thanh tiến độ vẫn hiện |
| Hoàn thành buổi cuối đã mua | Nhãn "Đã hoàn thành 12/12 buổi 🎉" + [Gửi phiếu tham vấn] + [Gia hạn] |

## SCR-19 – Trình học (thay SCR-09)

> ✅ Đợt 10: đúng bố cục dưới; thanh nút cố định đáy trên điện thoại; khách ở khóa miễn phí thấy "Đăng nhập để lưu tiến độ". ✅ Đợt 12: nút "📝 Phiếu tham vấn" cạnh thanh tiến độ, thẻ chúc mừng có "Gửi phiếu tham vấn bác sĩ". Điện thoại: cột nội dung nằm dưới video (tách 2 tab: để sau v0.2 – chủ dự án chốt 27/09).

```text
← Chương trình Vẹo ngực       ███████░░░ 18/72 · 25%          [📝 Phiếu tham vấn]
┌──────────────────────────────────────────┐ ┌ Nội dung khóa học ─────────────┐
│                                          │ │ ▾ Buổi 3 · 6/6 ✓               │
│           VIDEO 16:9 / 9:16              │ │ ▾ Buổi 4 · 1/6   (đang tập)    │
│                                          │ │   [✓] Bài 1 Thở cơ hoành       │
└──────────────────────────────────────────┘ │   [▶] Bài 2 Kéo giãn …  ← đang │
Buổi 4 · Bài 2/6                              │   [ ] Bài 3 …                  │
<Tên bài>                                     │ ▸ Buổi 5 🔒 Hoàn thành Buổi 4   │
<Hướng dẫn: số hiệp, số lần, lưu ý>           │ ▸ Buổi 13 🔒 Gia hạn để mở      │
──────────────────────────────────────────    └─────────────────────────────────┘
[← Bài trước]        [ ✓ Hoàn thành & bài tiếp theo → ]  (gold, to)
```
- Mobile: video tràn viền; dưới video 2 tab "Bài này" / "Nội dung (4/12 buổi)"; nút hoàn thành cố định đáy màn hình.
- Tick bài cuối của buổi → thẻ "Xong Buổi 4! 💪 [Bắt đầu Buổi 5]"; buổi cuối đã mua → thẻ chúc mừng + phiếu tham vấn + gia hạn.
- Bỏ tick: hỏi "Bỏ đánh dấu bài này? Buổi sau có thể bị khóa lại."
- Bài bị khóa: vùng video hiện 🔒 + lý do + nút tương ứng (về buổi đang tập / Gia hạn / Đăng nhập).
- Khóa miễn phí khi chưa đăng nhập: ô tick thay bằng gợi ý "Đăng nhập để lưu tiến độ".
- Staff/admin: nhãn "Chế độ xem trước", không có ô tick.

## SCR-20 – Phiếu tham vấn

> ✅ Đợt 12: đúng bố cục dưới; chọn sẵn chương trình theo `?course=`; thang 0–10 là 11 ô bấm; lỗi hiện `role="alert"` đầu form; thành công → `/courses?consultation=sent` + toast, phiếu hiện ở "Phiếu tham vấn của tôi".

```text
Phiếu tham vấn bác sĩ
Chương trình đang tập: [Vẹo ngực ▾] (tùy chọn)
1. Mức đau hiện tại   0 ○ 1 ○ … ● 6 … ○ 10
2. Đau tăng sau khi tập     ( ) Có  (•) Không
…
Ghi chú thêm [__________________]
[ Gửi cho nhân viên ]     Nhân viên sẽ liên hệ qua điện thoại / Zalo trong giờ làm việc.
```
Câu `scale` bắt buộc chọn; `check` bắt buộc; `text` không bắt buộc. Thành công → `/courses?consultation=sent` + toast.

## SCR-21 – Hộp nhắc sau đăng nhập

> ✅ Đợt 8: hộp đồng ý chính sách. ✅ Đợt 11: gộp thành `LoginReminders` (đồng ý chính sách trước, rồi nhắc đổi mật khẩu); không hiện ở trang chính sách; nhắc đổi mật khẩu không hiện ở `/account`; "Để sau" nhớ trong phiên trình duyệt.
- **Đổi mật khẩu** (`must_change_password`): "Mật khẩu của bạn do nhân viên cấp. Bạn nên đổi mật khẩu mới để bảo mật." [Đổi ngay → /account#doi-mat-khau] [Để sau].
- **Đồng ý chính sách** (chưa có `consent_at`): nội dung tóm tắt + link chính sách + [Tôi đồng ý]; không có nút bỏ qua cho tới khi đồng ý (vẫn đăng xuất được).

## SCR-22 – Admin: Tổng quan

```text
Tổng quan                                                   [+ Tạo bệnh nhân]
┌ Bệnh nhân ┐┌ Mới 7 ngày ┐┌ Đơn chờ ┐┌ Gói hiệu lực ┐┌ Sắp hết hạn ┐┌ Đã hết hạn ┐┌ Phiếu mới ┐┌ Lead mới ┐
│   128     ││ 9 (Web 4 · Zalo 5)││ 3 ││ 96 ││ 7 ││ 12 ││ 2 ││ 5 │
└───────────┘└────────────┘└─────────┘└──────────────┘└─────────────┘└────────────┘└───────────┘└──────────┘
Việc cần làm                                   │ Tiến độ theo chương trình
• Đơn chờ lâu nhất (3)          [Mở]            │ Vẹo lưng  ██████░░ 58% (40 bệnh nhân)
• Sắp hết hạn: Nguyễn A (2 ngày) [☎][Zalo]      │ Vẹo ngực  ████░░░░ 41% (31)
• Phiếu tham vấn mới (2)        [Mở]            │ Không tập > 7 ngày: 11  [Xem]
• Lead premium mới (5)          [Mở]            │
─────────────── Chỉ admin ────────────────────────────────────────────
Doanh thu tháng 9: 48.500.000đ (tháng 8: 41.000.000đ)
theo chương trình · theo hình thức (CK / tiền mặt / khác) · theo nguồn (Web / Zalo) · theo nhân viên
```
Mỗi thẻ là link tới danh sách đã lọc. Biểu đồ tuân theo design system (không màu mè, số liệu có nhãn).

> ✅ Đợt 13: 8 thẻ (Bệnh nhân · Mới 30 ngày · Đơn chờ duyệt · Gói đang hiệu lực · Sắp hết hạn 7 ngày · Đã hết hạn · Phiếu tham vấn mới · Khách premium mới), "Việc cần làm" (đơn chờ, phiếu mới, lead mới, bệnh nhân sắp hết hạn kèm Gọi / Zalo), "Tiến độ theo chương trình" + "Không tập > 7 ngày"; khối Doanh thu chỉ admin (tháng này so tháng trước, 4 bảng phân tích).

## SCR-23 – Admin: Tạo bệnh nhân

```text
Tạo tài khoản bệnh nhân (khách từ Zalo)
Họ và tên * [____]   SĐT * [____]   Email [____]
Ghi chú nội bộ [____]
[✓] Bệnh nhân đã đồng ý Chính sách bảo mật (đã gửi link qua Zalo) *
── Cấp gói ngay (tùy chọn) ─────────────────────────
Chương trình [Vẹo ngực ▾]  Gói (•)1 tháng ( )3 tháng …
Số tiền đã nhận * [990.000]  Hình thức * (•)Chuyển khoản ( )Tiền mặt ( )Khác
Ảnh chuyển khoản [chọn ảnh]  Ghi chú thanh toán [____]
[ Tạo tài khoản ]
```
> ✅ Đợt 11: như trên; số tiền tự điền theo giá gói (sửa được). Thành công ở lại trang, hiện khung mật khẩu + [Xem hồ sơ bệnh nhân] [Tạo bệnh nhân khác].

Thành công → khung xanh: "Mật khẩu: **K7mPq4xa** (chỉ hiện một lần)" + [Chép tin nhắn gửi Zalo]:
"Chào chị Mai, tài khoản tập luyện tại Trung tâm HV: Đăng nhập: <link> · SĐT: 09xx · Mật khẩu: … · Chị nên đổi mật khẩu sau khi đăng nhập."

## SCR-24 – Admin: Chi tiết bệnh nhân

> ✅ Đợt 11: cột trái – thông tin (nguồn, người tạo, ngày đồng ý, ghi chú nội bộ), Gói & tiến độ, Lịch sử đơn / gói, Phiếu tham vấn, Nhật ký tài khoản; cột phải – Cấp gói / Gia hạn, Sửa thông tin (kèm ghi chú nội bộ), Cấp lại mật khẩu. Tài khoản nhân viên / admin: chỉ hiện thông tin.
Thông tin (sửa được), nguồn (Web/Zalo), người tạo, ngày đồng ý chính sách; **Gói & hạn học** từng chương trình (lịch sử đơn, số tiền,
hình thức, người cấp) + [Cấp gói / Gia hạn]; **Tiến độ** (thanh %, buổi đang tập, lần tập gần nhất); **Phiếu tham vấn**;
[Cấp lại mật khẩu] (xác nhận, hiện mật khẩu một lần); nhật ký `account_events`. Staff không thấy nút đổi vai trò.

## SCR-25 – Admin: Phiếu tham vấn / Khách quan tâm

> ✅ Đợt 8 phần Khách quan tâm (`/admin/leads`). ✅ Đợt 12 phần Phiếu (`/admin/consultations`): tab kèm số lượng; thẻ phiếu có link hồ sơ bệnh nhân, Gọi / Zalo, chương trình, nguồn nhắc, nhãn câu thang điểm đầu tiên (mức đau), câu trả lời mở sẵn ở tab Mới; ô trạng thái + ghi chú nội bộ. % tiến độ xem ở hồ sơ bệnh nhân.
- Phiếu: tab Mới · Đã liên hệ · Hoàn tất · Hủy; mỗi dòng: bệnh nhân (☎, Zalo), chương trình, % tiến độ, ngày gửi, tóm tắt (mức đau);
  mở rộng xem toàn bộ câu trả lời; ô ghi chú nội bộ + nút chuyển trạng thái; người xử lý.
- Lead: tab Mới · Đã liên hệ · Đã chốt · Đóng; cột khóa premium, họ tên, SĐT, đã đăng nhập hay chưa, thời điểm; dòng thống kê
  "Lượt bấm ẩn danh 30 ngày: 42".

## SCR-26 – Admin: Khóa học (sửa SCR-12)

> ✅ Đợt 8: loại, nhóm bệnh, ảnh bìa (nén trên trình duyệt, xem trước, "Xóa ảnh bìa hiện tại"), mô tả ngắn, "Bạn sẽ đạt được"; thẻ khóa có ảnh nhỏ, nhãn loại, nút "Xem trang giới thiệu"; khóa premium không có "Quản lý bài học". ✅ Đợt 9: bảng **Gói theo thời hạn** trong thẻ chương trình (sửa giá / số buổi / đang bán, xóa có xác nhận, thêm gói còn thiếu; cảnh báo đỏ khi chưa có gói); tạo chương trình có học phí → tự có gói 1 tháng. Số buổi × số bài ở Đợt 10.
Form khóa thêm: Loại (Miễn phí / Chương trình / Premium), Nhóm (Vẹo lưng / Vẹo ngực / Không), Ảnh bìa (xem trước 16:9), Mô tả ngắn,
"Bạn sẽ đạt được" (mỗi dòng một ý), Giá (chỉ premium). Khi tạo chương trình: ô **Số buổi** và **Số bài mỗi buổi** (mặc định 12 × 6).

> ✅ Sau Đợt 10 (27/09): danh sách chia theo loại – nút lọc Tất cả / Chương trình / Miễn phí / Premium (kèm số lượng), chế độ Tất cả chia 3 nhóm có tiêu đề; form thêm khóa chọn sẵn loại theo tab. RK-18: sửa chương trình không còn ô Giá (giá bán sửa ở bảng Gói).
Thẻ chương trình có bảng **Gói**: 1/3/6/12 tháng · giá · số buổi · Đang bán / Tắt · [Sửa] [Xóa].

## SCR-27 – Admin: Nội dung buổi – bài (thay SCR-13)

> ✅ Đợt 10: tạo khung N × M, mỗi buổi: ↑ ↓, Sao chép buổi, Sửa / Xóa buổi (xác nhận), bài tập (Xem thử, Sửa có ô "Thuộc buổi", Xóa); cảnh báo "N bài chưa có video", "Gói X tháng cần Y buổi, hiện có Z"; khung bên phải: Thêm bài học, Thêm 1 buổi.
```text
← Tất cả khóa học   Chương trình Vẹo ngực   ⚠ 12 bài chưa có video · Gói 12 tháng cần 144 buổi, hiện có 36
[+ Tạo thêm buổi: số buổi [12] × số bài [6] ]  [+ Thêm 1 buổi]
▾ Buổi 1 – Làm quen  (6 bài)          [↑][↓] [Sao chép buổi] [Sửa] [Xóa]
   1. Thở cơ hoành   ✓ có video   [Xem thử] [Sửa] [Xóa]
   2. …              ⚠ chưa có video
   [+ Thêm bài vào buổi]
▸ Buổi 2 …
```

## SCR-28 – Admin: Mẫu phiếu tham vấn

> ✅ Đợt 12: như mô tả; thêm câu hỏi ở khung bên phải; câu đang tắt hiện mờ kèm nhãn "Đang tắt".
Danh sách câu hỏi (kéo lên/xuống bằng nút ↑↓), loại, bật/tắt, [Sửa] [Xóa]; form thêm câu hỏi; ghi chú "Sửa câu hỏi không ảnh hưởng phiếu đã gửi".
