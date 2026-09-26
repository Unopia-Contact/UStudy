import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MobileBottomSheet } from '../ui/overlays/mobile-bottom-sheet';

export interface MobileCourseDetailData {
    code: string;
    name: string;
    credits: number;
    type?: string;
    category?: string;
    theoryHours?: number;
    labHours?: number;
    exerciseHours?: number;
    description?: string;
}

interface MobileCourseSheetFrameProps {
    courseCode: string;
    courseName: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
}

interface MobileCourseDetailContentProps {
    course: MobileCourseDetailData;
    status: ReactNode;
    prerequisiteContent: ReactNode;
    additionalContent?: ReactNode;
    compact?: boolean;
}

export function MobileCourseSheetFrame({
    courseCode,
    courseName,
    onClose,
    children,
    footer,
}: MobileCourseSheetFrameProps) {
    return (
        <MobileBottomSheet
            title={courseName}
            eyebrow={courseCode}
            ariaLabel={`Chi tiết môn ${courseCode}`}
            onClose={onClose}
            footer={footer}
            contentClassName="overflow-hidden"
            scrollContent={false}
        >
            {children}
        </MobileBottomSheet>
    );
}

export function MobileCourseDetailContent({
    course,
    status,
    prerequisiteContent,
    additionalContent,
    compact = false,
}: MobileCourseDetailContentProps) {
    if (compact) return <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{course.credits} TC{course.type ? ` · ${course.type}` : ''}</span>{status}</div>
        <section className="mt-4 border-t border-gray-200 pt-4"><h3 className="mb-2 text-sm font-semibold">Điều kiện học</h3>{prerequisiteContent}</section>
        {additionalContent}
        <details className="mt-4 border-t border-gray-200 pt-3"><summary className="min-h-11 cursor-pointer text-sm font-medium text-[#004A98]">Thông tin chương trình đào tạo</summary>
            <p className="text-xs leading-5 text-gray-500">{course.category || 'Chưa có danh mục'} · LT {course.theoryHours || 0} · TH {course.labHours || 0} · BT {course.exerciseHours || 0} tiết</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">{course.description || 'Chưa có ghi chú cho môn học này.'}</p>
        </details>
    </div>;
    return (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm">
                <div className="grid grid-cols-2 gap-3 border-b border-gray-200 pb-3">
                    <div className="p-3">
                        <p className="text-[10px] font-medium uppercase text-gray-500">Tín chỉ</p>
                        <p className="mt-1 text-sm font-bold text-gray-900">{course.credits} TC</p>
                    </div>
                    <div className="p-3">
                        <p className="text-[10px] font-medium uppercase text-gray-500">Loại</p>
                        <p className="mt-1 truncate text-sm font-bold text-gray-900">{course.type || '-'}</p>
                    </div>
                    <div className="p-3">
                        <p className="text-[10px] font-medium uppercase text-gray-500">Trạng thái</p>
                        <div className="mt-1">{status}</div>
                    </div>
                    <div className="p-3">
                        <p className="text-[10px] font-medium uppercase text-gray-500">Danh mục</p>
                        <p className="mt-1 truncate text-xs font-semibold text-gray-900">{course.category || '-'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-gray-200 py-3">
                    <div>
                        <p className="text-[10px] font-medium uppercase text-gray-500">Lý thuyết</p>
                        <p className="mt-1 text-xs font-semibold text-gray-900">{course.theoryHours || 0} tiết</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium uppercase text-gray-500">Thực hành</p>
                        <p className="mt-1 text-xs font-semibold text-gray-900">{course.labHours || 0} tiết</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium uppercase text-gray-500">Bài tập</p>
                        <p className="mt-1 text-xs font-semibold text-gray-900">{course.exerciseHours || 0} tiết</p>
                    </div>
                </div>

                <div className="pt-3">
                    <p className="text-[10px] font-medium uppercase text-gray-500">Ghi chú từ CTĐT</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-700">
                        {course.description || 'Chưa có ghi chú cho môn học này.'}
                    </p>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-gray-900">Tiên quyết</h3>
                </div>
                {prerequisiteContent}
            </div>

            {additionalContent}
        </div>
    );
}
