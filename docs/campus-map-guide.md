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

### Quy cách khai báo thống nhất trong `campuses.ts`

- Mỗi cơ sở, tòa, tầng và phòng là một object tường minh; không dùng tuple, helper sinh phòng, `.map()` hoặc bảng override.
- Thứ tự trường cơ sở: `id`, `code`, `name`, `shortName`, `status`, `map` (nếu có), `buildings`.
- Thứ tự trường tòa: `id`, `code`, `name`, `shortName` (nếu có), `kind`, `aliases`, `status`, `verification`, `map`, `floors`.
- Thứ tự trường tầng: `id`, `label`, `level`, `sortOrder`, `rooms`.
- Thứ tự trường phòng: `id`, `code`, `label`, `name` (nếu có), `kind`, `aliases`, `status`, `verification`, `map`, `navigation`.
- Trường tùy chọn chưa có dữ liệu thì bỏ, không thêm tên/chức năng suy đoán. Không tự đổi ID chỉ để nhìn đồng nhất: ID hiện có được dùng trong deep link và binding Portal.
- `room.map.shapeId` chỉ liên kết hình phòng; asset SVG và `viewBox` vẫn khai báo duy nhất trong `floor-maps.ts`.
- `kind` phải thuộc kiểu `Room` trong `src/domain/campus-map/types.ts`, không dùng `any` để lách kiểm tra.

Đặt SVG tại `public/maps/floors/<campus-id>/<building-id>/`. Tên file dùng `floor-<floor-id>.svg`, rồi thêm một entry trong `floor-maps.ts`:

```ts
export const FLOOR_MAPS: Partial<Record<FloorId, MapAsset>> = {
  'dong-hoa/f/1': {
    asset: '/maps/floors/dong-hoa/f/floor-1.svg',
    viewBox: [0, 0, 1200, 800],
    shapeIds: ['room-f101'],
  },
};
```

Nếu vị trí phòng đã xác minh, thêm `map: { shapeId: 'room-f101' }` vào phòng tương ứng trong `campuses.ts`. `shapeId` phải có trong `shapeIds` của sơ đồ tầng. Không nhập sơ đồ tầng trong `campuses.ts` hay component UI. Phòng chưa có sơ đồ vẫn được liệt kê và tìm kiếm.

## Liên kết mã Portal

### Tòa A — cơ sở Đông Hòa

Bốn bản vẽ nằm tại `public/maps/floors/dong-hoa/a/`, cùng `viewBox="0 0 1200 250"`:

| Tầng | ID tầng runtime | File | Phòng trên sơ đồ |
| --- | --- | --- | --- |
| Tầng hầm | `dong-hoa/a/0` | `basement.svg` | A001–A004 (4 phòng) |
| Tầng 1 | `dong-hoa/a/1` | `floor-1.svg` | A101–A111 (11 phòng) |
| Tầng 2 | `dong-hoa/a/2` | `floor-2.svg` | A201–A214 (14 phòng) |
| Tầng 3 | `dong-hoa/a/3` | `floor-3.svg` | A301–A311 (11 phòng) |

Inventory, tên và loại phòng được khai báo bằng object tường minh trong `campuses.ts`.
Ví dụ A107 có ID `dong-hoa/a/1/107`, liên kết tới `<g id="room-a107">` trong `floor-1.svg`.
Nhóm SVG chứa cả hình phòng và chữ, nên chọn phòng sẽ làm nổi bật cả hai.
Tên và vị trí có nguồn `user-provided-building-a-floor-svg`, mức `observed`; không coi đây là xác minh mã Portal đặc biệt.

Mã chuẩn `P.cs2:A107` được resolver nhận diện theo cấu trúc, không cần thêm binding trùng lặp.
Mã có tiền tố khác chỉ thêm binding khi đã đối chiếu; không tự suy ra tiền tố PTN từ tên phòng.
Tầng hầm dùng `id: '0'`, `level: -1`; ID placeholder cũ `dong-hoa/a/basement/1` đã thay bằng `dong-hoa/a/0/001`.

Kiểm tra toàn bộ 40 liên kết bằng `pnpm exec vitest run tests/unit/building-a-maps.test.ts` (test local).

### Tòa C — cơ sở Đông Hòa

| Tầng | ID tầng runtime | File trong `public/maps/floors/dong-hoa/c/` | Phòng trên sơ đồ |
| --- | --- | --- | --- |
| Tầng hầm | `dong-hoa/c/0` | `basement.svg` | C001–C002 (2 phòng) |
| Tầng 1 | `dong-hoa/c/1` | `floor-1.svg` | C101–C111 (11 phòng) |
| Tầng 2 | `dong-hoa/c/2` | `floor-2.svg` | C201–C208 và P209 (9 phòng) |

Cả ba sơ đồ dùng `viewBox="0 0 1200 250"`. Tổng cộng 22 phòng.
Ví dụ C108 có ID `dong-hoa/c/1/108`, shape `room-c108`; mã chuẩn `P.cs2:C108` được phân giải theo cấu trúc.
C201–C207 chưa có tên/chức năng trong sơ đồ, nên không thêm tên giả và dùng `kind: 'other'`.
P209 được giữ nguyên theo sơ đồ: ID `dong-hoa/c/2/p209`, shape `room-p209`, tên `PTN Thực vật`.
Phòng này tìm được bằng P209 nhưng chưa có binding Portal; không tự coi P209 là C209.
Placeholder cũ C001 (`dong-hoa/c/0/1`) được thay bằng `dong-hoa/c/0/001`.
Nguồn dữ liệu là `user-provided-building-c-floor-svg`, mức `observed`.

Kiểm tra bằng `pnpm exec vitest run tests/unit/building-c-maps.test.ts`.

### Tòa G — cơ sở Đông Hòa

| Tầng | ID tầng runtime | File trong `public/maps/floors/dong-hoa/g/` | Phòng |
| --- | --- | --- | --- |
| Tầng hầm | `dong-hoa/g/0` | `basement.svg` | G001–G004 (4 phòng) |
| Tầng 1 | `dong-hoa/g/1` | `floor-1.svg` | G101–G108 (8 phòng) |
| Tầng 2 | `dong-hoa/g/2` | `floor-2.svg` | G201–G206 (6 phòng) |
| Tầng 3 | `dong-hoa/g/3` | `floor-3.svg` | G301–G306 (6 phòng) |
| Tầng 4 | `dong-hoa/g/4` | `floor-4.svg` | G401–G406 (6 phòng) |
| Tầng 5 | `dong-hoa/g/5` | `floor-5.svg` | G501–G506 (6 phòng) |

Tổng cộng 36 phòng; sáu sơ đồ dùng `viewBox="0 0 1200 250"`.
Tên/chức năng được chép từ sơ đồ, nguồn `user-provided-building-g-floor-svg`, mức `observed`.
G403, G404, G503 và G504 chưa có tên/chức năng nên dùng `kind: 'other'`, không tự đặt tên.
Ví dụ G205 có ID `dong-hoa/g/2/205` và shape `room-g205` trong `floor-2.svg`.
Mã chuẩn `P.cs2:G205` được resolver nhận diện theo cấu trúc; mã tiền tố đặc biệt cần đối chiếu trước khi thêm binding.
Sơ đồ khuôn viên đã có hình tòa G; việc thêm inventory khiến hình này chọn được mà không cần thêm thông tin tòa vào component UI.

Kiểm tra bằng `pnpm exec vitest run tests/unit/building-g-maps.test.ts`.

Sau khi phòng đã có trong inventory, thêm binding trong `bindings.ts` với `roomId` hoàn chỉnh. Ví dụ `P.cs2:PM_B4-2_6.2` trỏ đến `dong-hoa/b4-2/6/2`. Binding `verified` cần `sourceIds` hoặc `note` ghi nguồn xác minh.

Chạy `pnpm exec vitest run tests/unit/campus-map.test.ts` để kiểm tra ID trùng, shape thiếu và binding không hợp lệ.
