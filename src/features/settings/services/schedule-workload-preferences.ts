import { STORAGE_KEYS } from '../../../config';
import type { AcademicRuleContext } from '../../../domain/academic-rules';
import type { UserWorkloadOverride } from '../../../domain/schedule-workload';
import { readPlain, savePlain } from '../../../helpers/localStorage/save';

export const SCHEDULE_WORKLOAD_OVERRIDES_EVENT = 'ustudy:schedule-workload-overrides';

export interface ScheduleWorkloadOverrideStoreV1 {
  version: 1;
  programOverrides: Record<string, Record<string, UserWorkloadOverride>>;
}

const EMPTY_STORE: ScheduleWorkloadOverrideStoreV1 = {
  version: 1,
  programOverrides: {},
};

function normalizeId(value: unknown): string {
  return String(value ?? '').trim().toLowerCase() || 'all';
}

function normalizeCourseId(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

export function getScheduleWorkloadProgramKey(context: AcademicRuleContext): string {
  return [context.campusId, context.cohortId, context.facultyId, context.majorId]
    .map(normalizeId)
    .join('|');
}

export function readScheduleWorkloadOverrideStore(): ScheduleWorkloadOverrideStoreV1 {
  const stored = readPlain<Partial<ScheduleWorkloadOverrideStoreV1> | null>(
    STORAGE_KEYS.SCHEDULE_WORKLOAD_OVERRIDES,
    null,
  );
  if (stored?.version !== 1 || !stored.programOverrides || typeof stored.programOverrides !== 'object') {
    return EMPTY_STORE;
  }
  return { version: 1, programOverrides: stored.programOverrides };
}

export function getProgramScheduleWorkloadOverrides(
  context: AcademicRuleContext,
  store = readScheduleWorkloadOverrideStore(),
): Record<string, UserWorkloadOverride> {
  return store.programOverrides[getScheduleWorkloadProgramKey(context)] ?? {};
}

export function saveProgramScheduleWorkloadOverrides(
  context: AcademicRuleContext,
  overrides: Record<string, UserWorkloadOverride>,
): void {
  const store = readScheduleWorkloadOverrideStore();
  const key = getScheduleWorkloadProgramKey(context);
  const normalizedOverrides = Object.fromEntries(
    Object.entries(overrides)
      .map(([courseId, override]) => [normalizeCourseId(courseId), override] as const)
      .filter(([courseId]) => Boolean(courseId)),
  );
  const programOverrides = { ...store.programOverrides };
  if (Object.keys(normalizedOverrides).length > 0) programOverrides[key] = normalizedOverrides;
  else delete programOverrides[key];

  savePlain<ScheduleWorkloadOverrideStoreV1>(STORAGE_KEYS.SCHEDULE_WORKLOAD_OVERRIDES, {
    version: 1,
    programOverrides,
  });
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SCHEDULE_WORKLOAD_OVERRIDES_EVENT));
}
