import { getCampusPeriods } from '../../assets/data/campuses';
import {
  DEFAULT_CAMPUS_ID,
  SCHEDULE_DAY_END_MINUTE,
  SCHEDULE_DAY_START_MINUTE,
  type CampusId,
} from '../../domain/campus';
import { clockToMinute, getClassSectionTimeRange, minuteToClock } from './schedule-timeline';

export const SCHEDULE_TIME_ROW_MINUTES = 30;
export const SCHEDULE_TIME_ROW_HEIGHT = 36;
export const SCHEDULE_PERIOD_ROW_HEIGHT = 52;
export const SCHEDULE_BREAK_ROW_HEIGHT = 28;

export type ScheduleAxisItem = {
  campusId?: CampusId;
  startPeriod: number;
  endPeriod: number;
  startTime?: string;
  endTime?: string;
};

export type ScheduleAxisRow =
  | {
      kind: 'time';
      minute: number;
      height: number;
    }
  | {
      kind: 'period';
      period: number;
      height: number;
    }
  | {
      kind: 'break';
      afterPeriod: number;
      startTime: string;
      endTime: string;
      height: number;
    };

type PeriodScheduleAxis = {
  mode: 'period';
  campusId: CampusId;
  rows: ScheduleAxisRow[];
  height: number;
  maxPeriod: number;
  lunchBreak?: Extract<ScheduleAxisRow, { kind: 'break' }>;
};

type TimeScheduleAxis = {
  mode: 'time';
  campusIds: CampusId[];
  rows: ScheduleAxisRow[];
  height: number;
};

export type ScheduleAxis = PeriodScheduleAxis | TimeScheduleAxis;

export type ScheduleAxisPosition = {
  top: number;
  height: number;
};

function getCampusId(item: ScheduleAxisItem, defaultCampusId: CampusId): CampusId {
  return item.campusId ?? defaultCampusId;
}

function getStartBoundary(period: number): number {
  return Number.isInteger(period) ? period - 1 : Math.floor(period) - 0.5;
}

function getEndBoundary(period: number): number {
  return Number.isInteger(period) ? period : Math.floor(period) + 0.5;
}

function getLunchBreak(campusId: CampusId, maxPeriod: number) {
  const periods = getCampusPeriods(campusId);
  for (let index = 1; index < periods.length; index += 1) {
    const previous = periods[index - 1];
    const current = periods[index];
    if (previous.session === 'morning' && current.session === 'afternoon' && previous.period < maxPeriod) {
      return {
        kind: 'break' as const,
        afterPeriod: previous.period,
        startTime: previous.end,
        endTime: current.start,
        height: SCHEDULE_BREAK_ROW_HEIGHT,
      };
    }
  }

  return undefined;
}

function getPeriodMax(campusId: CampusId, items: ScheduleAxisItem[]): number {
  if (campusId !== 'cho-quan') return 10;

  const hasEveningClass = items.some((item) => getEndBoundary(item.endPeriod) > 12);
  return hasEveningClass ? 15 : 12;
}

function buildPeriodAxis(campusId: CampusId, items: ScheduleAxisItem[]): PeriodScheduleAxis {
  const maxPeriod = getPeriodMax(campusId, items);
  const lunchBreak = getLunchBreak(campusId, maxPeriod);
  const rows: ScheduleAxisRow[] = [];

  for (let period = 1; period <= maxPeriod; period += 1) {
    rows.push({ kind: 'period', period, height: SCHEDULE_PERIOD_ROW_HEIGHT });
    if (lunchBreak?.afterPeriod === period) rows.push(lunchBreak);
  }

  return {
    mode: 'period',
    campusId,
    rows,
    height: rows.reduce((total, row) => total + row.height, 0),
    maxPeriod,
    lunchBreak,
  };
}

function buildTimeAxis(campusIds: CampusId[]): TimeScheduleAxis {
  const rows: ScheduleAxisRow[] = Array.from(
    { length: (SCHEDULE_DAY_END_MINUTE - SCHEDULE_DAY_START_MINUTE) / SCHEDULE_TIME_ROW_MINUTES },
    (_, index) => ({
      kind: 'time' as const,
      minute: SCHEDULE_DAY_START_MINUTE + index * SCHEDULE_TIME_ROW_MINUTES,
      height: SCHEDULE_TIME_ROW_HEIGHT,
    }),
  );

  return {
    mode: 'time',
    campusIds,
    rows,
    height: rows.reduce((total, row) => total + row.height, 0),
  };
}

/**
 * A single-campus schedule is denser and easier to scan by period. As soon as
 * two campuses are visible, real clock time is required to preserve alignment.
 */
export function buildScheduleAxis(
  items: ScheduleAxisItem[],
  defaultCampusId: CampusId = DEFAULT_CAMPUS_ID,
): ScheduleAxis {
  const campusIds = Array.from(new Set(items.map((item) => getCampusId(item, defaultCampusId))));
  if (campusIds.length <= 1) {
    const campusId = campusIds[0] ?? defaultCampusId;
    return buildPeriodAxis(campusId, items);
  }

  return buildTimeAxis(campusIds);
}

function getBreakOffset(axis: PeriodScheduleAxis, boundary: number, includeBoundary: boolean): number {
  if (!axis.lunchBreak) return 0;
  const applies = includeBoundary
    ? boundary >= axis.lunchBreak.afterPeriod
    : boundary > axis.lunchBreak.afterPeriod;
  return applies ? axis.lunchBreak.height : 0;
}

function getPeriodBoundaryPosition(
  axis: PeriodScheduleAxis,
  boundary: number,
  edge: 'start' | 'end',
): number {
  return boundary * SCHEDULE_PERIOD_ROW_HEIGHT
    + getBreakOffset(axis, boundary, edge === 'start');
}

export function getScheduleAxisPosition(
  item: ScheduleAxisItem,
  axis: ScheduleAxis,
  defaultCampusId: CampusId = DEFAULT_CAMPUS_ID,
): ScheduleAxisPosition {
  if (axis.mode === 'time') {
    const range = getClassSectionTimeRange(item, defaultCampusId);
    const pixelsPerMinute = SCHEDULE_TIME_ROW_HEIGHT / SCHEDULE_TIME_ROW_MINUTES;
    return {
      top: Math.max(0, range.startMinute - SCHEDULE_DAY_START_MINUTE) * pixelsPerMinute,
      height: Math.max(20, (range.endMinute - range.startMinute) * pixelsPerMinute),
    };
  }

  const itemCampusId = getCampusId(item, defaultCampusId);
  if (itemCampusId !== axis.campusId) {
    throw new RangeError('Lớp học không thuộc cơ sở của trục tiết.');
  }

  const start = getPeriodBoundaryPosition(axis, getStartBoundary(item.startPeriod), 'start');
  const end = getPeriodBoundaryPosition(axis, getEndBoundary(item.endPeriod), 'end');
  return { top: start, height: Math.max(20, end - start) };
}

export function getScheduleAxisHeader(axis: ScheduleAxis): string {
  return axis.mode === 'period' ? 'Tiết' : 'Giờ';
}

export function getScheduleAxisContext(axis: ScheduleAxis): string {
  if (axis.mode === 'time') return 'CS1 + CS2';
  return axis.campusId === 'cho-quan' ? 'CS1' : 'CS2';
}

export function getScheduleAxisHint(axis: ScheduleAxis): string | null {
  return axis.mode === 'time'
    ? 'Hiển thị theo giờ vì lịch có lớp ở cả hai cơ sở.'
    : null;
}

export function getScheduleAxisRowLabel(row: ScheduleAxisRow): string {
  if (row.kind === 'period') return `Tiết ${row.period}`;
  if (row.kind === 'break') return 'Nghỉ trưa';
  return row.minute % 60 === 0 ? minuteToClock(row.minute) : '';
}

export function getScheduleAxisBreakLabel(row: ScheduleAxisRow): string | null {
  return row.kind === 'break' ? `Nghỉ trưa ${row.startTime}–${row.endTime}` : null;
}

export function getScheduleAxisTimeBreakSummary(axis: ScheduleAxis): string | null {
  if (axis.mode !== 'time') return null;
  return 'CS1 nghỉ 12:10–12:50 · CS2 nghỉ 11:50–12:40';
}

export function getScheduleAxisTimeRange(item: ScheduleAxisItem, defaultCampusId: CampusId): string {
  const range = getClassSectionTimeRange(item, defaultCampusId);
  return `${range.startTime}–${range.endTime}`;
}

export function getTimeMinutes(value: string): number {
  return clockToMinute(value);
}
