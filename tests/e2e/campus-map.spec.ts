import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('department_configured', JSON.stringify(true));
    localStorage.setItem('selected_cohort_id', JSON.stringify('k24'));
    localStorage.setItem('selected_faculty_id', JSON.stringify('khoa-cntt'));
    localStorage.setItem('selected_major_id', JSON.stringify('cong-nghe-thong-tin'));
  });
});

test('opens the old Dong Hoa campus drawing and drills into an interactive floor', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/campus/map');
  await expect(page.getByRole('heading', { name: 'Sơ đồ khuôn viên' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Sơ đồ khuôn viên cơ sở Đông Hòa' })).toBeVisible();
  await page.getByRole('button', { name: 'Chọn Tòa F', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sơ đồ tầng' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Sơ đồ cũ tòa F, tầng 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Chọn F101', exact: true }).click();
  await expect(page).toHaveURL(/legacyRoom=F101/);
  expect(runtimeErrors).toEqual([]);
});

test('keeps the new B4.2 deep link without inventing a floor drawing', async ({ page }) => {
  await page.goto('/campus/map?roomId=dong-hoa%2Fb4-2%2F6%2F2');
  await expect(page.getByRole('heading', { name: 'Sơ đồ tầng' })).toBeVisible();
  await expect(page.getByText('Bản đồ Đông Hòa cũ không có tòa này.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Phòng 6.2' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
