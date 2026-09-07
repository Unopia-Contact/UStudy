import { describe, expect, it } from 'vitest';

import {
  ACADEMIC_YEAR_MAJOR_CATALOGS,
  getFacultiesForCohort,
  getProgramOffering,
  getProgramTuitionProfileId,
} from '../../../src/assets/data/academic-programs/registry';
import { getTuitionRates } from '../../../src/assets/data/tuition';

const TALENT_MAJOR_IDS = new Set([
  'cu-nhan-tai-nang',
  'cu-nhan-tai-nang-vat-ly-hoc',
]);

describe('academic program campus policy', () => {
  it('assigns every current program to the campus 2 tuition profile', () => {
    for (const catalog of ACADEMIC_YEAR_MAJOR_CATALOGS) {
      for (const faculty of catalog.faculties) {
        for (const major of faculty.majors) {
          expect(major.tuitionProfileId).toBe('tuition-cs2');
          expect(getProgramTuitionProfileId(faculty.id, major.id, catalog.cohortId)).toBe('tuition-cs2');
        }
      }
    }
  });

  it('keeps ordinary programs at campus 2 and talent programs at both campuses', () => {
    for (const catalog of ACADEMIC_YEAR_MAJOR_CATALOGS) {
      for (const faculty of catalog.faculties) {
        for (const major of faculty.majors) {
          expect(major.campusIds).toEqual(
            TALENT_MAJOR_IDS.has(major.id)
              ? ['cho-quan', 'dong-hoa']
              : ['dong-hoa'],
          );
        }
      }
    }
  });

  it('only exposes talent programs when filtering the catalog for campus 1', () => {
    for (const catalog of ACADEMIC_YEAR_MAJOR_CATALOGS) {
      const faculties = getFacultiesForCohort(catalog.cohortId, 'cho-quan');
      const majors = faculties.flatMap((faculty) => faculty.majors);

      expect(majors.length).toBeGreaterThan(0);
      expect(majors.every((major) => TALENT_MAJOR_IDS.has(major.id))).toBe(true);
    }
  });

  it('keeps all programs available when filtering for campus 2', () => {
    for (const catalog of ACADEMIC_YEAR_MAJOR_CATALOGS) {
      const allMajors = catalog.faculties.flatMap((faculty) => faculty.majors);
      const campusTwoMajors = getFacultiesForCohort(catalog.cohortId, 'dong-hoa')
        .flatMap((faculty) => faculty.majors);

      expect(campusTwoMajors).toHaveLength(allMajors.length);
    }
  });

  it('loads the current tuition data through the program profile', () => {
    const offering = getProgramOffering('khoa-cntt', 'cong-nghe-thong-tin', 'k24');
    expect(offering).not.toBeNull();

    const rates = getTuitionRates(
      '2025-2026',
      { facultyId: 'khoa-cntt', majorId: 'cong-nghe-thong-tin' },
      offering!.tuitionProfileId,
    );

    expect(rates.profileId).toBe('tuition-cs2');
    expect(rates.rates.CSC1).toBe(857_000);
  });
});
