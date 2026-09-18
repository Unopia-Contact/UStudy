# Nhập dữ liệu Campus Map

## Nguồn duy nhất cho từng loại dữ liệu

- `src/assets/data/campus-map/campuses.ts`: cơ sở, tòa, tầng và phòng. Số lượng và danh sách trong UI đều suy ra từ đây.
- `src/features/campus-map/DongHoaCampusDiagram.tsx`: hình học sơ đồ khuôn viên CS2. Các chữ A–G trên hình không tự tạo tòa trong inventory. Chỉ hình của tòa đã khai báo trong `campuses.ts` mới chọn được.
- `src/assets/data/campus-map/floor-maps.ts`: danh sách asset sơ đồ tầng, keyed bằng `campus/building/floor`.
- `public/maps/floors/`: SVG sơ đồ tầng được `floor-maps.ts` tham chiếu.
- `src/integrations/hcmus-portal/rooms/bindings.ts`: mã Portal trỏ đến ID phòng trong inventory.

## Thêm tòa, tầng và phòng

Trong `campuses.ts`, thêm tòa vào `buildings` của đúng cơ sở. Mỗi tòa có `id`, `code`, `name`, `kind`, `status` và `floors`. Mỗi tầng có `id`, `label`, `sortOrder` và `rooms`. Mỗi phòng có `id`, `code`, `label`, `kind` và `status`. Có thể thêm `aliases` và `verification` khi có nguồn xác minh.

ID runtime tự ghép theo thứ tự `campus/building/floor/room`. Ví dụ phòng `id: '2'` ở tầng `6` của tòa `b4-2` tại `dong-hoa` có ID `dong-hoa/b4-2/6/2`. Giữ ID ổn định vì deep link và Portal binding dùng nó.

## Thêm sơ đồ tầng

Đặt SVG tại `public/maps/floors/`, rồi thêm một entry trong `floor-maps.ts`:

```ts
export const FLOOR_MAPS: Partial<Record<FloorId, MapAsset>> = {
  'dong-hoa/b4-2/6': {
    asset: '/maps/floors/b4-2-6.svg',
    viewBox: [0, 0, 1200, 800],
    shapeIds: ['room-6-2'],
  },
};
```

Nếu vị trí phòng đã xác minh, thêm `map: { shapeId: 'room-6-2' }` vào phòng tương ứng trong `campuses.ts`. `shapeId` phải có trong `shapeIds` của sơ đồ tầng. Không nhập sơ đồ tầng trong `campuses.ts` hay component UI. Phòng chưa có sơ đồ vẫn được liệt kê và tìm kiếm.

## Liên kết mã Portal

Sau khi phòng đã có trong inventory, thêm binding trong `bindings.ts` với `roomId` hoàn chỉnh. Ví dụ `P.cs2:PM_B4-2_6.2` trỏ đến `dong-hoa/b4-2/6/2`. Binding `verified` cần `sourceIds` hoặc `note` ghi nguồn xác minh.

Chạy `pnpm exec vitest run tests/unit/campus-map.test.ts` để kiểm tra ID trùng, shape thiếu và binding không hợp lệ.
