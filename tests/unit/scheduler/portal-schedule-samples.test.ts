import { describe, expect, it } from 'vitest';

import { ScheduleLogic } from '../../../src/features/visual-schedule/services/schedule-logic';
import { decodeScheduleMask, encodeScheduleToMask } from '../../../src/logic/Utils';
import { resolveRegistrations } from '../../../src/logic/scheduler/RegistrationResolver';
import { maskToSections } from '../../../src/logic/scheduler/ScheduleDecoder';
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
});
