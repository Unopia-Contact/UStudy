import { STORAGE_KEYS } from '../config/storageKeys';
import { encryptStorageValues, readFromStorage } from '../helpers/localStorage/save';
import { processRawData } from './dataProcessor';
import { activeSemester, registrationsForSemester } from './academic-semester';
import type { ImportMetadata } from './import-metadata';

function readCurrent<T>(key: string): T | null {
  const value = readFromStorage<T | null>(key, null);
  if (value == null && localStorage.getItem(key) !== null) throw new Error('Hãy mở khóa dữ liệu hiện tại trước khi đồng bộ.');
  return value;
}

export function readAcademicBaseline(): any {
  const raw = readCurrent(STORAGE_KEYS.RAW_STUDENT_DB);
  if (raw) return raw;
  const student = readCurrent<any>(STORAGE_KEYS.STUDENT_DB);
  const courses = readCurrent<any[]>(STORAGE_KEYS.COURSE_DB_OFFLINE) ?? [];
  return recoverLegacyAcademicData(student, courses);
}

export function recoverLegacyAcademicData(student: any, courses: any[]) {
  if (!student && !courses.length) return null;
  // Older backups may contain just the two projections. Keep every recoverable
  // row, including scheduler classes for which the original Portal rows are gone.
  const tuition = Object.fromEntries(Object.entries<any>(student?.tuition ?? {})
    .filter(([, period]) => Array.isArray(period?.details))
    .map(([period, t]) => [period, { ...t, totals: { ...t.totals, totalDue: t.total ?? t.totals?.totalDue,
      fee: t.fee ?? t.totals?.fee, actualFee: t.actualFee ?? t.totals?.actualFee },
      details: t.details.map((d: any) => ({ ...d, subject: d.subject ?? '[' + d.code + '/' + (d.classId ?? '') + ']' + (d.name ?? ''),
        cost: d.cost ?? d.actualFee })) }]));
  const { source, dataSchemaVersion: _version, ...fields } = student ?? {};
  return { ...source?.additionalPortalFields, ...fields, tuition,
    courses: courses.flatMap(c => c.source?.portalRows ?? []),
    _legacyCourses: courses.filter(c => !c.source?.portalRows?.length) };
}

export function buildAcademicStorageValues(raw: Parameters<typeof processRawData>[0], meta?: ImportMetadata | null) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Dữ liệu Portal không hợp lệ.');
  const rows = Array.isArray(raw.courses) ? raw.courses : [];
  const period = activeSemester(rows, meta?.params?.class);
  const { student, courses } = processRawData({ ...raw, courses: registrationsForSemester(rows, period) });
  const ids = new Set(courses.map(course => course.id));
  const legacy = Array.isArray(raw._legacyCourses) ? raw._legacyCourses.filter(c => !ids.has(c.id)) : [];
  return { raw_student_db: raw, student_db_full: student, course_db_offline: [...courses, ...legacy] };
}

export function encryptAcademicStorageValues(values: Record<string, unknown>, meta: unknown, key: CryptoKey) {
  return encryptStorageValues({ ...values, ...(meta == null ? {} : { [STORAGE_KEYS.IMPORT_META]: meta }) }, key);
}
