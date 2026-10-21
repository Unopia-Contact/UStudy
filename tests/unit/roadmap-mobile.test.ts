import { describe, expect, it } from 'vitest';
import { matchesSelectionFilter } from '../../src/features/study-roadmap/selection-filters';
import { getVisibleWeekDays } from '../../src/constants/timetable';
import { getClassSectionTimeRange } from '../../src/components/schedule/schedule-timeline';
import type { Course } from '../../src/types';

const course: Course = { id: 'CSC14003', code: 'CSC14003', name: 'AI', nameVi: 'Cơ sở trí tuệ nhân tạo', credits: 4, prerequisites: [], isAvailable: false, description: '', descriptionVi: '' };
describe('Roadmap mobile presentation rules', () => {
    it('keeps every course in the unfiltered view', () => expect(matchesSelectionFilter(course, 'all', new Set())).toBe(true));
    it('does not label an unavailable course eligible', () => expect(matchesSelectionFilter(course, 'available', new Set())).toBe(false));
    it('includes retake courses eligible for selection', () => expect(matchesSelectionFilter({ ...course, needsRetake: true }, 'available', new Set())).toBe(true));
    it('filters retake independently of selection state', () => {
        expect(matchesSelectionFilter(course, 'retake', new Set([course.id]))).toBe(false);
        expect(matchesSelectionFilter({ ...course, needsRetake: true }, 'retake', new Set())).toBe(true);
    });
    it('distinguishes selected and unselected courses without mutating the basket', () => {
        const basket = new Set([course.id]);
        expect(matchesSelectionFilter(course, 'selected', basket)).toBe(true);
        expect(matchesSelectionFilter(course, 'unselected', basket)).toBe(false);
        expect([...basket]).toEqual([course.id]);
    });
    it('shows Sunday only when at least one lesson uses day 8', () => {
        expect(getVisibleWeekDays([2, 7]).map(d => d.day)).not.toContain(8);
        expect(getVisibleWeekDays([2, 8]).map(d => d.day)).toContain(8);
        expect(getVisibleWeekDays([])).toHaveLength(6);
    });
    it('uses the same campus-aware time range as the timetable grid', () => {
        expect(getClassSectionTimeRange({ startPeriod: 1, endPeriod: 4, campusId: 'dong-hoa' })).toMatchObject({ startTime: '07:30', endTime: '11:00' });
        expect(getClassSectionTimeRange({ startPeriod: 1, endPeriod: 4, startTime: '08:00', endTime: '10:00' })).toMatchObject({ startTime: '08:00', endTime: '10:00' });
    });
});
