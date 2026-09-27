# Design System

Phong cách: **y tế – tin cậy – ấm áp**. Xanh nước biển dịu làm màu chủ đạo, vàng kem làm màu nhấn cho
hành động mua/đăng ký. Mobile-first, chữ rõ, nút lớn cho người lớn tuổi.

Nguồn token: `tailwind.config.ts` · class dùng chung: `app/globals.css`.

## 1. Màu sắc

### Ocean (chủ đạo)

| Token | Hex | Dùng cho |
| --- | --- | --- |
| `ocean-50` | `#F3F8FC` | Nền section nhạt, hover nhẹ |
| `ocean-100` | `#E4F0F9` | Viền nhạt, nền icon |
| `ocean-200` | `#C9E1F2` | Viền nút outline, ring focus |
| `ocean-300` | `#A0CAE7` | |
| `ocean-400` | `#6EACD6` | Viền input khi focus |
| `ocean-500` | `#4A91C4` | Icon check, tab đang chọn |
| `ocean-600` | `#3777AA` | **Primary**: nút chính, logo, `themeColor` |
| `ocean-700` | `#2E608B` | Hover nút chính, link, giá |
| `ocean-800` | `#294F71` | |
| `ocean-900` | `#24425D` | Chữ tiêu đề đậm trong thẻ |
| `ocean-950` | `#172A3D` | Heading h1–h3, chữ trên nút gold |

### Gold (nhấn)

| Token | Hex | Dùng cho |
| --- | --- | --- |
| `gold-50` | `#FFFDF6` | Nền section ấm |
| `gold-100` | `#FEF8E6` | Nền eyebrow, badge chờ duyệt, nền mã trong email |
| `gold-200` | `#FCEFC6` | Ring focus nút gold, `::selection` |
| `gold-300` | `#F8E09A` | Hover nút gold, số bước |
| `gold-400` | `#F3CE6D` | **CTA**: nút "Đăng ký" |
| `gold-700` | `#A7752E` | Chữ học phí trong bảng admin, "Bài x/n" |
| `gold-800` | `#865D2B` | Chữ eyebrow, badge chờ duyệt |

### Ngữ nghĩa (Tailwind mặc định)

| Ý nghĩa | Màu |
| --- | --- |
| Thành công / Đã duyệt / Đang hiển thị | `emerald-50/100/200/500/600/700/800` |
| Lỗi / Từ chối / Nguy hiểm | `red-50/100/200/500/600/700` |
| Chữ thường | `slate-700`; phụ `slate-500`; placeholder `slate-400` |
| Trung tính / Đang ẩn | `slate-100` + `slate-600` |

> Khi đổi màu thương hiệu, cập nhật đồng thời: `tailwind.config.ts`, `viewport.themeColor` (`app/layout.tsx`),
> mã màu inline trong email (`lib/mailer.ts`), `app/icon.svg`.

## 2. Typography

| Thuộc tính | Giá trị |
| --- | --- |
| Font | **Be Vietnam Pro** (400, 500, 600, 700), subset `latin` + `vietnamese`, biến `--font-sans` |
| Body | `text-slate-700`, `antialiased` |
| Input | `text-base` trên mobile (tránh iOS tự zoom), `sm:text-sm` |

| Cấp | Class |
| --- | --- |
| H1 hero | `text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight` |
| H1 trang | `text-2xl sm:text-3xl font-bold` |
| H2 section | `text-2xl sm:text-3xl font-bold` |
| H3 thẻ | `text-lg font-bold` / `font-semibold` |
| Eyebrow | `.eyebrow` – chữ hoa nhỏ, nền gold-100, bo tròn |
| Chú thích | `text-xs text-slate-500` |

## 3. Layout & khoảng cách

| Token | Giá trị |
| --- | --- |
| `.container-page` | `max-w-6xl`, padding `px-4 sm:px-6 lg:px-8` |
| Khu admin | `max-w-[1600px]` (bảng rộng) |
| Section | `py-16 sm:py-20` |
| Header | cao `h-16`, `sticky top-0`, nền trắng 90% + blur |
| Neo cuộn | `scroll-mt-16` (bù header) |
| Breakpoint | Tailwind mặc định: `sm 640` · `md 768` · `lg 1024` · `xl 1280` |
| Bo góc | Nút/input `rounded-xl`, thẻ `rounded-2xl`, ảnh lớn `rounded-3xl` |
| Bóng | `.card`: `0 1px 3px rgba(23,42,61,.06)`; nổi: `shadow-lg shadow-ocean-900/5` |

## 4. Component

### Nút

| Class | Hình thức | Dùng khi |
| --- | --- | --- |
| `.btn` | Nền tảng: `min-h-44px`, `rounded-xl`, `font-semibold`, `active:scale-[.97]`, `focus-visible:ring-4`, disabled mờ 60% | Không dùng trực tiếp |
| `.btn-primary` | Nền ocean-600, chữ trắng | Hành động chính trong app (Lưu, Thêm, Bắt đầu học) |
| `.btn-gold` | Nền gold-400, chữ ocean-950 | Hành động mua/đăng ký |
| `.btn-outline` | Viền ocean-200, nền trắng | Hành động phụ (Gọi, Bài trước) |
| `.btn-ghost` | Trong suốt, hover ocean-50 | Link trong header, menu |
| `.btn-sm` | `min-h-36px`, `text-xs` | Trong bảng/thẻ admin |
| Nguy hiểm | `btn border border-red-200 text-red-600 hover:bg-red-50` | Xóa, Từ chối, Thu hồi |
| Duyệt | `btn bg-emerald-600 text-white` | Duyệt đơn |

**SubmitButton**: tự vô hiệu + hiện `SpinnerIcon` khi form đang gửi; `confirmMessage` → `window.confirm` trước khi gửi.

### Form

| Class | Mô tả |
| --- | --- |
| `.label` | `text-sm font-medium`, cách input `mb-1.5`. Trường bắt buộc có `*`, tùy chọn ghi "(không bắt buộc)" màu nhạt |
| `.input` | Viền slate-200, `rounded-xl`, `py-3`, focus viền ocean-400 + ring ocean-100. Dùng cho input, select, textarea |
| Gợi ý | `mt-1.5 text-xs text-slate-500` dưới input |
| Upload | Vùng `border-2 border-dashed border-ocean-200 rounded-2xl`, hover ocean-400; hiển thị preview + dung lượng |

### Thông báo

| Class / component | Dùng khi |
| --- | --- |
| `.alert-error` (`role="alert"`) | Lỗi trong form |
| `.alert-success` (`role="status"`) | Xác nhận trong trang |
| `Toaster` | Phản hồi sau thao tác; góc trên phải (mobile: giữa, dưới header), tự ẩn 4s, nút đóng, `aria-live="polite"` |

### Thẻ & nhãn

| Thành phần | Mô tả |
| --- | --- |
| `.card` | Nền trắng, viền slate-100, `rounded-2xl`, bóng nhẹ |
| `.badge` + `StatusBadge` | `pending` Chờ duyệt (gold) · `approved` Đã duyệt (emerald) · `rejected` Từ chối (red) · `published` Đang hiển thị (emerald) · `draft` Đang ẩn (slate) · `admin` Admin (ocean) |
| `.eyebrow` | Nhãn nhỏ phía trên tiêu đề section |

### Bảng (admin)

- Bọc trong `.card overflow-x-auto`; `min-w-[960px]`; header `bg-ocean-50/70 uppercase text-xs`.
- Cột thao tác `sticky right-0` có bóng trái; hàng hover `bg-ocean-50/40`.
- Ngày giờ 2 dòng (ngày / giờ nhạt). Ô trống hiển thị `—`.
- Dưới `md`: danh sách học viên chuyển sang dạng thẻ.

### Icon

SVG nội bộ trong `components/icons.tsx` (stroke, kế thừa `currentColor`, kích thước bằng class `h-4 w-4`…).
Không thêm thư viện icon; icon mới thêm vào cùng file theo cùng kiểu.

## 5. Chuyển động

| Hiệu ứng | Chi tiết |
| --- | --- |
| `animate-fade-up` | 0.4s ease-out, dịch 8px – dùng cho hero, thẻ login, toast |
| Nút nhấn | `active:scale-[0.97]` 150ms |
| Thanh tiến trình | `NavigationProgress` trên đầu trang khi chuyển route |
| Cuộn mượt | `scroll-behavior: smooth` |
| Giảm chuyển động | `prefers-reduced-motion: reduce` → tắt animation/transition, cuộn tức thì |

## 6. Khả năng tiếp cận (checklist bắt buộc cho UI mới)

- [ ] Mỗi input có `<label htmlFor>`; ảnh có `alt` mô tả.
- [ ] Vùng chạm ≥ 44×44px (`.btn`).
- [ ] Focus nhìn thấy được (`focus-visible:ring-4`).
- [ ] Lỗi dùng `role="alert"`, trạng thái dùng `role="status"`.
- [ ] Menu: `aria-haspopup`, `aria-expanded`, `role="menu"/"menuitem"`.
- [ ] Trang hiện tại: `aria-current="page"`.
- [ ] Độ tương phản chữ ≥ 4.5:1 (lưu ý chữ trên nền gold dùng `ocean-950`).
- [ ] `inputMode`, `autoComplete` đúng loại (tel, email, name, new-password, current-password).

## 7. Giọng văn (UX writing)

- Tiếng Việt có dấu, xưng "bạn", câu ngắn, lịch sự.
- Thông báo lỗi nói **điều gì sai + cách sửa** (VD: "Số điện thoại không hợp lệ (VD: 0912345678).").
- Thông báo thành công bắt đầu bằng "Đã …".
- Nút dùng động từ: "Đăng ký", "Lưu thay đổi", "Thêm bài học", "Bắt đầu học".
- Khi bế tắc (không có email, đơn bị từ chối): luôn đưa **hotline**.

## 8. Thành phần mới phiên bản 0.2 (chưa triển khai)

| Thành phần | Mô tả |
| --- | --- |
| `ProgressBar` | Thanh cao 6px (`rounded-full bg-slate-100`, phần đã xong `bg-ocean-500`; 100% dùng `bg-emerald-500`) + chữ nhỏ `text-xs text-slate-500` "18/72 bài · 25%". `role="progressbar"`, `aria-valuenow/min/max`, `aria-label` |
| `CourseCover` | Ảnh bìa tỉ lệ 16:9 `rounded-xl object-cover` (`next/image`); không có ảnh → nền gradient ocean + icon cột sống |
| Nhãn loại khóa | `MIỄN PHÍ` (emerald) · `VẸO LƯNG` / `VẸO NGỰC` (ocean) · `PREMIUM 1:1` (gold đậm, chữ `ocean-950`) |
| Nhãn hạn học | `Còn N ngày` (slate) · ≤ 7 ngày (gold) · `Đã hết hạn` (red) |
| `StatusBadge` bổ sung | `staff` Nhân viên (violet) · phiếu `new` Mới (gold) / `contacted` Đã liên hệ (ocean) / `done` Hoàn tất (emerald) / `cancelled` Hủy (slate) · lead `converted` Đã chốt (emerald) / `closed` Đóng (slate) · nguồn `web` / `zalo` |
| `SessionAccordion` | Buổi thu gọn/mở rộng: tiêu đề "Buổi 4 · 1/6 ✓"; buổi khóa có icon 🔒 + lý do màu slate-400; buổi xong có ✓ emerald |
| `LessonCheck` | Ô tick tròn 28px trong vùng chạm 44px; đã tập: nền emerald + ✓; `aria-pressed`, nhãn "Đánh dấu đã tập <tên bài>" |
| CTA học tập | Nút chính `btn-gold btn-lg` ("Tiếp tục Buổi X", "Hoàn thành & bài tiếp theo"); mobile cố định đáy (`sticky bottom-0` có nền trắng + bóng trên) |
| `StatCard` (dashboard) | `.card p-4`: nhãn nhỏ, số lớn `text-2xl font-bold`, dòng phụ; cả thẻ là link tới danh sách đã lọc; không dùng màu cảnh báo trừ khi cần hành động (sắp hết hạn = gold, đơn chờ > 24h = red) |
| `ConsentCheckbox` | Ô tick + chữ có link "Chính sách bảo mật" (mở tab mới); lỗi `role="alert"` ngay dưới |
| `OneTimeSecret` | Khung emerald hiển thị mật khẩu vừa sinh (font mono, chữ lớn) + [Chép tin nhắn gửi Zalo]; cảnh báo "Chỉ hiện một lần" |

UX writing v0.2: gọi người dùng là "bạn" trên giao diện bệnh nhân; trong quản trị gọi là "bệnh nhân"; nút hành động học tập luôn
nói rõ buổi/bài ("Tiếp tục Buổi 4 – Bài 2"), tránh chữ chung chung "Tiếp tục".
