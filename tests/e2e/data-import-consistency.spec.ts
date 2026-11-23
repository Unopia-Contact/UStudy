import { expect, test, type Page } from '@playwright/test';

const password = 'ustudy-audit-fixture';

async function importPortalFixture(page: Page, name: string, score: string) {
  await page.evaluate(({ name, score }) => {
    window.postMessage({
      type: 'IMPORT_FULL_DATA',
      labSource: 'empty-bookmarklet',
      payload: { raw: {
        studentId: 'fixture',
        name,
        grades: [{ id: 'TEST101', name: 'Fixture Course', semester: '26-27/1', credits: '3', class: '01', type: 'LT', score }],
      } },
    }, location.origin);
  }, { name, score });
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
