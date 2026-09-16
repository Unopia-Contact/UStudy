import type { AcademicRuleContext, AcademicWorkloadRuleMode } from '../academic-rules';

export type ScheduleComponentType = 'LT' | 'TH' | 'BT';
export type WorkloadHourSource = 'theory' | 'lab' | 'exercise';
export type UserWorkloadOverrideMode = AcademicWorkloadRuleMode | 'custom';
export type WorkloadRuleSource = 'user' | 'academic_rule' | 'automatic_fallback' | 'default';

export interface WorkloadCourseMeta {
  course_id?: unknown;
  theory_hours?: unknown;
  lab_hours?: unknown;
  exercise_hours?: unknown;
}

export interface WorkloadRegistration {
  id?: unknown;
  courseType?: unknown;
}

export interface UserWorkloadOverride {
  mode: UserWorkloadOverrideMode;
  customSources?: WorkloadHourSource[];
  customHours?: number;
}

export type WorkloadWarningCode =
  | 'course_metadata_missing'
  | 'registration_type_unknown'
  | 'ambiguous_zero_theory_workload'
  | 'combined_rule_conflicts_with_separate_component'
  | 'required_periods_zero';

export interface WorkloadWarning {
  code: WorkloadWarningCode;
  message: string;
}

export interface ResolvedComponentWorkload {
  requiredPeriods: number;
  sources: WorkloadHourSource[];
  appliedMode: UserWorkloadOverrideMode;
  ruleSource: WorkloadRuleSource;
}

export interface ResolvedCourseWorkload {
  courseId: string;
  components: Partial<Record<ScheduleComponentType, ResolvedComponentWorkload>>;
  warnings: WorkloadWarning[];
  academicRuleId?: string;
  academicRuleReason?: string;
}

export interface ResolveCourseWorkloadInput {
  courseId: unknown;
  registrations: WorkloadRegistration[];
  courseMeta?: WorkloadCourseMeta;
  academicContext?: AcademicRuleContext;
  userOverride?: UserWorkloadOverride;
}
