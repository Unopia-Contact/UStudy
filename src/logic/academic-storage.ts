import { STORAGE_KEYS } from '../config/storageKeys';
import { encryptStorageValues } from '../helpers/localStorage/save';
import { processRawData } from './dataProcessor';

export function buildAcademicStorageValues(raw: Parameters<typeof processRawData>[0]) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Dữ liệu Portal không hợp lệ.');
  const { student, courses } = processRawData(raw);
  return {
    raw_student_db: raw,
    student_db_full: student,
    course_db_offline: courses,
  };
}

export function encryptAcademicStorageValues(
  values: Record<string, unknown>,
  meta: unknown,
  key: CryptoKey,
) {
  return encryptStorageValues({ ...values, ...(meta == null ? {} : { [STORAGE_KEYS.IMPORT_META]: meta }) }, key);
}
