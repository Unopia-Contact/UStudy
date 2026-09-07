/**
 * Tuition Registry: Đăng ký bảng giá theo năm học.
 * getTuitionRates(year, program, profile) trả về bảng giá đã merge (shared + program).
 */
import { tuition_2024_2025 } from './campus-2/2024-2025';
import { tuition_2025_2026 } from './campus-2/2025-2026';
import { tuition_2026_2027 } from './campus-2/2026-2027';
import type { TuitionProfileDefinition, TuitionProfileId, TuitionProgramRef, TuitionRateTable } from './types';

export type { TuitionProfileId, TuitionProgramRef, TuitionRateTable } from './types';

interface TuitionYear {
    profiles: Partial<Record<TuitionProfileId, TuitionRateTable>>;
}

export const TUITION_PROFILES: TuitionProfileDefinition[] = [
    { id: 'tuition-cs1', name: 'Bảng học phí Cơ sở 1 - Chợ Quán' },
    { id: 'tuition-cs2', name: 'Bảng học phí Cơ sở 2 - Đông Hòa' },
];

export const DEFAULT_TUITION_PROFILE_ID: TuitionProfileId = 'tuition-cs2';

import { APP_CONFIG } from '../../../config/appConfig';

export const ACADEMIC_YEARS = [
    { id: '2026-2027', name: 'Năm học 2026-2027 (dự báo)' },
    { id: '2025-2026', name: 'Năm học 2025-2026' },
    { id: '2024-2025', name: 'Năm học 2024-2025' },
];

export const DEFAULT_ACADEMIC_YEAR = APP_CONFIG.DEFAULT_ACADEMIC_YEAR;

const tuitionMap: Record<string, TuitionYear> = {
    '2026-2027': { profiles: { 'tuition-cs2': tuition_2026_2027 } },
    '2025-2026': { profiles: { 'tuition-cs2': tuition_2025_2026 } },
    '2024-2025': { profiles: { 'tuition-cs2': tuition_2024_2025 } },
};

function resolveProgramKeys(program: string | TuitionProgramRef): string[] {
    if (typeof program === 'string') return [program];
    return [`${program.facultyId}/${program.majorId}`, program.majorId];
}

export function getTuitionProfileName(profileId: TuitionProfileId): string {
    return TUITION_PROFILES.find((profile) => profile.id === profileId)?.name ?? profileId;
}

export function getTuitionRateDetails(
    academicYear: string,
    program: string | TuitionProgramRef,
    profileId: TuitionProfileId = DEFAULT_TUITION_PROFILE_ID,
) {
    const yearData = tuitionMap[academicYear] || tuitionMap[DEFAULT_ACADEMIC_YEAR];
    const profileData = yearData.profiles[profileId];
    if (!profileData) {
        throw new Error(`Chưa có dữ liệu ${getTuitionProfileName(profileId)} cho năm học ${academicYear}.`);
    }

    const sharedRates = profileData.shared;
    const majorRates = resolveProgramKeys(program)
        .map((key) => profileData.majors[key])
        .find(Boolean) ?? {};

    return {
        profileId,
        profileName: getTuitionProfileName(profileId),
        default_price: profileData.default_price,
        sharedRates,
        majorRates,
        rates: {
            ...sharedRates,
            ...majorRates,
        },
    };
}

/**
 * Lấy bảng giá cho 1 ngành trong 1 năm học cụ thể.
 * Merge: shared (chung toàn trường) + majors[majorId] (riêng ngành).
 * Major-specific rates ghi đè lên shared nếu trùng key.
 *
 * @returns { default_price, rates } - rates đã được merge
 */
export function getTuitionRates(
    academicYear: string,
    program: string | TuitionProgramRef,
    profileId: TuitionProfileId = DEFAULT_TUITION_PROFILE_ID,
) {
    const { default_price, rates, profileName } = getTuitionRateDetails(academicYear, program, profileId);
    return { default_price, rates, profileId, profileName };
}
