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
> mã màu inline trong email (`lib/mailer.ts`), `app/icon.svg` (+ sinh lại `public/favicon.ico` từ file này).

## 2. Typography

| Thuộc tính | Giá trị |
| --- | --- |
| Font | **Be Vietnam Pro** (400, 500, 600, 700), subset `latin` + `vietnamese`, biến `--font-sans` |
| Body | `text-slate-700`, `antialiased` |
| Input | `text-base` trên mobile (tránh iOS tự zoom), `sm:text-sm` |

| Cấp | Class |
| --- | --- |
| H1 hero | `text-3xl sm:text-4xl lg:text-[3.25rem] font-bold leading-tight` (Đợt 19) |
| H1 trang | `text-2xl sm:text-3xl font-bold` |
| H2 section | `.section-title` = `text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight` (trang chủ, Đợt 19); trang khác `text-2xl sm:text-3xl font-bold` |
| Từ khóa nổi bật | `.text-gradient` – chữ chuyển ocean-600 → gold-600 (VD "toàn diện" ở hero), chỉ dùng cho 1–3 từ trong tiêu đề |
| H3 thẻ | `text-lg font-bold` / `font-semibold` |
| Eyebrow | `.eyebrow` – chữ hoa nhỏ, nền gold-100, bo tròn |
| Chú thích | `text-xs text-slate-500` |

## 3. Layout & khoảng cách

| Token | Giá trị |
| --- | --- |
| `.container-page` | `max-w-6xl`, padding `px-4 sm:px-6 lg:px-8` |
| Khu admin | `max-w-[1600px]` (bảng rộng) |
| Section | `py-16 sm:py-20`; trang chủ `py-16 sm:py-24` (Đợt 19) |
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

- Bọc trong `.card overflow-x-auto`; `min-w-[960px]`; header `bg-ocean-50/70 uppercase text-xs`. Đợt 23: trong `.admin-shell` tiêu đề cột `text-[11px]` đậm nhẹ + viền dưới, dòng sáng `bg-ocean-50/40` khi rê (CSS chung, không sửa từng bảng).
- Cột thao tác `sticky right-0` có bóng trái; hàng hover `bg-ocean-50/40`.
- Ngày giờ 2 dòng (ngày / giờ nhạt). Ô trống hiển thị `—`.
- Dưới `md`: danh sách học viên chuyển sang dạng thẻ.

### Icon

SVG nội bộ trong `components/icons.tsx` (stroke, kế thừa `currentColor`, kích thước bằng class `h-4 w-4`…).
Không thêm thư viện icon; icon mới thêm vào cùng file theo cùng kiểu.

## 5. Chuyển động

| Hiệu ứng | Chi tiết |
| --- | --- |
| `animate-fade-up` | 0.4s ease-out, dịch 8px – dùng cho thẻ login, toast |
| `animate-fade-up-slow` (Đợt 19) | 0.8s, đường cong `cubic-bezier(.2,.7,.2,1)` – hero trang chủ, các dòng hiện so le bằng `[animation-delay:100ms…400ms]` |
| Hiện dần khi cuộn – `data-reveal` (Đợt 19) | `components/RevealObserver.tsx` (IntersectionObserver) thêm class `is-visible` khi phần tử vào màn hình; CSS ở `app/globals.css`: mờ → rõ + dịch 28px trong 0.7s. Biến thể `data-reveal="left"` / `"right"` (trượt ngang 36px), `"zoom"` (scale .94). So le: `style={revealDelay(i)}` (`lib/reveal.ts`, mặc định 90ms/phần tử). **Chỉ ẩn khi JS đã chạy** (`html.reveal-ready`) và phần tử đang trong màn hình lúc tải được hiện ngay → tắt JS / máy tìm kiếm vẫn thấy nội dung. Không đặt `data-reveal` trong danh sách do client render lại (VD bộ lọc `ProgramGrid`) và không đặt chung phần tử với `.card-lift` (đè `transition`) – bọc thêm một lớp |
| `CountUp` (Đợt 19) | Số đếm tăng 1.6s (ease-out) khi hiện ≥ 60%; server render sẵn giá trị cuối, định dạng `13.000` tự viết (không `toLocaleString`, tránh lệch hydration) |
| `animate-float` (Đợt 19) | Bồng bềnh lên xuống 10px, 6s – thẻ nổi quanh ảnh bác sĩ (lệch pha bằng `[animation-delay:-3s]`) |
| `animate-blob` (Đợt 19) | Vệt màu `blur-3xl` di chuyển chậm 18s làm nền hero, Premium, khối tư vấn (`aria-hidden`, `pointer-events-none`) |
| `animate-marquee` (Đợt 19) | Dải chuyên môn chạy ngang 40s, lặp danh sách 2 lần (bản lặp `aria-hidden`), rê chuột thì dừng |
| `.card-lift` (Đợt 19) | Thẻ nhấc lên 4px + bóng `shadow-lg shadow-ocean-900/10` khi rê chuột (thẻ khóa học, lợi ích, chuyên môn); ảnh bìa / ảnh hoạt động phóng to nhẹ (`group-hover:scale-105/110`, 0.7s) |
| **Đợt 20 – mạnh hơn** | |
| `animate-word-in` | Tiêu đề hero hiện **từng từ** (0.9s, mờ nhòe 10px → rõ, trồi 0.55em, xoay 2°), mỗi từ trễ 70ms (`KineticTitle` trong `components/home/HomePage.tsx`) |
| `data-reveal` mạnh hơn | Dịch 48px (trái / phải 64px, zoom .88) + `blur(8px)` → rõ trong 0.9s |
| Parallax – `data-parallax` | CSS scroll-driven `animation-timeline: view()`: phần tử trôi `±var(--parallax, 40px)` khi cuộn qua (ảnh bác sĩ ở hero). Không dùng JS; chỉ bật trong `@supports (animation-timeline: scroll())` + `prefers-reduced-motion: no-preference` – trình duyệt chưa hỗ trợ (Firefox) đứng yên |
| Thanh tiến độ cuộn `.scroll-progress` | Vạch 4px gradient vàng → xanh ở đỉnh màn hình, `scaleX` theo `animation-timeline: scroll(root)` (cùng điều kiện như parallax) |
| `.timeline-fill` | Đường "Quá trình công tác" tự vẽ từ trên xuống khi cuộn tới (`view()`, `animation-range: entry 20% cover 60%`) |
| `.spotlight` | Quầng sáng xanh 420px chạy theo con trỏ trong thẻ (biến `--mx`/`--my` do `RevealObserver` ghi khi `pointermove`) – thẻ khóa học, lợi ích, chuyên môn |
| `.btn-shine` | Vệt sáng lướt qua nút vàng chính mỗi 3.5s (chỉ `::after` chuyển động – nút không xê dịch nên Playwright / người dùng bấm bình thường) |
| `animate-spin-slow` | Viền gradient conic vàng – xanh xoay 14s quanh ảnh bác sĩ (lớp `-inset-1/2` trong khung `overflow-hidden`) |
| `animate-glow` | Quầng sáng vàng thở 5s sau ảnh bác sĩ / khối bento |
| `animate-marquee-reverse` | Dải chuyên môn thứ 2 (xanh, `aria-hidden`) chạy ngược chiều, hai dải đặt chéo ±2° đè lên đáy hero |
| `animate-scroll-cue` | Biểu tượng chuột "Cuộn xuống" ở đáy hero (≥ lg) |
| Nút nhấn | `active:scale-[0.97]` 150ms |
| Thanh tiến trình | `NavigationProgress` trên đầu trang khi chuyển route |
| Cuộn mượt | `scroll-behavior: smooth` |
| Giảm chuyển động | `prefers-reduced-motion: reduce` → tắt animation/transition, cuộn tức thì; `RevealObserver` hiện ngay mọi phần tử, `CountUp` không đếm (TC-112) |

Nguyên tắc: chuyển động chỉ dùng `opacity` / `transform` (không gây dàn trang lại), không thêm thư viện animation (AOS, GSAP…),
không tự chạy âm thanh/video; trang chủ là nơi duy nhất dùng hiệu ứng cuộn – trang học và quản trị giữ tĩnh để tập trung.
Đợt 20: mọi hiệu ứng mới vẫn chỉ dùng `opacity` / `transform` / `filter`; `prefers-reduced-motion` tắt cả hiệu ứng theo cuộn (scroll-driven) và vệt sáng nút.
Không đặt nút / link bên trong phần tử chạy liên tục (`animate-float`, `animate-marquee`): khó bấm và Playwright không bao giờ thấy "đứng yên" (RK-56).

### 5.1. Bố cục trang chủ hiện đại (Đợt 20)

Nghiên cứu xu hướng 2026: **bento grid** cho phần dịch vụ / lợi ích (6 – 9 ô, xếp 1 cột trên điện thoại), chuyển động **gắn với cuộn trang**
(CSS scroll-driven, không thư viện), **kinetic typography** có chừng mực; tránh 3D / WebGL (nặng, hao pin điện thoại) – nguồn tham khảo ở project-review §7.12.

| Thành phần | Mô tả |
| --- | --- |
| Hero tối | Nền `ocean-950` + 3 vệt màu `animate-blob` (ocean-500/40, gold-400/20, ocean-300/25) + lưới mờ `.bg-grid` (56px, mask hình elip); chữ trắng, từ nhấn `.text-gradient-light` (gold-300 → ocean-200); cao gần hết màn hình (`lg:min-h-[calc(100svh-4rem)]`) |
| `.glass` | Kính mờ trên nền tối: `border-white/15 bg-white/10 backdrop-blur-md` (nút phụ, thẻ đau mỏi, bước đăng ký). Trên ảnh sáng dùng `bg-ocean-950/70` để chữ đủ tương phản |
| `.eyebrow-dark` | Nhãn nhỏ trên nền tối (viền trắng 15%, chữ gold-200) |
| Bento "Vấn đề → giải pháp" | Lưới 4 cột × 2 hàng (≥ lg): ô lớn 2×2 nền gradient ocean-900 → ocean-600 (tiêu đề, 4 nỗi đau dạng thẻ kính) + 4 ô lợi ích trắng `rounded-[2rem]`, icon xoay 6° và đổi nền khi rê |
| Mục bác sĩ | Cột ảnh **dính khi cuộn** (`lg:sticky lg:top-24`) + trích dẫn nguyên văn của bác sĩ; cột hồ sơ cuộn bên cạnh (học vấn, chuyên môn 2×2, dòng thời gian tự vẽ); 4 ảnh hoạt động dọc `aspect-[4/5]`, chú thích trồi lên khi rê |
| Số liệu | Số lớn `text-6xl` chữ gradient, ngăn bằng `divide-x` |
| `.section-title` | `text-3xl sm:text-4xl lg:text-5xl`, `leading-[1.1] tracking-tight` |
| Chân trang | Nền `ocean-950`, chữ ocean-100, nhấn gold-300 (mọi trang) |
| Nút chuyển ngữ `LangSwitch` | Viên bo tròn nền ocean-50, biểu tượng quả địa cầu, 2 nút "VI" "EN" 40×32px; nền **vàng gold-400 trượt** (300ms) sang ngôn ngữ đang chọn; `aria-current`, `hrefLang`, `aria-label` "Tiếng Việt" / "English". Chỉ hiện ở trang chủ (ADR-018) |

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

## 8. Thành phần phiên bản 0.2 (✅ đã triển khai Đợt 8 → 13)

| Thành phần | Mô tả |
| --- | --- |
| `ProgressRing` (Đợt 15, thay `ProgressBar`) | Vòng tròn SVG: rãnh `stroke-slate-100`, cung đã tập `stroke-ocean-500` (100% → `stroke-emerald-500`, kèm chữ "Đã hoàn thành" nên không chỉ dựa vào màu), đầu cung bo tròn, số % đậm `text-slate-800` ở giữa; bên cạnh "18/72 bài" + "hoàn thành". Cỡ `md` 56px (thẻ khóa, trang khóa, hồ sơ khách hàng) · `sm` 36px (header trình học, danh sách quản trị). Truyền `value` (VD tiến độ trung bình ở danh sách khách hàng) thì chỉ hiện vòng. `role="progressbar"`, `aria-valuenow/min/max`, `aria-label`; chuyển động chỉ khi không bật `prefers-reduced-motion` |
| `PasswordInput` (Đợt 15) | `.input` + nút con mắt 44px bên phải (`type="button"`, `aria-label` "Hiện mật khẩu" / "Ẩn mật khẩu", `aria-pressed`, `aria-controls`); icon `EyeIcon` / `EyeOffIcon` màu slate-400, hover ocean-700. Dùng cho mọi ô mật khẩu |
| Sidebar quản trị (Đợt 15) | ≥ `lg`: thẻ trắng rộng 224px, `sticky top-24`; tiêu đề "Bảng quản trị" + nhãn vai trò; mỗi mục icon 20px + nhãn, đang mở: nền `ocean-50` + vạch trái 4px `ocean-500`; số đếm: viên tròn `bg-ocean-600` chữ trắng 11px (> 99 → "99+"), có chữ ẩn cho trình đọc màn hình. < `lg`: hàng tab gạch chân cuộn ngang (không icon). Trang admin 2 cột (nội dung + form 380px) chỉ chia cột từ `xl` để không chật cạnh sidebar |
| `CourseCover` | Ảnh bìa tỉ lệ 16:9 `rounded-xl object-cover` (`next/image`); không có ảnh → nền gradient ocean + icon cột sống |
| Nhãn loại khóa | `MIỄN PHÍ` (emerald) · `VẸO LƯNG` / `VẸO NGỰC` (ocean) · `PREMIUM 1:1` (gold đậm, chữ `ocean-950`) |
| Nhãn hạn học | `Còn N ngày` (slate) · ≤ 7 ngày (gold) · `Đã hết hạn` (red) |
| `StatusBadge` bổ sung | `staff` Nhân viên (violet) · phiếu `new` Mới (gold) / `contacted` Đã liên hệ (ocean) / `done` Hoàn tất (emerald) / `cancelled` Hủy (slate) · lead `converted` Đã chốt (emerald) / `closed` Đóng (slate) · nguồn `web` / `zalo` |
| `SessionAccordion` | Buổi thu gọn/mở rộng: tiêu đề "Buổi 4 · 1/6 ✓"; buổi khóa có icon 🔒 + lý do màu slate-400; buổi xong có ✓ emerald |
| `LessonCheck` | Ô tick tròn 28px trong vùng chạm 44px; đã tập: nền emerald + ✓; `aria-pressed`, nhãn "Đánh dấu đã tập <tên bài>" |
| CTA học tập | Nút chính `btn-gold btn-lg` ("Tiếp tục Buổi X", "Hoàn thành & bài tiếp theo"); mobile cố định đáy (`sticky bottom-0` có nền trắng + bóng trên) |
| `StatCard` (dashboard) | ✅ `.card p-4` + viền trái 4px: nhãn nhỏ in hoa, số lớn `text-3xl font-bold tabular-nums`, dòng phụ; cả thẻ là link tới danh sách đã lọc. Viền ocean mặc định; gold khi cần làm (đơn chờ, sắp hết hạn, lead mới), red khi có phiếu tham vấn mới – luôn kèm chữ, không chỉ dựa vào màu |
| Thanh tiến độ trung bình (dashboard) | ✅ `role="meter"`, rãnh `bg-ocean-100` cao 8px, phần đã tập `bg-ocean-500`; số % và số khách hàng ghi rõ bên cạnh |
| Doanh thu (chỉ admin) | ✅ Số lớn (≥ 36px) tháng này + so với tháng trước (▲/▼ %); 4 bảng (chương trình / hình thức / nguồn / người xử lý), mỗi dòng thanh ngang một màu `ocean-500` tỉ lệ trong bảng + số tiền, số đơn; rê chuột xem chi tiết (`title`). Một màu vì chỉ thể hiện độ lớn, không có chuỗi so sánh |
| `ConsentCheckbox` | Ô tick + chữ có link "Chính sách bảo mật" (mở tab mới); lỗi `role="alert"` ngay dưới |
| `LoginReminders` | ✅ Hộp thoại giữa màn hình (`role="dialog"`, `aria-modal`): đồng ý chính sách (bắt buộc) hoặc "Bạn nên đổi mật khẩu" [Đổi ngay] [Để sau] |
| Thang 0–10 (phiếu tham vấn) | ✅ 11 ô vuông 40px (radio ẩn, `peer-checked` tô ocean), nhãn phụ "0 = không đau · 10 = rất nặng"; Có/Không là radio 20px |
| `.alert-warning` | ✅ Khung gold nhạt cho lời nhắc (VD mật khẩu do nhân viên cấp) |
| `OneTimeSecret` | ✅ Khung emerald hiển thị mật khẩu vừa sinh (font mono, chữ lớn) + tin nhắn mẫu + [Chép tin nhắn gửi Zalo]; ghi "chỉ hiện một lần" |

UX writing v0.2: gọi người dùng là "bạn" trên giao diện khách hàng; trong quản trị gọi là "khách hàng"; nút hành động học tập luôn
nói rõ buổi/bài ("Tiếp tục Buổi 4 – Bài 2"), tránh chữ chung chung "Tiếp tục".

## 9. Khu quản trị (Đợt 23 – UI-10)

| Thành phần | Mô tả | Mã nguồn |
| --- | --- | --- |
| Khung | ≥ lg: lưới `15rem | 1fr`; thanh bên `bg-ocean-950` dính khi cuộn (cao `100vh - 4rem`), nội dung nền `bg-slate-100/70`, rộng tối đa 1400px. < lg: dải tối phía trên + hàng tab cuộn ngang | `app/admin/layout.tsx` (`.admin-shell`) |
| Menu | Mục: icon `ocean-300` + chữ `ocean-200`; rê: `bg-white/5`; đang mở: `bg-white/10` chữ trắng, icon `gold-300`, vạch vàng 4px bên trái. Điện thoại: mục đang mở nền trắng chữ `ocean-950` | `app/admin/AdminNav.tsx` |
| Số việc cần làm | Viên `bg-gold-400 text-ocean-950` cạnh mục menu (đơn chờ, phiếu mới, khách mới) | `app/admin/NavCount.tsx` |
| Tiêu đề trang | H2 `text-2xl` + mô tả `text-sm slate-500` (≤ 2 dòng) + nút chính bên phải (`btn-gold` cho "Tạo / Thêm") + dòng "← quay lại" khi là trang con | `components/admin/PageHeader.tsx` |
| Bộ lọc dạng viên | `.seg` (khung trắng viền nhạt) + `.seg-item`; mục đang chọn `aria-current="page"` nền `ocean-600` chữ trắng. Dùng cho tab trạng thái đơn, phiếu, khách, loại khóa, khách hàng / nhân viên, tab trong trang khóa | `app/globals.css` |
| Thẻ KPI | Nhãn chữ hoa nhỏ + ô icon 36px (màu theo mức: xanh / vàng "Cần chú ý" / đỏ "Cần xử lý" – luôn kèm chữ) + số `text-3xl` + dòng phụ; nhấc nhẹ khi rê | `components/StatCard.tsx` |
| Thẻ khóa học | Ảnh bìa 16:10 trái + nhãn loại / trạng thái + tên (link tới trang sửa) + giá "Từ … · gói" + số bài / học viên; **hàng thao tác dưới thẻ** (nền `slate-50`): Sửa (primary) · Buổi – bài · Ẩn / Hiển thị · Xem trang ↗ · Xóa (đỏ, căn phải) | `app/admin/courses/page.tsx` |
| Vùng nguy hiểm | Thẻ viền đỏ, tiêu đề đỏ có icon cảnh báo; bị chặn → `.alert-warning role="note"`; được xóa → ô gõ lại tên + nút đỏ chỉ mở khi gõ đúng | `app/admin/courses/DeleteCourse.tsx` |
| Trạng thái rỗng | Icon `InboxIcon` xám nhạt + câu ngắn + nút hành động (nếu có) | các trang danh sách |
