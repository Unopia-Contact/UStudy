import { AcademicRulesEngine } from './academic-rules-engine';
import { score10ToFourPoint } from './grade-scale';
import type { GPAProjectionSemester, StudentCourseGrade } from '../types';

export type GPAGroup = 'foundation' | 'specialized';
export type GPABreakdownTab = 'current' | 'projected' | 'group' | 'semester';

interface ProjectedCourse {
    code: string;
    name: string;
    credits: number;
    projectedGrade: number;
}

export interface GPABreakdownRow {
    code: string;
    name: string;
    score: number | null;
    credits: number | null;
    points: number;
    fourPointScore: number | null;
    fourPointPoints: number;
    countedCredits: number;
    exclusion?: string;
    projected?: boolean;
}

interface GPABreakdownSource {
    history: StudentCourseGrade[];
    projectedCourses: ProjectedCourse[];
    projectionSemesters: GPAProjectionSemester[];
    allCoursesMeta: any[];
}

const normalizedCode = (code: string) => code.trim().toUpperCase();

export function buildCumulativeGPABreakdown(
    tab: Exclude<GPABreakdownTab, 'semester'>,
    group: GPAGroup,
    { history, projectedCourses, projectionSemesters, allCoursesMeta }: GPABreakdownSource,
): GPABreakdownRow[] {
    const projections = tab === 'projected' ? projectedCourses : [];
    const projectedCodes = new Set(projections.map(course => normalizedCode(course.code)));

    const rows = history.map((course) => {
        let exclusion: string | undefined;
        if (projectedCodes.has(normalizedCode(course.code))) {
            exclusion = 'Đã thay bằng điểm dự kiến';
        } else if (tab === 'group') {
            const belongsToGroup = group === 'foundation'
                ? AcademicRulesEngine.isFoundationCourse(course.code, allCoursesMeta)
                : AcademicRulesEngine.isSpecializedCourse(course.code);
            if (!belongsToGroup) exclusion = 'Ngoài nhóm đang xem';
        }

        return buildCumulativeRow(
            {
                code: course.code,
                name: course.nameVi,
                credits: course.credits,
                score: course.status === 'ongoing' ? null : course.grade,
            },
            course.status,
            exclusion,
        );
    });

    for (const { code, name, credits, projectedGrade } of projections) {
        rows.push(buildCumulativeRow(
            { code, name, credits, score: projectedGrade, projected: true },
            AcademicRulesEngine.evaluateCourseStatus(projectedGrade),
        ));
    }

    if (tab === 'projected') {
        const representedCodes = new Set(projectedCodes);
        for (const course of history) {
            if (course.status === 'ongoing') representedCodes.add(normalizedCode(course.code));
        }
        for (const semester of projectionSemesters) {
            for (const course of semester.courses) {
                if (course.currentGrade !== null || representedCodes.has(course.code)) continue;
                representedCodes.add(course.code);
                rows.push(buildCumulativeRow(
                    { code: course.code, name: course.name, credits: course.credits, score: course.projectedGrade, projected: true },
                    'ongoing',
                ));
            }
        }
    }

    return rows;
}

function buildCumulativeRow(
    course: Omit<GPABreakdownRow, 'exclusion' | 'points' | 'countedCredits' | 'fourPointScore' | 'fourPointPoints'>,
    status: StudentCourseGrade['status'],
    exclusion?: string,
): GPABreakdownRow {
    const { pointsForGPA, creditsForGPA } = AcademicRulesEngine.calculateAccumulationParams(
        course.code, course.credits ?? 0, course.score ?? 0, status,
    );

    if (!exclusion && creditsForGPA === 0) {
        if (AcademicRulesEngine.isCourseExcludedFromGPA(course.code)) exclusion = 'Môn điều kiện';
        else if (course.score === null) exclusion = course.projected ? 'Chưa có điểm dự kiến' : 'Chưa có điểm';
        else if (course.credits === null) exclusion = 'Chưa có số tín chỉ';
        else if (status === 'retake') exclusion = 'Dưới 5,0';
        else exclusion = '0 tín chỉ';
    }

    const fourPointScore = course.score === null ? null : score10ToFourPoint(course.score);
    return {
        ...course,
        exclusion,
        points: exclusion ? 0 : pointsForGPA,
        fourPointScore,
        fourPointPoints: exclusion || fourPointScore === null ? 0 : fourPointScore * creditsForGPA,
        countedCredits: exclusion ? 0 : creditsForGPA,
    };
}

export function buildSemesterGPABreakdowns(rawGrades: any[]): Map<string, GPABreakdownRow[]> {
    const semesters = new Map<string, GPABreakdownRow[]>();
    const hasBLMExemption = AcademicRulesEngine.checkBLMExemption(rawGrades);
    for (const record of rawGrades) {
        const { code, credits, score, semester, isImprovement } = AcademicRulesEngine.readSemesterGrade(record, hasBLMExemption);
        let exclusion: string | undefined;
        if (isImprovement) exclusion = 'Điểm cải thiện (CT)';
        else if (AcademicRulesEngine.isCourseExcludedFromGPA(code)) exclusion = 'Môn điều kiện';
        else if (score === null || !Number.isFinite(score)) exclusion = 'Chưa có điểm';
        else if (credits <= 0) exclusion = 'Không có tín chỉ hợp lệ';

        const { pointsForGPA, creditsForGPA } = AcademicRulesEngine.calculateSemesterGPAParams(code, credits, score ?? 0);
        const row = {
            code,
            name: AcademicRulesEngine.extractVietnameseCourseName(record.name),
            credits,
            score,
            exclusion,
            points: exclusion ? 0 : pointsForGPA,
            fourPointScore: score === null ? null : score10ToFourPoint(score),
            fourPointPoints: exclusion ? 0 : score10ToFourPoint(score ?? 0) * creditsForGPA,
            countedCredits: exclusion ? 0 : creditsForGPA,
        };
        const rows = semesters.get(semester);
        if (rows) rows.push(row);
        else semesters.set(semester, [row]);
    }
    return semesters;
}
