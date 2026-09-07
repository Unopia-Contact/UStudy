export type CampusId = 'cho-quan' | 'dong-hoa';

export type PortalCampusCode = 'NVC' | 'LT';

export interface CampusDefinition {
  id: CampusId;
  name: string;
  shortName: string;
  periodCount: number;
  portalCodes: PortalCampusCode[];
}

export type CampusDaySession = 'morning' | 'afternoon' | 'evening';

export interface PeriodDefinition {
  period: number;
  start: string;
  end: string;
  session: CampusDaySession;
}

export interface ResolvedPeriodRange {
  startTime: string;
  endTime: string;
  startMinute: number;
  endMinute: number;
  session: CampusDaySession;
}

export interface CampusPreferences {
  version: 1;
  defaultCampusId: CampusId;
}

export type CampusDetectionSource = 'open-class' | 'reconciled' | 'schedule-range';

export type CampusDetection =
  | {
      status: 'matched';
      campusId: CampusId;
      source: CampusDetectionSource;
      confidence: 'exact' | 'strong';
      rawValue?: string;
    }
  | {
      status: 'ambiguous';
      candidates: CampusId[];
      rawValues?: string[];
    }
  | {
      status: 'unresolved';
      rawValues?: string[];
    };

export interface SessionCampus {
  detection?: CampusDetection;
  manualCampusId?: CampusId;
}

export type ResolvedCampusSource =
  | 'manual'
  | 'open-class'
  | 'reconciled'
  | 'schedule-range'
  | 'profile-fallback';

export interface ResolvedCampus {
  campusId: CampusId;
  source: ResolvedCampusSource;
  isFallback: boolean;
}
