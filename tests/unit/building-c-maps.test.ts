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

describe('Building C inventory and floor drawings', () => {
  it('declares three mapped floors and 22 rooms', () => {
    expect(runtime.floorIdsByBuildingId['dong-hoa/c']).toEqual(['dong-hoa/c/0', 'dong-hoa/c/1', 'dong-hoa/c/2']);
    expect(['0', '1', '2'].map(id => runtime.roomIdsByFloorId[`dong-hoa/c/${id}`].length)).toEqual([2, 11, 9]);
    expect(runtime.floorsById['dong-hoa/c/0'].level).toBe(-1);
  });
  for (const id of ['0', '1', '2']) {
    it(`links every room on floor ${id} to a unique SVG group and searchable location`, () => {
      const floor = runtime.floorsById[`dong-hoa/c/${id}`];
      const map = floor.map!;
      const svg = readFileSync(resolve('public', map.asset.slice(1)), 'utf8');
      const shapes = Array.from(svg.matchAll(/<g id="(room-[^"]+)"/g), match => match[1]);
      expect(new Set(shapes).size).toBe(shapes.length);
      expect([...shapes].sort()).toEqual([...map.shapeIds!].sort());
      expect(svg).toContain(`viewBox="${map.viewBox.join(' ')}"`);
      for (const room of floor.rooms) {
        const roomId = `dong-hoa/c/${id}/${room.id}`;
        expect(shapes).toContain(room.map!.shapeId);
        expect(searchCampusPlaces(room.label, runtime, 'dong-hoa')[0]).toMatchObject({ roomId, hasRoomShape: true, hasFloorMap: true });
        if (room.code !== 'P209') expect(resolvePortalRoom(`P.cs2:C${room.code}`, runtime, indexes)).toMatchObject({ status: 'matched', roomId });
      }
    });
  }
  it('preserves P209 and does not invent functions for unnamed rooms', () => {
    expect(runtime.roomsById['dong-hoa/c/2/p209']).toMatchObject({ code: 'P209', label: 'P209', map: { shapeId: 'room-p209' } });
    expect(resolvePortalRoom('P.cs2:P209', runtime, indexes).status).toBe('unresolved');
    expect(resolvePortalRoom('P.cs2:C209', runtime, indexes).status).toBe('unresolved');
    for (let code = 201; code <= 207; code++) {
      const room = runtime.roomsById[`dong-hoa/c/2/${code}`];
      expect(room.name).toBeUndefined();
      expect(room.kind).toBe('other');
    }
  });
  it('introduces no invalid floor, shape or binding for building C', () => {
    expect(validateCampusMapData(CAMPUS_MAP_CAMPUSES, PORTAL_ROOM_BINDINGS, FLOOR_MAPS)
      .filter(issue => issue.entityId?.startsWith('dong-hoa/c/'))).toEqual([]);
  });
});
