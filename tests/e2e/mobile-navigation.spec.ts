import { expect, test } from '@playwright/test';

test('mobile More menu traps focus and closes with Escape', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('department_configured', JSON.stringify(true));
    localStorage.setItem('selected_cohort_id', JSON.stringify('k24'));
    localStorage.setItem('selected_faculty_id', JSON.stringify('khoa-cntt'));
    localStorage.setItem('selected_major_id', JSON.stringify('cong-nghe-thong-tin'));
  });
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  const navigation = page.getByRole('navigation', { name: 'Điều hướng chính' });
  const more = page.locator('button[aria-controls="ustudy-mobile-more-menu"]');
  await expect(navigation).toBeVisible();
  await expect(more).toBeVisible();
  await expect(more).toHaveAttribute('aria-expanded', 'false');

  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  const menu = page.locator('#ustudy-mobile-more-menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Đóng menu điều hướng' })).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(menu.getByRole('link').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toBeFocused();
  await expect(menu).toHaveAttribute('aria-hidden', 'true');
});
