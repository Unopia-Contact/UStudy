# Kiem thu va CI cho UStudy

> Bo `tests/`, cau hinh Vitest/Playwright va test Android chi duoc giu tren may nhan vien; GitHub khong luu cac file nay. Nhan vien moi can nhan bo test tu noi bo truoc khi chay cac lenh ben duoi. May chi clone repository se build duoc, nhung khong chay duoc test local.

## Muc tieu

Bo kiem thu bao ve cac luong co rui ro cao nhat cua UStudy:

- Ma hoa, PIN, doi PIN va nhap backup.
- GPA, tin chi, diem chua co va du doan theo tung hoc ky.
- Hoc phi, don gia theo prefix va thu tu uu tien nguon du lieu.
- Import tu Bookmarklet/Extension, xem truoc thay doi, chong trung va dong bo xoa.
- Lich dang ky co san, solver ca nhan va solver nhom.
- Khoi dong giao dien tren desktop/mobile va build Android debug.

## Lenh dung tai local

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck:test
pnpm run test:unit
pnpm run test:coverage
pnpm run build
pnpm run check:local
```

Chay browser smoke test lan dau:

```powershell
pnpm exec playwright install chromium
pnpm run test:e2e
```

Chay mot file hoac loc theo ten ca kiem thu:

```powershell
pnpm exec vitest run tests/unit/imports/import-preview.test.ts
pnpm exec vitest run -t "empty scraped collection"
```

## Cau truc

```text
tests/
  unit/
    security/       Ma hoa va backup
    grades/         GPA, tin chi, diem du kien
    tuition/        Don gia va hoc phi
    imports/        Merge va metadata import
    scheduler/      Dang ky co san va solver
  contracts/
    portal-sync/    Hop dong config/manifest Extension
  e2e/              Smoke test desktop va mobile
  setup/            Web Crypto va storage gia lap
```

## GitHub Actions

- `Web and extension build`: cai dependency, build web va extension; khong chay test.
- `Android debug build`: dong bo Capacitor va tao APK debug; khong chay Android unit test.
- `Sync mirror repository`: dong bo branch main sang mirror.

APK va extension duoc luu thanh artifact. Coverage va Playwright report chi tao tren may nhan vien.

## Quy tac them test

1. Dat test gan domain, khong gan component neu logic da co service thuan.
2. Payload Portal phai duoc rut gon va xoa thong tin sinh vien that.
3. Moi loi du lieu tung xay ra can co mot regression test truoc khi sua.
4. Test solver kiem tra invariant, khong dong cung thu tu ngau nhien cua phuong an.
5. Thay doi storage, config extension hoac schema import phai co test tuong thich nguoc.

## Bao ve branch

Neu GitHub branch protection dang yeu cau `Web and core tests / verify` hoac `Browser smoke tests / chromium`, cap nhat required checks sau khi merge thay doi nay; hai check do se khong con chay. Co the yeu cau `Web and extension build / verify` va `Android debug build / debug-apk` neu phu hop.

Test, coverage va full-app type-check duoc nhan vien chay local truoc khi merge. `pnpm run typecheck` van la lenh audit toan bo ung dung; viec loai bo test khoi GitHub khong thay the quy trinh kiem tra local.
