import {
  ANALYTICS_STORAGE_KEYS,
  clearPrivateAnalyticsStorage,
  getOrCreateInstallationId,
  isAnonymousAnalyticsEnabled,
  setAnonymousAnalyticsEnabled,
} from './analytics-storage';

const PRODUCTION_HOSTS = new Set([
  'ustudy.hakhoi.io.vn',
  'ustudy.unopia.io.vn',
]);

const ANALYTICS_ENDPOINT = '/api/analytics/installation';

type AnalyticsDependencies = {
  storage?: Storage;
  fetcher?: typeof fetch;
  hostname?: string;
  now?: Date;
  appVersion?: string;
};

export type AnalyticsDeletionResult = 'deleted' | 'pending' | 'nothing-to-delete' | 'unsupported-origin';

export function getVietnamDay(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isAnalyticsOriginSupported(hostname: string): boolean {
  return PRODUCTION_HOSTS.has(hostname.toLowerCase());
}

async function sendDeletion(installationId: string, fetcher: typeof fetch): Promise<boolean> {
  const response = await fetcher(ANALYTICS_ENDPOINT, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ installationId }),
    credentials: 'same-origin',
    cache: 'no-store',
  });
  return response.ok;
}

export async function flushPendingAnalyticsDeletion({
  storage = localStorage,
  fetcher = fetch,
  hostname = window.location.hostname,
}: AnalyticsDependencies = {}): Promise<AnalyticsDeletionResult> {
  const pendingId = storage.getItem(ANALYTICS_STORAGE_KEYS.pendingDeletionId);
  if (!pendingId) return 'nothing-to-delete';
  if (!isAnalyticsOriginSupported(hostname)) return 'unsupported-origin';

  try {
    if (!await sendDeletion(pendingId, fetcher)) return 'pending';
    clearPrivateAnalyticsStorage(storage);
    return 'deleted';
  } catch {
    return 'pending';
  }
}

export async function sendDailyAnalyticsHeartbeat({
  storage = localStorage,
  fetcher = fetch,
  hostname = window.location.hostname,
  now = new Date(),
  appVersion = __APP_VERSION__,
}: AnalyticsDependencies = {}): Promise<boolean> {
  if (!isAnalyticsOriginSupported(hostname)) return false;

  const deletionResult = await flushPendingAnalyticsDeletion({ storage, fetcher, hostname });
  if (deletionResult === 'pending' || deletionResult === 'deleted') return false;
  if (!isAnonymousAnalyticsEnabled(storage)) return false;

  const today = getVietnamDay(now);
  if (storage.getItem(ANALYTICS_STORAGE_KEYS.lastHeartbeatDay) === today) return true;

  const installationId = getOrCreateInstallationId(storage);
  try {
    const response = await fetcher(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installationId, appVersion, clientKind: 'web' }),
      credentials: 'same-origin',
      cache: 'no-store',
      keepalive: true,
    });
    if (!response.ok) return false;
    storage.setItem(ANALYTICS_STORAGE_KEYS.lastHeartbeatDay, today);
    return true;
  } catch {
    return false;
  }
}

export async function deleteAnonymousAnalyticsInstallation({
  storage = localStorage,
  fetcher = fetch,
  hostname = window.location.hostname,
}: AnalyticsDependencies = {}): Promise<AnalyticsDeletionResult> {
  setAnonymousAnalyticsEnabled(false, storage);
  const installationId = storage.getItem(ANALYTICS_STORAGE_KEYS.installationId);
  if (!installationId) {
    clearPrivateAnalyticsStorage(storage);
    return 'nothing-to-delete';
  }

  storage.setItem(ANALYTICS_STORAGE_KEYS.pendingDeletionId, installationId);
  if (!isAnalyticsOriginSupported(hostname)) {
    clearPrivateAnalyticsStorage(storage);
    return 'unsupported-origin';
  }

  try {
    if (!await sendDeletion(installationId, fetcher)) return 'pending';
    clearPrivateAnalyticsStorage(storage);
    return 'deleted';
  } catch {
    return 'pending';
  }
}
