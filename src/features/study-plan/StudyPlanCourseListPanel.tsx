import { useEffect, useMemo, useState } from 'react';
import { Info, Search, X } from 'lucide-react';
import { StudyPlanCategoryNode } from './StudyPlanCategoryNode';
import { StudyPlanCourseRow } from './StudyPlanCourseRow';
import { STORAGE_KEYS } from '../../config';
import { readFromStorage, saveToStorage } from '../../helpers/localStorage/save';
import type { CourseDragStartHandler, MobilePlannerOpenHandler, CourseMeta } from './types';
import { getProgramCategoryCreditProgress, getRequiredCredits, getCategoryOptionPath } from './credit-progress';

interface StudyPlanCourseListPanelProps {
    mobileVisible: boolean;
    searchTerm: string;
    categories: Record<string, any>;
    manuallyPlannedCourseIds: Set<string>;
    onSearchTermChange: (value: string) => void;
    onDragStart: CourseDragStartHandler;
    onRemoveFromPlan: (courseId: string) => void;
    onOpenMobilePlanner: MobilePlannerOpenHandler;
}

export function StudyPlanCourseListPanel({
    mobileVisible,
    searchTerm,
    categories,
    manuallyPlannedCourseIds,
    onSearchTermChange,
    onDragStart,
    onRemoveFromPlan,
    onOpenMobilePlanner,
}: StudyPlanCourseListPanelProps) {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
        return readFromStorage<Record<string, boolean>>(STORAGE_KEYS.STUDY_PLAN_CATEGORY_EXPANSION, {});
    });

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.STUDY_PLAN_CATEGORY_EXPANSION, expandedCategories);
    }, [expandedCategories]);

    const handleCategoryExpandedChange = (categoryKey: string, expanded: boolean) => {
        setExpandedCategories((current) => ({
            ...current,
            [categoryKey]: expanded,
        }));
    };

    const creditProgressByPath = useMemo(
        () => getProgramCategoryCreditProgress(categories, manuallyPlannedCourseIds),
        [categories, manuallyPlannedCourseIds]
    );
    const searchResults = useMemo(() => {
        const rows = new Map<string, { course: CourseMeta; categoryName: string; completed: boolean }>();
        const visit = (category: any, path: string) => {
            const progress = creditProgressByPath[path]?.display;
            const required = getRequiredCredits(category);
            for (const course of (category.coursesData ?? []) as CourseMeta[]) {
                if (!rows.has(course.course_id)) rows.set(course.course_id, { course, categoryName: category.name || 'Môn học', completed: required > 0 && (progress?.earnedCredits ?? 0) >= required });
            }
            for (const [key, child] of Object.entries(category.breakdown ?? {})) visit(child, `${path}.${key}`);
            (category.options ?? []).forEach((option: any, index: number) => visit(option, getCategoryOptionPath(path, index)));
        };
        for (const [key, category] of Object.entries(categories)) visit(category, key);
        return [...rows.values()];
    }, [categories, creditProgressByPath]);

    return (
        <section className={`${mobileVisible ? 'block' : 'hidden'} min-w-0 lg:block lg:pr-3`}>
            <div className="hidden lg:flex mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg items-start gap-2 md:gap-3">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-xs md:text-sm text-blue-900 font-medium">
                        Kế hoạch học tập
                    </p>
                    {/* Mô tả chi tiết: ẩn trên mobile */}
                    <p className="hidden md:block text-xs text-blue-700 mt-1">
                        Tiến độ tín chỉ tạm tính cả môn đã tích lũy, môn đang học và môn đã lên lịch.
                    </p>
                    <p className="hidden md:block text-xs text-blue-700 mt-1">
                        Kéo môn chưa học từ chương trình đào tạo sang từng học kỳ ở khung bên phải để phác thảo lộ trình tương lai.
                    </p>
                </div>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã môn hoặc tên môn..."
                        value={searchTerm}
                        onChange={(event) => onSearchTermChange(event.target.value)}
                        aria-label="Tìm môn trong chương trình đào tạo"
                        className="min-h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-12 text-base md:text-sm transition-all focus:border-[#004A98] focus:outline-none focus:ring-2 focus:ring-[#004A98]/20"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => onSearchTermChange('')}
                            aria-label="Xóa từ khóa"
                            className="absolute right-0 top-1/2 h-11 w-11 -translate-y-1/2 flex items-center justify-center transition-colors hover:bg-gray-100"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            {searchTerm.trim() && <div className="space-y-3 lg:hidden">
                <p className="text-xs text-gray-500">{searchResults.length} môn phù hợp</p>
                {searchResults.length === 0 && <p className="py-6 text-sm text-gray-500">Không tìm thấy môn. Thử tên hoặc mã môn khác.</p>}
                {searchResults.map(({ course, categoryName, completed }) => <div key={course.course_id}><StudyPlanCourseRow course={course} isPlanned={manuallyPlannedCourseIds.has(course.course_id)} rootCompleted={completed} onDragStart={onDragStart} onRemoveFromPlan={onRemoveFromPlan} onOpenMobilePlanner={onOpenMobilePlanner} /><p className="mt-1 px-2 text-xs text-gray-500">{categoryName}</p></div>)}
            </div>}
            <div className={`${searchTerm.trim() ? 'hidden lg:block' : ''} space-y-4`}>
                {Object.entries(categories).map(([key, category]) => (
                    <StudyPlanCategoryNode
                        key={key}
                        categoryKey={key}
                        category={category}
                        expandedCategories={expandedCategories}
                        onCategoryExpandedChange={handleCategoryExpandedChange}
                        manuallyPlannedCourseIds={manuallyPlannedCourseIds}
                        creditProgressByPath={creditProgressByPath}
                        onDragStart={onDragStart}
                        onRemoveFromPlan={onRemoveFromPlan}
                        onOpenMobilePlanner={onOpenMobilePlanner}
                        expandForSearch={Boolean(searchTerm.trim())}
                    />
                ))}
            </div>
        </section>
    );
}
