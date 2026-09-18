import { CAMPUS_MAP_DATA } from '../../../domain/campus-map';
import { PORTAL_ROOM_BINDINGS } from './bindings';
import { buildPortalRoomIndexes } from './build-portal-indexes';
import { resolvePortalRoom } from './resolve-portal-room';

export const PORTAL_ROOM_INDEXES = buildPortalRoomIndexes(PORTAL_ROOM_BINDINGS);
export function resolveKnownPortalRoom(rawPortalCode: string) {
  return resolvePortalRoom(rawPortalCode, CAMPUS_MAP_DATA, PORTAL_ROOM_INDEXES);
}
export * from './extract-portal-location';
export * from './build-portal-indexes';
export * from './resolve-portal-room';
export * from './types';
