import { describe, expect, it } from 'vitest';

import { buildDashboardCalendarEvents } from '../../../src/features/dashboard/services/dashboard-calendar-events';
import { buildScheduleCalendar } from '../../../src/features/visual-schedule/services/schedule-occurrences';
import { moveSessionEdits, reconcileSessionEdits } from '../../../src/features/visual-schedule/services/schedule-overrides';
import { buildCalendarIcs, buildWidgetScheduleSnapshot } from '../../../src/features/visual-schedule/services/schedule-export';
import type { ScheduleSession, WeeklySchedule } from '../../../src/features/visual-schedule/types';

const semesterStart = new Date(2026, 0, 5);

const session: ScheduleSession = {
  id: 'CSC10009|24CTT1|LT|1',
  courseCode: 'CSC10009',
  courseName: 'Co so du lieu',
  classCode: '24CTT1',
  credits: 4,
  type: 'LT',
  instructor: 'Giang vien',
  room: 'F101',
  dayOfWeek: 2,
  startPeriod: 1,
  endPeriod: 3,
  startTime: '07:30',
  endTime: '10:00',
  color: 'blue',
  session: 'morning',
  duration: 3,
  totalWeeks: 3,
  startDate: '05/01/2026',
  endDate: '19/01/2026',
  startDateParsed: semesterStart,
  endDateParsed: new Date(2026, 0, 19),
};

function createSchedule(overrides: WeeklySchedule['overrides'] = {
  sessionOverrides: {},
  weekOverrides: {},
  holidays: [],
}): WeeklySchedule {
  return {
    semester: '25-26/3',
    semesterName: 'Hoc ky 3',
    weekNumber: 1,
    weekRange: '',
    totalCourses: 1,
    totalCredits: 4,
    totalPeriodsPerWeek: 3,
    totalHoursPerWeek: 3,
    sessions: [session],
    semesterStartDate: semesterStart,
    systemHolidays: [],
    overrides,
  };
}

describe('schedule calendar export', () => {
  it('exports one weekly recurring event instead of one event per week', () => {
    const ics = buildCalendarIcs(createSchedule(), new Date(2026, 0, 1));

    expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=3');
    expect(ics?.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('DTSTART;TZID=Asia/Ho_Chi_Minh:20260105T073000');
  });

  it('keeps skipped weeks as recurrence exceptions', () => {
    const ics = buildCalendarIcs(createSchedule({
      sessionOverrides: {
        [session.id]: { hiddenWeeks: [2] },
      },
      weekOverrides: {},
      holidays: [],
    }), new Date(2026, 0, 1));

    expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=3');
    expect(ics).toContain('EXDATE;TZID=Asia/Ho_Chi_Minh:20260112T073000');
    expect(ics?.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  it('keeps a one-week room change as one recurrence exception', () => {
    const ics = buildCalendarIcs(createSchedule({
      sessionOverrides: {},
      weekOverrides: {
        [`2_${session.id}`]: { room: 'F202' },
      },
      holidays: [],
    }), new Date(2026, 0, 1));

    expect(ics?.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('RECURRENCE-ID;TZID=Asia/Ho_Chi_Minh:20260112T073000');
    expect(ics).toContain('LOCATION:F202');
  });
});


describe('effective teaching weeks', () => {
  it('shares an extended, moved lesson across the grid, calendar, widget, and reminder input', () => {
    const schedule = createSchedule({
      sessionOverrides: { [session.id]: { endWeek: 6 } },
      weekOverrides: { ['6_' + session.id]: { dayOfWeek: 4, room: 'F202' } },
      holidays: [{ id: 'holiday', startDate: '2026-02-02', reason: 'Nghỉ', affectedCourseCodes: 'all' }],
    });
    const calendar = buildScheduleCalendar(schedule);
    expect(calendar.totalWeeks).toBe(6);
    expect(calendar.bySession.get(session.id)?.map(row => row.calendarWeek)).toEqual([1, 2, 3, 4, 6]);
    const queryDate = new Date(2026, 1, 9);
    const widget = buildWidgetScheduleSnapshot(schedule, queryDate);
    expect(widget?.events.map(event => [event.date, event.room])).toEqual([['2026-02-11', 'F202']]);
    const dashboard = buildDashboardCalendarEvents(schedule, {}, ['classes'], 7, queryDate);
    expect(dashboard.map(event => [event.date.getDate(), event.room])).toEqual([[11, 'F202']]);
    const ics = buildCalendarIcs(schedule);
    expect(ics).toContain('COUNT=6');
    expect(ics).toContain('20260211T073000');
    expect(ics).toContain('EXDATE;TZID=Asia/Ho_Chi_Minh:20260202T073000');
  });

  it('counts teaching weeks from the selected start and honors make-up and legacy exceptions', () => {
    const schedule = createSchedule({
      sessionOverrides: { [session.id]: { startWeek: 3, weekCount: 4, hiddenWeeks: [5] } },
      weekOverrides: { ['6_' + session.id]: { room: 'B201' } },
      holidays: [{ id: 'break', startWeek: 4, duration: 1, reason: '', affectedCourseCodes: 'all', makeUp: true }],
    });
    const occurrences = () => buildScheduleCalendar(schedule).bySession.get(session.id)?.map(row => [row.calendarWeek, row.session.room]);
    expect(occurrences()).toEqual([[3, 'F101'], [6, 'B201'], [7, 'F101']]);
    schedule.overrides!.holidays[0].makeUp = false;
    expect(occurrences()).toEqual([[3, 'F101'], [6, 'B201']]);
  });

  it('keeps automatic make-up, hidden weeks and ending before the first week distinct', () => {
    const schedule = createSchedule();
    schedule.overrides!.holidays.push({ id: 'h', startWeek: 2, duration: 1, reason: '', affectedCourseCodes: 'all' });
    schedule.overrides!.sessionOverrides[session.id] = { hiddenWeeks: [1] };
    expect(buildScheduleCalendar(schedule).bySession.get(session.id)?.map(row => row.calendarWeek)).toEqual([3, 4]);
    schedule.overrides!.holidays[0].makeUp = false;
    expect(buildScheduleCalendar(schedule).bySession.get(session.id)?.map(row => row.calendarWeek)).toEqual([3]);
    schedule.overrides!.sessionOverrides[session.id] = { endWeek: 0 };
    expect(buildScheduleCalendar(schedule).bySession.get(session.id)).toEqual([]);
  });

  it('preserves both kinds of edit on a room change and leaves ambiguous meetings for explicit selection', () => {
    const from = 'A|01|LT|T2(1-4)-X';
    const to = 'A|01|LT|T2(1-4)-Y';
    const edits = { sessionOverrides: { [from]: { endWeek: 8 } }, weekOverrides: { ['4_' + from]: { room: 'Z' } }, holidays: [] };
    const retargeted = reconcileSessionEdits(edits, new Set([to]));
    expect(retargeted.overrides.weekOverrides['4_' + to]).toEqual({ room: 'Z' });
    expect(retargeted.overrides.sessionOverrides[to]).toEqual({ endWeek: 8 });
    const candidates = ['A|01|LT|T3(1-4)', 'A|01|LT|T5(1-4)'];
    const ambiguous = reconcileSessionEdits(edits, new Set(candidates));
    expect(ambiguous.unassigned).toEqual([{ from, candidates }]);
    expect(ambiguous.overrides).toBe(edits);
    // The remaining Tuesday class may have already existed when Monday was removed.
    const single = reconcileSessionEdits(edits, new Set([candidates[0]]));
    expect(single.unassigned).toEqual([{ from, candidates: [candidates[0]] }]);
    expect(moveSessionEdits(edits, from, candidates[1]).sessionOverrides[candidates[1]]).toEqual({ endWeek: 8 });
  });
});
