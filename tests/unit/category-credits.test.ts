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

  it('uses the largest alternative when MAJOR selects one specialization', () => {
    expect(getProgramRequiredCredits({
      GENERAL_EDUCATION: { total_credits_required: 51 },
      FOUNDATION: { total_credits_required: 40 },
      MAJOR: {
        options: [
          { credits: 27 },
          { credits: 28 },
        ],
      },
      GRADUATION: { total_credits_required: 10 },
    })).toBe(129);
  });

  it('uses the largest MAJOR branch without summing mutually exclusive specializations', () => {
    expect(getProgramRequiredCredits({
      GENERAL_EDUCATION: { total_credits_required: 53 },
      FOUNDATION: { total_credits_required: 51 },
      MAJOR: {
        breakdown: {
          MAJOR_A: { total_credits_required: 18 },
          MAJOR_B: { total_credits_required: 21 },
        },
      },
      GRADUATION: { total_credits_required: 10 },
    })).toBe(135);
  });
});
