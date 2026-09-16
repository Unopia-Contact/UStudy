import { normalizeAcademicCourseId, type AcademicRuleContext } from '../../../domain/academic-rules';
import {
  normalizeScheduleComponentType,
  resolveCourseWorkload,
  type ResolvedCourseWorkload,
  type ScheduleComponentType,
  type UserWorkloadOverride,
  type UserWorkloadOverrideMode,
  type WorkloadCourseMeta,
  type WorkloadHourSource,
  type WorkloadRuleSource,
  type WorkloadWarning,
} from '../../../domain/schedule-workload';
import { ScheduleLogic } from './schedule-logic';

export interface ScheduleWorkloadDiagnosticComponent {
  component: ScheduleComponentType;
  requiredPeriods: number;
  periodsPerWeek: number;
  totalWeeks: number;
  sources: WorkloadHourSource[];
  appliedMode: UserWorkloadOverrideMode;
  ruleSource: WorkloadRuleSource;
}

export interface ScheduleWorkloadDiagnostic {
  courseId: string;
  courseName: string;
  registrations: any[];
  courseMeta?: WorkloadCourseMeta & { course_name_vi?: unknown };
  resolved: ResolvedCourseWorkload;
  components: ScheduleWorkloadDiagnosticComponent[];
}

interface BuildScheduleWorkloadDiagnosticsInput {
  registrations: any[];
  coursesMeta: Array<WorkloadCourseMeta & { course_name_vi?: unknown }>;
  academicContext?: AcademicRuleContext;
  userOverrides?: Record<string, UserWorkloadOverride>;
}

interface BuildOpenCourseWorkloadDiagnosticsInput {
  openCourses: any[];
  coursesMeta: Array<WorkloadCourseMeta & { course_name_vi?: unknown }>;
  academicContext?: AcademicRuleContext;
  userOverrides?: Record<string, UserWorkloadOverride>;
}

export interface OpenCourseWorkloadComponentSummary {
  component: ScheduleComponentType;
  requiredPeriods: number[];
  periodsPerWeek: number[];
  totalWeeks: number[];
  sources: WorkloadHourSource[];
  appliedModes: UserWorkloadOverrideMode[];
  ruleSources: WorkloadRuleSource[];
}

export interface OpenCourseWorkloadClassDiagnostic {
  classId: string;
  diagnostic: ScheduleWorkloadDiagnostic;
}

export interface OpenCourseWorkloadDiagnostic {
  courseId: string;
  courseName: string;
  courseMeta?: WorkloadCourseMeta & { course_name_vi?: unknown };
  classOptions: OpenCourseWorkloadClassDiagnostic[];
  components: OpenCourseWorkloadComponentSummary[];
  warnings: ResolvedCourseWorkload['warnings'];
  academicRuleIds: string[];
  academicRuleReasons: string[];
}

function getPeriodsPerWeek(registrations: any[], component: ScheduleComponentType): number {
  return registrations
    .filter((registration) => (
      (normalizeScheduleComponentType(registration?.courseType) ?? 'LT') === component
    ))
    .flatMap((registration) => ScheduleLogic.parseScheduleString(String(registration?.schedule ?? '')))
    .reduce((total, entry) => (
      total + ScheduleLogic.adjustPeriodsForPractical(component, entry.startPeriod, entry.endPeriod).duration
    ), 0);
}

export function buildScheduleWorkloadDiagnostics({
  registrations,
  coursesMeta,
  academicContext = {},
  userOverrides = {},
}: BuildScheduleWorkloadDiagnosticsInput): ScheduleWorkloadDiagnostic[] {
  const groupedRegistrations = new Map<string, any[]>();
  registrations.forEach((registration) => {
    const courseId = normalizeAcademicCourseId(registration?.id);
    if (!courseId) return;
    const group = groupedRegistrations.get(courseId) ?? [];
    group.push(registration);
    groupedRegistrations.set(courseId, group);
  });

  const metadataByCourseId = new Map(
    coursesMeta.map((course) => [normalizeAcademicCourseId(course?.course_id), course]),
  );

  return [...groupedRegistrations.entries()]
    .map(([courseId, courseRegistrations]) => {
      const courseMeta = metadataByCourseId.get(courseId);
      const resolved = resolveCourseWorkload({
        courseId,
        registrations: courseRegistrations,
        courseMeta,
        academicContext,
        userOverride: userOverrides[courseId],
      });
      const components = (Object.entries(resolved.components) as Array<[
        ScheduleComponentType,
        NonNullable<ResolvedCourseWorkload['components'][ScheduleComponentType]>,
      ]>).map(([component, workload]) => {
        const periodsPerWeek = getPeriodsPerWeek(courseRegistrations, component);
        return {
          component,
          ...workload,
          periodsPerWeek,
          totalWeeks: workload.requiredPeriods > 0 && periodsPerWeek > 0
            ? Math.ceil(workload.requiredPeriods / periodsPerWeek)
            : 0,
        };
      });

      return {
        courseId,
        courseName: String(
          courseRegistrations[0]?.name
          || courseMeta?.course_name_vi
          || courseId,
        ),
        registrations: courseRegistrations,
        courseMeta,
        resolved,
        components,
      };
    })
    .sort((first, second) => first.courseId.localeCompare(second.courseId));
}

function uniqueSortedNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((first, second) => first - second);
}

function uniqueValues<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function getComponentSchedule(component: any): string {
  const rawSchedules = Array.isArray(component?.rawSchedules) ? component.rawSchedules : [];
  const normalizedSchedules = Array.isArray(component?.schedule) ? component.schedule : [];
  return (rawSchedules.length > 0 ? rawSchedules : normalizedSchedules)
    .map((value: unknown) => String(value ?? '').trim())
    .filter(Boolean)
    .join('; ');
}

function openClassToRegistrations(course: any, openClass: any): any[] {
  const definitions: Array<[ScheduleComponentType, any]> = [
    ['LT', openClass?.components?.theory],
    ['TH', openClass?.components?.practical],
    ['BT', openClass?.components?.exercise],
  ];
  return definitions.flatMap(([courseType, component]) => {
    if (!component) return [];
    return [{
      id: course.id,
      name: course.name,
      classGroup: component.group || openClass.id,
      courseType,
      schedule: getComponentSchedule(component),
    }];
  });
}

export function buildOpenCourseWorkloadDiagnostics({
  openCourses,
  coursesMeta,
  academicContext = {},
  userOverrides = {},
}: BuildOpenCourseWorkloadDiagnosticsInput): OpenCourseWorkloadDiagnostic[] {
  const metadataByCourseId = new Map(
    coursesMeta.map((course) => [normalizeAcademicCourseId(course?.course_id), course]),
  );
  const diagnostics: OpenCourseWorkloadDiagnostic[] = [];

  openCourses.forEach((course) => {
    const courseId = normalizeAcademicCourseId(course?.id);
    if (!courseId) return;
    const courseMeta = metadataByCourseId.get(courseId);
    const openClasses = Array.isArray(course?.classes) && course.classes.length > 0
      ? course.classes
      : [{ id: 'Chưa có lớp', components: { theory: { group: '—', schedule: [] } } }];
    const classOptions: OpenCourseWorkloadClassDiagnostic[] = openClasses.flatMap((openClass: any): OpenCourseWorkloadClassDiagnostic[] => {
      const registrations = openClassToRegistrations(course, openClass);
      const diagnostic = buildScheduleWorkloadDiagnostics({
        registrations,
        coursesMeta: courseMeta ? [courseMeta] : [],
        academicContext,
        userOverrides,
      })[0];
      return diagnostic ? [{ classId: String(openClass?.id || '—'), diagnostic }] : [];
    });

    const componentTypes: ScheduleComponentType[] = ['LT', 'TH', 'BT'];
    const components: OpenCourseWorkloadComponentSummary[] = componentTypes.flatMap((component): OpenCourseWorkloadComponentSummary[] => {
      const variants = classOptions
        .map((option) => option.diagnostic.components.find((item) => item.component === component))
        .filter((item): item is ScheduleWorkloadDiagnosticComponent => Boolean(item));
      if (variants.length === 0) return [];
      return [{
        component,
        requiredPeriods: uniqueSortedNumbers(variants.map((item) => item.requiredPeriods)),
        periodsPerWeek: uniqueSortedNumbers(variants.map((item) => item.periodsPerWeek)),
        totalWeeks: uniqueSortedNumbers(variants.map((item) => item.totalWeeks)),
        sources: uniqueValues(variants.flatMap((item) => item.sources)),
        appliedModes: uniqueValues(variants.map((item) => item.appliedMode)),
        ruleSources: uniqueValues(variants.map((item) => item.ruleSource)),
      }];
    });
    const warnings: WorkloadWarning[] = classOptions.flatMap((option) => option.diagnostic.resolved.warnings);
    const academicRuleIds = classOptions
      .map((option) => option.diagnostic.resolved.academicRuleId)
      .filter((value): value is string => Boolean(value));
    const academicRuleReasons = classOptions
      .map((option) => option.diagnostic.resolved.academicRuleReason)
      .filter((value): value is string => Boolean(value));

    diagnostics.push({
      courseId,
      courseName: String(course?.name || courseMeta?.course_name_vi || courseId),
      courseMeta,
      classOptions,
      components,
      warnings: [...new Map(warnings.map((warning) => [`${warning.code}|${warning.message}`, warning])).values()],
      academicRuleIds: uniqueValues(academicRuleIds),
      academicRuleReasons: uniqueValues(academicRuleReasons),
    });
  });

  return diagnostics.sort((first, second) => first.courseId.localeCompare(second.courseId));
}
