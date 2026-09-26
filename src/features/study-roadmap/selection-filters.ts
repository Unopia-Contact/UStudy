import type { Course } from '../../types';

export type SelectionFilter = 'all' | 'available' | 'retake' | 'selected' | 'unselected';
export type CourseGroup = 'all' | 'core' | 'major' | 'electives';

export function matchesSelectionFilter(course: Course, filter: SelectionFilter, selected: ReadonlySet<string>) {
    switch (filter) {
        case 'available': return Boolean(course.isAvailable || course.needsRetake);
        case 'retake': return Boolean(course.needsRetake);
        case 'selected': return selected.has(course.id);
        case 'unselected': return !selected.has(course.id);
        default: return true;
    }
}
