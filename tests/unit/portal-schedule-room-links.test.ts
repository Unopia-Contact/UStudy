import { describe, expect, it } from 'vitest';
import { portalScheduleSamples } from '../fixtures/portal-schedule-samples';
import { CAMPUS_MAP_DATA } from '../../src/domain/campus-map';
import { ScheduleLogic } from '../../src/features/visual-schedule/services/schedule-logic';
import { resolveScheduleMapLocation } from '../../src/features/campus-map/services/resolve-schedule-location';

describe('Portal schedule fixture room links', () => {
  it('checks every parsed entry and reports unresolved locations separately', () => {
    let entries = 0;
    let linked = 0;
    let maps = 0;
    let shapes = 0;
    const unmatched = new Map<string, number>();
    const links = new Map<string, string>();
    for (const sample of portalScheduleSamples) {
      const parsed = ScheduleLogic.parseScheduleString(sample);
      expect(parsed.length, sample).toBeGreaterThan(0);
      for (const entry of parsed) {
        entries++;
        const result = resolveScheduleMapLocation(entry);
        const code = entry.portalLocationCode ?? '(missing location)';
        if (result.status === 'unavailable') {
          unmatched.set(code, (unmatched.get(code) ?? 0) + 1);
          continue;
        }
        linked++;
        if (result.floorMapAvailable) maps++;
        if (result.roomShapeAvailable) shapes++;
        links.set(code, result.room.fullId);
        expect(CAMPUS_MAP_DATA.roomsById[result.room.fullId]).toBe(result.room);
        expect(result.room.floorId).toBe(result.floor.fullId);
        expect(result.floor.buildingId).toBe(result.building.fullId);
        expect(result.building.campusId).toBe(result.campus.id);
        // Independent source-code expectations, not merely resolver self-consistency.
        const standard = code.match(/^P\.cs2:([A-G])(\d{3})$/i);
        if (standard) {
          expect(result.campus.id).toBe('dong-hoa');
          expect(result.building.id).toBe(standard[1].toLowerCase());
          expect(result.floor.id).toBe(String(Number(standard[2][0])));
          expect([result.room.code, result.room.label]).toContain(`${standard[1].toUpperCase()}${standard[2]}`);
        }
        const ndh = code.match(/^P\.cs2:N[ĐD]H(\d+)\.(\d+)$/i);
        if (ndh) {
          expect(result.room.fullId).toBe(`dong-hoa/ndh/${ndh[1]}/${ndh[2]}`);
          expect(result.floorMapAvailable).toBe(false);
        }
        if (/^P\.cs2:NTĐ_KHTN\d+$/i.test(code)) {
          expect(result.room.fullId).toBe('dong-hoa/ntd/1/ntd_khtn');
        }
        if (code === 'P.cs2:NDH. 5.8') expect(result.room.fullId).toBe('dong-hoa/ndh/5/8');
      }
    }
    process.stdout.write(JSON.stringify({ samples: portalScheduleSamples.length, entries, linked, maps, shapes, uniqueLinked: links.size, unmatched: Object.fromEntries(unmatched), links: Object.fromEntries(links) }, null, 2) + '\n');
    expect(entries).toBe(439);
    expect(linked).toBe(375);
    expect(links.size).toBe(71);
    expect([...unmatched.keys()]).toEqual([
      'P.cs2:D109', 'P.cs2:TT_TDTT1', 'P.cs2:TNSDC1_A306',
      'P.cs2:TNHDC_A110', 'P.cs2:TNHDC_A107', 'P.cs2:TNHDC_A108', 'P.cs2:TNHDC_A109',
      'P.cs2:PMT_B4-2_5.', 'P.cs2:PMT_B4-2_6.', 'P.cs2:TNL_A211', 'P.cs2:TNL_A213',
    ]);
  });
});
