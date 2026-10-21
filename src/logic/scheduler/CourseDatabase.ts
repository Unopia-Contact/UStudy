import {
  DEFAULT_CAMPUS_ID,
  resolveCampus,
  type CampusId,
  type SessionCampus,
} from '../../domain/campus';
import { encodeScheduleToMask } from '../Utils.js';
import { Bitset } from './Bitset.js';

interface CampusScheduleEntry {
  schedule: string[];
  campusId: CampusId;
}

function normalizeSchedules(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function resolveEntryCampus(source: any, defaultCampusId: CampusId): CampusId {
  if (source?.campusId === 'cho-quan' || source?.campusId === 'dong-hoa') return source.campusId;
  const campus: SessionCampus = source?.campus?.detection || source?.campus?.manualCampusId
    ? source.campus
    : { detection: source?.campus };
  return resolveCampus(campus, defaultCampusId).campusId;
}

export function getCampusScheduleEntries(cls: any, defaultCampusId: CampusId): CampusScheduleEntry[] {
  const entries: CampusScheduleEntry[] = [];
  const components = cls?.components ? Object.values(cls.components).filter(Boolean) : [];

  for (const component of components as any[]) {
    if (Array.isArray(component.meetings) && component.meetings.length > 0) {
      for (const meeting of component.meetings) {
        const schedule = normalizeSchedules(meeting.schedule?.length ? meeting.schedule : meeting.rawSchedule);
        if (schedule.length > 0) {
          entries.push({ schedule, campusId: resolveEntryCampus(meeting, defaultCampusId) });
        }
      }
      continue;
    }

    const schedule = normalizeSchedules(component.schedule);
    if (schedule.length > 0) {
      entries.push({ schedule, campusId: resolveEntryCampus(component, defaultCampusId) });
    }
  }

  if (entries.length === 0) {
    const schedule = normalizeSchedules(cls?.schedule);
    if (schedule.length > 0) {
      entries.push({ schedule, campusId: resolveEntryCampus(cls, defaultCampusId) });
    }
  }

  return entries;
}

export default class CourseDatabase {
  courses: any[] = [];
  mapIdToIndex: Record<string, number> = {};

  loadData(rawData: any, defaultCampusId: CampusId = DEFAULT_CAMPUS_ID) {
    this.courses = [];
    this.mapIdToIndex = {};

    if (!Array.isArray(rawData)) {
      console.error('Du lieu nap vao CourseDatabase khong phai la mang:', rawData);
      return;
    }

    rawData.forEach((subject: any, index: number) => {
      const processedClasses = (Array.isArray(subject.classes) ? subject.classes : []).map((cls: any) => {
        const scheduleMask = new Bitset();
        const scheduleEntries = getCampusScheduleEntries(cls, defaultCampusId);

        if (scheduleEntries.length > 0) {
          for (const entry of scheduleEntries) {
            const encoded = encodeScheduleToMask(entry.schedule, subject.id, entry.campusId);
            const entryMask = new Bitset();
            entryMask.loadFromData(encoded.parts);
            scheduleMask.parts = scheduleMask.or(entryMask).parts;
          }
        } else if (Array.isArray(cls.mask)) {
          scheduleMask.loadFromData(cls.mask, defaultCampusId);
        }

        return {
          ...cls,
          id: cls.id,
          schedule: cls.schedule,
          scheduleEntries,
          scheduleMask,
        };
      });

      this.courses.push({
        ...subject,
        id: subject.id,
        name: subject.name,
        credits: subject.credits,
        classes: processedClasses,
      });
      this.mapIdToIndex[subject.id] = index;
    });
  }

  getCourse(id: string) {
    const index = this.mapIdToIndex[id];
    return index !== undefined ? this.courses[index] : null;
  }
}
