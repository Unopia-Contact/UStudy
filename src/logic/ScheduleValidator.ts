import type { ClassSection } from '../types';
import { DEFAULT_CAMPUS_ID, resolvePeriodRange, type CampusId } from '../domain/campus';

/**
 * Domain Service: Kiểm tra xung đột thời khoá biểu (Pure Function)
 * Không phụ thuộc React, có thể test/import độc lập.
 */

/**
 * Tìm tất cả các section đang xung đột thời gian với section đầu vào.
 * Hai section xung đột khi cùng ngày và khoảng tiết học chồng lấn.
 */
export function getConflicts(
    section: ClassSection,
    confirmedSections: ClassSection[],
    defaultCampusId: CampusId = DEFAULT_CAMPUS_ID,
): ClassSection[] {
    return confirmedSections.filter(confirmed => {
        if (confirmed.id === section.id) return false;
        if (confirmed.day !== section.day) return false;
        if (section.startTime && section.endTime && confirmed.startTime && confirmed.endTime) {
            return section.startTime < confirmed.endTime && confirmed.startTime < section.endTime;
        }
        try {
            const sectionRange = resolvePeriodRange(section.campusId ?? defaultCampusId, section.startPeriod, section.endPeriod);
            const confirmedRange = resolvePeriodRange(confirmed.campusId ?? defaultCampusId, confirmed.startPeriod, confirmed.endPeriod);
            return sectionRange.startMinute < confirmedRange.endMinute
                && confirmedRange.startMinute < sectionRange.endMinute;
        } catch {
            // Preserve the legacy comparison for malformed imported rows.
        }
        return !(
            section.endPeriod < confirmed.startPeriod ||
            section.startPeriod > confirmed.endPeriod
        );
    });
}
