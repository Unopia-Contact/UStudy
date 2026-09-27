import type { CampusMapRuntimeData } from '../../../domain/campus-map';
import { createEquivalentPortalKey } from './build-portal-indexes';

type InventoryIndex = {
  rooms: Map<string, string[]>;
  buildings: Array<{ id: string; keys: string[] }>;
};
const cache = new WeakMap<CampusMapRuntimeData, Map<string, InventoryIndex>>();

function key(value: string): string {
  return createEquivalentPortalKey(value).replace(/^(?:PHONG|TOA)\s*/u, '').replace(/^[_:]+|[_:]+$/g, '');
}

/** Index inventory once per immutable runtime, not once per timetable session. */
function inventoryIndex(data: CampusMapRuntimeData, campusId: string): InventoryIndex {
  let campuses = cache.get(data);
  if (!campuses) { campuses = new Map(); cache.set(data, campuses); }
  const existing = campuses.get(campusId);
  if (existing) return existing;
  const index: InventoryIndex = { rooms: new Map(), buildings: [] };
  for (const building of Object.values(data.buildingsById).filter(item => item.campusId === campusId)) {
    index.buildings.push({ id: building.fullId, keys: [...new Set(
      [building.id, building.code, building.name, building.shortName ?? '', ...(building.aliases ?? [])]
        .map(key).filter(Boolean),
    )] });
    for (const floorId of data.floorIdsByBuildingId[building.fullId] ?? []) {
      for (const roomId of data.roomIdsByFloorId[floorId] ?? []) {
        const room = data.roomsById[roomId];
        for (const label of [room.code, room.label, room.name ?? '', ...(room.aliases ?? [])]) {
          const normalized = key(label);
          if (!normalized) continue;
          const ids = index.rooms.get(normalized) ?? [];
          if (!ids.includes(roomId)) ids.push(roomId);
          index.rooms.set(normalized, ids);
        }
      }
    }
  }
  campuses.set(campusId, index);
  return index;
}

/** Syntax supplies tokens; inventory supplies identities. No teaching-unit whitelist. */
export function inventoryRoomCandidates(raw: string, data: CampusMapRuntimeData): string[] {
  const parsed = raw.trim().match(/^(?:P\.)?([^:]+):\s*(.+)$/i);
  if (!parsed) return [];
  const campus = Object.values(data.campusesById).find(item => item && key(item.code) === key(parsed[1]));
  if (!campus) return [];
  const remainder = key(parsed[2]);
  if (!remainder || /[._-]$/.test(remainder)) return [];
  const index = inventoryIndex(data, campus.id);
  // Whole value first, then suffixes at explicit separators only. Never substring match.
  const suffixes = [remainder];
  for (let i = 0; i < remainder.length; i++) {
    if (remainder[i] === '_' || remainder[i] === ':') suffixes.push(remainder.slice(i + 1));
  }
  const contexts = index.buildings.flatMap(building => building.keys.flatMap(token => {
    const boundary = new RegExp(`(?:^|[_:])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[_:]|(?=\\d)|$)`);
    return boundary.test(remainder) ? [{ id: building.id, length: token.length }] : [];
  }));
  const longest = Math.max(0, ...contexts.map(item => item.length));
  const buildingIds = new Set(contexts.filter(item => item.length === longest).map(item => item.id));
  // An explicit compound building identifier must not silently resolve in another
  // building just because its trailing room number happens to be unique.
  if (!buildingIds.size && remainder.split(/[_:]/).slice(0, -1)
    .some(token => /^[A-Z]+\d+[.-]\d+$/.test(token))) return [];
  // Attached building codes (e.g. NDH5.8) are discovered from inventory, not hard-coded.
  for (const building of index.buildings.filter(item => !buildingIds.size || buildingIds.has(item.id))) {
    for (const token of building.keys) {
      if (remainder.startsWith(token)) {
        const suffix = remainder.slice(token.length).replace(/^[_:]+/, '');
        if (/^\d+\.\d+[A-Z]?$/.test(suffix)) suffixes.push(suffix);
      }
    }
  }
  for (const suffix of suffixes) {
    const ids = (index.rooms.get(suffix) ?? []).filter(id => {
      const floor = data.floorsById[data.roomsById[id].floorId];
      return !buildingIds.size || buildingIds.has(floor.buildingId);
    });
    if (ids.length) return ids;
  }
  return [];
}
