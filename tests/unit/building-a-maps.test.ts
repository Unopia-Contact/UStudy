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
const floors = ['0', '1', '2', '3'];

describe('Building A floor drawings and inventory', () => {
  it('declares exactly four mapped floors and forty physical rooms', () => {
    expect(runtime.floorIdsByBuildingId['dong-hoa/a']).toEqual(floors.map(id => `dong-hoa/a/${id}`));
    expect(floors.map(id => runtime.roomIdsByFloorId[`dong-hoa/a/${id}`].length)).toEqual([4, 11, 14, 11]);
    expect(runtime.floorsById['dong-hoa/a/0'].label).toBe('Tầng hầm');
    expect(runtime.floorsById['dong-hoa/a/0'].level).toBe(-1);
  });

  for (const id of floors) {
    it(`links every room on floor ${id} to a real unique SVG group, search result and Portal resolution`, () => {
      const floor = runtime.floorsById[`dong-hoa/a/${id}`];
      const drawing = floor.map!;
      const svg = readFileSync(resolve('public', drawing.asset.slice(1)), 'utf8');
      const shapeIds = Array.from(svg.matchAll(/<g id="(room-a[^"]+)"/g), match => match[1]);
      expect(new Set(shapeIds).size).toBe(shapeIds.length);
      expect([...shapeIds].sort()).toEqual([...drawing.shapeIds!].sort());
      expect(svg).toContain(`viewBox="${drawing.viewBox.join(' ')}"`);

      for (const room of floor.rooms) {
        expect(shapeIds).toContain(room.map!.shapeId);
        // Named groups wrap both the room geometry and its labels for highlighting.
        expect(svg).toMatch(new RegExp(`<g id="${room.map!.shapeId}"><title>`));
        const roomId = `dong-hoa/a/${id}/${room.id}`;
        expect(searchCampusPlaces(`A${room.code}`, runtime, 'dong-hoa')[0]).toMatchObject({
          roomId, hasFloorMap: true, hasRoomShape: true,
        });
        expect(resolvePortalRoom(`P.cs2:A${room.code}`, runtime, indexes)).toMatchObject({
          status: 'matched', roomId, matchedBy: 'structural',
        });
      }
    });
  }

  it('does not introduce invalid floors, shapes or Portal bindings for building A', () => {
    const issues = validateCampusMapData(CAMPUS_MAP_CAMPUSES, PORTAL_ROOM_BINDINGS, FLOOR_MAPS);
    expect(issues.filter(issue => issue.entityId?.startsWith('dong-hoa/a/'))).toEqual([]);
  });
});
