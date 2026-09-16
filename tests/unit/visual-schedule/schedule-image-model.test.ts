import { describe, expect, it } from 'vitest';
import { buildBasicTable, constrainRect, dayLabel, fromClassSections, fromScheduleSessions, groupLessons, resizeOverlayRect, surfaceOpacityFromTransparency } from '../../../src/features/schedule-image/schedule-image-model';
import type { ClassSection } from '../../../src/types';
import type { ScheduleSession } from '../../../src/features/visual-schedule/types';

describe('schedule image model', () => {
  it('keeps surface transparency within 0–100% while mapping to opacity', () => {
    expect(surfaceOpacityFromTransparency(0)).toBe(1);
    expect(surfaceOpacityFromTransparency(50)).toBe(0.5);
    expect(surfaceOpacityFromTransparency(100)).toBe(0);
    expect(surfaceOpacityFromTransparency(-10)).toBe(1);
    expect(surfaceOpacityFromTransparency(120)).toBe(0);
  });
  it('includes Sunday and sorts lessons within each day', () => {
    const base: ClassSection = {
      id: 'a', courseCode: 'MTH100', courseName: 'Math', courseNameVi: 'Toán', sectionNumber: '01',
      lecturer: '', room: 'A101', day: 8, startPeriod: 6, endPeriod: 9, color: '#004A98', isConfirmed: true, credits: 3,
    };
    const lessons = fromClassSections([{ ...base, id: 'b', startPeriod: 1 }, base, { ...base, id: 'c', day: 2 }]);
    expect(groupLessons(lessons).map((group) => group.day)).toEqual([2, 8]);
    expect(groupLessons(lessons)[1].lessons.map((lesson) => lesson.id)).toEqual(['b', 'a']);
    expect(dayLabel(8)).toBe('Chủ nhật');
    expect(lessons[0]).toMatchObject({ course: 'Toán', time: 'Tiết 1–9', room: 'A101' });
  });

  it('preserves resolved times from actual weekly timetable', () => {
    const session = {
      id: 'lt-1', courseCode: 'CSC100', courseName: 'Tin học', classCode: '01', room: 'D207',
      dayOfWeek: 3, startPeriod: 6, endPeriod: 9, startTime: '12:30', endTime: '15:50', color: '#004A98',
    } as ScheduleSession;
    expect(fromScheduleSessions([session])[0]).toMatchObject({ day: 3, time: '12:30–15:50', room: 'D207' });
  });

  it('keeps the overlay inside the exported canvas', () => {
    expect(constrainRect({ x: 85, y: -10, width: 40, height: 120 })).toEqual({ x: 60, y: 0, width: 40, height: 100 });
    expect(constrainRect({ x: 90, y: 90, width: 5, height: 5 })).toEqual({ x: 70, y: 80, width: 30, height: 20 });
  });

  it('resizes from the dragged edge while preserving the opposite edge', () => {
    const rect = { x: 10, y: 20, width: 60, height: 50 };
    expect(resizeOverlayRect(rect, 'nw', 10, 5)).toEqual({ x: 20, y: 25, width: 50, height: 45 });
    expect(resizeOverlayRect(rect, 'e', 15, 0)).toEqual({ x: 10, y: 20, width: 75, height: 50 });
    expect(resizeOverlayRect(rect, 's', 0, -20)).toEqual({ x: 10, y: 20, width: 60, height: 30 });
    expect(resizeOverlayRect(rect, 'sw', 100, 100)).toEqual({ x: 40, y: 20, width: 30, height: 80 });
  });

  it('builds the monochrome table with a period axis and conditional Sunday', () => {
    const base = { id: 'a', day: 2, startPeriod: 6, endPeriod: 9, time: '12:30–15:50', course: 'Toán', code: 'MTH100', classCode: '01', room: 'A101', color: '#004A98' };
    const table = buildBasicTable([base, { ...base, id: 'b', startPeriod: 7, endPeriod: 8 }, { ...base, id: 'c', day: 8, startPeriod: 1, endPeriod: 3.5 }]);
    expect(table.days.map((day) => day.day)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(table.periods).toHaveLength(10);
    expect(table.placements).toMatchObject([
      { rowStart: 6, rowSpan: 4, lane: 0, laneCount: 2 },
      { rowStart: 7, rowSpan: 2, lane: 1, laneCount: 2 },
      { rowStart: 1, rowSpan: 4, lane: 0, laneCount: 1 },
    ]);
    expect(table.emptyCells).not.toContainEqual({ dayIndex: 0, period: 6 });
    expect(table.emptyCells).not.toContainEqual({ dayIndex: 0, period: 8 });
    expect(table.emptyCells).not.toContainEqual({ dayIndex: 6, period: 4 });
    expect(table.emptyCells).toContainEqual({ dayIndex: 0, period: 5 });
    expect(table.emptyCells).toContainEqual({ dayIndex: 0, period: 10 });
    expect(table.emptyCells).toContainEqual({ dayIndex: 6, period: 5 });
    expect(buildBasicTable([base]).days).toHaveLength(6);
    expect(buildBasicTable([{ ...base, endPeriod: 14 }]).periods).toHaveLength(14);
  });
});
