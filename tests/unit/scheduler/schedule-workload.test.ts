import { describe, expect, it } from 'vitest';

import {
  resolveAcademicWorkloadRule,
  validateAcademicWorkloadRules,
  type AcademicWorkloadRule,
} from '../../../src/domain/academic-rules';
import { resolveCourseWorkload } from '../../../src/domain/schedule-workload';
import { ScheduleLogic } from '../../../src/features/visual-schedule/services/schedule-logic';
import {
  buildOpenCourseWorkloadDiagnostics,
  buildScheduleWorkloadDiagnostics,
} from '../../../src/features/visual-schedule/services/workload-diagnostics';

describe('academic workload rules', () => {
  it('applies the global ADD00031 rule regardless of program scope', () => {
    expect(resolveAcademicWorkloadRule(' add00031 ', {
      campusId: 'dong-hoa',
      cohortId: 'k24',
      facultyId: 'khoa-cntt',
      majorId: 'cong-nghe-thong-tin',
    })).toMatchObject({ mode: 'lt_plus_lab' });
  });

  it('prefers a scoped rule over a global rule', () => {
    const rules: AcademicWorkloadRule[] = [
      { id: 'global', scope: {}, courseId: 'TEST001', mode: 'lt_plus_lab', reason: 'Global' },
      { id: 'k25', scope: { cohortId: 'k25' }, courseId: 'TEST001', mode: 'separate', reason: 'K25' },
    ];

    expect(resolveAcademicWorkloadRule('TEST001', { cohortId: 'k25' }, rules)?.id).toBe('k25');
    expect(resolveAcademicWorkloadRule('TEST001', { cohortId: 'k24' }, rules)?.id).toBe('global');
    expect(validateAcademicWorkloadRules(rules)).toEqual([]);
  });

  it('rejects duplicate ids and duplicate course scopes', () => {
    const duplicate: AcademicWorkloadRule[] = [
      { id: 'same', scope: {}, courseId: 'TEST001', mode: 'separate', reason: 'One' },
      { id: 'same', scope: {}, courseId: 'test001', mode: 'lt_plus_lab', reason: 'Two' },
    ];

    expect(validateAcademicWorkloadRules(duplicate)).toEqual(expect.arrayContaining([
      expect.stringContaining('Duplicate academic workload rule id'),
      expect.stringContaining('Duplicate academic workload rule scope'),
    ]));
  });
});

describe('schedule workload resolver', () => {
  it('keeps ordinary courses separated by LT, TH, and BT', () => {
    const resolved = resolveCourseWorkload({
      courseId: 'TEST001',
      registrations: [{ courseType: 'LT' }, { courseType: 'TH' }, { courseType: 'BT' }],
      courseMeta: { theory_hours: 30, lab_hours: 20, exercise_hours: 10 },
    });

    expect(resolved.components.LT?.requiredPeriods).toBe(30);
    expect(resolved.components.TH?.requiredPeriods).toBe(20);
    expect(resolved.components.BT?.requiredPeriods).toBe(10);
  });

  it('keeps the legacy LT default when Portal omits the component type', () => {
    const resolved = resolveCourseWorkload({
      courseId: 'TEST000',
      registrations: [{ courseType: '' }],
      courseMeta: { theory_hours: 45, lab_hours: 0, exercise_hours: 0 },
    });

    expect(resolved.components.LT?.requiredPeriods).toBe(45);
    expect(resolved.warnings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'registration_type_unknown' }),
    ]));
  });

  it('combines LT and lab only for the configured academic rule', () => {
    const resolved = resolveCourseWorkload({
      courseId: 'ADD00031',
      registrations: [{ courseType: ' lt ' }],
      courseMeta: { theory_hours: 30, lab_hours: 30, exercise_hours: 0 },
    });

    expect(resolved.components.LT).toMatchObject({
      requiredPeriods: 60,
      sources: ['theory', 'lab'],
      ruleSource: 'academic_rule',
    });
  });

  it('falls back to separate components when a combined rule would double count', () => {
    const resolved = resolveCourseWorkload({
      courseId: 'ADD00031',
      registrations: [{ courseType: 'LT' }, { courseType: 'TH' }],
      courseMeta: { theory_hours: 30, lab_hours: 30 },
    });

    expect(resolved.components.LT?.requiredPeriods).toBe(30);
    expect(resolved.components.TH?.requiredPeriods).toBe(30);
    expect(resolved.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'combined_rule_conflicts_with_separate_component' }),
    ]));
  });

  it('automatically uses lab hours for an LT-only course with zero theory hours', () => {
    const resolved = resolveCourseWorkload({
      courseId: 'TEST002',
      registrations: [{ courseType: 'LT' }],
      courseMeta: { theory_hours: 0, lab_hours: 30, exercise_hours: 0 },
    });

    expect(resolved.components.LT).toMatchObject({
      requiredPeriods: 30,
      appliedMode: 'lab_as_lt',
      ruleSource: 'automatic_fallback',
    });
  });

  it('does not guess when zero-theory metadata has both lab and exercise hours', () => {
    const resolved = resolveCourseWorkload({
      courseId: 'TEST003',
      registrations: [{ courseType: 'LT' }],
      courseMeta: { theory_hours: 0, lab_hours: 30, exercise_hours: 15 },
    });

    expect(resolved.components.LT?.requiredPeriods).toBe(0);
    expect(resolved.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ambiguous_zero_theory_workload' }),
    ]));
  });

  it('lets an explicit user override win over the academic rule', () => {
    const resolved = resolveCourseWorkload({
      courseId: 'ADD00031',
      registrations: [{ courseType: 'LT' }],
      courseMeta: { theory_hours: 30, lab_hours: 30 },
      userOverride: { mode: 'custom', customHours: 45 },
    });

    expect(resolved.components.LT).toMatchObject({ requiredPeriods: 45, ruleSource: 'user' });
  });
});

describe('visual schedule workload integration', () => {
  const metadata = { params: { registration: { year: '26-27', sem: '1' } } };

  it('uses the global ADD00031 rule when calculating total weeks', () => {
    const schedule = ScheduleLogic.buildScheduleSessions(
      [{ id: 'ADD00031', name: 'Anh văn 1', classGroup: '01', courseType: 'LT', schedule: 'T2(6-9)' }],
      [{ course_id: 'ADD00031', credits: 3, theory_hours: 30, lab_hours: 30, exercise_hours: 0 }],
      metadata,
    );

    expect(schedule.sessions).toEqual([
      expect.objectContaining({ courseCode: 'ADD00031', duration: 4, totalWeeks: 15 }),
    ]);
  });

  it('aggregates multiple rows of the same component before calculating weeks', () => {
    const schedule = ScheduleLogic.buildScheduleSessions(
      [
        { id: 'ADD00031', name: 'Anh văn 1', classGroup: '01', courseType: 'LT', schedule: 'T2(6-9)' },
        { id: 'ADD00031', name: 'Anh văn 1', classGroup: '01', courseType: 'LT', schedule: 'T5(6-9)' },
      ],
      [{ course_id: 'ADD00031', credits: 3, theory_hours: 30, lab_hours: 30, exercise_hours: 0 }],
      metadata,
    );

    expect(schedule.sessions).toHaveLength(2);
    expect(schedule.sessions.every((session) => session.totalWeeks === 8)).toBe(true);
  });

  it('uses the same calculation for the workspace DSLM diagnostics', () => {
    const diagnostics = buildScheduleWorkloadDiagnostics({
      registrations: [
        { id: 'ADD00031', name: 'Anh văn 1', classGroup: '01', courseType: 'LT', schedule: 'T2(6-9)' },
      ],
      coursesMeta: [
        { course_id: 'ADD00031', course_name_vi: 'Anh văn 1', theory_hours: 30, lab_hours: 30, exercise_hours: 0 },
      ],
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({
        courseId: 'ADD00031',
        components: [expect.objectContaining({
          component: 'LT',
          requiredPeriods: 60,
          periodsPerWeek: 4,
          totalWeeks: 15,
          ruleSource: 'academic_rule',
        })],
      }),
    ]);
  });

  it('calculates each open-class option separately instead of summing alternative classes', () => {
    const component = (group: string, schedule: string) => ({
      group,
      schedule: [schedule],
      rawSchedules: [schedule],
    });
    const diagnostics = buildOpenCourseWorkloadDiagnostics({
      openCourses: [{
        id: 'ADD00031',
        name: 'Anh văn 1',
        classes: [
          { id: 'AV01', components: { theory: component('AV01', 'T2(6-9)'), practical: null, exercise: null } },
          { id: 'AV02', components: { theory: component('AV02', 'T3(6-10)'), practical: null, exercise: null } },
        ],
      }],
      coursesMeta: [
        { course_id: 'ADD00031', course_name_vi: 'Anh văn 1', theory_hours: 30, lab_hours: 30, exercise_hours: 0 },
      ],
    });

    expect(diagnostics[0]).toMatchObject({
      courseId: 'ADD00031',
      classOptions: [
        { classId: 'AV01', diagnostic: { components: [{ periodsPerWeek: 4, totalWeeks: 15 }] } },
        { classId: 'AV02', diagnostic: { components: [{ periodsPerWeek: 5, totalWeeks: 12 }] } },
      ],
      components: [{
        component: 'LT',
        requiredPeriods: [60],
        periodsPerWeek: [4, 5],
        totalWeeks: [12, 15],
      }],
    });
  });
});
