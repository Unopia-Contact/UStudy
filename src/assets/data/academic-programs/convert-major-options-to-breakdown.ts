type MajorBranch = {
  type?: string;
  name?: string;
  [key: string]: unknown;
};

type MajorCategory = {
  breakdown?: Record<string, MajorBranch>;
  options?: MajorBranch[];
};

function toMajorBranchKey(option: MajorBranch, index: number): string {
  const source = option.type || option.name || `OPTION_${index + 1}`;
  const normalized = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

  return normalized.startsWith('MAJOR_') ? normalized : `MAJOR_${normalized}`;
}

/** Converts K23 specialization alternatives to the canonical MAJOR_* breakdown schema. */
export function convertMajorOptionsToBreakdown<T extends MajorCategory>(major: T): T {
  if (!Array.isArray(major.options) || major.options.length === 0) return major;

  const breakdown = { ...(major.breakdown ?? {}) };
  major.options.forEach((option, index) => {
    const baseKey = toMajorBranchKey(option, index);
    let key = baseKey;
    let suffix = 2;
    while (key in breakdown) {
      key = `${baseKey}_${suffix}`;
      suffix += 1;
    }
    breakdown[key] = option;
  });

  major.breakdown = breakdown;
  delete major.options;
  return major;
}
