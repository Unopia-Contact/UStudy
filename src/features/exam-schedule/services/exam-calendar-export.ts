import { readPlain, savePlain } from '../../../helpers/localStorage/save';
import {
  buildCalendarDocument,
  downloadCalendarIcs,
  interpolateCalendarTemplate,
} from '../../calendar-export';
import type { CalendarExportEvent, CalendarTemplateValues } from '../../calendar-export';
import type { ExamCalendarExportPreferences, ExamData } from '../types';

export const EXAM_CALENDAR_EXPORT_PREFERENCES_KEY = 'exam_calendar_export_preferences_v1';

export const DEFAULT_EXAM_TITLE_TEMPLATE = '[{examType}] {courseCode} - {courseName}';
export const DEFAULT_EXAM_DESCRIPTION_TEMPLATE = [
  'Môn: {courseName}',
  'Mã môn: {courseCode}',
  'Loại kỳ thi: {examType}',
  'Lớp/Nhóm: {className}',
  'Ngày thi: {date}',
  'Thời gian: {time}',
  'Phòng: {room}',
  'Cơ sở: {location}',
  'Ghi chú: {notes}',
].join('\n');

export const DEFAULT_EXAM_CALENDAR_EXPORT_PREFERENCES: ExamCalendarExportPreferences = {
  version: 1,
  mode: 'default',
  scope: 'semester',
  titleTemplate: DEFAULT_EXAM_TITLE_TEMPLATE,
  descriptionTemplate: DEFAULT_EXAM_DESCRIPTION_TEMPLATE,
};

export const EXAM_CALENDAR_TEMPLATE_TOKENS = [
  'examType',
  'courseCode',
  'courseName',
  'className',
  'date',
  'time',
  'room',
  'location',
  'semester',
  'notes',
] as const;

export interface ExamCalendarBuildOptions {
  calendarName: string;
  titleTemplate: string;
  descriptionTemplate: string;
  now?: Date;
}

export interface ExamCalendarBuildResult {
  ics: string;
  exportedCount: number;
  skippedCount: number;
  defaultDurationCount: number;
  allDayCount: number;
}

function parseExamDate(value: string): Date | null {
  const normalized = value.trim();
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const portalMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const parts = isoMatch
    ? [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])]
    : portalMatch
      ? [Number(portalMatch[3]), Number(portalMatch[2]), Number(portalMatch[1])]
      : null;
  if (!parts) return null;

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function parseExamTimeRange(value: string, date: Date): { start: Date; end: Date; usesDefaultDuration: boolean } | null {
  const matches = Array.from(value.matchAll(/(\d{1,2})\s*(?::|h|g)\s*(\d{2})/gi));
  if (matches.length === 0) return null;

  const createDateTime = (match: RegExpMatchArray) => {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0);
  };

  const start = createDateTime(matches[0]);
  if (!start) return null;

  const end = matches[1] ? createDateTime(matches[1]) : null;
  if (!end || end <= start) {
    return {
      start,
      end: new Date(start.getTime() + 60 * 60 * 1000),
      usesDefaultDuration: true,
    };
  }

  return { start, end, usesDefaultDuration: false };
}

function formatExamDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getExamCalendarTemplateValues(exam: ExamData): CalendarTemplateValues {
  const date = parseExamDate(exam.examDate);
  return {
    examType: exam.examType,
    courseCode: exam.courseCode,
    courseName: exam.courseName,
    className: exam.className,
    date: date ? formatExamDate(date) : exam.examDate,
    time: exam.examTime,
    room: exam.room,
    location: exam.location,
    semester: exam.semester,
    notes: exam.notes,
  };
}

export function renderExamCalendarTitle(exam: ExamData, template: string): string {
  const rendered = interpolateCalendarTemplate(template, getExamCalendarTemplateValues(exam));
  return rendered || [exam.courseCode, exam.courseName].filter(Boolean).join(' - ') || 'Lịch thi';
}

export function renderExamCalendarDescription(exam: ExamData, template: string): string {
  return interpolateCalendarTemplate(template, getExamCalendarTemplateValues(exam), true);
}

function createExamUid(exam: ExamData): string {
  const identity = [
    exam.semester,
    exam.examType,
    exam.courseCode,
    exam.className,
    exam.examDate,
    exam.examTime,
  ].join('|');
  return `${encodeURIComponent(identity)}@exam.ustudy`;
}

export function buildExamCalendarIcs(
  exams: ExamData[],
  options: ExamCalendarBuildOptions,
): ExamCalendarBuildResult {
  const events: CalendarExportEvent[] = [];
  let skippedCount = 0;
  let defaultDurationCount = 0;
  let allDayCount = 0;

  exams.forEach((exam) => {
    const date = parseExamDate(exam.examDate);
    if (!date) {
      skippedCount += 1;
      return;
    }

    const timeRange = parseExamTimeRange(exam.examTime, date);
    const allDay = !timeRange;
    if (allDay) allDayCount += 1;
    if (timeRange?.usesDefaultDuration) defaultDurationCount += 1;

    events.push({
      uid: createExamUid(exam),
      start: timeRange?.start || date,
      end: timeRange?.end,
      allDay,
      title: renderExamCalendarTitle(exam, options.titleTemplate),
      description: renderExamCalendarDescription(exam, options.descriptionTemplate),
      location: [exam.room, exam.location].filter(Boolean).join(' - '),
    });
  });

  return {
    ics: buildCalendarDocument(events, {
      calendarName: options.calendarName,
      now: options.now,
    }),
    exportedCount: events.length,
    skippedCount,
    defaultDurationCount,
    allDayCount,
  };
}

export function downloadExamCalendar(result: ExamCalendarBuildResult, fileName: string): void {
  downloadCalendarIcs(result.ics, fileName);
}

export function readExamCalendarExportPreferences(): ExamCalendarExportPreferences {
  const stored = readPlain<Partial<ExamCalendarExportPreferences>>(
    EXAM_CALENDAR_EXPORT_PREFERENCES_KEY,
    {},
  );

  return {
    ...DEFAULT_EXAM_CALENDAR_EXPORT_PREFERENCES,
    ...(stored.version === 1
      ? {
        mode: stored.mode === 'custom' ? 'custom' : 'default',
        scope: stored.scope === 'filtered' || stored.scope === 'all' ? stored.scope : 'semester',
        titleTemplate: typeof stored.titleTemplate === 'string'
          ? stored.titleTemplate
          : DEFAULT_EXAM_TITLE_TEMPLATE,
        descriptionTemplate: typeof stored.descriptionTemplate === 'string'
          ? stored.descriptionTemplate
          : DEFAULT_EXAM_DESCRIPTION_TEMPLATE,
      }
      : {}),
    version: 1,
  };
}

export function saveExamCalendarExportPreferences(preferences: ExamCalendarExportPreferences): void {
  savePlain(EXAM_CALENDAR_EXPORT_PREFERENCES_KEY, preferences);
}

export function getExamCalendarName(semester: string): string {
  return `Lịch thi${semester && semester !== 'all' ? ` - ${semester}` : ''}`;
}

export function getExamCalendarFileName(semester: string): string {
  return `Lich-thi${semester && semester !== 'all' ? `-${semester}` : ''}.ics`;
}
