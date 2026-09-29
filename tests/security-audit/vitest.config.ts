import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup/test-environment.ts', './tests/security-audit/setup.ts'],
    include: ['tests/security-audit/*.test.ts'],
    testTimeout: 15000,
    fileParallelism: false,
  },
});
