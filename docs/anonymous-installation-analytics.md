# Thống kê installation ẩn danh

UStudy đếm installation theo origin bằng một UUID ngẫu nhiên trong `localStorage`.
Hai domain production có storage và D1 riêng, vì vậy cùng một trình duyệt mở cả hai
domain được tính thành hai installation.

## Dữ liệu được gửi

- UUID ngẫu nhiên; Worker băm SHA-256 trước khi ghi D1.
- Phiên bản UStudy.
- Loại client `web`.
- Domain và ngày hoạt động do Worker tự xác định.

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

Xem số liệu:

```powershell
pnpm run analytics:report
pnpm run analytics:report:unopia
```

Muốn lấy tổng toàn hệ thống thì cộng các cột tương ứng của hai báo cáo. Không tạo
API báo cáo public và không đưa danh sách hash ra frontend.

## Quyền người dùng

- Setting mặc định bật và gửi tối đa một heartbeat thành công mỗi ngày.
- Tắt setting sẽ dừng heartbeat nhưng giữ installation hiện tại.
- Xóa dữ liệu sẽ tắt setting, xóa dòng D1 và xóa ID cục bộ.
- Nếu đang offline, yêu cầu xóa được giữ cục bộ và tự retry khi online.
- ID, ngày heartbeat và pending deletion không nằm trong backup hoặc rollback.

Cloudflare Web Analytics là lớp riêng, không dùng UUID installation này.
