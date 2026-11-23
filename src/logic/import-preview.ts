export type ImportChangeStatus = 'add' | 'update' | 'remove' | 'unchanged';

type ImportCollection = 'grades' | 'registrations' | 'courses' | 'exams' | 'tuition';

export interface RawImportChange {
  id: string;
  collection: ImportCollection;
  index: number;
  label: string;
  status: ImportChangeStatus;
  courseId?: string;
  courseName?: string;
}

export interface RawImportPreviewContext {
  incomingMeta?: any;
  currentMeta?: any;
}

const COLLECTION_LABELS: Record<ImportCollection, string> = {
  grades: 'Bảng điểm',
  registrations: 'Kết quả đăng ký',
  courses: 'Danh sách lớp mở',
  exams: 'Lịch thi',
  tuition: 'Học phí',
};

const COLLECTIONS: ImportCollection[] = ['grades', 'registrations', 'courses', 'exams', 'tuition'];

function normalizeIdentityPart(value: unknown): string {
  return String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleUpperCase('vi-VN');
}

function normalizeSemester(value: unknown): string {
  const normalized = normalizeIdentityPart(value).replace(/\s+/g, '').replace('/HK', '/');
  const match = normalized.match(/^(\d{2}|\d{4})-(\d{2}|\d{4})\/(\d)$/);
  if (!match) return normalized;
  const shortYear = (year: string) => year.length === 4 ? year.slice(-2) : year;
  return `${shortYear(match[1])}-${shortYear(match[2])}/${match[3]}`;
}

function registrationBaseKey(value: any): string {
  return [value?.id, value?.classGroup, value?.courseType].map(normalizeIdentityPart).join('|');
}

function registrationKey(value: any): string {
  return `${normalizeSemester(value?.semester)}|${registrationBaseKey(value)}`;
}

function registrationScopeFromMeta(meta: any): string {
  const registration = meta?.params?.registration;
  if (!registration || typeof registration !== 'object') return '';
  const explicitSemester = normalizeSemester(registration.semester);
  if (explicitSemester) return explicitSemester;
  if (!registration.year || !registration.sem) return '';
  return normalizeSemester(`${registration.year}/${registration.sem}`);
}

function isRegistrationSnapshotComplete(meta: any): boolean {
  return meta?.params?.registration?.snapshotComplete === true;
}

function registrationSnapshotChangeId(scope: string): string {
  return `registrations:snapshot:${encodeURIComponent(scope)}`;
}

function dedupeRegistrations(values: any[]): any[] {
  const basesWithSemester = new Set(
    values.filter((value) => normalizeSemester(value?.semester)).map(registrationBaseKey),
  );
  const seen = new Set<string>();
  const result: any[] = [];
  for (const value of values) {
    const semester = normalizeSemester(value?.semester);
    const baseKey = registrationBaseKey(value);
    if (!semester && basesWithSemester.has(baseKey)) continue;
    const key = registrationKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function valueKey(collection: ImportCollection, value: any, index: number): string {
  switch (collection) {
    case 'grades':
      return [value?.semester, value?.id, value?.class, value?.type].map((part) => String(part ?? '').trim()).join('|') || `grade-${index}`;
    case 'registrations':
      return registrationKey(value) || `registration-${index}`;
    case 'courses':
      return JSON.stringify([value?.id, value?.className, value?.schedule, value?.location,
        value?.practicalGroupRaw, value?.exerciseGroupRaw].map(normalizeIdentityPart));
    default:
      return collection;
  }
}

function collectionKeys(collection: ImportCollection, values: any[]): string[] {
  const occurrences = new Map<string, number>();
  return values.map((value, index) => {
    const key = valueKey(collection, value, index);
    if (collection !== 'courses') return key;
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    return JSON.stringify([key, occurrence]);
  });
}

function mergePeriodData(collection: 'exams' | 'tuition', incoming: unknown, current: any) {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return undefined;
  const entries = Object.entries(incoming).filter(([period, value]) => {
    if (collection === 'exams' && (period === 'midterm' || period === 'final')) {
      return Array.isArray(value) && value.length > 0;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    if (collection === 'tuition') return Array.isArray(value.details) && value.totals && typeof value.totals === 'object';
    return Array.isArray(value.midterm) && Array.isArray(value.final);
  });
  if (entries.length === 0) return undefined;
  return { ...current, ...Object.fromEntries(entries) };
}

function knownStudentName(value: unknown): string {
  const name = normalizeIdentityPart(value);
  return ['UNKNOWN', 'ERROR', 'CHƯA CẬP NHẬT'].includes(name) ? '' : name;
}

export function assertSameStudent(incoming: any, current: any): void {
  if (!incoming || !current) return;
  const incomingId = normalizeIdentityPart(incoming?.studentId);
  const currentId = normalizeIdentityPart(current?.studentId);
  const incomingName = knownStudentName(incoming?.name);
  const currentName = knownStudentName(current?.name);
  if ((currentId || currentName) && !(incomingId && currentId) && !(incomingName && currentName)) {
    throw new Error('Không xác định được hồ sơ sinh viên của gói đồng bộ.');
  }
  const mismatch = incomingId && currentId
    ? incomingId !== currentId
    : incomingName && currentName && incomingName !== currentName;
  if (mismatch) throw new Error('Dữ liệu Portal thuộc hồ sơ sinh viên khác.');
}

function removalChangeId(collection: ImportCollection, key: string): string {
  return `${collection}:remove:${encodeURIComponent(key)}`;
}

function valueLabel(collection: ImportCollection, value: any): string {
  if (collection === 'grades') return `${value?.id || 'Không rõ mã'} - ${value?.name || 'Không rõ tên'}${value?.semester ? ` (${value.semester})` : ''}`;
  if (collection === 'registrations') return `${value?.id || 'Không rõ mã'} - ${value?.name || 'Không rõ tên'}${value?.semester ? ` (${value.semester})` : ''}`;
  if (collection === 'courses') return `${value?.id || 'Không rõ mã'} - ${value?.name || 'Không rõ tên'}${value?.className ? ` (${value.className})` : ''}`;
  return COLLECTION_LABELS[collection];
}

function isSameValue(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function buildRawImportPreview(
  incoming: any,
  current: any,
  context: RawImportPreviewContext = {},
): RawImportChange[] {
  const changes: RawImportChange[] = [];
  const incomingRegistrationScope = registrationScopeFromMeta(context.incomingMeta);
  const currentRegistrationScope = registrationScopeFromMeta(context.currentMeta);
  for (const collection of COLLECTIONS) {
    const incomingValue = incoming?.[collection];
    if (collection === 'exams' || collection === 'tuition') {
      const currentValue = current?.[collection];
      const merged = mergePeriodData(collection, incomingValue, currentValue);
      if (!merged) continue;
      changes.push({ id: `${collection}:0`, collection, index: 0, label: valueLabel(collection, incomingValue), status: currentValue === undefined ? 'add' : isSameValue(currentValue, merged) ? 'unchanged' : 'update' });
      continue;
    }
    if (!Array.isArray(incomingValue)) continue;
    const currentValues = Array.isArray(current?.[collection]) ? current[collection] : [];
    const currentKeys = collectionKeys(collection, currentValues);
    const incomingKeyList = collectionKeys(collection, incomingValue);
    const currentByKey = new Map(currentValues.map((value: any, index: number) => [currentKeys[index], value]));
    const legacyRegistrationsByBase = collection === 'registrations'
      ? new Map(currentValues
        .filter((value: any) => !normalizeSemester(value?.semester))
        .map((value: any) => [registrationBaseKey(value), value]))
      : null;
    incomingValue.forEach((value: any, index: number) => {
      const key = incomingKeyList[index];
      const currentValue = currentByKey.get(key)
        ?? (collection === 'registrations' ? legacyRegistrationsByBase?.get(registrationBaseKey(value)) : undefined);
      const hasRegistrationDuplicates = collection === 'registrations' && currentValues.filter((currentValue: any) => (
        valueKey(collection, currentValue, 0) === key
        || (!normalizeSemester(currentValue?.semester) && registrationBaseKey(currentValue) === registrationBaseKey(value))
      )).length > 1;
      const courseId = String(value?.id ?? '').trim();
      const courseName = String(value?.name ?? '').trim();
      changes.push({
        id: `${collection}:${index}`,
        collection,
        index,
        label: valueLabel(collection, value),
        status: currentValue === undefined ? 'add' : !hasRegistrationDuplicates && isSameValue(currentValue, value) ? 'unchanged' : 'update',
        ...(courseId ? { courseId } : {}),
        ...(courseName ? { courseName } : {}),
      });
    });

    const isScopedRegistrationSnapshot = collection === 'registrations'
      && Boolean(incomingRegistrationScope)
      && isRegistrationSnapshotComplete(context.incomingMeta);
    if (isScopedRegistrationSnapshot && incomingValue.length === 0 && currentValues.length === 0) {
      changes.push({
        id: registrationSnapshotChangeId(incomingRegistrationScope),
        collection,
        index: -1,
        label: `Kết quả đăng ký (${incomingRegistrationScope}) - Không có môn`,
        status: incomingRegistrationScope === currentRegistrationScope ? 'unchanged' : 'update',
      });
    }

    // Empty generic arrays remain non-destructive because they may come from a
    // parser failure. Registration snapshots with a verified period are safe.
    if ((!isScopedRegistrationSnapshot && incomingValue.length === 0)
      || (collection !== 'grades' && collection !== 'registrations' && collection !== 'courses')) continue;

    const incomingKeys = new Set(incomingKeyList);
    const incomingRegistrationBases = collection === 'registrations'
      ? new Set(incomingValue.map(registrationBaseKey))
      : null;
    const incomingRegistrationSemesters = collection === 'registrations'
      ? new Set(incomingValue.map((value: any) => normalizeSemester(value?.semester)).filter(Boolean))
      : null;

    const queuedRemovalKeys = new Set<string>();
    currentValues.forEach((value: any, index: number) => {
      const key = currentKeys[index];
      const semester = collection === 'registrations' ? normalizeSemester(value?.semester) : '';
      const existsInIncoming = incomingKeys.has(key)
        || (collection === 'registrations'
          && !semester
          && incomingRegistrationBases?.has(registrationBaseKey(value)));
      const isInReconciledScope = collection !== 'registrations'
        || isScopedRegistrationSnapshot
        || Boolean(semester && incomingRegistrationSemesters?.has(semester));
      if (existsInIncoming || !isInReconciledScope || queuedRemovalKeys.has(key)) return;
      queuedRemovalKeys.add(key);

      const courseId = String(value?.id ?? '').trim();
      const courseName = String(value?.name ?? '').trim();
      changes.push({
        id: removalChangeId(collection, key),
        collection,
        index,
        label: valueLabel(collection, value),
        status: 'remove',
        ...(courseId ? { courseId } : {}),
        ...(courseName ? { courseName } : {}),
      });
    });
  }
  return changes;
}

export function mergeSelectedRawImport(incoming: any, current: any, selectedIds: readonly string[]): any {
  assertSameStudent(incoming, current);
  const selected = new Set(selectedIds);
  const next = { ...(current || {}) };
  const collectionNames = new Set<string>(COLLECTIONS);

  // Preserve future scraper fields even before the import UI knows how to
  // render them. Known collections still follow the user's item selection.
  for (const [key, value] of Object.entries(incoming || {})) {
    if (key !== 'name' && key !== 'studentId' && !collectionNames.has(key)) next[key] = value;
  }
  for (const collection of COLLECTIONS) {
    const incomingValue = incoming?.[collection];
    if (incomingValue === undefined) continue;
    if (collection === 'exams' || collection === 'tuition') {
      const merged = mergePeriodData(collection, incomingValue, current?.[collection]);
      if (merged && selected.has(`${collection}:0`)) next[collection] = merged;
      continue;
    }
    if (!Array.isArray(incomingValue)) continue;
    const currentCollection = Array.isArray(current?.[collection]) ? current[collection] : [];
    if (!selectedIds.some((id) => id.startsWith(`${collection}:`))) continue;
    const currentKeys = collectionKeys(collection, currentCollection);
    const incomingKeys = collectionKeys(collection, incomingValue);
    const retainedKeys = currentKeys.filter((key) => !selected.has(removalChangeId(collection, key)));
    const retainedCurrentCollection = currentCollection.filter((_, index) =>
      !selected.has(removalChangeId(collection, currentKeys[index])),
    );
    const merged = collection === 'registrations' ? dedupeRegistrations(retainedCurrentCollection) : [...retainedCurrentCollection];
    const mergedKeys = collection === 'registrations' ? collectionKeys(collection, merged) : retainedKeys;
    const indexesByKey = new Map(mergedKeys.map((key, index) => [key, index]));
    const legacyRegistrationIndexes = collection === 'registrations'
      ? new Map(merged
        .map((value: any, index: number) => ({ value, index }))
        .filter(({ value }) => !normalizeSemester(value?.semester))
        .map(({ value, index }) => [registrationBaseKey(value), index]))
      : null;
    incomingValue.forEach((value: any, index: number) => {
      if (!selected.has(`${collection}:${index}`)) return;
      const key = incomingKeys[index];
      const currentIndex = indexesByKey.get(key)
        ?? (collection === 'registrations' ? legacyRegistrationIndexes?.get(registrationBaseKey(value)) : undefined);
      if (currentIndex === undefined) {
        indexesByKey.set(key, merged.length);
        merged.push(value);
      } else {
        merged[currentIndex] = value;
        indexesByKey.set(key, currentIndex);
      }
    });
    next[collection] = merged;
  }
  if (normalizeIdentityPart(incoming?.studentId)) next.studentId = incoming.studentId;
  return { ...next, name: (knownStudentName(incoming?.name) && incoming.name) || next.name };
}

export function getImportCollectionLabel(collection: ImportCollection): string {
  return COLLECTION_LABELS[collection];
}
