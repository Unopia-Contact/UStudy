import type { CampusDefinition, CampusId, CampusPreferences } from './types';

export const DEFAULT_CAMPUS_ID: CampusId = 'dong-hoa';

export const CAMPUS_DEFINITIONS: Record<CampusId, CampusDefinition> = {
  'cho-quan': {
    id: 'cho-quan',
    name: 'Cơ sở 1 - Chợ Quán',
    shortName: 'Chợ Quán',
    periodCount: 15,
    portalCodes: ['NVC'],
  },
  'dong-hoa': {
    id: 'dong-hoa',
    name: 'Cơ sở 2 - Đông Hòa',
    shortName: 'Đông Hòa',
    periodCount: 10,
    portalCodes: ['LT'],
  },
};

export const CAMPUS_OPTIONS = Object.values(CAMPUS_DEFINITIONS).map((campus) => ({
  id: campus.id,
  name: campus.name,
}));

export const DEFAULT_CAMPUS_PREFERENCES: CampusPreferences = {
  version: 1,
  defaultCampusId: DEFAULT_CAMPUS_ID,
};

export function isCampusId(value: unknown): value is CampusId {
  return value === 'cho-quan' || value === 'dong-hoa';
}

export function getCampusDefinition(campusId: CampusId): CampusDefinition {
  return CAMPUS_DEFINITIONS[campusId];
}
