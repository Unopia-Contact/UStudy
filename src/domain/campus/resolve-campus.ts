import { DEFAULT_CAMPUS_ID } from './constants';
import type {
  CampusDetection,
  CampusId,
  ResolvedCampus,
  SessionCampus,
} from './types';

const PORTAL_CAMPUS_CODES: Record<string, CampusId> = {
  NVC: 'cho-quan',
  LT: 'dong-hoa',
};

function normalizePortalValue(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function getCampusIdsFromPortalValue(value: unknown): CampusId[] {
  const normalized = normalizePortalValue(value);
  const matches: CampusId[] = [];
  if (normalized === 'NVC' || /\bNVC\b/.test(normalized)) matches.push('cho-quan');
  if (normalized === 'LT' || /\bLT\b/.test(normalized)) matches.push('dong-hoa');
  return matches;
}

export function getCampusIdFromPortalCode(value: unknown): CampusId | null {
  const exactMatch = PORTAL_CAMPUS_CODES[normalizePortalValue(value)];
  return exactMatch ?? getCampusIdsFromPortalValue(value)[0] ?? null;
}

export function detectCampusFromOpenClassLocations(values: unknown[]): CampusDetection {
  const rawValues = [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
  const matches = [...new Set(rawValues.flatMap(getCampusIdsFromPortalValue))];

  if (matches.length === 1) {
    return {
      status: 'matched',
      campusId: matches[0],
      source: 'open-class',
      confidence: 'exact',
      rawValue: rawValues.find((value) => getCampusIdsFromPortalValue(value).includes(matches[0])),
    };
  }

  if (matches.length > 1) {
    return { status: 'ambiguous', candidates: matches, rawValues };
  }

  return { status: 'unresolved', rawValues };
}

export function resolveCampus(
  campus: SessionCampus | undefined,
  defaultCampusId: CampusId = DEFAULT_CAMPUS_ID,
): ResolvedCampus {
  if (campus?.manualCampusId) {
    return { campusId: campus.manualCampusId, source: 'manual', isFallback: false };
  }

  if (campus?.detection?.status === 'matched') {
    return {
      campusId: campus.detection.campusId,
      source: campus.detection.source,
      isFallback: false,
    };
  }

  return { campusId: defaultCampusId, source: 'profile-fallback', isFallback: true };
}
