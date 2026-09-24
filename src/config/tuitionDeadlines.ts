/**
 * Cấu hình hạn đóng học phí.
 *
 * Format key: "yy-yy/s"
 * - "25-26/1" = học kỳ 1, năm học 2025-2026
 * - "25-26/2" = học kỳ 2, năm học 2025-2026
 * - "25-26/3" = học kỳ 3, năm học 2025-2026
 *
 * Format date: "YYYY-MM-DD"
 *
 * Khi nhà trường thông báo hạn mới, chỉ cần sửa/thêm trong object này.
 */
export const TUITION_DEADLINES_BY_CAMPUS: Record<import('../domain/campus').CampusId, Record<string, string>> = {
    'cho-quan': {},
    'dong-hoa': {
        '25-26/7': '2026-08-20',
    },
};

/** @deprecated Dùng TUITION_DEADLINES_BY_CAMPUS khi bổ sung dữ liệu mới. */
export const TUITION_DEADLINES_BY_SEMESTER = TUITION_DEADLINES_BY_CAMPUS['dong-hoa'];

export function normalizeTuitionSemesterKey(value: string | undefined | null): string {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const existingKey = raw.match(/^(\d{2}-\d{2})\/([1-3])$/);
    if (existingKey) return raw;

    const fullYearKey = raw.match(/^(\d{4})-(\d{4})\/([1-3])$/);
    if (fullYearKey) {
        return `${fullYearKey[1].slice(2)}-${fullYearKey[2].slice(2)}/${fullYearKey[3]}`;
    }

    const displayName = raw.match(/([1-3])\s*,\s*(\d{4})-(\d{4})/);
    if (displayName) {
        return `${displayName[2].slice(2)}-${displayName[3].slice(2)}/${displayName[1]}`;
    }

    return raw;
}

export function buildTuitionSemesterKey(academicYear: string, semesterNumber: number | string): string {
    const year = String(academicYear || '').trim();
    const semester = String(semesterNumber || '').trim();

    if (!year || !semester) return '';
    if (year.length === 9) return `${year.substring(2, 4)}-${year.substring(7, 9)}/${semester}`;
    return `${year}/${semester}`;
}

/** Chỉ trả về hạn đã được nhà trường công bố trong bảng cấu hình. */
export function getTuitionDeadline(
    semester: string | undefined | null,
    campusId: import('../domain/campus').CampusId = 'dong-hoa',
): string | null {
    const key = normalizeTuitionSemesterKey(semester);
    return TUITION_DEADLINES_BY_CAMPUS[campusId][key] ?? null;
}

export function formatTuitionDeadline(dateString: string | null | undefined): string {
    if (!dateString) return 'Chưa công bố';

    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}
