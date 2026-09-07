import {
    ACADEMIC_CALENDAR_2026_2027_DONG_HOA,
    ACADEMIC_CALENDAR_2026_2027_CHO_QUAN,
} from './2026-2027';

export * from './types';
export {
    ACADEMIC_CALENDAR_2026_2027_DONG_HOA,
    ACADEMIC_CALENDAR_2026_2027_CHO_QUAN,
} from './2026-2027';

export const ACADEMIC_CALENDARS = [
    ACADEMIC_CALENDAR_2026_2027_DONG_HOA,
    ACADEMIC_CALENDAR_2026_2027_CHO_QUAN,
];

export function getAcademicCalendars(campusId: import('../../../../domain/campus').CampusId) {
    return ACADEMIC_CALENDARS.filter((calendar) => calendar.campusId === campusId);
}

export function getAcademicCalendar(academicYear: string, campusId: import('../../../../domain/campus').CampusId = 'dong-hoa') {
    return ACADEMIC_CALENDARS.find((calendar) => calendar.academicYear === academicYear && calendar.campusId === campusId) ?? null;
}
