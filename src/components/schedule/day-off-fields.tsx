import { getDayOffSession, type DayOffPreference } from '../../utils/dayOffPreferences';

export function DayOffFields({ value, onChange, label = 'Thời gian muốn nghỉ' }: {
    value?: DayOffPreference[]; onChange: (next: DayOffPreference[]) => void; label?: string;
}) {
    return <div className="space-y-2">{[0, 1, 2, 3, 4, 5, 6].map(day => {
        const dayLabel = day === 6 ? 'Chủ nhật' : `Thứ ${day + 2}`;
        return <label key={day} className="flex min-h-11 items-center justify-between gap-3 text-sm"><span>{dayLabel}</span>
            <select aria-label={`${label} ${dayLabel}`} value={getDayOffSession(value, day) ?? 'none'} className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-base" onChange={event => {
                const selection = event.target.value;
                const otherDays = (value ?? []).filter(item => Number(String(item).split(':')[0]) !== day);
                onChange([...otherDays, ...(selection === 'none' ? [] : [selection === 'all' ? day : `${day}:${selection}` as DayOffPreference])]);
            }}><option value="none">Không hạn chế</option><option value="morning">Nghỉ sáng</option><option value="afternoon">Nghỉ chiều</option><option value="all">Nghỉ cả ngày</option></select>
        </label>;
    })}</div>;
}
