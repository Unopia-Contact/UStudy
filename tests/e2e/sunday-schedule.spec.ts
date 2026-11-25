import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function seedSchedule(page: Page, schedules: string[]) {
  await page.addInitScript(() => {
    localStorage.setItem('department_configured', JSON.stringify(true));
    localStorage.setItem('selected_cohort_id', JSON.stringify('k24'));
    localStorage.setItem('selected_faculty_id', JSON.stringify('khoa-cntt'));
    localStorage.setItem('selected_major_id', JSON.stringify('cong-nghe-thong-tin'));
  });
  await page.goto('/schedule');
  await expect(page.getByRole('heading', { name: 'Thời khóa biểu' })).toBeVisible();
  await page.evaluate((values) => {
    const registrations = values.map((schedule, index) => ({
      id: 'UITEST' + (index + 1), name: 'Môn kiểm tra ' + (index + 1),
      classGroup: 'UI' + (index + 1), courseType: 'LT', schedule,
    }));
    window.postMessage({
      type: 'IMPORT_FULL_DATA', labSource: 'empty-bookmarklet',
      payload: { raw: { name: 'Sinh viên thử lịch', studentId: 'fixture', registrations },
        meta: { params: { registration: { year: '26-27', sem: '1' } } } },
    }, location.origin);
  }, schedules);
  await page.getByRole('button', { name: /^Nhập \d+ thay đổi$/ }).click();
  await page.getByPlaceholder('Nhập mật khẩu...').fill('schedule-fixture');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByPlaceholder('Xác nhận mật khẩu...').fill('schedule-fixture');
  await page.getByRole('button', { name: 'Hoàn tất thiết lập' }).click();
}

test('shows the Sunday column only when a Sunday session exists', async ({ page }) => {
  await seedSchedule(page, [
    'T2(1-4)-P.cs2:D207',
    'TCN(6-9)-P.cs2:F202',
  ]);
  await expect(page.getByRole('heading', { name: 'Thời khóa biểu' })).toBeVisible();
  await expect(page.getByText('Chủ nhật', { exact: true })).toBeVisible();
  await expect(page.getByText('UITEST2', { exact: true })).toBeVisible();

  const sundayHeader = page.getByText('Chủ nhật', { exact: true });
  const calendarScroller = sundayHeader.locator('xpath=ancestor::div[contains(@class, "overflow-x-auto")][1]');
  await expect(calendarScroller).toBeVisible();
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 768) {
    expect(await calendarScroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  }
});

test('keeps the six-day calendar when no Sunday session exists', async ({ page }) => {
  await seedSchedule(page, [
    'T2(1-4)-P.cs2:D207',
    'T7(6-9)-P.cs2:F202',
  ]);
  await expect(page.getByRole('heading', { name: 'Thời khóa biểu' })).toBeVisible();
  await expect(page.getByText('Chủ nhật', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Thứ 7', { exact: true })).toBeVisible();
});

test('extends one meeting, keeps the edit after Portal changes its room, and restores the base weeks', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('department_configured', 'true'));
  await context.route('**/holidays.json', route => route.fulfill({ json: [] }));
  await page.goto('/schedule');
  await expect(page.getByRole('heading', { name: 'Thời khóa biểu' })).toBeVisible();

  const importMeetings = async (room: string) => {
    await page.evaluate(room => {
      const registrations = ['T2(1-5)-' + room, 'T4(1-5)-B201'].map(schedule => ({
        id: 'ADD00031', name: 'Anh văn 1', classGroup: 'AV01', courseType: 'LT', schedule, startWeek: '04/01/2027',
      }));
      window.postMessage({ type: 'IMPORT_FULL_DATA', labSource: 'empty-bookmarklet', payload: {
        raw: { name: 'Sinh viên kiểm thử', studentId: 'week-fixture', registrations },
        meta: { params: { registration: { year: '26-27', sem: '1', snapshotComplete: true } } },
      } }, location.origin);
    }, room);
    await page.getByRole('button', { name: /^Nhập \d+ thay đổi$/ }).click();
  };
  await importMeetings('A101');
  await page.getByPlaceholder('Nhập mật khẩu...').fill('schedule-fixture');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByPlaceholder('Xác nhận mật khẩu...').fill('schedule-fixture');
  await page.getByRole('button', { name: 'Hoàn tất thiết lập' }).click();
  const weeks = page.getByRole('combobox', { name: 'Chọn tuần học' });
  await expect(weeks.locator('option')).toHaveCount(6);
  await page.getByRole('button', { name: /^Tùy chỉnh môn ADD00031 .*Thứ 2/ }).click();
  await page.getByLabel('Số tuần học').fill('8');
  await expect(page.getByText('Buổi cuối ở tuần 8 · 8 buổi học')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await page.getByRole('button', { name: 'Xem tuần 8' }).click();
  await expect(page.getByText('ADD00031', { exact: true })).toHaveCount(1);
  await importMeetings('A102');
  await expect(page.getByRole('button', { name: 'Tùy chỉnh buổi học ADD00031' }).locator('..')).toContainText('A102');
  const options = page.getByRole('button', { name: 'Mở tùy chọn thời khóa biểu' });
  await options.click();
  const menu = page.getByRole('menu', { name: 'Tùy chọn thời khóa biểu' });
  await expect(menu.getByRole('menuitem')).toHaveCount(5);
  const bounds = await menu.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.keyboard.press('Escape');
  await expect(options).toBeFocused();
  await options.press('ArrowDown');
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Xuất lịch (.ics)' }).click();
  const file = await download;
  const ics = await readFile((await file.path())!, 'utf8');
  expect(ics).toContain('COUNT=8');
  expect(ics).toContain('LOCATION:A102');
  expect(ics).toContain('COUNT=6');
  await page.getByRole('button', { name: /^Tùy chỉnh môn ADD00031 .*Thứ 2/ }).click();
  await expect(page.getByLabel('Phòng học')).toHaveValue('A102');
  await expect(page.getByLabel('Số tuần học')).toHaveValue('8');
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  const second = await context.newPage();
  await second.goto('/schedule');
  await second.getByPlaceholder('Nhập mật khẩu...').fill('schedule-fixture');
  await second.getByRole('button', { name: 'Mở khóa', exact: true }).click();
  const secondWeeks = second.getByRole('combobox', { name: 'Chọn tuần học' });
  await secondWeeks.selectOption('8');
  await expect(second.getByText('ADD00031', { exact: true })).toHaveCount(1);
  await weeks.selectOption('3');
  await page.getByRole('button', { name: /^Tùy chỉnh môn ADD00031 .*Thứ 2/ }).click();
  await page.getByLabel('Số tuần học').fill('11');
  await second.getByRole('button', { name: /^Tùy chỉnh môn ADD00031 .*Thứ 2/ }).click();
  await second.getByLabel('Số tuần học').fill('4');
  await second.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect.poll(() => page.evaluate(() => {
    const edits = JSON.parse(localStorage.getItem('schedule_overrides:26-27:1') ?? '{}');
    return edits.sessionOverrides?.['ADD00031|AV01|LT|T2(1-5)-A102']?.weekCount;
  })).toBe(4);
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(/Buổi học đã thay đổi trong khi bạn chỉnh sửa/)).toBeVisible();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await weeks.selectOption('5');
  await expect(page.getByText('ADD00031', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: /^Tùy chỉnh môn ADD00031 .*Thứ 2/ }).click();
  await page.getByRole('button', { name: 'Khôi phục mặc định' }).click();
  await expect(page.getByText('ADD00031', { exact: true })).toHaveCount(2);
  await expect(weeks.locator('option')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


test('keeps a failed edit open and asks which new meeting should inherit it', async ({ page }) => {
  await seedSchedule(page, ['T2(1-3)-P101']);
  await page.getByRole('button', { name: 'Tùy chỉnh buổi học UITEST1' }).click();
  await page.getByLabel('Số tuần học').fill('18');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('schedule_overrides:')) {
        Storage.prototype.setItem = original;
        throw new DOMException('Test quota', 'QuotaExceededError');
      }
      original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(/Chưa lưu được thay đổi/)).toBeVisible();
  await expect(page.getByLabel('Số tuần học')).toHaveValue('18');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await page.evaluate(() => window.postMessage({ type: 'IMPORT_FULL_DATA', labSource: 'empty-bookmarklet',
    payload: { raw: { name: 'Sinh viên thử lịch', studentId: 'fixture', registrations:
      ['T3(1-3)-P301', 'T5(1-3)-P501'].map(schedule => ({
        id: 'UITEST1', name: 'Môn kiểm tra 1', classGroup: 'UI1', courseType: 'LT', schedule,
      })) }, meta: { params: { registration: { year: '26-27', sem: '1', snapshotComplete: true } } } } }, location.origin));
  await page.getByRole('button', { name: /^Nhập \d+ thay đổi$/ }).click();
  const pick = page.getByLabel('Gắn tùy chỉnh vào buổi học');
  await expect(pick.locator('option')).toHaveCount(3);
  await pick.selectOption({ label: 'UITEST1 · UI1 · LT · T5(1-3)-P501' });
  await expect(pick).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Chọn tuần học' }).selectOption('18');
  await expect(page.getByRole('button', { name: 'Tùy chỉnh buổi học UITEST1' }).locator('..')).toContainText('P501');
});

test('keeps legacy exceptions until reset and edits the number of weeks from a later start', async ({ page }) => {
  await page.route('**/holidays.json', route => route.fulfill({ json: [] }));
  await seedSchedule(page, ['T2(1-3)-P101']);
  const key = 'schedule_overrides:26-27:1';
  const id = 'UITEST1|UI1|LT|T2(1-3)-P101';
  await page.evaluate(({ key, id }) => {
    localStorage.setItem(key, JSON.stringify({
      sessionOverrides: { [id]: { startWeek: 3, endWeek: 6, hiddenWeeks: [4] } },
      weekOverrides: { ['5_' + id]: { room: 'F301' } }, holidays: [],
    }));
    window.dispatchEvent(new Event('ustudy:storage-changed'));
  }, { key, id });
  const open = page.getByRole('button', { name: /^Tùy chỉnh môn UITEST1/ });
  const form = page.getByRole('dialog', { name: 'Tùy chỉnh môn học' });
  const count = form.getByLabel('Số tuần học');
  await open.click();
  await expect(form.getByLabel('Tuần bắt đầu')).toHaveValue('3');
  await expect(count).toHaveValue('4');
  await expect(form.getByText('Buổi cuối ở tuần 6 · 3 buổi học')).toBeVisible();
  await expect(form.getByRole('switch')).toHaveCount(0);
  await expect(form.getByLabel('Ghi chú', { exact: true })).toBeHidden();
  await form.getByText('Màu và ghi chú', { exact: true }).click();
  await form.getByLabel('Ghi chú', { exact: true }).fill('Mang máy tính');
  const save = form.getByRole('button', { name: 'Lưu thay đổi' });
  await save.click();
  const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect((await stored()).sessionOverrides[id]).toMatchObject({ endWeek: 6, hiddenWeeks: [4], note: 'Mang máy tính' });
  await open.click();
  await count.fill('0');
  await save.click();
  await expect(form.getByRole('alert')).toContainText('số nguyên');
  await count.fill('5');
  await expect(form.getByText('Buổi cuối ở tuần 7 · 4 buổi học')).toBeVisible();
  await save.click();
  const changed = await stored();
  expect(changed.sessionOverrides[id]).toMatchObject({ startWeek: 3, weekCount: 5, hiddenWeeks: [4] });
  expect(changed.sessionOverrides[id]).not.toHaveProperty('endWeek');
  expect(changed.weekOverrides['5_' + id]).toEqual({ room: 'F301' });
  await open.click();
  await form.getByRole('button', { name: 'Khôi phục mặc định' }).click();
  expect((await stored()).sessionOverrides).not.toHaveProperty(id);
  expect((await stored()).weekOverrides).toEqual({});
});

test('opens the chosen meeting directly from a shared time slot and the course list', async ({ page }) => {
  await seedSchedule(page, ['T2(1-3)-P101', 'T2(1-3)-P202']);
  const slot = page.getByRole('button', { name: 'Chọn buổi học trùng lịch' });
  if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
    await slot.hover();
    await expect(page.getByText('Các buổi học cùng chiếm khung giờ này.')).toBeVisible();
  }
  await slot.click();
  const picker = page.getByRole('dialog', { name: 'Chọn buổi học cần chỉnh' });
  await expect(page.getByText('Các buổi học cùng chiếm khung giờ này.')).toHaveCount(0);
  await picker.getByRole('button', { name: /UITEST2 · Môn kiểm tra 2/ }).click();
  await expect(page.getByLabel('Phòng học')).toHaveValue('P202');
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.getByText(/Ước tính theo số tiết/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sửa buổi học' })).toHaveCount(0);
  await page.getByRole('button', { name: /^Tùy chỉnh môn UITEST1/ }).press('Enter');
  await expect(page.getByLabel('Phòng học')).toHaveValue('P101');
});
