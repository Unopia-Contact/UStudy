import { cycleDayOffSession, formatDayOffSession, getDayOffSession, type DayOffPreference } from '../../utils/dayOffPreferences';

export function DayOffFields({ value, onChange, label = 'Thời gian muốn nghỉ' }: {
    value?: DayOffPreference[]; onChange: (next: DayOffPreference[]) => void; label?: string;
}) {
    return <div className="flex flex-wrap gap-2">{[0, 1, 2, 3, 4, 5, 6].map(day => {
        const dayLabel = day === 6 ? 'Chủ nhật' : `Thứ ${day + 2}`;
        const session = getDayOffSession(value, day);
        return <button key={day} type="button" onClick={() => onChange(cycleDayOffSession(value, day))}
            aria-label={`${label} ${dayLabel}: ${session ? formatDayOffSession(session) : 'Không hạn chế'}`}
            title="Bấm lần lượt: nghỉ cả ngày, nghỉ sáng, nghỉ chiều, bỏ chọn"
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg border text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${session === 'all'
                ? 'border-red-500 bg-red-500 text-white'
                : session === 'morning'
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : session === 'afternoon'
                        ? 'border-orange-300 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-400 hover:border-red-300'}`}>
            <span>{day === 6 ? 'CN' : `T${day + 2}`}</span>
            {session && <span className="mt-0.5 text-[9px] font-medium leading-none">{formatDayOffSession(session)}</span>}
        </button>;
    })}</div>;
}
