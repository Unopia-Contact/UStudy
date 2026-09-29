import { describe, expect, it } from 'vitest';
import { getCoverCrop } from '../../../src/features/schedule-image/schedule-image-background';

describe('getCoverCrop', () => {
  it('crops the sides of a landscape image for a portrait phone export', () => {
    expect(getCoverCrop(4000, 2000, 1080, 1920)).toEqual({
      x: 1437.5, y: 0, width: 1125, height: 2000,
    });
  });

  it('crops the top and bottom of a portrait image for a landscape export', () => {
    expect(getCoverCrop(2000, 4000, 1920, 1080)).toEqual({
      x: 0, y: 1437.5, width: 2000, height: 1125,
    });
  });

  it('keeps an image with the same aspect ratio unchanged', () => {
    expect(getCoverCrop(1920, 1080, 1080, 607.5)).toEqual({
      x: 0, y: 0, width: 1920, height: 1080,
    });
  });

  it('rejects images without valid dimensions', () => {
    expect(() => getCoverCrop(0, 2000, 1080, 1920)).toThrow();
  });
});
