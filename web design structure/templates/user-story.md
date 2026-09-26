### US-XX.YY – <Tên ngắn> ⬜ (<SP> SP)

**Là** <vai trò: khách / học viên / admin>, **tôi muốn** <mục tiêu>, **để** <lợi ích>.

- **Epic**: EP-XX
- **Persona**: P1 / P2 / P3 …
- **FR liên quan**: FR-xxx (thêm vào `01-requirements/srs.md` nếu mới)
- **BR liên quan**: BR-xx
- **Màn hình**: SCR-xx
- **Ưu tiên**: M / S / C / W

**Tiêu chí chấp nhận**
- **AC1** Given <bối cảnh> When <hành động> Then <kết quả quan sát được>.
- **AC2** Given … When … Then …
- **AC (lỗi)** Given <dữ liệu sai> When … Then <thông báo lỗi chính xác bằng tiếng Việt>.
- **AC (quyền)** Given <vai trò không đủ quyền> When … Then <bị chặn ở đâu: middleware / action / RLS>.

**Ghi chú thiết kế**
- Dữ liệu: bảng/cột mới?
- Quyền: policy RLS mới?
- UI: trạng thái loading / rỗng / lỗi / thành công.

**Kiểm thử**
- TC-xx (E2E) / kiểm thử thủ công.

**Definition of Done**: theo `08-testing/test-plan.md §6`.
