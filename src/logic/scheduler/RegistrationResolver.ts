import { registrationsForSemester, type NormalizedSemester } from '../academic-semester';
export { normalizeSemester, type NormalizedSemester } from '../academic-semester';
/**
 * RegistrationResolver.ts
 *
 * Logic thuần (không React) chuyển đổi raw registrations từ Portal
 * thành RegisteredCourse[] + combined schedule mask.
 *
 * Invariant: Output là immutable-friendly — mask serialize thành number[].
 */

import { encodeScheduleToMask } from '../Utils';
import { normalizeCourseCode } from '../course-identity';
import { Bitset } from './Bitset';
import {
    DEFAULT_CAMPUS_ID,
    detectCampusFromPeriodRanges,
    reconcileRegistrationCampus,
    resolveCampus,
    type CampusId,
    type SessionCampus,
} from '../../domain/campus';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RegisteredComponent {
    courseType: 'LT' | 'TH' | 'BT';
    classGroup: string;
    schedule: string;
    room?: string;
    campus?: SessionCampus;
}

export interface RegisteredCourse {
    courseCode: string;
    courseName: string;
    components: RegisteredComponent[];
    /** Serialized Bitset mask — OR of all component schedules. */
    scheduleMask: number[];
    semester?: string;
}

export interface RawRegistration {
    id: string;
    name?: string;
    classGroup?: string;
    courseType?: string;   // "LT" / "TH" / "BT"
    schedule?: string;     // "T2(1-4) - F201"
    semester?: string;     // "HK1 (2026-2027)"
    [key: string]: any;
}

/**
 * Tách schedule string ra phần lịch và phần phòng.
 * "T2(1-4) - F201" → { schedule: "T2(1-4)", room: "F201" }
 * "T2(1-4)"        → { schedule: "T2(1-4)", room: undefined }
 */
function parseScheduleAndRoom(raw: string): { schedule: string; room?: string } {
    const schedulePattern = /T(?:\d|CN)\s*\([\d.]+\s*-\s*[\d.]+\)/gi;
    const scheduleParts = raw.match(schedulePattern) || [];
    const schedule = scheduleParts.join('; ');

    // Chỉ lấy phần sau dấu '-' nằm SAU dấu ')' của lịch. Không split toàn chuỗi,
    // vì dấu '-' trong T2(1-3) là khoảng tiết chứ không phải dấu ngăn phòng.
    const roomMatch = raw.match(/\)\s*-\s*([^;,]+)/);
    const candidateRoom = roomMatch?.[1]?.trim();
    const roomAfterLabel = candidateRoom?.includes(':')
        ? candidateRoom.slice(candidateRoom.lastIndexOf(':') + 1).trim()
        : candidateRoom;
    const room = roomAfterLabel && !/^T(?:\d|CN)\s*\(/i.test(roomAfterLabel)
        ? roomAfterLabel
        : undefined;

    return { schedule, room };
}

function getPeriodRanges(schedule: string): Array<{ startPeriod: number; endPeriod: number }> {
    return [...schedule.matchAll(/T(?:\d|CN)\s*\((\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\)/gi)]
        .map((match) => ({
            startPeriod: Number.parseFloat(match[1]),
            endPeriod: Number.parseFloat(match[2]),
        }));
}

// ── Main Resolver ──────────────────────────────────────────────────────────────

export interface ResolveOptions {
    /** Học kỳ hiện tại — chỉ lấy registrations khớp. */
    currentSemester?: NormalizedSemester | null;
    /**
     * Nếu true, khi registration thiếu semester thì coi như thuộc currentSemester.
     * Dùng khi biết chắc dataset là snapshot của kỳ hiện tại.
     */
    acceptMissingSemester?: boolean;
    /** Danh sách lớp mở đã xử lý, dùng để xác định campus cho KQĐKHP. */
    openCourses?: any[];
    /** CÆ¡ sá»Ÿ dÃ¹ng khi KQÄKHP khÃ´ng Ä‘á»‘i chiáº¿u Ä‘Æ°á»£c vá»›i lá»›p má»Ÿ. */
    defaultCampusId?: CampusId;
}

/**
 * Chuyển raw registrations → RegisteredCourse[].
 *
 * 1. Lọc semester.
 * 2. Nhóm theo courseCode.
 * 3. Tính combined schedule mask (OR).
 */
export function resolveRegistrations(
    rawRegistrations: RawRegistration[],
    options: ResolveOptions = {},
): RegisteredCourse[] {
    if (!Array.isArray(rawRegistrations) || rawRegistrations.length === 0) {
        return [];
    }

    const {
        currentSemester = null,
        acceptMissingSemester = true,
        openCourses = [],
        defaultCampusId = DEFAULT_CAMPUS_ID,
    } = options;

    // 1. Lọc theo semester
    const filtered = registrationsForSemester(rawRegistrations, currentSemester, acceptMissingSemester);

    if (filtered.length === 0) return [];

    // 2. Nhóm theo courseCode (id)
    const grouped = new Map<string, {
        courseName: string;
        components: RegisteredComponent[];
        semester?: string;
    }>();

    for (const reg of filtered) {
        const code = normalizeCourseCode(reg.id);
        if (!code) continue;

        const { schedule, room } = parseScheduleAndRoom(reg.schedule || '');

        const courseType = normalizeCourseType(reg.courseType);

        if (!grouped.has(code)) {
            grouped.set(code, {
                courseName: reg.name || code,
                components: [],
                semester: reg.semester,
            });
        }

        const reconciledCampus = openCourses.length > 0
            ? reconcileRegistrationCampus(reg, openCourses)
            : null;
        const scheduleCampus = detectCampusFromPeriodRanges(getPeriodRanges(schedule));
        const campusDetection = reconciledCampus?.status === 'matched'
            ? reconciledCampus
            : scheduleCampus.status === 'matched'
                ? scheduleCampus
                : reconciledCampus;

        grouped.get(code)!.components.push({
            courseType,
            classGroup: reg.classGroup || '',
            schedule,
            room,
            ...(campusDetection ? { campus: { detection: campusDetection } } : {}),
        });
    }

    // 3. Tính mask cho mỗi course
    const result: RegisteredCourse[] = [];

    for (const [courseCode, data] of grouped) {
        const combinedMask = new Bitset();

        for (const comp of data.components) {
            const scheduleParts = comp.schedule.split(/[;,]/).map(s => s.trim()).filter(Boolean);
            if (scheduleParts.length === 0) continue;

            const campusId = resolveCampus(comp.campus, defaultCampusId).campusId;
            const encoded = encodeScheduleToMask(scheduleParts, courseCode, campusId);
            const compMask = new Bitset();
            compMask.loadFromData(encoded.parts);
            const merged = combinedMask.or(compMask);
            // Copy merged back into combinedMask
            combinedMask.loadFromData(merged.parts);
        }

        result.push({
            courseCode,
            courseName: data.courseName,
            components: data.components,
            scheduleMask: [...combinedMask.parts], // Serialize — immutable copy
            semester: data.semester,
        });
    }

    return result;
}

/**
 * Tính combined mask từ tất cả registered courses.
 * Đây là "vùng cấm" tổng — solver dùng để filter candidates.
 */
export function computeCombinedMask(courses: RegisteredCourse[]): number[] {
    const combined = new Bitset();

    for (const course of courses) {
        const courseMask = new Bitset();
        courseMask.loadFromData(course.scheduleMask);
        const merged = combined.or(courseMask);
        combined.loadFromData(merged.parts);
    }

    return [...combined.parts]; // Serialize
}

// ── Internals ──────────────────────────────────────────────────────────────────

function normalizeCourseType(raw: string | undefined): 'LT' | 'TH' | 'BT' {
    const upper = String(raw || 'LT').trim().toUpperCase();
    if (upper === 'TH') return 'TH';
    if (upper === 'BT') return 'BT';
    return 'LT';
}
