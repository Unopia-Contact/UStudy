import { expect, test, type Page } from '@playwright/test';

async function seedSchedule(page: Page, schedules: string[]) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('department_configured', JSON.stringify(true));
    localStorage.setItem('selected_cohort_id', JSON.stringify('k24'));
    localStorage.setItem('selected_faculty_id', JSON.stringify('khoa-cntt'));
    localStorage.setItem('selected_major_id', JSON.stringify('cong-nghe-thong-tin'));
  });
  await page.goto('/privacy');
  await page.evaluate((values) => {
    localStorage.setItem('student_db_full', JSON.stringify({
      registrations: values.map((schedule, index) => ({
        id: `UITEST${index + 1}`,
        name: index === 0 ? 'Môn kiểm tra giao diện' : `Môn kiểm tra ${index + 1}`,
        classGroup: `UI${index + 1}`,
        courseType: 'LT',
        schedule,
      })),
    }));
    localStorage.setItem('import_meta', JSON.stringify({
      params: { registration: { year: '26-27', sem: '1' } },
    }));
  }, schedules);
  await page.evaluate(() => {
    window.history.pushState({}, '', '/schedule');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
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
