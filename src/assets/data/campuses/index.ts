import type { CampusId, PeriodDefinition } from '../../../domain/campus';
import { CHO_QUAN_PERIODS } from './cho-quan/periods';
import { DONG_HOA_PERIODS } from './dong-hoa/periods';

const CAMPUS_PERIODS: Record<CampusId, PeriodDefinition[]> = {
  'cho-quan': CHO_QUAN_PERIODS,
  'dong-hoa': DONG_HOA_PERIODS,
};

export function getCampusPeriods(campusId: CampusId): PeriodDefinition[] {
  return CAMPUS_PERIODS[campusId];
}

export { CHO_QUAN_PERIODS, DONG_HOA_PERIODS };
