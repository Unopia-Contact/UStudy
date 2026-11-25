import { expect, test, type Page } from '@playwright/test';

const password = 'ustudy-audit-fixture';

async function postPortalFixture(page: Page, name: string, score: string, studentId?: string) {
  await page.evaluate(({ name, score, studentId }) => {
    window.postMessage({
      type: 'IMPORT_FULL_DATA',
      labSource: 'empty-bookmarklet',
      payload: { raw: {
        ...(studentId ? { studentId } : {}),
        name,
        grades: [{ id: 'TEST101', name: 'Fixture Course', semester: '26-27/1', credits: '3', class: '01', type: 'LT', score }],
      } },
    }, location.origin);
  }, { name, score, studentId });
}

async function importPortalFixture(page: Page, name: string, score: string) {
  await postPortalFixture(page, name, score, 'fixture');
  await page.getByRole('button', { name: /^Nhập \d+ thay đổi$/ }).click();
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('department_configured', 'true'));
});

async function createStudentData(page: Page) {
  await page.goto('/dashboard');
  await expect(page.getByRole('main')).toBeVisible();
  await importPortalFixture(page, 'Sinh viên Alpha', '8');
  await page.getByPlaceholder('Nhập mật khẩu...').fill(password);
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByPlaceholder('Xác nhận mật khẩu...').fill(password);
  await page.getByRole('button', { name: 'Hoàn tất thiết lập' }).click();
  await expect(page.getByRole('heading', { name: 'Xác nhận mật khẩu' })).toBeHidden();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('student_db_full'))).not.toBeNull();
}

test('abandoning PIN setup does not create import history or an undo point', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('main')).toBeVisible();
  await importPortalFixture(page, 'Sinh viên thử nghiệm', '8');
  await expect(page.getByRole('heading', { name: 'Tạo mật khẩu' })).toBeVisible();
  await page.reload();
  expect(await page.evaluate(() => [
    localStorage.getItem('raw_student_db'),
    localStorage.getItem('__ustudy_import_history__'),
    localStorage.getItem('__ustudy_last_import_rollback__'),
  ])).toEqual([null, null, null]);
});

test('a same-name Portal sync without a student ID can be applied directly', async ({ page }) => {
  await createStudentData(page);
  const readRaw = () => page.evaluate(() => localStorage.getItem('raw_student_db'));
  const before = await readRaw();
  await postPortalFixture(page, 'Sinh viên Alpha', '9');
  const preview = page.getByRole('dialog', { name: 'Xem trước dữ liệu từ Bookmarklet' });
  const apply = preview.getByRole('button', { name: /^Nhập \d+ thay đổi$/ });
  await expect(apply).toBeEnabled();
  await expect(preview.getByRole('checkbox', { name: /thiếu MSSV/ })).toHaveCount(0);
  await apply.click();
  await expect.poll(readRaw).not.toBe(before);
});

test('an unlocked tab refreshes after another tab commits an import', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'The profile name is shown in the desktop header.');
  await createStudentData(page);
  await expect(page.getByText('Sinh viên Alpha', { exact: true }).first()).toBeVisible();

  const second = await context.newPage();
  await second.goto('/dashboard');
  await second.getByPlaceholder('Nhập mật khẩu...').fill(password);
  await second.getByRole('button', { name: 'Mở khóa', exact: true }).click();
  await expect(second.getByText('Sinh viên Alpha', { exact: true }).first()).toBeVisible();

  await importPortalFixture(page, 'Sinh viên Beta', '9');
  await expect(page.getByText('Sinh viên Beta', { exact: true }).first()).toBeVisible();
  await expect(second.getByText('Sinh viên Beta', { exact: true }).first()).toBeVisible();
});

test('a failed import keeps the existing data, history and undo point', async ({ page }) => {
  await createStudentData(page);
  const trackedKeys = ['raw_student_db', 'student_db_full', 'course_db_offline', 'ustudy_last_data_import',
    '__ustudy_import_history__', '__ustudy_last_import_rollback__'];
  const readTracked = () => page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), trackedKeys);
  const before = await readTracked();
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'student_db_full') throw new DOMException('Test quota exhausted', 'QuotaExceededError');
      setItem.call(this, key, value);
    };
  });
  await importPortalFixture(page, 'Sinh viên Beta', '9');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('app_notifications') ?? '[]')
    .some((entry: { message: string }) => entry.message.includes('Test quota exhausted')))).toBe(true);
  expect(await readTracked()).toEqual(before);
});

test('logging out clears undo data and the saved schedule image from IndexedDB', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop logout button has a visible label.');
  await createStudentData(page);
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('ustudy-schedule-image', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('assets');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('assets', 'readwrite');
      transaction.objectStore('assets').put(new Blob(['fixture']), 'background');
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }));
  const storedCounts = () => page.evaluate(() => Promise.all([
    ['ustudy-import-rollback', 'snapshots'],
    ['ustudy-schedule-image', 'assets'],
  ].map(([name, store]) => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const count = database.transaction(store).objectStore(store).count();
      count.onsuccess = () => { database.close(); resolve(count.result); };
      count.onerror = () => { database.close(); reject(count.error); };
    };
  }))));
  expect(await storedCounts()).toEqual([1, 1]);

  const logout = page.getByRole('button', { name: 'Đăng xuất', exact: true });
  await logout.click();
  await expect(page.getByRole('heading', { name: 'Bạn có chắc chắn muốn đăng xuất?' })).toBeVisible();
  await logout.last().click();
  await expect(logout).toHaveCount(0);
  expect(await storedCounts()).toEqual([0, 0]);
});

test('undo restores the prior academic revision and preserves edits made afterwards', async ({ page }) => {
  await createStudentData(page);
  const before = await page.evaluate(() => localStorage.getItem('raw_student_db'));
  await importPortalFixture(page, 'Sinh viên Beta', '9');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('raw_student_db'))).not.toBe(before);
  await page.evaluate(() => localStorage.setItem('study_plan_draft', JSON.stringify({ semesters: [], plan: { later: ['KEEP'] } })));
  await page.goto('/settings');
  await page.getByPlaceholder('Nhập mật khẩu...').fill(password);
  await page.getByRole('button', { name: 'Mở khóa', exact: true }).click();
  await page.getByRole('button', { name: 'Nguồn & lịch sử dữ liệu' }).click();
  await page.getByRole('button', { name: 'Hoàn tác toàn bộ', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Hoàn tác toàn bộ', exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('raw_student_db'))).toBe(before);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('study_plan_draft')!).plan.later)).toEqual(['KEEP']);
});

test('a Portal file without a student ID supports individual changes and preserves the undo point on replay', async ({ page }) => {
  await createStudentData(page);
  await page.goto('/settings');
  const openTransfer = async () => {
    await page.getByPlaceholder('Nhập mật khẩu...').fill(password);
    await page.getByRole('button', { name: 'Mở khóa', exact: true }).click();
    await page.getByRole('button', { name: 'Sao lưu & chuyển dữ liệu' }).click();
  };
  await openTransfer();
  const grade = (id: string) => ({ id, name: id, semester: '26-27/1', class: '01', type: 'LT', score: '9' });
  const upload = (ids: string[]) => page.locator('input[type=file][accept*="json"]').first().setInputFiles({
    name: 'portal.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
      raw: { name: 'Sinh viên Alpha', grades: ids.map(grade) },
    })),
  });
  await upload(['FILE101', 'FILE102']);
  const dialog = page.getByRole('dialog', { name: 'Xem trước dữ liệu nhập' });
  await expect(dialog.getByRole('checkbox', { name: /thiếu MSSV/ })).toHaveCount(0);
  await dialog.getByRole('checkbox', { name: /FILE102/ }).uncheck();
  await dialog.getByRole('button', { name: 'Nhập 1 mục' }).click();
  await openTransfer();
  const before = await page.evaluate(() => localStorage.getItem('__ustudy_last_import_rollback__'));
  await upload(['FILE101']);
  await expect(dialog.getByRole('button', { name: 'Nhập 0 mục' })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('__ustudy_last_import_rollback__'))).toBe(before);
  await dialog.getByRole('button', { name: 'Hủy' }).click();
  await upload(['FILE102']);
  await expect(dialog.getByRole('checkbox', { name: /FILE102/ })).toBeChecked();
});
