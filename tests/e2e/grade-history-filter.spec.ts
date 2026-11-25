import { expect, test } from '@playwright/test';

test('keeps the grade filter frame stable while using its scrollable controls', async ({ page, context, isMobile }) => {
  await context.addInitScript(() => localStorage.setItem('department_configured', 'true'));
  await page.goto('/dashboard');
  await expect(page.getByRole('main')).toBeVisible();
  await page.evaluate(() => window.postMessage({
    type: 'IMPORT_FULL_DATA',
    labSource: 'empty-bookmarklet',
    payload: { raw: {
      name: 'Sinh viên thử bộ lọc',
      studentId: 'filter-fixture',
      grades: [{ id: 'TEST101', name: 'Fixture Course', semester: '26-27/1', credits: '3', class: '01', type: 'LT', score: '8' }],
    } },
  }, location.origin));
  await page.getByRole('button', { name: /^Nhập \d+ thay đổi$/ }).click();
  await page.getByPlaceholder('Nhập mật khẩu...').fill('filter-fixture');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByPlaceholder('Xác nhận mật khẩu...').fill('filter-fixture');
  await page.getByRole('button', { name: 'Hoàn tất thiết lập' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('student_db_full'))).not.toBeNull();

  await page.goto('/grades');
  await page.getByPlaceholder('Nhập mật khẩu...').fill('filter-fixture');
  await page.getByRole('button', { name: 'Mở khóa', exact: true }).click();
  await page.getByRole('navigation', { name: 'Quản lý điểm' }).getByRole('button', { name: /Lịch sử điểm/ }).click();
  const trigger = page.getByRole('button', { name: isMobile ? /^Lọc/ : /^Bộ lọc/ });
  await trigger.click();

  const filter = page.getByRole('dialog', { name: 'Bộ lọc lịch sử điểm' });
  await expect(filter.getByRole('heading', { name: 'Bộ lọc lịch sử điểm' })).toBeFocused();
  if (!isMobile) {
    await expect.poll(() => filter.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return Math.abs(bounds.top + bounds.height / 2 - innerHeight / 2);
    })).toBeLessThan(2);
  }

  await filter.getByRole('button', { name: /^Áp dụng/ }).click({ trial: true });
  const initialBounds = await filter.boundingBox();
  const search = filter.getByLabel('Tìm môn học');
  await search.fill('Không có môn này');
  await filter.getByRole('heading', { name: 'Số tín chỉ' }).scrollIntoViewIfNeeded();
  expect(await filter.boundingBox()).toEqual(initialBounds);
  const apply = filter.getByRole('button', { name: 'Áp dụng (0 môn)' });
  await expect(apply).toBeInViewport();
  await apply.click();
  await expect(filter).toBeHidden();
  await expect(page.getByText('Không có môn học phù hợp')).toBeVisible();

  await trigger.click();
  await expect(search).toHaveValue('Không có môn này');
  if (isMobile) {
    await page.keyboard.press('Escape');
  } else {
    await page.setViewportSize({ width: 900, height: 720 });
  }
  await expect(filter).toBeHidden();
});
