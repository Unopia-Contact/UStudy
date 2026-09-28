import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Keep names on one line; offer expansion only when that line actually overflows. */
export function GroupCourseMemberNames({ names }: { names: string[] }) {
    const text = names.join(', ');
    const measureRef = useRef<HTMLSpanElement>(null);
    const [overflows, setOverflows] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const element = measureRef.current;
        if (!element) return;
        let mounted = true;
        const measure = () => {
            if (!mounted || !element.clientWidth) return;
            const clipped = element.scrollWidth > element.clientWidth + 1;
            setOverflows(clipped);
            if (!clipped) setExpanded(false);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        measure();
        void document.fonts?.ready.then(measure);
        return () => { mounted = false; observer.disconnect(); };
    }, [text]);

    return (
        <div className="relative min-w-0 text-xs leading-5 text-gray-500">
            <span ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 truncate">{text}</span>
            <button type="button" disabled={!overflows} aria-expanded={overflows ? expanded : undefined}
                aria-label={overflows ? `${expanded ? 'Thu gọn' : 'Xem đủ'} danh sách thành viên` : undefined}
                onClick={() => setExpanded((current) => !current)}
                className="flex min-h-7 w-full min-w-0 items-start gap-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-default">
                <span className={`min-w-0 flex-1 ${expanded ? 'break-words' : 'truncate'}`}>{text || 'Chưa có thành viên'}</span>
                {overflows && <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />}
            </button>
        </div>
    );
}
