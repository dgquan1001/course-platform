# ADR-018: Song ngữ trang chủ – tiếng Việt ở `/`, tiếng Anh ở `/en` (từ điển tĩnh)

- **Trạng thái**: Accepted – triển khai Đợt 20 (17/10/2026)
- **Ngày**: 17/10/2026
- **Người quyết định**: Chủ dự án yêu cầu "ô chuyển ngôn ngữ Việt ↔ Anh như irc.coach, chuyển ngữ ở trang chủ" và để dev tự quyết cách làm

## Bối cảnh
- irc.coach dùng WordPress + plugin đa ngôn ngữ: bản tiếng Anh ở đường dẫn riêng `/en/`, nút chuyển ngữ trong menu.
- Trang chủ là trang tĩnh ISR (ADR-008), CSP chỉ cho script / ảnh cùng domain (security-design), chạy trên Cloudflare Workers (ADR-017).
- Nội dung khóa học (tên, mô tả, bài học) do admin nhập bằng tiếng Việt; form đăng ký, đăng nhập, khu học tập, thông báo lỗi server đều tiếng Việt;
  khách hàng chính là người Việt, thanh toán chuyển khoản VietQR trong nước.

Các phương án:
1. **Widget dịch máy** (Google Translate…): phải nới CSP cho script / iframe bên thứ ba, dịch thuật ngữ y khoa sai, chữ nhảy sau khi tải, không SEO được.
2. **Thư viện i18n đầy đủ** (next-intl, route `[locale]` cho toàn site): phải dời toàn bộ `app/` vào `app/[locale]`, dịch form / lỗi / trang quản trị
   và nội dung khóa trong database (cần thêm cột) – lớn hơn nhiều so với yêu cầu.
3. **Từ điển tĩnh + route `/en` chỉ cho trang chủ** ✅

## Quyết định
- `app/page.tsx` (vi) và `app/en/page.tsx` (en) cùng render `components/home/HomePage.tsx` với `locale`; cả hai **ISR 300 giây**,
  `revalidatePath('/', 'layout')` khi admin sửa khóa làm mới cả `/en`.
- Toàn bộ chữ cố định ở `lib/i18n.ts` (`homeCopy`, `cardCopy`, `chromeCopy`) – người dịch chuyên môn sửa một file, có kiểu TypeScript
  bắt buộc đủ khóa cho cả 2 ngôn ngữ. Hồ sơ bác sĩ tiếng Việt vẫn lấy từ `lib/site-config.ts` (một nguồn).
- **Nút chuyển ngữ** `components/LangSwitch.tsx`: viên "VI | EN" trên header, chỉ hiện ở `/` và `/en`; chuyển giữ nguyên mục đang xem
  (`/#bac-si` ↔ `/en#bac-si`); là `<Link>` thật (`hrefLang`, `lang`) nên tắt JS vẫn dùng được.
- Header, chân trang đổi ngôn ngữ theo đường dẫn (`localeOfPath`); trang khác luôn tiếng Việt.
- SEO / truy cập: `alternates.languages` (hreflang vi / en) + `canonical` ở cả 2 trang; `/en` có `title`, `description`, Open Graph `en_US`;
  `<main lang="en">` và `HtmlLang` đổi `<html lang>` khi đang ở `/en` (layout gốc giữ `lang="vi"`).
- **Không dịch**: tên / mô tả khóa học (dữ liệu admin), form đăng ký, đăng nhập, khu học tập, quản trị. Trên `/en`, mục "Enroll" tóm tắt 3 bước
  bằng tiếng Anh + nút "Open the registration form (in Vietnamese)" → `/#dang-ky`; nút "Register" trên thẻ khóa → `/?course=<id>#dang-ky` (như bản Việt).
- Không tự chuyển hướng theo ngôn ngữ trình duyệt (tránh khóa người Việt dùng trình duyệt tiếng Anh ở bản Anh, giữ trang tĩnh).

## Hệ quả
- ✅ Không thêm thư viện, không nới CSP, không đổi database; `/en` cũng là trang tĩnh trả từ cache Cloudflare.
- ✅ SEO cho cả 2 ngôn ngữ (hreflang), không nháy chữ như dịch máy.
- ⚠️ Khách nước ngoài vẫn gặp tiếng Việt ở tên khóa, form đăng ký, trang học → ghi rõ "(in Vietnamese)" ở nút; khi có nhu cầu thật, mở rộng
  bằng cột `title_en`, `summary_en` cho khóa và dịch form (phương án 2) – RK-57.
- ⚠️ Thêm chữ mới ở trang chủ phải thêm cả 2 ngôn ngữ trong `lib/i18n.ts` (TypeScript báo lỗi nếu thiếu khóa ở bản `en`).
