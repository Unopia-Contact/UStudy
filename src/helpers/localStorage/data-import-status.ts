import { STORAGE_KEYS } from '../../config/storageKeys';
import { readPlain } from './save';

export type DataImportSource = 'bookmarklet' | 'extension' | 'mobile-app' | 'json' | 'optical';

interface DataImportStatus {
    at: string;
    source: DataImportSource;
}

export function buildDataImportStatus(source: DataImportSource): string {
    return JSON.stringify({ at: new Date().toISOString(), source } satisfies DataImportStatus);
}

export function hasImportedData(): boolean {
    const status = readPlain<DataImportStatus | null>(STORAGE_KEYS.LAST_DATA_IMPORT, null);
    return Boolean(status?.at && status.source);
}
