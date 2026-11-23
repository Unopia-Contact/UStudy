import { STORAGE_KEYS } from '../../../config/storageKeys';
import { decodeBackupValues, encryptStorageValues, getCryptoMetadataKeys, readFromStorage, SECURE_DATA_KEYS } from '../../../helpers/localStorage/save';
import { buildAcademicStorageValues } from '../../../logic/academic-storage';
import { buildRawImportPreview, mergeSelectedRawImport } from '../../../logic/import-preview';
import { mergeImportMetadata, type ImportMetadata } from '../../../logic/import-metadata';
import { isPortalSyncPacket } from '../../../portal-sync/protocol';

export const SYSTEM_BACKUP_SOURCE = 'hcmus-portal-tool';

const KNOWN_STORAGE_KEYS = new Set<string>(Object.values(STORAGE_KEYS));
const BACKUP_ENVELOPE_KEYS = new Set(getCryptoMetadataKeys());
const DERIVED_DATA_KEYS = new Set<string>([STORAGE_KEYS.STUDENT_DB, STORAGE_KEYS.COURSE_DB_OFFLINE, STORAGE_KEYS.IMPORT_META]);
const SECURE_KEYS = new Set<string>(SECURE_DATA_KEYS);

export function isManagedStorageKey(key: string): boolean {
  return KNOWN_STORAGE_KEYS.has(key) || key === 'app_notification';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export interface UnwrappedSystemBackup {
  data: Record<string, unknown>;
  hasSystemEnvelope: boolean;
  isPortalFile?: boolean;
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
    };
  }

  const raw = value.raw ?? value;
  if (isPortalSyncPacket({ raw }) || (isRecord(raw) && Array.isArray(raw.courses))) {
    const meta = value.meta ?? value.metadata;
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
      const key = originalKey === 'app_notification' ? STORAGE_KEYS.APP_NOTIFICATION : originalKey;
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

export async function prepareBackupChanges(
  data: Record<string, string>,
  selectedKeys: readonly string[],
  { currentKey, backupKey, isPortalFile }: { currentKey?: CryptoKey | null; backupKey?: CryptoKey; isPortalFile?: boolean } = {},
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
    if (isPortalFile) {
      const current = readFromStorage(STORAGE_KEYS.RAW_STUDENT_DB, null);
      if (!current && localStorage.getItem(STORAGE_KEYS.RAW_STUDENT_DB) !== null) {
        throw new Error('Không đọc được dữ liệu Portal hiện tại.');
      }
      const currentMeta = readFromStorage<ImportMetadata | null>(STORAGE_KEYS.IMPORT_META, null);
      const fileMeta = values[STORAGE_KEYS.IMPORT_META] as ImportMetadata | undefined;
      const changes = buildRawImportPreview(raw, current, { incomingMeta: fileMeta, currentMeta })
        .filter(({ status }) => status !== 'unchanged');
      raw = mergeSelectedRawImport(raw, current, changes.map(({ id }) => id));
      const meta = mergeImportMetadata(currentMeta, fileMeta, changes.map(({ collection }) => collection));
      if (meta) values[STORAGE_KEYS.IMPORT_META] = meta;
    }
    Object.assign(values, buildAcademicStorageValues(raw as Parameters<typeof buildAcademicStorageValues>[0]));
  }
  const secure = Object.fromEntries(Object.entries(values).filter(([key]) => SECURE_KEYS.has(key)));
  const changes: Record<string, string | null> = Object.fromEntries(Object.entries(values)
    .filter(([key]) => !SECURE_KEYS.has(key)).map(([key, value]) => [key, String(value)]));
  if (Object.keys(secure).length > 0) {
    if (!currentKey) throw new Error('Cần mở khóa ứng dụng để nhập dữ liệu được bảo vệ.');
    Object.assign(changes, await encryptStorageValues(secure, currentKey));
  }
  if (includesRaw && !Object.hasOwn(values, STORAGE_KEYS.IMPORT_META)) changes[STORAGE_KEYS.IMPORT_META] = null;
  return changes;
}
