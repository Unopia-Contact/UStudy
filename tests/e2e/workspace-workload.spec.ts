import { expect, test, type Page } from '@playwright/test';

test.skip(process.env.VITE_ENABLE_WORKSPACE !== 'true', 'Workspace nội bộ chỉ được bundle khi bật VITE_ENABLE_WORKSPACE.');

async function seedWorkspaceWorkload(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('department_configured', JSON.stringify(true));
    localStorage.setItem('selected_cohort_id', JSON.stringify('k24'));
    localStorage.setItem('selected_faculty_id', JSON.stringify('khoa-cntt'));
    localStorage.setItem('selected_major_id', JSON.stringify('cong-nghe-thong-tin'));
  });
  await page.goto('/privacy');
  await page.evaluate(() => {
    localStorage.setItem('student_db_full', JSON.stringify({
      registrations: [{
        id: 'CSC10001',
        name: 'Môn đã đăng ký không liên quan',
        classGroup: 'DK01',
        courseType: 'LT',
        schedule: 'T5(1-4)',
      }],
    }));
    const openCourse = (id: string, name: string, classId: string, schedule: string) => ({
      id,
      name,
      classes: [{
        id: classId,
        components: {
          theory: { group: classId, schedule: [schedule], rawSchedules: [schedule] },
          practical: null,
          exercise: null,
        },
      }],
    });
    localStorage.setItem('course_db_offline', JSON.stringify([
      openCourse('ADD00031', 'Anh văn 1', 'AV01', 'T2(6-9)'),
      openCourse('ADD00032', 'Anh văn 2', 'AV02', 'T3(6-9)'),
    ]));
    window.history.pushState({}, '', '/ad/workload');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

test('explains the current DSLM workload calculation', async ({ page }) => {
  await seedWorkspaceWorkload(page);

  await expect(page.getByRole('heading', { name: 'Cách tính môn trong DSLM hiện tại' })).toBeVisible();
  await expect(page.getByText('ADD00031 · Anh văn 1')).toBeVisible();
  await expect(page.getByText('ADD00032 · Anh văn 2')).toBeVisible();
  await expect(page.getByText('CSC10001 · Môn đã đăng ký không liên quan')).toHaveCount(0);
  const englishOne = page.getByRole('article').filter({ hasText: 'ADD00031 · Anh văn 1' });
  await expect(englishOne.getByText('LT cộng giờ TH')).toBeVisible();
  await expect(englishOne.getByText('LT + TH = 60 tiết · 4 tiết/tuần')).toBeVisible();
  await expect(englishOne.getByText('15 tuần', { exact: true })).toBeVisible();
});

test('keeps the DSLM diagnostics inside the mobile viewport', async ({ page }) => {
  await seedWorkspaceWorkload(page);
  await expect(page.getByRole('heading', { name: 'Cách tính môn trong DSLM hiện tại' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
