type GraduationOption = {
  type?: string;
  name?: string;
  note?: string;
  courses?: string[];
  [key: string]: unknown;
};

type GraduationBranch = {
  options?: GraduationOption[];
};

type GraduationCategory = {
  breakdown?: Record<string, GraduationBranch>;
  options?: GraduationOption[];
};

function mergedOptionName(option: GraduationOption, optionCount: number): string | undefined {
  if (optionCount === 1) return option.name;

  const phase = option.name?.match(/Phương án.+$/i)?.[0];
  if (phase) return phase;

  if (option.type === 'THESIS') return 'Phương án 1 - Khóa luận tốt nghiệp';
  if (option.type === 'PROJECT') return 'Phương án 2 - Đồ án tốt nghiệp và học phần';
  return option.name;
}

/**
 * Flattens duplicated per-specialization graduation branches into shared options.
 * Course lists are unioned by option type so no graduation course is discarded.
 */
export function mergeGraduationOptions<T extends GraduationCategory>(graduation: T): T {
  const branchOptions = Object.values(graduation.breakdown ?? {})
    .flatMap((branch) => branch.options ?? []);
  const sourceOptions = branchOptions.length > 0 ? branchOptions : graduation.options ?? [];
  const optionKeys = sourceOptions.map((option, index) => option.type || option.name || `option-${index}`);
  const hasDuplicateOptions = new Set(optionKeys).size < optionKeys.length;

  if (branchOptions.length === 0 && !hasDuplicateOptions) return graduation;

  const groupedOptions = new Map<string, GraduationOption[]>();
  sourceOptions.forEach((option, index) => {
    const key = option.type || option.name || `option-${index}`;
    groupedOptions.set(key, [...(groupedOptions.get(key) ?? []), option]);
  });

  const options = Array.from(groupedOptions.values()).map((group) => {
    const base = group.reduce((best, option) => (
      (option.courses?.length ?? 0) > (best.courses?.length ?? 0) ? option : best
    ));
    const courses = Array.from(new Set(group.flatMap((option) => option.courses ?? [])));

    return {
      ...base,
      name: mergedOptionName(base, group.length),
      courses,
    };
  });

  const merged = graduation as GraduationCategory;
  merged.options = options;
  delete merged.breakdown;
  return graduation;
}
