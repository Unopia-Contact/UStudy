import { describe, expect, it } from 'vitest';

import {
  getCategoryCreditProgress,
  getProgramCategoryCreditProgress,
  getRequiredCredits,
} from '../../../src/features/study-plan/credit-progress';

const passedCourse = (courseId: string, credits: number) => ({
  course_id: courseId,
  course_name_vi: courseId,
  credits,
  status: 'passed' as const,
});

const uncompletedCourse = (courseId: string, credits: number) => ({
  course_id: courseId,
  course_name_vi: courseId,
  credits,
  status: 'none' as const,
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

  it('counts a foundation course once while evaluating each specialization independently', () => {
    const sharedFoundationCourse = passedCourse('MTH10001', 3);
    const categories = {
      FOUNDATION: {
        name: 'Kiến thức cơ sở ngành',
        total_credits_required: 7,
        coursesData: [
          sharedFoundationCourse,
          passedCourse('MTH10002', 4),
        ],
      },
      MAJOR: {
        name: 'Kiến thức chuyên ngành',
        total_credits_required: 4,
        breakdown: {
          MAJOR_A: {
            name: 'Chuyên ngành A',
            total_credits_required: 4,
            coursesData: [
              sharedFoundationCourse,
              passedCourse('MTH20001', 4),
            ],
          },
          MAJOR_B: {
            name: 'Chuyên ngành B',
            total_credits_required: 3,
            coursesData: [
              sharedFoundationCourse,
              passedCourse('MTH20002', 3),
            ],
          },
        },
      },
    };

    const progress = getProgramCategoryCreditProgress(categories, new Set());

    expect(progress.FOUNDATION.display).toEqual({ earnedCredits: 7, plannedCredits: 0 });
    expect(progress['MAJOR.MAJOR_A'].display).toEqual({ earnedCredits: 4, plannedCredits: 0 });
    expect(progress['MAJOR.MAJOR_B'].display).toEqual({ earnedCredits: 3, plannedCredits: 0 });
    expect(progress.MAJOR.display).toEqual({ earnedCredits: 4, plannedCredits: 0 });
  });

  it('does not mistake ordinary course groups containing the words chuyen nganh for alternative branches', () => {
    const categories = {
      MAJOR: {
        name: 'Kiến thức chuyên ngành',
        breakdown: {
          INTERNSHIP: {
            name: 'Thực tập chuyên ngành',
            coursesData: [passedCourse('BIO10001', 2)],
          },
          ELECTIVE: {
            name: 'Học phần chuyên ngành',
            coursesData: [passedCourse('BIO10002', 3)],
          },
        },
      },
    };

    expect(getProgramCategoryCreditProgress(categories, new Set()).MAJOR.display).toEqual({
      earnedCredits: 5,
      plannedCredits: 0,
    });
  });

  it('keeps supplemental course pools visible without adding them on top of the selected specialization', () => {
    const categories = {
      MAJOR: {
        name: 'Kiến thức chuyên ngành',
        breakdown: {
          MAJOR_A: {
            name: 'Chuyên ngành A',
            breakdown: {
              REQUIRED: { coursesData: [passedCourse('CHE10001', 4)] },
            },
          },
          MAJOR_B: {
            name: 'Chuyên ngành B',
            breakdown: {
              REQUIRED: { coursesData: [passedCourse('CHE10002', 3)] },
            },
          },
          FREE_ELECTIVES: {
            name: 'Danh sách học phần tự chọn',
            coursesData: [passedCourse('CHE10003', 2)],
          },
        },
      },
    };

    const progress = getProgramCategoryCreditProgress(categories, new Set());

    expect(progress.MAJOR.display).toEqual({ earnedCredits: 4, plannedCredits: 0 });
    expect(progress['MAJOR.FREE_ELECTIVES'].display).toEqual({ earnedCredits: 2, plannedCredits: 0 });
  });

  it('adds explicitly included common courses on top of the selected specialization', () => {
    const categories = {
      MAJOR: {
        name: 'Kiến thức chuyên ngành',
        total_credits_required: 8,
        breakdown: {
          MAJOR_A: {
            name: 'Chuyên ngành A',
            total_credits_required: 4,
            coursesData: [passedCourse('PHY10001', 4)],
          },
          MAJOR_B: {
            name: 'Chuyên ngành B',
            total_credits_required: 3,
            coursesData: [passedCourse('PHY10002', 3)],
          },
          HONORS_COMMON: {
            name: 'Môn tài năng chung cho tất cả chuyên ngành',
            total_credits_required: 4,
            include_in_parent_total: true,
            coursesData: [passedCourse('PHY10801', 4)],
          },
        },
      },
    };

    const progress = getProgramCategoryCreditProgress(categories, new Set());

    expect(getRequiredCredits(categories.MAJOR)).toBe(8);
    expect(progress['MAJOR.HONORS_COMMON'].display).toEqual({ earnedCredits: 4, plannedCredits: 0 });
    expect(progress.MAJOR.display).toEqual({ earnedCredits: 8, plannedCredits: 0 });
  });

  it('caps every general-education group at its required credits', () => {
    const categories = {
      GENERAL_EDUCATION: {
        name: 'Giáo dục đại cương',
        total_credits_required: 6,
        breakdown: {
          GENERAL_SOCIAL: {
            name: 'Khoa học xã hội',
            credits: 2,
            coursesData: [
              passedCourse('SOC10001', 2),
              passedCourse('SOC10002', 2),
            ],
          },
          GENERAL_IT: {
            name: 'Tin học',
            credits_required: 4,
            coursesData: [passedCourse('CSC10001', 4)],
          },
        },
      },
    };

    const progress = getProgramCategoryCreditProgress(categories, new Set());

    expect(progress['GENERAL_EDUCATION.GENERAL_SOCIAL'].display).toEqual({
      earnedCredits: 2,
      plannedCredits: 0,
    });
    expect(progress.GENERAL_EDUCATION.display).toEqual({
      earnedCredits: 6,
      plannedCredits: 0,
    });
  });

  it('uses remaining general-education credits for planned courses after earned credits', () => {
    const categories = {
      GENERAL_EDUCATION: {
        name: 'Giáo dục đại cương',
        total_credits_required: 4,
        coursesData: [
          passedCourse('SOC20001', 3),
          uncompletedCourse('SOC20002', 3),
        ],
      },
    };

    const progress = getProgramCategoryCreditProgress(categories, new Set(['SOC20002']));

    expect(progress.GENERAL_EDUCATION.display).toEqual({
      earnedCredits: 3,
      plannedCredits: 1,
    });
  });

  it('does not cap credits outside general education', () => {
    const categories = {
      FOUNDATION: {
        name: 'Kiến thức cơ sở ngành',
        total_credits_required: 4,
        coursesData: [
          passedCourse('MTH30001', 3),
          passedCourse('MTH30002', 3),
        ],
      },
    };

    expect(getProgramCategoryCreditProgress(categories, new Set()).FOUNDATION.display).toEqual({
      earnedCredits: 6,
      plannedCredits: 0,
    });
  });
});
