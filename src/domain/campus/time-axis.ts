import type { CampusDaySession } from './types';

export const SCHEDULE_DAY_COUNT = 7;
export const SCHEDULE_SLOT_MINUTES = 5;
export const SCHEDULE_DAY_START_MINUTE = 7 * 60;
export const SCHEDULE_DAY_END_MINUTE = 20 * 60 + 30;
export const SCHEDULE_SLOTS_PER_DAY =
  (SCHEDULE_DAY_END_MINUTE - SCHEDULE_DAY_START_MINUTE) / SCHEDULE_SLOT_MINUTES;
export const SCHEDULE_PHASE_BIT_COUNT = SCHEDULE_DAY_COUNT * SCHEDULE_SLOTS_PER_DAY;
export const SCHEDULE_TOTAL_BIT_COUNT = SCHEDULE_PHASE_BIT_COUNT * 2;
export const SCHEDULE_MASK_PARTS = Math.ceil(SCHEDULE_TOTAL_BIT_COUNT / 32);

export const LEGACY_SCHEDULE_SLOTS_PER_DAY = 20;
export const LEGACY_SCHEDULE_PHASE_BIT_COUNT = SCHEDULE_DAY_COUNT * LEGACY_SCHEDULE_SLOTS_PER_DAY;
export const LEGACY_SCHEDULE_MASK_PARTS = 10;

const AFTERNOON_START_MINUTE = 12 * 60 + 30;

export function minuteToScheduleSlot(minute: number): number {
  return Math.floor((minute - SCHEDULE_DAY_START_MINUTE) / SCHEDULE_SLOT_MINUTES);
}

export function scheduleSlotToMinute(slot: number): number {
  return SCHEDULE_DAY_START_MINUTE + slot * SCHEDULE_SLOT_MINUTES;
}

export function getScheduleBitIndex(day: number, slot: number, phase: 1 | 2): number {
  return (phase === 2 ? SCHEDULE_PHASE_BIT_COUNT : 0) + day * SCHEDULE_SLOTS_PER_DAY + slot;
}

export function getScheduleSlotRangeForSession(session: CampusDaySession | 'all'): [number, number] {
  if (session === 'morning') {
    return [0, minuteToScheduleSlot(AFTERNOON_START_MINUTE) - 1];
  }

  if (session === 'afternoon' || session === 'evening') {
    return [minuteToScheduleSlot(AFTERNOON_START_MINUTE), SCHEDULE_SLOTS_PER_DAY - 1];
  }

  return [0, SCHEDULE_SLOTS_PER_DAY - 1];
}

export function isTimeInsideScheduleAxis(minute: number): boolean {
  return minute >= SCHEDULE_DAY_START_MINUTE && minute <= SCHEDULE_DAY_END_MINUTE;
}
