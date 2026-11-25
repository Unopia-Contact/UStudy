import {
  readSecure,
  applyStorageChanges,
  encryptStorageValues,
} from '../helpers/localStorage/save';
import { buildAcademicStorageValues } from './academic-storage';
import { sameImportValue } from './import-preview';

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
  const [raw, storedCourses, storedStudent, meta] = await Promise.all([
    readSecure<any>('raw_student_db', cryptoKey, null),
    readSecure<any[]>('course_db_offline', cryptoKey, []),
    readSecure<any>('student_db_full', cryptoKey, null),
    readSecure<any>('import_meta', cryptoKey, null),
  ]);
  if (!raw) return false;
  const upgradeStudent = storedStudent?.dataSchemaVersion !== 2;
  const upgradeCourses = raw.courses?.length && !hasCampusMetadata(storedCourses);
  if (!upgradeStudent && !upgradeCourses) return false;
  const next = buildAcademicStorageValues(raw, meta);
  const updates: Record<string, unknown> = {};
  if (upgradeStudent) {
    const student = { ...storedStudent, ...next.student_db_full };
    for (const field of ['grades', 'exams', 'tuition', 'registrations', 'program', 'name', 'studentId']) {
      if (!Object.hasOwn(raw, field) && storedStudent?.[field] !== undefined) student[field] = storedStudent[field];
    }
    updates.student_db_full = student;
  }
  if (upgradeCourses && !sameImportValue(storedCourses, next.course_db_offline)) updates.course_db_offline = next.course_db_offline;
  if (!Object.keys(updates).length) return false;
  applyStorageChanges(await encryptStorageValues(updates, cryptoKey));
  return true;
}
