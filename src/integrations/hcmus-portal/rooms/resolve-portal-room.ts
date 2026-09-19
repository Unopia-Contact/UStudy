import type { CampusMapRuntimeData } from '../../../domain/campus-map';
import { createEquivalentPortalKey } from './build-portal-indexes';
import type { PortalRoomIndexes, PortalRoomResolution } from './types';

function classify(rawPortalCode: string, ids: string[], matchedBy: 'exact' | 'equivalent' | 'structural'): PortalRoomResolution {
  if (ids.length === 1) return {
    status: 'matched', roomId: ids[0], rawPortalCode, matchedBy,
    confidence: matchedBy === 'exact' ? 'exact' : matchedBy === 'equivalent' ? 'strong' : 'weak',
  };
  return { status: 'ambiguous', candidates: ids, rawPortalCode };
}

function findRoomsOnFloor(data: CampusMapRuntimeData, floorId: string, codes: string[]): string[] {
  const normalizedCodes = new Set(codes.map(createEquivalentPortalKey));
  return (data.roomIdsByFloorId[floorId] ?? []).filter((roomId) => {
    const room = data.roomsById[roomId];
    return [room.code, room.label, room.name ?? '', ...(room.aliases ?? [])]
      .some((value) => normalizedCodes.has(createEquivalentPortalKey(value)));
  });
}

function structuralCandidates(code: string, data: CampusMapRuntimeData, indexes: PortalRoomIndexes): string[] {
  const match = code.match(/^P\.(cs[12]):(.+)$/i);
  if (!match) return [];
  const campusId = match[1].toLowerCase() === 'cs2' ? 'dong-hoa' : 'cho-quan';
  const remainder = match[2].trim();
  const candidates = new Set<string>();

  // Known compound prefixes must win over single-letter room codes.
  for (const item of indexes.knownPrefixes) {
    if (createEquivalentPortalKey(item.campusCode) !== createEquivalentPortalKey(`${code.slice(0, code.indexOf(':') + 1)}`)) continue;
    if (!createEquivalentPortalKey(remainder).startsWith(createEquivalentPortalKey(item.prefix))) continue;
    const suffix = remainder.slice(item.prefix.length);
    const dotted = suffix.match(/^(\d+)\.(\d+[A-Z]?)$/i);
    const numeric = suffix.match(/^(\d)(\d{2}[A-Z]?)$/i);
    const floor = dotted?.[1] ?? numeric?.[1];
    const room = dotted?.[2] ?? numeric?.[2];
    if (floor && room) {
      findRoomsOnFloor(data, `${item.buildingId}/${floor}`, [suffix, room]).forEach((roomId) => candidates.add(roomId));
    }
  }
  if (candidates.size > 0) return [...candidates];

  const standard = remainder.match(/^([A-G])(\d)(\d{2}[A-Z]?)$/i);
  if (standard) {
    const floorId = `${campusId}/${standard[1].toLowerCase()}/${standard[2]}`;
    findRoomsOnFloor(data, floorId, [remainder, `${standard[2]}${standard[3]}`, standard[3]])
      .forEach((roomId) => candidates.add(roomId));
  }
  const ndh = remainder.match(/^(?:NĐH|NDH)\.?\s*(\d+)\.(\d+[A-Z]?)$/i);
  if (ndh) {
    findRoomsOnFloor(data, `${campusId}/ndh/${ndh[1]}`, [remainder, `${ndh[1]}.${ndh[2]}`, ndh[2]])
      .forEach((roomId) => candidates.add(roomId));
  }
  return [...candidates];
}

export function resolvePortalRoom(rawPortalCode: string, data: CampusMapRuntimeData, indexes: PortalRoomIndexes): PortalRoomResolution {
  const code = rawPortalCode.trim();
  const exact = indexes.exact.get(code) ?? [];
  if (exact.length) return exact.every((id) => data.roomsById[id])
    ? classify(code, exact, 'exact') : { status: 'unresolved', rawPortalCode: code };
  const equivalent = indexes.equivalent.get(createEquivalentPortalKey(code)) ?? [];
  if (equivalent.length) return equivalent.every((id) => data.roomsById[id])
    ? classify(code, equivalent, 'equivalent') : { status: 'unresolved', rawPortalCode: code };
  const structural = structuralCandidates(code, data, indexes);
  return structural.length ? classify(code, structural, 'structural') : { status: 'unresolved', rawPortalCode: code };
}
