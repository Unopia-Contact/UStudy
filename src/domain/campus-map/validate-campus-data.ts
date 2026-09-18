import type { PortalRoomBinding } from '../../integrations/hcmus-portal/rooms/types';
import { compilePortalCode, createEquivalentPortalKey } from '../../integrations/hcmus-portal/rooms/build-portal-indexes';
import { buildCampusMapRuntimeData } from './build-runtime-data';
import { createBuildingId, createFloorId, createRoomId } from './ids';
import type { Campus } from './types';

export interface CampusMapValidationError {
  code: string;
  message: string;
  entityId?: string;
}

export function validateCampusMapData(campuses: Campus[], bindings: PortalRoomBinding[]): CampusMapValidationError[] {
  const errors: CampusMapValidationError[] = [];
  const seen = new Set<string>();
  const add = (code: string, message: string, entityId?: string) => errors.push({ code, message, entityId });
  const unique = (id: string) => {
    if (seen.has(id)) add('duplicate-id', `ID trùng: ${id}`, id);
    seen.add(id);
  };
  const verifyShape = (shapeId: string, asset: { shapeIds?: string[] } | undefined, id: string) => {
    if (!asset || !asset.shapeIds?.includes(shapeId)) add('missing-shape', `Không tìm thấy shape ${shapeId} trong asset`, id);
  };

  for (const campus of campuses) {
    unique(campus.id);
    for (const building of campus.buildings) {
      const buildingId = createBuildingId(campus.id, building.id);
      unique(buildingId);
      if (building.map) verifyShape(building.map.shapeId, campus.map, buildingId);
      for (const floor of building.floors) {
        const floorId = createFloorId(buildingId, floor.id);
        unique(floorId);
        for (const room of floor.rooms) {
          const roomId = createRoomId(floorId, room.id);
          unique(roomId);
          if (room.map) {
            verifyShape(room.map.shapeId, floor.map, roomId);
            if (room.map.entranceShapeId) verifyShape(room.map.entranceShapeId, floor.map, roomId);
          }
        }
      }
    }
  }

  const runtime = buildCampusMapRuntimeData(campuses);
  const exact = new Map<string, Set<string>>();
  const equivalent = new Map<string, Set<string>>();
  for (const binding of bindings) {
    const code = compilePortalCode(binding);
    if (!runtime.roomsById[binding.roomId]) add('missing-room', `Binding ${code} tham chiếu phòng không tồn tại`, binding.roomId);
    if (binding.status === 'verified' && !binding.sourceIds?.length && !binding.note?.trim()) {
      add('missing-verification', `Binding ${code} chưa có nguồn xác minh`, binding.roomId);
    }
    for (const [index, key] of [[exact, code], [equivalent, createEquivalentPortalKey(code)]] as const) {
      const ids = index.get(key) ?? new Set<string>();
      ids.add(binding.roomId);
      index.set(key, ids);
    }
  }
  for (const [code, ids] of exact) if (ids.size > 1) add('exact-collision', `Mã Portal ${code} trỏ tới nhiều phòng`);
  for (const [key, ids] of equivalent) if (ids.size > 1) add('equivalent-collision', `Equivalent key ${key} trỏ tới nhiều phòng`);
  return errors;
}
