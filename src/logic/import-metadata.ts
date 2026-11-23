export type PortalDataSource = 'grades' | 'registrations' | 'exams' | 'courses' | 'tuition';

export const PORTAL_SOURCE_BY_PARAM: Readonly<Record<string, PortalDataSource>> = {
  registration: 'registrations',
  exam: 'exams',
  class: 'courses',
  tuition: 'tuition',
};

export interface ImportMetadata {
  version?: string;
  scrapedAt?: string;
  params?: Record<string, unknown>;
  sourceUpdatedAt?: Partial<Record<PortalDataSource, string>>;
  [key: string]: unknown;
}

export function mergeImportMetadata(
  current: ImportMetadata | null | undefined,
  incoming: ImportMetadata | null | undefined,
  updatedSources: Iterable<PortalDataSource>,
): ImportMetadata | null {
  if (!current && !incoming) return null;

  const syncedAt = incoming?.scrapedAt || new Date().toISOString();
  const sources = new Set(updatedSources);
  const sourceUpdatedAt = { ...(current?.sourceUpdatedAt || {}) };
  for (const source of sources) sourceUpdatedAt[source] = syncedAt;

  const params = { ...(current?.params || {}) };
  for (const [key, value] of Object.entries(incoming?.params || {})) {
    const source = PORTAL_SOURCE_BY_PARAM[key];
    if (value !== null && value !== undefined && (!source || sources.has(source))) params[key] = value;
  }

  return {
    ...(current || {}),
    ...(incoming || {}),
    params,
    sourceUpdatedAt,
    scrapedAt: syncedAt,
  };
}
