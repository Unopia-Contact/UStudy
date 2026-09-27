import type { CampusMapRuntimeData } from '../../../domain/campus-map';
import { createEquivalentPortalKey } from './build-portal-indexes';
import { inventoryRoomCandidates } from './inventory-room-index';
import type { PortalRoomIndexes, PortalRoomResolution } from './types';

function classify(rawPortalCode: string, ids: string[], matchedBy: 'exact' | 'equivalent' | 'structural'): PortalRoomResolution {
  if (ids.length === 1) return {
    status: 'matched', roomId: ids[0], rawPortalCode, matchedBy,
    confidence: matchedBy === 'exact' ? 'exact' : matchedBy === 'equivalent' ? 'strong' : 'weak',
  };
  return { status: 'ambiguous', candidates: ids, rawPortalCode };
}

export function resolvePortalRoom(rawPortalCode: string, data: CampusMapRuntimeData, indexes: PortalRoomIndexes): PortalRoomResolution {
  const code = rawPortalCode.trim();
  const exact = indexes.exact.get(code) ?? [];
  if (exact.length) return exact.every((id) => data.roomsById[id])
    ? classify(code, exact, 'exact') : { status: 'unresolved', rawPortalCode: code };
  const equivalent = indexes.equivalent.get(createEquivalentPortalKey(code)) ?? [];
  if (equivalent.length) return equivalent.every((id) => data.roomsById[id])
    ? classify(code, equivalent, 'equivalent') : { status: 'unresolved', rawPortalCode: code };
  const structural = inventoryRoomCandidates(code, data);
  return structural.length ? classify(code, structural, 'structural') : { status: 'unresolved', rawPortalCode: code };
}
