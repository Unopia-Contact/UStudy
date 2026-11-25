import { expect, test } from '@playwright/test';

test('creates a group, edits preferences, solves and saves a schedule', async ({ page, isMobile, context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('department_configured', 'true');
    localStorage.setItem('course_db_offline', JSON.stringify([{
      id: 'CSC12005',
      name: 'Phát triển ứng dụng hệ thống thông tin hiện đại',
      credits: 3,
      classes: Array.from({ length: 7 }, (_, index) => ({ id: `TEST_${index + 1}`, schedule: ['T7 (1-4)'] })),
    }]));
  });
  await page.goto('/dashboard');
  await expect(page.getByRole('main')).toBeVisible();
  await page.evaluate(() => window.postMessage({
    type: 'IMPORT_FULL_DATA', labSource: 'empty-bookmarklet',
    payload: { raw: { name: 'Sinh viên thử lịch', studentId: 'group-fixture', grades: [{ id: 'TEST101', semester: '26-27/1', score: '8' }] } },
  }, location.origin));
  await page.getByRole('button', { name: /^Nhập \d+ thay đổi$/ }).click();
  await page.getByPlaceholder('Nhập mật khẩu...').fill('group-fixture');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByPlaceholder('Xác nhận mật khẩu...').fill('group-fixture');
  await page.getByRole('button', { name: 'Hoàn tất thiết lập' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('student_db_full'))).not.toBeNull();
  await page.goto('/study-roadmap/calendar');
  await page.getByPlaceholder('Nhập mật khẩu...').fill('group-fixture');
  await page.getByRole('button', { name: 'Mở khóa', exact: true }).click();
  const toolbar = page.getByRole('group', { name: 'Thanh xếp lịch' });
  const personalMode = toolbar.getByRole('button', { name: 'Cá nhân', exact: true });
  const groupMode = toolbar.getByRole('button', { name: 'Nhóm', exact: true });
  await expect(personalMode).toHaveAttribute('aria-pressed', 'true');
  await expect(toolbar).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(toolbar).toHaveCSS('border-top-width', '1px');
  const personalBasket = await page.evaluate(() => localStorage.getItem('selected_courses_basket'));
  await groupMode.click();
  await expect(groupMode).toHaveAttribute('aria-pressed', 'true');
  await expect(toolbar).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByLabel('Tên hiển thị').fill('An');
  await page.getByRole('textbox', { name: 'Tìm môn học' }).fill('CSC12005');
  await page.getByRole('button', { name: /^Thêm CSC12005/ }).click();
  await page.getByRole('button', { name: 'Tạo liên kết nhóm' }).click();
  await expect(page.getByRole('button', { name: 'Sao chép liên kết' })).toBeVisible();
  await expect(page.getByLabel('Tên hiển thị')).toBeHidden();
  await page.getByRole('button', { name: 'Thêm thành viên', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Thêm thành viên' })).toBeFocused();
  await dialog.getByLabel('Tên hiển thị').fill('Bình');
  const courseSearch = dialog.getByRole('textbox', { name: 'Tìm môn học' });
  await courseSearch.fill('CSC12005');
  await courseSearch.press('Enter');
  await dialog.getByRole('button', { name: 'Thêm vào nhóm' }).click();
  await expect(page.getByRole('button', { name: /Bình.*1 môn/ })).toBeVisible();
  await page.getByRole('button', { name: /Bình.*1 môn/ }).click();
  await expect(dialog.getByRole('heading', { name: 'Chỉnh sửa thành viên' })).toBeFocused();
  await expect(dialog.getByLabel('Tên hiển thị')).not.toBeFocused();
  await expect(courseSearch).not.toBeFocused();
  await dialog.getByRole('button', { name: 'Xóa môn CSC12005' }).click();
  await expect(dialog.getByRole('heading', { name: 'Môn đã chọn (0)' })).toBeVisible();
  await courseSearch.fill('tuong tac nguoi');
  await dialog.getByRole('button', { name: /^Thêm CSC12106/ }).click();
  await courseSearch.fill('CSC12106');
  await expect(dialog.getByText('Môn này đã có trong danh sách.')).toBeVisible();
  await courseSearch.fill('khoa');
  const searchResults = dialog.getByRole('group', { name: 'Kết quả tìm môn' });
  await expect(searchResults.getByRole('button', { name: /^Thêm CSC14008/ })).toBeVisible();
  await expect(searchResults).toHaveCSS('border-top-width', '1px');
  await expect(dialog.getByRole('list', { name: 'Môn đã chọn', exact: true })).toContainText('CSC12106');
  await page.screenshot({ path: test.info().outputPath('member-course-search.png') });
  await courseSearch.fill('CSC12005');
  await courseSearch.press('Enter');
  await expect(searchResults).toBeHidden();
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole('heading', { name: 'Môn đã chọn (2)' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('member-editor.png') });
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('button', { name: /Bình.*2 môn/ })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('selected_courses_basket'))).toEqual(personalBasket);
  // Give both members a course without class data to exercise the sharing-only menu.
  for (const name of ['An', 'Bình']) {
    await page.getByRole('button', { name: new RegExp(`^${name}.*môn`) }).click();
    await courseSearch.fill('TEST90001');
    await courseSearch.press('Enter');
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  }
  await page.screenshot({ path: test.info().outputPath('step-1.png') });
  if (isMobile) await page.getByLabel('Bước xếp lịch nhóm').selectOption('2');
  else await page.getByRole('button', { name: 'Bước 2: Ưu tiên' }).click();
  await expect(page.getByText('Chiến thuật xếp lịch', { exact: true })).toBeHidden();
  await page.screenshot({ path: test.info().outputPath('step-2.png') });
  await page.getByText('Tùy chỉnh thêm', { exact: true }).click();
  await page.getByRole('button', { name: 'Trải đều', exact: true }).click();
  await page.getByRole('button', { name: /CSC12005.*2 người/ }).click();
  await expect(dialog.getByRole('button', { name: /^Ưu tiên lớp/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Học cùng nhau/ })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('course-preferences-both.png') });
  await dialog.getByRole('button', { name: /^Học cùng nhau/ }).click();
  await expect(dialog).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Ưu tiên cùng lớp', exact: true }).click();
  await dialog.getByRole('button', { name: 'Quay lại' }).click();
  await expect(dialog.getByRole('button', { name: /^Học cùng nhau/ })).toContainText('Ưu tiên cùng lớp');
  await dialog.getByRole('button', { name: /^Học cùng nhau/ }).click();
  await dialog.getByRole('button', { name: 'Bắt buộc cùng lớp', exact: true }).click();
  await dialog.getByRole('button', { name: 'Quay lại' }).click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /CSC12106.*1 người/ }).click();
  await expect(dialog.getByRole('button', { name: /^Ưu tiên lớp/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Học cùng nhau/ })).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('course-preferences-class.png') });
  await dialog.getByRole('button', { name: /^Ưu tiên lớp/ }).click();
  await dialog.getByRole('button', { name: 'Ưu tiên', exact: true }).first().click();
  await dialog.getByRole('button', { name: 'Quay lại' }).click();
  await expect(dialog.getByRole('button', { name: /^Ưu tiên lớp/ })).toContainText('1 lớp ưu tiên');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /TEST90001.*2 người/ }).click();
  await expect(dialog.getByText('TEST90001', { exact: true })).toHaveCount(1);
  await expect(dialog.getByRole('button', { name: /^Học cùng nhau/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Ưu tiên lớp/ })).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('course-preferences-sharing.png') });
  await page.keyboard.press('Escape');
  await page.getByText('Tùy chỉnh thêm', { exact: true }).click();
  await expect(page.getByText(/^Trải đều · \d+ môn có ưu tiên riêng$/)).toBeVisible();
  // Hold worker startup so even a fast fixture exercises cancellation and immediate retry.
  let releaseWorker!: () => void;
  const startup = new Promise<void>(resolve => { releaseWorker = resolve; });
  const workerScript = '**/group-scheduler.worker-*.js';
  await page.route(workerScript, async route => { await startup; await route.continue().catch(() => {}); });
  await page.getByRole('button', { name: 'Xếp lịch nhóm', exact: true }).click();
  try {
    await page.getByRole('button', { name: 'Dừng xếp lịch' }).click();
    await expect(page.getByRole('heading', { name: 'Ưu tiên của nhóm' })).toBeVisible();
  } finally {
    releaseWorker();
    await page.unroute(workerScript);
  }
  await page.getByRole('button', { name: 'Xếp lịch nhóm', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Lịch của An/ })).toBeVisible();
  const options = page.getByRole('group', { name: 'Các phương án lịch' });
  const viewMode = page.getByRole('button', { name: 'Cách xem', exact: true });
  const memberSelect = page.getByRole('button', { name: 'Chọn thành viên để xem lịch' });
  await expect(memberSelect).toBeVisible();
  await expect(options.getByRole('button', { name: 'Phương án 1', exact: true })).toHaveAttribute('aria-current', 'true');
  await expect(options.getByRole('button', { name: 'Phương án trước' })).toBeDisabled();
  await options.getByRole('button', { name: 'Tiến 5 phương án' }).click();
  await expect(options.getByRole('button', { name: 'Phương án 6', exact: true })).toHaveAttribute('aria-current', 'true');
  await options.getByRole('button', { name: 'Phương án tiếp theo' }).click();
  await expect(options.getByRole('button', { name: 'Phương án 7', exact: true })).toHaveAttribute('aria-current', 'true');
  await expect(options.getByRole('button', { name: 'Tiến 5 phương án' })).toBeDisabled();
  await viewMode.click();
  await page.getByRole('option', { name: 'Theo môn' }).click();
  await expect(viewMode).toContainText('Theo môn');
  await expect(memberSelect).toHaveCount(0);
  await expect(options.getByRole('button', { name: 'Phương án 7', exact: true })).toHaveAttribute('aria-current', 'true');
  await options.getByRole('button', { name: 'Lùi 5 phương án' }).click();
  await options.getByRole('button', { name: 'Phương án 1', exact: true }).click();
  await viewMode.click();
  await page.getByRole('option', { name: 'Theo thành viên' }).click();
  await expect(viewMode).toContainText('Theo thành viên');
  await viewMode.click();
  await page.getByRole('option', { name: 'Tổng quát' }).click();
  await expect(page.getByRole('heading', { name: /Lịch của An/ })).toBeVisible();
  await expect(options.getByRole('button', { name: 'Phương án 1', exact: true })).toHaveAttribute('aria-current', 'true');
  await page.screenshot({ path: test.info().outputPath('step-3.png') });
  await page.getByRole('button', { name: 'Tùy chọn lịch nhóm' }).click();
  await expect(page.getByRole('option', { name: 'Tạo ảnh tùy chỉnh' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Lưu lịch', exact: true }).click();
  await dialog.getByLabel('Tên gợi nhớ').fill('Lịch thử');
  await dialog.getByRole('button', { name: 'Lưu lịch', exact: true }).click();
  await expect(page.getByText(/Đã lưu lịch nhóm/)).toBeVisible();
  await personalMode.click();
  await expect(personalMode).toHaveAttribute('aria-pressed', 'true');
  await expect(toolbar).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(toolbar).toHaveCSS('border-top-width', '1px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await groupMode.click();
  await expect(page.getByRole('heading', { name: /Lịch của An/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // Older persisted results can contain hundreds of options.
  await page.evaluate(() => {
    const key = 'group_schedule_last_result';
    const stored = JSON.parse(localStorage.getItem(key)!);
    const example = stored.result.solutions[0];
    stored.result.solutions = Array.from({ length: 154 }, (_, index) => ({ ...example, option: index + 1 }));
    localStorage.setItem(key, JSON.stringify(stored));
  });
  await page.reload();
  await page.getByPlaceholder('Nhập mật khẩu...').fill('group-fixture');
  await page.getByRole('button', { name: 'Mở khóa', exact: true }).click();
  await page.getByRole('button', { name: 'Phương án 1/154' }).click();
  const jumpField = page.getByRole('textbox', { name: 'Số phương án' });
  await expect(jumpField).toBeFocused();
  await expect(jumpField).toHaveAttribute('inputmode', 'numeric');
  await jumpField.fill('155');
  await page.getByRole('button', { name: 'Đi tới', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Nhập từ 1 đến 154' })).toBeVisible();
  await jumpField.fill('120');
  if (isMobile) await page.getByRole('button', { name: 'Đi tới', exact: true }).click();
  else await jumpField.press('Enter');
  await expect(jumpField).toBeHidden();
  await expect(page.getByRole('button', { name: 'Phương án 120/154' })).toBeVisible();
  await expect(options.getByRole('button', { name: 'Phương án 120', exact: true })).toHaveAttribute('aria-current', 'true');
  await page.screenshot({ path: test.info().outputPath('step-3-jump-120.png') });
});
