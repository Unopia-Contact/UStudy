import { DONG_HOA_PERIODS } from '../assets/data/campuses';

/** @deprecated Dùng getCampusPeriods(campusId) cho code mới. */
export const timePeriods = DONG_HOA_PERIODS.map((item) => ({
    ...item,
    time: `${item.start} - ${item.end}`,
    label: item.session === 'morning' ? 'Sáng' : item.session === 'afternoon' ? 'Chiều' : 'Tối',
}));

export type TimetableDayValue = 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface TimetableDay {
    day: TimetableDayValue;
    nameVi: string;
    label: string;
    short: string;
}

export const weekDays: readonly TimetableDay[] = [
    { day: 2, nameVi: 'Thứ Hai', label: 'Thứ 2', short: 'T2' },
    { day: 3, nameVi: 'Thứ Ba', label: 'Thứ 3', short: 'T3' },
    { day: 4, nameVi: 'Thứ Tư', label: 'Thứ 4', short: 'T4' },
    { day: 5, nameVi: 'Thứ Năm', label: 'Thứ 5', short: 'T5' },
    { day: 6, nameVi: 'Thứ Sáu', label: 'Thứ 6', short: 'T6' },
    { day: 7, nameVi: 'Thứ Bảy', label: 'Thứ 7', short: 'T7' },
    { day: 8, nameVi: 'Chủ nhật', label: 'Chủ nhật', short: 'CN' },
];

const weekDaysWithoutSunday = weekDays.filter((day) => day.day !== 8);

/** T2–T7 luôn hiển thị; Chủ nhật chỉ xuất hiện khi lịch thực tế có ngày 8. */
export function getVisibleWeekDays(dayValues: Iterable<number>): readonly TimetableDay[] {
    for (const day of dayValues) {
        if (day === 8) return weekDays;
    }
    return weekDaysWithoutSunday;
}

export function getScheduleGridTemplate(axisWidth: number, dayCount: number): string {
    return `${axisWidth}px repeat(${dayCount}, minmax(0, 1fr))`;
}
