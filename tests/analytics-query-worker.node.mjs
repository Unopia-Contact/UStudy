import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Worker } from 'node:worker_threads';

const snapshotDirectory = await mkdtemp(join(tmpdir(), 'ustudy-analytics-test-'));
const workerPath = resolve('scripts/analytics-query-worker.mjs');
await writeFile(join(snapshotDirectory, 'hakhoi.sql'), `
  CREATE TABLE anonymous_installations (installation_hash TEXT PRIMARY KEY, origin TEXT, first_seen_day TEXT, last_seen_day TEXT, app_version TEXT, client_kind TEXT, deleted_day TEXT);
  CREATE TABLE installation_activity_days (installation_hash TEXT, active_day TEXT);
  INSERT INTO anonymous_installations VALUES ('hash-1', 'hakhoi', '2026-09-01', '2026-09-02', '1', 'web', NULL);
  INSERT INTO anonymous_installations VALUES ('hash-2', 'hakhoi', '2026-09-01', '2026-09-03', '1', 'web', NULL);
  INSERT INTO installation_activity_days VALUES ('hash-1', '2026-09-02');
`);
await writeFile(join(snapshotDirectory, 'unopia.sql'), `
  CREATE TABLE anonymous_installations (installation_hash TEXT PRIMARY KEY, origin TEXT, first_seen_day TEXT, last_seen_day TEXT, app_version TEXT, client_kind TEXT, deleted_day TEXT);
  CREATE TABLE installation_activity_days (installation_hash TEXT, active_day TEXT);
  INSERT INTO anonymous_installations VALUES ('hash-1', 'unopia', '2026-09-01', '2026-09-02', '1', 'web', NULL);
  INSERT INTO installation_activity_days VALUES ('hash-1', '2026-09-02');
`);

after(async () => {
  if (!snapshotDirectory.startsWith(join(tmpdir(), 'ustudy-analytics-test-'))) throw new Error('Unsafe test cleanup path');
  await rm(snapshotDirectory, { recursive: true, force: true });
});

function run(sql, source = 'hakhoi') {
  return new Promise((resolveResult, rejectResult) => {
    const worker = new Worker(workerPath, { workerData: { snapshotDirectory, source, sql } });
    worker.once('message', resolveResult);
    worker.once('error', rejectResult);
    worker.once('exit', (code) => {
      if (code !== 0) rejectResult(new Error(`Worker exited ${code}`));
    });
  });
}

test('returns local rows and column metadata', async () => {
  const result = await run('SELECT origin, COUNT(*) AS total FROM anonymous_installations GROUP BY origin');
  assert.deepEqual(result.columns, ['origin', 'total']);
  assert.deepEqual(result.rows, [{ origin: 'hakhoi', total: 2 }]);
});

test('merges both sources without collapsing identical hashes', async () => {
  const result = await run('SELECT source, COUNT(*) AS total FROM anonymous_installations GROUP BY source ORDER BY source', 'both');
  assert.deepEqual(result.rows, [{ source: 'hakhoi', total: 2 }, { source: 'unopia', total: 1 }]);
  const joined = await run(`
    SELECT i.source, COUNT(*) AS total
    FROM anonymous_installations i
    JOIN installation_activity_days a
      ON a.source = i.source AND a.installation_hash = i.installation_hash
    GROUP BY i.source ORDER BY i.source
  `, 'both');
  assert.deepEqual(joined.rows, [{ source: 'hakhoi', total: 1 }, { source: 'unopia', total: 1 }]);
});

test('keeps snapshot read-only', async () => {
  const result = await run("DELETE FROM anonymous_installations WHERE origin = 'hakhoi' RETURNING origin");
  assert.match(result.error, /readonly|read-only/i);
  const followup = await run('SELECT COUNT(*) AS total FROM anonymous_installations');
  assert.equal(followup.rows[0].total, 2);
});

test('normalizes blobs and long cells for JSON', async () => {
  const result = await run("SELECT zeroblob(4) AS bytes, printf('%25000s', 'x') AS long_text");
  assert.equal(result.rows[0].bytes, '[BLOB: 4 bytes]');
  assert.match(result.rows[0].long_text, /\[đã cắt ngắn\]$/);
});

test('reports missing snapshot', async () => {
  const result = await run('SELECT 1', 'missing');
  assert.match(result.error, /Chưa có snapshot missing/);
});
