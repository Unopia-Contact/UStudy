import { describe, expect, it } from 'vitest';

import {
  buildScheduleAxis,
  getScheduleAxisBreakLabel,
  getScheduleAxisPosition,
} from '../../../src/components/schedule/schedule-axis';
import { getConflicts } from '../../../src/logic/ScheduleValidator';
import type { ClassSection } from '../../../src/types';

function section(overrides: Partial<ClassSection>): ClassSection {
  return {
    id: 'section',
    courseCode: 'CSC00000',
    courseName: 'Môn kiểm thử',
    courseNameVi: 'Môn kiểm thử',
    sectionNumber: '01',
    lecturer: '',
    room: '',
    day: 2,
    startPeriod: 1,
    endPeriod: 1,
    color: '#004A98',
    isConfirmed: false,
    credits: 3,
    ...overrides,
  };
}

describe('schedule axis', () => {
  it('uses the default campus periods for an empty schedule', () => {
    const axis = buildScheduleAxis([], 'cho-quan');

    expect(axis).toMatchObject({ mode: 'period', campusId: 'cho-quan', maxPeriod: 12 });
    expect(axis.rows.some((row) => row.kind === 'break' && row.afterPeriod === 6)).toBe(true);
  });

  it('shows CS2 with ten periods and its lunch break', () => {
    const axis = buildScheduleAxis([
      { campusId: 'dong-hoa', startPeriod: 1, endPeriod: 4 },
    ], 'cho-quan');

    expect(axis).toMatchObject({ mode: 'period', campusId: 'dong-hoa', maxPeriod: 10 });
    const lunch = axis.rows.find((row) => row.kind === 'break');
    expect(lunch && getScheduleAxisBreakLabel(lunch)).toBe('Nghỉ trưa 11:50–12:40');
  });

  it('reveals the CS1 evening only when a visible class reaches it', () => {
    const daytimeAxis = buildScheduleAxis([
      { campusId: 'cho-quan', startPeriod: 7, endPeriod: 12 },
    ]);
    const eveningAxis = buildScheduleAxis([
      { campusId: 'cho-quan', startPeriod: 12, endPeriod: 12.5 },
    ]);

    expect(daytimeAxis).toMatchObject({ mode: 'period', maxPeriod: 12 });
    expect(eveningAxis).toMatchObject({ mode: 'period', maxPeriod: 15 });
  });

  it('switches to real clock time when both campuses are visible', () => {
    const axis = buildScheduleAxis([
      { campusId: 'cho-quan', startPeriod: 1, endPeriod: 1 },
      { campusId: 'dong-hoa', startPeriod: 1, endPeriod: 1 },
    ]);

    expect(axis).toMatchObject({ mode: 'time', campusIds: ['cho-quan', 'dong-hoa'] });
    expect(getScheduleAxisPosition({ campusId: 'cho-quan', startPeriod: 1, endPeriod: 1 }, axis)).toEqual({ top: 0, height: 60 });
    expect(getScheduleAxisPosition({ campusId: 'dong-hoa', startPeriod: 1, endPeriod: 1 }, axis)).toEqual({ top: 36, height: 60 });
  });

  it('positions half periods and the lunch break without changing their meaning', () => {
    const axis = buildScheduleAxis([
      { campusId: 'dong-hoa', startPeriod: 1, endPeriod: 2.5 },
    ]);

    expect(getScheduleAxisPosition({ campusId: 'dong-hoa', startPeriod: 1, endPeriod: 2.5 }, axis)).toEqual({ top: 0, height: 130 });
    expect(getScheduleAxisPosition({ campusId: 'dong-hoa', startPeriod: 3.5, endPeriod: 5 }, axis)).toEqual({ top: 130, height: 130 });
    expect(getScheduleAxisPosition({ campusId: 'dong-hoa', startPeriod: 5, endPeriod: 6 }, axis)).toEqual({ top: 208, height: 132 });
  });

  it('continues to detect conflicts by real clock time across campuses', () => {
    const cs1 = section({ id: 'cs1', campusId: 'cho-quan', startPeriod: 6, endPeriod: 6 });
    const cs2 = section({ id: 'cs2', campusId: 'dong-hoa', startPeriod: 5, endPeriod: 5 });

    expect(getConflicts(cs1, [cs1, cs2])).toEqual([cs2]);
  });
});
