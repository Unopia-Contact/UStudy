import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../../app/routes';
import { resolveKnownPortalRoom } from '../../../integrations/hcmus-portal/rooms';
import type { ScheduleSession } from '../types';

export function RoomMapLink({ session }: { session: ScheduleSession }) {
  if (!session.portalLocationCode) return null;
  const resolution = resolveKnownPortalRoom(session.portalLocationCode);
  if (resolution.status !== 'matched' || !resolution.roomId) return null;
  const inferred = resolution.matchedBy === 'structural';
  const params = new URLSearchParams({ roomId: resolution.roomId });
  if (inferred) params.set('match', 'structural');
  return <Link to={`${APP_ROUTES.campusMap}?${params.toString()}`}
    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
    aria-label={`${inferred ? 'Vị trí suy luận của' : 'Xem'} phòng ${session.room} trên bản đồ`}>
    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />{inferred ? 'Vị trí suy luận' : 'Xem trên bản đồ'}
  </Link>;
}
