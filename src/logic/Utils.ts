import { SPLIT_SEMESTER_CONFIG } from '../config';
import {
  DEFAULT_CAMPUS_ID,
  SCHEDULE_DAY_COUNT,
  SCHEDULE_MASK_PARTS,
  SCHEDULE_PHASE_BIT_COUNT,
  SCHEDULE_SLOTS_PER_DAY,
  getScheduleBitIndex,
  isTimeInsideScheduleAxis,
  minuteToScheduleSlot,
  resolvePeriodRange,
  tryResolvePeriodRange,
  scheduleSlotToMinute,
  type CampusId,
} from '../domain/campus';
import { getCampusPeriods } from '../assets/data/campuses';

function getSubjectPhase(subjectID: string): 0 | 1 | 2 {
  const cleanID = subjectID.trim().toUpperCase();
  if (!cleanID) return 0;
  if (SPLIT_SEMESTER_CONFIG.PHASE_1.some((id) => cleanID.includes(id))) return 1;
  if (SPLIT_SEMESTER_CONFIG.PHASE_2.some((id) => cleanID.includes(id))) return 2;
  return 0;
}

function setMaskBit(mask: number[], bitIndex: number): void {
  mask[Math.floor(bitIndex / 32)] |= 1 << (bitIndex % 32);
}

export function encodeScheduleToMask(
  scheduleInput: string | string[],
  subjectID = '',
  campusId: CampusId = DEFAULT_CAMPUS_ID,
) {
  const mask = new Array(SCHEDULE_MASK_PARTS).fill(0);
  const scheduleArr = Array.isArray(scheduleInput) ? scheduleInput : [scheduleInput];
  const phase = getSubjectPhase(subjectID);

  scheduleArr.forEach((value) => {
    if (!value) return;
    const match = String(value).match(/T(\d|CN)\s*\((\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\)/i);
    if (!match) return;

    const day = match[1].toUpperCase() === 'CN' ? 6 : Number.parseInt(match[1], 10) - 2;
    if (day < 0 || day >= SCHEDULE_DAY_COUNT) return;

    const resolved = tryResolvePeriodRange(
      campusId,
      Number.parseFloat(match[2]),
      Number.parseFloat(match[3]),
    );
    if (!resolved) {
      console.warn(`[schedule] Bỏ qua khoảng tiết không hợp lệ "${value}" tại cơ sở "${campusId}".`);
      return;
    }
    if (!isTimeInsideScheduleAxis(resolved.startMinute) || !isTimeInsideScheduleAxis(resolved.endMinute)) {
      throw new RangeError(`Lich ${value} nam ngoai truc thoi gian ho tro.`);
    }

    const startSlot = minuteToScheduleSlot(resolved.startMinute);
    const endSlot = minuteToScheduleSlot(resolved.endMinute);
    for (let slot = startSlot; slot < endSlot; slot++) {
      if (phase === 0 || phase === 1) setMaskBit(mask, getScheduleBitIndex(day, slot, 1));
      if (phase === 0 || phase === 2) setMaskBit(mask, getScheduleBitIndex(day, slot, 2));
    }
  });

  return { parts: mask };
}

export interface ScheduleSlot {
  day: number;
  period: number;
}

function maskHasBit(parts: number[], bitIndex: number): boolean {
  return (((parts[Math.floor(bitIndex / 32)] ?? 0) | 0) & (1 << (bitIndex % 32))) !== 0;
}

export function decodeScheduleMask(
  parts: number[],
  campusId: CampusId = DEFAULT_CAMPUS_ID,
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const periods = getCampusPeriods(campusId);

  for (let day = 0; day < SCHEDULE_DAY_COUNT; day++) {
    for (const period of periods) {
      const resolved = resolvePeriodRange(campusId, period.period, period.period);
      const startSlot = minuteToScheduleSlot(resolved.startMinute);
      const endSlot = minuteToScheduleSlot(resolved.endMinute);
      let active = false;

      for (let slot = startSlot; slot < endSlot && !active; slot++) {
        const firstPhaseBit = day * SCHEDULE_SLOTS_PER_DAY + slot;
        active = maskHasBit(parts, firstPhaseBit)
          || maskHasBit(parts, firstPhaseBit + SCHEDULE_PHASE_BIT_COUNT);
      }

      if (active) slots.push({ day, period: period.period });
    }
  }

  return slots;
}

export interface DecodedTimeRun {
  day: number;
  phase: 1 | 2 | 3;
  startMinute: number;
  endMinute: number;
}

export function decodeScheduleTimeRuns(parts: number[]): DecodedTimeRun[] {
  const runs: DecodedTimeRun[] = [];

  for (let day = 0; day < SCHEDULE_DAY_COUNT; day++) {
    let runStart = -1;
    let runPhase: 0 | 1 | 2 | 3 = 0;

    for (let slot = 0; slot <= SCHEDULE_SLOTS_PER_DAY; slot++) {
      const firstPhase = slot < SCHEDULE_SLOTS_PER_DAY
        && maskHasBit(parts, getScheduleBitIndex(day, slot, 1));
      const secondPhase = slot < SCHEDULE_SLOTS_PER_DAY
        && maskHasBit(parts, getScheduleBitIndex(day, slot, 2));
      const phase: 0 | 1 | 2 | 3 = firstPhase && secondPhase ? 3 : firstPhase ? 1 : secondPhase ? 2 : 0;

      if (phase !== 0 && runStart === -1) {
        runStart = slot;
        runPhase = phase;
      } else if (runStart !== -1 && phase !== runPhase) {
        runs.push({
          day,
          phase: runPhase as 1 | 2 | 3,
          startMinute: scheduleSlotToMinute(runStart),
          endMinute: scheduleSlotToMinute(slot),
        });
        runStart = phase === 0 ? -1 : slot;
        runPhase = phase;
      }
    }
  }

  return runs;
}
