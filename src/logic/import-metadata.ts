import { semesterKey } from './academic-semester';

export type PortalDataSource = 'grades' | 'registrations' | 'exams' | 'courses' | 'tuition' | 'profile';

export const PORTAL_SOURCE_BY_PARAM: Readonly<Record<string, PortalDataSource>> = {
  registration: 'registrations', exam: 'exams', class: 'courses', tuition: 'tuition', grades: 'grades',
};

export interface ImportMetadata {
  version?: string;
  scrapedAt?: string;
  legacyScrapedAt?: string;
  params?: Record<string, unknown>;
  sourceUpdatedAt?: Partial<Record<PortalDataSource, string>>;
  periodUpdatedAt?: Partial<Record<PortalDataSource, Record<string, string>>>;
  [key: string]: unknown;
}

export interface ImportScope {
  collection: PortalDataSource;
  scope: string;
}

function validDate(value: unknown): string | undefined {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : undefined;
}

export function sourceDate(meta: ImportMetadata | null | undefined, source: PortalDataSource, scope: string) {
  return validDate(meta?.periodUpdatedAt?.[source]?.[scope])
    ?? validDate(meta?.sourceUpdatedAt?.[source])
    ?? validDate(meta?.legacyScrapedAt)
    ?? (meta?.sourceUpdatedAt && Object.keys(meta.sourceUpdatedAt).length ? undefined : validDate(meta?.scrapedAt));
}

function laterDate(current: string | undefined, next: string) {
  return current && Date.parse(current) > Date.parse(next) ? current : next;
}

export function mergeImportMetadata(
  current: ImportMetadata | null | undefined, incoming: ImportMetadata | null | undefined,
  updatedSources: Iterable<PortalDataSource>, scopes: Iterable<ImportScope> = [],
): ImportMetadata | null {
  if (!current && !incoming) return null;
  const sources = new Set(updatedSources);
  if (!sources.size) return current ?? null;
  const sourceUpdatedAt = { ...current?.sourceUpdatedAt };
  const periodUpdatedAt = { ...current?.periodUpdatedAt };
  const params = { ...current?.params };
  const syncedAt = validDate(incoming?.scrapedAt);
  const selectedScopes = Array.from(scopes);
  for (const { collection, scope } of selectedScopes) {
    const date = sourceDate(incoming, collection, scope);
    if (date) periodUpdatedAt[collection] = { ...periodUpdatedAt[collection],
      [scope]: laterDate(periodUpdatedAt[collection]?.[scope], date) };
  }
  for (const source of sources) {
    const selected = selectedScopes.filter(scope => scope.collection === source);
    const dates = selected.length ? selected.map(item => sourceDate(incoming, source, item.scope)) : [sourceDate(incoming, source, '')];
    for (const date of dates) if (date) sourceUpdatedAt[source] = laterDate(sourceUpdatedAt[source], date);
  }
  for (const [key, value] of Object.entries(incoming?.params || {})) {
    const source = PORTAL_SOURCE_BY_PARAM[key];
    if (value == null || (source && !sources.has(source))) continue;
    const scope = semesterKey(value);
    if ((source === 'courses' || source === 'registrations') && selectedScopes.length && scope
      && !selectedScopes.some(item => item.collection === source && item.scope === scope)) continue;
    const previous = source && sourceDate(current, source, '');
    const date = source && sourceDate(incoming, source, scope);
    if (!previous || (date && Date.parse(date) >= Date.parse(previous))) params[key] = value;
  }
  // A legacy global timestamp still describes sources untouched by this import.
  const legacyScrapedAt = validDate(current?.legacyScrapedAt)
    ?? (!Object.keys(current?.sourceUpdatedAt ?? {}).length ? validDate(current?.scrapedAt) : undefined);
  return {
    ...current, ...incoming, params, sourceUpdatedAt, periodUpdatedAt, legacyScrapedAt,
    scrapedAt: syncedAt ? laterDate(validDate(current?.scrapedAt), syncedAt) : current?.scrapedAt,
  };
}
