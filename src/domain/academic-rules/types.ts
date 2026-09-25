export type AcademicWorkloadRuleMode =
  | 'separate'
  | 'lt_plus_lab'
  | 'lt_plus_exercise'
  | 'lab_as_lt'
  | 'exercise_as_lt';

export interface AcademicRuleScope {
  campusId?: string;
  cohortId?: string;
  facultyId?: string;
  majorId?: string;
}

export interface AcademicRuleContext {
  campusId?: string;
  cohortId?: string;
  facultyId?: string;
  majorId?: string;
}

export interface AcademicWorkloadRule {
  id: string;
  scope: AcademicRuleScope;
  courseId: string;
  mode: AcademicWorkloadRuleMode;
  reason: string;
}
