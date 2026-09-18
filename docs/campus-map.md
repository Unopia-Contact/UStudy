# Campus Map và mã phòng Portal

Campus Map dùng ID vật lý của UStudy theo cấu trúc `campus/building/floor/room`. Mã Portal không phải ID bản đồ. Ví dụ đã xác nhận:

```text
P.cs2:PM_B4-2_6.2 → dong-hoa/b4-2/6/2
```

## Nguồn dữ liệu

- `src/assets/data/campus-map/campuses.ts`: inventory vật lý (cơ sở, tòa, tầng, phòng). Chỉ thêm địa điểm đã xác minh; `status` và `verification` ghi mức tin cậy.
- `src/assets/data/campus-map/floor-maps.ts`: nơi duy nhất khai báo asset sơ đồ tầng, keyed theo `campus/building/floor`. SVG đặt dưới `public/maps/floors/`. Không thêm `floor.map` vào inventory.
- `src/integrations/hcmus-portal/rooms/bindings.ts`: mã Portal ánh xạ sang `RoomId`. Có thể có nhiều mã Portal trỏ tới cùng một phòng.
- `src/domain/campus-map`: tạo ID, bảng phẳng runtime, tìm kiếm và validator.
- `src/integrations/hcmus-portal/rooms`: lấy mã gốc từ chuỗi lịch, tạo index và resolver.

Để thêm mã mới, trước hết thêm phòng vào inventory, sau đó mới thêm binding. Nếu mã chỉ suy đoán, dùng `status: 'inferred'` và ghi `note`; không đánh dấu `verified` khi chưa có nguồn. Chạy `pnpm exec vitest run tests/unit/campus-map.test.ts` sau khi cập nhật. Validator kiểm tra ID trùng, phòng tham chiếu không tồn tại, shape thiếu, collision exact/equivalent và binding verified không có nguồn.

Resolver ưu tiên exact → equivalent → structural. Structural chỉ trả phòng có thật trong inventory và link sẽ ghi “Vị trí suy luận”. Mã trùng nhiều phòng hoặc không đủ dữ liệu thì không tạo link bản đồ. Không lưu `RoomId` vào dữ liệu người dùng; lịch giữ mã Portal gốc trong session runtime.

Hiện inventory mới chỉ có ví dụ `PM_B4-2_6.2` do người dùng xác nhận. Các mã `D207`, `TNHDC_A107`, `TNL_A211` và sơ đồ SVG chưa được xác minh nên chưa đưa vào inventory/binding. Liên kết từ danh bạ đời cũ dùng ID khác sẽ hiện cảnh báo thay vì mở nhầm tòa nhà.

## Giao diện bản đồ Đông Hòa

`campusmap.tsx` là giao diện đang dùng: map bên trái, thông tin bên phải. Danh sách tòa, số tầng và phòng chỉ lấy từ `campuses.ts`. Chọn tòa trên bản đồ hoặc trong danh sách để xem thông tin; chọn tầng rồi bấm **Xem bản đồ tầng** mới chuyển canvas bên trái. Link `roomId` từ thời khóa biểu mở tầng/phòng tương ứng.

`DongHoaCampusDiagram.tsx` chỉ chứa hình học sơ đồ khuôn viên CS2. Nhãn A–G và NĐH trên hình không tự tạo tòa, tầng hay phòng; chỉ tòa có trong `campuses.ts` mới bấm được và xuất hiện trong danh sách. B4.2 hiện có trong inventory nhưng chưa có vị trí trên sơ đồ khuôn viên.

Hiện `campuses.ts` khai báo hai tòa ở Đông Hòa: B4.2 (1 tầng) và Nhà điều hành (8 tầng). Vì vậy panel hiển thị 2 tòa, 9 tầng; hình A–G trên sơ đồ không cộng vào các con số này.
