import type { AcademicWorkloadRule } from './types';
import { normalizeAcademicCourseId } from './workload-rule-resolver';

export function validateAcademicWorkloadRules(rules: AcademicWorkloadRule[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const identities = new Set<string>();

  rules.forEach((rule) => {
    if (!rule.id.trim()) errors.push('Academic workload rule is missing an id.');
    if (ids.has(rule.id)) errors.push(`Duplicate academic workload rule id: ${rule.id}`);
    ids.add(rule.id);

    const courseId = normalizeAcademicCourseId(rule.courseId);
    if (!courseId) errors.push(`Academic workload rule ${rule.id} is missing a courseId.`);
    if (!rule.reason.trim()) errors.push(`Academic workload rule ${rule.id} is missing a reason.`);

    const scopeIdentity = Object.entries(rule.scope)
      .filter(([, value]) => Boolean(value))
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, value]) => `${key}:${String(value).trim().toLowerCase()}`)
      .join('|');
    const identity = `${courseId}|${scopeIdentity}`;
    if (identities.has(identity)) errors.push(`Duplicate academic workload rule scope for ${courseId || rule.id}.`);
    identities.add(identity);
  });

  return errors;
}
