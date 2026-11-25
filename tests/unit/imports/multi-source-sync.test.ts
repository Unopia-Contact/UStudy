import { describe, expect, it } from 'vitest';
import { buildRawImportPreview, mergeSelectedRawImport, type RawImportPreviewContext } from '../../../src/logic/import-preview';
import { mergeImportMetadata } from '../../../src/logic/import-metadata';
import { buildAcademicStorageValues } from '../../../src/logic/academic-storage';
import { FinancialLogic } from '../../../src/features/tuition/services/financial-logic';
import { ScheduleLogic } from '../../../src/features/visual-schedule/services/schedule-logic';
import { prepareBackupChanges, normalizeStorageBackupData, unwrapSystemBackup, isManagedStorageKey } from '../../../src/features/settings/services/system-backup';
import { buildOpticalSyncPayload, isOpticalSyncKey } from '../../../src/features/optical-sync/services/optical-sync-payload';
import { applyStorageChanges, populateSecureCache, readSecure, saveSecure, setupPin } from '../../../src/helpers/localStorage/save';

const old = '2026-11-18T09:00:00Z';
const latest = '2026-11-25T09:00:00Z';
const student = { studentId: 'fixture01', name: 'Student A' };
const grade = (id: string, score: string, semester = '26-27/2') => ({ id, name: id, semester, type: 'LT', credits: '3', class: 'A', score });
const registration = (id: string, semester: string, schedule = 'T2(1-3)') => ({ id, name: id, semester, courseType: 'LT', classGroup: 'A', schedule });
const params = { registration: { year: '26-27', sem: 2, snapshotComplete: true } };

function reconcile(raw: any, incoming: any, context: RawImportPreviewContext = {}) {
  const changes = buildRawImportPreview(incoming, raw, context).filter(c => c.status !== 'unchanged');
  return { changes, raw: mergeSelectedRawImport(incoming, raw, changes.map(c => c.id), context),
    meta: mergeImportMetadata(context.currentMeta, context.incomingMeta, changes.map(c => c.collection), changes) };
}

describe('academic data across sources, periods and retries', () => {
  it('ignores a late or undated update and preserves rows outside a partial scan', () => {
    const current = { ...student, grades: [grade('A', '9'), grade('B', '7', '25-26/1')] };
    const packet = { ...student, grades: [grade('A', '6')] };
    for (const incomingMeta of [{ scrapedAt: old }, {}]) {
      const result = reconcile(current, packet, { currentMeta: { sourceUpdatedAt: { grades: latest, profile: latest } }, incomingMeta });
      expect(result.raw).toEqual(current);
      expect(result.changes).toHaveLength(0);
    }
    expect(reconcile(current, packet).raw.grades).toEqual([grade('A', '6'), current.grades[1]]);
  });

  it('advances the watermark on a later identical scan and admits older data for a previously missing term', () => {
    const raw = { ...student, grades: [grade('A', '9')] };
    const fresh = reconcile(raw, raw, { currentMeta: { scrapedAt: old }, incomingMeta: { scrapedAt: latest } });
    expect(fresh.changes.every(c => c.observationOnly)).toBe(true);
    expect(fresh.meta?.periodUpdatedAt?.grades?.['26-27/2']).toBe(latest);
    const late = reconcile(fresh.raw, { ...student, grades: [grade('A', '6'), grade('B', '8', '24-25/1')] },
      { currentMeta: fresh.meta, incomingMeta: { scrapedAt: old } });
    expect(late.raw.grades).toEqual([grade('A', '9'), grade('B', '8', '24-25/1')]);
    expect(late.meta?.sourceUpdatedAt?.grades).toBe(latest);
  });

  it('keeps the timestamp of an untouched legacy source after another source is updated', () => {
    const raw = { ...student, grades: [grade('A', '9')] };
    const first = reconcile(raw, { ...student, registrations: [registration('N', '26-27/2')] },
      { currentMeta: { scrapedAt: latest }, incomingMeta: { scrapedAt: latest, params } });
    const late = reconcile(first.raw, { ...student, grades: [grade('A', '3')] },
      { currentMeta: first.meta, incomingMeta: { scrapedAt: old } });
    expect(late.raw.grades).toEqual(raw.grades);
  });

  it('infers the latest stored semester and unifies long and short period keys', () => {
    const registrations = [registration('H', '25-26/1'), registration('N', '26-27/2')];
    expect(ScheduleLogic.buildScheduleSessions(registrations, [], {}).sessions.map(row => row.courseCode)).toEqual(['N']);
    const first = { exams: { '2026-2027/2': { midterm: [{ id: 'M' }], final: [] } } };
    const merged = reconcile(first, { exams: { '26-27-2': { midterm: [], final: [{ id: 'F' }] } } }).raw;
    expect(merged.exams).toEqual({ '26-27-2': { midterm: [{ id: 'M' }], final: [{ id: 'F' }] } });
  });

  it('removes registrations only in a verified semester, including its last meeting', () => {
    const history = registration('H', '25-26/1');
    const current = { registrations: [history, registration('N', '26-27/2')] };
    const result = reconcile(current, { registrations: [] }, { incomingMeta: { params, scrapedAt: latest } });
    expect(result.raw.registrations).toEqual([history]);
    expect(reconcile(result.raw, { registrations: [registration('N','26-27/2')] },
      { currentMeta: result.meta, incomingMeta: { scrapedAt: old, params } }).raw.registrations).toEqual([history]);
  });

  it('retains two meetings of one registration and is idempotent on replay', () => {
    const raw = { registrations: [registration('N', '26-27/2'), registration('N', '26-27/2', 'T4(1-3)')] };
    const first = reconcile({}, raw);
    expect(first.raw).toEqual(raw);
    expect(reconcile(first.raw, raw).changes).toEqual([]);
  });

  it('preserves subclass data on a failed scan and clears it on a verified removal', () => {
    const row = { id: 'N', className: 'A', schedule: 'T2(1-3)', practicalClasses: [{ Nhom: '01', LichHoc: 'T3(1-3)' }] };
    const current = { courses: [row] };
    expect(reconcile(current, { courses: [{ ...row, practicalClasses: [] }] }).raw).toEqual(current);
    const verified = { courses: [{ ...row, practicalClasses: [], practicalClassesComplete: true }] };
    expect(reconcile(current, verified).raw.courses[0].practicalClasses).toEqual([]);
    expect(reconcile(current, verified, { additive: true }).raw.courses[0].practicalClasses).toEqual(row.practicalClasses);
  });

  it('clears only a successfully read exam table', () => {
    const current = { exams: { '26-27-2': { midterm: [{ id:'M' }], final: [{ id:'F' }] } } };
    const empty = { exams: { '26-27-2': { midterm: [], final: [], completeTables: ['final'] } } };
    expect(reconcile(current, empty).raw.exams['26-27-2']).toMatchObject({ midterm: [{ id: 'M' }], final: [] });
    expect(reconcile(current, { exams: {} }).raw).toEqual(current);
  });

  it('tracks a profile-only edit and rejects a different student even when names match', () => {
    const incoming = { ...student, name: 'Updated', program: ['CS'] };
    expect(reconcile(student, incoming).raw).toEqual(incoming);
    expect(() => reconcile(student, { ...student, studentId: 'different' })).toThrow('hồ sơ sinh viên khác');
  });

  it('uses the invoice in the active period and parses Vietnamese numeric formats', () => {
    const raw = { grades: [grade('A', '8,5')], tuition: { '26-27/2': { totals: { fee: '1.500.000', totalDue: '500.000' },
      details: [{ subject: '[A/01] A', fee: '1.500.000', credits: '1,5' }] } } };
    const derived = buildAcademicStorageValues(raw as any).student_db_full;
    expect(derived.grades[0].score).toBe(8.5);
    const result = FinancialLogic.calculateTuitionData('26-27/2', '', derived, { params }, null, []);
    expect(result.source).toBe('tuition_page');
    expect(result.summary).toMatchObject({ totalFee: 1500000, amountDue: 500000 });
    expect(result.courses[0]).toMatchObject({ tuitionFee: 1500000, credits: 1.5 });
  });

  it('uses the same registration period for fees and the visual timetable', () => {
    const registrations = [registration('H', '25-26/1'), registration('N', '26-27/2')];
    const result = FinancialLogic.calculateTuitionData('26-27/2', '', { registrations }, { params }, null, []);
    expect(result.courses.map(c => c.courseCode)).toEqual(['N']);
    expect(ScheduleLogic.buildScheduleSessions(registrations, [], { params }).sessions.map(s => s.courseCode)).toEqual(['N']);
  });

  it('keeps standalone legacy scheduler classes when transferring between devices', () => {
    const course = { id: 'C', name: 'Môn cũ', classes: [{ id: '01' }] };
    const first = reconcile(student, { ...student, _legacyCourses: [course] }, { additive: true });
    expect(buildAcademicStorageValues(first.raw).course_db_offline).toEqual([course]);
    expect(reconcile(first.raw, { ...student, _legacyCourses: [course] }, { additive: true }).changes).toHaveLength(0);
  });

  it('merges optical timetable edits for the same semester and makes a repeated transfer a no-op', async () => {
    const storageKey = 'schedule_overrides:26-27:1';
    localStorage.setItem(storageKey, JSON.stringify({ sessionOverrides: { A: { endWeek: 8 }, B: { room: 'B2' } },
      weekOverrides: {}, holidays: [{ id: 'local' }] }));
    const data = normalizeStorageBackupData({ 'schedule_overrides:2026-2027:1': {
      sessionOverrides: { A: { room: 'A2' } }, weekOverrides: { '3_A': { room: 'C' } }, holidays: [{ id: 'remote' }],
    } });
    const changes = await prepareBackupChanges(data, [storageKey], { optical: true });
    expect(JSON.parse(changes[storageKey]!)).toMatchObject({ sessionOverrides: { A: { endWeek: 8, room: 'A2' }, B: { room: 'B2' } },
      holidays: [{ id: 'local' }, { id: 'remote' }] });
    applyStorageChanges(changes);
    expect(await prepareBackupChanges(data, [storageKey], { optical: true })).toEqual({});
  });

  it('merges an actual optical envelope and makes the same transfer a no-op', async () => {
    const key = await setupPin('audit-fixture');
    const local = { ...student, grades: [grade('A', '9')] };
    await saveSecure('raw_student_db', local, key);
    populateSecureCache('raw_student_db', local);
    const incoming = { ...student, grades: [], registrations: [registration('N', '26-27/2')] };
    const env = unwrapSystemBackup(JSON.parse(buildOpticalSyncPayload(['raw_student_db'], { raw_student_db: JSON.stringify(incoming) })))!;
    const data = normalizeStorageBackupData(env.data);
    const options = { currentKey: key, optical: env.optical };
    const changes = await prepareBackupChanges(data, ['raw_student_db'], options);
    applyStorageChanges(changes);
    const result = await readSecure('raw_student_db', key, null);
    expect(result).toMatchObject({ grades: local.grades, registrations: incoming.registrations });
    populateSecureCache('raw_student_db', result);
    expect(await prepareBackupChanges(data, ['raw_student_db'], options)).toEqual({});
  });

  it('preserves derived-only history and includes semester schedule edits in file and optical transfers', async () => {
    const key = await setupPin('audit-fixture');
    const legacy = { ...student, grades: [grade('A','9')], program: ['CS'] };
    await saveSecure('student_db_full', legacy, key);
    populateSecureCache('student_db_full', legacy);
    const data = { raw_student_db: JSON.stringify({ ...student, grades: [], registrations: [registration('N', '26-27/2')] }) };
    applyStorageChanges(await prepareBackupChanges(data, ['raw_student_db'], { currentKey: key, isPortalFile: true }));
    expect(await readSecure('student_db_full', key, null)).toMatchObject({ program: ['CS'], grades: [{ id:'A', score:9 }] });
    const override = 'schedule_overrides:26-27:2';
    expect(isManagedStorageKey(override) && isOpticalSyncKey(override)).toBe(true);
    expect(JSON.parse(buildOpticalSyncPayload([override], { [override]: '{}' })).data[override]).toBe('{}');
  });
});
