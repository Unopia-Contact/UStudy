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

test('keeps CS2 overview while building and floor controls come from inventory', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This test uses the desktop building panel.');
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/campus/map', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Sơ đồ khuôn viên' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Danh sách tòa' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Sơ đồ khuôn viên cơ sở Đông Hòa' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chọn Tòa F', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Chọn Nhà điều hành', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nhà điều hành' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Sơ đồ khuôn viên cơ sở Đông Hòa' })).toBeVisible();
  const floor = page.getByRole('button', { name: 'Tầng 2', exact: true });
  await floor.click();
  await expect(floor).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('img', { name: 'Sơ đồ khuôn viên cơ sở Đông Hòa' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tầng này chưa có sơ đồ' })).toBeDisabled();
  expect(runtimeErrors).toEqual([]);
});

test('keeps the new B4.2 deep link without inventing a floor drawing', async ({ page, isMobile }) => {
  await page.goto('/campus/map?roomId=dong-hoa%2Fb4-2%2F6%2F2', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Sơ đồ Tòa B4.2 · Tầng 6' })).toBeVisible();
  await expect(page.getByText('Chưa có sơ đồ tầng')).toBeVisible();
  if (isMobile) {
    await expect(page.getByRole('button', { name: 'Chọn phòng' })).toHaveText('6.2');
  } else {
    await expect(page.getByRole('button', { name: 'Phòng 6.2' })).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
