import { expect, it, vi } from 'vitest';
import {
  changePin, getFailCount, importBackupWithCurrentKey, readImportRollbackValue,
  readSecure, restoreLastImportRollback, saveSecure, setupPin, unlockBackupKey,
  verifyPin,
} from '../../src/helpers/localStorage/save';

const snapshot = (): Record<string, string> => Object.fromEntries(
  Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!)
    .map((name) => [name, localStorage.getItem(name)!]),
);
const flip = (raw: string) => {
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  bytes[0] ^= 1;
  return btoa(String.fromCharCode(...bytes));
};
function rollback(data: Record<string, string>) {
  localStorage.setItem('__ustudy_last_import_rollback__', JSON.stringify({
    createdAt: '2026-09-07T00:00:00.000Z', source: 'synthetic-audit',
    summary: { added: 0, updated: 0, unchanged: 0 }, data,
  }));
}

it('[FINDING SEC-01] quota is swallowed by saveSecure', async () => {
  const key = await setupPin('synthetic-audit');
  const original = localStorage.setItem.bind(localStorage);
  vi.spyOn(localStorage, 'setItem').mockImplementation((name, value) => {
    if (name === 'raw_student_db') throw new DOMException('Synthetic quota', 'QuotaExceededError');
    original(name, value);
  });
  await expect(saveSecure('raw_student_db', { audit: true }, key)).resolves.toBeUndefined();
  expect(localStorage.getItem('raw_student_db')).toBeNull();
});

it('[FINDING SEC-01] a corrupt second backup item leaves the first item imported', async () => {
  const backupKey = await setupPin('backup-audit');
  await saveSecure('raw_student_db', { audit: 'incoming' }, backupKey);
  await saveSecure('saved_schedules', [], backupKey);
  const data = snapshot();
  data.saved_schedules = 'malformed';
  localStorage.clear();
  const current = await setupPin('current-audit');
  await saveSecure('raw_student_db', { audit: 'original' }, current);
  await expect(importBackupWithCurrentKey(data, 'backup-audit', current)).rejects.toThrow();
  expect(await readSecure('raw_student_db', current, null)).toEqual({ audit: 'incoming' });
});

it('[CONTROL] wrong backup password changes nothing', async () => {
  const key = await setupPin('audit-password');
  await saveSecure('raw_student_db', { audit: true }, key);
  const before = snapshot();
  await expect(importBackupWithCurrentKey(before, 'wrong-password', key)).rejects.toThrow();
  expect(snapshot()).toEqual(before);
});

it('[FINDING SEC-03] old envelope decrypts data written after password change', async () => {
  const key = await setupPin('audit-old');
  const old = snapshot();
  await changePin(key, 'audit-old', 'audit-new');
  await saveSecure('raw_student_db', { audit: 'new-data' }, key);
  const recovered = await unlockBackupKey('audit-old', old);
  expect(recovered).not.toBeNull();
  expect(await readSecure('raw_student_db', recovered!, null)).toEqual({ audit: 'new-data' });
});

it('[FINDING SEC-05] restore combines a foreign v2 ciphertext with current envelope', async () => {
  const oldKey = await setupPin('audit-first-vault');
  await saveSecure('raw_student_db', { audit: 'first-vault' }, oldKey);
  const old = snapshot();
  localStorage.clear();
  const current = await setupPin('audit-second-vault');
  await saveSecure('raw_student_db', { audit: 'second-vault' }, current);
  rollback(old);
  expect(await restoreLastImportRollback()).toBe(true);
  await expect(readSecure('raw_student_db', current, null)).rejects.toBeDefined();
  expect(await readSecure('raw_student_db', oldKey, null)).toEqual({ audit: 'first-vault' });
});

it('[FINDING SEC-05] quota during restore loses the pre-restore values', async () => {
  localStorage.setItem('audit-original', 'must-survive');
  rollback({ 'audit-first': 'new', 'audit-second': 'blocked' });
  const original = localStorage.setItem.bind(localStorage);
  vi.spyOn(localStorage, 'setItem').mockImplementation((name, value) => {
    if (name === 'audit-second') throw new DOMException('Synthetic quota', 'QuotaExceededError');
    original(name, value);
  });
  expect(await restoreLastImportRollback()).toBe(false);
  expect(localStorage.getItem('audit-original')).toBeNull();
  expect(localStorage.getItem('audit-first')).toBe('new');
});

it('[FINDING SEC-05] v2 snapshot reader accepts unauthenticated JSON for a secure key', async () => {
  const key = await setupPin('synthetic-audit');
  rollback({ ...snapshot(), raw_student_db: JSON.stringify({ audit: 'plain-injection' }) });
  expect(await readImportRollbackValue('raw_student_db', key, null)).toEqual({ audit: 'plain-injection' });
});

it('[FINDING SEC-08] authentic ciphertext is accepted under a different storage name', async () => {
  const key = await setupPin('synthetic-audit');
  await saveSecure('gpa_projected_grades', { audit: true }, key);
  localStorage.setItem('solver_preferences', localStorage.getItem('gpa_projected_grades')!);
  expect(await readSecure('solver_preferences', key, null)).toEqual({ audit: true });
});

it.each(['iv', 'ciphertext'])('[CONTROL] mutated data %s fails authentication', async (field) => {
  const key = await setupPin('synthetic-audit');
  await saveSecure('raw_student_db', { audit: true }, key);
  const parts = localStorage.getItem('raw_student_db')!.split(':');
  const index = field === 'iv' ? 1 : 2;
  parts[index] = flip(parts[index]);
  localStorage.setItem('raw_student_db', parts.join(':'));
  await expect(readSecure('raw_student_db', key, 'fallback')).rejects.toBeDefined();
});

it.each(['', 'not-json', '{}', 'a:b:c', 'a:b', '::::', 'null'])('[CONTROL] malformed secure payload %j never returns plaintext', async (payload) => {
  const key = await setupPin('synthetic-audit');
  localStorage.setItem('raw_student_db', payload);
  await expect(readSecure('raw_student_db', key, null)).rejects.toBeDefined();
});

it('[CONTROL] raw Master Key export is denied and 64 writes use distinct IVs', async () => {
  const key = await setupPin('synthetic-audit');
  await expect(crypto.subtle.exportKey('raw', key)).rejects.toBeDefined();
  const ivs = new Set<string>();
  for (let i = 0; i < 64; i++) {
    await saveSecure('raw_student_db', { audit: i }, key);
    ivs.add(localStorage.getItem('raw_student_db')!.split(':')[1]);
  }
  expect(ivs.size).toBe(64);
});

it('[LIMITATION SEC-11] direct local verifier is not an offline guessing throttle', async () => {
  await setupPin('synthetic-known-password');
  for (const candidate of ['fake-1', 'fake-2', 'fake-3']) {
    expect(await verifyPin(candidate)).toBeNull();
  }
  expect(getFailCount()).toBe(0);
  expect(await verifyPin('synthetic-known-password')).not.toBeNull();
});
