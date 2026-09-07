# Kế hoạch hỗ trợ nhiều cơ sở cho UStudy

## 1. Mục tiêu

UStudy hỗ trợ lâu dài đúng hai cơ sở:

- `cho-quan`: Cơ sở 1 - Chợ Quán.
- `dong-hoa`: Cơ sở 2 - Đông Hòa.

Người dùng chọn **Cơ sở mặc định** trong onboarding và có thể thay đổi trong Cài đặt. Cơ sở mặc định chỉ là giá trị ưu tiên khi UStudy chưa xác định được địa điểm thật của lớp; nó không phải thuộc tính cố định của sinh viên, ngành hoặc học kỳ.

Hệ thống phải xử lý được các trường hợp:

- Một sinh viên học nhiều năm ở các cơ sở khác nhau mà không có thời điểm chuyển cố định.
- Trong cùng một học kỳ có môn ở Chợ Quán và môn ở Đông Hòa.
- Lớp mở có trường cơ sở, nhưng KQĐKHP không có.
- Hai cơ sở có bảng tiết, số tiết mỗi ngày và kế hoạch năm học độc lập.
- Dữ liệu cũ không có campus vẫn hoạt động giống hiện tại bằng fallback Đông Hòa.

## 2. Phạm vi

### Trong phạm vi

- Campus domain và cấu hình tĩnh cho hai cơ sở.
- Cơ sở mặc định trong onboarding, Settings và local storage.
- Campus theo từng lớp/buổi học.
- Parser lớp mở và đối chiếu KQĐKHP với lớp mở.
- Quy đổi tiết sang giờ theo campus.
- Thời khóa biểu, xếp lịch cá nhân, xếp lịch nhóm, kiểm tra trùng, xuất lịch và thông báo.
- Kế hoạch năm học độc lập theo campus.
- Migration dữ liệu cũ và invalidation cache/kết quả solver.
- UI xem nguồn nhận diện và chỉnh campus thủ công.

### Ngoài phạm vi giai đoạn này

- Học phí theo campus. Học phí tiếp tục được quyết định từ ngành/chương trình và năm học.
- Tự nhận diện cơ sở của người dùng từ Portal.
- Hỗ trợ cơ sở thứ ba hoặc cấu hình campus do người dùng tự tạo.
- Tự suy đoán campus chỉ từ tên phòng nếu không có nguồn dữ liệu đáng tin cậy.
- Tự động xác định thời điểm sinh viên chuyển cơ sở theo năm học.

## 3. Nguyên tắc kiến trúc

1. Campus là domain dùng chung, không thuộc riêng `DepartmentContext`, thời khóa biểu hay Campus Map.
2. Khác biệt giữa hai cơ sở nằm trong config và resolver thuần; không rải `if (campus === ...)` trong component.
3. `day + startPeriod + endPeriod` tiếp tục là dữ liệu Portal nguyên thủy.
4. `startTime + endTime` là dữ liệu dẫn xuất, không phải nguồn sự thật.
5. Campus thủ công thắng campus nhận diện; campus nhận diện thắng cơ sở mặc định.
6. Fallback không được ghi ngược thành campus nhận diện.
7. Mọi đối chiếu lớp mở phải nằm trong đúng năm học và học kỳ của nguồn import.
8. UI desktop và mobile dùng chung view model; chỉ khác cách trình bày.

## 4. Cấu trúc thư mục đề xuất

```text
src/
├── domain/
│   └── campus/
│       ├── types.ts
│       ├── constants.ts
│       ├── resolve-campus.ts
│       ├── resolve-period.ts
│       ├── reconcile-campus.ts
│       ├── time-axis.ts
│       └── index.ts
│
├── assets/data/
│   └── campuses/
│       ├── index.ts
│       ├── cho-quan/
│       │   ├── campus.ts
│       │   ├── periods.ts
│       │   ├── parser-rules.ts
│       │   └── academic-calendar/
│       │       └── 2026-2027.ts
│       └── dong-hoa/
│           ├── campus.ts
│           ├── periods.ts
│           ├── parser-rules.ts
│           └── academic-calendar/
│               └── 2026-2027.ts
│
├── context/
│   └── CampusContext.tsx
│
└── features/
    ├── settings/components/DefaultCampusSetting.tsx
    └── visual-schedule/components/SessionCampusControl.tsx
```

`render-rules` không chứa JSX. Nếu cần quy tắc hiển thị riêng, đổi tên thành `display-rules.ts` và chỉ export label, màu trung tính, tên viết tắt hoặc formatter thuần.

## 5. Domain model

### 5.1 Campus cơ bản

```ts
export type CampusId = 'cho-quan' | 'dong-hoa';

export interface CampusDefinition {
  id: CampusId;
  name: string;
  shortName: string;
  periodCount: number;
  periods: PeriodDefinition[];
  portalAliases: string[];
}

export interface PeriodDefinition {
  period: number;
  start: string;
  end: string;
  session: 'morning' | 'afternoon' | 'evening';
}
```

`periodCount` có thể được dẫn xuất từ `periods`, nhưng vẫn nên validate khi load config để bắt dữ liệu thiếu tiết.

### 5.2 Campus trong hồ sơ

```ts
export interface CampusPreferences {
  version: 1;
  defaultCampusId: CampusId;
}
```

Không lưu campus theo học kỳ trong hồ sơ. Một học kỳ có thể chứa lớp ở cả hai cơ sở.

### 5.3 Campus theo từng buổi học

Không lưu `campusSource` độc lập với campus vì hai trường có thể lệch nhau.

```ts
export type CampusDetectionSource = 'open-class' | 'reconciled';

export type CampusDetection =
  | {
      status: 'matched';
      campusId: CampusId;
      source: CampusDetectionSource;
      confidence: 'exact' | 'strong';
    }
  | {
      status: 'ambiguous';
      candidates: CampusId[];
    }
  | {
      status: 'unresolved';
    };

export interface SessionCampus {
  detection?: CampusDetection;
  manualCampusId?: CampusId;
}

export interface RawClassSession {
  day: number;
  startPeriod: number;
  endPeriod: number;
  room?: string;
  campus?: SessionCampus;
}
```

Một lớp có thể có nhiều buổi và mỗi buổi có campus riêng. Không đặt campus duy nhất ở course level.

### 5.4 Campus đã resolve

```ts
export type ResolvedCampusSource =
  | 'manual'
  | 'open-class'
  | 'reconciled'
  | 'profile-fallback';

export interface ResolvedCampus {
  campusId: CampusId;
  source: ResolvedCampusSource;
  isFallback: boolean;
}
```

Thứ tự resolve:

```text
manualCampusId
→ detection.status === matched
→ defaultCampusId
```

Trạng thái `ambiguous` và `unresolved` phải được giữ nguyên để UI giải thích vì sao đang fallback.

## 6. CampusContext và persistence

### 6.1 Storage

Thêm key vào `src/config/storageKeys.ts`:

```ts
CAMPUS_PREFERENCES: 'campus_preferences'
```

Đây là thiết lập không nhạy cảm, lưu bằng `savePlain`:

```json
{
  "version": 1,
  "defaultCampusId": "dong-hoa"
}
```

Không tạo key riêng cho `campusSource`.

### 6.2 Migration user cũ

- Nếu không có `campus_preferences`, resolver trả `dong-hoa`.
- Chỉ ghi key mới khi người dùng hoàn tất onboarding mới hoặc thay đổi trong Settings.
- Không sửa hàng loạt raw data cũ ngay khi app khởi động.
- Dữ liệu lớp cũ không có campus tiếp tục resolve bằng `dong-hoa`.
- Backup/export mới phải chứa `campus_preferences`; backup cũ thiếu key vẫn hợp lệ.

### 6.3 Context

Tạo `CampusProvider` độc lập, đặt cạnh `DepartmentProvider` trong root app.

```ts
interface CampusContextValue {
  defaultCampusId: CampusId;
  defaultCampus: CampusDefinition;
  setDefaultCampusId: (campusId: CampusId) => void;
  resolveCampus: (campus?: SessionCampus) => ResolvedCampus;
  campusRevision: number;
}
```

`campusRevision` tăng khi đổi cơ sở mặc định hoặc version config thay đổi. Consumer dùng revision để làm mới dữ liệu dẫn xuất.

Không đưa campus vào `DepartmentContext`; tuition và academic program vẫn do faculty/major/cohort/year quản lý.

## 7. Cấu hình bảng tiết

### 7.1 Nguồn sự thật

Thay `src/constants/timetable.ts` bằng registry campus. Trong giai đoạn chuyển tiếp, file cũ re-export bảng Đông Hòa và đánh dấu deprecated để tránh sửa hàng loạt trong một commit.

```ts
getCampusPeriods(campusId)
getPeriodBoundary(campusId, period, edge)
resolvePeriodRange(campusId, startPeriod, endPeriod)
```

Kết quả:

```ts
interface ResolvedPeriodRange {
  startTime: string;
  endTime: string;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
}
```

### 7.2 Tiết thập phân

Portal cho phép `.5` ở mọi môn và cả hai cơ sở. Đây là ranh giới giữa hai nửa tiết, với quy tắc phụ thuộc cạnh của khoảng:

- `1-2.5`: học hết tiết 1, tiết 2 và nửa đầu tiết 3; cạnh cuối là trung điểm tiết 3.
- `3.5-5`: bắt đầu từ trung điểm tiết 3 rồi học tiết 4 và tiết 5; cạnh đầu là trung điểm tiết 3.
- Với cạnh đầu `n.5`, lấy trung điểm tiết `n`; với cạnh cuối `n.5`, lấy trung điểm tiết `n + 1`.

Resolver phải tính trung điểm từ bảng giờ của campus thay vì hard-code riêng `3.5` hoặc `8.5`.

### 7.3 Loại bỏ nguồn giờ trùng lặp

Các nguồn cần gom về resolver chung:

- `src/constants/timetable.ts`.
- `src/logic/ScheduleLogic.ts`.
- `src/features/visual-schedule/services/schedule-logic.ts`.
- `src/components/schedule/schedule-conflict-hover-card.tsx`.
- `src/features/visual-schedule/services/schedule-export.ts`.
- Các helper export cũ trong `src/logic/visualCheduler/`.

Sau migration, component không được tự tra `timePeriods` hoặc tự format từ số tiết.

## 8. Parser lớp mở

### 8.1 Thu thập dữ liệu

Bookmarklet/extension cần đọc trường cơ sở trong bảng lớp mở và giữ giá trị gốc:

```ts
interface OpenClassCampusRaw {
  rawCampus: string;
  detectedCampusId?: CampusId;
}
```

Normalize qua aliases trong campus config. Không dùng chuỗi `includes()` rải trong crawler.

Mã ở cột `Địa Điểm` của bảng DSLM là nguồn chuẩn hiện đã xác nhận:

```ts
normalizePortalCampus('NVC') // cho-quan
normalizePortalCampus('LT') // dong-hoa
```

Chỉ áp dụng ánh xạ trên cho trường địa điểm của lớp mở; không dùng chuỗi `LT` ở cột loại lớp. Giá trị lạ phải được giữ nguyên và trả `unresolved`, không tự mặc định ngay trong parser.

### 8.2 Protocol

- Bump `scraperVersion`.
- Chỉ bump `protocolVersion` nếu shape packet top-level thay đổi; thêm field optional trong record có thể giữ backward compatibility.
- Cập nhật contract test cho extension, bookmarklet và mobile crawler.
- Parser cũ không có campus vẫn được chấp nhận và dùng fallback.

### 8.3 Phạm vi nguồn

Campus lớp mở chỉ có giá trị trong đúng `academicYear + semester` đã crawl. Không đối chiếu KQĐKHP kỳ mới với lớp mở kỳ cũ đang còn cache.

## 9. Đối chiếu KQĐKHP với lớp mở

Tạo service thuần `reconcileRegisteredSessionCampus()` và chạy sau khi normalize cả registrations lẫn open classes.

### 9.1 Khóa đối chiếu

Ưu tiên theo tầng, dừng ở tầng đầu tiên tạo đúng một kết quả:

1. `academicTerm + courseId + classId`.
2. `academicTerm + courseId + classCode + group`.
3. `academicTerm + courseId + day + startPeriod + endPeriod + normalizedRoom`.
4. Không đủ chắc chắn: `unresolved` hoặc `ambiguous`.

Không dùng riêng tên môn hoặc tên phòng làm bằng chứng.

### 9.2 Quy tắc kết quả

- Một ứng viên duy nhất, khớp khóa mạnh: `matched/exact`.
- Một ứng viên duy nhất, khớp lịch/phòng: `matched/strong`.
- Nhiều ứng viên thuộc cùng một campus: có thể nhận diện campus đó nhưng vẫn ghi confidence `strong`.
- Nhiều ứng viên thuộc nhiều campus: `ambiguous`.
- Không có ứng viên: `unresolved`.

### 9.3 Import partial

- Import registrations mà không import open classes: chỉ reconcile với open-class snapshot cùng kỳ còn hợp lệ.
- Import open classes mới: chạy reconcile lại registrations cùng kỳ.
- Nguồn open classes được crawl và trả mảng rỗng phải xóa snapshot cũ của đúng kỳ, không giữ data stale.
- Manual override không bị xóa khi chạy reconcile lại.

## 10. Canonical schedule và view model

Hiện `ScheduleSession` đang bắt buộc cả period lẫn `startTime/endTime`. Tách dần thành:

```text
Raw/Canonical session
day + periods + campus metadata + date range
            ↓ resolve campus + periods
ResolvedScheduleSession
startTime + endTime + minute interval + display fields
```

Trong giai đoạn tương thích, vẫn cho `ScheduleSession` chứa `startTime/endTime`, nhưng chỉ một factory được quyền tạo hai field này.

Mọi consumer nhận `ResolvedScheduleSession`, gồm:

- Thời khóa biểu hiện tại.
- Lịch dự kiến/xếp lịch cá nhân.
- Group Schedule.
- Dashboard timeline.
- Chi tiết lớp.
- Conflict hover card.
- ICS/PDF/image export.
- Android local notifications.

## 11. Refactor solver và kiểm tra trùng

### 11.1 Vấn đề hiện tại

Solver đang dựa vào 20 nửa-tiết/ngày và offset cố định `140`. Cách này ngầm giả định 10 tiết/ngày và cùng bảng giờ cho mọi người.

### 11.2 Trục thời gian mới

Chuyển class/session sang interval phút trước khi tạo bitset:

```ts
interface WeeklyTimeInterval {
  day: number;
  startMinute: number;
  endMinute: number;
  campusId: CampusId;
}
```

Bitset dùng slot thời gian thực, đề xuất 5 phút/slot để biểu diễn được mốc `07:00`, `07:30`, `08:15`, `08:20` mà không mất chính xác.

```ts
const MINUTES_PER_SLOT = 5;
const SLOTS_PER_DAY = 24 * 60 / MINUTES_PER_SLOT;
```

Không hard-code morning là bit 0-9 và afternoon là 10-19. Buổi sáng/chiều lấy từ campus period definitions hoặc interval thực.

### 11.3 Trùng lịch

Hai buổi trùng khi:

```ts
a.day === b.day
&& a.startMinute < b.endMinute
&& b.startMinute < a.endMinute
```

So sánh bằng giờ thật, không so sánh số tiết giữa hai campus.

### 11.4 Di chuyển giữa hai cơ sở

Giai đoạn đầu:

- Phát hiện hai buổi khác campus trong cùng ngày.
- Nếu không overlap nhưng khoảng nghỉ thấp hơn ngưỡng di chuyển, hiển thị warning riêng.
- Chưa biến thành hard conflict cho tới khi có ngưỡng chính thức.

Cần bổ sung sau khi Khôi chốt số phút di chuyển tối thiểu giữa Chợ Quán và Đông Hòa.

## 12. Group Schedule

### 12.1 Quy tắc nhóm

Phiên bản đầu dùng một `groupCampusId` cho pool lớp mở của nhóm. Không tạo nhóm xếp lớp giữa hai cơ sở mặc định khác nhau.

```ts
interface GroupSharePayloadV3 {
  version: 3;
  groupCampusId: CampusId;
  members: GroupMemberTokenV3[];
  config?: GroupShareConfig;
}
```

Khi thêm thành viên:

- Token thành viên mang `defaultCampusId`.
- Nếu khác `groupCampusId`, chặn lưu và giải thích rõ.
- Lịch bận đã có của thành viên vẫn được phép chứa session ở campus khác.

### 12.2 Busy time

Không tiếp tục truyền `busyMask` chỉ dựa trên số tiết. Payload mới ưu tiên `busyIntervals` theo phút; decoder vẫn đọc payload v2 để tương thích.

```ts
interface GroupMemberTokenV3 {
  defaultCampusId: CampusId;
  busyIntervals: WeeklyTimeInterval[];
  // các trường môn học và ưu tiên hiện có
}
```

URL decoder cần giữ giới hạn thành viên, số môn, byte nén và JSON length hiện tại.

### 12.3 Kết quả cũ

- `group_schedule_last_result` và saved group schedules cần `rulesFingerprint`.
- Nếu campus/rules version không khớp, không render lại kết quả như còn hợp lệ.
- UI báo “Bảng giờ cơ sở đã thay đổi, hãy xếp lịch lại”.

## 13. Kế hoạch năm học

Registry đổi thành:

```ts
getAcademicCalendar(campusId, academicYear)
getAcademicCalendars(campusId)
```

Trang tiếp tục chỉ cho chọn **Năm học** và **Học kỳ** như yêu cầu hiện tại. Campus lấy từ `defaultCampusId`, không thêm dropdown thứ ba.

UI hiển thị một dòng context nhỏ:

```text
Đang sử dụng kế hoạch của Cơ sở 2 - Đông Hòa
```

Khi đổi campus trong Settings, trang tự load calendar tương ứng và reset filter về học kỳ còn hợp lệ. Nếu campus chưa có data cho năm đã chọn, hiển thị empty state “Chưa có kế hoạch năm học của cơ sở này”, không fallback sang calendar cơ sở khác.

File `src/assets/data/academic-calendar/2026-2027.ts` hiện tại phải được xác minh thuộc cơ sở nào trước khi chuyển. Không dùng chung tạm nếu tài liệu nguồn chỉ áp dụng một cơ sở.

## 14. Onboarding và Settings

### 14.1 Onboarding

Thêm `Cơ sở mặc định` trước cụm Khóa tuyển/Khoa/Ngành:

- Dùng `AppSelect` chung.
- Giá trị mặc định: `Cơ sở 2 - Đông Hòa`.
- Label luôn hiển thị, không dùng placeholder thay label.
- Helper text: “UStudy dùng cơ sở này khi chưa xác định được cơ sở của lớp. Một số môn vẫn có thể học tại cơ sở khác.”
- Không thêm card con hoặc màu riêng cho từng campus.

### 14.2 Settings

Tạo một row trong nhóm thông tin học tập, không tạo thêm một card lớn độc lập nếu không cần:

```text
Cơ sở mặc định
Cơ sở 2 - Đông Hòa                         [Thay đổi]
```

Khi đổi campus:

1. Hiện dialog xác nhận ngắn.
2. Nêu rõ lớp nhận diện/thủ công không đổi.
3. Nêu rõ lớp chưa xác định, lịch, solver và notification sẽ được tính lại.
4. Save thành công mới đóng dialog.
5. Nếu save lỗi, giữ dialog và trả nút khỏi trạng thái loading.

### 14.3 Responsive

- Desktop: custom select hoặc dialog gọn trong Settings.
- Mobile: nếu chỉ chọn một giá trị, dùng bottom sheet ngắn; không cần full-screen workflow.
- Touch target gần 44px, scrollbar menu ẩn nhưng vẫn cuộn được.
- Màu nền trắng/xám lạnh, active xanh `#004A98`, không dùng màu khác để phân biệt campus.

## 15. Chi tiết lớp và chỉnh thủ công

Trong chi tiết lớp, thêm section không lồng card:

```text
Cơ sở học                 Cơ sở 1 - Chợ Quán
Nguồn                     Từ danh sách lớp mở
```

Nếu fallback:

```text
Cơ sở học                 Cơ sở 2 - Đông Hòa
                          Chưa xác định từ Portal, đang dùng cơ sở mặc định
```

Action `Thay đổi` mở `SessionCampusControl`:

- Dùng cơ sở nhận diện/mặc định.
- Chợ Quán.
- Đông Hòa.

Nếu một môn có nhiều buổi, cho chọn phạm vi:

- Chỉ buổi đang xem.
- Tất cả buổi cùng lớp chưa có campus chắc chắn.

Manual override lưu trong `ScheduleOverrides.sessionOverrides` bằng `manualCampusId`; không sửa raw Portal data.

## 16. Invalidation và dữ liệu dẫn xuất

Tạo fingerprint:

```ts
interface CampusRulesFingerprint {
  campusConfigVersion: number;
  defaultCampusId: CampusId;
  periodTableVersion: string;
}
```

Khi default campus hoặc bảng tiết thay đổi:

- Clear resolved schedule cache.
- Rebuild timetable và dashboard timeline.
- Đánh dấu kết quả solver cũ là stale.
- Hủy rồi lên lịch lại Android notifications của UStudy.
- Export mới luôn resolve lại từ period + campus; không dùng giờ snapshot cũ.
- Không sửa detected/manual campus.

Saved schedule nên lưu canonical periods + campus metadata và fingerprint, không chỉ lưu `startTime/endTime`.

## 17. Migration compatibility

### Schema cần version hóa

- `campus_preferences`: v1.
- Open-class normalized records: thêm field optional.
- Schedule overrides: thêm `manualCampusId` optional.
- Saved schedules: bump schema, giữ decoder cũ.
- Group share payload: v3, giữ decoder v1/v2.
- Group last result: thêm fingerprint và campus.

### Quy tắc backward compatibility

- Thiếu campus: fallback Đông Hòa.
- Campus ID lạ: `unresolved`, không crash.
- Saved schedule cũ: mở ở chế độ legacy bằng Đông Hòa và đề nghị xếp/lưu lại.
- Payload nhóm cũ: group campus Đông Hòa.
- Export JSON cũ: import được nhưng preview ghi “Không có thông tin cơ sở”.

Không xóa dữ liệu cũ ngay sau migration. Chỉ ghi schema mới khi người dùng thay đổi hoặc lưu lại đối tượng đó.

## 18. Test plan

### 18.1 Unit test campus domain

- Resolve precedence: manual > detected > default.
- Xóa manual quay về detected.
- `ambiguous` và `unresolved` dùng fallback nhưng vẫn giữ trạng thái.
- ID campus lạ không làm crash.
- Từng tiết của hai campus trả đúng start/end.
- Period ngoài range trả lỗi có kiểu, không trả giờ giả.
- Tiết thập phân theo fixture hiện tại.

### 18.2 Reconciliation

- Match exact class id.
- Match class code/group.
- Match schedule + room.
- Nhiều lớp cùng campus.
- Nhiều lớp khác campus -> ambiguous.
- Không dùng lớp mở khác học kỳ.
- Open-class source rỗng xóa data stale đúng kỳ.
- Reconcile lại không xóa manual override.

### 18.3 Schedule và solver

- Cùng `T2(1-4)` ở hai campus tạo hai khoảng giờ khác nhau.
- Hai interval overlap thật phải báo trùng.
- Số tiết giống nhau nhưng giờ thật không overlap thì không báo trùng.
- CS1 có tiết 11-12 vẫn render và solver được.
- Grid tự lấy row count theo campus/session đang hiển thị.
- Xếp lịch cá nhân dùng đúng class campus.
- Group member busy interval từ campus khác vẫn chặn đúng giờ.
- Payload nhóm v2 vẫn decode theo fallback Đông Hòa.

### 18.4 UI/E2E

- User cũ vào app không bị ép onboarding lại và dùng Đông Hòa.
- User mới thấy Đông Hòa được chọn mặc định.
- Đổi campus trong Settings cập nhật lịch fallback ngay.
- Detected/manual class không đổi khi đổi default campus.
- Chi tiết lớp giải thích đúng source.
- Mobile 360px, tablet 768px và desktop không overlap dropdown/dialog.
- Keyboard focus, Escape, outside click và screen-reader labels hoạt động.

### 18.5 Export và Android

- ICS dùng giờ đã resolve đúng campus.
- PDF/image schedule hiển thị campus khi cần.
- Notification dùng giờ thật và được reschedule khi campus default đổi.
- App cold start vẫn đọc đúng campus preferences.

## 19. Trình tự triển khai theo PR

### PR 1 - Campus foundation

- Domain types, campus registry, period resolver.
- `CampusProvider`, storage key và migration fallback.
- Fixture/test bảng tiết.
- Chưa đổi UI lịch.

### PR 2 - Onboarding và Settings

- Chọn Cơ sở mặc định.
- Dialog/bottom sheet thay đổi campus.
- Backup/import preferences.
- Event/revision khi thay đổi.

### PR 3 - Portal parser và reconciliation

- Crawl campus lớp mở trên bookmarklet, extension và Android.
- Normalize aliases.
- Reconcile KQĐKHP.
- Contract tests và import partial tests.

### PR 4 - Canonical schedule

- Raw session + resolved view model.
- Gom các bảng giờ và hai `ScheduleLogic` về resolver chung.
- Thời khóa biểu, chi tiết lớp và conflict hover.
- Manual campus override.

### PR 5 - Solver cá nhân và Group Schedule

- Time-axis theo phút và bitset 5 phút.
- Group payload v3, busy intervals, fingerprint.
- Chặn nhóm khác cơ sở mặc định theo policy hiện tại.
- Giữ decoder payload cũ.

### PR 6 - Calendar, export và notification

- Academic calendar registry theo campus.
- ICS/PDF/image export.
- Android notification invalidation/reschedule.
- Warning di chuyển khác campus nếu đã có ngưỡng.

### PR 7 - Migration và release hardening

- E2E dữ liệu thật đã ẩn danh.
- Kiểm tra backup cũ, saved schedules cũ và group URLs cũ.
- Telemetry lỗi chỉ chứa mã lỗi, không chứa lịch học cá nhân.
- Cập nhật tài liệu người dùng và release notes.

Mỗi PR phải độc lập build được và có feature flag nếu consumer chưa chuyển xong. Không merge PR solver trước khi period resolver và reconciliation đã ổn định.

## 20. Tiêu chí hoàn thành

Tính năng được coi là hoàn chỉnh khi:

1. Không còn component tự hard-code giờ Đông Hòa.
2. Không còn solver giả định 10 tiết/ngày hoặc 20 nửa-tiết/ngày.
3. Mỗi session có thể resolve campus và giải thích source.
4. KQĐKHP thiếu campus vẫn được đối chiếu hoặc fallback an toàn.
5. Đổi cơ sở mặc định không sửa detected/manual campus.
6. Kế hoạch năm học không fallback nhầm sang cơ sở khác.
7. User cũ, backup cũ, lịch cũ và group payload cũ vẫn mở được.
8. Unit, contract, E2E, web build, extension build và Android debug build đều đạt.

## 21. Dữ liệu cần Khôi cung cấp trước PR 3-6

- Bảng tiết đầy đủ của Chợ Quán và Đông Hòa, gồm giờ bắt đầu/kết thúc từng tiết và quy tắc tiết `.5`.
- Các chuỗi cơ sở thực tế xuất hiện trong bảng lớp mở Portal.
- Một mẫu lớp mở và KQĐKHP đã ẩn danh có thể đối chiếu cùng lớp.
- Xác nhận file kế hoạch năm học hiện tại thuộc cơ sở nào.
- Kế hoạch năm học của cơ sở còn lại.
- Ngưỡng thời gian tối thiểu để cảnh báo di chuyển giữa hai cơ sở, nếu muốn bật cảnh báo ở phiên bản đầu.
