import { describe, expect, it } from 'vitest';

import { interpolateCalendarTemplate, sanitizeCalendarFileName } from '../../../src/features/calendar-export';

describe('shared calendar export helpers', () => {
  it('replaces only supported template-shaped tokens', () => {
    expect(interpolateCalendarTemplate(
      '{courseCode} - {courseName} - {missing}',
      { courseCode: 'CSC10009', courseName: 'Cơ sở dữ liệu' },
    )).toBe('CSC10009 - Cơ sở dữ liệu -');
  });

  it('creates a portable ASCII ics file name', () => {
    expect(sanitizeCalendarFileName('Lịch thi - Học kỳ 1, 2026-2027.ics'))
      .toBe('Lich-thi-Hoc-ky-1-2026-2027.ics');
  });
});
