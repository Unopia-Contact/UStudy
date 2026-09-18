import type { CampusId } from '../campus';

export type { CampusId };
export type BuildingId = string;
export type FloorId = string;
export type RoomId = string;
export type PlaceStatus = 'active' | 'historical' | 'unknown';
export type VerificationStatus = 'confirmed' | 'observed' | 'inferred' | 'disputed';

export interface VerificationMetadata {
  status: VerificationStatus;
  sourceIds: string[];
  lastVerifiedAt?: string;
  note?: string;
}

export interface MapAsset {
  asset: string;
  viewBox: [number, number, number, number];
  /** IDs present in the asset. Keep this list in sync when replacing the SVG. */
  shapeIds?: string[];
}

export interface Room {
  id: string;
  code: string;
  label: string;
  name?: string;
  kind: 'classroom' | 'computer-lab' | 'laboratory' | 'office' | 'auditorium' | 'sports-zone' | 'service' | 'other';
  aliases?: string[];
  status: PlaceStatus;
  verification?: VerificationMetadata;
  map?: { shapeId: string; entranceShapeId?: string };
  navigation?: { instruction?: string; landmarks?: string[]; accessible?: boolean };
}

export interface Floor {
  id: string;
  label: string;
  level?: number;
  sortOrder: number;
  rooms: Room[];
}

export interface Building {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  kind: 'academic' | 'administration' | 'laboratory' | 'sports' | 'service' | 'other';
  aliases?: string[];
  status: PlaceStatus;
  verification?: VerificationMetadata;
  map?: { shapeId: string; labelPosition?: { x: number; y: number } };
  floors: Floor[];
}

export interface Campus {
  id: CampusId;
  code: string;
  name: string;
  shortName: string;
  status: 'active' | 'historical';
  map?: MapAsset;
  buildings: Building[];
}

export interface BuildingRuntime extends Building { campusId: CampusId; fullId: BuildingId }
export interface FloorRuntime extends Floor { buildingId: BuildingId; fullId: FloorId; map?: MapAsset }
export interface RoomRuntime extends Room { floorId: FloorId; fullId: RoomId }

export interface CampusMapRuntimeData {
  campusesById: Partial<Record<CampusId, Campus>>;
  buildingsById: Record<BuildingId, BuildingRuntime>;
  floorsById: Record<FloorId, FloorRuntime>;
  roomsById: Record<RoomId, RoomRuntime>;
  buildingIdsByCampusId: Partial<Record<CampusId, BuildingId[]>>;
  floorIdsByBuildingId: Record<BuildingId, FloorId[]>;
  roomIdsByFloorId: Record<FloorId, RoomId[]>;
}
