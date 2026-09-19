import { MapPinned } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { RoomLocationDialog } from '../../campus-map/RoomLocationDialog';
import { resolveScheduleMapLocation } from '../../campus-map/services/resolve-schedule-location';
import type { ScheduleSession } from '../types';

export function RoomMapLink({ session, variant = 'text' }: {
  session: ScheduleSession;
  variant?: 'icon' | 'text';
}) {
  const [open, setOpen] = useState(false);
  const location = resolveScheduleMapLocation(session);
  if (location.status === 'unavailable') return null;

  const inferred = location.status === 'inferred';
  const label = inferred
    ? `Xem vị trí suy luận của phòng ${session.room}`
    : `Xem vị trí phòng ${session.room} trên bản đồ`;

  function showMap(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }

  return <>
    {variant === 'icon' ? <button
      type="button"
      onClick={showMap}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30 ${inferred ? 'text-amber-700 hover:bg-amber-100' : 'text-[#004A98] hover:bg-blue-100'}`}
      aria-label={label}
      title={label}
      data-export-ignore="true"
    >
      <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
    </button> : <button
      type="button"
      onClick={showMap}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30 ${inferred ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}
      aria-label={label}
    >
      <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />{inferred ? 'Vị trí suy luận' : 'Xem vị trí phòng'}
    </button>}

    <RoomLocationDialog open={open} onOpenChange={setOpen} location={location} />
  </>;
}
