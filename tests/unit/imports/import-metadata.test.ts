import { describe, expect, it } from 'vitest';

import { mergeImportMetadata } from '../../../src/logic/import-metadata';

describe('import metadata', () => {
  it('updates timestamps only for sources included in the import', () => {
    const merged = mergeImportMetadata(
      {
        scrapedAt: '2026-01-01T00:00:00.000Z',
        params: { registration: { year: '2025-2026', sem: 3 }, exam: { sem: 3 }, keep: true },
        sourceUpdatedAt: { grades: '2026-01-01T00:00:00.000Z' },
      },
      {
        scrapedAt: '2026-08-24T00:00:00.000Z',
        params: { registration: { year: '2026-2027', sem: 1 }, exam: { sem: 1 }, keep: null },
      },
      ['registrations'],
    );

    expect(merged?.sourceUpdatedAt).toEqual({
      grades: '2026-01-01T00:00:00.000Z',
      registrations: '2026-08-24T00:00:00.000Z',
    });
    expect(merged?.params).toEqual({
      registration: { year: '2026-2027', sem: 1 },
      exam: { sem: 3 },
      keep: true,
    });
  });

  it('keeps an undated legacy import undated', () => {
    expect(mergeImportMetadata(null, {}, ['grades'])?.sourceUpdatedAt?.grades).toBeUndefined();
  });
});
