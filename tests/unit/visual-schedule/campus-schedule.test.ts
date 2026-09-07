import { describe, expect, it } from 'vitest';

import { processOpenClasses, type RawOpenClass } from '../../../src/logic/dataProcessor';
import { ScheduleLogic } from '../../../src/features/visual-schedule/services/schedule-logic';
import { getOverlappingSessions } from '../../../src/features/visual-schedule/services/schedule-helpers';

function buildOpenClass(location: 'NVC' | 'LT', schedule: string): RawOpenClass {
  return {
    id: 'CSC10001',
    name: 'Môn thử nghiệm',
    className: '26CTT1',
    credits: '4',
    capacity: '100',
    enrolled: '20',
    cohort: '2026',
    schedule,
    practicalGroupRaw: '',
    exerciseGroupRaw: '',
    location,
    practicalClasses: [],
    exerciseClasses: [],
  };
}

function buildSchedule(location: 'NVC' | 'LT', schedule: string) {
  const openCourses = processOpenClasses([buildOpenClass(location, schedule)]);
  return ScheduleLogic.buildScheduleSessions(
    [{
      id: 'CSC10001',
      name: 'Môn thử nghiệm',
      classGroup: '26CTT1',
      courseType: 'LT',
      schedule,
      startWeek: '14/09/2026',
    }],
    [{ course_id: 'CSC10001', credits: 4, theory_hours: 50 }],
    { params: { registration: { year: '26-27', sem: '1' } } },
    undefined,
    [],
    openCourses,
    'dong-hoa',
  );
}

describe('campus-aware visual schedule', () => {
  it('uses Chợ Quán time after reconciling an NVC open class', () => {
    const session = buildSchedule('NVC', 'T2(3.5-5)-F202').sessions[0];

    expect(session).toMatchObject({
      campusId: 'cho-quan',
      campusSource: 'reconciled',
      isCampusFallback: false,
      startTime: '09:05',
      endTime: '11:20',
      duration: 2.5,
      session: 'morning',
    });
  });

  it('uses Đông Hòa time after reconciling an LT open class', () => {
    const session = buildSchedule('LT', 'T2(1-2.5)-F202').sessions[0];

    expect(session).toMatchObject({
      campusId: 'dong-hoa',
      campusSource: 'reconciled',
      isCampusFallback: false,
      startTime: '07:30',
      endTime: '09:35',
      duration: 2.5,
    });
  });

  it('uses Chợ Quán for an unreconciled registration with period 12', () => {
    const session = ScheduleLogic.buildScheduleSessions(
      [{
        id: 'CSC19999',
        name: 'Môn chưa đối chiếu',
        classGroup: '26CTT1',
        courseType: 'LT',
        schedule: 'T2(10-12)-NVC',
        startWeek: '14/09/2026',
      }],
      [{ course_id: 'CSC19999', credits: 4, theory_hours: 50 }],
      { params: { registration: { year: '26-27', sem: '1' } } },
      undefined,
      [],
      [],
      'dong-hoa',
    ).sessions[0];

    expect(session).toMatchObject({
      campusId: 'cho-quan',
      campusSource: 'schedule-range',
      isCampusFallback: false,
      startTime: '15:30',
      endTime: '18:00',
    });
  });

  it('detects conflicts by actual time instead of equal period numbers', () => {
    const nvcPeriod6 = buildSchedule('NVC', 'T2(6-6)-F202').sessions[0];
    const ltPeriod6 = {
      ...buildSchedule('LT', 'T2(6-6)-F202').sessions[0],
      id: 'other-lt-period-6',
      courseCode: 'CSC10002',
    };
    const nvcPeriod7 = {
      ...buildSchedule('NVC', 'T2(7-7)-F202').sessions[0],
      id: 'other-nvc-period-7',
      courseCode: 'CSC10003',
    };

    expect(getOverlappingSessions(nvcPeriod6, [nvcPeriod6, ltPeriod6])).toEqual([]);
    expect(getOverlappingSessions(ltPeriod6, [ltPeriod6, nvcPeriod7])).toEqual([nvcPeriod7]);
  });
});
