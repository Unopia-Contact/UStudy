import { describe, expect, it } from 'vitest';
import { getProgramRequiredCredits } from '../../src/assets/data/academic-programs/category-credits';

describe('getProgramRequiredCredits', () => {
  it('sums required credits from top-level categories only', () => {
    expect(getProgramRequiredCredits({
      GENERAL: {
        total_credits_required: 56,
      },
      FOUNDATION: {
        credits_required: 30,
      },
      MAJOR: {
        credits: 52,
      },
      MASTER_TRANSITION: {
        total_credits_required: 12,
      },
    })).toBe(138);
  });

  it('does not use an arbitrary fallback when program data is unavailable', () => {
    expect(getProgramRequiredCredits(undefined)).toBe(0);
  });
});
