import { describe, expect, it } from 'vitest';

import { getCategoryCreditProgress } from '../../../src/features/study-plan/credit-progress';

const passedCourse = (courseId: string, credits: number) => ({
  course_id: courseId,
  course_name_vi: courseId,
  credits,
  status: 'passed' as const,
});

describe('getCategoryCreditProgress', () => {
  it('counts CSC00003 in its own group but not in General Education', () => {
    const informationTechnology = {
      name: 'Tin học cơ sở',
      credits: 3,
      coursesData: [passedCourse('CSC00003', 3)],
    };
    const generalEducation = {
      name: 'Giáo dục đại cương',
      breakdown: {
        GENERAL_IT: informationTechnology,
        GENERAL_OTHER: {
          name: 'Kiến thức chung',
          credits: 4,
          coursesData: [passedCourse('BAA00001', 4)],
        },
      },
    };

    expect(getCategoryCreditProgress(informationTechnology, new Set())).toEqual({
      earnedCredits: 3,
      plannedCredits: 0,
    });
    expect(getCategoryCreditProgress(generalEducation, new Set())).toEqual({
      earnedCredits: 4,
      plannedCredits: 0,
    });
  });
});
