import type { WorkerEnv } from './types';

const ALLOWED_HOSTS = new Set([
  'ustudy.hakhoi.io.vn',
  'ustudy.unopia.io.vn',
]);
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 1024;

type AnalyticsPayload = {
  installationId: string;
  appVersion?: string;
  clientKind?: string;
};

function response(status: number, body?: { error: string }): Response {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      ...(body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function getVietnamDay(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readPayload(request: Request): Promise<AnalyticsPayload | null> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) return null;

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return null;
  try {
    const parsed = JSON.parse(text) as Partial<AnalyticsPayload>;
    if (typeof parsed.installationId !== 'string' || !UUID_V4_PATTERN.test(parsed.installationId)) return null;
    if (parsed.appVersion !== undefined && (typeof parsed.appVersion !== 'string' || parsed.appVersion.length > 32)) return null;
    if (parsed.clientKind !== undefined && parsed.clientKind !== 'web') return null;
    return {
      installationId: parsed.installationId,
      appVersion: parsed.appVersion?.trim() || 'unknown',
      clientKind: parsed.clientKind || 'web',
    };
  } catch {
    return null;
  }
}

async function applyRateLimits(request: Request, installationHash: string, env: WorkerEnv): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await sha256(`ip:${ip}`);
  const [installationLimit, ipLimit] = await Promise.all([
    env.ANALYTICS_ID_RATE_LIMITER?.limit({ key: installationHash }),
    env.ANALYTICS_IP_RATE_LIMITER?.limit({ key: ipHash }),
  ]);
  return installationLimit?.success !== false && ipLimit?.success !== false;
}

export async function handleAnalyticsRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const localAllowed = env.ANALYTICS_ALLOW_LOCAL === 'true' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase()) && !localAllowed) {
    return response(403, { error: 'Origin not allowed' });
  }
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return response(405, { error: 'Method not allowed' });
  }
  if (request.method === 'POST' && env.ANALYTICS_ENABLED !== 'true') return response(204);
  if (!env.ANALYTICS_DB) return response(503, { error: 'Analytics unavailable' });

  const payload = await readPayload(request);
  if (!payload) return response(400, { error: 'Invalid request' });

  const installationHash = await sha256(`ustudy-installation-v1:${payload.installationId}`);
  if (!await applyRateLimits(request, installationHash, env)) {
    return response(429, { error: 'Too many requests' });
  }

  try {
    const day = getVietnamDay();

    if (request.method === 'DELETE') {
      const result = await env.ANALYTICS_DB.prepare(`
        UPDATE anonymous_installations
        SET deleted_day = ?2
        WHERE installation_hash = ?1
          AND deleted_day IS NULL
      `).bind(installationHash, day).run();
      return result.success ? response(204) : response(503, { error: 'Analytics unavailable' });
    }

    const origin = localAllowed ? 'ustudy.hakhoi.io.vn' : url.hostname.toLowerCase();
    const installationStatement = env.ANALYTICS_DB.prepare(`
      INSERT INTO anonymous_installations (
        installation_hash, origin, first_seen_day, last_seen_day, app_version, client_kind
      ) VALUES (?1, ?2, ?3, ?3, ?4, ?5)
      ON CONFLICT(installation_hash) DO UPDATE SET
        last_seen_day = excluded.last_seen_day,
        app_version = excluded.app_version,
        client_kind = excluded.client_kind
      WHERE anonymous_installations.deleted_day IS NULL
        AND (
          anonymous_installations.last_seen_day < excluded.last_seen_day
          OR anonymous_installations.app_version <> excluded.app_version
          OR anonymous_installations.client_kind <> excluded.client_kind
        )
    `).bind(
      installationHash,
      origin,
      day,
      payload.appVersion || 'unknown',
      payload.clientKind || 'web',
    );
    const activityStatement = env.ANALYTICS_DB.prepare(`
      INSERT OR IGNORE INTO installation_activity_days (installation_hash, active_day)
      SELECT ?1, ?2
      WHERE EXISTS (
        SELECT 1
        FROM anonymous_installations
        WHERE installation_hash = ?1
          AND deleted_day IS NULL
      )
    `).bind(installationHash, day);
    const results = await env.ANALYTICS_DB.batch([installationStatement, activityStatement]);
    return results.every((result) => result.success)
      ? response(204)
      : response(503, { error: 'Analytics unavailable' });
  } catch {
    console.error('[analytics] D1 operation failed');
    return response(503, { error: 'Analytics unavailable' });
  }
}

export const analyticsInternals = {
  getVietnamDay,
  sha256,
};
