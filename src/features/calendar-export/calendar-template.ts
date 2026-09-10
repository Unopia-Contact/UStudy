import type { CalendarTemplateValues } from './types';

const TEMPLATE_TOKEN_PATTERN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

export function interpolateCalendarTemplate(
  template: string,
  values: CalendarTemplateValues,
  omitEmptyLines = false,
): string {
  const lines = template.replace(/\r\n/g, '\n').split('\n');
  const rendered = lines.flatMap((line) => {
    const tokens = Array.from(line.matchAll(TEMPLATE_TOKEN_PATTERN));
    if (omitEmptyLines && tokens.length > 0 && tokens.every((match) => !values[match[1]]?.trim())) {
      return [];
    }

    return line.replace(TEMPLATE_TOKEN_PATTERN, (_, token: string) => values[token] || '').trimEnd();
  });

  return rendered.join('\n').trim();
}
