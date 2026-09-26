import { CAMPUS_MAP_DATA, type BuildingRuntime, type Campus, type FloorRuntime, type RoomRuntime } from '../../../domain/campus-map';
import { resolveKnownPortalRoom } from '../../../integrations/hcmus-portal/rooms';

export type ScheduleRoomReference = {
  room: string;
  portalLocationCode?: string;
};

export type ScheduleMapLocation = {
  status: 'exact' | 'inferred';
  matchedBy: 'exact' | 'equivalent' | 'structural';
  campus: Campus;
  building: BuildingRuntime;
  floor: FloorRuntime;
  room: RoomRuntime;
  campusMapAvailable: boolean;
  floorMapAvailable: boolean;
  roomShapeAvailable: boolean;
};

export type ScheduleMapLocationResult = ScheduleMapLocation | {
  status: 'unavailable';
  reason: 'missing-code' | 'unmapped' | 'ambiguous' | 'missing-room';
};

export function resolveScheduleMapLocation(reference: ScheduleRoomReference): ScheduleMapLocationResult {
  if (!reference.portalLocationCode) return { status: 'unavailable', reason: 'missing-code' };
  const resolution = resolveKnownPortalRoom(reference.portalLocationCode);
  if (resolution.status === 'ambiguous') return { status: 'unavailable', reason: 'ambiguous' };
  if (resolution.status !== 'matched' || !resolution.roomId || !resolution.matchedBy) {
    return { status: 'unavailable', reason: 'unmapped' };
  }

  const room = CAMPUS_MAP_DATA.roomsById[resolution.roomId];
  const floor = room && CAMPUS_MAP_DATA.floorsById[room.floorId];
  const building = floor && CAMPUS_MAP_DATA.buildingsById[floor.buildingId];
  const campus = building && CAMPUS_MAP_DATA.campusesById[building.campusId];
  if (!room || !floor || !building || !campus) return { status: 'unavailable', reason: 'missing-room' };

  const shapeId = room.map?.shapeId;
  const shapeDeclared = !floor.map?.shapeIds || (shapeId ? floor.map.shapeIds.includes(shapeId) : false);
  return {
    status: resolution.matchedBy === 'structural' ? 'inferred' : 'exact',
    matchedBy: resolution.matchedBy,
    campus,
    building,
    floor,
    room,
    campusMapAvailable: campus.id === 'dong-hoa' || Boolean(campus.map),
    floorMapAvailable: Boolean(floor.map),
    roomShapeAvailable: Boolean(floor.map && shapeId && shapeDeclared),
  };
}
