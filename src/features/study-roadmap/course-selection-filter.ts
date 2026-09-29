import type { Course } from '../../types';

export type CourseAvailabilityFilter = 'all' | 'available' | 'retake' | 'locked';

export function matchesCourseAvailabilityFilter(
    course: Course,
    filter: CourseAvailabilityFilter,
): boolean {
    switch (filter) {
        case 'available':
            return course.isAvailable && !course.needsRetake;
        case 'retake':
            return Boolean(course.needsRetake);
        case 'locked':
            return !course.isAvailable && !course.needsRetake;
        default:
            return true;
    }
}
