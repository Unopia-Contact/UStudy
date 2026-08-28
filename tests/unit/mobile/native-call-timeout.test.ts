import { describe, expect, it, vi } from 'vitest';
import { NativeCallTimeoutError, withNativeCallTimeout } from '../../../src/mobile/native-call-timeout';

describe('withNativeCallTimeout', () => {
  it('returns the native result when the call resolves', async () => {
    await expect(withNativeCallTimeout(Promise.resolve('granted'), 100, 'permission')).resolves.toBe('granted');
  });

  it('rejects instead of leaving the UI waiting forever', async () => {
    vi.useFakeTimers();
    const pending = withNativeCallTimeout(new Promise<never>(() => undefined), 8_000, 'permission');
    const expectation = expect(pending).rejects.toEqual(expect.objectContaining({
      name: 'NativeCallTimeoutError',
      operation: 'permission',
      timeoutMs: 8_000,
    }));

    await vi.advanceTimersByTimeAsync(8_000);
    await expectation;
    expect(new NativeCallTimeoutError('permission', 8_000)).toBeInstanceOf(Error);
    vi.useRealTimers();
  });
});
