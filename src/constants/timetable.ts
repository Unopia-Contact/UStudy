import { DONG_HOA_PERIODS } from '../assets/data/campuses';

/** @deprecated Dùng getCampusPeriods(campusId) cho code mới. */
export const timePeriods = DONG_HOA_PERIODS.map((item) => ({
    ...item,
    time: `${item.start} - ${item.end}`,
    label: item.session === 'morning' ? 'Sáng' : item.session === 'afternoon' ? 'Chiều' : 'Tối',
}));

export const weekDays = [
    { day: 2, nameVi: 'Thứ Hai', short: 'T2' },
    { day: 3, nameVi: 'Thứ Ba', short: 'T3' },
    { day: 4, nameVi: 'Thứ Tư', short: 'T4' },
    { day: 5, nameVi: 'Thứ Năm', short: 'T5' },
    { day: 6, nameVi: 'Thứ Sáu', short: 'T6' },
    { day: 7, nameVi: 'Thứ Bảy', short: 'T7' },
];
