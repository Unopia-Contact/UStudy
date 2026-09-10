import { afterEach, beforeEach, vi } from 'vitest';
import { clearSecureCache } from '../../src/helpers/localStorage/save';

beforeEach(() => {
  clearSecureCache();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('AUDIT_NETWORK_DISABLED'); }));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearSecureCache();
});
