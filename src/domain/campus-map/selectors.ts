import type { BuildingId, CampusId, CampusMapRuntimeData, FloorId, RoomId, RoomRuntime } from './types';

function searchKey(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export type CampusPlaceSearchResult = {
  key: string;
  type: 'room' | 'floor' | 'building';
  label: string;
  context: string;
  campusId: CampusId;
  buildingId: BuildingId;
  floorId?: FloorId;
  roomId?: RoomId;
  hasFloorMap: boolean;
  hasRoomShape: boolean;
  score: number;
};

function editDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previous = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const current = row[rightIndex];
      row[rightIndex] = Math.min(row[rightIndex] + 1, row[rightIndex - 1] + 1,
        previous + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

function matchScore(needle: string, rawValues: string[]): number {
  let best = 0;
  for (const [index, rawValue] of rawValues.entries()) {
    const value = searchKey(rawValue);
    if (!value) continue;
    const priority = Math.max(0, 12 - index);
    if (value === needle) best = Math.max(best, 120 + priority);
    else if (value.startsWith(needle)) best = Math.max(best, 90 + priority);
    else if (value.includes(needle)) best = Math.max(best, 62 + priority);
    else if (needle.length >= 4 && value.length <= 32) {
      const distance = editDistance(needle, value);
      const tolerance = needle.length >= 8 ? 2 : 1;
      if (distance <= tolerance) best = Math.max(best, 34 - distance + priority);
    }
  }
  return best;
}

export function createRoomSearchResult(roomId: RoomId, data: CampusMapRuntimeData, score = 0): CampusPlaceSearchResult | undefined {
  const room = data.roomsById[roomId];
  if (!room) return undefined;
  const floor = data.floorsById[room.floorId];
  const building = data.buildingsById[floor.buildingId];
  const campus = data.campusesById[building.campusId];
  return {
    key: `room:${room.fullId}`, type: 'room', label: room.label,
    context: `${campus?.shortName ?? building.campusId} · ${building.name} · ${floor.label}`,
    campusId: building.campusId, buildingId: building.fullId, floorId: floor.fullId, roomId: room.fullId,
    hasFloorMap: Boolean(floor.map), hasRoomShape: Boolean(room.map?.shapeId), score,
  };
}

export function searchCampusPlaces(query: string, data: CampusMapRuntimeData, preferredCampusId?: CampusId): CampusPlaceSearchResult[] {
  const needle = searchKey(query.trim());
  if (!needle) return [];
  const results: CampusPlaceSearchResult[] = [];

  for (const building of Object.values(data.buildingsById)) {
    const campus = data.campusesById[building.campusId];
    const campusBoost = building.campusId === preferredCampusId ? 8 : 0;
    const buildingScore = matchScore(needle, [building.code, building.name, ...(building.aliases ?? []), building.fullId]);
    if (buildingScore) results.push({
      key: `building:${building.fullId}`, type: 'building', label: building.name,
      context: campus?.name ?? building.campusId, campusId: building.campusId, buildingId: building.fullId,
      hasFloorMap: false, hasRoomShape: false, score: buildingScore + campusBoost,
    });
    for (const floorId of data.floorIdsByBuildingId[building.fullId] ?? []) {
      const floor = data.floorsById[floorId];
      const floorScore = matchScore(needle, [`${building.code} ${floor.label}`, `${building.name} ${floor.label}`, floor.fullId]);
      if (floorScore) results.push({
        key: `floor:${floor.fullId}`, type: 'floor', label: `${building.name} · ${floor.label}`,
        context: campus?.name ?? building.campusId, campusId: building.campusId, buildingId: building.fullId,
        floorId: floor.fullId, hasFloorMap: Boolean(floor.map), hasRoomShape: false, score: floorScore + campusBoost,
      });
    }
  }

  for (const room of Object.values(data.roomsById)) {
    const floor = data.floorsById[room.floorId];
    const building = data.buildingsById[floor.buildingId];
    const score = matchScore(needle, [room.code, room.label, room.name ?? '', ...(room.aliases ?? []),
      `${building.code}${room.code}`, `${building.name} ${room.label}`, room.fullId]);
    if (!score) continue;
    const result = createRoomSearchResult(room.fullId, data, score + (building.campusId === preferredCampusId ? 8 : 0));
    if (result) results.push(result);
  }

  return results.sort((left, right) => right.score - left.score || left.label.localeCompare(right.label, 'vi'));
}

export function searchMapRooms(query: string, data: CampusMapRuntimeData): RoomRuntime[] {
  return searchCampusPlaces(query, data)
    .filter((result): result is CampusPlaceSearchResult & { roomId: RoomId } => result.type === 'room' && Boolean(result.roomId))
    .map((result) => data.roomsById[result.roomId]);
}
