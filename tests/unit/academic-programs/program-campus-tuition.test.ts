import { describe, expect, it } from 'vitest';

import {
  ACADEMIC_YEAR_MAJOR_CATALOGS,
  getFacultiesForCohort,
  getProgramDataSourceCohort,
  getProgramOffering,
  getProgramTuitionProfileId,
  loadCohortData,
} from '../../../src/assets/data/academic-programs/registry';
import { getTuitionRates } from '../../../src/assets/data/tuition';

const TALENT_MAJOR_IDS = new Set([
  'cu-nhan-tai-nang',
  'cu-nhan-tai-nang-vat-ly-hoc',
]);

const CAMPUS_ONE_PROGRAMS = new Set([
  'khoa-cntt/khoa-hoc-may-tinh-tien-tien',
  'khoa-cntt/cong-nghe-thong-tin-tang-cuong-tieng-anh',
  'khoa-khoa-hoc-va-cong-nghe-vat-lieu/khoa-hoc-vat-lieu-tang-cuong-tieng-anh',
  'khoa-ly/vat-ly-hoc-tang-cuong-tieng-anh',
  'khoa-hoa/hoa-hoc-tang-cuong-tieng-anh',
  'khoa-hoa/cong-nghe-ky-thuat-hoa-hoc-tang-cuong-tieng-anh',
  'khoa-sinh/sinh-hoc-tang-cuong-tieng-anh',
  'khoa-sinh/cong-nghe-sinh-hoc-tang-cuong-tieng-anh',
  'khoa-moi-truong/khoa-hoc-moi-truong-tang-cuong-tieng-anh',
  'khoa-dien-tu-vien-thong/ky-thuat-dien-tu-vien-thong-tang-cuong-tieng-anh',
]);

describe('academic program campus policy', () => {
  it('assigns the tuition profile explicitly from each program record', () => {
    for (const catalog of ACADEMIC_YEAR_MAJOR_CATALOGS) {
      for (const faculty of catalog.faculties) {
        for (const major of faculty.majors) {
          const isCampusOneOnly = major.campusIds.length === 1 && major.campusIds[0] === 'cho-quan';
          const expectedProfileId = isCampusOneOnly ? 'tuition-cs1' : 'tuition-cs2';
          expect(major.tuitionProfileId).toBe(expectedProfileId);
          expect(getProgramTuitionProfileId(faculty.id, major.id, catalog.cohortId)).toBe(expectedProfileId);
        }
      }
    }
  });

  it('keeps K24 TCTA and advanced programs at campus 1 without changing the default policy', () => {
    for (const catalog of ACADEMIC_YEAR_MAJOR_CATALOGS) {
      for (const faculty of catalog.faculties) {
        for (const major of faculty.majors) {
          const programKey = `${faculty.id}/${major.id}`;
          expect(major.campusIds).toEqual(
            CAMPUS_ONE_PROGRAMS.has(programKey)
              ? ['cho-quan']
              : TALENT_MAJOR_IDS.has(major.id)
              ? ['cho-quan', 'dong-hoa']
              : ['dong-hoa'],
          );
        }
      }
    }
  });

  it('exposes every campus 1 program for K24, K25, and K26', () => {
    for (const cohortId of ['k24', 'k25', 'k26']) {
      const campusOnePrograms = getFacultiesForCohort(cohortId, 'cho-quan')
        .flatMap((faculty) => faculty.majors.map((major) => `${faculty.id}/${major.id}`));

      for (const programKey of CAMPUS_ONE_PROGRAMS) {
        expect(campusOnePrograms).toContain(programKey);
      }
    }
  });

  it('hides campus 1-only programs when filtering for campus 2', () => {
    for (const catalog of ACADEMIC_YEAR_MAJOR_CATALOGS) {
      const allMajors = catalog.faculties.flatMap((faculty) => faculty.majors);
      const campusTwoPrograms = getFacultiesForCohort(catalog.cohortId, 'dong-hoa')
        .flatMap((faculty) => faculty.majors.map((major) => `${faculty.id}/${major.id}`));
      const campusOneOnlyPrograms = catalog.faculties.flatMap((faculty) => faculty.majors
        .filter((major) => major.campusIds.length === 1 && major.campusIds[0] === 'cho-quan')
        .map((major) => `${faculty.id}/${major.id}`));

      expect(campusTwoPrograms).toHaveLength(allMajors.length - campusOneOnlyPrograms.length);
      for (const programKey of campusOneOnlyPrograms) {
        expect(campusTwoPrograms).not.toContain(programKey);
      }
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

  it('reuses campus 1 K24 curriculum data for K25 and K26', async () => {
    expect(getProgramDataSourceCohort('k25', 'khoa-cntt', 'khoa-hoc-may-tinh-tien-tien')).toBe('k24');
    expect(getProgramDataSourceCohort('k26', 'khoa-cntt', 'khoa-hoc-may-tinh-tien-tien')).toBe('k24');

    const data = await loadCohortData(
      'khoa-cntt',
      'khoa-hoc-may-tinh-tien-tien',
      'k25',
    );

    expect(data.courses.length).toBeGreaterThan(0);
    expect(data.categories).toBeTruthy();
    expect(data.prerequisites).toEqual([]);
  });

  it('does not substitute campus 2 prices when a campus 1 price table is unavailable', () => {
    const rates = getTuitionRates(
      '2025-2026',
      { facultyId: 'khoa-cntt', majorId: 'khoa-hoc-may-tinh-tien-tien' },
      'tuition-cs1',
    );

    expect(rates.isAvailable).toBe(false);
    expect(rates.default_price).toBe(0);
    expect(rates.rates).toEqual({});
  });
});
