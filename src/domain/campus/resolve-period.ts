import { getCampusPeriods } from '../../assets/data/campuses';
import type {
  CampusDetection,
  CampusId,
  PeriodDefinition,
  ResolvedPeriodRange,
} from './types';

const CAMPUS_IDS: CampusId[] = ['cho-quan', 'dong-hoa'];

export type PeriodBoundaryEdge = 'start' | 'end';

function clockToMinute(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function minuteToClock(value: number): string {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getPeriod(periods: PeriodDefinition[], period: number): PeriodDefinition {
  const definition = periods.find((item) => item.period === period);
  if (!definition) throw new RangeError(`Tiết ${period} không tồn tại trong bảng giờ của cơ sở.`);
  return definition;
}

function getHalfPeriodNumber(period: number, edge: PeriodBoundaryEdge): number {
  return edge === 'start' ? Math.floor(period) : Math.ceil(period);
}

export function resolvePeriodBoundaryMinute(
  campusId: CampusId,
  period: number,
  edge: PeriodBoundaryEdge,
): number {
  if (!Number.isFinite(period) || period <= 0 || !Number.isInteger(period * 2)) {
    throw new RangeError(`Giá trị tiết không hợp lệ: ${period}`);
  }

  const periods = getCampusPeriods(campusId);
  if (Number.isInteger(period)) {
    const definition = getPeriod(periods, period);
    return clockToMinute(edge === 'start' ? definition.start : definition.end);
  }

  const definition = getPeriod(periods, getHalfPeriodNumber(period, edge));
  return Math.round((clockToMinute(definition.start) + clockToMinute(definition.end)) / 2);
}

export function resolvePeriodBoundary(
  campusId: CampusId,
  period: number,
  edge: PeriodBoundaryEdge,
): string {
  return minuteToClock(resolvePeriodBoundaryMinute(campusId, period, edge));
}

export function resolvePeriodRange(
  campusId: CampusId,
  startPeriod: number,
  endPeriod: number,
): ResolvedPeriodRange {
  const startMinute = resolvePeriodBoundaryMinute(campusId, startPeriod, 'start');
  const endMinute = resolvePeriodBoundaryMinute(campusId, endPeriod, 'end');
  if (endMinute <= startMinute) {
    throw new RangeError(`Khoảng tiết ${startPeriod}-${endPeriod} không hợp lệ.`);
  }

  const startDefinition = getPeriod(getCampusPeriods(campusId), Math.floor(startPeriod));
  return {
    startTime: minuteToClock(startMinute),
    endTime: minuteToClock(endMinute),
    startMinute,
    endMinute,
    session: startDefinition.session,
  };
}

export function tryResolvePeriodRange(
  campusId: CampusId,
  startPeriod: number,
  endPeriod: number,
): ResolvedPeriodRange | null {
  try {
    return resolvePeriodRange(campusId, startPeriod, endPeriod);
  } catch {
    return null;
  }
}

export function detectCampusFromPeriodRanges(
  ranges: Array<{ startPeriod: number; endPeriod: number }>,
): CampusDetection {
  if (ranges.length === 0) return { status: 'unresolved' };

  const candidates = CAMPUS_IDS.filter((campusId) =>
    ranges.every(({ startPeriod, endPeriod }) =>
      tryResolvePeriodRange(campusId, startPeriod, endPeriod) !== null,
    ),
  );

  if (candidates.length === 1) {
    return {
      status: 'matched',
      campusId: candidates[0],
      source: 'schedule-range',
      confidence: 'strong',
    };
  }

  if (candidates.length > 1) return { status: 'ambiguous', candidates };
  return { status: 'unresolved' };
}
