import { MobileCourseDetailContent, MobileCourseSheetFrame } from '../../components/course';
import { useEffect, useState } from 'react';
import { AppSelect } from '../../components/ui/form/app-select';
import { getStudyPlanSemesterIndex } from './semester-utils';
import { StatusBadge } from './StatusBadge';
import type { CourseMeta, StudyPlanStorage, MobileSheetStep, PrerequisiteRule, StudyPlanSemester } from './types';

interface MobileCoursePlannerSheetProps {
    course: CourseMeta | null;
    studyPlan: StudyPlanStorage;
    sheetStep: MobileSheetStep;
    rootCompleted: boolean;
    isLocked: boolean;
    manuallyPlannedCourseIds: Set<string>;
    selectedPlannedSemester: StudyPlanSemester | null;
    prereqByCourse: Map<string, PrerequisiteRule[]>;
    getMissingPrerequisites: (courseId: string, semesterIndex: number) => string[];
    onClose: () => void;
    onSheetStepChange: (step: MobileSheetStep) => void;
    onAddCourseToSemester: (semesterId: string) => void;
    courseById: Map<string, CourseMeta>;
    onRemoveCourse: () => void;
    preferredSemesterId?: string | null;
}

export function MobileCoursePlannerSheet({
    course,
    studyPlan,
    sheetStep,
    rootCompleted,
    isLocked,
    manuallyPlannedCourseIds,
    selectedPlannedSemester,
    prereqByCourse,
    getMissingPrerequisites,
    onClose,
    onSheetStepChange,
    onAddCourseToSemester,
    courseById,
    onRemoveCourse,
    preferredSemesterId,
}: MobileCoursePlannerSheetProps) {
    const [targetSemesterId, setTargetSemesterId] = useState<string | null>(null);
    const [targetYear, setTargetYear] = useState('1');
    const availableSemesters = studyPlan.semesters.filter(semester => !semester.isHistorical);
    const yearOf = (semester: StudyPlanSemester) => String(Math.floor((getStudyPlanSemesterIndex(semester.label) ?? 0) / 3) + 1);
    const availableYears = Array.from(new Set(availableSemesters.map(yearOf)));
    useEffect(() => {
        setTargetSemesterId(preferredSemesterId ?? null);
        const preferred = studyPlan.semesters.find(s => s.id === (preferredSemesterId ?? selectedPlannedSemester?.id));
        setTargetYear(preferred ? String(Math.floor((getStudyPlanSemesterIndex(preferred.label) ?? 0) / 3) + 1) : String(Math.floor((getStudyPlanSemesterIndex(studyPlan.semesters.find(s => !s.isHistorical)?.label ?? '') ?? 0) / 3) + 1));
    }, [course?.course_id, sheetStep, preferredSemesterId, selectedPlannedSemester?.id, studyPlan.semesters]);
    if (!course) return null;

    const prerequisiteContent = (() => {
        const rules = prereqByCourse.get(course.course_id) || [];
        if (selectedPlannedSemester) {
            const plannedIndex = studyPlan.semesters.findIndex((semester) => semester.id === selectedPlannedSemester.id);
            const missing = getMissingPrerequisites(course.course_id, plannedIndex);
            if (missing.length > 0) {
                return <p className="text-xs leading-relaxed text-amber-800">Thiếu: {missing.join(', ')}</p>;
            }
        }
        if (rules.length === 0) {
            return <p className="text-xs leading-relaxed text-gray-500">Chưa có dữ liệu tiên quyết cho môn này.</p>;
        }
        return <p className="text-xs leading-relaxed text-gray-600">Cần học trước: {rules.map((rule) => rule.prereq_id).join(', ')}</p>;
    })();

    const footer = !isLocked && sheetStep === 'semesters' ? <button type="button" disabled={!targetSemesterId} className="ustudy-button-primary min-h-11 w-full" onClick={() => { if (targetSemesterId) onAddCourseToSemester(targetSemesterId); }}>Xác nhận học kỳ</button> : sheetStep === 'details' && !isLocked ? (
        <div className="space-y-2">
        <button
            type="button"
            onClick={() => onSheetStepChange('semesters')}
            className="w-full rounded-xl bg-[#004A98] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#003A78]"
        >
            {selectedPlannedSemester ? 'Đổi học kỳ' : 'Lên lịch'}
        </button>
        {selectedPlannedSemester && <button type="button" className="min-h-11 w-full text-sm text-red-600" onClick={onRemoveCourse}>Bỏ khỏi kế hoạch</button>}
        </div>
    ) : undefined;

    return (
        <MobileCourseSheetFrame
            courseCode={course.course_id}
            courseName={course.course_name_vi}
            onClose={onClose}
            footer={footer}
        >
            {sheetStep === 'details' ? (
                <MobileCourseDetailContent
                    compact
                    course={{
                        code: course.course_id,
                        name: course.course_name_vi,
                        credits: course.credits,
                        type: course.course_type,
                        category: course.category,
                        theoryHours: course.theory_hours,
                        labHours: course.lab_hours,
                        exerciseHours: course.exercise_hours,
                        description: course.description,
                    }}
                    status={(
                        <StatusBadge
                            status={course.status || 'none'}
                            rootCompleted={rootCompleted}
                            isPlanned={manuallyPlannedCourseIds.has(course.course_id)}
                        />
                    )}
                    prerequisiteContent={prerequisiteContent}
                    additionalContent={selectedPlannedSemester ? (
                        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                            <p className="text-xs font-medium text-indigo-700">Đã lên lịch ở</p>
                            <p className="mt-0.5 text-sm font-bold text-indigo-900">{selectedPlannedSemester.label}</p>
                        </div>
                    ) : undefined}
                />
            ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                        <button
                            type="button"
                            onClick={() => onSheetStepChange('details')}
                            className="mb-3 text-sm font-semibold text-[#004A98]"
                        >
                            Quay lại
                        </button>
                        <AppSelect ariaLabel="Năm muốn lên kế hoạch" value={targetYear} options={availableYears.map(year => ({ id: year, name: `Năm ${year}` }))} onChange={setTargetYear} triggerClassName="min-h-11" className="mb-3" />
                        {availableSemesters.length === 0 && <p className="py-4 text-sm text-gray-500">Chưa có học kỳ tương lai. Thêm học kỳ ở phần Học kỳ trước.</p>}
                        <div className="space-y-2">
                            {availableSemesters
                                .filter((semester) => yearOf(semester) === targetYear)
                                .map((semester) => {
                                    const semesterIndex = studyPlan.semesters.findIndex((item) => item.id === semester.id);
                                    const plannedIds = studyPlan.plan[semester.id] || [];
                                    const missing = getMissingPrerequisites(course.course_id, semesterIndex);
                                    const isCurrentSemester = selectedPlannedSemester?.id === semester.id;

                                    return (
                                        <button
                                            key={semester.id}
                                            type="button"
                                            onClick={() => setTargetSemesterId(semester.id)}
                                            aria-pressed={targetSemesterId === semester.id}
                                            className={`w-full rounded-lg border p-3 text-left transition-colors ${targetSemesterId === semester.id ? 'border-[#004A98] bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{semester.label}</p>
                                                    <p className="mt-0.5 text-xs text-gray-500">{plannedIds.length} môn · {plannedIds.reduce((sum, id) => sum + (Number(courseById.get(id)?.credits) || 0), 0)} → {plannedIds.reduce((sum, id) => sum + (Number(courseById.get(id)?.credits) || 0), 0) + (plannedIds.includes(course.course_id) ? 0 : Number(course.credits) || 0)} TC môn học</p>
                                                </div>
                                                {isCurrentSemester && (
                                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                        Đang chọn
                                                    </span>
                                                )}
                                            </div>
                                            {missing.length > 0 && (
                                                <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-relaxed text-amber-800">
                                                    Thiếu: {missing.join(', ')}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
            )}
        </MobileCourseSheetFrame>
    );
}
