import {
  DEFAULT_CAMPUS_ID,
  SCHEDULE_DAY_END_MINUTE,
  SCHEDULE_DAY_START_MINUTE,
  resolvePeriodRange,
  type CampusId,
} from '../../domain/campus';
import type { ClassSection } from '../../types';

export type ScheduleTimeItem = Pick<
  ClassSection,
  'startPeriod' | 'endPeriod' | 'startTime' | 'endTime' | 'campusId'
>;

export const SCHEDULE_TIMELINE_ROW_MINUTES = 30;
export const SCHEDULE_TIMELINE_ROW_HEIGHT = 36;
export const SCHEDULE_TIMELINE_ROWS = Array.from(
  { length: (SCHEDULE_DAY_END_MINUTE - SCHEDULE_DAY_START_MINUTE) / SCHEDULE_TIMELINE_ROW_MINUTES },
  (_, index) => SCHEDULE_DAY_START_MINUTE + index * SCHEDULE_TIMELINE_ROW_MINUTES,
);
export const SCHEDULE_TIMELINE_HEIGHT = SCHEDULE_TIMELINE_ROWS.length * SCHEDULE_TIMELINE_ROW_HEIGHT;

export function clockToMinute(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function minuteToClock(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

export function getClassSectionTimeRange(
  section: ScheduleTimeItem,
  defaultCampusId: CampusId = DEFAULT_CAMPUS_ID,
): { startMinute: number; endMinute: number; startTime: string; endTime: string } {
  if (section.startTime && section.endTime) {
    return {
      startMinute: clockToMinute(section.startTime),
      endMinute: clockToMinute(section.endTime),
      startTime: section.startTime,
      endTime: section.endTime,
    };
  }

  return resolvePeriodRange(
    section.campusId ?? defaultCampusId,
    section.startPeriod,
    section.endPeriod,
  );
}

export function getTimelinePosition(startMinute: number, endMinute: number) {
  const pixelsPerMinute = SCHEDULE_TIMELINE_ROW_HEIGHT / SCHEDULE_TIMELINE_ROW_MINUTES;
  return {
    top: Math.max(0, startMinute - SCHEDULE_DAY_START_MINUTE) * pixelsPerMinute,
    height: Math.max(20, (endMinute - startMinute) * pixelsPerMinute),
  };
}

export function classSectionsOverlap(
  left: ClassSection,
  right: ClassSection,
  defaultCampusId: CampusId = DEFAULT_CAMPUS_ID,
): boolean {
  if (left.day !== right.day) return false;
  const leftRange = getClassSectionTimeRange(left, defaultCampusId);
  const rightRange = getClassSectionTimeRange(right, defaultCampusId);
  return leftRange.startMinute < rightRange.endMinute && rightRange.startMinute < leftRange.endMinute;
}
