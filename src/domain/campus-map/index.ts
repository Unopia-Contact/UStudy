import { CAMPUS_MAP_CAMPUSES } from '../../assets/data/campus-map/campuses';
import { buildCampusMapRuntimeData } from './build-runtime-data';

export const CAMPUS_MAP_DATA = buildCampusMapRuntimeData(CAMPUS_MAP_CAMPUSES);
export * from './ids';
export * from './selectors';
export * from './types';
export * from './validate-campus-data';
