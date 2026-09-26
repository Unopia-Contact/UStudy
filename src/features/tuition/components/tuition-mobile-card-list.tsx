import type { TuitionCourse, TuitionSummary } from "../types";

export function TuitionMobileCardList({
    currentSemesterData,
    currentSemesterSummary,
}: {
    currentSemesterData: TuitionCourse[],
    currentSemesterSummary: TuitionSummary,
}) {
    return (
        <div className="md:hidden divide-y divide-gray-100">
            {currentSemesterData.map((course) => (
                <div key={course.stt} className="px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p title={course.courseName} className="truncate text-xs font-medium leading-tight text-gray-900">{course.courseName}</p>
                            <p className="mt-0.5 text-[11px] leading-tight text-gray-500">{course.courseCode}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                            <p className="text-xs font-bold text-[#004A98]">{new Intl.NumberFormat('vi-VN').format(course.actualFee)}₫</p>
                            {course.discount > 0 && <p className="text-[10px] text-green-600">-{new Intl.NumberFormat('vi-VN').format(course.discount)}₫</p>}
                        </div>
                    </div>
                </div>
            ))}
            {/* Mobile total */}
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Tổng cộng</span>
                <span className="text-sm font-bold text-[#004A98]">{new Intl.NumberFormat('vi-VN').format(currentSemesterSummary.totalFee)}₫</span>
            </div>
        </div>
    )
}
