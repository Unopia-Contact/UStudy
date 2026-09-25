import { Bitset } from './Bitset';
import { WEIGHTS } from './Constants';
import type { DayOffSession } from '../../utils/dayOffPreferences';
import {
    SCHEDULE_DAY_COUNT,
    SCHEDULE_SLOT_MINUTES,
    SCHEDULE_SLOTS_PER_DAY,
    getScheduleBitIndex,
    getScheduleSlotRangeForSession,
} from '../../domain/campus';

export interface Preferences {
    daysOff?: (number | string)[];
    dayOffPenalty?: number;
    session?: string;
    strategy?: string;
    noGaps?: boolean;
    preferredClassesMap?: Record<string, string>;
}

export interface ClassSession {
    id: string;
    scheduleMask?: Bitset;
    schedule?: string | string[];
}

export interface SubjectItem {
    id: string;
    classes: ClassSession[];
}

export interface Chromosome {
    genes: number[];
    combinedMask?: Bitset;
    fitness?: number;
}

export class FitnessEvaluator {
    prefs: any;
    dayOffRules: Array<{ day: number; session: DayOffSession }> = [];

    constructor(preferences: any) {
        this.prefs = { ...preferences };
        this.dayOffRules = this.normalizeDayOffRules(this.prefs.daysOff);
        this.prefs.daysOff = this.dayOffRules;
    }

    normalizeDayOffRules(daysOff: any): Array<{ day: number; session: DayOffSession }> {
        if (!Array.isArray(daysOff)) return [];

        return daysOff
            .map((item: any) => {
                const [rawDay, rawSession] = String(item).split(':');
                const day = Number.parseInt(rawDay, 10);
                if (!Number.isFinite(day)) return null;

                const session = rawSession === 'morning' || rawSession === 'afternoon' ? rawSession : 'all';
                return { day, session };
            })
            .filter((item): item is { day: number; session: DayOffSession } => Boolean(item));
    }

    getPeriodRangeForDayOff(session: DayOffSession): [number, number] {
        return getScheduleSlotRangeForSession(session);
    }

    // --- HÀM TÍNH ĐIỂM (CORE) ---
    getFitness(chromosome: Chromosome, subjects: SubjectItem[]) {
        chromosome.combinedMask = new Bitset();
        let score = WEIGHTS.BASE;
        let conflictCount = 0;
        const genes = chromosome.genes;

        // 1. HARD CONSTRAINT: Check Trùng
        for (let i = 0; i < genes.length; i++) {
            const classIdx = genes[i];
            if (classIdx === -1) continue;

            const currentMask = subjects[i].classes[classIdx].scheduleMask;

            if (currentMask) {
                if (chromosome.combinedMask.anyCommon(currentMask)) {
                    conflictCount++;
                }
                chromosome.combinedMask = chromosome.combinedMask.or(currentMask);
            }
        }

        if (conflictCount > 0) {
            chromosome.fitness = -1 * conflictCount * WEIGHTS.PENALTY_HARD;
            return chromosome.fitness;
        }

        // 2. LEXICOGRAPHIC SOFT CONSTRAINT (Manual Selections)
        let preferredMisses = 0;
        for (let i = 0; i < genes.length; i++) {
            const classIdx = genes[i];
            if (classIdx === -1) continue;
            
            const cls = subjects[i].classes[classIdx];
            const preferredClassId = this.prefs.preferredClassesMap?.[subjects[i].id];
            
            if (preferredClassId && cls.id !== preferredClassId) {
                preferredMisses++;
            }
        }
        
        score -= preferredMisses * WEIGHTS.PENALTY_MANUAL_SELECTION_CHANGED;

        // 3. NORMAL SOFT CONSTRAINTS

        // A. Ngày nghỉ (Dùng Mask quét Bit)
        if (this.dayOffRules.length > 0) {
            genes.forEach((classIdx, idx) => {
                if (classIdx === -1) return;
                const currentMask = subjects[idx].classes[classIdx].scheduleMask;

                if (currentMask) {
                    this.dayOffRules.forEach(({ day, session }) => {
                        const [startPeriodBit, endPeriodBit] = this.getPeriodRangeForDayOff(session);
                        for (let slot = startPeriodBit; slot <= endPeriodBit; slot++) {
                            if (currentMask.test(getScheduleBitIndex(day, slot, 1)) || currentMask.test(getScheduleBitIndex(day, slot, 2))) {
                                score -= this.prefs.dayOffPenalty ?? WEIGHTS.PENALTY_DAY_OFF;
                                break; // Dính 1 tiết là phạt, không cần check tiếp
                            }
                        }
                    });
                }
            });
        }

        // B. Buổi ưu tiên
        if (this.prefs.session && this.prefs.session !== '0') {
            const targetSession = parseInt(this.prefs.session);
            genes.forEach((classIdx, idx) => {
                if (classIdx === -1) return;
                const currentMask = subjects[idx].classes[classIdx].scheduleMask;
                if (currentMask) {
                    const session = this.getSessionFromMask(currentMask);
                    if (session === targetSession) score += WEIGHTS.BONUS_SESSION;
                    else if (session !== 3 && session !== 0) score -= WEIGHTS.PENALTY_WRONG_SESSION;
                }
            });
        }

        // C. Chiến thuật & Gap
        const dailyLoad = this.calculateDailyLoad(chromosome.combinedMask);
        const daysWithClasses = dailyLoad.filter(count => count > 0).length;

        if (this.prefs.strategy === 'compress') {
            score += (7 - daysWithClasses) * WEIGHTS.BONUS_COMPRESS;
        } else if (this.prefs.strategy === 'spread') {
            const heavyDays = dailyLoad.filter(count => count > 8).length;
            score -= heavyDays * WEIGHTS.PENALTY_SPREAD;
        }

        // Luôn tính Gap để trừ điểm nhẹ (hoặc nặng nếu user yêu cầu)
        const gaps = this.calculateGaps(chromosome.combinedMask);
        const gapPenalty = this.prefs.noGaps ? (WEIGHTS.PENALTY_GAP * 2) : WEIGHTS.PENALTY_GAP;
        score -= gaps * gapPenalty;

        chromosome.fitness = score;
        return score;
    }

    // --- HÀM PHÂN TÍCH CHI TIẾT (ĐỂ GHI LOG RA MÀN HÌNH) ---
    getInsights(chromosome: Chromosome, subjects: SubjectItem[]) {
        const report = {
            conflicts: 0,
            penalties: [] as string[],
            bonuses: [] as string[]
        };

        let combinedMask = new Bitset();
        const genes = chromosome.genes;

        // 1. Re-check Trùng
        for (let i = 0; i < genes.length; i++) {
            const classIdx = genes[i];
            if (classIdx === -1) continue;
            const cls = subjects[i].classes[classIdx];
            const currentMask = cls.scheduleMask;

            if (currentMask) {
                if (combinedMask.anyCommon(currentMask)) {
                    report.conflicts++;
                    report.penalties.push(`Trùng lịch: ${subjects[i].id} - Lớp ${cls.id}`);
                }
                combinedMask = combinedMask.or(currentMask);
            }
        }

        // 2. Re-check Ngày nghỉ
        if (this.dayOffRules.length > 0) {
            genes.forEach((classIdx, idx) => {
                if (classIdx === -1) return;
                const cls = subjects[idx].classes[classIdx];
                const currentMask = cls.scheduleMask;

                if (currentMask) {
                    this.dayOffRules.forEach(({ day, session }) => {
                        const [startPeriodBit, endPeriodBit] = this.getPeriodRangeForDayOff(session);
                        for (let slot = startPeriodBit; slot <= endPeriodBit; slot++) {
                            if (currentMask.test(getScheduleBitIndex(day, slot, 1)) || currentMask.test(getScheduleBitIndex(day, slot, 2))) {
                                const sessionLabel = session === 'all' ? 'cả ngày' : session === 'morning' ? 'buổi sáng' : 'buổi chiều';
                                report.penalties.push(`Học ngày nghỉ ${sessionLabel} (Thứ ${day + 2}): ${subjects[idx].id} (${cls.id})`);
                                break;
                            }
                        }
                    });
                }
            });
        }

        // 3. Re-check Gap
        const gaps = this.calculateGaps(combinedMask);
        if (gaps > 0) {
            report.penalties.push(`Có ${gaps} tiết trống trong tuần.`);
        }

        return report;
    }

    // --- HELPERS (DÙNG MASK - CHÍNH XÁC CAO) ---

    // 1: Sáng, 2: Chiều, 3: Cả hai, 0: Không rõ
    getSessionFromMask(mask: Bitset | undefined) {
        if (!mask) return 0;
        let hasMorning = false;
        let hasAfternoon = false;

        const [morningStart, morningEnd] = getScheduleSlotRangeForSession('morning');
        const [afternoonStart, afternoonEnd] = getScheduleSlotRangeForSession('afternoon');
        for (let day = 0; day < SCHEDULE_DAY_COUNT; day++) {
            for (let slot = morningStart; slot <= morningEnd; slot++) {
                if (mask.test(getScheduleBitIndex(day, slot, 1)) || mask.test(getScheduleBitIndex(day, slot, 2))) hasMorning = true;
            }
            for (let slot = afternoonStart; slot <= afternoonEnd; slot++) {
                if (mask.test(getScheduleBitIndex(day, slot, 1)) || mask.test(getScheduleBitIndex(day, slot, 2))) hasAfternoon = true;
            }
        }

        if (hasMorning && hasAfternoon) return 3;
        if (hasMorning) return 1;
        if (hasAfternoon) return 2;
        return 0;
    }

    calculateDailyLoad(combinedMask: Bitset) {
        const load = new Array(SCHEDULE_DAY_COUNT).fill(0);
        for (let day = 0; day < SCHEDULE_DAY_COUNT; day++) {
            let loadP1 = 0;
            let loadP2 = 0;
            for (let slot = 0; slot < SCHEDULE_SLOTS_PER_DAY; slot++) {
                if (combinedMask.test(getScheduleBitIndex(day, slot, 1))) loadP1 += SCHEDULE_SLOT_MINUTES / 50;
                if (combinedMask.test(getScheduleBitIndex(day, slot, 2))) loadP2 += SCHEDULE_SLOT_MINUTES / 50;
            }
            // Một ngày chỉ có tối đa load lớn nhất giữa Phase 1 và Phase 2 vì chúng không diễn ra cùng tuần
            load[day] = Math.max(loadP1, loadP2);
        }
        return load;
    }

    calculateGaps(combinedMask: Bitset) {
        let totalGapMinutes = 0;
        const sessionRanges = [
            getScheduleSlotRangeForSession('morning'),
            getScheduleSlotRangeForSession('afternoon'),
        ];

        for (const phase of [1, 2] as const) {
            for (let day = 0; day < SCHEDULE_DAY_COUNT; day++) {
                for (const [sessionStart, sessionEnd] of sessionRanges) {
                    let previousActive = -1;
                    for (let slot = sessionStart; slot <= sessionEnd; slot++) {
                        if (!combinedMask.test(getScheduleBitIndex(day, slot, phase))) continue;
                        if (previousActive >= 0) {
                            const gapMinutes = (slot - previousActive - 1) * SCHEDULE_SLOT_MINUTES;
                            // Khoảng nghỉ chuyển tiết 10 phút không được tính là tiết trống.
                            if (gapMinutes > 15) totalGapMinutes += gapMinutes;
                        }
                        previousActive = slot;
                    }
                }
            }
        }

        return totalGapMinutes / 25;
    }

    // --- HELPER QUAN TRỌNG: XỬ LÝ MẢNG LỊCH ---

    getDaysFromClass(cls: ClassSession) {
        const days = new Set<number>();
        if (!cls.schedule) return [];

        // 1. CHUẨN HÓA: Ép kiểu thành mảng nếu nó là string
        // VD: "T2(1-3)" -> ["T2(1-3)"]
        // VD: ["T3(7-9)", "T4(4-6)"] -> Giữ nguyên
        const schedules = Array.isArray(cls.schedule) ? cls.schedule : [cls.schedule];

        // 2. DUYỆT TẤT CẢ CÁC BUỔI
        schedules.forEach(s => {
            const str = String(s).toUpperCase().trim();

            // Regex bắt Thứ 2 -> Thứ 7 (VD: T2, THỨ 2, T 2)
            let matchT = str.match(/T\s*([2-7])/);
            if (!matchT) matchT = str.match(/THU\s*([2-7])/);

            if (matchT) {
                const thu = parseInt(matchT[1]);
                days.add(thu - 2); // T2 -> 0
            }

            // Regex bắt Chủ Nhật
            if (str.includes('CN') || str.includes('T8') || str.includes('CHU NHAT')) {
                days.add(6);
            }
        });

        // VD: Trả về [1, 2] nghĩa là lớp này học cả Thứ 3 và Thứ 4
        return Array.from(days);
    }
}
