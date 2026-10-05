# Checklist phát hành – phiên bản <x.y.z>

**Ngày**: … · **Người phát hành**: …

## Trước khi deploy
- [ ] Tất cả PR trong đợt đã được review và merge vào `main`.
- [ ] `npm run lint` ✓ · `npx tsc --noEmit` ✓ · `npm run build` ✓
- [ ] `npm run test:e2e` ✓ trên **staging** (đính kèm log)
- [ ] Thay đổi database đã chạy trên staging; đã **backup** production
- [ ] Thay đổi DB tương thích ngược với code đang chạy
- [ ] Biến môi trường mới đã thêm trên Cloudflare (Build variables cho `NEXT_PUBLIC_*`, Secret cho khóa bí mật)
- [ ] `MAIL_OUTBOX_URL` (trước Đợt 17: `MAIL_OUTBOX_DIR`) **không** được đặt trên production
- [ ] Tài liệu đã cập nhật; ghi `version` mới trong `package.json`

## Deploy
- [ ] Chạy SQL trên production (nếu có) → `notify pgrst, 'reload schema'`
- [ ] Push `main` → Workers Builds deploy xanh; `npm run test:e2e:workers` PASS trước đó
- [ ] Ghi lại commit hash / deployment URL

## Sau khi deploy (smoke test ≤ 10 phút)
- [ ] Trang chủ, danh sách khóa, QR
- [ ] Đăng nhập admin, bảng đơn, xem ảnh chuyển khoản
- [ ] Học viên test mở được bài học
- [ ] Gửi mã quên mật khẩu tới email thật
- [ ] Không có lỗi mới trong Workers Logs / Sentry

## Rollback (nếu lỗi)
- [ ] Cloudflare › Workers › hv-web › Deployments › Rollback bản trước
- [ ] Hoàn tác SQL (script rollback đã chuẩn bị) hoặc khôi phục backup
- [ ] Thông báo cho admin trung tâm

## Ghi chú phát hành
| Loại | Nội dung |
| --- | --- |
| Tính năng mới | |
| Sửa lỗi | |
| Thay đổi cần báo người dùng / admin | |
