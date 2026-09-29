# Báo cáo kiểm tra lịch Portal

- Thời điểm kiểm tra: 2026-09-15 23:47 (UTC+7)
- Tổng số mẫu: **439**
- Số mẫu duy nhất: **420**
- Số mẫu trùng: **19**
- Parser chi tiết nhận diện: **439/439**
- Session thời khóa biểu được tạo: **439/439**
- Registration được chuẩn hóa: **439/439**
- Mask xếp lịch hợp lệ: **439/439**
- Lỗi: **0**

## Phân bố theo ngày

| Ngày | Số mẫu |
| --- | ---: |
| T2 | 71 |
| T3 | 77 |
| T4 | 68 |
| T5 | 72 |
| T6 | 70 |
| T7 | 81 |

File người dùng cung cấp không chứa lịch Chủ nhật. Case bổ sung `TCN(3.5-5)-P.cs2:F202` được nhận thành ngày index `6`, khoảng tiết `3.5-5`, phòng `F202` và mask Chủ nhật hợp lệ.

## Các khoảng tiết đã kiểm tra

| Khoảng tiết | Số mẫu | Ví dụ |
| --- | ---: | --- |
| 1-2.5 | 7 | `T6(1-2.5)-P.cs2:E106` |
| 1-3 | 6 | `T3(1-3)-P.cs2:TNSDC1_A306` |
| 1-4 | 143 | `T4(1-4)-P.cs2:D207` |
| 1-5 | 34 | `T6(1-5)-P.cs2:F304` |
| 2-5 | 31 | `T2(2-5)-P.cs2:NTĐ_KHTN6` |
| 3-5 | 4 | `T3(3-5)-P.cs2:TNSDC1_A306` |
| 3.5-5 | 8 | `T7(3.5-5)-P.cs2:F202` |
| 6-7.5 | 3 | `T4(6-7.5)-P.cs2:PMT_B4-2_5.` |
| 6-8 | 6 | `T3(6-8)-P.cs2:TNSDC1_A306` |
| 6-9 | 136 | `T2(6-9)-P.cs2:D207` |
| 6-10 | 38 | `T7(6-10)-P.cs2:D212` |
| 7-10 | 17 | `T2(7-10)-P.cs2:NTĐ_KHTN2` |
| 8-10 | 3 | `T3(8-10)-P.cs2:TNSDC1_A306` |
| 8.5-10 | 3 | `T4(8.5-10)-P.cs2:PMT_B4-2_5.` |

## Kết quả chuẩn hóa mẫu

| Dữ liệu Portal | Ngày | Bắt đầu | Kết thúc | Nhãn cơ sở | Phòng |
| --- | ---: | ---: | ---: | --- | --- |
| `T2(6-9)-P.cs2:D207` | 2 | 6 | 9 | `P.cs2` | `D207` |
| `T7(3.5-5)-P.cs2:F202` | 7 | 3.5 | 5 | `P.cs2` | `F202` |
| `T2(2-5)-P.cs2:NTĐ_KHTN6` | 2 | 2 | 5 | `P.cs2` | `NTĐ_KHTN6` |
| `T3(6-8)-P.cs2:TNSDC1_A306` | 3 | 6 | 8 | `P.cs2` | `TNSDC1_A306` |
| `T4(8.5-10)-P.cs2:PMT_B4-2_5.` | 4 | 8.5 | 10 | `P.cs2` | `PMT_B4-2_5.` |
| `TCN(3.5-5)-P.cs2:F202` | CN | 3.5 | 5 | `P.cs2` | `F202` |

## Kết quả test

```text
Test file: tests/unit/scheduler/portal-schedule-samples.test.ts
Tests: 444 passed
Failures: 0
Duration: 597 ms
```

Toàn bộ 439 dữ liệu đầu vào được lưu tại `tests/fixtures/portal-schedule-samples.ts` để chạy regression test ở các lần thay đổi parser sau.
