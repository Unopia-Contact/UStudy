import type { ReactNode } from 'react';
import { AppDialog } from '../../../components/ui/overlays/app-dialog';
import { MobileBottomSheet } from '../../../components/ui/overlays/mobile-bottom-sheet';
import { useIsMobile } from '../../../components/ui/use-mobile';

/** One responsive overlay, not two hidden overlays competing for focus/scroll. */
export function RoadmapDialog({ title, description, onClose, children, footer }: {
    title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode;
}) {
    const isMobile = useIsMobile();
    return isMobile
        ? <MobileBottomSheet title={title} eyebrow={description} onClose={onClose} className="md:hidden" contentClassName="p-4" footer={footer}>{children}</MobileBottomSheet>
        : <AppDialog open onOpenChange={open => { if (!open) onClose(); }} title={title} description={description} footer={footer}>{children}</AppDialog>;
}
