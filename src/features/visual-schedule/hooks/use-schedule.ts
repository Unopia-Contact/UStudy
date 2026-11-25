import { activeSemester, semesterKey } from '../../../logic/academic-semester';
import { useMemo, useState, useEffect, useSyncExternalStore } from 'react';
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

function subscribeToStorage(refresh: () => void) {
    window.addEventListener('storage', refresh);
    window.addEventListener('ustudy:storage-changed', refresh);
    return () => {
        window.removeEventListener('storage', refresh);
        window.removeEventListener('ustudy:storage-changed', refresh);
    };
}

export function useSchedule(): Omit<WeeklySchedule, 'updateOverrides'> & {
    overrides: ScheduleOverrides;
    systemHolidays: Holiday[];
    updateOverrides: (newOverrides: ScheduleOverrides) => boolean
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
    const groupRegistrations = activeGroupSchedule?.registrations ?? legacySavedSchedules?.activeGroupSchedule?.registrations;
    const courses_registered = Array.isArray(groupRegistrations) && groupRegistrations.length > 0
        ? groupRegistrations
        : studentDb?.registrations || [];

    const inferred = semesterKey(activeSemester(courses_registered, registrationMeta || metadata?.params?.class)).split('/');
    const period = inferred[0] || 'unknown';
    const term = inferred[1] || 'unknown';
    const overridesStorageKey = [STORAGE_KEYS.SCHEDULE_OVERRIDES, period, term].join(':');
    const fullYear = period.split('-').map(year => year.length === 2 ? '20' + year : year).join('-');
    const legacyPeriodKey = [STORAGE_KEYS.SCHEDULE_OVERRIDES, fullYear, term].join(':');

    const [systemHolidays, setSystemHolidays] = useState<Holiday[]>([]);
    const [workloadRevision, setWorkloadRevision] = useState(0);

    const readStored = () => localStorage.getItem(overridesStorageKey) ?? localStorage.getItem(legacyPeriodKey)
        ?? localStorage.getItem(STORAGE_KEYS.SCHEDULE_OVERRIDES);
    const stored = useSyncExternalStore(subscribeToStorage, readStored);
    const overrides = useMemo(() => {
        try { return normalizeOverrides(stored ? JSON.parse(stored) : null); }
        catch { return EMPTY_OVERRIDES; }
    }, [stored]);

    useEffect(() => {
        const controller = new AbortController();
        setSystemHolidays([]);
        fetch(`/data/campuses/${defaultCampusId}/holidays.json`, { signal: controller.signal })
            .then(res => res.json())
            .then(data => setSystemHolidays(Array.isArray(data) ? data : []))
            .catch(err => { if (!controller.signal.aborted) console.error('Failed to load system holidays:', err); });
        return () => controller.abort();
    }, [defaultCampusId]);

    useEffect(() => {
        const refreshWorkload = () => setWorkloadRevision((revision) => revision + 1);
        const refreshAfterUnlock = (event: MessageEvent) => {
            if (event.data?.type === 'CACHE_POPULATED') refreshWorkload();
        };
        window.addEventListener('message', refreshAfterUnlock);
        window.addEventListener(SCHEDULE_WORKLOAD_OVERRIDES_EVENT, refreshWorkload);
        window.addEventListener('storage', refreshWorkload);
        return () => {
            window.removeEventListener('message', refreshAfterUnlock);
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

    useEffect(() => {
        if (schedule.overrides && schedule.overrides !== overrides && readStored() === stored) {
            saveToStorage(overridesStorageKey, schedule.overrides);
        }
    }, [schedule.overrides, overrides, overridesStorageKey, stored]);

    const updateOverrides = (newOverrides: ScheduleOverrides) => {
        const normalized = normalizeOverrides(newOverrides);
        if (readStored() !== stored) return false;
        if (!saveToStorage(overridesStorageKey, normalized)) return false;
        return true;
    };

    return {
        ...schedule,
        overrides: schedule.overrides ?? overrides,
        systemHolidays,
        updateOverrides
    };
}
