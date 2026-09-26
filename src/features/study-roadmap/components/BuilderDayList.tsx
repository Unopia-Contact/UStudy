import { useEffect, useMemo, useState } from 'react';
import type { ClassSection } from '../../../types';
import { getVisibleWeekDays } from '../../../constants';
import { getClassSectionTimeRange } from '../../../components/schedule/schedule-timeline';
import { getConflicts } from '../../../logic/ScheduleValidator';
import { useCampus } from '../../../context/CampusContext';

export function BuilderDayList({ sections, onOpen }: { sections: ClassSection[]; onOpen: (courseCode: string) => void }) {
    const { defaultCampusId } = useCampus();
    const days = useMemo(() => getVisibleWeekDays(sections.map(s => s.day)), [sections]);
    const [day, setDay] = useState(() => sections[0]?.day ?? 0);
    useEffect(() => { if (!days.some(d => d.day === day)) setDay(days[0]?.day ?? 0); }, [days, day]);
    const lessons = sections.filter(s => s.day === day).sort((a, b) =>
        getClassSectionTimeRange(a, defaultCampusId).startMinute - getClassSectionTimeRange(b, defaultCampusId).startMinute);
    return <div className="space-y-3">
        <div className="flex gap-1" aria-label="Ngày xem lịch">
            {days.map(d => <button type="button" key={d.day} aria-pressed={d.day === day} onClick={() => setDay(d.day)} className={`min-h-11 min-w-0 flex-1 rounded-lg text-sm font-medium ${d.day === day ? 'bg-[#004A98] text-white' : 'bg-gray-100 text-gray-600'}`}>{d.short}</button>)}
        </div>
        <p className="text-xs leading-5 text-gray-500">Lịch dự kiến theo thứ, không riêng một tuần. Xem chi tiết lớp để kiểm tra thời gian áp dụng.</p>
        {lessons.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Chưa có buổi học vào ngày này.</p> : lessons.map(s => {
            const time = getClassSectionTimeRange(s, defaultCampusId);
            const conflicting = getConflicts(s, sections, defaultCampusId).length > 0;
            return <button type="button" key={s.id} onClick={() => onOpen(s.courseCode)} className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left">
                <p className="text-sm font-semibold tabular-nums text-[#004A98]">{time.startTime}–{time.endTime}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{s.courseName}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{s.courseCode} · Lớp {s.selectedClassId || s.sectionNumber} · {s.room ? `Phòng ${s.room}` : 'Chưa có phòng'}</p>
                {conflicting && <p className="mt-2 text-xs text-amber-700">Có xung đột · Kiểm tra lớp</p>}
            </button>;
        })}
    </div>;
}
