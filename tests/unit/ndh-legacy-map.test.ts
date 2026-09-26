import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAMPUS_MAP_CAMPUSES } from '../../src/assets/data/campus-map/campuses';
import { FLOOR_MAPS } from '../../src/assets/data/campus-map/floor-maps';
import { buildCampusMapRuntimeData } from '../../src/domain/campus-map/build-runtime-data';
import { searchCampusPlaces } from '../../src/domain/campus-map/selectors';
import { PORTAL_ROOM_BINDINGS } from '../../src/integrations/hcmus-portal/rooms/bindings';
import { buildPortalRoomIndexes } from '../../src/integrations/hcmus-portal/rooms/build-portal-indexes';
import { resolvePortalRoom } from '../../src/integrations/hcmus-portal/rooms/resolve-portal-room';

const runtime = buildCampusMapRuntimeData(CAMPUS_MAP_CAMPUSES, FLOOR_MAPS);
const svg = readFileSync(resolve('public/maps/floors/dong-hoa/ndh/floor-1.svg'), 'utf8');

describe('Restored legacy NDH drawing', () => {
  it('keeps B, B4.2 and NDH floor drawings unpublished', () => {
    for (const buildingId of ['b', 'b4-2', 'ndh']) {
      const floors = runtime.floorIdsByBuildingId[`dong-hoa/${buildingId}`];
      expect(floors.length).toBeGreaterThan(0);
      for (const floorId of floors) expect(runtime.floorsById[floorId].map).toBeUndefined();
    }
    expect(svg).toContain('viewBox="0 0 950 530"');
    // InlineFloorSvg inserts only root.innerHTML: preserve the crop origin explicitly.
    expect(svg).toContain('transform="translate(-25 -450)"');
    expect(runtime.floorsById['dong-hoa/ndh/2'].map).toBeUndefined();
  });
  it('keeps all 22 old shapes while making stairs and WC IDs unique', () => {
    const ids = Array.from(svg.matchAll(/\bid="([^"]+)"/g), match => match[1]);
    expect(ids).toHaveLength(22);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter(id => /^room-ndh1-[1-9]$/.test(id))).toHaveLength(9);
    expect(svg).not.toMatch(/NĐH 10[1-9]/);
    expect(svg).toContain('M 40 960 V 540 H 380 V 490 H 620 V 540 H 960 V 960 Z');
    expect(svg).toContain('x="740" y="550" width="130" height="150"');
  });
  it('records provenance and links all nine rooms using user-confirmed dotted codes', () => {
    expect(svg).toContain('3b252a72997c134db1415f2d94d9018c840c8709');
    expect(svg).toContain('Người dùng xác nhận');
    const floor = runtime.floorsById['dong-hoa/ndh/1'];
    expect(floor.rooms).toHaveLength(9);
    for (let i = 1; i <= 9; i++) {
      const room = runtime.roomsById[`dong-hoa/ndh/1/${i}`];
      expect(room).toMatchObject({ id: String(i), code: `1.${i}` });
      expect(runtime.floorsById[room.floorId].map).toBeUndefined();
      expect(room.map).toBeUndefined();
      expect(svg).toContain(`<g id="room-ndh1-${i}"><title>NĐH 1.${i}</title>`);
    }
  });
  it('resolves and searches standard NĐH 1.1–1.9 codes without publishing the archived drawing', () => {
    const indexes = buildPortalRoomIndexes(PORTAL_ROOM_BINDINGS);
    for (let i = 1; i <= 9; i++) {
      const roomId = `dong-hoa/ndh/1/${i}`;
      expect(searchCampusPlaces(`NĐH 1.${i}`, runtime, 'dong-hoa')[0]).toMatchObject({ roomId, hasRoomShape: false, hasFloorMap: false });
      expect(resolvePortalRoom(`P.cs2:NĐH1.${i}`, runtime, indexes)).toMatchObject({ status: 'matched', roomId });
    }
  });
});
