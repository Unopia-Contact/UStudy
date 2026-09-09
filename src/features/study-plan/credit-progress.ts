import { AcademicRulesEngine } from '../grades';
import type { CourseMeta } from './types';

export function getRequiredCredits(category: any): number {
    const specializationRequirements = getSpecializationChildren(category)
        .map((child) => getRequiredCredits(child));
    if (specializationRequirements.length > 0) {
        const includedSupplementalCredits = Object.entries(category.breakdown || {})
            .filter(([key, child]) => (
                !isSpecializationBranch(key, child)
                && isIncludedInParentTotal(child)
            ))
            .reduce((total, [, child]) => total + getRequiredCredits(child), 0);

        return category.total_credits_required
            || Math.max(...specializationRequirements) + includedSupplementalCredits;
    }

    return category.total_credits_required || category.credits || category.credits_required || 0;
}

function normalizeCategoryName(name: unknown): string {
    return String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\u0111/g, 'd')
        .toLowerCase();
}

function isSpecializationCategory(category: any): boolean {
    return normalizeCategoryName(category?.name).includes('chuyen nganh');
}

function isSpecializationBranch(categoryKey: string, category: any): boolean {
    if (category?.category_role === 'specialization' || category?.categoryRole === 'specialization') {
        return true;
    }

    if (categoryKey.startsWith('MAJOR_')) return true;
    if (categoryKey.startsWith('GRADUATION_') && isSpecializationCategory(category)) return true;

    return isSpecializationCategory(category)
        && Boolean(category?.breakdown)
        && Object.keys(category.breakdown).length > 0;
}

function isIncludedInParentTotal(category: any): boolean {
    return category?.include_in_parent_total === true
        || category?.includeInParentTotal === true;
}

function getSpecializationChildren(category: any): any[] {
    if (!isSpecializationCategory(category) || !category?.breakdown) return [];
    return Object.entries(category.breakdown)
        .filter(([key, child]) => isSpecializationBranch(key, child))
        .map(([, child]) => child);
}

export function getCoursePlanCredits(
    course: CourseMeta,
    manuallyPlannedCourseIds: Set<string>,
    includeAccumulationExcluded: boolean
): { earnedCredits: number; plannedCredits: number } {
    if (!includeAccumulationExcluded && AcademicRulesEngine.isCourseExcludedFromAccumulation(course.course_id)) {
        return { earnedCredits: 0, plannedCredits: 0 };
    }

    const credits = Number(course.credits) || 0;
    if (course.status === 'passed') return { earnedCredits: credits, plannedCredits: 0 };
    if (
        course.status === 'studying' ||
        manuallyPlannedCourseIds.has(course.course_id)
    ) {
        return { earnedCredits: 0, plannedCredits: credits };
    }

    return { earnedCredits: 0, plannedCredits: 0 };
}

export function sumCoursePlanCredits(
    courses: CourseMeta[],
    manuallyPlannedCourseIds: Set<string>,
    includeAccumulationExcluded: boolean
): { earnedCredits: number; plannedCredits: number } {
    return courses.reduce((total, course) => {
        const courseCredits = getCoursePlanCredits(course, manuallyPlannedCourseIds, includeAccumulationExcluded);
        return {
            earnedCredits: total.earnedCredits + courseCredits.earnedCredits,
            plannedCredits: total.plannedCredits + courseCredits.plannedCredits,
        };
    }, { earnedCredits: 0, plannedCredits: 0 });
}

export function getCategoryCreditProgress(
    category: any,
    manuallyPlannedCourseIds: Set<string>,
    countedCourseIds = new Set<string>()
): { earnedCredits: number; plannedCredits: number } {
    const result = calculateCategoryCreditProgress(
        category,
        manuallyPlannedCourseIds,
        countedCourseIds,
        'category',
        {}
    );
    return result.display;
}

export interface CategoryCreditProgress {
    display: { earnedCredits: number; plannedCredits: number };
    contribution: { earnedCredits: number; plannedCredits: number };
}

export type CategoryCreditProgressMap = Record<string, CategoryCreditProgress>;

interface CategoryCreditCalculation extends CategoryCreditProgress {
    countedCourseIds: Set<string>;
}

export function getCategoryOptionPath(categoryPath: string, optionIndex: number): string {
    return `${categoryPath}.__option_${optionIndex}`;
}

export function getProgramCategoryCreditProgress(
    categories: Record<string, any>,
    manuallyPlannedCourseIds: Set<string>
): CategoryCreditProgressMap {
    const progressByPath: CategoryCreditProgressMap = {};
    const countedCourseIds = new Set<string>();

    Object.entries(categories).forEach(([categoryKey, category]) => {
        calculateCategoryCreditProgress(
            category,
            manuallyPlannedCourseIds,
            countedCourseIds,
            categoryKey,
            progressByPath
        );
    });

    return progressByPath;
}

function getProgressScore(progress: CategoryCreditProgress): number {
    return progress.contribution.earnedCredits + progress.contribution.plannedCredits;
}

function replaceSetContents(target: Set<string>, source: Set<string>): void {
    target.clear();
    source.forEach((courseId) => target.add(courseId));
}

function calculateUncountedCourseProgress(
    courses: CourseMeta[],
    manuallyPlannedCourseIds: Set<string>,
    countedCourseIds: Set<string>
): CategoryCreditProgress {
    let earnedCredits = 0;
    let plannedCredits = 0;
    let contributingEarnedCredits = 0;
    let contributingPlannedCredits = 0;

    courses.forEach((course) => {
        if (countedCourseIds.has(course.course_id)) return;

        const display = getCoursePlanCredits(course, manuallyPlannedCourseIds, true);
        if (display.earnedCredits + display.plannedCredits <= 0) return;

        countedCourseIds.add(course.course_id);
        const contribution = getCoursePlanCredits(course, manuallyPlannedCourseIds, false);
        earnedCredits += display.earnedCredits;
        plannedCredits += display.plannedCredits;
        contributingEarnedCredits += contribution.earnedCredits;
        contributingPlannedCredits += contribution.plannedCredits;
    });

    return {
        display: { earnedCredits, plannedCredits },
        contribution: {
            earnedCredits: contributingEarnedCredits,
            plannedCredits: contributingPlannedCredits,
        },
    };
}

function calculateCategoryCreditProgress(
    category: any,
    manuallyPlannedCourseIds: Set<string>,
    countedCourseIds: Set<string>,
    categoryPath: string,
    progressByPath: CategoryCreditProgressMap
): CategoryCreditCalculation {
    let earnedCredits = 0;
    let plannedCredits = 0;
    let contributingEarnedCredits = 0;
    let contributingPlannedCredits = 0;

    if (category.allCoursesData || category.coursesData) {
        const coursesForCredits = (category.allCoursesData || category.coursesData) as CourseMeta[];
        const ownProgress = calculateUncountedCourseProgress(
            coursesForCredits,
            manuallyPlannedCourseIds,
            countedCourseIds
        );
        const ownDisplay = ownProgress.display;
        const ownContribution = ownProgress.contribution;
        earnedCredits += ownDisplay.earnedCredits;
        plannedCredits += ownDisplay.plannedCredits;
        contributingEarnedCredits += ownContribution.earnedCredits;
        contributingPlannedCredits += ownContribution.plannedCredits;
    }

    if (category.breakdown) {
        const childEntries = Object.entries(category.breakdown) as [string, any][];
        const specializationChildren = childEntries.filter(([key, child]) => isSpecializationBranch(key, child));
        const explicitlySelectsOneChild = category.selection_mode === 'one'
            || category.selectionMode === 'one';
        const usesAlternativeChildren = explicitlySelectsOneChild || specializationChildren.length > 0;

        if (usesAlternativeChildren) {
            const alternativeChildren = explicitlySelectsOneChild ? childEntries : specializationChildren;
            const supplementalChildren = explicitlySelectsOneChild
                ? []
                : childEntries.filter(([key, child]) => !isSpecializationBranch(key, child));

            supplementalChildren
                .filter(([, child]) => !isIncludedInParentTotal(child))
                .forEach(([childKey, child]) => {
                    calculateCategoryCreditProgress(
                        child,
                        manuallyPlannedCourseIds,
                        new Set(countedCourseIds),
                        `${categoryPath}.${childKey}`,
                        progressByPath
                    );
                });

            const branchBaseCourseIds = new Set(countedCourseIds);
            const branchCalculations = alternativeChildren.map(([childKey, child]) => {
                const branchCourseIds = new Set(branchBaseCourseIds);
                const progress = calculateCategoryCreditProgress(
                    child,
                    manuallyPlannedCourseIds,
                    branchCourseIds,
                    `${categoryPath}.${childKey}`,
                    progressByPath
                );
                return { progress, countedCourseIds: branchCourseIds };
            });
            const highestCalculation = branchCalculations.reduce((highest, current) => (
                getProgressScore(current.progress) > getProgressScore(highest.progress)
                    ? current
                    : highest
            ));
            const highestProgress = highestCalculation.progress.contribution;

            earnedCredits += highestProgress.earnedCredits;
            plannedCredits += highestProgress.plannedCredits;
            contributingEarnedCredits += highestProgress.earnedCredits;
            contributingPlannedCredits += highestProgress.plannedCredits;
            replaceSetContents(countedCourseIds, highestCalculation.countedCourseIds);

            supplementalChildren
                .filter(([, child]) => isIncludedInParentTotal(child))
                .forEach(([childKey, child]) => {
                    const childProgress = calculateCategoryCreditProgress(
                        child,
                        manuallyPlannedCourseIds,
                        countedCourseIds,
                        `${categoryPath}.${childKey}`,
                        progressByPath
                    );
                    earnedCredits += childProgress.contribution.earnedCredits;
                    plannedCredits += childProgress.contribution.plannedCredits;
                    contributingEarnedCredits += childProgress.contribution.earnedCredits;
                    contributingPlannedCredits += childProgress.contribution.plannedCredits;
                });
        } else {
            childEntries.forEach(([childKey, child]) => {
                const childProgress = calculateCategoryCreditProgress(
                    child,
                    manuallyPlannedCourseIds,
                    countedCourseIds,
                    `${categoryPath}.${childKey}`,
                    progressByPath
                );
                earnedCredits += childProgress.contribution.earnedCredits;
                plannedCredits += childProgress.contribution.plannedCredits;
                contributingEarnedCredits += childProgress.contribution.earnedCredits;
                contributingPlannedCredits += childProgress.contribution.plannedCredits;
            });
        }
    }

    if (Array.isArray(category.options)) {
        const optionBaseCourseIds = new Set(countedCourseIds);
        const optionCalculations: Array<{
            progress: CategoryCreditCalculation;
            countedCourseIds: Set<string>;
        }> = category.options.map((option: any, optionIndex: number) => {
            const optionCourseIds = new Set(optionBaseCourseIds);
            const progress = calculateCategoryCreditProgress(
                option,
                manuallyPlannedCourseIds,
                optionCourseIds,
                getCategoryOptionPath(categoryPath, optionIndex),
                progressByPath
            );
            return { progress, countedCourseIds: optionCourseIds };
        });
        const selectedOption = optionCalculations.reduce<(typeof optionCalculations)[number] | undefined>((highest, current) => (
            !highest || getProgressScore(current.progress) > getProgressScore(highest.progress)
                ? current
                : highest
        ), undefined);

        if (selectedOption && getProgressScore(selectedOption.progress) > earnedCredits + plannedCredits) {
            earnedCredits = selectedOption.progress.display.earnedCredits;
            plannedCredits = selectedOption.progress.display.plannedCredits;
            contributingEarnedCredits = selectedOption.progress.contribution.earnedCredits;
            contributingPlannedCredits = selectedOption.progress.contribution.plannedCredits;
            replaceSetContents(countedCourseIds, selectedOption.countedCourseIds);
        }
    }

    const display = { earnedCredits, plannedCredits };
    const categoryIsExcluded = Boolean(
        category.name && AcademicRulesEngine.isCategoryExcludedFromAccumulation(category.name)
    );

    const result: CategoryCreditProgress = {
        display,
        contribution: categoryIsExcluded
            ? { earnedCredits: 0, plannedCredits: 0 }
            : { earnedCredits: contributingEarnedCredits, plannedCredits: contributingPlannedCredits },
    };
    progressByPath[categoryPath] = result;

    return {
        ...result,
        countedCourseIds: new Set(countedCourseIds),
    };
}
