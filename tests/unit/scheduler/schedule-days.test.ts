import { describe, expect, it } from 'vitest';

import {
  getScheduleGridTemplate,
  getVisibleWeekDays,
  weekDays,
} from '../../../src/constants/timetable';

describe('schedule day columns', () => {
  it('keeps the default calendar at six columns when no Sunday class exists', () => {
    expect(getVisibleWeekDays([2, 4, 7]).map((day) => day.short)).toEqual([
      'T2', 'T3', 'T4', 'T5', 'T6', 'T7',
    ]);
  });

  it('appends Sunday only when the schedule contains day 8', () => {
    const visibleDays = getVisibleWeekDays([2, 8]);

    expect(visibleDays).toHaveLength(7);
    expect(visibleDays.at(-1)).toMatchObject({
      day: 8,
      label: 'Chủ nhật',
      short: 'CN',
    });
  });

  it('exposes one canonical Monday-to-Sunday ordering', () => {
    expect(weekDays.map((day) => day.day)).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it('builds grid geometry from the actual day count', () => {
    expect(getScheduleGridTemplate(64, 6)).toBe('64px repeat(6, minmax(0, 1fr))');
    expect(getScheduleGridTemplate(64, 7)).toBe('64px repeat(7, minmax(0, 1fr))');
  });
});
