import { useLayoutEffect } from 'react';

/** Restore the application scroll owner when returning to a roadmap subtab. */
export function useRoadmapScrollMemory(tab: string, ready: boolean) {
    useLayoutEffect(() => {
        if (!ready) return;
        const owner = document.querySelector<HTMLElement>('.ustudy-main-scroll');
        if (!owner) return;
        const key = `ustudy:roadmap:scroll:${tab}`;
        let top = 0;
        try { top = Math.max(0, Number(sessionStorage.getItem(key)) || 0); } catch { /* Optional UI memory. */ }
        const record = () => { top = owner.scrollTop; };
        const frame = requestAnimationFrame(() => {
            owner.scrollTop = top;
            owner.addEventListener('scroll', record, { passive: true });
        });
        return () => {
            cancelAnimationFrame(frame);
            owner.removeEventListener('scroll', record);
            try { sessionStorage.setItem(key, String(top)); } catch { /* Optional UI memory. */ }
        };
    }, [tab, ready]);
}
