import { ACADEMIC_WORKLOAD_RULES } from './workload-rules';
import type { AcademicRuleContext, AcademicWorkloadRule } from './types';

export function normalizeAcademicCourseId(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function normalizeScopeValue(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function getRuleSpecificity(rule: AcademicWorkloadRule, context: AcademicRuleContext): number {
  const entries = Object.entries(rule.scope) as Array<[keyof AcademicRuleContext, string | undefined]>;
  for (const [key, expected] of entries) {
    if (!expected) continue;
    if (normalizeScopeValue(context[key]) !== normalizeScopeValue(expected)) return -1;
  }
  return entries.filter(([, value]) => Boolean(value)).length;
}

export function resolveAcademicWorkloadRule(
  courseId: unknown,
  context: AcademicRuleContext = {},
  rules: AcademicWorkloadRule[] = ACADEMIC_WORKLOAD_RULES,
): AcademicWorkloadRule | undefined {
  const normalizedCourseId = normalizeAcademicCourseId(courseId);
  return rules
    .map((rule, index) => ({
      rule,
      index,
      specificity: normalizeAcademicCourseId(rule.courseId) === normalizedCourseId
        ? getRuleSpecificity(rule, context)
        : -1,
    }))
    .filter(({ specificity }) => specificity >= 0)
    .sort((first, second) => second.specificity - first.specificity || first.index - second.index)[0]?.rule;
}

export function getApplicableAcademicWorkloadRules(
  context: AcademicRuleContext,
  rules: AcademicWorkloadRule[] = ACADEMIC_WORKLOAD_RULES,
): AcademicWorkloadRule[] {
  return rules.filter((rule) => getRuleSpecificity(rule, context) >= 0);
}
