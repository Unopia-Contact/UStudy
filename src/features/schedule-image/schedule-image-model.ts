import type { ClassSection } from '../../types';
import { getVisibleWeekDays } from '../../constants';
import type { ScheduleSession } from '../visual-schedule/types';

export interface ScheduleImageLesson {
  id: string;
  day: number;
  startPeriod: number;
  endPeriod: number;
  time: string;
  course: string;
  code: string;
  classCode: string;
  room: string;
  color: string;
}

export type ScheduleImageLayout = 'columns' | 'cards' | 'list' | 'basic' | 'basic-table';
export interface OverlayRect { x: number; y: number; width: number; height: number }
export interface ImageSize { id: string; label: string; width: number; height: number }

export const IMAGE_SIZES: ImageSize[] = [
  { id: 'phone', label: 'Điện thoại 9:16', width: 1080, height: 1920 },
  { id: 'phone-tall', label: 'Điện thoại dài', width: 1080, height: 2400 },
  { id: 'square', label: 'Vuông', width: 1080, height: 1080 },
  { id: 'desktop', label: 'Máy tính 16:9', width: 1920, height: 1080 },
  { id: 'a4', label: 'A4 dọc', width: 1240, height: 1754 },
];

export const DEFAULT_RECT: OverlayRect = { x: 7, y: 13, width: 86, height: 74 };
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const surfaceOpacityFromTransparency = (transparency: number) => 1 - clamp(transparency, 0, 100) / 100;
export function constrainRect(rect: OverlayRect): OverlayRect {
  const width = clamp(rect.width, 30, 100);
  const height = clamp(rect.height, 20, 100);
  return { width, height, x: clamp(rect.x, 0, 100 - width), y: clamp(rect.y, 0, 100 - height) };
}

export type OverlayResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export function resizeOverlayRect(rect: OverlayRect, direction: OverlayResizeDirection, dx: number, dy: number): OverlayRect {
  let left = rect.x;
  let top = rect.y;
  let right = rect.x + rect.width;
  let bottom = rect.y + rect.height;
  if (direction.includes('w')) left = clamp(left + dx, 0, right - 30);
  if (direction.includes('e')) right = clamp(right + dx, left + 30, 100);
  if (direction.includes('n')) top = clamp(top + dy, 0, bottom - 20);
  if (direction.includes('s')) bottom = clamp(bottom + dy, top + 20, 100);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function fromScheduleSessions(sessions: ScheduleSession[]): ScheduleImageLesson[] {
  return sessions.map((session) => ({
    id: session.id,
    day: session.dayOfWeek,
    startPeriod: session.startPeriod,
    endPeriod: session.endPeriod,
    time: session.startTime && session.endTime ? `${session.startTime}–${session.endTime}` : `Tiết ${session.startPeriod}–${session.endPeriod}`,
    course: session.courseName,
    code: session.courseCode,
    classCode: session.classCode,
    room: session.room,
    color: session.color,
  }));
}

export function fromClassSections(sections: ClassSection[]): ScheduleImageLesson[] {
  return sections.map((section) => ({
    id: section.id,
    day: section.day,
    startPeriod: section.startPeriod,
    endPeriod: section.endPeriod,
    time: section.startTime && section.endTime ? `${section.startTime}–${section.endTime}` : `Tiết ${section.startPeriod}–${section.endPeriod}`,
    course: section.courseNameVi || section.courseName,
    code: section.courseCode,
    classCode: section.sectionNumber,
    room: section.room,
    color: section.color,
  }));
}

export function groupLessons(lessons: ScheduleImageLesson[]) {
  const days = Array.from(new Set(lessons.map((lesson) => lesson.day))).sort((a, b) => a - b);
  return days.map((day) => ({
    day,
    lessons: lessons.filter((lesson) => lesson.day === day).sort((a, b) => a.startPeriod - b.startPeriod || a.course.localeCompare(b.course)),
  }));
}

export function dayLabel(day: number) { return day === 8 ? 'Chủ nhật' : `Thứ ${day}`; }

/** Period-based grid for the monochrome timetable image. */
export function buildBasicTable(lessons: ScheduleImageLesson[]) {
  const days = getVisibleWeekDays(lessons.map((lesson) => lesson.day));
  const maxPeriod = Math.max(10, ...lessons.map((lesson) => Math.ceil(lesson.endPeriod)));
  const periods = Array.from({ length: maxPeriod }, (_, index) => index + 1);
  const placements: Array<{ lesson: ScheduleImageLesson; dayIndex: number; rowStart: number; rowSpan: number; lane: number; laneCount: number }> = [];

  days.forEach((day, dayIndex) => {
    const scheduled = lessons.filter((lesson) => lesson.day === day.day)
      .map((lesson) => {
        const start = Math.max(1, Math.floor(lesson.startPeriod));
        return { lesson, start, end: Math.max(start, Math.ceil(lesson.endPeriod)) };
      })
      .sort((a, b) => a.start - b.start || a.end - b.end);
    let cluster: typeof scheduled = [];
    let clusterEnd = 0;
    const flushCluster = () => {
      const laneEnds: number[] = [];
      const pending = cluster.map((item) => {
        let lane = laneEnds.findIndex((end) => end < item.start);
        if (lane < 0) lane = laneEnds.length;
        laneEnds[lane] = item.end;
        return { item, lane };
      });
      pending.forEach(({ item, lane }) => placements.push({
        lesson: item.lesson, dayIndex, rowStart: item.start, rowSpan: item.end - item.start + 1,
        lane, laneCount: laneEnds.length,
      }));
      cluster = [];
    };
    scheduled.forEach((item) => {
      if (cluster.length && item.start > clusterEnd) flushCluster();
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.end);
    });
    if (cluster.length) flushCluster();
  });

  const emptyCells = days.flatMap((_, dayIndex) => periods
    .filter((period) => !placements.some(({ dayIndex: placementDay, rowStart, rowSpan }) =>
      placementDay === dayIndex && period >= rowStart && period < rowStart + rowSpan))
    .map((period) => ({ dayIndex, period })));

  return { days, periods, placements, emptyCells };
}
