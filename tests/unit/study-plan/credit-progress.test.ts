import { describe, expect, it } from 'vitest';

import { getCategoryCreditProgress } from '../../../src/features/study-plan/credit-progress';

const passedCourse = (courseId: string, credits: number) => ({
  course_id: courseId,
  course_name_vi: courseId,
  credits,
  status: 'passed' as const,
});

describe('getCategoryCreditProgress', () => {
  it('excludes only CSC00003 from the parent while preserving other IT credits', () => {
    const informationTechnology = {
      name: 'Tin học',
      credits: 7,
      coursesData: [
        passedCourse('CSC00003', 3),
        passedCourse('CSC10001', 4),
      ],
    };
    const generalEducation = {
      name: 'Giáo dục đại cương',
      breakdown: {
        GENERAL_IT: informationTechnology,
        GENERAL_OTHER: {
          name: 'Kiến thức chung',
          credits: 2,
          coursesData: [passedCourse('BAA00001', 2)],
        },
      },
    };

    expect(getCategoryCreditProgress(informationTechnology, new Set())).toEqual({
      earnedCredits: 7,
      plannedCredits: 0,
    });
    expect(getCategoryCreditProgress(generalEducation, new Set())).toEqual({
      earnedCredits: 6,
      plannedCredits: 0,
    });
  });
});
