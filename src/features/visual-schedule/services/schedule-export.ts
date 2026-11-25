import { buildScheduleCalendar } from './schedule-occurrences';
import { toDateInputValue } from './holiday-logic';
import type { ScheduleSession, WeeklySchedule } from '../types';
import { createIcsHelpers, downloadCalendarIcs } from '../../calendar-export';

interface CalendarOccurrence {
    calendarWeek: number;
    session: ScheduleSession;
}

export interface WidgetScheduleEvent {
    date: string;
    startTime: string;
    endTime: string;
    title: string;
    room: string;
    campusId: string;
}

export interface WidgetScheduleSnapshot {
    version: 1;
    generatedAt: number;
    validUntil: string;
    events: WidgetScheduleEvent[];
}

/** Bản lịch tối thiểu cho Android, dùng cùng quy tắc lặp/nghỉ/bù với xuất ICS. */
export function buildWidgetScheduleSnapshot(schedule: WeeklySchedule, now = new Date()): WidgetScheduleSnapshot | null {
    if (!schedule.semesterStartDate) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDay = new Date(today);
    lastDay.setDate(lastDay.getDate() + 30);
    const events: WidgetScheduleEvent[] = [];
    const calendar = buildScheduleCalendar(schedule);

    for (const session of schedule.sessions) {
        for (const occurrence of (calendar.bySession.get(session.id) ?? [])) {
            const current = occurrence.session;
            const date = getDateForWeek(schedule.semesterStartDate, occurrence.calendarWeek, current.dayOfWeek);
            if (date < today || date > lastDay) continue;
            events.push({
                date: toDateInputValue(date),
                startTime: current.startTime,
                endTime: current.endTime,
                title: current.courseName.slice(0, 160),
                room: (current.room || '').slice(0, 80),
                campusId: (current.campusId || '').slice(0, 40),
            });
        }
    }

    events.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title));
    return { version: 1, generatedAt: now.getTime(), validUntil: toDateInputValue(lastDay), events: events.slice(0, 256) };
}

function getDateForWeek(semesterStart: Date, calendarWeek: number, dayOfWeek: ScheduleSession['dayOfWeek']): Date {
    const date = new Date(semesterStart);
    date.setDate(date.getDate() + (calendarWeek - 1) * 7 + dayOfWeek - 2);
    return date;
}

function toDateTime(date: Date, time: string): Date | null {
    const [hour, minute] = time.split(':').map(Number);
    if ([hour, minute].some(Number.isNaN)) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0);
}

function hasCalendarChange(base: ScheduleSession, occurrence: ScheduleSession): boolean {
    return base.dayOfWeek !== occurrence.dayOfWeek
        || base.startTime !== occurrence.startTime
        || base.endTime !== occurrence.endTime
        || base.room !== occurrence.room;
}

function getTypeLabel(type: ScheduleSession['type']): string {
    if (type === 'LT') return 'Ly thuyet';
    if (type === 'TH') return 'Thuc hanh';
    return 'Bai tap';
}

function getDescription(session: ScheduleSession, calendarWeek?: number): string {
    return [
        `Mon: ${session.courseName} (${session.courseCode})`,
        `Lop: ${session.classCode}`,
        `Loai: ${getTypeLabel(session.type)}`,
        `Giang vien: ${session.instructor || 'Dang cap nhat'}`,
        `Tin chi: ${session.credits}`,
        ...(calendarWeek ? [`Tuan dieu chinh: ${calendarWeek}`] : []),
    ].join('\n');
}

interface CalendarEventInput {
    uid: string;
    stamp: string;
    start: Date;
    end: Date;
    session: ScheduleSession;
    recurrenceCount?: number;
    recurrenceId?: Date;
    excludedDates?: Date[];
    calendarWeek?: number;
}

function appendCalendarEvent(lines: string[], input: CalendarEventInput, helpers: ReturnType<typeof createIcsHelpers>) {
    const { toIcsDateTime, esc } = helpers;
    lines.push(
        'BEGIN:VEVENT',
        `UID:${esc(input.uid)}`,
        `DTSTAMP:${input.stamp}`,
        `DTSTART;TZID=Asia/Ho_Chi_Minh:${toIcsDateTime(input.start)}`,
        `DTEND;TZID=Asia/Ho_Chi_Minh:${toIcsDateTime(input.end)}`,
    );

    if (input.recurrenceId) {
        lines.push(`RECURRENCE-ID;TZID=Asia/Ho_Chi_Minh:${toIcsDateTime(input.recurrenceId)}`);
    }
    if (input.recurrenceCount && input.recurrenceCount > 1) {
        lines.push(`RRULE:FREQ=WEEKLY;COUNT=${input.recurrenceCount}`);
    }
    if (input.excludedDates?.length) {
        lines.push(`EXDATE;TZID=Asia/Ho_Chi_Minh:${input.excludedDates.map(toIcsDateTime).join(',')}`);
    }

    lines.push(
        `SUMMARY:${esc(`${input.session.courseCode} - ${input.session.courseName}`)}`,
        `LOCATION:${esc(input.session.room || 'Chua co phong')}`,
        `DESCRIPTION:${esc(getDescription(input.session, input.calendarWeek))}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
    );
}

export function buildCalendarIcs(schedule: WeeklySchedule, now = new Date()): string | null {
    const semesterStart = schedule.semesterStartDate;
    if (!semesterStart) return null;

    const helpers = createIcsHelpers();
    const { toIcsDateTime, esc, foldLine } = helpers;
    const nowStamp = toIcsDateTime(now);
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//HCMUS Portal Tool//Visual Schedule//VI',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${esc(`Thoi khoa bieu - ${schedule.semesterName}`)}`,
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    ];

    const calendar = buildScheduleCalendar(schedule);
    for (const session of schedule.sessions) {
        const occurrences = (calendar.bySession.get(session.id) ?? []);
        if (!occurrences.length) continue;

        const firstOccurrence = occurrences[0];
        const lastOccurrence = occurrences[occurrences.length - 1];
        const recurrenceCount = lastOccurrence.calendarWeek - firstOccurrence.calendarWeek + 1;
        const uid = `${session.id}@hcmus-portal-tool`;
        const baseDate = getDateForWeek(semesterStart, firstOccurrence.calendarWeek, session.dayOfWeek);
        const baseStartDate = toDateTime(baseDate, session.startTime);
        const baseEndDate = toDateTime(baseDate, session.endTime);
        if (!baseStartDate || !baseEndDate) continue;

        if (recurrenceCount === 1) {
            const actualDate = getDateForWeek(semesterStart, firstOccurrence.calendarWeek, firstOccurrence.session.dayOfWeek);
            const actualStart = toDateTime(actualDate, firstOccurrence.session.startTime);
            const actualEnd = toDateTime(actualDate, firstOccurrence.session.endTime);
            if (actualStart && actualEnd) {
                appendCalendarEvent(lines, {
                    uid,
                    stamp: nowStamp,
                    start: actualStart,
                    end: actualEnd,
                    session: firstOccurrence.session,
                }, helpers);
            }
            continue;
        }

        const occurrenceByWeek = new Map(occurrences.map((occurrence) => [occurrence.calendarWeek, occurrence]));
        const excludedDates: Date[] = [];
        const changedOccurrences: CalendarOccurrence[] = [];

        for (let calendarWeek = firstOccurrence.calendarWeek; calendarWeek <= lastOccurrence.calendarWeek; calendarWeek += 1) {
            const occurrence = occurrenceByWeek.get(calendarWeek);
            const recurrenceDate = toDateTime(
                getDateForWeek(semesterStart, calendarWeek, session.dayOfWeek),
                session.startTime,
            );
            if (!recurrenceDate) continue;

            if (!occurrence) {
                excludedDates.push(recurrenceDate);
            } else if (hasCalendarChange(session, occurrence.session)) {
                changedOccurrences.push(occurrence);
            }
        }

        appendCalendarEvent(lines, {
            uid,
            stamp: nowStamp,
            start: baseStartDate,
            end: baseEndDate,
            session,
            recurrenceCount,
            excludedDates,
        }, helpers);

        for (const occurrence of changedOccurrences) {
            const recurrenceId = toDateTime(
                getDateForWeek(semesterStart, occurrence.calendarWeek, session.dayOfWeek),
                session.startTime,
            );
            const actualDate = getDateForWeek(semesterStart, occurrence.calendarWeek, occurrence.session.dayOfWeek);
            const start = toDateTime(actualDate, occurrence.session.startTime);
            const end = toDateTime(actualDate, occurrence.session.endTime);
            if (!recurrenceId || !start || !end) continue;

            appendCalendarEvent(lines, {
                uid,
                stamp: nowStamp,
                start,
                end,
                session: occurrence.session,
                recurrenceId,
                calendarWeek: occurrence.calendarWeek,
            }, helpers);
        }
    }

    lines.push('END:VCALENDAR');
    return `${lines.flatMap(foldLine).join('\r\n')}\r\n`;
}

export function exportCalendar(schedule: WeeklySchedule) {
    const ics = buildCalendarIcs(schedule);
    if (!ics) return false;

    downloadCalendarIcs(ics, `TKB_${schedule.semester.replace(/\//g, '-')}_FullSemester.ics`);
    return true;
}
