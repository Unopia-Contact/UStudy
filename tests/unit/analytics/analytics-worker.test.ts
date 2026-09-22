import { describe, expect, it } from 'vitest';
import { handleAnalyticsRequest } from '../../../worker/analytics';
import type { D1PreparedStatement, WorkerEnv } from '../../../worker/types';

const INSTALLATION_ID = '9d574337-f37d-4fb7-b24f-f8c181756a58';

class FakeDatabase {
  calls: Array<{ query: string; values: unknown[] }> = [];
  batchCalls: D1PreparedStatement[][] = [];
  failBatch = false;

  prepare(query: string): D1PreparedStatement {
    const call = { query, values: [] as unknown[] };
    this.calls.push(call);
    const statement: D1PreparedStatement = {
      bind: (...values: unknown[]) => {
        call.values = values;
        return statement;
      },
      run: async () => ({ success: true }),
    };
    return statement;
  }

  async batch(statements: D1PreparedStatement[]) {
    this.batchCalls.push(statements);
    if (this.failBatch) throw new Error('batch failed');
    return statements.map(() => ({ success: true }));
  }
}

function createEnv(database = new FakeDatabase()): WorkerEnv & { ANALYTICS_DB: FakeDatabase } {
  return {
    ASSETS: { fetch: async () => new Response('asset') },
    ANALYTICS_DB: database,
    ANALYTICS_ENABLED: 'true',
    ANALYTICS_ID_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ANALYTICS_IP_RATE_LIMITER: { limit: async () => ({ success: true }) },
  };
}

function analyticsRequest(method: 'POST' | 'DELETE', hostname = 'ustudy.hakhoi.io.vn'): Request {
  return new Request(`https://${hostname}/api/analytics/installation`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '203.0.113.1',
    },
    body: JSON.stringify({ installationId: INSTALLATION_ID, appVersion: '0.1.0', clientKind: 'web' }),
  });
}

describe('anonymous installation analytics Worker', () => {
  it('rejects unknown hosts before accessing D1', async () => {
    const env = createEnv();
    const result = await handleAnalyticsRequest(analyticsRequest('POST', 'example.com'), env);
    expect(result.status).toBe(403);
    expect(env.ANALYTICS_DB.calls).toHaveLength(0);
  });

  it('stores only a SHA-256 hash of the installation ID', async () => {
    const env = createEnv();
    const result = await handleAnalyticsRequest(analyticsRequest('POST'), env);
    expect(result.status).toBe(204);
    expect(env.ANALYTICS_DB.calls).toHaveLength(2);
    expect(env.ANALYTICS_DB.batchCalls).toHaveLength(1);
    const [installationHash, origin] = env.ANALYTICS_DB.calls[0].values;
    expect(installationHash).toMatch(/^[0-9a-f]{64}$/);
    expect(installationHash).not.toBe(INSTALLATION_ID);
    expect(origin).toBe('ustudy.hakhoi.io.vn');
    expect(env.ANALYTICS_DB.calls.flatMap((call) => call.values)).not.toContain(INSTALLATION_ID);
    expect(env.ANALYTICS_DB.calls[0].query).toContain('anonymous_installations.deleted_day IS NULL');
    expect(env.ANALYTICS_DB.calls[1].query).toContain('INSERT OR IGNORE INTO installation_activity_days');
    expect(env.ANALYTICS_DB.calls[1].query).toContain('deleted_day IS NULL');
  });

  it('soft-deletes by the same hash without removing history or storing the raw ID', async () => {
    const env = createEnv();
    const result = await handleAnalyticsRequest(analyticsRequest('DELETE'), env);
    expect(result.status).toBe(204);
    expect(env.ANALYTICS_DB.calls[0].query).toContain('UPDATE anonymous_installations');
    expect(env.ANALYTICS_DB.calls[0].query).toContain('SET deleted_day');
    expect(env.ANALYTICS_DB.calls[0].query).not.toMatch(/DELETE\s+FROM/i);
    expect(env.ANALYTICS_DB.calls[0].values[0]).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns unavailable when the transactional heartbeat batch fails', async () => {
    const database = new FakeDatabase();
    database.failBatch = true;
    const result = await handleAnalyticsRequest(analyticsRequest('POST'), createEnv(database));
    expect(result.status).toBe(503);
  });

  it('fails closed for malformed IDs and disabled heartbeat collection', async () => {
    const env = createEnv();
    const invalid = new Request('https://ustudy.unopia.io.vn/api/analytics/installation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installationId: 'student-id' }),
    });
    expect((await handleAnalyticsRequest(invalid, env)).status).toBe(400);

    env.ANALYTICS_ENABLED = 'false';
    expect((await handleAnalyticsRequest(analyticsRequest('POST'), env)).status).toBe(204);
    expect(env.ANALYTICS_DB.calls).toHaveLength(0);
  });
});
