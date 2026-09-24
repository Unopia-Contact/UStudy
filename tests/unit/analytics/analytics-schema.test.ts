import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

async function readProjectFile(path: string) {
  return readFile(resolve(process.cwd(), path), 'utf8');
}

describe('anonymous analytics D1 schema', () => {
  it('adds soft deletion and one activity row per installation per day', async () => {
    const migration = await readProjectFile('migrations/0002_installation_activity_days.sql');

    expect(migration).toContain('ADD COLUMN deleted_day TEXT DEFAULT NULL');
    expect(migration).toContain('PRIMARY KEY (installation_hash, active_day)');
    expect(migration).toContain('ON DELETE RESTRICT');
    expect(migration).not.toContain('ON DELETE CASCADE');
    expect(migration).toContain('idx_installation_activity_day');
  });

  it('backfills only the activity dates proven by the previous summary table', async () => {
    const migration = await readProjectFile('migrations/0002_installation_activity_days.sql');

    expect(migration).toContain('SELECT installation_hash, first_seen_day');
    expect(migration).toContain('SELECT installation_hash, last_seen_day');
    expect(migration.match(/INSERT OR IGNORE INTO installation_activity_days/g)).toHaveLength(2);
  });

  it('derives usage reports from activity history', async () => {
    const [summary, history, retention] = await Promise.all([
      readProjectFile('scripts/sql/analytics-report.sql'),
      readProjectFile('scripts/sql/analytics-dau-history.sql'),
      readProjectFile('scripts/sql/analytics-retention.sql'),
    ]);

    expect(summary).toContain('installation_activity_days');
    expect(summary).toContain('deactivated_installations');
    expect(history).toContain('GROUP BY i.origin, a.active_day');
    expect(retention).toContain('retention_d30_percent');
  });
});
