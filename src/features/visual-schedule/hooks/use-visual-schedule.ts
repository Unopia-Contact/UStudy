import { useEffect, useState, useMemo, useRef } from 'react';
import { useSchedule } from './use-schedule';
import { useCourseData } from '../../../hooks/useCourseData';
import { buildScheduleCalendar, calendarWeekOf } from '../services/schedule-occurrences';
import { getHolidayDateRange, sortHolidays } from '../services/holiday-logic';
import { exportCalendar } from '../services/schedule-export';
import { getCurrentDayAndTime } from '../services/schedule-helpers';


interface UseVisualScheduleProps {
    selectedSemester?: string;
}

export function useVisualSchedule({ selectedSemester }: UseVisualScheduleProps = {}) {
    const { overrides, updateOverrides, ...baseSchedule } = useSchedule();
    const { isReady, hasData } = useCourseData();

    const [currentWeek, setCurrentWeek] = useState(() => {
        if (!baseSchedule.semesterStartDate) return 1;
        const now = new Date();
        const msDiff = now.getTime() - baseSchedule.semesterStartDate.getTime();
        if (msDiff < 0) return 1;
        const week = Math.floor(msDiff / (7 * 24 * 60 * 60 * 1000)) + 1;
        return week;
    });

    const schedule = useMemo(() => ({
        ...baseSchedule,
        semesterName: baseSchedule.semesterName || selectedSemester || 'Chưa xác định học kỳ',
        overrides,
        updateOverrides
    }), [baseSchedule, selectedSemester, overrides, updateOverrides]);

    const { semesterStartDate } = schedule;
    const lastSemester = useRef(schedule.semester);

    const calendar = useMemo(() => buildScheduleCalendar(schedule),
        [schedule.sessions, semesterStartDate, schedule.systemHolidays, overrides]);
    const { totalWeeks } = calendar;
    useEffect(() => {
        const switchedSemester = lastSemester.current !== schedule.semester;
        lastSemester.current = schedule.semester;
        setCurrentWeek(week => Math.min(Math.max(1, switchedSemester ? calendarWeekOf(semesterStartDate, new Date()) : week), totalWeeks));
    }, [totalWeeks, schedule.semester, semesterStartDate]);
    const displaySessions = calendar.byWeek.get(currentWeek) ?? [];

    const weekRangeStr = useMemo(() => {
        if (!semesterStartDate) return `Tuần ${currentWeek}`;
        const wStart = new Date(semesterStartDate);
        wStart.setDate(wStart.getDate() + (currentWeek - 1) * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 6);
        return `${String(wStart.getDate()).padStart(2, '0')}/${String(wStart.getMonth() + 1).padStart(2, '0')}/${wStart.getFullYear()} - ${String(wEnd.getDate()).padStart(2, '0')}/${String(wEnd.getMonth() + 1).padStart(2, '0')}/${wEnd.getFullYear()}`;
    }, [semesterStartDate, currentWeek]);

    const currentWeekHolidays = useMemo(() => {
        if (!semesterStartDate) return [];
        const weekStart = new Date(semesterStartDate);
        weekStart.setDate(weekStart.getDate() + (currentWeek - 1) * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return sortHolidays([...schedule.systemHolidays, ...schedule.overrides.holidays], semesterStartDate)
            .filter((holiday) => {
                const range = getHolidayDateRange(holiday, semesterStartDate);
                return Boolean(range && range.start <= weekEnd && range.end >= weekStart);
            });
    }, [currentWeek, schedule.systemHolidays, schedule.overrides.holidays, semesterStartDate]);

    const stats = useMemo(() => {
        const uniqueCourseCodes = new Set(displaySessions.map(s => s.courseCode));
        const totalCredits = Array.from(uniqueCourseCodes).reduce((acc, code) => {
            const s = displaySessions.find(s => s.courseCode === code);
            return acc + (s?.credits || 0);
        }, 0);

        const totalPeriods = displaySessions.reduce((acc, s) => acc + s.duration, 0);
        const totalMinutes = totalPeriods * 50;
        const formattedHours = totalMinutes % 60 === 0
            ? `${Math.floor(totalMinutes / 60)} giờ`
            : `${Math.floor(totalMinutes / 60)} giờ ${totalMinutes % 60} phút`;

        return {
            totalCourses: uniqueCourseCodes.size,
            totalCredits,
            totalPeriods,
            formattedHours
        };
    }, [displaySessions]);

    const trends = useMemo(() => {
        if (currentWeek <= 1 || !semesterStartDate) return { periodsTrend: undefined, coursesTrend: undefined };

        const prevSessions = calendar.byWeek.get(currentWeek - 1) ?? [];
        const prevTotalPeriods = prevSessions.reduce((acc, s) => acc + s.duration, 0);
        const prevTotalCourses = new Set(prevSessions.map(s => s.courseCode)).size;

        const diffPeriods = stats.totalPeriods - prevTotalPeriods;
        const diffCourses = stats.totalCourses - prevTotalCourses;

        return {
            periodsTrend: diffPeriods > 0 ? { direction: 'up' as const, value: `+${diffPeriods} tiết` } : (diffPeriods < 0 ? { direction: 'down' as const, value: `${diffPeriods} tiết` } : undefined),
            coursesTrend: diffCourses > 0 ? { direction: 'up' as const, value: `+${diffCourses} môn` } : (diffCourses < 0 ? { direction: 'down' as const, value: `${diffCourses} môn` } : undefined),
        };
    }, [currentWeek, semesterStartDate, calendar, stats.totalPeriods, stats.totalCourses]);

    const { isToday, currentPeriod } = getCurrentDayAndTime();

    const handlePreviousWeek = () => currentWeek > 1 && setCurrentWeek(currentWeek - 1);
    const handleNextWeek = () => currentWeek < totalWeeks && setCurrentWeek(currentWeek + 1);
    const handleExport = () => exportCalendar(schedule);

    return {
        isReady,
        hasData,
        schedule,
        currentWeek,
        totalWeeks,
        weekRangeStr,
        currentWeekHolidays,
        displaySessions,
        stats,
        trends,
        isToday: (day: number) => currentWeek === calendarWeekOf(semesterStartDate, new Date()) && isToday(day),
        setCurrentWeek,
        calendar,
        currentPeriod,
        handlePreviousWeek,
        handleNextWeek,
        handleExport
    };
}
