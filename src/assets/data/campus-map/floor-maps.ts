import type { FloorId, MapAsset } from '../../../domain/campus-map/types';

// Single source for floor drawings. Keys use campus/building/floor IDs from campuses.ts.
// Example: 'dong-hoa/b4-2/6': { asset: '/maps/floors/b4-2-6.svg', viewBox: [0, 0, 1200, 800], shapeIds: ['room-6-2'] }
export const FLOOR_MAPS: Partial<Record<FloorId, MapAsset>> = {};
