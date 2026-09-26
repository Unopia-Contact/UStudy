import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAMPUS_MAP_CAMPUSES } from '../../src/assets/data/campus-map/campuses';
import { FLOOR_MAPS } from '../../src/assets/data/campus-map/floor-maps';
import { buildCampusMapRuntimeData } from '../../src/domain/campus-map/build-runtime-data';
import { searchCampusPlaces } from '../../src/domain/campus-map/selectors';
import { validateCampusMapData } from '../../src/domain/campus-map/validate-campus-data';
import { PORTAL_ROOM_BINDINGS } from '../../src/integrations/hcmus-portal/rooms/bindings';
import { buildPortalRoomIndexes } from '../../src/integrations/hcmus-portal/rooms/build-portal-indexes';
import { resolvePortalRoom } from '../../src/integrations/hcmus-portal/rooms/resolve-portal-room';

const runtime = buildCampusMapRuntimeData(CAMPUS_MAP_CAMPUSES, FLOOR_MAPS);
const indexes = buildPortalRoomIndexes(PORTAL_ROOM_BINDINGS);
const floors = ['0', '1', '2', '3', '4', '5'];

describe('Building G inventory and floor drawings', () => {
  it('declares six mapped floors and 36 rooms', () => {
    expect(runtime.floorIdsByBuildingId['dong-hoa/g']).toEqual(floors.map(id => `dong-hoa/g/${id}`));
    expect(floors.map(id => runtime.roomIdsByFloorId[`dong-hoa/g/${id}`].length)).toEqual([4, 8, 6, 6, 6, 6]);
    expect(runtime.floorsById['dong-hoa/g/0'].level).toBe(-1);
    expect(searchCampusPlaces('Nhà G', runtime, 'dong-hoa')[0]).toMatchObject({ type: 'building', buildingId: 'dong-hoa/g' });
  });
  for (const id of floors) {
    it(`links every room on floor ${id} to a real SVG group, search result and standard Portal code`, () => {
      const floor = runtime.floorsById[`dong-hoa/g/${id}`];
      const map = floor.map!;
      const svg = readFileSync(resolve('public', map.asset.slice(1)), 'utf8');
      const shapes = Array.from(svg.matchAll(/<g id="(room-[^"]+)"/g), match => match[1]);
      expect(new Set(shapes).size).toBe(shapes.length);
      expect([...shapes].sort()).toEqual([...map.shapeIds!].sort());
      expect(svg).toContain(`viewBox="${map.viewBox.join(' ')}"`);
      for (const room of floor.rooms) {
        const roomId = `dong-hoa/g/${id}/${room.id}`;
        expect(shapes).toContain(room.map!.shapeId);
        expect(svg).toMatch(new RegExp(`<g id="${room.map!.shapeId}"><title>`));
        expect(searchCampusPlaces(room.label, runtime, 'dong-hoa')[0]).toMatchObject({ roomId, hasRoomShape: true, hasFloorMap: true });
        expect(resolvePortalRoom(`P.cs2:G${room.code}`, runtime, indexes)).toMatchObject({ status: 'matched', roomId, matchedBy: 'structural' });
      }
    });
  }
  it('does not invent names or functions for unlabeled rooms', () => {
    for (const [floor, code] of [['4', '403'], ['4', '404'], ['5', '503'], ['5', '504']]) {
      const room = runtime.roomsById[`dong-hoa/g/${floor}/${code}`];
      expect(room.name).toBeUndefined();
      expect(room.kind).toBe('other');
    }
  });
  it('introduces no invalid floor, shape or Portal binding for building G', () => {
    expect(validateCampusMapData(CAMPUS_MAP_CAMPUSES, PORTAL_ROOM_BINDINGS, FLOOR_MAPS)
      .filter(issue => issue.entityId?.startsWith('dong-hoa/g/'))).toEqual([]);
  });
});
