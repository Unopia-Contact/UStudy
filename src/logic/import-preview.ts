import { semesterKey } from './academic-semester';
import { sourceDate, type ImportMetadata, type PortalDataSource, type ImportScope } from './import-metadata';

export type ImportChangeStatus = 'add' | 'update' | 'remove' | 'unchanged';
export interface RawImportChange extends ImportScope {
  id: string;
  index: number;
  label: string;
  status: ImportChangeStatus;
  courseId?: string;
  courseName?: string;
  observationOnly?: boolean;
}
export interface RawImportPreviewContext {
  incomingMeta?: ImportMetadata | null;
  currentMeta?: ImportMetadata | null;
  additive?: boolean;
}

const LABELS: Record<PortalDataSource, string> = {
  grades: 'Bảng điểm', registrations: 'Kết quả đăng ký', courses: 'Danh sách lớp mở',
  exams: 'Lịch thi', tuition: 'Học phí', profile: 'Hồ sơ sinh viên',
};
export const getImportCollectionLabel = (source: PortalDataSource) => LABELS[source];

function norm(value: unknown): string {
  return String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleUpperCase('vi-VN');
}


function knownName(value: unknown) {
  const name = norm(value);
  return ['UNKNOWN', 'ERROR', 'CHƯA CẬP NHẬT'].includes(name) ? '' : name;
}

export function assertSameStudent(incoming: any, current: any): void {
  if (!incoming || !current) return;
  const incomingId = norm(incoming.studentId);
  const currentId = norm(current.studentId);
  const incomingName = knownName(incoming.name);
  const currentName = knownName(current.name);
  if (incomingId && currentId) {
    if (incomingId !== currentId) throw new Error('Dữ liệu Portal thuộc hồ sơ sinh viên khác.');
    return;
  }
  if ((currentId || currentName) && !(incomingName && currentName)) {
    throw new Error('Không xác định được hồ sơ sinh viên của gói đồng bộ.');
  }
  if (currentName && incomingName !== currentName) throw new Error('Dữ liệu Portal thuộc hồ sơ sinh viên khác.');
}

export function sameImportValue(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a).filter(key => a[key] !== undefined);
  return keys.length === Object.keys(b).filter(key => b[key] !== undefined).length && keys.every(k => Object.hasOwn(b, k) && sameImportValue(a[k], b[k]));
}

function collectionRows(source: 'grades' | 'courses' | 'registrations', rows: any[], defaultScope: string) {
  const occurrences = new Map<string, number>();
  return rows.filter(row => row && typeof row === 'object' && norm(row.id)).map(row => {
    const scope = semesterKey(row.semester) || defaultScope;
    const value = !row.semester && scope && source !== 'grades' ? { ...row, semester: scope } : row;
    const parts = source === 'grades' ? [row.id, row.class, row.type] : source === 'registrations'
      ? [row.id, row.classGroup, row.courseType, row.schedule] :
      [row.id, row.className, row.schedule, row.location, row.practicalGroupRaw, row.exerciseGroupRaw];
    const base = JSON.stringify(parts.map(norm));
    let key = scope + '|' + base;
    if (source === 'courses') {
      const index = occurrences.get(key) ?? 0;
      occurrences.set(key, index + 1);
      key += '|' + index;
    }
    return { key, base, scope, value };
  });
}

function observedFields(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value != null && value !== ''));
}

function mergeDetailRows(existing: any[], incoming: any[], identity: (row: any) => string) {
  const result = [...existing];
  const indexes = new Map<string, number[]>();
  existing.forEach((row, index) => {
    const key = identity(row);
    const matches = indexes.get(key) ?? [];
    matches.push(index);
    indexes.set(key, matches);
  });
  const occurrences = new Map<string, number>();
  for (const row of incoming) {
    const key = identity(row);
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    const index = indexes.get(key)?.[occurrence];
    if (index === undefined) result.push(row);
    else result[index] = { ...result[index], ...observedFields(row) };
  }
  return result;
}

function reconcile(incoming: any, current: any, context: RawImportPreviewContext, selected = new Set<string>()) {
  assertSameStudent(incoming, current);
  const changes: RawImportChange[] = [];
  const next = { ...current };
  const opts = (context.incomingMeta?.params ?? {}) as Record<string, any>;
  const prev = (context.currentMeta?.params ?? {}) as Record<string, any>;
  function eligible(source: PortalDataSource, scope: string, existing: boolean) {
    const stored = context.currentMeta?.periodUpdatedAt?.[source];
    const previous = stored?.[scope] ?? (existing ? sourceDate(context.currentMeta, source, scope) : undefined);
    if (!previous || !Number.isFinite(Date.parse(previous))) return true;
    const date = sourceDate(context.incomingMeta, source, scope);
    return Boolean(date && Date.parse(date) >= Date.parse(previous));
  }
  function record(change: RawImportChange) {
    changes.push(change);
    return selected.has(change.id) && change.status !== 'unchanged';
  }
  const profile = Object.fromEntries(Object.entries(incoming ?? {}).filter(([key, value]) =>
    !(key in LABELS) && key !== '_legacyCourses' && key !== '__proto__' && key !== 'constructor'
    && (key !== 'name' || knownName(value)) && (key !== 'studentId' || norm(value))));
  if (Object.keys(profile).length && eligible('profile', '', Boolean(current?.name))
      && !Object.entries(profile).every(([key, value]) => sameImportValue(current?.[key], value))) {
    if (record({ id: 'profile:0', collection: 'profile', scope: '', index: 0, label: LABELS.profile, status: current ? 'update' : 'add' })) {
      Object.assign(next, profile);
    }
  }

  for (const source of ['grades', 'registrations', 'courses'] as const) {
    if (!Array.isArray(incoming?.[source])) continue;
    const param = source === 'registrations' ? 'registration' : source === 'courses' ? 'class' : 'grades';
    const incomingScope = semesterKey(opts[param]), currentScope = semesterKey(prev[param]);
    const old = collectionRows(source, Array.isArray(current?.[source]) ? current[source] : [], currentScope);
    const rows = collectionRows(source, incoming[source], incomingScope);
    const byKey = new Map(old.map(row => [row.key, row]));
    const legacy = new Map(old.filter(row => !row.scope).map(row => [row.base, row]));
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    for (const row of old) { if (seen.has(row.key)) duplicates.add(row.key); seen.add(row.key); }
    const result = new Map(old.map(row => [row.key, row.value]));
    const present = new Set<string>();
    let applied = false;
    const scopeHasRows = new Set(old.map(row => row.scope));
    rows.forEach(({ key, scope, base, value }, index) => {
      const match = byKey.get(key);
      const unscoped = source === 'registrations' ? legacy.get(base) : undefined;
      const before = match ?? unscoped;
      present.add(key);
      if (unscoped) present.add(unscoped.key);
      if (!eligible(source, scope, scopeHasRows.has(scope) || Boolean(before))) return;
      const merged = { ...before?.value, ...value };
      if (source === 'courses' && before) {
        for (const field of ['practicalClasses', 'exerciseClasses']) {
          if (context.additive && Array.isArray(before.value[field]) && Array.isArray(value[field])) {
            merged[field] = mergeDetailRows(before.value[field], value[field], row => norm(row.Nhom) + '|' + norm(row.LichHoc));
          } else if (value[field] == null || (value[field]?.length === 0 && value[field + 'Complete'] !== true)) {
            if (before.value[field] !== undefined) merged[field] = before.value[field];
          }
        }
      }
      const courseId = String(value.id), courseName = String(value.name ?? '');
      const status = !before ? 'add' : !duplicates.has(key) && !(unscoped && unscoped.key !== key && match)
        && sameImportValue(before.value, merged) ? 'unchanged' : 'update';
      if (record({ id: source + ':' + index, collection: source, scope, index, courseId, courseName,
        label: [courseId, courseName, scope].filter(Boolean).join(' · '), status })) {
        if (unscoped && unscoped.key !== key) result.delete(unscoped.key);
        result.set(key, merged);
        applied = true;
      }
    });
    const complete = !context.additive && rows.length === incoming[source].length && opts[param]?.snapshotComplete === true;
    const allGrades = source === 'grades' && opts.grades?.allSemesters === true;
    if (complete) {
      for (const [key, row] of byKey) {
        if (present.has(key) || !(allGrades || (incomingScope && row.scope === incomingScope))
          || !eligible(source, row.scope, true)) continue;
        const courseId = String(row.value.id), courseName = String(row.value.name ?? '');
        if (record({ id: source + ':remove:' + key, collection: source, scope: row.scope,
          index: -1, courseId, courseName, label: [courseId, courseName, row.scope].filter(Boolean).join(' · '), status: 'remove' })) {
          result.delete(key);
          applied = true;
        }
      }
    }
    if (source !== 'grades' && incomingScope && eligible(source, incomingScope, scopeHasRows.has(incomingScope))
      && (rows.length > 0 || complete) && (incomingScope !== currentScope || rows.length === 0)
      && (!sourceDate(context.currentMeta, source, '') || !currentScope || incomingScope === currentScope
        || Date.parse(sourceDate(context.incomingMeta, source, '') ?? '') >= Date.parse(sourceDate(context.currentMeta, source, '')!))
      && !changes.some(c => c.collection === source && c.status !== 'unchanged')) {
      applied = record({ id: source + ':scope', collection: source, scope: incomingScope, index: -1,
        label: LABELS[source] + ' (' + incomingScope + ')', status: incomingScope === currentScope ? 'unchanged' : 'update' }) || applied;
    }
    if (applied) next[source] = [...result.values()];
  }

  // Older devices can have usable scheduler classes without the original Portal rows.
  if (context.additive && Array.isArray(incoming?._legacyCourses)) {
    const existing = Array.isArray(current?._legacyCourses) ? current._legacyCourses : [];
    const known = new Set([...existing, ...(current?.courses ?? []), ...(incoming.courses ?? [])].map(row => norm(row?.id)));
    const merged = [...existing];
    for (const [index, course] of incoming._legacyCourses.entries()) {
      const id = norm(course?.id);
      if (!id || known.has(id) || !Array.isArray(course.classes)) continue;
      known.add(id);
      if (record({ id: 'courses:legacy:' + index, collection: 'courses', scope: '', index,
        label: [id, course.name].filter(Boolean).join(' · '), status: 'add' })) {
        merged.push(course);
        next._legacyCourses = merged;
      }
    }
  }

  for (const source of ['exams', 'tuition'] as const) {
    if (!incoming?.[source] || typeof incoming[source] !== 'object' || Array.isArray(incoming[source])) continue;
    const result = { ...current?.[source] };
    for (const [period, value] of Object.entries<any>(incoming[source])) {
      const scope = semesterKey(period) || period;
      const outputKey = source === 'exams' ? scope.replace('/', '-') : scope;
      const storedKey = Object.hasOwn(result, outputKey) ? outputKey :
        Object.keys(result).find(key => (semesterKey(key) || key) === scope);
      const before = storedKey === undefined ? undefined : result[storedKey];
      if (!eligible(source, scope, before !== undefined) || !value || ['__proto__','constructor','prototype'].includes(period)) continue;
      let merged;
      if (source === 'tuition') {
        if (!Array.isArray(value.details) || !value.totals) continue;
        merged = { ...before, ...value, totals: { ...before?.totals, ...value.totals } };
        if (before && (context.additive || value.snapshotComplete !== true)) {
          merged.totals = { ...before.totals, ...observedFields(value.totals) };
          merged.details = mergeDetailRows(before.details ?? [], value.details, row => norm(row.subject));
        }
      } else if (Array.isArray(value)) {
        if (!['midterm','final'].includes(period) || !value.length) continue;
        merged = mergeDetailRows(before ?? [], value, examIdentity);
      } else {
        if (!Array.isArray(value.midterm) || !Array.isArray(value.final)) continue;
        merged = { ...before, ...value };
        for (const type of ['midterm', 'final']) {
          if (context.additive || !value.completeTables?.includes(type)) {
            merged[type] = mergeDetailRows(before?.[type] ?? [], value[type], examIdentity);
          }
        }
        if (!before && !merged.midterm.length && !merged.final.length && !value.completeTables?.length) continue;
      }
      const status = before === undefined ? 'add' : sameImportValue(before, merged) ? 'unchanged' : 'update';
      if (record({ collection: source, id: source + ':' + period, scope, index: 0, label: LABELS[source] + ' (' + period + ')', status })) {
        if (storedKey !== undefined && storedKey !== outputKey) delete result[storedKey];
        result[outputKey] = merged;
        next[source] = result;
      }
    }
  }
  // An identical later scan still establishes a watermark. Keep it separate
  // from content edits so a background check never consumes the undo point.
  const seenScopes = new Set<string>();
  const changedScopes = new Set(changes.filter(c => c.status !== 'unchanged').map(c => c.collection + ':' + c.scope));
  const observed: ImportScope[] = changes.filter(c => c.status === 'unchanged');
  if (Object.keys(profile).length && current && eligible('profile', '', true)) observed.push({ collection: 'profile', scope: '' });
  for (const { collection, scope } of observed) {
    const id = collection + ':' + scope;
    if (changedScopes.has(id) || seenScopes.has(id)) continue;
    seenScopes.add(id);
    const date = sourceDate(context.incomingMeta, collection, scope);
    const previous = sourceDate(context.currentMeta, collection, scope);
    if (date && (!previous || Date.parse(date) > Date.parse(previous))) {
      record({ collection, scope, id: 'observed:' + id, index: -1, status: 'update', observationOnly: true,
        label: 'Xác nhận thời điểm cập nhật · ' + LABELS[collection] + (scope ? ' (' + scope + ')' : '') });
    }
  }
  if (selected.size && !knownName(current?.name) && knownName(incoming?.name)) next.name = incoming.name;
  if (selected.size && !norm(current?.studentId) && norm(incoming?.studentId)) next.studentId = incoming.studentId;
  return { changes, raw: next };
}

function examIdentity(row: any) {
  return JSON.stringify([row.id, row.group, row.date, row.time].map(norm));
}

export function buildRawImportPreview(incoming: any, current: any, context: RawImportPreviewContext = {}) {
  return reconcile(incoming, current, context).changes;
}

export function mergeSelectedRawImport(incoming: any, current: any, selectedIds: readonly string[], context: RawImportPreviewContext = {}) {
  return reconcile(incoming, current, context, new Set(selectedIds)).raw;
}
