import { describe, expect, it, vi } from 'vitest';
import { mergeOpticalScheduleValue, prepareBackupChanges, normalizeStorageBackupData, unwrapSystemBackup } from '../../../src/features/settings/services/system-backup';
import { buildOpticalSyncPayload } from '../../../src/features/optical-sync/services/optical-sync-payload';
import { applyStorageChanges, getCryptoMetadataKeys, IMPORT_ROLLBACK_STORAGE_KEY, populateSecureCache, readSecure, saveSecure, setupPin } from '../../../src/helpers/localStorage/save';
import { restoreImportSources } from '../../../src/logic/import-rollback';

describe('backup storage', () => {
  it('imports mixed-format backup values and regenerates derived data from raw', async () => {
    const backupKey = await setupPin('source-fixture');
    const raw = { name: 'Backup student', grades: [], courses: [], registrations: [] };
    await saveSecure('raw_student_db', raw, backupKey);
    await saveSecure('import_meta', { scrapedAt: '2026-11-19' }, backupKey);
    const data = {
      raw_student_db: localStorage.getItem('raw_student_db')!,
      import_meta: localStorage.getItem('import_meta')!,
      student_db_full: JSON.stringify({ name: 'Stale derived data' }),
      gpa_projected_grades: JSON.stringify({ version: 2, grades: { TEST: 9 } }),
    };

    localStorage.clear();
    const current = await setupPin('destination-fixture');
    const changes = await prepareBackupChanges(data, ['raw_student_db', 'gpa_projected_grades'], { currentKey: current, backupKey });
    expect(localStorage.getItem('raw_student_db')).toBeNull();
    applyStorageChanges(changes);

    await expect(readSecure('student_db_full', current, null)).resolves.toMatchObject({ name: raw.name });
    await expect(readSecure('import_meta', current, null)).resolves.toEqual({ scrapedAt: '2026-11-19' });
    await expect(readSecure('gpa_projected_grades', current, null)).resolves.toMatchObject({ grades: { TEST: 9 } });
  });

  it('merges current and legacy schedule durations in either direction while keeping other edits', () => {
    const key = 'schedule_overrides:26-27:1';
    const packet = (edit: object) => JSON.stringify({ sessionOverrides: { session: edit } });
    localStorage.setItem(key, packet({ endWeek: 4, room: 'B201' }));
    const current = mergeOpticalScheduleValue(key, packet({ weekCount: 8 }));
    expect(JSON.parse(current).sessionOverrides.session).toEqual({ weekCount: 8, room: 'B201' });
    localStorage.setItem(key, current);
    const legacy = mergeOpticalScheduleValue(key, packet({ endWeek: 0 }));
    expect(JSON.parse(legacy).sessionOverrides.session).toEqual({ endWeek: 0, room: 'B201' });
  });

  it('exports the captured plain preference rather than unrelated cached data', () => {
    const key = 'solver_preferences';
    localStorage.setItem(key, JSON.stringify({ session: 'morning' }));
    populateSecureCache(key, { session: 'morning' });
    const latest = JSON.stringify({ session: 'afternoon' });
    localStorage.setItem(key, latest);
    expect(JSON.parse(buildOpticalSyncPayload([key], { [key]: latest })).data[key]).toBe(latest);
  });

  it('accepts the Portal JSON fallback and reads historical notification names', () => {
    const raw = { name: 'Backup student', grades: [] };
    expect(unwrapSystemBackup({ raw, meta: { scrapedAt: '2026-11-19' } })?.data).toMatchObject({
      raw_student_db: raw,
      import_meta: { scrapedAt: '2026-11-19' },
    });
    expect(normalizeStorageBackupData({ app_notification: [] })).toEqual({ app_notifications: '[]' });
  });

  it('preserves a later academic edit when partial rollback detects a different revision', async () => {
    const key = await setupPin('restore-fixture');
    const current = { name: 'Backup student', grades: [{ id: 'NEWER', score: '9' }] };
    await saveSecure('raw_student_db', current, key);
    populateSecureCache('raw_student_db', current);
    const data = Object.fromEntries(getCryptoMetadataKeys().map(storageKey => [storageKey, localStorage.getItem(storageKey)]));
    localStorage.setItem(IMPORT_ROLLBACK_STORAGE_KEY, JSON.stringify({
      createdAt: '2026-11-19', source: 'test', summary: { added: 1, updated: 0, unchanged: 0 }, data,
      writtenHashes: { raw_student_db: null }, academicHashes: { raw_student_db: null },
    }));
    await expect(restoreImportSources(['grades'], key)).rejects.toThrow('đã được chỉnh sửa');
    await expect(readSecure('raw_student_db', key, null)).resolves.toEqual(current);
  });

  it('restores only the selected source and preserves unrelated raw fields', async () => {
    const key = await setupPin('restore-fixture');
    const older = { name: 'Backup student', grades: [{ id: 'OLDER', score: '8' }] };
    await saveSecure('raw_student_db', older, key);
    const snapshot = Object.fromEntries([...getCryptoMetadataKeys(), 'raw_student_db']
      .filter((storageKey) => localStorage.getItem(storageKey) !== null)
      .map((storageKey) => [storageKey, localStorage.getItem(storageKey)]));
    const current = { ...older, grades: [{ id: 'NEWER', score: '9' }], futureField: { value: 1 } };
    await saveSecure('raw_student_db', current, key);
    populateSecureCache('raw_student_db', current);
    localStorage.setItem(IMPORT_ROLLBACK_STORAGE_KEY, JSON.stringify({
      createdAt: '2026-11-19',
      source: 'test',
      summary: { added: 1, updated: 0, unchanged: 0 },
      data: snapshot,
    }));

    vi.stubGlobal('postMessage', vi.fn());
    try {
      await restoreImportSources(['grades'], key);
    } finally {
      vi.unstubAllGlobals();
    }
    await expect(readSecure('raw_student_db', key, null)).resolves.toEqual({ ...current, grades: older.grades });
  });
});
