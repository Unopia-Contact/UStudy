import type { PeriodDefinition } from '../../../../domain/campus';

export const DONG_HOA_PERIODS: PeriodDefinition[] = [
  { period: 1, start: '07:30', end: '08:20', session: 'morning' },
  { period: 2, start: '08:20', end: '09:10', session: 'morning' },
  { period: 3, start: '09:10', end: '10:00', session: 'morning' },
  { period: 4, start: '10:10', end: '11:00', session: 'morning' },
  { period: 5, start: '11:00', end: '11:50', session: 'morning' },
  { period: 6, start: '12:40', end: '13:30', session: 'afternoon' },
  { period: 7, start: '13:30', end: '14:20', session: 'afternoon' },
  { period: 8, start: '14:20', end: '15:10', session: 'afternoon' },
  { period: 9, start: '15:20', end: '16:10', session: 'afternoon' },
  { period: 10, start: '16:10', end: '17:00', session: 'afternoon' },
];
