import type { FloorId, MapAsset } from '../../../domain/campus-map/types';

// Single source for floor drawings. Keys use campus/building/floor IDs from campuses.ts.
export const FLOOR_MAPS: Partial<Record<FloorId, MapAsset>> = {
  'dong-hoa/d/0': {
    asset: '/maps/floors/dong-hoa/d/basement.svg',
    viewBox: [0, 0, 1200, 250],
    shapeIds: ['room-d001', 'room-d002', 'environmental-technology-lab', 'room-d004', 'room-d005', 'room-d006', 'room-d007'],
  },
  'dong-hoa/d/1': {
    asset: '/maps/floors/dong-hoa/d/floor-1.svg',
    viewBox: [0, 0, 1200, 250],
    shapeIds: ['room-d101', 'room-d102', 'room-d102a' , 'room-d102a', 'room-d103', 'lecturer-room', 'room-d105', 'room-d106', 'room-d107', 'room-d108'],
  },
  'dong-hoa/d/2': {
    asset: '/maps/floors/dong-hoa/d/floor-2.svg',
    viewBox: [0, 0, 1200, 250],
    shapeIds: ['room-d201', 'room-d202', 'room-d203', 'room-d204', 'room-d205', 'room-d206', 'room-d207', 'room-d208', 'room-d209', 'room-d210', 'room-d211', 'room-d212', 'room-d213', 'room-d214'],
  },
  'dong-hoa/e/1': {
    asset: '/maps/floors/dong-hoa/e/floor-1.svg',
    viewBox: [0, 0, 1200, 420],
    shapeIds: ['room-e101', 'room-e102', 'room-e103', 'room-e104', 'room-e105', 'room-e106', 'room-e107'],
  },
  'dong-hoa/e/2': {
    asset: '/maps/floors/dong-hoa/e/floor-2.svg',
    viewBox: [0, 0, 2000, 520],
    shapeIds: ['room-e201', 'room-e202', 'room-e203', 'room-e204', 'room-e205', 'room-e206', 'room-e207', 'room-e208', 'room-e209', 'room-e210', 'room-e211'],
  },
  'dong-hoa/e/3': {
    asset: '/maps/floors/dong-hoa/e/floor-3.svg',
    viewBox: [0, 0, 2200, 430],
    shapeIds: ['room-e301', 'room-e302', 'room-e303', 'room-e304', 'room-e305', 'room-e306', 'room-e307', 'room-e308', 'room-e309', 'room-e310', 'room-e311', 'room-e312'],
  },

  // F
  'dong-hoa/f/1' : {
    asset: '/maps/floors/dong-hoa/f/floor-1.svg',
    viewBox: [0, 0, 1200, 250],
    shapeIds: ['room-f101', 'room-f102', 'room-f103', 'room-f104', 'room-f105', 'room-f106'],
  },
  'dong-hoa/f/2': {
    asset: '/maps/floors/dong-hoa/f/floor-2.svg',
    viewBox: [0, 0, 1200, 250],
    shapeIds: ['room-f201', 'room-f202', 'room-f203', 'room-f204', 'room-f205', 'room-f206'],
  },
  'dong-hoa/f/3': {
    asset: '/maps/floors/dong-hoa/f/floor-3.svg',
    viewBox: [0, 0, 1200, 250],
    shapeIds: ['room-f301', 'room-f302', 'room-f303', 'room-f304', 'room-f305', 'room-f306'],
  },
};
