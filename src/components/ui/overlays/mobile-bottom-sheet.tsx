import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
    title: string;
    eyebrow?: string;
    ariaLabel?: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    sheetClassName?: string;
    contentClassName?: string;
    sheetId?: string;
    scrollContent?: boolean;
}

export function MobileBottomSheet({
    title,
    eyebrow,
    ariaLabel,
    onClose,
    children,
    footer,
    className = 'lg:hidden',
    sheetClassName = '',
    contentClassName = '',
    sheetId,
    scrollContent = true,
}: MobileBottomSheetProps) {
    const sheetRef = useRef<HTMLElement>(null);
    const dragStartYRef = useRef(0);
    const dragOffsetRef = useRef(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const focusable = () => Array.from(sheetRef.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex="0"]') ?? []).filter(element => !element.hasAttribute('disabled') && element.getClientRects().length > 0);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCloseRef.current();
            if (event.key !== 'Tab') return;
            const controls = focusable();
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (!first) { event.preventDefault(); sheetRef.current?.focus(); return; }
            if (event.shiftKey && (document.activeElement === first || !sheetRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || !sheetRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        const frame = requestAnimationFrame(() => (focusable()[0] ?? sheetRef.current)?.focus());

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(frame);
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, []);

    const updateDragOffset = (offset: number) => {
        const nextOffset = Math.max(0, offset);
        dragOffsetRef.current = nextOffset;
        setDragOffset(nextOffset);
    };

    const handleDragStart = (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        dragStartYRef.current = event.clientY;
        dragOffsetRef.current = 0;
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleDragMove = (event: PointerEvent<HTMLButtonElement>) => {
        if (!isDragging) return;
        updateDragOffset(event.clientY - dragStartYRef.current);
    };

    const finishDrag = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
        if (!isDragging) return;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        setIsDragging(false);
        const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? 400;
        const closeThreshold = Math.min(140, sheetHeight * 0.28);
        if (!cancelled && dragOffsetRef.current >= closeThreshold) {
            onClose();
            return;
        }
        updateDragOffset(0);
    };

    return createPortal((
        <div className={`fixed inset-x-0 top-0 bottom-[var(--ustudy-mobile-nav-height)] z-[var(--ustudy-z-bottom-sheet)] md:bottom-0 ${className}`}>
            <button
                type="button"
                aria-label="Đóng"
                onClick={onClose}
                className="absolute inset-0 h-full w-full bg-gray-900/35"
            />
            <section
                ref={sheetRef}
                role="dialog"
                tabIndex={-1}
                aria-modal="true"
                aria-label={ariaLabel || title}
                data-mobile-sheet={sheetId}
                className={`absolute inset-x-0 bottom-0 flex max-h-[82dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ${sheetClassName}`}
                style={{
                    transform: `translateY(${dragOffset}px)`,
                    transition: isDragging ? 'none' : 'transform 180ms ease-out',
                }}
            >
                <div className="shrink-0 bg-[#004A98]">
                    <button
                        type="button"
                        aria-label="Kéo xuống để đóng"
                        onPointerDown={handleDragStart}
                        onPointerMove={handleDragMove}
                        onPointerUp={(event) => finishDrag(event)}
                        onPointerCancel={(event) => finishDrag(event, true)}
                        className="flex h-7 w-full touch-none cursor-grab appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none active:cursor-grabbing"
                    >
                        <span
                            className={`h-1.5 rounded-full transition-[width,background-color] ${isDragging
                                    ? 'w-14 bg-white/90'
                                    : 'w-12 bg-white/55'
                                }`}
                        />
                    </button>

                    <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-2">
                        <div className="min-w-0">
                            {eyebrow && (
                                <p className="text-xs font-semibold uppercase text-blue-100">
                                    {eyebrow}
                                </p>
                            )}

                            <h2
                                className={`${eyebrow ? 'mt-1' : ''
                                    } text-base font-bold leading-snug text-white`}
                            >
                                {title}
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-white/85 transition-colors hover:bg-white/15 hover:text-white"
                            aria-label="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div
                    className={`scrollbar-hide min-h-0 flex-1 overscroll-contain ${scrollContent ? '' : 'flex flex-col'} ${contentClassName}`}
                    style={{ overflowY: scrollContent ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch' }}
                >
                    {children}
                </div>

                {footer && (
                    <div className="shrink-0 border-t border-gray-100 bg-white px-4 pb-4 pt-3 shadow-[0_-8px_18px_rgba(15,23,42,0.06)]">
                        {footer}
                    </div>
                )}
            </section>
        </div>
    ), document.body);
}
