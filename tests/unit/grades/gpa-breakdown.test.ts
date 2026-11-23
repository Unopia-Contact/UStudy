import { describe, expect, it } from 'vitest';
import { AcademicRulesEngine } from '../../../src/features/grades/services/academic-rules-engine';
import { buildCumulativeGPABreakdown, buildSemesterGPABreakdowns, type GPABreakdownRow } from '../../../src/features/grades/services/gpa-breakdown';
import { GPACalculator } from '../../../src/features/grades/services/gpa-calculator';

const rawGrades = [
    { id: 'CSC00001', name: 'Cơ sở ngành', score: '7', credits: '3', semester: '25-26/1' },
    { id: 'CSC10001', name: 'Chuyên ngành', score: '8', credits: '2', semester: '25-26/1' },
    { id: 'CSC10002', name: 'Môn chưa đạt', score: '4', credits: '3', semester: '25-26/1' },
    { id: 'BAA00021', name: 'GDTC', score: '9', credits: '1', semester: '25-26/1' },
    { id: 'CSC00001', name: 'Cơ sở ngành', score: '9', credits: '3', semester: '25-26/2', type: 'CT' },
    { id: 'CSC10004', name: 'Môn đang học', score: '(*)', credits: '2', semester: '25-26/2' },
];
const allCoursesMeta = [{ course_id: 'CSC00001', category: 'FOUNDATION' }];
const projectedCourses = [
    { code: 'CSC10001', name: 'Chuyên ngành', projectedGrade: 4, credits: 2 },
    { code: 'CSC10002', name: 'Môn chưa đạt', projectedGrade: 6, credits: 3 },
];
const summary = AcademicRulesEngine.calculateGPASummary(
    rawGrades, AcademicRulesEngine.resolveEffectiveGrades(rawGrades), false, allCoursesMeta,
);
const source = { history: summary.gradesHistory, projectedCourses, projectionSemesters: [], allCoursesMeta };

function summarize(rows: GPABreakdownRow[]) {
    const points = rows.reduce((sum, row) => sum + row.points, 0);
    const credits = rows.reduce((sum, row) => sum + row.countedCredits, 0);
    return { credits, gpa: credits > 0 ? points / credits : 0 };
}

describe('GPA breakdown', () => {
    it('matches the current and group GPA summaries', () => {
        const current = buildCumulativeGPABreakdown('current', 'foundation', source);
        expect(summarize(current)).toEqual({ credits: 5, gpa: summary.currentGPA });
        expect(current.find(row => row.code === 'CSC00001')?.score).toBe(9);
        expect(current.filter(row => row.exclusion).map(row => row.code)).toEqual(['CSC10002', 'BAA00021', 'CSC10004']);
        expect(summarize(buildCumulativeGPABreakdown('group', 'foundation', source))).toEqual({
            credits: 3, gpa: summary.foundationGPA,
        });
        expect(summarize(buildCumulativeGPABreakdown('group', 'specialized', source))).toEqual({
            credits: 2, gpa: summary.majorSpecializedGPA,
        });
    });

    it('marks the replaced score and matches projected GPA even when the new score is below 5', () => {
        const rows = buildCumulativeGPABreakdown('projected', 'foundation', source);
        expect(summarize(rows)).toEqual({
            credits: 6, gpa: GPACalculator.calculateProjectedGPA(summary.gradesHistory, projectedCourses),
        });
        expect(rows.filter(row => row.code === 'CSC10001')).toMatchObject([
            { exclusion: 'Đã thay bằng điểm dự kiến', points: 0 },
            { exclusion: 'Dưới 5,0', score: 4, points: 0, projected: true },
        ]);
    });

    it('matches semester GPA using the original attempts, includes failed scores and shows excluded rows', () => {
        const semesters = buildSemesterGPABreakdowns(rawGrades);
        const firstSemester = semesters.get('25-26/1') ?? [];
        const { credits, gpa } = summary.gpaPerSemester[0];
        expect(summarize(firstSemester)).toEqual({ credits, gpa });
        expect(firstSemester.find(row => row.code === 'CSC10002')).toMatchObject({ points: 12, countedCredits: 3 });
        expect(semesters.get('25-26/2')).toMatchObject([
            { exclusion: 'Điểm cải thiện (CT)', points: 0 },
            { exclusion: 'Chưa có điểm', points: 0 },
        ]);
    });
});
