import { getCampusPeriods } from '../../assets/data/campuses';
import {
  DEFAULT_CAMPUS_ID,
  resolvePeriodRange,
  type CampusId,
} from '../../domain/campus';
import type { ClassSection } from '../../types';
import { decodeScheduleTimeRuns } from '../Utils';

export interface SectionScheduleEntry {
  schedule: string[];
  campusId: CampusId;
}

export interface MaskToSectionsOptions {
  scheduleEntries?: SectionScheduleEntry[];
  defaultCampusId?: CampusId;
}

function minuteToClock(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

function clockToMinute(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function getClassLabels(classId: string): { pureClassId: string; suffix: string } {
  let pureClassId = classId;
  const labels: string[] = [];

  const practical = classId.match(/_TH_([^_]+)/);
  const exercise = classId.match(/_BT_([^_]+)/);
  if (practical) labels.push(`TH: ${practical[1]}`);
  if (exercise) labels.push(`BT: ${exercise[1]}`);

  if (practical || exercise) {
    pureClassId = classId.split('_TH_')[0].split('_BT_')[0];
  } else if (classId.includes('_')) {
    const parts = classId.split('_');
    pureClassId = parts[0];
    if (parts[1]) labels.push(`Nhóm ${parts[1]}`);
  }

  return {
    pureClassId,
    suffix: labels.length > 0 ? ` (${labels.join(', ')})` : '',
  };
}

function createSection(
  courseCode: string,
  courseName: string,
  classId: string,
  color: string,
  credits: number,
  day: number,
  startPeriod: number,
  endPeriod: number,
  startTime: string,
  endTime: string,
  campusId: CampusId,
  idSuffix: string,
  phaseLabel = '',
): ClassSection {
  const { pureClassId, suffix } = getClassLabels(classId);
  return {
    id: `${courseCode}-${classId}-${idSuffix}`,
    courseCode,
    courseName,
    courseNameVi: `${courseName}${suffix}${phaseLabel}`,
    sectionNumber: pureClassId,
    selectedClassId: classId,
    lecturer: 'Chưa cập nhật',
    room: '---',
    day,
    startPeriod,
    endPeriod,
    startTime,
    endTime,
    campusId,
    color,
    isConfirmed: true,
    credits,
  };
}

function minuteToPeriodBoundary(campusId: CampusId, minute: number, edge: 'start' | 'end'): number {
  const periods = getCampusPeriods(campusId);
  for (const period of periods) {
    const start = clockToMinute(period.start);
    const end = clockToMinute(period.end);
    const midpoint = Math.round((start + end) / 2);
    if (edge === 'start') {
      if (minute === start) return period.period;
      if (minute === midpoint) return period.period + 0.5;
    } else {
      if (minute === end) return period.period;
      if (minute === midpoint) return period.period - 0.5;
    }
  }
  return edge === 'start' ? 1 : periods[periods.length - 1].period;
}

function sectionsFromScheduleEntries(
  entries: SectionScheduleEntry[],
  courseCode: string,
  courseName: string,
  classId: string,
  color: string,
  credits: number,
): ClassSection[] {
  const sections: ClassSection[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    for (const rawSchedule of entry.schedule) {
      const match = String(rawSchedule).match(/T(\d|CN)\s*\((\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\)/i);
      if (!match) continue;
      const day = match[1].toUpperCase() === 'CN' ? 8 : Number.parseInt(match[1], 10);
      const startPeriod = Number.parseFloat(match[2]);
      const endPeriod = Number.parseFloat(match[3]);
      const key = `${day}:${startPeriod}:${endPeriod}:${entry.campusId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const range = resolvePeriodRange(entry.campusId, startPeriod, endPeriod);
      sections.push(createSection(
        courseCode,
        courseName,
        classId,
        color,
        credits,
        day,
        startPeriod,
        endPeriod,
        range.startTime,
        range.endTime,
        entry.campusId,
        `d${day}-p${startPeriod}-${entry.campusId}`,
      ));
    }
  }

  return sections;
}

export function maskToSections(
  maskArr: number[],
  courseCode: string,
  courseName: string,
  classId: string,
  color: string,
  credits: number,
  options: MaskToSectionsOptions = {},
): ClassSection[] {
  const defaultCampusId = options.defaultCampusId ?? DEFAULT_CAMPUS_ID;
  if (options.scheduleEntries?.length) {
    return sectionsFromScheduleEntries(
      options.scheduleEntries,
      courseCode,
      courseName,
      classId,
      color,
      credits,
    );
  }

  return decodeScheduleTimeRuns(maskArr).map((run) => createSection(
    courseCode,
    courseName,
    classId,
    color,
    credits,
    run.day + 2,
    minuteToPeriodBoundary(defaultCampusId, run.startMinute, 'start'),
    minuteToPeriodBoundary(defaultCampusId, run.endMinute, 'end'),
    minuteToClock(run.startMinute),
    minuteToClock(run.endMinute),
    defaultCampusId,
    `d${run.day}-m${run.startMinute}`,
    run.phase === 1 ? ' (GĐ 1)' : run.phase === 2 ? ' (GĐ 2)' : '',
  ));
}
