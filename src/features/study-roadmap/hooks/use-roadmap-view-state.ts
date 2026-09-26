import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/** UI-only preferences for this browser tab; no academic data or backend writes. */
export function useRoadmapViewState<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): [T, Dispatch<SetStateAction<T>>] {
    const storageKey = `ustudy:roadmap:view:${key}`;
    const [value, setValue] = useState<T>(() => {
        try {
            const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
            return isValid(saved) ? saved : fallback;
        } catch { return fallback; }
    });
    useEffect(() => {
        try { sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Storage can be unavailable in private browsers. */ }
    }, [storageKey, value]);
    return [value, setValue];
}
