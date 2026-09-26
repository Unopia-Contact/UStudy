import type { RoomId } from '../../../domain/campus-map';

export interface PortalRoomBinding {
  roomId: RoomId;
  components: { campusCode: string; buildingCode?: string; roomCode: string };
  exactCodeOverride?: string;
  status: 'verified' | 'inferred' | 'historical';
  sourceIds?: string[];
  note?: string;
}

export interface PortalRoomResolution {
  status: 'matched' | 'ambiguous' | 'unresolved';
  roomId?: RoomId;
  candidates?: RoomId[];
  rawPortalCode: string;
  matchedBy?: 'exact' | 'equivalent' | 'structural';
  confidence?: 'exact' | 'strong' | 'weak';
}

export interface PortalRoomIndexes {
  exact: Map<string, RoomId[]>;
  equivalent: Map<string, RoomId[]>;
  knownPrefixes: Array<{ campusCode: string; prefix: string; buildingId: string }>;
}
