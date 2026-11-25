import { expect, test } from '@playwright/test';

test('keeps both academic calendar header rows aligned while scrolling', async ({ page }) => {
  // Start before classes so the current-week auto-scroll does not compete with the test.
  await page.clock.setFixedTime(new Date('2026-08-01T12:00:00+07:00'));
  await page.addInitScript(() => {
    localStorage.setItem('department_configured', 'true');
    localStorage.setItem('selected_cohort_id', JSON.stringify('k24'));
    localStorage.setItem('selected_faculty_id', JSON.stringify('khoa-cntt'));
    localStorage.setItem('selected_major_id', JSON.stringify('cong-nghe-thong-tin'));
  });
  await page.goto('/campus/academic-calendar');
  const viewport = page.getByRole('region', { name: 'Bảng kế hoạch năm học' });
  await expect(viewport).toBeVisible();
  await expect(page.getByRole('main')).toHaveCSS('scrollbar-width', 'none');
  await expect(viewport).toHaveCSS('scrollbar-width', 'none');
  await expect(viewport).toHaveCSS('overflow-x', 'auto');
  await expect(viewport).toHaveCSS('overflow-y', 'auto');
  const geometry = () => viewport.evaluate(element => {
    const table = element.querySelector('table')!;
    const head = table.tHead!;
    const firstCell = table.tBodies[0].rows[0].cells[0];
    return {
      verticalScroll: element.scrollTop,
      horizontalScroll: element.scrollLeft,
      headerTop: head.getBoundingClientRect().top - element.getBoundingClientRect().top,
      cohortHeaderTop: head.rows[1].getBoundingClientRect().top - head.getBoundingClientRect().top,
      firstRowTop: firstCell.getBoundingClientRect().top - element.getBoundingClientRect().top,
      columnOffset: head.rows[0].cells[0].getBoundingClientRect().left - firstCell.getBoundingClientRect().left,
    };
  });

  await viewport.evaluate(element => element.scrollTo({ top: 240, left: 160, behavior: 'instant' }));
  await expect.poll(async () => (await geometry()).verticalScroll).toBeGreaterThan(200);
  const scrolled = await geometry();
  expect(scrolled.horizontalScroll).toBeGreaterThan(0);
  expect(scrolled.headerTop).toBeCloseTo(1, 0);
  expect(scrolled.cohortHeaderTop).toBeGreaterThan(0);
  expect(scrolled.firstRowTop).toBeLessThan(0);
  expect(scrolled.columnOffset).toBeCloseTo(0);
});
