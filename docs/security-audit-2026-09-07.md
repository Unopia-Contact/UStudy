# Báo cáo rà soát bảo mật UStudy

Ngày: 07/09/2026. Branch: `nvc`. Commit được rà soát: `bc255bc19fca0a32bf8141b7b59b5f0bd74bcb5c`.

## 1. Kết luận và phạm vi

UStudy đã có nền tảng mã hóa dữ liệu cục bộ tương đối tốt: Master Data Key ngẫu nhiên, AES-GCM, khóa Web Crypto không export được, migration có staging và phục hồi. Tuy nhiên, chưa thể mô tả sản phẩm là mã hóa toàn bộ dữ liệu cá nhân, xóa hết dữ liệu khi đăng xuất, hoặc bảo mật nội dung truyền QR.

Ưu tiên cao nhất là độ tin cậy của việc ghi/import/rollback và vòng đời bản sao khóa. Có lỗi khiến giao diện có thể báo lưu thành công dù storage không ghi được. Một số dữ liệu cá nhân vẫn là JSON thường. Snapshot IndexedDB giữ lại dữ liệu và envelope mật khẩu cũ sau khi đăng xuất hoặc đổi mật khẩu.

Đây là rà soát source và kiểm thử cục bộ, không phải chứng nhận an toàn hoặc pentest production. Không thay đổi implementation trong đợt này. Worktree sạch trước khi rà soát; tài liệu này là thay đổi được giữ lại.

### Phạm vi đã xem

- Web React/Vite: CryptoContext, SecurityGate, lưu trữ, nhập/xuất JSON, hoàn tác, các nơi ghi điểm/lịch/nhóm.
- Extension và Bookmarklet: manifest, sender/origin, dữ liệu chờ nhập, preview import.
- Đồng bộ QR quang học: dựng payload, nén, kiểm tra frame, giới hạn giải nén.
- Android: WebView Portal, native bridge, TLS, manifest, file kết quả và cấu hình ký release.
- Vercel CSP, API chat, cấu hình môi trường và GitHub Actions.
- Các test crypto/import và một số phép thử phá hoại dùng dữ liệu giả.

### Giới hạn

- Không thử tấn công Portal, không gọi API AI phát sinh chi phí, không đọc mật khẩu hoặc dữ liệu học tập thật.
- Không xác nhận headers đang phục vụ trên production, biến môi trường Vercel/Cloudflare, quyền tài khoản hoặc branch protection.
- Không kiểm tra chữ ký và manifest bên trong APK/ZIP đang được người dùng tải; source an toàn hơn không chứng minh artifact cũ đã cập nhật.
- Không tìm thấy implementation `src/features/device-sync` hoặc backend signaling Cloudflare trong checkout này. Vì vậy chưa đánh giá WebRTC, SAS, TURN, TTL phòng hay giao thức trao đổi khóa từng được thảo luận. Phần truyền thiết bị xác nhận được ở đây là optical sync.
- Không đối chiếu được `docs/security-audit-2026-09-06.md` vì file đó không có trong checkout. Đã tham khảo `security_scan_report.md` và `security-remediation-plan.md` hiện có.
- Audit dependency trực tuyến không hoàn tất; không dùng số CVE từ báo cáo cũ để kết luận phiên bản hiện tại.

## 2. Mô hình đe dọa

| Tình huống | Bảo vệ hiện tại và giới hạn |
| --- | --- |
| Ai đó lấy được storage khi app đã khóa | AES-GCM bảo vệ các key trong `SECURE_DATA_KEYS`; JSON thường và metadata vẫn đọc được |
| Ai đó biết mật khẩu cũ và lấy được snapshot cũ | Có thể khôi phục Master Key cũ; đổi mật khẩu hiện tại chỉ re-wrap cùng Master Key |
| JavaScript cùng origin bị chiếm quyền khi app mở khóa | Có thể đọc dữ liệu trong app hoặc sử dụng CryptoKey để decrypt; non-extractable không ngăn điều này |
| Backup có dữ liệu sai/hỏng, hoặc hết quota lúc import | Ghi từng key có thể để lại trạng thái nhập một phần |
| Người khác quay được đủ khung QR | Có thể phục hồi JSON gửi đi vì transport hiện không mã hóa |
| Web ngoài origin gửi message | Có kiểm tra origin/sender; vẫn cần schema, session binding và giới hạn tải ở từng transport |
| API chat bị gọi trực tiếp | Nếu endpoint được deploy và có key, có thể tiêu tốn quota dù UI chatbot bị ẩn |
| Thiết bị root/mã độc/quyền browser profile | Ngoài khả năng bảo vệ tuyệt đối của web; cần giảm dữ liệu tồn dư, không hứa device-bound |

Mức độ dưới đây là đánh giá tác động trong kiến trúc local-first, không phải điểm CVSS. `Cao có điều kiện` nghĩa là cần điều kiện triển khai hoặc khả năng truy cập cụ thể được nêu. Lỗi toàn vẹn/khả dụng được phân biệt với rò dữ liệu từ xa.

## 3. Danh sách phát hiện

| ID | Ưu tiên / mức độ | Phát hiện | Bằng chứng |
| --- | --- | --- | --- |
| SEC-01 | P1 / Cao, toàn vẹn | Lưu thất bại nhưng Promise vẫn thành công; import không atomic | Source + tái hiện quota |
| SEC-02 | P1 / Cao, riêng tư | Snapshot tồn tại sau thao tác xóa dữ liệu/đăng xuất | Source |
| SEC-03 | P1 / Cao có điều kiện | Envelope mật khẩu cũ trong snapshot mở được dữ liệu mới | Source + tái hiện |
| SEC-04 | P1 / Trung bình | Điểm thành phần, lịch/nhóm và ghi chú còn plaintext | Source |
| SEC-05 | P1 / Cao, toàn vẹn | Hoàn tác clear storage trước khi ghi, chỉ so phiên bản khóa | Source |
| SEC-06 | P1 / Trung bình | Giải mã nền có thể đưa dữ liệu trở lại cache sau lock | Source, cần test component trì hoãn |
| SEC-07 | P1 / Cao có điều kiện | API AI thiếu xác thực/hạn mức; hỗ trợ key public `VITE_*` | Source, chưa kiểm chứng deploy |
| SEC-08 | P2 / Trung bình | AES-GCM data không gắn storage key vào AAD | Source + tái hiện hoán đổi |
| SEC-09 | P2 / Trung bình | QR không bảo mật nội dung/xác thực người gửi | Trace source |
| SEC-10 | P2 / Trung bình | Validation import mới dừng ở cấu trúc ngoài | Source |
| SEC-11 | P2 / Trung bình | Vòng đời khóa giữa nhiều tab/background chưa đầy đủ | Source |
| SEC-12 | P2 / Cần hoàn thiện | CI/lockfile chưa thống nhất với pnpm; thiếu security gates | Source, audit mạng chưa có kết quả |

### SEC-01. Lưu thất bại bị nuốt; nhập dữ liệu có thể chỉ hoàn tất một phần

**Vị trí:** `src/helpers/localStorage/save.tsx:361` (`savePlain`), `:383` (`saveSecure`), `:503` (`importBackupWithCurrentKey`); `src/features/settings/components/importData.tsx:263` (`applyPlainImport`), `:458` (import vào thiết bị mới).

`saveSecure` bắt mọi exception rồi chỉ log. Caller `await saveSecure(...)` vẫn được resolve. `applyPlainImport` tiếp tục populate RAM cache; UI có thể thấy dữ liệu mới nhưng reload lại mất. Với backup mã hóa, vòng lặp decrypt và ghi từng mục cũng không có transaction: lỗi ở mục sau không tự trả các mục trước về trạng thái cũ. Import vào máy mới còn ghi envelope trước khi ghi đủ dữ liệu và chỉ mở envelope để xác minh mật khẩu, chưa authenticate toàn bộ ciphertext được chọn trước commit.

**Đã tái hiện:** dùng storage giả ném `QuotaExceededError` khi ghi `raw_student_db`. `saveSecure` resolve, nhưng key không tồn tại. Đây là lỗi khả dụng/toàn vẹn, không phải AES bị phá.

**Khắc phục:** để lỗi lưu truyền về caller; chỉ cập nhật cache/trạng thái thành công sau commit. Prepare toàn bộ giá trị, giải mã và validate trước khi thay đổi storage. Lưu journal + before-image; hoặc chuyển dữ liệu giao dịch sang một transaction IndexedDB. Nếu dùng cả IndexedDB và localStorage, thiết kế recovery vì hai kho không có transaction chung.

**Nghiệm thu:** ném lỗi ở từng lần ghi trong setup/import, reload sau mỗi lần; dữ liệu phải là toàn bộ trạng thái cũ hoặc toàn bộ trạng thái mới. Không có success giả, không có ciphertext bị gắn sai khóa.

### SEC-02. Đăng xuất/xóa dữ liệu không xóa snapshot IndexedDB

**Vị trí:** `save.tsx:774` trở đi (DB `ustudy-import-rollback`, store `snapshots`, record `latest`), `:835` (`createImportRollbackSnapshot`), `:953` (`clearAllStorage`); `src/components/layout/Header.tsx:89`; `src/components/security/SecurityLock.tsx:418`.

Snapshot sao chép hầu hết localStorage, bao gồm metadata crypto và mọi key plaintext, vào IndexedDB. `clearAllStorage` chỉ clear localStorage và sessionStorage. Nó không xóa DB rollback. Hàm xóa snapshot chỉ được dùng ở một nhánh hoàn tác.

**Tác động:** sau đăng xuất/xóa dữ liệu, bản sao vẫn tồn tại trong browser profile. Các trường plaintext đọc được; phần mã hóa vẫn cần mật khẩu, nhưng snapshot còn giữ envelope tương ứng. Đây không đồng nghĩa website bên ngoài có thể tự đọc IndexedDB của UStudy.

**Khắc phục:** một hàm xóa dữ liệu async quản lý cả localStorage, IndexedDB, RAM và dữ liệu tạm thuộc UStudy. Chờ transaction xóa hoàn tất trước khi báo xong; xử lý DB bị tab khác giữ. Không dùng `clear()` toàn origin nếu sau này origin chứa dữ liệu ứng dụng khác.

**Nghiệm thu:** tạo snapshot chứa marker giả, đăng xuất rồi khởi động lại; không còn marker trong localStorage, IndexedDB hoặc RAM. Thử lỗi transaction và tab khác đang mở.

### SEC-03. Snapshot giữ envelope cũ sau đổi mật khẩu

**Vị trí:** `save.tsx:608` (`changePin`), `:835` (snapshot), `:484` (`unlockBackupKey`).

Đổi PIN/mật khẩu chỉ re-wrap cùng Master Data Key. Đây là thiết kế hợp lý để đổi mật khẩu nhanh, nhưng snapshot giữ salt/IV/wrapped key từ trước. Người biết mật khẩu cũ và lấy được envelope cũ vẫn khôi phục được cùng Master Key, rồi giải mã ciphertext mới nếu lấy được ciphertext đó.

**Đã tái hiện:** tạo envelope bằng mật khẩu A; giữ bản sao envelope; đổi sang B; lưu dữ liệu giả mới; mở envelope cũ bằng A; dùng khóa đó đọc được dữ liệu mới.

**Khắc phục:** xóa hoặc cập nhật envelope trong bản sao do app quản lý khi đổi mật khẩu; snapshot dữ liệu nên tham chiếu `keyId` thay vì sao chép mật khẩu-wrapped key không kiểm soát. Có chế độ riêng “đổi mật khẩu và thay khóa” khi người dùng nghi mật khẩu cũ đã lộ: sinh Master Key mới, re-encrypt dữ liệu bằng transaction, xử lý snapshot tương ứng.

**Giới hạn phải nói rõ:** không thể thu hồi file backup/envelope đã được người khác sao chép. Re-wrap không thu hồi quyền của người đã có Master Key. Key rotation bảo vệ dữ liệu được mã hóa mới, không xóa được dữ liệu lịch sử đã bị lấy.

**Nghiệm thu:** bản sao nội bộ không còn envelope A sau đổi mật khẩu; chế độ rotate phải khiến khóa A không đọc được dữ liệu mới. Giữ test việc đổi mật khẩu thường không re-encrypt toàn bộ dữ liệu như một contract riêng.

### SEC-04. Danh sách dữ liệu mã hóa chưa bao phủ hết dữ liệu cá nhân

**Vị trí:** `save.tsx:77` (`SECURE_DATA_KEYS`) so với các writer:

| Dữ liệu | Writer / cách lưu |
| --- | --- |
| Điểm thành phần, kế hoạch dự đoán/mục tiêu | `src/features/grades/components/gpa-pull-tool/gpa-pull-semester-table.tsx:176`, `savePlain(gpa_component_grades, ...)` |
| Thành viên nhóm | `src/features/group-schedule/hooks/use-group-scheduler.ts:142`, `saveToStorage(group_scheduler_members, ...)` |
| Kết quả nhóm gần nhất | Cùng file `:246`, `saveToStorage(group_schedule_last_result, ...)` |
| Tùy chỉnh lịch, ghi chú | `src/hooks/useSchedule.ts:62`; hook visual schedule còn có key hậu tố theo năm/học kỳ |
| Lịch sử chat, nếu tính năng được bật | `src/logic/ai/geminiService.ts:85`, `localStorage.setItem(...)` |

`saveToStorage` là alias của `savePlain` (`save.tsx:977`). Mã hóa `saved_schedules` không làm cho những bản sao kết quả nhóm này tự động được mã hóa.

**Khắc phục:** lập registry storage có sensitivity/schema/retention/export policy và resolver cho key động. Migrate các trường riêng tư có kiểm chứng kiểu dữ liệu; không biến decrypt lỗi thành fallback plaintext chung. Chỉ tăng schema version khi mọi mục migrate xong. Giữ tùy chọn giao diện đơn thuần ở plaintext khi thích hợp.

**Nghiệm thu:** sau lock, marker tên thành viên, ghi chú và điểm giả không xuất hiện nguyên văn trong các kho persistent hoặc backup mặc định. Kiểm tra cả key `schedule_overrides:<year>:<semester>`.

### SEC-05. Hoàn tác có thể xóa dữ liệu trước khi biết khôi phục được

**Vị trí:** `save.tsx:929` (`restoreLastImportRollback`), `:891` (`readImportRollbackValue`); nút hoàn tác toàn bộ ở `src/features/settings/components/DataSourceCenter.tsx:632`.

Hàm hoàn tác đọc snapshot, nếu hai bên cùng v2 thì ghép metadata crypto hiện tại vào dữ liệu snapshot, rồi `localStorage.clear()` và set từng key. Chỉ trùng version không chứng minh hai tập ciphertext dùng cùng Master Key. Nếu key khác hoặc ghi gặp quota, trạng thái có thể hỏng/mất một phần. Guard chống v1/v2 trong `readImportRollbackValue` không đồng nghĩa nhánh hoàn tác toàn bộ đã an toàn.

Ngoài ra, reader snapshot thử `JSON.parse(raw)` sau bất kỳ lỗi decrypt nào. Cần phân biệt legacy JSON hợp lệ và ciphertext không authenticate được, thay vì đánh đồng.

**Khắc phục:** gắn `keyId` và schema vào snapshot; mở/validate toàn bộ tập dữ liệu cần restore trước commit; không ghép envelope hiện tại với ciphertext của khóa khác. Dùng transaction và journal tương tự import; chỉ xóa snapshot khi commit thành công.

**Nghiệm thu:** snapshot v1 vào v2; hai vault v2 với hai Master Key khác nhau; snapshot trước đổi mật khẩu; quota ở từng bước; dữ liệu tamper. Tất cả phải fail sạch hoặc restore nhất quán.

### SEC-06. Race khi lock trong lúc hydrate cache

**Vị trí:** `src/context/CryptoContext.tsx:65`–`:112`.

Effect giải mã chạy async qua migrations và `Promise.all`. `lock()` xóa cache nhưng effect cũ không có cancellation/generation check trước `populateSecureCache`. Một lần decrypt đang chờ có thể hoàn tất sau lock và ghi lại plaintext vào cache. Effect cũ cũng giữ tham chiếu CryptoKey đến khi công việc kết thúc. Chưa chạy test component mô phỏng race; kết luận dựa trên thứ tự await và việc không có cleanup guard.

**Khắc phục:** gắn generation/epoch cho mỗi phiên unlock, cleanup vô hiệu hóa epoch cũ; kiểm tra trước mọi populate và event. Với migration đang ghi storage, cần quy tắc serialize/finish/cancel rõ ràng; chỉ guard React state là chưa đủ cho writer.

**Nghiệm thu:** trì hoãn decrypt có kiểm soát, gọi lock, cho promise hoàn tất; không entry nào trở lại cache, không phát sự kiện hoàn tất cho phiên cũ. Lặp với unlock khóa khác và StrictMode.

### SEC-07. API chat và biến môi trường có rủi ro nếu được deploy

**Vị trí:** `api/chat.ts:7`–`:34`; `src/logic/ai/groqService.ts:13`, `src/logic/ai/geminiService.ts:67`; `vite.config.ts` middleware `/api/chat`.

Handler chỉ kiểm tra POST và `newMessage` truthy, không có xác thực, hạn mức IP/user, schema/giới hạn history hoặc timeout ứng dụng cho upstream. Client tự gửi cả system prompt. Nếu deploy function có key, người ngoài có thể gọi trực tiếp để tiêu tốn quota. `CHATBOT_ENABLED: false` chỉ ẩn UI, không bảo vệ endpoint.

Code còn đọc `VITE_GEMINI_API_KEY`/`VITE_GROQ_API_KEY` ở client. Nếu giá trị thật được cung cấp lúc build và đoạn code được đưa vào bundle, đó là giá trị public. Không xác nhận có key thật bị lộ ở production trong lần rà soát này.

**Khắc phục:** nếu chưa dùng chatbot, vô hiệu hóa endpoint ở server/build. Nếu dùng: giữ key server-only; xác thực hoặc cấp capability ngắn hạn, rate-limit/hạn mức chi phí, giới hạn request/history, timeout, validate roles. Không dùng Origin/CORS làm thay thế authentication. Có budget upstream và cảnh báo sử dụng. Nếu từng phát hành key public, rotate tại nhà cung cấp.

**Nghiệm thu:** request không được phép không gọi upstream; burst bị giới hạn; body lớn/role sai bị từ chối; bundle không có giá trị secret. Không cần gọi model trả phí để test: mock upstream và đếm request.

### SEC-08. Ciphertext không bị ràng buộc với tên key

**Vị trí:** `save.tsx:324`–`:340`.

AES-GCM có IV và authentication tag nhưng không dùng `additionalData` cho payload dữ liệu. AAD hiện chỉ có ở Master Key envelope. Khi hai storage key dùng cùng Master Key, chuyển nguyên ciphertext từ key A sang B vẫn decrypt được.

**Đã tái hiện:** copy ciphertext `gpa_projected_grades` sang `solver_preferences`; `readSecure` trả object của A. Đây là hoán đổi ciphertext hợp lệ, không phải sửa byte vượt qua authentication AES-GCM. Kẻ tấn công cần khả năng sửa storage/backup; tác động cụ thể phụ thuộc schema của nơi đọc.

**Khắc phục:** format mới authenticate `application + formatVersion + keyId + storageKey` bằng AAD, validate schema sau decrypt. Có migration rõ ràng để không khóa người dùng với dữ liệu cũ. AAD không tự ngăn replay phiên bản cũ của cùng một key; muốn chống replay phải xác định mô hình revision/trusted state riêng.

**Nghiệm thu:** ciphertext A ở B bị từ chối; tamper IV/ciphertext/AAD fail; dữ liệu v1/v2 cũ vẫn migrate được.

### SEC-09. QR quang học hiện là truyền dữ liệu có thể đọc lại

**Vị trí:** `src/features/optical-sync/services/optical-sync-payload.ts:34`, `services/optical-payload.ts:49`, `components/OpticalSenderDialog.tsx:45`, `vendor/decimen/protocol.ts`.

Luồng: đọc plaintext từ cache → JSON → gzip/container → QR. Hash/checksum giúp phát hiện hỏng truyền, không chứng minh người gửi và không giữ bí mật. Ai quay đủ frame có thể giải mã optical/gzip để lấy JSON. PIN tạo ở máy nhận chỉ bảo vệ bản lưu sau đó.

**Khắc phục:** ghi đúng đặc tính này trong UI/quyền riêng tư; với dữ liệu riêng tư, mã hóa trước khi dựng frame bằng khóa transfer và có cơ chế trao đổi/xác minh khóa thực sự. Không đặt khóa giải mã ngay trong cùng chuỗi QR rồi gọi đó là bí mật. Nếu chọn passphrase riêng, dùng KDF ngẫu nhiên salt và policy chống đoán; nếu thêm ECDH/SAS, đánh giá thành giao thức mới.

**Đã làm tốt:** lớp decode có giới hạn 16 MB sau giải nén, outer protocol có giới hạn và đọc giải nén theo chunk. Chưa fuzz fountain decoder hay đo đỉnh RAM trên Android.

**Nghiệm thu:** bản ghi QR đơn thuần không đọc được JSON nếu không có secret ngoài bản ghi; frame sửa fail; receiver không tự commit trước preview/đồng ý.

### SEC-10. Schema import chưa đủ chặt

**Vị trí:** `src/portal-sync/protocol.ts:83`; `src/features/settings/services/system-backup.ts:38`–`:74`; `src/App.tsx:181`; `importData.tsx:228`.

`isPortalSyncPacket` chỉ yêu cầu `raw` object và `raw.grades` array. Backup có allowlist key tốt, nhưng giá trị bên trong chủ yếu stringify/JSON.parse rồi cast. Chưa có giới hạn chung về số phần tử, độ sâu, độ dài string hoặc trường nghiệp vụ cho mọi entry point. File JSON được giới hạn 8 MB và QR được giới hạn riêng; postMessage chưa có boundary tương đương trong handler đã đọc.

**Tác động:** dữ liệu sai kiểu có thể làm crash UI/parser, tiêu tốn bộ nhớ, lưu trạng thái không sử dụng được. Chưa chứng minh prototype pollution hay XSS từ dữ liệu import; không gán nhãn các lỗi đó chỉ vì có `JSON.parse`.

**Khắc phục:** schema versioned cho từng source/key, validate trước preview và trước commit; cap phần tử/string và từ chối các key nguy hiểm khi merge object. Gắn session/request với cửa sổ Portal đã mở khi cần; kiểm tra origin tốt vẫn chưa xác định đó là phiên import người dùng vừa khởi tạo. Giới hạn xử lý payload ở app, không chỉ file picker.

**Nghiệm thu:** `grades: [null]`, credits không hữu hạn, chuỗi quá dài, nested object sai, key lạ, packet sai version, mảng cực lớn đều bị từ chối có giải thích và không thay đổi storage.

### SEC-11. Vòng đời khóa, nhiều tab và thời gian mở khóa

**Vị trí:** `CryptoContext.tsx:25` (window Symbol), `SecurityGate.tsx:21` (storage listener), `save.tsx:658` (lockout).

CryptoKey được giữ trên `window[Symbol.for(...)]` cả ngoài dev để qua HMR. Non-extractable ngăn export raw key, nhưng script cùng origin vẫn dùng nó gọi decrypt được. Đây là giới hạn cơ bản cần phòng XSS, không phải chứng minh có XSS hiện tại.

Storage listener chỉ reload khi key bị xóa; chưa xử lý đầy đủ envelope bị thay thế bằng giá trị khác. Không thấy cơ chế auto-lock idle/background trong các component quản lý khóa đã đọc. Counter khóa tạm nằm sessionStorage: có thể reset khi thay session/sửa storage, và không chống đoán mật khẩu offline trên bản sao dữ liệu.

**Khắc phục:** chỉ dùng window persistence ở DEV; quản lý session epoch/keyId; phối hợp writer giữa tab bằng Web Locks hoặc cơ chế tương đương; báo các tab đóng phiên khi vault thay đổi. Thêm tùy chọn auto-lock theo thời gian/background với hành vi lưu đang chạy rõ ràng.

PBKDF2-SHA256 đang dùng 310.000 vòng. Có thể benchmark để nâng work factor và lưu tham số KDF trong envelope; không đổi hằng số toàn cục rồi làm backup cũ không mở được. Khuyến nghị OWASP hiện nêu 600.000 cho PBKDF2-HMAC-SHA256; đây là đầu vào để đánh giá hiệu năng, không phải kết luận 310.000 đã bị bẻ khóa. Không đề xuất thay yêu cầu độ dài mật khẩu trong đợt này.

### SEC-12. Dependency và release pipeline chưa có kết quả bảo mật đầy đủ

**Vị trí:** `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `e2e.yml`, `android.yml`.

Checkout đang track `package-lock.json`; không thấy pnpm lockfile được track. CI dùng `npm ci`, nhiều script còn gọi npm dù workflow phát triển đã chuyển pnpm. Điều này làm cây dependency kiểm thử có thể lệch cây đang dùng cục bộ. Không thấy job audit dependency/secret scan/CodeQL trong workflow đã rà; action tham chiếu tag thay vì full SHA.

`pnpm audit --json` thất bại do socket bị chặn (10013). Đã thử lại ngoài sandbox nhưng không nhận kết quả trong thời gian chờ và dừng tiến trình. Vì vậy không có số lượng advisory hiện tại để công bố. Những package như `xlsx` cần xác minh theo lockfile và nơi sử dụng, không tự suy rằng chỉ devDependency thì không ảnh hưởng: hãy kiểm tra có được bundle vào runtime không.

**Khắc phục:** chốt một package manager, track lockfile đúng, install frozen trong CI; thêm audit triage theo đường dependency và runtime reachability, secret scan cả lịch sử trong môi trường phù hợp, cập nhật action có kiểm soát/pin SHA. Không chạy auto-fix major hàng loạt mà thiếu regression test.

**Nghiệm thu:** local và CI dùng cùng lockfile; scan có artifact/report; lỗi bảo mật nghiêm trọng có owner và SLA; release APK được kiểm tra chữ ký, manifest debuggable, phiên bản và hash trước publish.

## 4. Những điểm đã làm tốt và các cảnh báo không nên kết luận sai

1. **Crypto:** Master Key 32 byte từ CSPRNG; salt 16 byte, IV 12 byte mới mỗi lần; AES-GCM; CryptoKey non-extractable. Envelope có AAD riêng. Test sửa Master Key ciphertext, IV và ciphertext dữ liệu đã có.
2. **Migration v1 → v2:** giữ bản sao v1, staging v2, kiểm tra decrypt lại, ghi version sau primary keys/envelope. Test có mô phỏng lỗi ở các bước commit. Không nên xóa v1 dần để lấy dung lượng.
3. **Nhập dữ liệu:** có preview, chọn mục, allowlist storage keys và snapshot. Lỗi còn lại nằm ở schema/atomicity/lifecycle, không phải hoàn toàn không có bảo vệ.
4. **Extension:** MV3; phân quyền sender theo message, check extension ID/origin; pending packet chuyển sang `chrome.storage.session`, có TTL và dọn legacy local. `host_permissions` còn rộng `*.hcmus.edu.vn`; nên thu hẹp khi có thể. Chưa khai thác bridge thực tế trên Portal.
5. **Web message:** `App.tsx` đã check origin Portal và packet; app bridge kiểm tra source/origin. Không lặp lại kết luận cũ “không kiểm tra origin”. Nhánh bookmark lab cùng origin không tự tạo lỗ hổng cross-origin; XSS cùng origin là giả định khác.
6. **Android TLS:** `handlePortalSslError` gọi cancel; không thấy bypass `proceed`. CA bổ sung trong network config là trust anchor, không phải pin cert leaf. Cần quy trình cập nhật CA và thử chain thực tế; chưa có căn cứ yêu cầu bỏ qua SSL.
7. **Android bridge:** có token cho các hàm JS, giới hạn kết quả 4 MB, URL HTTPS allowlist, tắt file/content access, activity Portal không exported, file kết quả giới hạn canonical cache path và xóa sau xử lý. `addJavascriptInterface` vẫn có mặt ở mọi frame; token giảm rủi ro nhưng không phải kiểm tra origin của frame. Xem xét origin-aware WebMessage API và dọn file cache tồn dư nếu process chết giữa chừng.
8. **Release:** `allowBackup=false`, `usesCleartextTraffic=false`; Gradle release yêu cầu thông tin signing. CI debug APK được đặt tên debug; sự tồn tại job debug không chứng minh đang phát hành debug APK.
9. **CSP:** script self + `wasm-unsafe-eval`, object none, frame-ancestors none, base-uri/form-action self. `wasm-unsafe-eval` phục vụ WASM không đồng nghĩa mở JavaScript `unsafe-eval`. Header Vercel chưa được xác minh runtime và không tự áp dụng cho bundle Android.
10. **XSS:** renderer chat escape `&`, `<`, `>` trước khi sinh markup; các `dangerouslySetInnerHTML` không được tự coi là XSS khi chưa trace nguồn. Link ghi chú chỉ HTTP(S), có `noopener noreferrer`. Chưa tìm thấy đường XSS khai thác được trong phần đã rà.
11. **Workspace:** route phụ thuộc DEV/`VITE_ENABLE_WORKSPACE`; đây là feature flag, không phải xác thực admin. Nếu bật production, người dùng có thể tiếp cận chức năng đó trên dữ liệu local của họ. Không đặt secret hay quyền server trong bundle này.
12. **Secret scan:** không có match mẫu Google API key/GitHub token/private-key header trong phạm vi source/artifact text được quét. Git index không có `.env` thật hoặc keystore theo mẫu tên đã kiểm. Chưa quét toàn bộ lịch sử Git và không đọc giá trị secrets môi trường; không kết luận “repo chắc chắn không có secret”.

## 5. Kết quả kiểm thử và cách tái hiện

### Test hiện có

```powershell
pnpm exec vitest run tests/unit/security/secure-storage.test.ts tests/unit/imports/import-preview.test.ts tests/unit/imports/import-metadata.test.ts
```

Kết quả: **3 file, 30 test pass**. Không chạy build/APK cho thay đổi chỉ tài liệu. Test pass xác nhận các contract đang có, không phủ nhận các phát hiện ngoài coverage.

### Ba phép thử bổ sung

Đã dùng file test tạm với Web Crypto và storage giả của Vitest; cả 3 quan sát bên dưới được xác nhận. File tạm đã xóa để không đưa kỳ vọng hành vi lỗi vào CI. Không sử dụng localStorage trình duyệt của người dùng.

| Phép thử | Thao tác | Quan sát hiện tại | Kỳ vọng sau sửa |
| --- | --- | --- | --- |
| Quota | Setup PIN; mock setItem ném lỗi với raw_student_db; await saveSecure | Promise resolve, không lưu được key | Promise reject; caller không báo thành công |
| Hoán đổi | Mã hóa object giả ở gpa_projected_grades; copy ciphertext sang solver_preferences | Đọc được nguyên object | Fail authentication/schema với storage-key AAD |
| Envelope cũ | Snapshot envelope mật khẩu A; đổi B; ghi dữ liệu mới; unlock snapshot với A | Khóa từ envelope A decrypt dữ liệu mới | Hiểu đúng re-wrap; rotate key khi cần thu hồi |

### Test bổ sung khi triển khai

- Quota/crash injection ở từng bước import/restore/setup/đổi khóa, không chỉ migration v1.
- Decrypt delayed + lock/unmount/đổi khóa; hai tab cùng ghi hoặc migrate.
- Xóa account/data xóa toàn bộ snapshot IndexedDB; lỗi xóa không báo hoàn tất.
- Snapshot cùng version nhưng khác keyId; snapshot trước/sau migration/đổi PIN.
- Schema fuzz theo từng nguồn Portal/JSON/QR; giới hạn decompression và peak memory Android.
- Permission matrix extension cho từng message; sender tab/frame/url sai, requestId hết hạn.
- Android TLS failure, iframe bridge, process chết để lại file, release signature/artifact checks.
- API: mock upstream, authentication/rate-limit/body limit, không lộ provider error chi tiết.

## 6. Lộ trình khắc phục đề xuất

### Đợt 1: ngăn mất dữ liệu và dữ liệu tồn dư

1. Chuẩn hóa lỗi của savePlain/saveSecure và rà mọi caller trước khi đổi contract.
2. Transaction import/restore với journal và keyId; validate ciphertext trước commit.
3. Xóa snapshot khi xóa dữ liệu; xử lý envelope snapshot khi đổi mật khẩu.
4. Chặn cache hydrate của phiên đã lock và phối hợp nhiều tab.
5. Nếu `/api/chat` đang public có key: vô hiệu hóa hoặc giới hạn ngay trước các nâng cấp khác.

Điều kiện đóng đợt: test quota/crash, cleanup, delayed-decrypt và foreign-key restore đều pass; không còn báo thành công giả.

### Đợt 2: hoàn thiện dữ liệu mã hóa và import

1. Storage registry có key/prefix, schema và sensitivity.
2. Migrate điểm thành phần, thành viên nhóm, lịch và ghi chú riêng tư.
3. Payload có AAD/keyId; version format và tham số KDF tương thích backup cũ.
4. Schema/size limits thống nhất mọi entry point.
5. Điều chỉnh thông báo quyền riêng tư cho QR; chọn thiết kế mã hóa transport phù hợp.

Điều kiện đóng đợt: plaintext audit trên dataset giả, test tamper/substitution, backup cũ/mới và các trường hợp dữ liệu rỗng đều pass.

### Đợt 3: phát hành và hardening

1. Thống nhất pnpm/lockfile/CI; chạy lại dependency audit online và triage từng advisory.
2. Secret scan lịch sử, kiểm tra cấu hình production và artifact thực tế.
3. Auto-lock/background phù hợp Android, thu hẹp bridge/extension permissions nếu khả thi.
4. CSP runtime cho web và WebView; báo cáo vi phạm ở chế độ Report-Only trước khi siết.
5. Kiểm tra lại WebRTC/Cloudflare ở đúng branch nếu muốn đưa tính năng đó vào release.

Không gom migration crypto, đổi storage, đổi transport và đổi package manager vào một commit khó rollback. Mỗi đợt cần fixture backup từ các phiên bản đang hỗ trợ và một phương án recovery được thử trước khi phát hành.

## 7. Tài liệu tham chiếu

- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html): giới hạn bảo vệ của web storage trước JavaScript cùng origin.
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): tham chiếu work factor PBKDF2; cần benchmark và lưu version tham số cho vault.
- [Android: WebView native bridge risks](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges): phạm vi all-frame của addJavascriptInterface và giới hạn nhận diện origin.
- Source trong checkout nêu ở từng phát hiện là bằng chứng hành vi UStudy; các tài liệu bên ngoài chỉ hỗ trợ khuyến nghị, không chứng minh production đang có lỗ hổng.
