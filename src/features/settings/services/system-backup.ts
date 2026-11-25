import { STORAGE_KEYS } from '../../../config/storageKeys';
import { decodeBackupValues, encryptStorageValues, getCryptoMetadataKeys, readFromStorage, SECURE_DATA_KEYS } from '../../../helpers/localStorage/save';
import { buildAcademicStorageValues, readAcademicBaseline } from '../../../logic/academic-storage';
import { assertSameStudent, buildRawImportPreview, mergeSelectedRawImport, sameImportValue } from '../../../logic/import-preview';
import { mergeImportMetadata, type ImportMetadata } from '../../../logic/import-metadata';
import { isPortalSyncPacket } from '../../../portal-sync/protocol';

export const SYSTEM_BACKUP_SOURCE = 'hcmus-portal-tool';

const KNOWN_STORAGE_KEYS = new Set<string>(Object.values(STORAGE_KEYS));
const BACKUP_ENVELOPE_KEYS = new Set(getCryptoMetadataKeys());
const DERIVED_DATA_KEYS = new Set<string>([STORAGE_KEYS.STUDENT_DB, STORAGE_KEYS.COURSE_DB_OFFLINE, STORAGE_KEYS.IMPORT_META]);
const SECURE_KEYS = new Set<string>(SECURE_DATA_KEYS);

export function isSemesterScheduleOverride(key: string): boolean {
  return /^schedule_overrides:(?:(?:\d{2}|\d{4})-(?:\d{2}|\d{4})|unknown):(?:[1-3]|unknown)$/.test(key);
}

function canonicalScheduleKey(key: string): string {
  return isSemesterScheduleOverride(key) ? key.replace(/:(\d{4})-(\d{4}):/, (_, start, end) =>
    ':' + start.slice(-2) + '-' + end.slice(-2) + ':') : key;
}

export function mergeOpticalScheduleValue(key: string, incoming: string): string {
  const fullYearKey = key.replace(/:(\d{2})-(\d{2}):/, ':20$1-20$2:');
  const local = localStorage.getItem(key) ?? localStorage.getItem(fullYearKey);
  const source = JSON.parse(incoming);
  const current = JSON.parse(local ?? '{}');
  if (!isRecord(source) || !isRecord(current)) throw new Error('Tùy chỉnh thời khóa biểu không hợp lệ.');
  const result = { ...current, ...source };
  for (const field of ['sessionOverrides', 'weekOverrides']) {
    if (source[field] === undefined) continue;
    const oldRows = current[field] ?? {};
    const rows = source[field];
    if (!isRecord(rows) || !isRecord(oldRows)) throw new Error('Danh sách buổi đã chỉnh sửa không hợp lệ.');
    result[field] = { ...oldRows, ...Object.fromEntries(Object.entries(rows).map(([id, edit]) => {
      if (!isRecord(edit)) throw new Error('Tùy chỉnh buổi học không hợp lệ.');
      const merged = { ...(isRecord(oldRows[id]) ? oldRows[id] : {}), ...edit };
      if (field === 'sessionOverrides') {
        if (edit.weekCount !== undefined) delete merged.endWeek;
        else if (edit.endWeek !== undefined) delete merged.weekCount;
      }
      return [id, merged];
    })) };
  }
  if (Array.isArray(source.holidays)) {
    const holidays = new Map((Array.isArray(current.holidays) ? current.holidays : []).map(h => [h.id, h]));
    for (const holiday of source.holidays) holidays.set(holiday.id, holiday);
    result.holidays = [...holidays.values()];
  }
  return local !== null && sameImportValue(current, result) ? local : JSON.stringify(result);
}

export function isManagedStorageKey(key: string): boolean {
  return KNOWN_STORAGE_KEYS.has(key) || isSemesterScheduleOverride(key) || key === 'app_notification';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export interface UnwrappedSystemBackup {
  data: Record<string, unknown>;
  hasSystemEnvelope: boolean;
  isPortalFile?: boolean;
  optical?: boolean;
}

export function unwrapSystemBackup(value: unknown): UnwrappedSystemBackup | null {
  if (!isRecord(value)) return null;

  if (
    isRecord(value.metadata)
    && value.metadata.source === SYSTEM_BACKUP_SOURCE
    && isRecord(value.data)
  ) {
    return {
      data: value.data,
      hasSystemEnvelope: true,
      optical: value.metadata.transport === 'optical',
    };
  }

  const { metadata, meta: fileMeta, ...fields } = value;
  const raw = value.raw ?? fields;
  if (isPortalSyncPacket({ raw }) || (isRecord(raw) && Array.isArray(raw.courses))) {
    const meta = fileMeta ?? metadata;
    return {
      data: {
        [STORAGE_KEYS.RAW_STUDENT_DB]: raw,
        ...(isRecord(meta) ? { [STORAGE_KEYS.IMPORT_META]: meta } : {}),
      },
      hasSystemEnvelope: false,
      isPortalFile: true,
    };
  }

  return {
    data: value,
    hasSystemEnvelope: false,
  };
}

export function isSystemBackupData(
  data: Record<string, unknown>,
  hasSystemEnvelope = false,
): boolean {
  const keys = Object.keys(data);
  if (keys.length === 0) return false;
  if (hasSystemEnvelope) return keys.some(isManagedStorageKey);

  return keys.some(isManagedStorageKey);
}

export function normalizeStorageBackupData(
  data: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).flatMap(([originalKey, value]) => {
      const key = originalKey === 'app_notification' ? STORAGE_KEYS.APP_NOTIFICATION : canonicalScheduleKey(originalKey);
      if (key !== originalKey && Object.hasOwn(data, key)) return [];
      if (!isManagedStorageKey(key) && !BACKUP_ENVELOPE_KEYS.has(key)) return [];
      if (typeof value === 'string') return [[key, value]];
      if (value === undefined) return [];
      return [[key, JSON.stringify(value)]];
    }),
  );
}

export function getBackupSelection(data: Record<string, string>, keys: readonly string[]): string[] {
  if (!keys.includes(STORAGE_KEYS.RAW_STUDENT_DB)) return [...keys];
  const availableMeta = Object.hasOwn(data, STORAGE_KEYS.IMPORT_META) ? [STORAGE_KEYS.IMPORT_META] : [];
  return [...new Set([...keys, ...availableMeta])];
}

export function isBundledWithRaw(key: string): boolean {
  return DERIVED_DATA_KEYS.has(key);
}

export function previewPortalBackup(raw: any, incomingMeta?: ImportMetadata, additive = false) {
  const current = readAcademicBaseline();
  const currentMeta = readFromStorage<ImportMetadata | null>(STORAGE_KEYS.IMPORT_META, null);
  if (!currentMeta && localStorage.getItem(STORAGE_KEYS.IMPORT_META) !== null) throw new Error('Không đọc được thông tin học kỳ hiện tại.');
  const context = { incomingMeta, currentMeta, additive };
  assertSameStudent(raw, current);
  return { current, context, changes: buildRawImportPreview(raw, current, context) };
}

export async function prepareBackupChanges(
  data: Record<string, string>,
  selectedKeys: readonly string[],
  { currentKey, backupKey, isPortalFile, optical, selectedIds }: { currentKey?: CryptoKey | null; backupKey?: CryptoKey; isPortalFile?: boolean; optical?: boolean; selectedIds?: readonly string[] } = {},
): Promise<Record<string, string | null>> {
  const keys = getBackupSelection(data, selectedKeys);
  const includesRaw = keys.includes(STORAGE_KEYS.RAW_STUDENT_DB);
  if (!includesRaw && keys.some(isBundledWithRaw) && localStorage.getItem(STORAGE_KEYS.RAW_STUDENT_DB) !== null) {
    throw new Error('Hãy chọn cả dữ liệu Portal gốc để cập nhật các mục dữ liệu học tập này.');
  }
  // With raw data selected, derive its caches from the same snapshot.
  const values = await decodeBackupValues(data, keys.filter((key) => !includesRaw
    || key === STORAGE_KEYS.IMPORT_META || !isBundledWithRaw(key)), backupKey);
  if (includesRaw) {
    let raw = values[STORAGE_KEYS.RAW_STUDENT_DB];
    if (!isRecord(raw)) throw new Error('Dữ liệu Portal trong tệp không hợp lệ.');
    let rebuild = true;
    if (isPortalFile || optical) {
      const incomingMeta = values[STORAGE_KEYS.IMPORT_META] as ImportMetadata | undefined;
      const { changes, current, context } = previewPortalBackup(raw, incomingMeta, optical);
      const selected = changes.filter(c => c.status !== 'unchanged' && (!selectedIds || selectedIds.includes(c.id)));
      rebuild = selected.length > 0;
      if (rebuild) {
        raw = mergeSelectedRawImport(raw, current, selected.map(c => c.id), context);
        const meta = mergeImportMetadata(context.currentMeta, incomingMeta, selected.map(c => c.collection), selected);
        if (meta) values[STORAGE_KEYS.IMPORT_META] = meta;
      } else {
        delete values[STORAGE_KEYS.RAW_STUDENT_DB];
        delete values[STORAGE_KEYS.IMPORT_META];
      }
    }
    if (rebuild) Object.assign(values, buildAcademicStorageValues(raw as Parameters<typeof buildAcademicStorageValues>[0], values[STORAGE_KEYS.IMPORT_META] as ImportMetadata));
  }
  for (const [key, value] of Object.entries(values)) {
    if (optical && (isSemesterScheduleOverride(key) || key === STORAGE_KEYS.SCHEDULE_OVERRIDES)) {
      const merged = mergeOpticalScheduleValue(key, String(value));
      if (merged === localStorage.getItem(key)) delete values[key];
      else values[key] = merged;
    }
    if (SECURE_KEYS.has(key) && sameImportValue(readFromStorage(key, undefined), value)) delete values[key];
  }
  const secure = Object.fromEntries(Object.entries(values).filter(([key]) => SECURE_KEYS.has(key)));
  const changes: Record<string, string | null> = Object.fromEntries(Object.entries(values)
    .filter(([key]) => !SECURE_KEYS.has(key)).map(([key, value]) => [key, String(value)]));
  if (Object.keys(secure).length > 0) {
    if (!currentKey) throw new Error('Cần mở khóa ứng dụng để nhập dữ liệu được bảo vệ.');
    Object.assign(changes, await encryptStorageValues(secure, currentKey));
  }
  if (includesRaw && !isPortalFile && !optical && !Object.hasOwn(data, STORAGE_KEYS.IMPORT_META) && localStorage.getItem(STORAGE_KEYS.IMPORT_META) !== null) changes[STORAGE_KEYS.IMPORT_META] = null;
  return changes;
}
