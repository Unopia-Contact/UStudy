import { describe, expect, it } from 'vitest';
import { CAMPUS_MAP_CAMPUSES } from '../../src/assets/data/campus-map/campuses';
import { buildCampusMapRuntimeData } from '../../src/domain/campus-map/build-runtime-data';
import { validateCampusMapData } from '../../src/domain/campus-map/validate-campus-data';
import { PORTAL_ROOM_BINDINGS } from '../../src/integrations/hcmus-portal/rooms/bindings';
import { buildPortalRoomIndexes, createEquivalentPortalKey } from '../../src/integrations/hcmus-portal/rooms/build-portal-indexes';
import { extractPortalLocationCode } from '../../src/integrations/hcmus-portal/rooms/extract-portal-location';
import { resolvePortalRoom } from '../../src/integrations/hcmus-portal/rooms/resolve-portal-room';
import { ScheduleLogic } from '../../src/features/visual-schedule/services/schedule-logic';
import type { Campus } from '../../src/domain/campus-map/types';
import { FLOOR_MAPS } from '../../src/assets/data/campus-map/floor-maps';
import { zoomMapBox } from '../../src/features/campus-map/MapViewport';

const data = buildCampusMapRuntimeData(CAMPUS_MAP_CAMPUSES);
const indexes = buildPortalRoomIndexes(PORTAL_ROOM_BINDINGS);

describe('Campus Map / Portal integration', () => {
  it('only indexes buildings and floors declared in campuses.ts', () => {
    expect(data.buildingIdsByCampusId['dong-hoa']).toEqual(CAMPUS_MAP_CAMPUSES[0].buildings.map((building) => `dong-hoa/${building.id}`));
    expect(data.buildingsById['dong-hoa/f']).toBeUndefined();
    expect(data.floorIdsByBuildingId['dong-hoa/ndh']).toHaveLength(CAMPUS_MAP_CAMPUSES[0].buildings.find((building) => building.id === 'ndh')?.floors.length);
  });

  it('attaches floor drawings only from floor-maps.ts', () => {
    const floorId = 'dong-hoa/b4-2/6';
    const asset = { asset: '/maps/floors/b4-2-6.svg', viewBox: [0, 0, 100, 80] as [number, number, number, number], shapeIds: ['room-6-2'] };
    const withMap = buildCampusMapRuntimeData(CAMPUS_MAP_CAMPUSES, { [floorId]: asset });
    expect(withMap.floorsById[floorId].map).toEqual(asset);
    expect(data.floorsById[floorId].map).toEqual(FLOOR_MAPS[floorId]);
  });

  it('zooms around a point while staying inside the map bounds', () => {
    const base = { x: 0, y: 0, width: 1000, height: 720 };
    expect(zoomMapBox(base, 0.5, 500, 360, base)).toEqual({ x: 250, y: 180, width: 500, height: 360 });
    expect(zoomMapBox(base, 0.5, 0, 0, base)).toEqual({ x: 0, y: 0, width: 500, height: 360 });
    expect(zoomMapBox(base, 2, 500, 360, base)).toEqual(base);
  });
  it('maps the corrected PM_B4-2_6.2 Portal code to UStudy room ID', () => {
    expect(resolvePortalRoom('P.cs2:PM_B4-2_6.2', data, indexes)).toMatchObject({
      status: 'matched', roomId: 'dong-hoa/b4-2/6/2', matchedBy: 'exact', confidence: 'exact',
    });
    expect(resolvePortalRoom('P.cs2:PMT_B4-2_6.2', data, indexes).status).toBe('unresolved');
  });

  it('maps every NTĐ_KHTN Portal code to the one physical sports-hall room', () => {
    for (const suffix of Array.from({ length: 10 }, (_, index) => index + 1)) {
      expect(resolvePortalRoom(`P.cs2:NTĐ_KHTN${suffix}`, data, indexes)).toMatchObject({
        status: 'matched',
        roomId: 'dong-hoa/ntd/1/ntd_khtn',
        matchedBy: 'exact',
        confidence: 'exact',
      });
    }
  });

  it('keeps the full Portal code when extracting from a schedule entry', () => {
    expect(extractPortalLocationCode('T3(6-7.5)-P.cs2:PM_B4-2_6.2')).toBe('P.cs2:PM_B4-2_6.2');
    expect(extractPortalLocationCode('TCN(1-5)-P.Link TKB')).toBe('P.Link TKB');
    expect(extractPortalLocationCode('T3(6-10)')).toBeNull();
    expect(ScheduleLogic.parseScheduleString('T3(6-10); T6(6-10)-P.cs2:PM_B4-2_6.2')
      .map((entry) => entry.portalLocationCode)).toEqual(['P.cs2:PM_B4-2_6.2', 'P.cs2:PM_B4-2_6.2']);
  });

  it('never invents a room absent from physical inventory', () => {
    expect(resolvePortalRoom('P.cs2:D207', data, indexes).status).toBe('unresolved');
    expect(resolvePortalRoom('P.cs2:TNHDC_A107', data, indexes).status).toBe('unresolved');
    expect(resolvePortalRoom('P.cs2:PM_B4-2_6.3', data, indexes).status).toBe('unresolved');
  });

  it('only accepts structural fallback when that room exists', () => {
    const structural = buildCampusMapRuntimeData([{
      ...CAMPUS_MAP_CAMPUSES[0], buildings: [{
        id: 'd', code: 'D', name: 'Tòa D', kind: 'academic', status: 'active',
        floors: [{ id: '2', label: 'Tầng 2', sortOrder: 2, rooms: [
          { id: '07', code: '207', label: 'D207', kind: 'classroom', status: 'active' },
        ] }],
      }],
    }]);
    expect(resolvePortalRoom('P.cs2:D207', structural, indexes)).toMatchObject({
      status: 'matched', roomId: 'dong-hoa/d/2/07', matchedBy: 'structural', confidence: 'weak',
    });
  });

  it('returns ambiguous rather than selecting between conflicting bindings', () => {
    const custom = buildPortalRoomIndexes([
      ...PORTAL_ROOM_BINDINGS,
      { roomId: 'cho-quan/a/1/01', components: { campusCode: 'P.cs2:', roomCode: 'PM_B4-2_6.2' }, status: 'inferred' },
    ]);
    const extended = buildCampusMapRuntimeData([...CAMPUS_MAP_CAMPUSES.slice(0, 1), {
      ...CAMPUS_MAP_CAMPUSES[1], buildings: [{
        id: 'a', code: 'A', name: 'Tòa A', kind: 'academic', status: 'active',
        floors: [{ id: '1', label: 'Tầng 1', sortOrder: 1, rooms: [
          { id: '01', code: '101', label: 'A101', kind: 'classroom', status: 'active' },
        ] }],
      }],
    }]);
    expect(resolvePortalRoom('P.cs2:PM_B4-2_6.2', extended, custom)).toMatchObject({ status: 'ambiguous' });
    expect(resolvePortalRoom('P.cs2:PM_B4-2_6.2', data, custom).status).toBe('unresolved');
  });

  it('normalizes harmless Portal variants without changing source data', () => {
    expect(createEquivalentPortalKey('P.cs2:NĐH5.8')).toBe(createEquivalentPortalKey('P.cs2:NDH. 5.8'));
  });

  it('validates inventory and bindings', () => {
    expect(validateCampusMapData(CAMPUS_MAP_CAMPUSES, PORTAL_ROOM_BINDINGS)).toEqual([]);
    const duplicate: Campus[] = [CAMPUS_MAP_CAMPUSES[0], CAMPUS_MAP_CAMPUSES[0]];
    expect(validateCampusMapData(duplicate, PORTAL_ROOM_BINDINGS).some((error) => error.code === 'duplicate-id')).toBe(true);
    expect(validateCampusMapData(CAMPUS_MAP_CAMPUSES, [{
      roomId: 'dong-hoa/d/2/07', components: { campusCode: 'P.cs2:', roomCode: 'D207' }, status: 'verified',
    }]).map((error) => error.code)).toEqual(expect.arrayContaining(['missing-room', 'missing-verification']));
  });
});
