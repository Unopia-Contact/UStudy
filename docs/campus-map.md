# Campus Map và mã phòng Portal

Campus Map dùng ID vật lý của UStudy theo cấu trúc `campus/building/floor/room`. Mã Portal không phải ID bản đồ. Ví dụ đã xác nhận:

```text
P.cs2:PM_B4-2_6.2 → dong-hoa/b4-2/6/2
```

## Nguồn dữ liệu

- `src/assets/data/campus-map/campuses.ts`: inventory vật lý (cơ sở, tòa, tầng, phòng). Chỉ thêm địa điểm đã xác minh; `status` và `verification` ghi mức tin cậy.
- `src/integrations/hcmus-portal/rooms/bindings.ts`: mã Portal ánh xạ sang `RoomId`. Có thể có nhiều mã Portal trỏ tới cùng một phòng.
- `src/domain/campus-map`: tạo ID, bảng phẳng runtime, tìm kiếm và validator.
- `src/integrations/hcmus-portal/rooms`: lấy mã gốc từ chuỗi lịch, tạo index và resolver.

Để thêm mã mới, trước hết thêm phòng vào inventory, sau đó mới thêm binding. Nếu mã chỉ suy đoán, dùng `status: 'inferred'` và ghi `note`; không đánh dấu `verified` khi chưa có nguồn. Chạy `pnpm exec vitest run tests/unit/campus-map.test.ts` sau khi cập nhật. Validator kiểm tra ID trùng, phòng tham chiếu không tồn tại, shape thiếu, collision exact/equivalent và binding verified không có nguồn.

Resolver ưu tiên exact → equivalent → structural. Structural chỉ trả phòng có thật trong inventory và link sẽ ghi “Vị trí suy luận”. Mã trùng nhiều phòng hoặc không đủ dữ liệu thì không tạo link bản đồ. Không lưu `RoomId` vào dữ liệu người dùng; lịch giữ mã Portal gốc trong session runtime.

Hiện inventory mới chỉ có ví dụ `PM_B4-2_6.2` do người dùng xác nhận. Các mã `D207`, `TNHDC_A107`, `TNL_A211` và sơ đồ SVG chưa được xác minh nên chưa đưa vào inventory/binding. Liên kết từ danh bạ đời cũ dùng ID khác sẽ hiện cảnh báo thay vì mở nhầm tòa nhà.

## Giao diện bản đồ Đông Hòa

`CampusMapTwoPanel.tsx` là giao diện đang dùng: map bên trái, thông tin bên phải. Ban đầu panel hiện danh sách tòa, số tòa và số tầng được khai báo. Chọn tòa bằng danh sách hoặc vùng trên bản đồ chỉ đổi panel thông tin; chọn tầng rồi bấm **Xem bản đồ tầng** mới chuyển canvas bên trái. Link `roomId` từ thời khóa biểu mở thẳng tầng/phòng tương ứng.

`Campus2Diagram.tsx` dùng lại bố cục sơ đồ Đông Hòa cũ (A–G và NĐH) và các bản vẽ tầng cũ trong `campus-data.ts`. Đây là dữ liệu tham khảo, **không phải inventory đã xác minh**. Bản cũ không có tòa B4.2; B4.2 vẫn tìm được qua inventory và Portal binding nhưng chưa được đặt vị trí giả trên sơ đồ. Khi có bản vẽ chính xác, thêm vị trí tòa/tầng vào dữ liệu bản đồ mới rồi mới gắn hotspot tương tác.
