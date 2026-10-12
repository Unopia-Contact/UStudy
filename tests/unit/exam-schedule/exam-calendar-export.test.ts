import { describe, expect, it } from 'vitest';

import {
  buildExamCalendarIcs,
  DEFAULT_EXAM_DESCRIPTION_TEMPLATE,
  DEFAULT_EXAM_TITLE_TEMPLATE,
  renderExamCalendarDescription,
} from '../../../src/features/exam-schedule/services/exam-calendar-export';
import type { ExamData } from '../../../src/features/exam-schedule/types';

const exam: ExamData = {
  id: '25-26-1-final-CSC10009',
  courseCode: 'CSC10009',
  courseName: 'Cơ sở dữ liệu',
  className: '24CTT1',
  examDate: '2026-01-12',
  examTime: '07:30 - 09:30',
  room: 'F202',
  location: 'Đông Hòa',
  semester: 'Học kỳ 1, 2025-2026',
  examType: 'Cuối kỳ',
  notes: 'Mang thẻ sinh viên',
};

const options = {
  calendarName: 'Lịch thi - Học kỳ 1, 2025-2026',
  titleTemplate: DEFAULT_EXAM_TITLE_TEMPLATE,
  descriptionTemplate: DEFAULT_EXAM_DESCRIPTION_TEMPLATE,
  now: new Date(2026, 0, 1),
};

describe('exam calendar export', () => {
  it('exports a timed exam with the default title, location and description', () => {
    const result = buildExamCalendarIcs([exam], options);

    expect(result).toMatchObject({ exportedCount: 1, skippedCount: 0, allDayCount: 0 });
    expect(result.ics).toContain('DTSTART;TZID=Asia/Ho_Chi_Minh:20260112T073000');
    expect(result.ics).toContain('DTEND;TZID=Asia/Ho_Chi_Minh:20260112T093000');
    expect(result.ics).toContain('SUMMARY:[Cuối kỳ] CSC10009 - Cơ sở dữ liệu');
    expect(result.ics).toContain('LOCATION:F202 - Đông Hòa');
    expect(result.ics).toContain('Môn: Cơ sở dữ liệu');
  });

  it('omits description lines whose template value is empty', () => {
    const description = renderExamCalendarDescription(
      { ...exam, room: '', notes: '' },
      'Môn: {courseName}\nPhòng: {room}\nGhi chú: {notes}',
    );

    expect(description).toBe('Môn: Cơ sở dữ liệu');
  });

  it('uses a one-hour duration when the exam has a start time but no end time', () => {
    const result = buildExamCalendarIcs([{ ...exam, examTime: '07:30' }], options);

    expect(result.defaultDurationCount).toBe(1);
    expect(result.allDayCount).toBe(0);
    expect(result.ics).toContain('DTSTART;TZID=Asia/Ho_Chi_Minh:20260112T073000');
    expect(result.ics).toContain('DTEND;TZID=Asia/Ho_Chi_Minh:20260112T083000');
  });

  it('keeps an event all-day only when its exam time is entirely missing', () => {
    const result = buildExamCalendarIcs([{ ...exam, examTime: '' }], options);

    expect(result.defaultDurationCount).toBe(0);
    expect(result.allDayCount).toBe(1);
    expect(result.ics).toContain('DTSTART;VALUE=DATE:20260112');
    expect(result.ics).toContain('DTEND;VALUE=DATE:20260113');
  });

  it('skips invalid dates without blocking valid exams', () => {
    const result = buildExamCalendarIcs([
      { ...exam, id: 'invalid', examDate: '31/02/2026' },
      exam,
    ], options);

    expect(result.exportedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  it('keeps the event UID stable across export times', () => {
    const first = buildExamCalendarIcs([exam], options).ics.match(/UID:(.+)/)?.[1];
    const second = buildExamCalendarIcs([exam], {
      ...options,
      now: new Date(2026, 0, 2),
    }).ics.match(/UID:(.+)/)?.[1];

    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it('escapes calendar control characters in customized content', () => {
    const result = buildExamCalendarIcs([{ ...exam, notes: 'Mang bút, thước; máy tính' }], {
      ...options,
      titleTemplate: '{courseCode}, {courseName}',
      descriptionTemplate: '{notes}',
    });

    expect(result.ics).toContain('SUMMARY:CSC10009\\, Cơ sở dữ liệu');
    expect(result.ics).toContain('Mang bút\\, thước\\; máy tính');
  });
});
