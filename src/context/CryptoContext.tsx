import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
    hasSecureData,
    readSecure,
    populateSecureCache,
    clearSecureCache,
    migrateLegacyPlaintextSecureData,
    SECURE_DATA_KEYS,
    getCryptoMetadataKeys,
    isEncryptedStorageValue,
    withStorageMutation,
} from '../helpers/localStorage/save';
import { migrateCourseDatabaseCampusMetadata } from '../logic/course-db-campus-migration';

/**
 * CryptoContext - RAM-only Master Data Key manager
 *
 * Giữ Master Data Key hoàn toàn trong RAM (không bao giờ ghi ra storage).
 * Sử dụng window-level variable để persist qua HMR (Vite hot reload),
 * nhưng vẫn mất khi đóng tab/reload trang - đảm bảo bảo mật.
 * Sau khi unlock, tự động decrypt toàn bộ secure data và populate module RAM cache
 * để các hook đồng bộ có thể đọc được qua readFromStorage shim.
 */

// ── HMR-safe persistence ──────────────────────────────────────────────────
// Window-level variable giữ CryptoKey sống sót qua Vite HMR.
// Vẫn bị xóa khi page reload hoặc đóng tab → an toàn.
const WIN_KEY = Symbol.for('__ustudy_crypto_key__');

function getPersistedKey(): CryptoKey | null {
    return (window as any)[WIN_KEY] || null;
}

function setPersistedKey(key: CryptoKey | null): void {
    if (key) {
        (window as any)[WIN_KEY] = key;
    } else {
        delete (window as any)[WIN_KEY];
    }
}

interface CryptoContextType {
    /** Master Data Key hiện tại - null nghĩa là chưa unlock */
    cryptoKey: CryptoKey | null;
    /** true khi SecurityGate đã kiểm tra xong (tránh flash UI) */
    isReady: boolean;
    /** true khi có dữ liệu nhạy cảm trong localStorage */
    hasData: boolean;
    isCacheReady: boolean;
    /** Gọi sau khi verify PIN thành công - lưu key vào RAM và populate cache */
    unlock: (key: CryptoKey) => void;
    /** Xóa key khỏi RAM và clear cache - app quay về màn hình lock */
    lock: () => void;
    /** Cập nhật hasData (sau khi import xong) */
    refreshHasData: () => void;
}

const CryptoContext = createContext<CryptoContextType | null>(null);

/** Custom event type để báo hooks re-render sau khi cache được populate */
export const CACHE_POPULATED_EVENT = 'CACHE_POPULATED';

export function CryptoProvider({ children }: { children: React.ReactNode }) {
    const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(() => getPersistedKey());
    const [isReady, setIsReady] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [cachedKey, setCachedKey] = useState<CryptoKey | null>(null);

    // Refresh the decrypted values after another tab commits a batch.
    useEffect(() => {
        if (!cryptoKey) {
            clearSecureCache();
            return;
        }
        let active = true;
        let generation = 0;
        let timer: number | undefined;
        const refresh = async () => {
            const revision = ++generation;
            const values = await Promise.all(SECURE_DATA_KEYS.map(async (key) => {
                const stored = localStorage.getItem(key);
                // Some older/current features persist this key as JSON.
                if (stored === null || !isEncryptedStorageValue(stored)) return null;
                try {
                    return { key, stored, value: await readSecure(key, cryptoKey, null) };
                } catch {
                    return null;
                }
            }));
            if (!active || revision !== generation || getPersistedKey() !== cryptoKey) return;
            clearSecureCache();
            for (const item of values) {
                if (item && item.stored === localStorage.getItem(item.key)) {
                    populateSecureCache(item.key, item.value, item.stored);
                }
            }
            setCachedKey(cryptoKey);
            window.postMessage({ type: CACHE_POPULATED_EVENT }, window.location.origin);
        };
        const onStorage = (event: StorageEvent) => {
            if (event.storageArea !== localStorage
                || (event.key !== null && !(SECURE_DATA_KEYS as readonly string[]).includes(event.key))) return;
            ++generation;
            window.clearTimeout(timer);
            timer = window.setTimeout(() => { void refresh(); }, 0);
        };
        window.addEventListener('storage', onStorage);
        void (async () => {
            try {
                await withStorageMutation(async () => {
                    if (!active) return;
                    await migrateLegacyPlaintextSecureData(cryptoKey);
                    if (active) await migrateCourseDatabaseCampusMetadata(cryptoKey);
                });
            } catch (error) {
                console.error('[crypto] Không thể hoàn tất migration dữ liệu cục bộ.', error);
            }
            if (active) await refresh();
        })();
        return () => {
            active = false;
            window.clearTimeout(timer);
            window.removeEventListener('storage', onStorage);
        };
    }, [cryptoKey]);

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.storageArea === localStorage && (event.key === null || getCryptoMetadataKeys().includes(event.key)
                || (SECURE_DATA_KEYS as readonly string[]).includes(event.key))) {
                setHasData(hasSecureData());
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const unlock = useCallback((key: CryptoKey) => {
        setPersistedKey(key);
        setCryptoKey(key);
    }, []);

    const lock = useCallback(() => {
        setPersistedKey(null);
        setCryptoKey(null);
        clearSecureCache();
    }, []);

    const refreshHasData = useCallback(() => {
        setHasData(hasSecureData());
    }, []);

    return (
        <CryptoContext.Provider value={{ cryptoKey, isReady, hasData, isCacheReady: !cryptoKey || cachedKey === cryptoKey, unlock, lock, refreshHasData }}>
            <CryptoGateInit
                onReady={(dataAvailable) => {
                    setHasData(dataAvailable);
                    setIsReady(true);
                }}
            />
            {children}
        </CryptoContext.Provider>
    );
}

/** Component nội bộ - chạy logic kiểm tra ban đầu một lần duy nhất */
function CryptoGateInit({ onReady }: { onReady: (hasData: boolean) => void }) {
    const [ran, setRan] = React.useState(false);

    React.useEffect(() => {
        if (ran) return;
        setRan(true);
        onReady(hasSecureData());
    }, [ran, onReady]);

    return null;
}

export function useCrypto(): CryptoContextType {
    const ctx = useContext(CryptoContext);
    if (!ctx) throw new Error('useCrypto phải được dùng bên trong <CryptoProvider>');
    return ctx;
}

/**
 * Hook tiện ích: trả về cryptoKey hoặc throw nếu chưa unlock.
 */
export function useCryptoKey(): CryptoKey {
    const { cryptoKey } = useCrypto();
    if (!cryptoKey) throw new Error('Chưa unlock - CryptoKey chưa có trong RAM');
    return cryptoKey;
}
