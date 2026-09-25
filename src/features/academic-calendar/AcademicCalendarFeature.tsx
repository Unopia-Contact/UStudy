import { useEffect, useMemo, useRef, useState } from 'react';
import { getAcademicCalendar, getAcademicCalendars } from '../../assets/data/academic-calendar';
import { useDepartmentData } from '../../context/DepartmentContext';
import {
    type AcademicCalendarTermFilter,
    ACADEMIC_TERM_LABELS,
    getCalendarCohort,
    getCalendarPosition,
    getVisibleWeeks,
} from './academic-calendar-utils';
import { AcademicCalendarTable } from './components/AcademicCalendarTable';
import { AcademicCalendarToolbar } from './components/AcademicCalendarToolbar';
import { useCampus } from '../../context/CampusContext';

export function AcademicCalendarFeature() {
    const { cohortId, currentCohort } = useDepartmentData();
    const { defaultCampusId, defaultCampus } = useCampus();
    const campusCalendars = useMemo(() => getAcademicCalendars(defaultCampusId), [defaultCampusId]);
    const academicYearOptions = useMemo(
        () => campusCalendars.map((calendar) => ({ id: calendar.academicYear, name: calendar.academicYear })),
        [campusCalendars],
    );
    const [academicYear, setAcademicYear] = useState(campusCalendars[0]?.academicYear ?? '');
    const [term, setTerm] = useState<AcademicCalendarTermFilter>('all');
    const currentWeekRef = useRef<HTMLTableRowElement>(null);

    const calendar = getAcademicCalendar(academicYear, defaultCampusId);

    useEffect(() => {
        if (!campusCalendars.some((item) => item.academicYear === academicYear)) {
            setAcademicYear(campusCalendars[0]?.academicYear ?? '');
        }
    }, [academicYear, campusCalendars]);
    const calendarCohort = useMemo(
        () => calendar ? getCalendarCohort(calendar, cohortId) : null,
        [calendar, cohortId],
    );
    const visibleWeeks = useMemo(
        () => calendar ? getVisibleWeeks(calendar, term) : [],
        [calendar, term],
    );
    const position = useMemo(() => calendar ? getCalendarPosition(calendar) : null, [calendar]);

    useEffect(() => {
        if (!position?.currentWeek || !visibleWeeks.some((week) => week.index === position.currentWeek?.index)) return;
        const frame = window.requestAnimationFrame(() => currentWeekRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
        return () => window.cancelAnimationFrame(frame);
    }, [academicYear, term, position?.currentWeek?.index, visibleWeeks]);

    if (!calendar) {
        return <div className="py-12 text-center text-sm text-gray-500">Chưa có dữ liệu kế hoạch năm học cho {defaultCampus.name}.</div>;
    }

    const currentWeek = position?.currentWeek;
    return (
        <section className="mt-5 space-y-6">
            <AcademicCalendarToolbar
                academicYear={academicYear}
                academicYearOptions={academicYearOptions}
                onAcademicYearChange={setAcademicYear}
                term={term}
                onTermChange={setTerm}
                calendarCohort={calendarCohort}
                currentCohort={currentCohort}
            />

            {calendarCohort ? (
                <AcademicCalendarTable
                    calendar={calendar}
                    weeks={visibleWeeks}
                    currentCohortId={calendarCohort.id}
                    currentWeekIndex={currentWeek?.index}
                    currentWeekRef={currentWeekRef}
                />
            ) : (
                <div className="border-y border-gray-200 py-12 text-center">
                    <p className="text-sm font-medium text-gray-700">Kế hoạch này chưa có lộ trình riêng cho {currentCohort?.name ?? 'khóa đang chọn'}.</p>
                    <p className="mt-1 text-sm text-gray-500">Các mốc chung sẽ được bổ sung khi có kế hoạch phù hợp.</p>
                </div>
            )}

            {term !== 'all' && (
                <p className="text-xs text-gray-500">Đang xem {ACADEMIC_TERM_LABELS[term]} của năm học {calendar.academicYear}.</p>
            )}
        </section>
    );
}
