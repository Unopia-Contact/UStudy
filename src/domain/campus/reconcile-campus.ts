import { detectCampusFromOpenClassLocations } from './resolve-campus';
import type { CampusDetection, CampusId } from './types';

interface RegistrationLike {
  id?: string;
  classGroup?: string;
  courseType?: string;
  schedule?: string;
}

interface OpenClassMeetingLike {
  schedule?: string[];
  campus?: CampusDetection;
}

interface OpenClassComponentLike {
  group?: string;
  schedule?: string[];
  locations?: string[];
  meetings?: OpenClassMeetingLike[];
  campus?: CampusDetection;
}

interface OpenClassLike {
  id?: string;
  components?: {
    theory?: OpenClassComponentLike | null;
    practical?: OpenClassComponentLike | null;
    exercise?: OpenClassComponentLike | null;
  };
}

interface OpenCourseLike {
  id?: string;
  classes?: OpenClassLike[];
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function normalizeClassId(value: unknown): string {
  return normalize(value).split('_TH_')[0].split('_BT_')[0];
}

function getScheduleSlots(value: unknown): Set<string> {
  const matches = String(value ?? '').toUpperCase().match(/T(?:\d|CN)\s*\([\d.]+\s*-\s*[\d.]+\)/g) ?? [];
  return new Set(matches.map((item) => item.replace(/\s+/g, '')));
}

function hasScheduleOverlap(left: Set<string>, right: Set<string>): boolean {
  return [...left].some((slot) => right.has(slot));
}

function getComponent(openClass: OpenClassLike, courseType: string): OpenClassComponentLike | null {
  if (courseType === 'TH') return openClass.components?.practical ?? null;
  if (courseType === 'BT') return openClass.components?.exercise ?? null;
  return openClass.components?.theory ?? null;
}

function getComponentDetections(component: OpenClassComponentLike, registrationSlots: Set<string>): CampusDetection[] {
  const matchingMeetings = (component.meetings ?? []).filter((meeting) => {
    if (registrationSlots.size === 0) return true;
    return hasScheduleOverlap(registrationSlots, getScheduleSlots(meeting.schedule?.join(';') ?? ''));
  });
  const meetingDetections = matchingMeetings.map((meeting) => meeting.campus).filter(Boolean) as CampusDetection[];
  if (meetingDetections.length > 0) return meetingDetections;
  if (component.campus) return [component.campus];
  return [detectCampusFromOpenClassLocations(component.locations ?? [])];
}

export function reconcileRegistrationCampus(
  registration: RegistrationLike,
  openCourses: OpenCourseLike[],
): CampusDetection {
  const courseId = normalize(registration.id);
  const course = openCourses.find((item) => normalize(item.id) === courseId);
  if (!course) return { status: 'unresolved' };

  const courseType = normalize(registration.courseType) || 'LT';
  const classGroup = normalize(registration.classGroup);
  const registrationSlots = getScheduleSlots(registration.schedule);
  const candidates = (course.classes ?? []).flatMap((openClass) => {
    const component = getComponent(openClass, courseType);
    if (!component) return [];

    const classMatches = Boolean(classGroup) && (
      normalizeClassId(openClass.id) === classGroup || normalize(component.group) === classGroup
    );
    const componentSlots = getScheduleSlots(component.schedule?.join(';') ?? '');
    const scheduleMatches = registrationSlots.size > 0 && hasScheduleOverlap(registrationSlots, componentSlots);
    const score = (classMatches ? 4 : 0) + (scheduleMatches ? 3 : 0);
    return score > 0 ? [{ component, score }] : [];
  });

  if (candidates.length === 0) return { status: 'unresolved' };
  const bestScore = Math.max(...candidates.map((candidate) => candidate.score));
  const bestCandidates = candidates.filter((candidate) => candidate.score === bestScore);
  const matchedCampusIds = [...new Set(bestCandidates.flatMap(({ component }) =>
    getComponentDetections(component, registrationSlots)
      .filter((detection): detection is Extract<CampusDetection, { status: 'matched' }> => detection.status === 'matched')
      .map((detection) => detection.campusId),
  ))];

  if (matchedCampusIds.length === 1) {
    return {
      status: 'matched',
      campusId: matchedCampusIds[0],
      source: 'reconciled',
      confidence: 'strong',
    };
  }

  if (matchedCampusIds.length > 1) {
    return { status: 'ambiguous', candidates: matchedCampusIds as CampusId[] };
  }

  return { status: 'unresolved' };
}
