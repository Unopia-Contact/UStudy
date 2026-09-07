import { describe, expect, it } from 'vitest';

import { processOpenClasses, type RawOpenClass } from '../../../src/logic/dataProcessor';
import { resolveRegistrations } from '../../../src/logic/scheduler/RegistrationResolver';

function openClass(overrides: Partial<RawOpenClass> = {}): RawOpenClass {
  return {
    id: 'CSC10001',
    name: 'Môn thử nghiệm',
    className: '26CTT1',
    credits: '4',
    capacity: '100',
    enrolled: '20',
    cohort: '2026',
    schedule: 'T2(1-4)-F202',
    practicalGroupRaw: '',
    exerciseGroupRaw: '',
    location: 'NVC',
    practicalClasses: [],
    exerciseClasses: [],
    ...overrides,
  };
}

describe('open class campus metadata', () => {
  it('preserves the DSLM campus on each theory meeting', () => {
    const [course] = processOpenClasses([openClass()]);
    const theory = course.classes[0].components.theory;

    expect(theory.campus).toMatchObject({
      status: 'matched',
      campusId: 'cho-quan',
      source: 'open-class',
    });
    expect(theory.meetings[0]).toMatchObject({
      rawSchedule: 'T2(1-4)-F202',
      locations: ['NVC'],
      campus: { status: 'matched', campusId: 'cho-quan' },
    });
  });

  it('resolves TH campus from MaDiaDiem without confusing it with a room', () => {
    const [course] = processOpenClasses([openClass({
      location: 'LT',
      practicalGroupRaw: '1',
      practicalClasses: [{
        MaLopMoTH: '10',
        Nhom: '1',
        MaDiaDiem: 'NVC',
        DiaDiem: 'F202',
        LichHoc: 'T3(1-4)-F202',
      }],
    })]);
    const selectedClass = course.classes[0];

    expect(selectedClass.components.theory.campus).toMatchObject({ campusId: 'dong-hoa' });
    expect(selectedClass.components.practical?.campus).toMatchObject({ campusId: 'cho-quan' });
  });

  it('reconciles registration campus from its matching open class component', () => {
    const courses = processOpenClasses([openClass({ location: 'NVC' })]);
    const [registration] = resolveRegistrations([{
      id: 'CSC10001',
      name: 'Môn thử nghiệm',
      classGroup: '26CTT1',
      courseType: 'LT',
      schedule: 'T2(1-4)-F202',
    }], { openCourses: courses });

    expect(registration.components[0].campus?.detection).toMatchObject({
      status: 'matched',
      campusId: 'cho-quan',
      source: 'reconciled',
      confidence: 'strong',
    });
  });

  it('uses schedule compatibility when registration campus cannot be reconciled', () => {
    const [registration] = resolveRegistrations([{
      id: 'CSC19999',
      name: 'Môn tại Chợ Quán',
      courseType: 'LT',
      schedule: 'T2(10-12)-NVC',
    }], { defaultCampusId: 'dong-hoa' });

    expect(registration.components[0].campus?.detection).toMatchObject({
      status: 'matched',
      campusId: 'cho-quan',
      source: 'schedule-range',
    });
    expect(registration.scheduleMask.some((part) => part !== 0)).toBe(true);
  });
});
