import {
  DEFAULT_CAMPUS_ID,
  LEGACY_SCHEDULE_MASK_PARTS,
  LEGACY_SCHEDULE_PHASE_BIT_COUNT,
  LEGACY_SCHEDULE_SLOTS_PER_DAY,
  SCHEDULE_MASK_PARTS,
  getScheduleBitIndex,
  minuteToScheduleSlot,
  type CampusId,
} from '../../domain/campus';
import { getCampusPeriods } from '../../assets/data/campuses';

function clockToMinute(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function sourceHasBit(parts: number[], bitIndex: number): boolean {
  return (((parts[Math.floor(bitIndex / 32)] ?? 0) | 0) & (1 << (bitIndex % 32))) !== 0;
}

export class Bitset {
  parts: number[];

  constructor() {
    this.parts = new Array(SCHEDULE_MASK_PARTS).fill(0);
  }

  set(pos: number) {
    if (pos < 0 || pos >= SCHEDULE_MASK_PARTS * 32) return;
    const index = Math.floor(pos / 32);
    this.parts[index] |= 1 << (pos % 32);
  }

  test(pos: number) {
    if (pos < 0 || pos >= SCHEDULE_MASK_PARTS * 32) return false;
    const index = Math.floor(pos / 32);
    return (this.parts[index] & (1 << (pos % 32))) !== 0;
  }

  reset() {
    this.parts.fill(0);
  }

  or(other: Bitset) {
    const result = new Bitset();
    for (let index = 0; index < SCHEDULE_MASK_PARTS; index++) {
      result.parts[index] = (this.parts[index] ?? 0) | (other.parts[index] ?? 0);
    }
    return result;
  }

  anyCommon(other: Bitset) {
    for (let index = 0; index < SCHEDULE_MASK_PARTS; index++) {
      if (((this.parts[index] ?? 0) & (other.parts[index] ?? 0)) !== 0) return true;
    }
    return false;
  }

  loadFromData(data: number[], legacyCampusId: CampusId = DEFAULT_CAMPUS_ID) {
    this.reset();
    if (!Array.isArray(data)) return;

    if (data.length > LEGACY_SCHEDULE_MASK_PARTS) {
      for (let index = 0; index < Math.min(SCHEDULE_MASK_PARTS, data.length); index++) {
        this.parts[index] = data[index] | 0;
      }
      return;
    }

    this.loadLegacyPeriodMask(data, legacyCampusId);
  }

  private loadLegacyPeriodMask(data: number[], campusId: CampusId) {
    const periods = getCampusPeriods(campusId).slice(0, 10);

    for (let phase = 1 as 1 | 2; phase <= 2; phase = (phase + 1) as 1 | 2) {
      const phaseOffset = phase === 2 ? LEGACY_SCHEDULE_PHASE_BIT_COUNT : 0;
      for (let day = 0; day < 7; day++) {
        for (let halfSlot = 0; halfSlot < LEGACY_SCHEDULE_SLOTS_PER_DAY; halfSlot++) {
          const legacyBit = phaseOffset + day * LEGACY_SCHEDULE_SLOTS_PER_DAY + halfSlot;
          if (!sourceHasBit(data, legacyBit)) continue;

          const period = periods[Math.floor(halfSlot / 2)];
          if (!period) continue;
          const start = clockToMinute(period.start);
          const end = clockToMinute(period.end);
          const midpoint = Math.round((start + end) / 2);
          const intervalStart = halfSlot % 2 === 0 ? start : midpoint;
          const intervalEnd = halfSlot % 2 === 0 ? midpoint : end;
          const firstSlot = minuteToScheduleSlot(intervalStart);
          const endSlot = minuteToScheduleSlot(intervalEnd);

          for (let slot = firstSlot; slot < endSlot; slot += 1) {
            this.set(getScheduleBitIndex(day, slot, phase));
          }
        }
      }
    }
  }
}
