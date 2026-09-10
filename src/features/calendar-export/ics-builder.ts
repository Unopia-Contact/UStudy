import type { CalendarExportDocumentOptions, CalendarExportEvent } from './types';

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

export function createIcsHelpers() {
  const pad = (value: number) => String(value).padStart(2, '0');
  const toIcsDate = (date: Date) => (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  );
  const toIcsDateTime = (date: Date) => (
    `${toIcsDate(date)}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
  const toIcsUtcDateTime = (date: Date) => (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
    + `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
  const esc = (text: string) => (
    text.replace(/\r/g, '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  );
  const foldLine = (line: string) => {
    const encoder = new TextEncoder();
    const chunks: string[] = [];
    let current = '';

    for (const character of line) {
      const next = current + character;
      if (current && encoder.encode(next).byteLength > 75) {
        chunks.push(current);
        current = ` ${character}`;
      } else {
        current = next;
      }
    }

    if (current) chunks.push(current);
    return chunks;
  };

  return { toIcsDate, toIcsDateTime, toIcsUtcDateTime, esc, foldLine };
}

function addOneDay(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
}

export function buildCalendarDocument(
  events: CalendarExportEvent[],
  options: CalendarExportDocumentOptions,
): string {
  const helpers = createIcsHelpers();
  const { esc, foldLine, toIcsDate, toIcsDateTime, toIcsUtcDateTime } = helpers;
  const timezone = options.timezone || DEFAULT_TIMEZONE;
  const stamp = toIcsUtcDateTime(options.now || new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${options.productId || '-//UStudy//Calendar Export//VI'}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(options.calendarName)}`,
    `X-WR-TIMEZONE:${esc(timezone)}`,
  ];

  events.forEach((event) => {
    lines.push('BEGIN:VEVENT', `UID:${esc(event.uid)}`, `DTSTAMP:${stamp}`);

    if (event.allDay || !event.end) {
      lines.push(
        `DTSTART;VALUE=DATE:${toIcsDate(event.start)}`,
        `DTEND;VALUE=DATE:${toIcsDate(addOneDay(event.start))}`,
      );
    } else {
      lines.push(
        `DTSTART;TZID=${timezone}:${toIcsDateTime(event.start)}`,
        `DTEND;TZID=${timezone}:${toIcsDateTime(event.end)}`,
      );
    }

    lines.push(`SUMMARY:${esc(event.title || 'Sự kiện UStudy')}`);
    if (event.location) lines.push(`LOCATION:${esc(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${esc(event.description)}`);
    lines.push('STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return `${lines.flatMap(foldLine).join('\r\n')}\r\n`;
}
