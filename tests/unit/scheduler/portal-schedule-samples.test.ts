import { describe, expect, it } from 'vitest';

import { ScheduleLogic } from '../../../src/features/visual-schedule/services/schedule-logic';
import { ScheduleLogic as LegacyScheduleLogic } from '../../../src/logic/ScheduleLogic';
import { decodeScheduleMask, encodeScheduleToMask } from '../../../src/logic/Utils';
import { resolveRegistrations } from '../../../src/logic/scheduler/RegistrationResolver';
import { maskToSections } from '../../../src/logic/scheduler/ScheduleDecoder';
import { resolveKnownPortalRoom } from '../../../src/integrations/hcmus-portal/rooms';
import { portalScheduleSamples } from '../../fixtures/portal-schedule-samples';

const PORTAL_SCHEDULE_PATTERN = /^T(\d|CN)\(([\d.]+)-([\d.]+)\)-([^:]+):(.+)$/i;

function parseExpectedSample(raw: string) {
  const match = raw.match(PORTAL_SCHEDULE_PATTERN);
  if (!match) throw new Error(`Invalid Portal schedule fixture: ${raw}`);

  const dayToken = match[1].toUpperCase();
  return {
    schedule: `T${dayToken}(${match[2]}-${match[3]})`,
    dayIndex: dayToken === 'CN' ? 6 : Number.parseInt(dayToken, 10) - 2,
    startPeriod: Number.parseFloat(match[2]),
    endPeriod: Number.parseFloat(match[3]),
    campusLabel: match[4],
    room: match[5],
  };
}

describe('Portal schedule samples', () => {
  it('keeps the complete reported dataset as a regression fixture', () => {
    expect(portalScheduleSamples).toHaveLength(439);
    expect(new Set(portalScheduleSamples)).toHaveLength(420);
  });

  it('classifies every reported Portal room code without ambiguity', () => {
    const portalCodes = [...new Set(portalScheduleSamples.flatMap((raw) =>
      ScheduleLogic.parseScheduleString(raw)
        .map((entry) => entry.portalLocationCode)
        .filter((code): code is string => Boolean(code)),
    ))];
    const resolutions = portalCodes.map((code) => ({ code, resolution: resolveKnownPortalRoom(code) }));
    const unresolved = resolutions
      .filter(({ resolution }) => resolution.status === 'unresolved')
      .map(({ code }) => code);

    expect(resolutions.filter(({ resolution }) => resolution.status === 'ambiguous')).toEqual([]);
    expect(resolutions.filter(({ resolution }) => resolution.status === 'matched')).toHaveLength(64);
    expect(unresolved).toEqual([
      'P.cs2:D001', 'P.cs2:G202', 'P.cs2:G502', 'P.cs2:D109', 'P.cs2:G301', 'P.cs2:TT_TDTT1',
      'P.cs2:G201', 'P.cs2:G501', 'P.cs2:G302', 'P.cs2:TNSDC1_A306', 'P.cs2:TNHDC_A110',
      'P.cs2:TNHDC_A107', 'P.cs2:TNHDC_A108', 'P.cs2:TNHDC_A109', 'P.cs2:PMT_B4-2_5.',
      'P.cs2:PMT_B4-2_6.', 'P.cs2:TNL_A211', 'P.cs2:TNL_A213',
    ]);
  });

  it.each(portalScheduleSamples)('parses %s without losing its day, period range, or room', (raw) => {
    const expected = parseExpectedSample(raw);
    const parsed = ScheduleLogic.parseScheduleString(raw);

    expect(parsed).toEqual([expect.objectContaining({
      dayStr: expected.schedule.slice(0, expected.schedule.indexOf('(')),
      dayIndex: expected.dayIndex,
      startPeriod: expected.startPeriod,
      endPeriod: expected.endPeriod,
      room: expected.room,
    })]);
    expect(ScheduleLogic.parseScheduleSlots(raw)).toEqual([expected.schedule]);
  });

  it('encodes every reported schedule into the solver mask', () => {
    portalScheduleSamples.forEach((raw) => {
      const expected = parseExpectedSample(raw);
      const mask = encodeScheduleToMask(expected.schedule, '', 'dong-hoa').parts;
      const decoded = decodeScheduleMask(mask, 'dong-hoa');

      expect(mask.some((part) => part !== 0), raw).toBe(true);
      expect(decoded.some((slot) => slot.day === expected.dayIndex), raw).toBe(true);
    });
  });

  it('normalizes every reported registration and keeps only the room after the campus label', () => {
    const registrations = resolveRegistrations(portalScheduleSamples.map((raw, index) => ({
      id: `TEST${String(index).padStart(3, '0')}`,
      name: `Portal schedule ${index}`,
      courseType: 'LT',
      schedule: raw,
    })));

    expect(registrations).toHaveLength(portalScheduleSamples.length);
    registrations.forEach((registration, index) => {
      const expected = parseExpectedSample(portalScheduleSamples[index]);
      expect(registration.components).toEqual([expect.objectContaining({
        schedule: expected.schedule,
        room: expected.room,
      })]);
      expect(registration.scheduleMask.some((part) => part !== 0), portalScheduleSamples[index]).toBe(true);
    });
  });

  it('builds a visual-schedule session for every reported value', () => {
    const courses = portalScheduleSamples.map((raw, index) => ({
      id: `TEST${String(index).padStart(3, '0')}`,
      name: `Portal schedule ${index}`,
      classGroup: `GROUP${index}`,
      courseType: 'LT',
      schedule: raw,
    }));
    const metadata = courses.map((course) => ({
      course_id: course.id,
      credits: 1,
      theory_hours: 0,
    }));
    const schedule = ScheduleLogic.buildScheduleSessions(
      courses,
      metadata,
      { params: { registration: { year: '26-27', sem: '1' } } },
      undefined,
      [],
      [],
      'dong-hoa',
    );
    const sessionsByCourse = new Map(schedule.sessions.map((session) => [session.courseCode, session]));

    expect(schedule.sessions).toHaveLength(portalScheduleSamples.length);
    portalScheduleSamples.forEach((raw, index) => {
      const expected = parseExpectedSample(raw);
      expect(sessionsByCourse.get(`TEST${String(index).padStart(3, '0')}`), raw).toMatchObject({
        dayOfWeek: expected.dayIndex + 2,
        startPeriod: expected.startPeriod,
        endPeriod: expected.endPeriod,
        room: expected.room,
      });
    });
  });

  it('also accepts the same Portal format on Sunday', () => {
    const raw = 'TCN(3.5-5)-P.cs2:F202';
    const [parsed] = ScheduleLogic.parseScheduleString(raw);
    const [registration] = resolveRegistrations([{
      id: 'SUNDAY001',
      courseType: 'LT',
      schedule: raw,
    }]);
    const visualSchedule = ScheduleLogic.buildScheduleSessions(
      [{
        id: 'SUNDAY001',
        name: 'Sunday course',
        classGroup: 'SUN01',
        courseType: 'LT',
        schedule: raw,
      }],
      [{ course_id: 'SUNDAY001', credits: 1, theory_hours: 0 }],
      { params: { registration: { year: '26-27', sem: '1' } } },
      undefined,
      [],
      [],
      'dong-hoa',
    );
    const groupSections = maskToSections(
      registration.scheduleMask,
      'SUNDAY001',
      'Sunday course',
      'SUN01',
      '#004A98',
      1,
      { defaultCampusId: 'dong-hoa' },
    );

    expect(parsed).toMatchObject({
      dayStr: 'TCN',
      dayIndex: 6,
      startPeriod: 3.5,
      endPeriod: 5,
      room: 'F202',
    });
    expect(decodeScheduleMask(registration.scheduleMask, 'dong-hoa')).toEqual(
      expect.arrayContaining([{ day: 6, period: 4 }, { day: 6, period: 5 }]),
    );
    expect(visualSchedule.sessions).toEqual([
      expect.objectContaining({ dayOfWeek: 8, room: 'F202' }),
    ]);
    expect(groupSections).toEqual([
      expect.objectContaining({ day: 8 }),
    ]);
  });

  it('applies a single trailing room to every meeting in the same schedule string', () => {
    const raw = 'T2(1-10); T3(1-10); T4(1-10); T5(1-10); T6(1-10); T7(1-10)-P.A303';
    const course = {
      id: 'SHAREDROOM001',
      name: 'Shared room course',
      classGroup: 'ROOM01',
      courseType: 'LT',
      schedule: raw,
    };
    const courseMeta = [{ course_id: course.id, credits: 1, theory_hours: 60 }];
    const metadata = { params: { registration: { year: '26-27', sem: '1' } } };

    expect(ScheduleLogic.parseScheduleString(raw).map((entry) => entry.room)).toEqual(
      Array(6).fill('P.A303'),
    );
    expect(LegacyScheduleLogic.parseScheduleString(raw).map((entry) => entry.room)).toEqual(
      Array(6).fill('P.A303'),
    );

    const schedule = ScheduleLogic.buildScheduleSessions(
      [course],
      courseMeta,
      metadata,
      undefined,
      [],
      [],
      'dong-hoa',
    );
    const legacySchedule = LegacyScheduleLogic.buildScheduleSessions([course], courseMeta, metadata);

    expect(schedule.sessions).toHaveLength(6);
    expect(schedule.sessions.every((session) => session.room === 'P.A303')).toBe(true);
    expect(legacySchedule.sessions).toHaveLength(6);
    expect(legacySchedule.sessions.every((session) => session.room === 'P.A303')).toBe(true);
  });

  it('keeps the existing room value unchanged when the trailing value is a Portal placeholder', () => {
    const raw = 'T3(11-14); TCN(1-5)-P.Link TKB';

    expect(ScheduleLogic.parseScheduleString(raw).map((entry) => entry.room)).toEqual([
      'P.Link TKB',
      'P.Link TKB',
    ]);
  });

  it('does not overwrite independently assigned rooms', () => {
    const raw = 'T2(1-5)-P.A101; T4(6-10)-P.B202';

    expect(ScheduleLogic.parseScheduleString(raw).map((entry) => entry.room)).toEqual([
      'P.A101',
      'P.B202',
    ]);
  });
});
