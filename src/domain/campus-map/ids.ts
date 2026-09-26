import type { CampusId } from '../campus';
import type { BuildingId, FloorId, RoomId } from './types';

export const createBuildingId = (campusId: CampusId, buildingKey: string): BuildingId => `${campusId}/${buildingKey}`;
export const createFloorId = (buildingId: BuildingId, floorKey: string): FloorId => `${buildingId}/${floorKey}`;
export const createRoomId = (floorId: FloorId, roomKey: string): RoomId => `${floorId}/${roomKey}`;
