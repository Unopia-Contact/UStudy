import type { CampusMapRuntimeData, RoomRuntime } from './types';

function searchKey(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function searchMapRooms(query: string, data: CampusMapRuntimeData): RoomRuntime[] {
  const needle = searchKey(query.trim());
  if (!needle) return [];
  return Object.values(data.roomsById).filter((room) => {
    const floor = data.floorsById[room.floorId];
    const building = data.buildingsById[floor.buildingId];
    return [room.code, room.label, room.name ?? '', ...(room.aliases ?? []), building.code, building.name, room.fullId]
      .some((value) => searchKey(value).includes(needle));
  });
}
