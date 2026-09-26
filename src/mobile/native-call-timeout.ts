export class NativeCallTimeoutError extends Error {
  readonly operation: string;
  readonly timeoutMs: number;

  constructor(operation: string, timeoutMs: number) {
    super(`Native call "${operation}" did not respond within ${timeoutMs} ms.`);
    this.name = 'NativeCallTimeoutError';
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

export function withNativeCallTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new NativeCallTimeoutError(operation, timeoutMs));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}
