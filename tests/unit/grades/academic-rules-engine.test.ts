import { describe, expect, it } from 'vitest';

import { AcademicRulesEngine } from '../../../src/features/grades/services/academic-rules-engine';

describe('AcademicRulesEngine', () => {
  it('treats an empty Portal score as an ongoing course', () => {
    expect(AcademicRulesEngine.parseRawScore('')).toBeNull();
    expect(AcademicRulesEngine.evaluateCourseStatus(null)).toBe('ongoing');
    expect(AcademicRulesEngine.getCourseStatus('CSC10009', [
      { id: 'CSC10009', score: '' },
    ], false)).toBe('studying');
  });

  it('counts only passed, non-excluded courses toward GPA and earned credits', () => {
    expect(AcademicRulesEngine.calculateAccumulationParams('CSC10009', 4, 8, 'passed')).toEqual({
      pointsForGPA: 32,
      creditsForGPA: 4,
      earnedCredits: 4,
    });
    expect(AcademicRulesEngine.calculateAccumulationParams('CSC10009', 4, 4, 'retake')).toEqual({
      pointsForGPA: 0,
      creditsForGPA: 0,
      earnedCredits: 0,
    });
    expect(AcademicRulesEngine.calculateAccumulationParams('ADD00031', 3, 9, 'passed')).toEqual({
      pointsForGPA: 0,
      creditsForGPA: 0,
      earnedCredits: 0,
    });
    expect(AcademicRulesEngine.calculateAccumulationParams('CSC00003', 3, 9, 'passed')).toEqual({
      pointsForGPA: 0,
      creditsForGPA: 0,
      earnedCredits: 0,
    });
  });

  it('uses the latest source row when attempts do not include a semester', () => {
    const effective = AcademicRulesEngine.resolveEffectiveGrades([
      { id: 'CSC10009', score: '6.0', type: 'LT' },
      { id: 'CSC10009', score: '8.5', type: 'CT' },
    ]);

    expect(effective).toHaveLength(1);
    expect(effective[0]).toMatchObject({ id: 'CSC10009', score: '8.5', type: 'CT' });
  });

  it('counts failed non-excluded courses toward semester GPA but not earned credits', () => {
    expect(AcademicRulesEngine.calculateSemesterGPAParams('CSC10009', 4, 4)).toEqual({
      pointsForGPA: 16,
      creditsForGPA: 4,
    });
    expect(AcademicRulesEngine.calculateSemesterGPAParams('ADD00031', 3, 4)).toEqual({
      pointsForGPA: 0,
      creditsForGPA: 0,
    });

    const grades = [
      { id: 'CSC10001', name: 'Passed', credits: '4', score: '8', semester: '25-26/2', type: 'LT' },
      { id: 'CSC10002', name: 'Failed', credits: '4', score: '4', semester: '25-26/2', type: 'LT' },
    ];
    const summary = AcademicRulesEngine.calculateGPASummary(
      grades,
      AcademicRulesEngine.resolveEffectiveGrades(grades),
      false,
    );

    expect(summary.currentGPA).toBe(8);
    expect(summary.accumulatedCredits).toBe(4);
    expect(summary.gpaPerSemester[0]).toMatchObject({
      gpa: 6,
      credits: 8,
      earnedCredits: 4,
    });
  });

  it('uses the latest semester as the official attempt regardless of row order or type', () => {
    const effective = AcademicRulesEngine.resolveEffectiveGrades([
      { id: 'csc10009', score: '9.0', type: 'LT', semester: '25-26/3' },
      { id: 'CSC10009', score: '8.5', type: 'CT', semester: '24-25/2' },
      { id: 'CSC10009', score: '7.0', type: 'CT', semester: '25-26/1' },
    ]);

    expect(effective).toHaveLength(1);
    expect(effective[0]).toMatchObject({ score: '9.0', type: 'LT', semester: '25-26/3' });
    expect(AcademicRulesEngine.getCourseStatus('CSC10009', [
      { id: 'CSC10009', score: '9.0', type: 'LT', semester: '25-26/3' },
      { id: 'CSC10009', score: '4.0', type: 'CT', semester: '24-25/2' },
    ], false)).toBe('passed');
  });

  it('excludes ungraded courses from cumulative GPA and credits', () => {
    const grades = [
      { id: 'CSC10001', name: 'CSC10001 - Intro', credits: '4', score: '8', semester: '25-26/2', type: 'LT' },
      { id: 'CSC10009', name: 'CSC10009 - Database', credits: '4', score: '', semester: '25-26/3', type: 'LT' },
    ];
    const summary = AcademicRulesEngine.calculateGPASummary(
      grades,
      AcademicRulesEngine.resolveEffectiveGrades(grades),
      false,
      [],
      '25-26/3',
    );

    expect(summary.currentGPA).toBe(8);
    expect(summary.currentGPA4).toBe(3.5);
    expect(summary.accumulatedCredits).toBe(4);
    expect(summary.gpaPerSemester).toEqual([
      expect.objectContaining({ semester: '25-26/2', gpa: 8, gpa4: 3.5 }),
    ]);
    expect(summary.gradesHistory.find((course) => course.code === 'CSC10009')).toMatchObject({
      hasGrade: false,
      status: 'ongoing',
      isCurrentSemester: true,
    });
  });
});
