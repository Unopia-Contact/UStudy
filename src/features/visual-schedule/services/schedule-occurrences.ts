import type { WeeklySchedule, ScheduleSession } from '../types';
import { tryResolvePeriodRange } from '../../../domain/campus';
import { ScheduleLogic } from './schedule-logic';
import { getSessionWeeks } from './holiday-logic';

function applyWeekEdit(schedule: WeeklySchedule, session: ScheduleSession, calendarWeek: number): ScheduleSession {
    const weekOverride = schedule.overrides?.weekOverrides?.[`${calendarWeek}_${session.id}`];
    if (!weekOverride) return session;

    const startPeriod = weekOverride.startPeriod ?? session.startPeriod;
    const endPeriod = weekOverride.endPeriod ?? session.endPeriod;
    const adjusted = ScheduleLogic.adjustPeriodsForPractical(session.type, startPeriod, endPeriod);
    const campusId = weekOverride.campusId ?? session.campusId ?? 'dong-hoa';
    const periodRange = tryResolvePeriodRange(campusId, adjusted.startPeriod, adjusted.endPeriod);

    return {
        ...session,
        ...weekOverride,
        portalLocationCode: weekOverride.room !== undefined && weekOverride.room !== session.room ? undefined : session.portalLocationCode,
        startPeriod: adjusted.startPeriod,
        endPeriod: adjusted.endPeriod,
        startTime: periodRange?.startTime ?? ScheduleLogic.periodToTimeString(adjusted.startPeriod, true, campusId),
        endTime: periodRange?.endTime ?? ScheduleLogic.periodToTimeString(adjusted.endPeriod, false, campusId),
        session: periodRange?.session ?? session.session,
        duration: adjusted.duration,
    };
}

export function buildScheduleCalendar(schedule: WeeklySchedule) {
    const byWeek = new Map<number, ScheduleSession[]>();
    const bySession = new Map<string, { calendarWeek: number; session: ScheduleSession }[]>();
    const holidays = [...(schedule.systemHolidays ?? []), ...(schedule.overrides?.holidays ?? [])];
    let totalWeeks = 1;
    for (const session of schedule.sessions) {
        const { weeks, lastWeek } = getSessionWeeks(session, schedule.semesterStartDate, holidays, schedule.overrides);
        totalWeeks = Math.max(totalWeeks, lastWeek);
        const occurrences = weeks.map(calendarWeek => {
            const adjusted = applyWeekEdit(schedule, session, calendarWeek);
            const row = byWeek.get(calendarWeek) ?? [];
            row.push(adjusted);
            byWeek.set(calendarWeek, row);
            return { calendarWeek, session: adjusted };
        });
        bySession.set(session.id, occurrences);
    }
    return { bySession, byWeek, totalWeeks };
}

export function calendarWeekOf(start: Date | undefined, date: Date) {
    if (!start) return 1;
    const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const first = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    return 1 + Math.floor((day - first) / 604800000);
}
