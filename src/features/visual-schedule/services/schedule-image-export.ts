import { getVisibleWeekDays } from '../../../constants';
import type { ScheduleSession } from '../types';

export type ScheduleImageLayout = 'table' | 'cards';
export type ScheduleImageSize = 'phone' | 'desktop' | 'square';

export const SCHEDULE_IMAGE_SIZES: Record<ScheduleImageSize, { width: number; height: number; label: string }> = {
  phone: { width: 1080, height: 1920, label: 'Điện thoại · 1080 × 1920' },
  desktop: { width: 1920, height: 1080, label: 'Máy tính · 1920 × 1080' },
  square: { width: 1080, height: 1080, label: 'Vuông · 1080 × 1080' },
};

export interface ScheduleImageOptions {
  layout: ScheduleImageLayout;
  size: ScheduleImageSize;
  title: string;
  weekLabel: string;
  sessions: ScheduleSession[];
  background?: HTMLImageElement | null;
}

export function getScheduleImageDays(sessions: ScheduleSession[]) {
  return getVisibleWeekDays(sessions.map((session) => session.dayOfWeek));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function fitLines(ctx: CanvasRenderingContext2D, value: string, width: number, maxLines: number): string[] {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  let last = visible[maxLines - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1);
  visible[maxLines - 1] = `${last.trimEnd()}…`;
  return visible;
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
}

function drawSession(ctx: CanvasRenderingContext2D, session: ScheduleSession, x: number, y: number, width: number, height: number, compact: boolean) {
  if (height < 42) return;
  const inset = compact ? 10 : 16;
  roundRect(ctx, x, y, width, height, compact ? 14 : 18, 'rgba(255,255,255,0.96)');
  roundRect(ctx, x, y + 8, 5, height - 16, 3, '#004A98');
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + inset, y + 6, width - inset * 2, height - 12);
  ctx.clip();
  const titleSize = compact ? 18 : 25;
  const detailSize = compact ? 15 : 19;
  ctx.fillStyle = '#102A43';
  ctx.font = `700 ${titleSize}px Inter, sans-serif`;
  const nameLines = fitLines(ctx, session.courseName || session.courseCode, width - inset * 2, compact ? 2 : 2);
  nameLines.forEach((line, index) => ctx.fillText(line, x + inset, y + (compact ? 27 : 37) + index * (titleSize + 3)));
  const detailY = y + (compact ? 34 : 44) + nameLines.length * (titleSize + 3);
  ctx.fillStyle = '#475569';
  ctx.font = `500 ${detailSize}px Inter, sans-serif`;
  const time = `${session.startTime || `Tiết ${session.startPeriod}`}–${session.endTime || session.endPeriod}`;
  const details = `${time} · ${session.type}${session.room ? ` · ${session.room}` : ''}`;
  fitLines(ctx, details, width - inset * 2, 2).forEach((line, index) => ctx.fillText(line, x + inset, detailY + index * (detailSize + 3)));
  ctx.restore();
}

export function drawScheduleImage(canvas: HTMLCanvasElement, options: ScheduleImageOptions): void {
  const { width, height } = SCHEDULE_IMAGE_SIZES[options.size];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ vẽ ảnh thời khóa biểu.');

  ctx.fillStyle = '#eaf3ff';
  ctx.fillRect(0, 0, width, height);
  if (options.background?.naturalWidth) drawCover(ctx, options.background, width, height);
  ctx.fillStyle = options.background ? 'rgba(8, 28, 53, 0.48)' : 'rgba(0, 74, 152, 0.06)';
  ctx.fillRect(0, 0, width, height);

  const margin = width >= 1600 ? 64 : 42;
  const titleY = options.size === 'phone' ? 150 : 100;
  ctx.fillStyle = options.background ? '#fff' : '#003A78';
  ctx.font = `700 ${width >= 1600 ? 48 : 42}px Inter, sans-serif`;
  ctx.fillText('THỜI KHÓA BIỂU', margin, titleY);
  ctx.font = `500 ${width >= 1600 ? 27 : 24}px Inter, sans-serif`;
  ctx.fillText(options.title, margin, titleY + 42);
  ctx.fillText(options.weekLabel, margin, titleY + 79);

  const days = getScheduleImageDays(options.sessions);
  const bodyTop = titleY + 130;
  const bodyBottom = height - 66;
  const gap = 12;
  const byDay = days.map((day) => ({
    day,
    sessions: options.sessions.filter((session) => session.dayOfWeek === day.day)
      .sort((a, b) => a.startPeriod - b.startPeriod || a.startTime.localeCompare(b.startTime)),
  }));

  if (options.layout === 'table') {
    const columnWidth = (width - margin * 2 - gap * (days.length - 1)) / days.length;
    const compact = true;
    byDay.forEach(({ day, sessions }, index) => {
      const x = margin + index * (columnWidth + gap);
      roundRect(ctx, x, bodyTop, columnWidth, bodyBottom - bodyTop, 19, 'rgba(235,243,255,0.84)');
      roundRect(ctx, x, bodyTop, columnWidth, 56, 17, '#004A98');
      ctx.fillStyle = '#fff';
      ctx.font = '700 22px Inter, sans-serif';
      ctx.fillText(day.short, x + 16, bodyTop + 36);
      const available = bodyBottom - bodyTop - 76;
      const tileHeight = sessions.length ? Math.min(150, (available - gap * (sessions.length - 1)) / sessions.length) : 0;
      sessions.forEach((session, sessionIndex) => {
        drawSession(ctx, session, x + 5, bodyTop + 67 + sessionIndex * (tileHeight + gap), columnWidth - 10, tileHeight, compact);
      });
    });
  } else {
    const columns = width >= 1600 ? 3 : options.size === 'square' ? 2 : 1;
    const rows = Math.ceil(days.length / columns);
    const columnWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
    const rowHeight = (bodyBottom - bodyTop - gap * (rows - 1)) / rows;
    byDay.forEach(({ day, sessions }, index) => {
      const x = margin + (index % columns) * (columnWidth + gap);
      const y = bodyTop + Math.floor(index / columns) * (rowHeight + gap);
      roundRect(ctx, x, y, columnWidth, rowHeight, 18, 'rgba(235,243,255,0.86)');
      ctx.fillStyle = '#003A78';
      ctx.font = '700 26px Inter, sans-serif';
      ctx.fillText(day.label, x + 18, y + 38);
      const available = rowHeight - 64;
      const tileHeight = sessions.length ? Math.min(130, (available - gap * (sessions.length - 1)) / sessions.length) : 0;
      sessions.forEach((session, sessionIndex) => {
        drawSession(ctx, session, x + 8, y + 52 + sessionIndex * (tileHeight + gap), columnWidth - 16, tileHeight, false);
      });
    });
  }
}
