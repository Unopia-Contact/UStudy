import { CACHE_POPULATED_EVENT } from '../context/CryptoContext';
import {
  markImportRollbackSourcesRestored,
  populateSecureCache,
  readFromStorage,
  readImportRollbackValue,
  withStorageMutation,
} from '../helpers/localStorage/save';
import { STORAGE_KEYS } from '../config/storageKeys';
import { buildAcademicStorageValues, encryptAcademicStorageValues, recoverLegacyAcademicData } from './academic-storage';
import { PORTAL_SOURCE_BY_PARAM, type ImportMetadata, type PortalDataSource } from './import-metadata';
import { assertSameStudent } from './import-preview';

const EMPTY_SOURCE_DATA: Record<PortalDataSource, unknown> = {
  profile: {},
  grades: [],
  registrations: [],
  exams: { midterm: [], final: [] },
  courses: [],
  tuition: {},
};

const PARAM_KEY_BY_SOURCE = Object.fromEntries(
  Object.entries(PORTAL_SOURCE_BY_PARAM).map(([key, source]) => [source, key]),
) as Partial<Record<PortalDataSource, string>>;

export async function restoreImportSources(sources: readonly PortalDataSource[], cryptoKey: CryptoKey): Promise<void> {
  if (sources.length === 0) return;

  await withStorageMutation(async () => {
    const currentRaw = readFromStorage<any>(STORAGE_KEYS.RAW_STUDENT_DB, null);
    if (!currentRaw || typeof currentRaw !== 'object' || Array.isArray(currentRaw)) {
      throw new Error('Không đọc được dữ liệu Portal hiện tại.');
    }
    let previousRaw = await readImportRollbackValue<any>(STORAGE_KEYS.RAW_STUDENT_DB, cryptoKey, undefined);
    if (previousRaw === undefined) {
      const student = await readImportRollbackValue(STORAGE_KEYS.STUDENT_DB, cryptoKey, null);
      const courses = await readImportRollbackValue<any[]>(STORAGE_KEYS.COURSE_DB_OFFLINE, cryptoKey, []);
      previousRaw = recoverLegacyAcademicData(student, courses) ?? undefined;
    }
    if (previousRaw !== undefined && (!previousRaw || typeof previousRaw !== 'object' || Array.isArray(previousRaw))) {
      throw new Error('Dữ liệu Portal trong điểm hoàn tác không hợp lệ.');
    }
    assertSameStudent(previousRaw, currentRaw);
    const currentMeta = readFromStorage<ImportMetadata | null>(STORAGE_KEYS.IMPORT_META, null);
    if (!currentMeta && localStorage.getItem(STORAGE_KEYS.IMPORT_META) !== null) {
      throw new Error('Không đọc được thông tin học kỳ hiện tại.');
    }
    const previousMeta = await readImportRollbackValue<ImportMetadata | null>(STORAGE_KEYS.IMPORT_META, cryptoKey, null);
    const nextRaw = { ...currentRaw };

    for (const source of sources) {
      if (source === 'profile') {
        const academic = new Set(['grades', 'registrations', 'exams', 'courses', 'tuition', '_legacyCourses']);
        for (const key of Object.keys(nextRaw)) if (!academic.has(key)) delete nextRaw[key];
        for (const [key, value] of Object.entries(previousRaw ?? {})) if (!academic.has(key)) nextRaw[key] = value;
        // Other retained sources still belong to this student on a first-import undo.
        nextRaw.studentId ??= currentRaw.studentId;
        nextRaw.name ??= currentRaw.name;
      } else {
        nextRaw[source] = previousRaw?.[source] ?? EMPTY_SOURCE_DATA[source];
        if (source === 'courses') {
          if (previousRaw?._legacyCourses) nextRaw._legacyCourses = previousRaw._legacyCourses;
          else delete nextRaw._legacyCourses;
        }
      }
    }

    const periodUpdatedAt = { ...currentMeta?.periodUpdatedAt };
    const nextParams = { ...(currentMeta?.params || {}) };
    const nextSourceUpdatedAt = { ...(currentMeta?.sourceUpdatedAt || {}) };
    for (const source of sources) {
      if (previousMeta?.periodUpdatedAt?.[source]) periodUpdatedAt[source] = previousMeta.periodUpdatedAt[source];
      else delete periodUpdatedAt[source];
      const paramKey = PARAM_KEY_BY_SOURCE[source];
      if (paramKey) {
        const previousParam = previousMeta?.params?.[paramKey];
        if (previousParam === undefined) delete nextParams[paramKey];
        else nextParams[paramKey] = previousParam;
      }

      const hadPreviousSource = source === 'grades'
        ? Boolean(previousRaw?.grades)
        : Boolean(paramKey && previousMeta?.params?.[paramKey]);
      const previousUpdatedAt = previousMeta?.sourceUpdatedAt?.[source]
        || (hadPreviousSource ? previousMeta?.scrapedAt : undefined);
      if (previousUpdatedAt === undefined) delete nextSourceUpdatedAt[source];
      else nextSourceUpdatedAt[source] = previousUpdatedAt;
    }

    const nextMeta: ImportMetadata | null = currentMeta || previousMeta
      ? {
          ...(currentMeta || previousMeta || {}),
          params: nextParams,
          periodUpdatedAt,
          sourceUpdatedAt: nextSourceUpdatedAt,
        }
      : null;

    const values = buildAcademicStorageValues(nextRaw, nextMeta);
    const encrypted = await encryptAcademicStorageValues(values, nextMeta, cryptoKey);
    await markImportRollbackSourcesRestored(sources, encrypted);
    for (const [key, value] of Object.entries(values)) populateSecureCache(key, value, encrypted[key]);
    if (nextMeta) populateSecureCache(STORAGE_KEYS.IMPORT_META, nextMeta, encrypted[STORAGE_KEYS.IMPORT_META]);
    window.postMessage({ type: CACHE_POPULATED_EVENT }, window.location.origin);
  });
}
