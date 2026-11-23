import { CircleHelp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppSelect } from '../../../components/ui/form/app-select';
import { SectionTabs } from '../../../components/ui/navigation/section-tabs';
import { AppDialog } from '../../../components/ui/overlays/app-dialog';
import {
    buildCumulativeGPABreakdown,
    buildSemesterGPABreakdowns,
    type GPABreakdownTab,
    type GPAGroup,
} from '../services/gpa-breakdown';

type GPABreakdownDialogProps = Parameters<typeof buildCumulativeGPABreakdown>[2] & {
    rawGrades: Parameters<typeof buildSemesterGPABreakdowns>[0];
};

const tabs = [
    { id: 'current', label: 'Hiện tại' },
    { id: 'projected', label: 'Dự kiến' },
    { id: 'group', label: 'Theo nhóm' },
    { id: 'semester', label: 'Học kỳ' },
] as const;

const groups: { id: GPAGroup; name: string }[] = [
    { id: 'foundation', name: 'Cơ sở ngành' },
    { id: 'specialized', name: 'Chuyên ngành' },
];

const descriptions = {
    current: <> <strong>GPA hiện tại</strong> - Lấy điểm chính thức mới nhất của mỗi mã môn. Chỉ tính môn đạt từ <strong>5,0</strong>.</>,
    projected: <> <strong>GPA dự kiến</strong> - Tính lại GPA hiện tại với điểm bạn nhập trong Kế hoạch GPA. Chỉ tính điểm từ <strong>5,0</strong>.</>,
    group: <> <strong>GPA cơ sở ngành/chuyên ngành</strong> - Tính như GPA hiện tại, chỉ lấy các môn thuộc nhóm Cơ sở ngành/chuyên ngành.</>,
    semester: <> <strong>GPA học kỳ</strong> - Tính các môn có điểm trong kỳ, <strong>kể cả môn dưới 5,0</strong>. Bỏ qua điểm cải thiện (<code>CT</code>).</>,
};

const numberFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 });
const gpaFormat = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GPABreakdownDialog({
    rawGrades, history, projectedCourses, projectionSemesters, allCoursesMeta,
}: GPABreakdownDialogProps) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<GPABreakdownTab>('current');
    const [scale, setScale] = useState<4 | 10>(10);
    const [group, setGroup] = useState<GPAGroup>('foundation');
    const [selectedSemester, setSelectedSemester] = useState('');

    const semesters = useMemo(
        () => open && tab === 'semester' ? buildSemesterGPABreakdowns(rawGrades) : null,
        [open, tab, rawGrades],
    );
    const semesterOptions = Array.from(semesters?.keys() ?? [])
        .sort((left, right) => right.localeCompare(left))
        .map(semester => ({ id: semester, name: semester }));
    const semester = semesters?.has(selectedSemester) ? selectedSemester : semesterOptions[0]?.id ?? '';
    const rows = useMemo(() => {
        if (!open) return [];
        if (tab === 'semester') return semesters?.get(semester) ?? [];
        return buildCumulativeGPABreakdown(tab, group, { history, projectedCourses, projectionSemesters, allCoursesMeta });
    }, [open, tab, group, semester, semesters, history, projectedCourses, projectionSemesters, allCoursesMeta]);

    const totals = rows.reduce((sum, row) => ({
        credits: sum.credits + row.countedCredits,
        points: sum.points + (scale === 4 ? row.fourPointPoints : row.points),
    }), { credits: 0, points: 0 });

    return (
        <AppDialog
            open={open}
            onOpenChange={setOpen}
            title="Cách tính GPA"
            description="Điểm và tín chỉ theo từng môn."
            size="xl"
            className="min-w-0"
            contentClassName="min-w-0 space-y-3"
            mobileFullScreen
            trigger={(
                <button
                    type="button"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#004A98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004A98] md:size-8"
                    title="Cách tính GPA"
                    aria-label="Cách tính GPA"
                >
                    <CircleHelp aria-hidden="true" className="size-5" />
                </button>
            )}
            footer={(
                <div className="flex w-full flex-wrap items-center justify-between gap-x-5 gap-y-1 text-sm tabular-nums text-slate-700" aria-live="polite">
                    <span>Tổng tín chỉ tính GPA <strong className="ml-1">{numberFormat.format(totals.credits)}</strong></span>
                    <strong className="text-[#004A98]">
                        GPA hệ {scale} = {totals.credits > 0
                            ? `${numberFormat.format(totals.points)} ÷ ${numberFormat.format(totals.credits)} = ${gpaFormat.format(totals.points / totals.credits)}`
                            : '—'}
                    </strong>
                </div>
            )}
        >
            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">GPA = Tổng (điểm môn × tín chỉ) ÷ tổng tín chỉ được tính</p>
                <p className="mt-1">Môn chưa có điểm và các mã môn điều kiện như GDTC, Ngoại ngữ, GDQP-AN, Tin học cơ sở bị bỏ qua. Dòng gạch ngang không được cộng vào tổng điểm hoặc tổng tín chỉ.</p>
            </div>

            <SectionTabs tabs={tabs} activeTab={tab} onChange={setTab} ariaLabel="Loại GPA" />

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <p className="min-w-0 flex-1 basis-64">{descriptions[tab]}</p>
                {tab === 'group' && (
                    <AppSelect
                        ariaLabel="Nhóm môn"
                        className="w-full sm:w-48"
                        value={group}
                        options={groups}
                        onChange={value => setGroup(value === 'specialized' ? 'specialized' : 'foundation')}
                    />
                )}
                {tab === 'semester' && semesterOptions.length > 0 && (
                    <AppSelect
                        ariaLabel="Chọn học kỳ"
                        className="w-full sm:w-48"
                        value={semester}
                        options={semesterOptions}
                        onChange={setSelectedSemester}
                    />
                )}
                <div className="inline-flex shrink-0 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Hệ điểm">
                    {([4, 10] as const).map(value => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={scale === value}
                            onClick={() => setScale(value)}
                            className="min-h-9 rounded-md px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004A98] aria-pressed:bg-[#004A98] aria-pressed:text-white"
                        >
                            Hệ {value}
                        </button>
                    ))}
                </div>
            </div>

            {rows.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200" tabIndex={0} role="region" aria-label="Bảng chi tiết tính GPA">
                    <table className="w-full min-w-[34rem] text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-700">
                            <tr>
                                <th scope="col" className="px-3 py-2.5 whitespace-nowrap">Mã môn</th>
                                <th scope="col" className="px-3 py-2.5">Tên môn</th>
                                <th scope="col" className="px-3 py-2.5 text-right whitespace-nowrap">Điểm hệ {scale}</th>
                                <th scope="col" className="px-3 py-2.5 text-right whitespace-nowrap">Tín chỉ</th>
                                <th scope="col" className="px-3 py-2.5 text-right whitespace-nowrap">Điểm × tín chỉ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 border-t border-gray-200">
                            {rows.map((row, index) => {
                                const score = scale === 4 ? row.fourPointScore : row.score;
                                const points = scale === 4 ? row.fourPointPoints : row.points;
                                return (
                                    <tr key={`${row.code}-${index}`} className={row.exclusion ? 'text-red-400' : 'text-slate-800'}>
                                        <th scope="row" className="px-3 py-2.5 align-top font-medium whitespace-nowrap">
                                            <span className={row.exclusion ? 'line-through' : undefined}>{row.code}</span>
                                        </th>
                                        <td className="w-full px-3 py-2.5">
                                            <span className={row.exclusion ? 'line-through' : undefined}>{row.name}</span>
                                            {row.exclusion && row.exclusion !== 'Môn điều kiện' && <span className="block text-xs">{row.exclusion}</span>}
                                            {row.projected && !row.exclusion && <span className="block text-xs text-slate-500">Điểm dự kiến</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-right align-top tabular-nums">
                                            <span className={row.exclusion ? 'line-through' : undefined}>
                                                {score !== null && Number.isFinite(score) ? numberFormat.format(score) : '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right align-top tabular-nums">
                                            <span className={row.exclusion ? 'line-through' : undefined}>
                                                {row.credits === null ? '—' : numberFormat.format(row.credits)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right align-top font-medium tabular-nums">
                                            {row.exclusion ? '—' : numberFormat.format(points)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-sm text-slate-600">
                    {tab === 'semester' ? 'Chưa có dữ liệu điểm theo học kỳ.' : 'Chưa có dữ liệu môn học để tính GPA.'}
                </p>
            )}
        </AppDialog>
    );
}
