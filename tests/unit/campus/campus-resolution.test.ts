import { describe, expect, it } from 'vitest';

import {
  detectCampusFromOpenClassLocations,
  detectCampusFromPeriodRanges,
  getCampusIdFromPortalCode,
  resolveCampus,
  resolvePeriodBoundary,
  resolvePeriodRange,
} from '../../../src/domain/campus';

describe('campus resolution', () => {
  it('maps the exact DSLM location codes to the two supported campuses', () => {
    expect(getCampusIdFromPortalCode('NVC')).toBe('cho-quan');
    expect(getCampusIdFromPortalCode(' lt ')).toBe('dong-hoa');
    expect(getCampusIdFromPortalCode('Cơ sở NVC - Nguyễn Văn Cừ')).toBe('cho-quan');
    expect(getCampusIdFromPortalCode('LT - Linh Trung')).toBe('dong-hoa');
    expect(getCampusIdFromPortalCode('F202')).toBeNull();
  });

  it('keeps unknown and conflicting locations explicit', () => {
    expect(detectCampusFromOpenClassLocations(['F202'])).toEqual({
      status: 'unresolved',
      rawValues: ['F202'],
    });
    expect(detectCampusFromOpenClassLocations(['NVC', 'LT'])).toEqual({
      status: 'ambiguous',
      candidates: ['cho-quan', 'dong-hoa'],
      rawValues: ['NVC', 'LT'],
    });
  });

  it('uses manual, detected, then profile campus in that order', () => {
    const detected = detectCampusFromOpenClassLocations(['NVC']);

    expect(resolveCampus({ manualCampusId: 'dong-hoa', detection: detected }, 'cho-quan')).toEqual({
      campusId: 'dong-hoa',
      source: 'manual',
      isFallback: false,
    });
    expect(resolveCampus({ detection: detected }, 'dong-hoa')).toEqual({
      campusId: 'cho-quan',
      source: 'open-class',
      isFallback: false,
    });
    expect(resolveCampus(undefined, 'dong-hoa')).toEqual({
      campusId: 'dong-hoa',
      source: 'profile-fallback',
      isFallback: true,
    });
  });

  it('infers Chợ Quán when a registration uses periods unavailable at Đông Hòa', () => {
    expect(detectCampusFromPeriodRanges([{ startPeriod: 10, endPeriod: 12 }])).toEqual({
      status: 'matched',
      campusId: 'cho-quan',
      source: 'schedule-range',
      confidence: 'strong',
    });
    expect(detectCampusFromPeriodRanges([{ startPeriod: 1, endPeriod: 4 }])).toEqual({
      status: 'ambiguous',
      candidates: ['cho-quan', 'dong-hoa'],
    });
  });
});

describe('campus period tables', () => {
  it('resolves the first and last periods at Đông Hòa', () => {
    expect(resolvePeriodRange('dong-hoa', 1, 10)).toMatchObject({
      startTime: '07:30',
      endTime: '17:00',
      session: 'morning',
    });
  });

  it('resolves morning, afternoon and evening periods at Chợ Quán', () => {
    expect(resolvePeriodRange('cho-quan', 1, 6)).toMatchObject({
      startTime: '07:00',
      endTime: '12:10',
      session: 'morning',
    });
    expect(resolvePeriodRange('cho-quan', 7, 12)).toMatchObject({
      startTime: '12:50',
      endTime: '18:00',
      session: 'afternoon',
    });
    expect(resolvePeriodRange('cho-quan', 13, 15)).toMatchObject({
      startTime: '18:00',
      endTime: '20:30',
      session: 'evening',
    });
  });

  it('treats .5 as the midpoint boundary described by Portal', () => {
    expect(resolvePeriodRange('dong-hoa', 1, 2.5)).toMatchObject({
      startTime: '07:30',
      endTime: '09:35',
    });
    expect(resolvePeriodRange('dong-hoa', 3.5, 5)).toMatchObject({
      startTime: '09:35',
      endTime: '11:50',
    });
    expect(resolvePeriodBoundary('cho-quan', 3.5, 'start')).toBe('09:05');
    expect(resolvePeriodBoundary('cho-quan', 2.5, 'end')).toBe('09:05');
  });

  it('rejects periods outside the selected campus table', () => {
    expect(() => resolvePeriodRange('dong-hoa', 1, 11)).toThrow(RangeError);
    expect(() => resolvePeriodRange('cho-quan', 1, 15.5)).toThrow(RangeError);
  });
});
