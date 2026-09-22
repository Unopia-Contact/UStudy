import { describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../../setup/test-environment';
import {
  ANALYTICS_STORAGE_KEYS,
  isAnalyticsStorageKey,
  isAnonymousAnalyticsEnabled,
  isPrivateAnalyticsStorageKey,
  setAnonymousAnalyticsEnabled,
} from '../../../src/features/analytics/analytics-storage';
import {
  deleteAnonymousAnalyticsInstallation,
  getVietnamDay,
  sendDailyAnalyticsHeartbeat,
} from '../../../src/features/analytics/installation-analytics';
import { isManagedStorageKey } from '../../../src/features/settings/services/system-backup';

const INSTALLATION_ID = '9d574337-f37d-4fb7-b24f-f8c181756a58';

describe('anonymous installation analytics client', () => {
  it('is enabled by default and stores the preference separately from the private ID', () => {
    const storage = new MemoryStorage();
    expect(isAnonymousAnalyticsEnabled(storage)).toBe(true);

    setAnonymousAnalyticsEnabled(false, storage);
    expect(isAnonymousAnalyticsEnabled(storage)).toBe(false);
    expect(isManagedStorageKey(ANALYTICS_STORAGE_KEYS.enabled)).toBe(true);
    expect(isManagedStorageKey(ANALYTICS_STORAGE_KEYS.installationId)).toBe(false);
    expect(isPrivateAnalyticsStorageKey(ANALYTICS_STORAGE_KEYS.installationId)).toBe(true);
    expect(isAnalyticsStorageKey(ANALYTICS_STORAGE_KEYS.enabled)).toBe(true);
    expect(isAnalyticsStorageKey(ANALYTICS_STORAGE_KEYS.installationId)).toBe(true);
  });

  it('sends at most one successful heartbeat per Vietnam day', async () => {
    const storage = new MemoryStorage();
    storage.setItem(ANALYTICS_STORAGE_KEYS.installationId, INSTALLATION_ID);
    const fetcher = vi.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    const now = new Date('2026-09-22T05:00:00.000Z');

    await expect(sendDailyAnalyticsHeartbeat({
      storage,
      fetcher,
      hostname: 'ustudy.hakhoi.io.vn',
      appVersion: '0.1.0',
      now,
    })).resolves.toBe(true);
    await expect(sendDailyAnalyticsHeartbeat({
      storage,
      fetcher,
      hostname: 'ustudy.hakhoi.io.vn',
      appVersion: '0.1.0',
      now,
    })).resolves.toBe(true);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(storage.getItem(ANALYTICS_STORAGE_KEYS.lastHeartbeatDay)).toBe(getVietnamDay(now));
  });

  it('does not create an ID or send data when disabled', async () => {
    const storage = new MemoryStorage();
    storage.setItem(ANALYTICS_STORAGE_KEYS.enabled, 'false');
    const fetcher = vi.fn() as unknown as typeof fetch;

    await expect(sendDailyAnalyticsHeartbeat({
      storage,
      fetcher,
      hostname: 'ustudy.unopia.io.vn',
      appVersion: '0.1.0',
    })).resolves.toBe(false);

    expect(fetcher).not.toHaveBeenCalled();
    expect(storage.getItem(ANALYTICS_STORAGE_KEYS.installationId)).toBeNull();
  });

  it('disables analytics and removes the local ID after server deletion succeeds', async () => {
    const storage = new MemoryStorage();
    storage.setItem(ANALYTICS_STORAGE_KEYS.installationId, INSTALLATION_ID);
    storage.setItem(ANALYTICS_STORAGE_KEYS.lastHeartbeatDay, '2026-09-22');
    const fetcher = vi.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;

    await expect(deleteAnonymousAnalyticsInstallation({
      storage,
      fetcher,
      hostname: 'ustudy.hakhoi.io.vn',
    })).resolves.toBe('deleted');

    expect(isAnonymousAnalyticsEnabled(storage)).toBe(false);
    expect(storage.getItem(ANALYTICS_STORAGE_KEYS.installationId)).toBeNull();
    expect(storage.getItem(ANALYTICS_STORAGE_KEYS.lastHeartbeatDay)).toBeNull();
    expect(fetcher).toHaveBeenCalledWith('/api/analytics/installation', expect.objectContaining({ method: 'DELETE' }));
  });

  it('keeps a pending deletion ID when the request fails', async () => {
    const storage = new MemoryStorage();
    storage.setItem(ANALYTICS_STORAGE_KEYS.installationId, INSTALLATION_ID);
    const fetcher = vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;

    await expect(deleteAnonymousAnalyticsInstallation({
      storage,
      fetcher,
      hostname: 'ustudy.hakhoi.io.vn',
    })).resolves.toBe('pending');

    expect(storage.getItem(ANALYTICS_STORAGE_KEYS.pendingDeletionId)).toBe(INSTALLATION_ID);
    expect(isAnonymousAnalyticsEnabled(storage)).toBe(false);
  });
});
