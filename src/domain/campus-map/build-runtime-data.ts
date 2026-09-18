import { createBuildingId, createFloorId, createRoomId } from './ids';
import type { Campus, CampusMapRuntimeData } from './types';

export function buildCampusMapRuntimeData(campuses: Campus[]): CampusMapRuntimeData {
  const data: CampusMapRuntimeData = {
    campusesById: {}, buildingsById: {}, floorsById: {}, roomsById: {},
    buildingIdsByCampusId: {}, floorIdsByBuildingId: {}, roomIdsByFloorId: {},
  };
  for (const campus of campuses) {
    data.campusesById[campus.id] = campus;
    data.buildingIdsByCampusId[campus.id] = [];
    for (const building of campus.buildings) {
      const buildingId = createBuildingId(campus.id, building.id);
      data.buildingsById[buildingId] = { ...building, campusId: campus.id, fullId: buildingId };
      data.buildingIdsByCampusId[campus.id]!.push(buildingId);
      data.floorIdsByBuildingId[buildingId] = [];
      for (const floor of building.floors) {
        const floorId = createFloorId(buildingId, floor.id);
        data.floorsById[floorId] = { ...floor, buildingId, fullId: floorId };
        data.floorIdsByBuildingId[buildingId].push(floorId);
        data.roomIdsByFloorId[floorId] = [];
        for (const room of floor.rooms) {
          const roomId = createRoomId(floorId, room.id);
          data.roomsById[roomId] = { ...room, floorId, fullId: roomId };
          data.roomIdsByFloorId[floorId].push(roomId);
        }
      }
    }
  }
  return data;
}
