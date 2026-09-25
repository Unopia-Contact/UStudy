# Ký và phát hành APK Android

UStudy dùng mã ứng dụng `com.ustudy.app`. Khóa ký APK cũ đã mất, nên APK ký bằng khóa mới **không thể cập nhật đè** bản người dùng đang cài. Workflow tự phát hành bản APK ký mới sau khi push thay đổi ứng dụng lên `main`; hãy hoàn tất thông báo sao lưu dữ liệu trước lần merge đầu tiên.

## 1. Tạo khóa ký một lần

Thực hiện trên máy tin cậy, ở thư mục riêng **ngoài repository**. Chọn mật khẩu dài, duy nhất và lưu trong trình quản lý mật khẩu. Không gửi keystore hoặc mật khẩu qua chat, commit, issue, log hay artifact. Trên Windows có Git, có thể dùng OpenSSL đi kèm mà **không cần cài JDK**:

```powershell
$signTool = 'C:\Program Files\Git\mingw64\bin\openssl.exe'
New-Item -ItemType Directory -Force 'D:\PrivateKeys' | Out-Null

& $signTool req -x509 -newkey rsa:4096 -sha256 -days 10000 `
  -keyout 'D:\PrivateKeys\ustudy-private-key.pem' `
  -out 'D:\PrivateKeys\ustudy-cert.pem' `
  -subj '/CN=UStudy/O=UStudy'

& $signTool pkcs12 -export `
  -inkey 'D:\PrivateKeys\ustudy-private-key.pem' `
  -in 'D:\PrivateKeys\ustudy-cert.pem' `
  -name 'ustudy-release' `
  -out 'D:\PrivateKeys\ustudy-release-2026.p12'

& $signTool pkcs12 -in 'D:\PrivateKeys\ustudy-release-2026.p12' -info -noout
& $signTool x509 -in 'D:\PrivateKeys\ustudy-cert.pem' -noout -fingerprint -sha256
```

Lệnh đầu hỏi mật khẩu cho private key PEM; lệnh thứ hai hỏi lại mật khẩu đó rồi cho đặt mật khẩu **PKCS12**. Hai secret `USTUDY_RELEASE_STORE_PASSWORD` và `USTUDY_RELEASE_KEY_PASSWORD` bên dưới đều dùng mật khẩu PKCS12. File `ustudy-private-key.pem` cũng là khóa riêng (dù được bảo vệ bằng mật khẩu), phải sao lưu/bảo vệ như file `.p12`.

Nếu đã có JDK trên máy khác, cách `keytool` tương đương là:

```powershell
keytool -genkeypair -v `
  -keystore "D:\PrivateKeys\ustudy-release-2026.p12" `
  -storetype PKCS12 `
  -alias ustudy-release `
  -keyalg RSA -keysize 4096 -validity 10000 `
  -dname "CN=UStudy, O=UStudy"
```

`keytool` sẽ hỏi mật khẩu trên máy. Với PKCS12, mật khẩu khóa thường giống mật khẩu keystore. Đừng đặt mật khẩu vào command line. Lưu **ít nhất hai bản sao** keystore ở hai nơi riêng biệt (chẳng hạn ổ lưu trữ mã hóa và kho sao lưu an toàn), cùng alias và mật khẩu. GitHub Secrets không phải bản sao lưu duy nhất. Mất khóa mới lần nữa thì các bản APK phát hành bằng khóa đó cũng không thể cập nhật.

Nếu dùng `keytool`, ghi lại SHA-256 fingerprint công khai của chứng chỉ để đối chiếu các bản release về sau:

```powershell
keytool -list -v -keystore "D:\PrivateKeys\ustudy-release-2026.p12" -alias ustudy-release
```

## 2. Cấu hình GitHub Actions

Trong GitHub repository, tạo Environment tên `android-release` và giới hạn deployment branch là `main`. Vì luồng phát hành APK giờ chạy tự động sau khi push, **không bật required reviewers** nếu muốn không phải duyệt tay mỗi lần; đổi lại chỉ người tin cậy được phép merge vào `main` và sửa workflow.

Thêm **Environment Secrets** sau (không phải repository variables):

| Secret | Giá trị |
| --- | --- |
| `USTUDY_RELEASE_KEYSTORE_BASE64` | Nội dung keystore biểu diễn bằng Base64 để truyền vào Actions; Base64 **không** phải mã hóa bảo mật |
| `USTUDY_RELEASE_STORE_PASSWORD` | Mật khẩu keystore |
| `USTUDY_RELEASE_KEY_ALIAS` | `ustudy-release` |
| `USTUDY_RELEASE_KEY_PASSWORD` | Mật khẩu khóa ký |

Trên PowerShell, sao chép Base64 vào clipboard, không in ra terminal hoặc lưu thành file khác:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('D:\PrivateKeys\ustudy-release-2026.p12')) | Set-Clipboard
```

Dán trực tiếp vào secret `USTUDY_RELEASE_KEYSTORE_BASE64`, rồi xóa nội dung clipboard. Chỉ người được phép phát hành mới nên có quyền thay đổi Environment Secrets hoặc chạy release workflow.

## 3. Phát hành tự động

Mỗi push lên `main`, workflow **Android signed release APK** sẽ dùng Environment `android-release` để build bằng khóa cố định. `versionCode` tự tăng theo số lần chạy và lần thử workflow (bắt đầu từ 100101), còn `versionName` có hậu tố tương ứng. Không cần sửa phiên bản bằng tay cho mỗi lần build; khi đổi phiên bản sản phẩm, cập nhật `baseVersionName` trong `android/app/build.gradle`. Push chỉ sửa tài liệu cũng sẽ build lại APK để bảo đảm một commit mới không làm bản build trước bị bỏ qua. Commit APK do workflow tạo dùng `GITHUB_TOKEN`, nên không kích hoạt lại workflow GitHub Actions.

Workflow xác thực chữ ký, lưu artifact `ustudy-signed-release-apk` trong 14 ngày, rồi cập nhật **chỉ** `public/downloads/UStudy-android.apk` bằng một commit bot trên `main`. Nếu build lỗi, không có APK mới được công bố. Nếu `main` đã có commit mới trong lúc build, bản cũ không được đẩy lên đè bản mới.

Nút tải trên UStudy dùng `/downloads/UStudy-android.apk`. Để file mới **thật sự lên website**, Cloudflare Git integration phải theo dõi thay đổi `public/downloads/**`, build và **deploy** commit bot trên `main`; lệnh `wrangler versions upload` chỉ upload phiên bản, không tự đưa nó thành bản đang phục vụ. Cần dùng deploy command `pnpm exec wrangler deploy` cho Worker mặc định và `pnpm exec wrangler deploy --env unopia` cho Worker Unopia nếu hai tài khoản đang build riêng. Sau khi push APK, workflow chờ và so SHA-256 file tải từ **cả hai domain**; nếu một bên chưa cập nhật, workflow báo lỗi để kiểm tra Cloudflare. Nếu main được bảo vệ không cho `github-actions[bot]` push, bước phát hành sẽ thất bại và APK công khai giữ nguyên; phải thiết lập quyền/policy phù hợp, không nới quyền cho pull request.

Workflow vẫn có nút **Run workflow** trên `main` để build lại thủ công khi cần; nút này cũng sẽ công bố APK sau khi build thành công. Trước khi merge lần đầu, hãy thử cài APK ký bằng khóa mới và đối chiếu fingerprint với bản đã lưu (`apksigner verify --print-certs UStudy-release.apk` trên máy có Android SDK). Đừng merge vào `main` khi chưa sẵn sàng thông báo người dùng về lần chuyển khóa. Giữ nguyên khóa này cho mọi bản release về sau.

## 4. Chuyển người dùng từ bản APK ký bằng khóa cũ

Thông báo rõ đây là **lần chuyển khóa**, không phải bản cập nhật cài đè:

1. Trong app **cũ**, mở **Cài đặt → Nhập / Xuất dữ liệu → Xuất dữ liệu** và lưu file sao lưu ở nơi an toàn. Giữ mật khẩu/PIN cần để khôi phục file.
2. Kiểm tra file đã được lưu và có dung lượng hợp lý. **Đừng gỡ app cũ trước bước này.**
3. Gỡ bản APK cũ, cài APK mới đã ký bằng khóa mới.
4. Mở app mới, vào **Cài đặt → Nhập / Xuất dữ liệu**, nhập file sao lưu, mở khóa và kiểm tra điểm, lịch học, cài đặt.
5. Chỉ xóa file sao lưu khi đã xác nhận dữ liệu được khôi phục. Nếu không có file sao lưu, dữ liệu chỉ nằm trong app cũ có thể bị mất khi gỡ.

Android manifest hiện đặt `allowBackup="false"`, nên không được trông chờ vào khôi phục tự động. Vì phát hành bây giờ là tự động sau khi merge, phải truyền đạt và thử nghiệm đầy đủ quy trình chuyển dữ liệu **trước lần merge đầu tiên lên `main`**.
