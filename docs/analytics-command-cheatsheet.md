# Lệnh analytics UStudy

Các lệnh dưới đây chạy trong thư mục dự án bằng PowerShell.

## Truy vấn local, không gọi Cloudflare

Muốn nhập SQL ngay trên UStudy: chạy `pnpm dev`, mở `https://localhost:3005/ad/analytics`,
chọn Hakhoi, Unopia hoặc cả hai rồi bấm **Chạy SQL**. Bên phải có schema thực tế,
khóa nối; có truy vấn mẫu và gợi ý tên bảng/cột khi gõ. Gõ alias như `i.`
sẽ hiện cột của bảng tương ứng. `Ctrl + Enter` chạy truy vấn, `Ctrl + Space`
mở gợi ý. Mục đầu tiên được chọn sẵn: `Tab` chèn ngay; ↑/↓ đổi mục trước khi chèn.
Trang chỉ hoạt động ở dev server trên chính máy này và chỉ đọc snapshot local;
không có endpoint SQL trên bản production. Chọn **Hợp nhất hai snapshot** sẽ
nạp dòng của cả hai database vào hai bảng chung trong RAM. Cột `source` có giá
trị `hakhoi` hoặc `unopia`; ghép `installation_activity_days` với
`anonymous_installations` bằng cả `source` và `installation_hash`. Không gộp
hai installation cùng hash ở hai nguồn. Chỉ hỗ trợ `SELECT`/`WITH` đọc dữ liệu,
tối đa 500 dòng kết quả và 5 giây mỗi lần chạy. Có thể hủy truy vấn đang chạy,
sao chép kết quả hoặc tải CSV.

Tải snapshot mới của cả hai database. Chỉ cần chạy lại khi muốn cập nhật dữ liệu:

```powershell
pnpm run analytics:snapshot
```

Chạy report tổng quan trên cả hai snapshot local:

```powershell
pnpm run analytics:query
```

Chạy một file SQL khác trên cả hai snapshot:

```powershell
pnpm run analytics:query -- --file scripts/analytics-dau-history.sql
pnpm run analytics:query -- --file scripts/analytics-retention.sql
```

Chỉ chạy trên một snapshot:

```powershell
pnpm run analytics:query -- --source hakhoi
pnpm run analytics:query -- --source unopia
```

Kết hợp chọn file SQL và database:

```powershell
pnpm run analytics:query -- --file scripts/analytics-dau-history.sql --source hakhoi
```

Snapshot được lưu trong `.local/analytics/` và bị Git ignore. Lệnh `analytics:query`
chỉ dùng Node.js SQLite in-memory; không cần cài database. SQL query được đọc từ
file, nên hãy sửa hoặc tạo file `.sql` rồi chạy lại.

## Truy vấn trực tiếp Cloudflare

Các lệnh này kết nối và chạy SQL trên D1 production. Dùng khi cần số liệu mới nhất
mà chưa muốn export snapshot.

Report tổng quan:

```powershell
pnpm run analytics:report
pnpm run analytics:report:unopia
```

Lịch sử DAU theo ngày:

```powershell
pnpm run analytics:dau
pnpm run analytics:dau:unopia
```

Retention D1, D7, D30:

```powershell
pnpm run analytics:retention
pnpm run analytics:retention:unopia
```

Lệnh không có hậu tố `:unopia` dùng database Hakhoi. Lệnh có hậu tố `:unopia`
dùng database Unopia.

## Migration

Chỉ chạy khi cần áp dụng migration mới vào production D1:

```powershell
pnpm run analytics:migrate:remote
pnpm run analytics:migrate:remote:unopia
```

Các lệnh migration thay đổi schema database; lệnh report và snapshot chỉ đọc dữ liệu.
