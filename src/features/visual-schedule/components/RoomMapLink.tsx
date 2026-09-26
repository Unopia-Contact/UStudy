import { MapPinned } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { getCampusDefinition } from '../../../domain/campus';
import { RoomLocationDialog } from '../../campus-map/RoomLocationDialog';
import { resolveScheduleMapLocation, type ScheduleMapLocation } from '../../campus-map/services/resolve-schedule-location';
import type { ScheduleSession } from '../types';

export function RoomMapLink({ session, variant = 'text', onOpenLocation }: {
  session: ScheduleSession;
  variant?: 'icon' | 'text' | 'campus' | 'room';
  onOpenLocation?: (location: ScheduleMapLocation) => void;
}) {
  const [open, setOpen] = useState(false);
  const location = resolveScheduleMapLocation(session);
  if (location.status === 'unavailable') {
    return variant === 'room' ? <span className="text-right font-semibold text-gray-900">{session.room || '-'}</span> : null;
  }
  const availableLocation: ScheduleMapLocation = location;

  const label = `Xem vị trí phòng ${session.room} trên bản đồ`;
  const campus = getCampusDefinition(session.campusId ?? 'dong-hoa');
  const campusLabel = `${campus.name}${session.isCampusFallback ? ' (mặc định)' : ''}`;

  function showMap(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (onOpenLocation) onOpenLocation(availableLocation);
    else setOpen(true);
  }

  return <>
    {variant === 'icon' ? <button
      type="button"
      onClick={showMap}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#004A98] transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30"
      aria-label={label}
      title={label}
      data-export-ignore="true"
    >
      <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
    </button> : variant === 'room' ? <button
      type="button"
      onClick={showMap}
      className="inline-flex items-center justify-end gap-1 rounded-sm text-right font-semibold text-gray-900 transition-colors hover:text-[#004A98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30"
      aria-label={label}
      title={label}
    >
      <span>{session.room || '-'}</span><MapPinned className="h-3.5 w-3.5 shrink-0 text-[#004A98]" aria-hidden="true" />
    </button> : variant === 'campus' ? <button
      type="button"
      onClick={showMap}
      className="inline-flex min-w-0 items-center gap-1 rounded-md px-1 text-left text-xs font-medium text-[#004A98] transition-colors hover:bg-blue-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30"
      aria-label={label}
      title={label}
    >
      <MapPinned className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{campusLabel} - {session.room}</span>
    </button> : <button
      type="button"
      onClick={showMap}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-blue-50 px-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30"
      aria-label={label}
    >
      <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />Xem vị trí phòng
    </button>}

    {!onOpenLocation && <RoomLocationDialog open={open} onOpenChange={setOpen} location={location} />}
  </>;
}
