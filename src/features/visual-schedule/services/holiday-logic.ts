import type { Holiday, ScheduleSession, ScheduleOverrides } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function atStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function addDays(date: Date, days: number): Date {
    const result = atStartOfDay(date);
    result.setDate(result.getDate() + days);
    return result;
}

function parseLocalDate(value?: string): Date | null {
    if (!value) return null;
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const dmyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!dmyMatch) return null;
    const date = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    return Number.isNaN(date.getTime()) ? null : date;
}

function getTargetJsDay(dayOfWeek: ScheduleSession['dayOfWeek']): number {
    return dayOfWeek === 8 ? 0 : dayOfWeek - 1;
}

function alignToSessionDay(date: Date, dayOfWeek: ScheduleSession['dayOfWeek']): Date {
    const result = atStartOfDay(date);
    const offset = (getTargetJsDay(dayOfWeek) - result.getDay() + 7) % 7;
    result.setDate(result.getDate() + offset);
    return result;
}

export interface HolidayDateRange {
    start: Date;
    end: Date;
}

export function toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getHolidayDateRange(holiday: Holiday, semesterStartDate?: Date): HolidayDateRange | null {
    const explicitStart = parseLocalDate(holiday.startDate);
    if (explicitStart) {
        const explicitEnd = parseLocalDate(holiday.endDate) || explicitStart;
        return {
            start: atStartOfDay(explicitStart),
            end: atStartOfDay(explicitEnd < explicitStart ? explicitStart : explicitEnd),
        };
    }

    if (!semesterStartDate || !holiday.startWeek || holiday.startWeek < 1) return null;
    const start = addDays(semesterStartDate, (holiday.startWeek - 1) * 7);
    const duration = Math.max(1, holiday.duration || 1);
    return { start, end: addDays(start, duration * 7 - 1) };
}

export function getSessionDateForWeek(
    semesterStartDate: Date,
    week: number,
    dayOfWeek: ScheduleSession['dayOfWeek'],
): Date {
    return addDays(semesterStartDate, (Math.max(1, week) - 1) * 7 + dayOfWeek - 2);
}

export function holidayAffectsSessionOnDate(
    holiday: Holiday,
    session: ScheduleSession,
    date: Date,
    semesterStartDate?: Date,
): boolean {
    const affectsCourse = holiday.affectedCourseCodes === 'all'
        || holiday.affectedCourseCodes.includes(session.courseCode);
    if (!affectsCourse) return false;

    const range = getHolidayDateRange(holiday, semesterStartDate);
    if (!range) return false;
    const target = atStartOfDay(date).getTime();
    return target >= range.start.getTime() && target <= range.end.getTime();
}

function getFirstSessionOccurrence(session: ScheduleSession, semesterStartDate: Date): Date {
    return alignToSessionDay(session.startDateParsed || semesterStartDate, session.baseValues?.dayOfWeek ?? session.dayOfWeek);
}

function getPlannedOccurrenceCount(session: ScheduleSession, firstOccurrence: Date): number {
    if (session.totalWeeks > 0) return session.totalWeeks;
    if (!session.endDateParsed) return 25;
    const weeks = Math.floor((atStartOfDay(session.endDateParsed).getTime() - firstOccurrence.getTime()) / (7 * DAY_MS));
    return Math.max(1, weeks + 1);
}

export interface SessionWeeks {
    startWeek: number;
    weekCount: number;
    weeks: number[];
    lastWeek: number;
}

// Weeks are calendar weeks of the semester. An explicit end is inclusive;
// A duration follows the holiday make-up rules, even when explicitly edited.
export function getSessionWeeks(session: ScheduleSession, semesterStart: Date | undefined,
    holidays: Holiday[], overrides?: ScheduleOverrides): SessionWeeks {
    const edit = overrides?.sessionOverrides?.[session.id];
    const first = semesterStart ? getFirstSessionOccurrence(session, semesterStart) : undefined;
    const originalStart = first && semesterStart
        ? 1 + Math.floor((first.getTime() - semesterStart.getTime()) / (7 * DAY_MS)) : 1;
    const start = validWeek(edit?.startWeek) ? edit.startWeek : originalStart;
    const inferred = first ? getPlannedOccurrenceCount(session, first) : session.totalWeeks || 15;
    const explicitCount = validWeek(edit?.weekCount) ? edit.weekCount : undefined;
    const planned = explicitCount ?? inferred;
    const end = explicitCount === undefined && (edit?.endWeek === 0 || validWeek(edit?.endWeek)) ? edit.endWeek : undefined;
    const limit = end ?? start + planned + 104;
    const weeks: number[] = [];
    let consumed = 0;
    let lastWeek = 0;
    for (let week = start; week <= limit && (end !== undefined || consumed < planned); week++) {
        const day = overrides?.weekOverrides?.[week + '_' + session.id]?.dayOfWeek ?? session.dayOfWeek;
        const date = semesterStart && getSessionDateForWeek(semesterStart, week, day);
        const breaks = holidays.filter(holiday => date ? holidayAffectsSessionOnDate(holiday, session, date, semesterStart)
            : !holiday.startDate && holiday.startWeek && week >= holiday.startWeek && week < holiday.startWeek + (holiday.duration || 1)
                && (holiday.affectedCourseCodes === 'all' || holiday.affectedCourseCodes.includes(session.courseCode)));
        if (!breaks.some(holiday => holiday.makeUp !== false)) consumed++;
        lastWeek = week;
        if (!breaks.length && !edit?.hiddenWeeks?.includes(week)) weeks.push(week);
    }
    return { startWeek: start, weekCount: end === undefined ? planned : consumed, weeks, lastWeek };
}

export function validWeek(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 520;
}

export function isSessionActiveInWeek(session: ScheduleSession, week: number, semesterStart: Date | undefined,
    holidays: Holiday[], overrides?: ScheduleOverrides) {
    return getSessionWeeks(session, semesterStart, holidays, overrides).weeks.includes(week);
}

export function getScheduleCalendarWeekCount(sessions: ScheduleSession[], semesterStart: Date | undefined,
    holidays: Holiday[], overrides?: ScheduleOverrides) {
    return sessions.reduce((latest, session) => Math.max(latest,
        getSessionWeeks(session, semesterStart, holidays, overrides).lastWeek), 1);
}

export function sortHolidays(holidays: Holiday[], semesterStartDate?: Date): Holiday[] {
    return [...holidays].sort((first, second) => {
        const firstRange = getHolidayDateRange(first, semesterStartDate);
        const secondRange = getHolidayDateRange(second, semesterStartDate);
        return (firstRange?.start.getTime() ?? Number.MAX_SAFE_INTEGER)
            - (secondRange?.start.getTime() ?? Number.MAX_SAFE_INTEGER);
    });
}
