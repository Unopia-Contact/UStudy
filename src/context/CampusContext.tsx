import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '../config';
import {
  DEFAULT_CAMPUS_PREFERENCES,
  getCampusDefinition,
  isCampusId,
  resolveCampus,
  type CampusId,
  type CampusPreferences,
  type ResolvedCampus,
  type SessionCampus,
} from '../domain/campus';
import { readPlain, savePlain } from '../helpers/localStorage/save';

interface CampusContextValue {
  defaultCampusId: CampusId;
  defaultCampus: ReturnType<typeof getCampusDefinition>;
  campusRevision: number;
  setDefaultCampusId: (campusId: CampusId) => void;
  resolveSessionCampus: (campus?: SessionCampus) => ResolvedCampus;
}

const CampusContext = createContext<CampusContextValue | null>(null);

function readCampusPreferences(): CampusPreferences {
  const stored = readPlain<Partial<CampusPreferences> | null>(STORAGE_KEYS.CAMPUS_PREFERENCES, null);
  if (stored?.version === 1 && isCampusId(stored.defaultCampusId)) {
    return { version: 1, defaultCampusId: stored.defaultCampusId };
  }
  return DEFAULT_CAMPUS_PREFERENCES;
}

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [defaultCampusId, setDefaultCampusIdState] = useState<CampusId>(
    () => readCampusPreferences().defaultCampusId,
  );
  const [campusRevision, setCampusRevision] = useState(0);

  const setDefaultCampusId = useCallback((campusId: CampusId) => {
    savePlain<CampusPreferences>(STORAGE_KEYS.CAMPUS_PREFERENCES, {
      version: 1,
      defaultCampusId: campusId,
    });
    setDefaultCampusIdState(campusId);
    setCampusRevision((revision) => revision + 1);
  }, []);

  const resolveSessionCampus = useCallback(
    (campus?: SessionCampus) => resolveCampus(campus, defaultCampusId),
    [defaultCampusId],
  );

  const value = useMemo<CampusContextValue>(() => ({
    defaultCampusId,
    defaultCampus: getCampusDefinition(defaultCampusId),
    campusRevision,
    setDefaultCampusId,
    resolveSessionCampus,
  }), [campusRevision, defaultCampusId, resolveSessionCampus, setDefaultCampusId]);

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>;
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (!context) throw new Error('useCampus phải được dùng bên trong CampusProvider');
  return context;
}
