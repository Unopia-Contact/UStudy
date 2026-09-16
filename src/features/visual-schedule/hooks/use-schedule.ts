import { useMemo, useState, useEffect } from 'react';
import { readFromStorage, saveToStorage } from '../../../helpers/localStorage/save';
import { STORAGE_KEYS } from '../../../config';
import { useDepartmentData } from '../../../context/DepartmentContext';
import { useCampus } from '../../../context/CampusContext';
import { ScheduleLogic } from '../services/schedule-logic';
import { type WeeklySchedule, type ScheduleOverrides, type Holiday } from '../types';
import {
    getProgramScheduleWorkloadOverrides,
    SCHEDULE_WORKLOAD_OVERRIDES_EVENT,
} from '../../settings/services/schedule-workload-preferences';

const EMPTY_OVERRIDES: ScheduleOverrides = { sessionOverrides: {}, weekOverrides: {}, holidays: [] };

function normalizeOverrides(value: ScheduleOverrides | null | undefined): ScheduleOverrides {
    return {
        sessionOverrides: value?.sessionOverrides || {},
        weekOverrides: value?.weekOverrides || {},
        holidays: Array.isArray(value?.holidays) ? value.holidays : [],
    };
}

export function useSchedule(): WeeklySchedule & {
    overrides: ScheduleOverrides;
    systemHolidays: Holiday[];
    updateOverrides: (newOverrides: ScheduleOverrides) => void
} {
    const {
        data: { courses: allCoursesMeta },
        facultyId,
        majorId,
        cohortId,
    } = useDepartmentData();
    const { defaultCampusId, campusRevision } = useCampus();
    const studentDb = readFromStorage<any>(STORAGE_KEYS.STUDENT_DB, null);
    const openCourses = readFromStorage<any[]>(STORAGE_KEYS.COURSE_DB_OFFLINE, []);
    const metadata = readFromStorage<any>(STORAGE_KEYS.IMPORT_META, null);
    const activeGroupSchedule = readFromStorage<any>(STORAGE_KEYS.ACTIVE_GROUP_SCHEDULE, null);
    const legacySavedSchedules = readFromStorage<any>(STORAGE_KEYS.SAVED_SCHEDULES, null);
    const registrationMeta = metadata?.params?.registration;
    const overridesStorageKey = `${STORAGE_KEYS.SCHEDULE_OVERRIDES}:${registrationMeta?.year || 'unknown'}:${registrationMeta?.sem || 'unknown'}`;
    const groupRegistrations = activeGroupSchedule?.registrations ?? legacySavedSchedules?.activeGroupSchedule?.registrations;
    const courses_registered = Array.isArray(groupRegistrations) && groupRegistrations.length > 0
        ? groupRegistrations
        : studentDb?.registrations || [];

    const [systemHolidays, setSystemHolidays] = useState<Holiday[]>([]);
    const [workloadRevision, setWorkloadRevision] = useState(0);

    const readOverridesForSemester = () => {
        const semesterOverrides = readFromStorage<ScheduleOverrides | null>(overridesStorageKey, null);
        if (semesterOverrides) return normalizeOverrides(semesterOverrides);

        // Dữ liệu trước đây dùng một key chung; giữ làm fallback để không mất thiết lập cũ.
        return normalizeOverrides(readFromStorage<ScheduleOverrides>(STORAGE_KEYS.SCHEDULE_OVERRIDES, EMPTY_OVERRIDES));
    };

    // Dùng useState để tránh reload trang khi cập nhật overrides
    const [overrides, setOverrides] = useState<ScheduleOverrides>(readOverridesForSemester);

    useEffect(() => {
        setOverrides(readOverridesForSemester());
    }, [overridesStorageKey]);

    useEffect(() => {
        fetch(`/data/campuses/${defaultCampusId}/holidays.json`)
            .then(res => res.json())
            .then(data => setSystemHolidays(Array.isArray(data) ? data : []))
            .catch(err => console.error('Failed to load system holidays:', err));
    }, [defaultCampusId]);

    useEffect(() => {
        const refreshWorkload = () => setWorkloadRevision((revision) => revision + 1);
        window.addEventListener(SCHEDULE_WORKLOAD_OVERRIDES_EVENT, refreshWorkload);
        window.addEventListener('storage', refreshWorkload);
        return () => {
            window.removeEventListener(SCHEDULE_WORKLOAD_OVERRIDES_EVENT, refreshWorkload);
            window.removeEventListener('storage', refreshWorkload);
        };
    }, []);

    const schedule = useMemo(() => {
        const academicContext = { campusId: defaultCampusId, facultyId, majorId, cohortId };
        return ScheduleLogic.buildScheduleSessions(
            courses_registered,
            allCoursesMeta,
            metadata,
            overrides,
            systemHolidays,
            openCourses,
            defaultCampusId,
            {
                academicContext,
                userOverrides: getProgramScheduleWorkloadOverrides(academicContext),
            },
        );
    }, [courses_registered, metadata, allCoursesMeta, overrides, systemHolidays, openCourses, defaultCampusId, campusRevision, facultyId, majorId, cohortId, workloadRevision]);

    const updateOverrides = (newOverrides: ScheduleOverrides) => {
        const normalized = normalizeOverrides(newOverrides);
        saveToStorage(overridesStorageKey, normalized);
        setOverrides(normalized);
    };

    return {
        ...schedule,
        overrides,
        systemHolidays,
        updateOverrides
    };
}
