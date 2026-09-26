import { CAMPUS_MAP_CAMPUSES } from '../../assets/data/campus-map/campuses';
import { FLOOR_MAPS } from '../../assets/data/campus-map/floor-maps';
import { buildCampusMapRuntimeData } from './build-runtime-data';

export const CAMPUS_MAP_DATA = buildCampusMapRuntimeData(CAMPUS_MAP_CAMPUSES, FLOOR_MAPS);
export * from './ids';
export * from './selectors';
export * from './types';
export * from './validate-campus-data';
