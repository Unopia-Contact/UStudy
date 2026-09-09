import { AcademicRulesEngine } from '../grades';
import type { CourseMeta } from './types';

export function getRequiredCredits(category: any): number {
    const specializationRequirements = getSpecializationChildren(category)
        .map((child) => getRequiredCredits(child));
    if (specializationRequirements.length > 0) {
        return Math.max(...specializationRequirements);
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

function getSpecializationChildren(category: any): any[] {
    if (!isSpecializationCategory(category) || !category?.breakdown) return [];
    return Object.values(category.breakdown).filter((child: any) => isSpecializationCategory(child));
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
    const result = calculateCategoryCreditProgress(category, manuallyPlannedCourseIds, countedCourseIds);
    return result.display;
}

interface CategoryCreditCalculation {
    display: { earnedCredits: number; plannedCredits: number };
    contribution: { earnedCredits: number; plannedCredits: number };
}

function calculateCategoryCreditProgress(
    category: any,
    manuallyPlannedCourseIds: Set<string>,
    countedCourseIds: Set<string>
): CategoryCreditCalculation {
    let earnedCredits = 0;
    let plannedCredits = 0;
    let contributingEarnedCredits = 0;
    let contributingPlannedCredits = 0;

    if (category.allCoursesData || category.coursesData) {
        const coursesForCredits = (category.allCoursesData || category.coursesData) as CourseMeta[];
        const uncountedCourses = coursesForCredits.filter((course) => {
            if (countedCourseIds.has(course.course_id)) return false;
            countedCourseIds.add(course.course_id);
            return true;
        });
        const ownDisplay = sumCoursePlanCredits(uncountedCourses, manuallyPlannedCourseIds, true);
        const ownContribution = sumCoursePlanCredits(uncountedCourses, manuallyPlannedCourseIds, false);
        earnedCredits += ownDisplay.earnedCredits;
        plannedCredits += ownDisplay.plannedCredits;
        contributingEarnedCredits += ownContribution.earnedCredits;
        contributingPlannedCredits += ownContribution.plannedCredits;
    }

    if (category.breakdown) {
        const childProgresses = Object.values(category.breakdown).map((child: any) => ({
            child,
            progress: calculateCategoryCreditProgress(child, manuallyPlannedCourseIds, countedCourseIds),
        }));

        const specializationChildren = childProgresses.filter(({ child }) => isSpecializationCategory(child));
        if (specializationChildren.length > 0) {
            const highestCalculation = specializationChildren.reduce<CategoryCreditCalculation>((highest, current) => (
                current.progress.contribution.earnedCredits + current.progress.contribution.plannedCredits >
                highest.contribution.earnedCredits + highest.contribution.plannedCredits
                    ? current.progress
                    : highest
            ), {
                display: { earnedCredits: 0, plannedCredits: 0 },
                contribution: { earnedCredits: 0, plannedCredits: 0 },
            });
            const highestProgress = highestCalculation.contribution;

            earnedCredits += highestProgress.earnedCredits;
            plannedCredits += highestProgress.plannedCredits;
            contributingEarnedCredits += highestProgress.earnedCredits;
            contributingPlannedCredits += highestProgress.plannedCredits;
        } else {
            childProgresses.forEach(({ progress: childProgress }) => {
                earnedCredits += childProgress.contribution.earnedCredits;
                plannedCredits += childProgress.contribution.plannedCredits;
                contributingEarnedCredits += childProgress.contribution.earnedCredits;
                contributingPlannedCredits += childProgress.contribution.plannedCredits;
            });
        }
    }

    if (Array.isArray(category.options)) {
        category.options.forEach((option: any) => {
            const optionCourses = (option.allCoursesData || option.coursesData || []) as CourseMeta[];
            const optionDisplay = sumCoursePlanCredits(optionCourses, manuallyPlannedCourseIds, true);
            const optionContribution = sumCoursePlanCredits(optionCourses, manuallyPlannedCourseIds, false);
            const optionEarnedCredits = optionDisplay.earnedCredits;
            const optionPlannedCredits = optionDisplay.plannedCredits;

            if (optionEarnedCredits + optionPlannedCredits > earnedCredits + plannedCredits) {
                earnedCredits = optionEarnedCredits;
                plannedCredits = optionPlannedCredits;
                contributingEarnedCredits = optionContribution.earnedCredits;
                contributingPlannedCredits = optionContribution.plannedCredits;
            }
        });
    }

    const display = { earnedCredits, plannedCredits };
    const categoryIsExcluded = Boolean(
        category.name && AcademicRulesEngine.isCategoryExcludedFromAccumulation(category.name)
    );

    return {
        display,
        contribution: categoryIsExcluded
            ? { earnedCredits: 0, plannedCredits: 0 }
            : { earnedCredits: contributingEarnedCredits, plannedCredits: contributingPlannedCredits },
    };
}
