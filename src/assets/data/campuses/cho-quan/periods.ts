import type { PeriodDefinition } from '../../../../domain/campus';

export const CHO_QUAN_PERIODS: PeriodDefinition[] = [
  { period: 1, start: '07:00', end: '07:50', session: 'morning' },
  { period: 2, start: '07:50', end: '08:40', session: 'morning' },
  { period: 3, start: '08:40', end: '09:30', session: 'morning' },
  { period: 4, start: '09:40', end: '10:30', session: 'morning' },
  { period: 5, start: '10:30', end: '11:20', session: 'morning' },
  { period: 6, start: '11:20', end: '12:10', session: 'morning' },
  { period: 7, start: '12:50', end: '13:40', session: 'afternoon' },
  { period: 8, start: '13:40', end: '14:30', session: 'afternoon' },
  { period: 9, start: '14:30', end: '15:20', session: 'afternoon' },
  { period: 10, start: '15:30', end: '16:20', session: 'afternoon' },
  { period: 11, start: '16:20', end: '17:10', session: 'afternoon' },
  { period: 12, start: '17:10', end: '18:00', session: 'afternoon' },
  { period: 13, start: '18:00', end: '18:50', session: 'evening' },
  { period: 14, start: '18:50', end: '19:40', session: 'evening' },
  { period: 15, start: '19:40', end: '20:30', session: 'evening' },
];
