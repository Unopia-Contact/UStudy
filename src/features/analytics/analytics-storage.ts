import { STORAGE_KEYS } from '../../config/storageKeys';

export const ANALYTICS_STORAGE_KEYS = {
  enabled: STORAGE_KEYS.ANONYMOUS_ANALYTICS_ENABLED,
  noticeSeen: STORAGE_KEYS.ANONYMOUS_ANALYTICS_NOTICE_SEEN,
  installationId: 'ustudy_analytics_installation_id_v1',
  lastHeartbeatDay: 'ustudy_analytics_last_heartbeat_day_v1',
  pendingDeactivationId: 'ustudy_analytics_pending_deactivation_v1',
  legacyPendingDeletionId: 'ustudy_analytics_pending_deletion_v1',
} as const;

const PRIVATE_ANALYTICS_KEYS = new Set<string>([
  ANALYTICS_STORAGE_KEYS.installationId,
  ANALYTICS_STORAGE_KEYS.lastHeartbeatDay,
  ANALYTICS_STORAGE_KEYS.pendingDeactivationId,
  ANALYTICS_STORAGE_KEYS.legacyPendingDeletionId,
]);

const ALL_ANALYTICS_KEYS = new Set<string>(Object.values(ANALYTICS_STORAGE_KEYS));

export function isAnalyticsStorageKey(key: string): boolean {
  return ALL_ANALYTICS_KEYS.has(key);
}

export function isPrivateAnalyticsStorageKey(key: string): boolean {
  return PRIVATE_ANALYTICS_KEYS.has(key);
}

export function isAnonymousAnalyticsEnabled(storage: Storage = localStorage): boolean {
  return storage.getItem(ANALYTICS_STORAGE_KEYS.enabled) !== 'false';
}

export function setAnonymousAnalyticsEnabled(enabled: boolean, storage: Storage = localStorage): void {
  storage.setItem(ANALYTICS_STORAGE_KEYS.enabled, String(enabled));
  window.dispatchEvent(new CustomEvent('ustudy:analytics-preference-change', { detail: { enabled } }));
}

export function getOrCreateInstallationId(storage: Storage = localStorage): string {
  const current = storage.getItem(ANALYTICS_STORAGE_KEYS.installationId);
  if (current) return current;

  const installationId = crypto.randomUUID();
  storage.setItem(ANALYTICS_STORAGE_KEYS.installationId, installationId);
  return installationId;
}

export function getPendingAnalyticsDeactivationId(storage: Storage = localStorage): string | null {
  const current = storage.getItem(ANALYTICS_STORAGE_KEYS.pendingDeactivationId);
  if (current) return current;

  const legacy = storage.getItem(ANALYTICS_STORAGE_KEYS.legacyPendingDeletionId);
  if (!legacy) return null;
  storage.setItem(ANALYTICS_STORAGE_KEYS.pendingDeactivationId, legacy);
  storage.removeItem(ANALYTICS_STORAGE_KEYS.legacyPendingDeletionId);
  return legacy;
}

export function clearPrivateAnalyticsStorage(storage: Storage = localStorage): void {
  storage.removeItem(ANALYTICS_STORAGE_KEYS.installationId);
  storage.removeItem(ANALYTICS_STORAGE_KEYS.lastHeartbeatDay);
  storage.removeItem(ANALYTICS_STORAGE_KEYS.pendingDeactivationId);
  storage.removeItem(ANALYTICS_STORAGE_KEYS.legacyPendingDeletionId);
}
