// CourseDetailCard.tsx
import { type ScheduleSession } from '../types';
import type { OpenClassDetailTarget } from '../../../components/course';
import { ScheduleNote } from './schedule-note';
import { RoomMapLink } from './RoomMapLink';

const colorClasses = {
    blue: 'border-l-blue-600',
    green: 'border-l-green-600',
    yellow: 'border-l-yellow-600',
    purple: 'border-l-purple-600',
};

const typeLabels = { LT: 'Lý thuyết', TH: 'Thực hành', BT: 'Bài tập' };

export function CourseDetailCard({ session, onOpenClassDetails, weeks, onEdit }: {
    session: ScheduleSession;
    weeks?: number[];
    onEdit: () => void;
    onOpenClassDetails?: (target: OpenClassDetailTarget) => void;
}) {
    const day = session.dayOfWeek === 8 ? 'Chủ nhật' : 'Thứ ' + session.dayOfWeek;
    return (
        <article className={`relative mb-3 w-full rounded-lg border border-gray-200 border-l-4 ${colorClasses[session.color as keyof typeof colorClasses] ?? ''} bg-white p-4 text-left hover:border-gray-300`}
            style={session.color.startsWith('#') ? { borderLeftColor: session.color } : undefined}>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
                <button type="button" onClick={onEdit} aria-label={`Tùy chỉnh môn ${session.courseCode} · ${session.courseName} · ${day} · ${session.startTime}`}
                    className="text-left after:absolute after:inset-0 after:rounded-lg hover:text-[#004A98] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#004A98]">
                    {session.courseCode} - {session.courseName}
                </button>
            </h4>
            <div className="grid grid-cols-2 items-start gap-2 text-xs text-gray-600">
                <span>{session.credits} TC · {typeLabels[session.type]}</span>
                <span className="min-w-0 [&_button]:relative"><RoomMapLink session={session} variant="campus" /></span>
                <span>{weeks?.length ? 'Tuần ' + weeks[0] + (weeks.length > 1 ? '–' + weeks.at(-1) : '') + ' · ' + weeks.length + ' buổi' : 'Chưa có buổi trong lịch'}</span>
                <span>{day} · {session.startTime}</span>
                <span>Lớp: {session.classCode}</span>
                {onOpenClassDetails && <button type="button" className="relative w-fit text-left font-medium text-[#004A98] hover:underline"
                    onClick={() => onOpenClassDetails({ courseCode: session.courseCode, courseName: session.courseName, classId: session.classCode })}>
                    Chi tiết lớp mở
                </button>}
                {session.instructor && <span className="col-span-2">Giảng viên: {session.instructor}</span>}
            </div>
            {session.note && <div className="[&_a]:relative"><ScheduleNote note={session.note} /></div>}
        </article>
    );
}
