import { describe, expect, it } from 'vitest';

import { readSecure, saveSecure, setupPin } from '../../../src/helpers/localStorage/save';
import { migrateCourseDatabaseCampusMetadata } from '../../../src/logic/course-db-campus-migration';

describe('course database campus migration', () => {
  it('rebuilds pre-campus cache from the raw Portal open classes', async () => {
    const key = await setupPin('current-pin');
    const rawData = {
      courses: [{
        id: 'CSC10001',
        name: 'Môn thử nghiệm',
        className: '26CTT1',
        credits: '4',
        capacity: '100',
        enrolled: '10',
        cohort: '2026',
        schedule: 'T2(1-4)-F202',
        practicalGroupRaw: '',
        exerciseGroupRaw: '',
        location: 'NVC - Nguyễn Văn Cừ',
        practicalClasses: [],
        exerciseClasses: [],
      }],
    };
    const legacyCache = [{
      id: 'CSC10001',
      classes: [{ id: '26CTT1', schedule: ['T2(1-4)'], components: { theory: { locations: ['NVC'] } } }],
    }];

    await saveSecure('raw_student_db', rawData, key);
    await saveSecure('course_db_offline', legacyCache, key);

    await expect(migrateCourseDatabaseCampusMetadata(key)).resolves.toBe(true);
    const rebuilt = await readSecure<any[]>('course_db_offline', key, []);

    expect(rebuilt[0].classes[0].components.theory.campus).toMatchObject({
      status: 'matched',
      campusId: 'cho-quan',
    });
    await expect(migrateCourseDatabaseCampusMetadata(key)).resolves.toBe(false);
  });
});
