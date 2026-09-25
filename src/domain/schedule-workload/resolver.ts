import { normalizeAcademicCourseId, resolveAcademicWorkloadRule } from '../academic-rules';
import type {
  ResolveCourseWorkloadInput,
  ResolvedComponentWorkload,
  ResolvedCourseWorkload,
  ScheduleComponentType,
  UserWorkloadOverride,
  UserWorkloadOverrideMode,
  WorkloadHourSource,
  WorkloadRuleSource,
} from './types';

const SOURCE_BY_COMPONENT: Record<ScheduleComponentType, WorkloadHourSource> = {
  LT: 'theory',
  TH: 'lab',
  BT: 'exercise',
};

export function normalizeScheduleComponentType(value: unknown): ScheduleComponentType | null {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === 'LT' || normalized === 'TH' || normalized === 'BT') return normalized;
  return null;
}

function toNonNegativeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function resolveSources(sources: WorkloadHourSource[], hours: Record<WorkloadHourSource, number>): number {
  return sources.reduce((total, source) => total + hours[source], 0);
}

function modeSources(mode: UserWorkloadOverrideMode): WorkloadHourSource[] {
  if (mode === 'lt_plus_lab') return ['theory', 'lab'];
  if (mode === 'lt_plus_exercise') return ['theory', 'exercise'];
  if (mode === 'lab_as_lt') return ['lab'];
  if (mode === 'exercise_as_lt') return ['exercise'];
  return ['theory'];
}

function componentWorkload(
  component: ScheduleComponentType,
  mode: UserWorkloadOverrideMode,
  source: WorkloadRuleSource,
  hours: Record<WorkloadHourSource, number>,
  userOverride?: UserWorkloadOverride,
): ResolvedComponentWorkload {
  if (component !== 'LT' || mode === 'separate') {
    const sources = [SOURCE_BY_COMPONENT[component]];
    return {
      requiredPeriods: resolveSources(sources, hours),
      sources,
      appliedMode: component === 'LT' ? mode : 'separate',
      ruleSource: component === 'LT' ? source : 'default',
    };
  }

  if (mode === 'custom') {
    const sources: WorkloadHourSource[] = userOverride?.customSources?.length
      ? userOverride.customSources
      : ['theory'];
    const customHours = toNonNegativeNumber(userOverride?.customHours);
    return {
      requiredPeriods: customHours || resolveSources(sources, hours),
      sources,
      appliedMode: mode,
      ruleSource: 'user',
    };
  }

  const sources = modeSources(mode);
  return {
    requiredPeriods: resolveSources(sources, hours),
    sources,
    appliedMode: mode,
    ruleSource: source,
  };
}

export function resolveCourseWorkload({
  courseId,
  registrations,
  courseMeta,
  academicContext = {},
  userOverride,
}: ResolveCourseWorkloadInput): ResolvedCourseWorkload {
  const normalizedCourseId = normalizeAcademicCourseId(courseId);
  const warnings: ResolvedCourseWorkload['warnings'] = [];
  const presentComponents = new Set<ScheduleComponentType>();

  registrations.forEach((registration) => {
    const rawCourseType = String(registration.courseType ?? '').trim();
    const component = normalizeScheduleComponentType(registration.courseType);
    if (component) presentComponents.add(component);
    else if (!rawCourseType) presentComponents.add('LT');
    else warnings.push({
      code: 'registration_type_unknown',
      message: `Không nhận diện được loại lớp của môn ${normalizedCourseId}.`,
    });
  });

  if (!courseMeta) warnings.push({
    code: 'course_metadata_missing',
    message: `Không tìm thấy số tiết trong chương trình đào tạo cho môn ${normalizedCourseId}.`,
  });

  const hours: Record<WorkloadHourSource, number> = {
    theory: toNonNegativeNumber(courseMeta?.theory_hours),
    lab: toNonNegativeNumber(courseMeta?.lab_hours),
    exercise: toNonNegativeNumber(courseMeta?.exercise_hours),
  };
  const academicRule = resolveAcademicWorkloadRule(normalizedCourseId, academicContext);

  let mode: UserWorkloadOverrideMode = userOverride?.mode ?? academicRule?.mode ?? 'separate';
  let source: WorkloadRuleSource = userOverride ? 'user' : academicRule ? 'academic_rule' : 'default';
  const conflictsWithSeparateComponent = !userOverride && (
    (mode === 'lt_plus_lab' && presentComponents.has('TH'))
    || (mode === 'lt_plus_exercise' && presentComponents.has('BT'))
    || (mode === 'lab_as_lt' && presentComponents.has('TH'))
    || (mode === 'exercise_as_lt' && presentComponents.has('BT'))
  );

  if (conflictsWithSeparateComponent) {
    warnings.push({
      code: 'combined_rule_conflicts_with_separate_component',
      message: `Môn ${normalizedCourseId} có thành phần riêng trên Portal; UStudy tách giờ để tránh tính trùng.`,
    });
    mode = 'separate';
    source = 'default';
  }

  if (!userOverride && !academicRule && mode === 'separate' && presentComponents.has('LT') && hours.theory === 0) {
    const canUseLab = hours.lab > 0 && hours.exercise === 0 && !presentComponents.has('TH');
    const canUseExercise = hours.exercise > 0 && hours.lab === 0 && !presentComponents.has('BT');
    if (canUseLab) {
      mode = 'lab_as_lt';
      source = 'automatic_fallback';
    } else if (canUseExercise) {
      mode = 'exercise_as_lt';
      source = 'automatic_fallback';
    } else if (hours.lab > 0 || hours.exercise > 0) {
      warnings.push({
        code: 'ambiguous_zero_theory_workload',
        message: `Môn ${normalizedCourseId} không có giờ lý thuyết và có nhiều cách phân bổ khả dĩ.`,
      });
    }
  }

  const components: ResolvedCourseWorkload['components'] = {};
  presentComponents.forEach((component) => {
    const resolved = componentWorkload(component, mode, source, hours, userOverride);
    components[component] = resolved;
    if (resolved.requiredPeriods === 0) warnings.push({
      code: 'required_periods_zero',
      message: `Thành phần ${component} của môn ${normalizedCourseId} chưa có số tiết để tính số tuần.`,
    });
  });

  return {
    courseId: normalizedCourseId,
    components,
    warnings,
    academicRuleId: academicRule?.id,
    academicRuleReason: academicRule?.reason,
  };
}
