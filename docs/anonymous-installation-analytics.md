# Thống kê installation ẩn danh

Danh sách lệnh chạy nhanh nằm tại [analytics-command-cheatsheet.md](./analytics-command-cheatsheet.md).

UStudy đếm installation theo origin bằng một UUID ngẫu nhiên trong `localStorage`.
Hai domain production có storage và D1 riêng, vì vậy cùng một trình duyệt mở cả hai
domain được tính thành hai installation.

## Dữ liệu được gửi

- UUID ngẫu nhiên; Worker băm SHA-256 trước khi ghi D1.
- Phiên bản UStudy.
- Loại client `web`.
- Domain và ngày hoạt động do Worker tự xác định. Mỗi installation chỉ có tối đa một bản ghi cho mỗi ngày.

Không gửi mã sinh viên, tên, PIN, điểm, lịch học, dữ liệu Portal, feature event,
đường dẫn đã xem, IP hoặc user-agent vào D1. IP chỉ được băm tạm thời để áp dụng
rate limit và không được lưu vào database.

## Triển khai Cloudflare

Repository dùng hai Cloudflare account nhưng chung một branch và codebase:

| Origin | Wrangler target | Deploy command |
| --- | --- | --- |
| `ustudy.hakhoi.io.vn` | top-level (`--env=""`) | `pnpm run deploy:cloudflare` |
| `ustudy.unopia.io.vn` | `unopia` | `pnpm run deploy:cloudflare:unopia` |

Migrate production:

```powershell
pnpm run analytics:migrate:remote
pnpm run analytics:migrate:remote:unopia
```

Xem số liệu tổng quan:

```powershell
pnpm run analytics:report
pnpm run analytics:report:unopia
```

Xem DAU lịch sử và retention D1/D7/D30:

```powershell
pnpm run analytics:dau
pnpm run analytics:dau:unopia
pnpm run analytics:retention
pnpm run analytics:retention:unopia
```

## Snapshot và truy vấn trên máy không cần cài database

Node.js 22.13 trở lên có module SQLite tích hợp. Script dùng database `:memory:`
nên không tạo file database và không cần cài SQLite hoặc DB Browser.

Tạo mới hoặc làm mới snapshot của cả hai D1:

```powershell
pnpm run analytics:snapshot
```

Snapshot SQL được lưu tại `.local/analytics/hakhoi.sql` và
`.local/analytics/unopia.sql`. Đây là dữ liệu cục bộ có chứa installation hash;
thư mục `.local` đã bị Git ignore, không commit hay chia sẻ các file này.

Chạy truy vấn mặc định `scripts/analytics-report.sql` trên cả hai snapshot:

```powershell
pnpm run analytics:query
```

Chạy một file truy vấn khác:

```powershell
pnpm run analytics:query -- --file scripts/analytics-dau-history.sql
```

Chọn một snapshot bằng `--source hakhoi` hoặc `--source unopia`; mặc định là
`both`, khi đó cùng một truy vấn được chạy độc lập trên mỗi snapshot và kết quả
được in kèm nhãn nguồn. Mỗi lần viết lại SQL và gọi `analytics:query`, dữ liệu
được đọc từ file cục bộ; chỉ `analytics:snapshot` mới kết nối D1 để tải dữ liệu.
Snapshot không tự cập nhật khi có heartbeat mới.

Muốn lấy tổng toàn hệ thống thì cộng các cột tương ứng của hai báo cáo. Không tạo
API báo cáo public và không đưa danh sách hash ra frontend.

## Quyền người dùng

- Setting mặc định bật và gửi tối đa một heartbeat thành công mỗi ngày.
- Tắt setting sẽ dừng heartbeat nhưng giữ installation hiện tại.
- Chọn **Tắt và xóa ID trên thiết bị** sẽ tắt setting, xóa UUID cục bộ và đánh dấu `deleted_day` trên D1. Bản ghi không thể nhận thêm heartbeat.
- Lịch sử ngày hoạt động ẩn danh trước khi tắt được giữ lại cho báo cáo tổng hợp; không hard-delete installation hoặc activity.
- Nếu đang offline, yêu cầu vô hiệu hóa được giữ cục bộ và tự retry khi online.
- Nếu bật lại sau khi vô hiệu hóa, UStudy tạo UUID mới và không nối nó với ID cũ.
- ID, ngày heartbeat và pending deactivation không nằm trong backup hoặc rollback.

## Mô hình D1

- `anonymous_installations`: trạng thái hiện tại, phiên bản gần nhất, ngày đầu/cuối và `deleted_day`.
- `installation_activity_days`: lịch sử ngày hoạt động, khóa chính `(installation_hash, active_day)`.
- Heartbeat ghi hai bảng trong một D1 batch. Activity chỉ được thêm khi `deleted_day IS NULL`.
- Foreign key dùng `ON DELETE RESTRICT` để ngăn vô tình xóa cứng lịch sử.

Cloudflare Web Analytics là lớp riêng, không dùng UUID installation này.
