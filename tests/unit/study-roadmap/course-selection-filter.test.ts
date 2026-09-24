import { describe, expect, it } from 'vitest';

import { matchesCourseAvailabilityFilter } from '../../../src/features/study-roadmap/course-selection-filter';
import type { Course } from '../../../src/types';

const course = (overrides: Partial<Course> = {}): Course => ({
    id: 'CSC10001',
    code: 'CSC10001',
    name: 'Introduction to Programming',
    nameVi: 'Nhập môn lập trình',
    credits: 4,
    prerequisites: [],
    isAvailable: true,
    description: '',
    descriptionVi: '',
    ...overrides,
});

describe('matchesCourseAvailabilityFilter', () => {
    it('shows every course when no availability filter is active', () => {
        expect(matchesCourseAvailabilityFilter(course(), 'all')).toBe(true);
        expect(matchesCourseAvailabilityFilter(course({ isAvailable: false }), 'all')).toBe(true);
    });

    it('separates available, retake, and locked courses', () => {
        const available = course();
        const retake = course({ isAvailable: true, needsRetake: true });
        const locked = course({ isAvailable: false, needsRetake: false });

        expect(matchesCourseAvailabilityFilter(available, 'available')).toBe(true);
        expect(matchesCourseAvailabilityFilter(retake, 'available')).toBe(false);
        expect(matchesCourseAvailabilityFilter(retake, 'retake')).toBe(true);
        expect(matchesCourseAvailabilityFilter(locked, 'locked')).toBe(true);
    });
});
