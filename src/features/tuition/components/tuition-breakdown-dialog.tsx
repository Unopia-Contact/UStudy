import { CircleHelp } from 'lucide-react';
import { useState } from 'react';
import { AppDialog } from '../../../components/ui/overlays/app-dialog';
import type { TuitionCourse, TuitionDataSource, TuitionSummary } from '../types';

interface TuitionBreakdownDialogProps {
    courses: TuitionCourse[];
    summary: TuitionSummary;
    source: TuitionDataSource;
}

const numberFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const currencyFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const sourceDescriptions: Record<TuitionDataSource, string> = {
    tuition_page: 'Học phí kỳ này lấy theo dữ liệu đã nhập từ Portal.',
    registration: 'Học phí kỳ này được tạm tính từ danh sách đăng ký.',
    grades: 'Học phí kỳ này được ước tính từ các môn trong lịch sử điểm.',
    none: 'Chưa có dữ liệu học phí cho kỳ này.',
};

export function TuitionBreakdownDialog({ courses, summary, source }: TuitionBreakdownDialogProps) {
    const [open, setOpen] = useState(false);
    const fromPortal = source === 'tuition_page';
    const courseFeeTotal = courses.reduce((total, course) => total + course.tuitionFee, 0);
    const portalDifference = summary.totalFee - courseFeeTotal;

    return (
        <AppDialog
            open={open}
            onOpenChange={setOpen}
            title="Cách tính học phí"
            description={summary.semesterName}
            size="xl"
            className="min-w-0"
            contentClassName="min-w-0 space-y-3"
            mobileFullScreen
            trigger={(
                <button
                    type="button"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#004A98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004A98] md:size-8"
                    title="Cách tính học phí"
                    aria-label="Cách tính học phí"
                >
                    <CircleHelp aria-hidden="true" className="size-5" />
                </button>
            )}
            footer={courses.length > 0 && (
                <div className="flex w-full flex-wrap justify-between gap-x-5 gap-y-1 text-sm tabular-nums text-slate-700">
                    <span>Tổng tín chỉ tính học phí <strong>{numberFormat.format(summary.totalTuitionCredits)}</strong></span>
                    <span>Tổng học phí <strong>{currencyFormat.format(summary.totalFee)}</strong></span>
                    {summary.hasAdvancePayment && (
                        <span>Đã đóng <strong>{currencyFormat.format(summary.advancePayment)}</strong></span>
                    )}
                    <strong className="text-[#004A98]">Còn phải đóng {currencyFormat.format(summary.amountDue)}</strong>
                </div>
            )}
        >
            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{sourceDescriptions[source]}</p>
                {!fromPortal && (
                    <div className="mt-1 space-y-1">
                        <p>Học phí từng môn = Tín chỉ tính học phí × Đơn giá theo mã môn.</p>
                        <p>Tín chỉ tính học phí = (Tiết lý thuyết + thực hành + bài tập) ÷ 15. Nếu môn có trong chương trình đào tạo nhưng tổng số tiết bằng 0, dùng số tín chỉ của môn.</p>
                        <p>Môn thiếu dữ liệu chương trình đào tạo được tạm tính 0 ₫. Môn Nhập môn đầu khóa tính 2 tín chỉ theo đơn giá mặc định.</p>
                    </div>
                )}
            </div>
            {courses.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200" tabIndex={0} role="region" aria-label="Bảng chi tiết tính học phí">
                    <table className="w-full min-w-[40rem] text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-700">
                            <tr>
                                <th scope="col" className="whitespace-nowrap px-3 py-2.5">Mã môn</th>
                                <th scope="col" className="px-3 py-2.5">Tên môn</th>
                                <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right">Tín chỉ</th>
                                <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right">Số tiết</th>
                                <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right">Tín chỉ học phí</th>
                                {!fromPortal && <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right">Đơn giá / tín chỉ</th>}
                                <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right">Học phí</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 border-t border-gray-200 text-slate-800">
                            {courses.map(course => (
                                <tr key={course.stt}>
                                    <th scope="row" className="whitespace-nowrap px-3 py-2.5 align-top font-medium">{course.courseCode}</th>
                                    <td className="w-full min-w-32 px-3 py-2.5">
                                        {course.courseName}
                                        {course.note && <span className="block text-xs text-slate-500">{course.note}</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-right align-top tabular-nums">{numberFormat.format(course.credits)}</td>
                                    <td className="px-3 py-2.5 text-right align-top tabular-nums">{numberFormat.format(course.periods)}</td>
                                    <td className="px-3 py-2.5 text-right align-top tabular-nums">{numberFormat.format(course.tuitionCredits)}</td>
                                    {!fromPortal && (
                                        <td className="whitespace-nowrap px-3 py-2.5 text-right align-top tabular-nums">
                                            {course.pricePerCredit === undefined ? '—' : currencyFormat.format(course.pricePerCredit)}
                                        </td>
                                    )}
                                    <td className="whitespace-nowrap px-3 py-2.5 text-right align-top font-medium tabular-nums">{currencyFormat.format(course.tuitionFee)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {fromPortal && Math.abs(portalDifference) >= 0.5 && (
                <p className="text-sm text-slate-600">
                    Cộng theo từng môn là {currencyFormat.format(courseFeeTotal)}. Tổng học phí ghi trên Portal là {currencyFormat.format(summary.totalFee)}.
                </p>
            )}
        </AppDialog>
    );
}
