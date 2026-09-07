import {
  readSecure,
  saveSecure,
} from '../helpers/localStorage/save';
import { processOpenClasses, type RawOpenClass } from './dataProcessor';

function hasCampusMetadata(courseDatabase: unknown): boolean {
  if (!Array.isArray(courseDatabase) || courseDatabase.length === 0) return false;

  return courseDatabase.every((course) =>
    (course?.classes ?? []).every((courseClass: any) => {
      if (!Array.isArray(courseClass?.schedule) || courseClass.schedule.length === 0) return true;
      return Object.values(courseClass.components ?? {}).some((component: any) =>
        component && Object.prototype.hasOwnProperty.call(component, 'campus'),
      );
    }),
  );
}

/**
 * course_db_offline saved before campus support contains locations but no
 * per-component campus metadata. Rebuild it from the encrypted raw Portal
 * snapshot so a later default-campus change cannot alter known NVC/LT classes.
 */
export async function migrateCourseDatabaseCampusMetadata(cryptoKey: CryptoKey): Promise<boolean> {
  const [rawData, storedCourseDatabase] = await Promise.all([
    readSecure<any>('raw_student_db', cryptoKey, null),
    readSecure<unknown>('course_db_offline', cryptoKey, null),
  ]);

  if (!Array.isArray(rawData?.courses) || rawData.courses.length === 0) return false;
  if (hasCampusMetadata(storedCourseDatabase)) return false;

  const rebuiltCourseDatabase = processOpenClasses(rawData.courses as RawOpenClass[]);
  await saveSecure('course_db_offline', rebuiltCourseDatabase, cryptoKey);
  return true;
}
