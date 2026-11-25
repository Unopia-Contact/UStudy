import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { STORAGE_KEYS } from '../../../config';
import { readFromStorage, saveToStorage } from '../../../helpers/localStorage/save';
import {
  decodeGroupPayload,
  decodeGroupURL,
  encodeGroupURL,
  GroupURLDecodeError,
  isDuplicateMember,
  sanitizeGroupMember,
} from '../services/group-scheduler';
import type { GroupConfigurationIssue, GroupFitnessConfig, GroupMemberToken, GroupScheduleOption, GroupScheduleRunResult, GroupScheduleTradeoff, GroupShareConfig, GroupSharePayload } from '../types';
import type { GroupWorkerReply, GroupWorkerRequest } from '../services/group-scheduler.worker';
import courseDbJson from '../../../logic/scheduler/Course_db.json';
import { useCampus } from '../../../context/CampusContext';

export interface CourseChoice {
  id: string;
  name: string;
}

export interface GroupSolverState {
  members: GroupMemberToken[];
  shareUrl: string;
  urlWarning: string | null;
  decodeError: string | null;
  solving: boolean;
  result: GroupScheduleRunResult | null;
  solveError: string | null;
  availableCourses: CourseChoice[];
  validationIssues: GroupConfigurationIssue[];
  importedShareConfig?: GroupShareConfig;
}

interface PersistedGroupScheduleResult {
  version: 1;
  updatedAt: string;
  memberSignature: string;
  result: GroupScheduleRunResult;
}

function getMemberSignature(members: GroupMemberToken[]): string {
  return JSON.stringify(members);
}

function loadLastGroupScheduleResult(members: GroupMemberToken[]): GroupScheduleRunResult | null {
  const stored = readFromStorage<PersistedGroupScheduleResult | null>(
    STORAGE_KEYS.GROUP_SCHEDULE_LAST_RESULT,
    null,
  );

  if (
    stored?.version !== 1
    || stored.memberSignature !== getMemberSignature(members)
    || !Array.isArray(stored.result?.solutions)
  ) return null;
  return stored.result;
}

function getBrowserHash(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hash;
}

function getInitialPayload(): GroupSharePayload {
  try {
    return decodeGroupPayload(getBrowserHash());
  } catch {
    return { members: [] };
  }
}

function getCourseId(course: any): string {
  return String(course?.id || course?.course_id || course?.code || '').trim().toUpperCase();
}

function getCourseName(course: any): string {
  return String(course?.name || course?.nameVi || course?.course_name || getCourseId(course));
}

function loadCourseDb(): any[] {
  const stored = readFromStorage<any[]>(STORAGE_KEYS.COURSE_DB_OFFLINE, []);
  const mergedMap = new Map<string, any>();
  (courseDbJson as any[]).forEach(item => mergedMap.set(item.id, item));
  if (stored && Array.isArray(stored)) {
    stored.forEach(item => {
      const existing = mergedMap.get(item.id);
      if (existing && (!item.classes || item.classes.length === 0) && existing.classes && existing.classes.length > 0) {
        item.classes = existing.classes;
      }
      mergedMap.set(item.id, item);
    });
  }
  return Array.from(mergedMap.values());
}

export function parseCourseInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  );
}

function runWorker(request: GroupWorkerRequest, signal: AbortSignal): Promise<GroupWorkerReply> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../services/group-scheduler.worker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => {
      worker.terminate();
      window.clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    };
    const fail = (message: string) => { cleanup(); reject(new Error(message)); };
    const abort = () => { cleanup(); reject(new DOMException('Đã dừng xếp lịch.', 'AbortError')); };
    const timer = window.setTimeout(() => fail('Đã hết thời gian xếp lịch. Hãy thử thu hẹp lựa chọn lớp.'), 20_000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = ({ data }: MessageEvent<GroupWorkerReply>) => { cleanup(); resolve(data); };
    worker.onerror = () => fail('Không chạy được bộ xếp lịch. Hãy thử lại.');
    worker.onmessageerror = () => fail('Không đọc được kết quả xếp lịch.');
    try { worker.postMessage(request); } catch (error) { cleanup(); reject(error); }
  });
}

export function useGroupScheduler(): GroupSolverState & {
  setMembersFromURL: (hash?: string) => void;
  addMember: (member: GroupMemberToken) => boolean;
  replaceMembers: (members: GroupMemberToken[]) => void;
  solve: (config?: Partial<GroupFitnessConfig>) => Promise<'invalid' | void>;
  cancelSolve: () => void;
  setShareConfig: (config: GroupShareConfig) => void;
  analyzeTradeoff: (option: GroupScheduleOption, tradeoff: GroupScheduleTradeoff, config?: Partial<GroupFitnessConfig>) => Promise<GroupScheduleTradeoff>;
  clearResult: () => void;
  setResult: (result: GroupScheduleRunResult | null) => void;
  getOptionRegistrations: (option: GroupScheduleOption, memberIndex?: number) => any[];
} {
  const { defaultCampusId } = useCampus();
  const initialPayload = useMemo(getInitialPayload, []);
  const [members, setMembers] = useState<GroupMemberToken[]>(() => {
    if (initialPayload.members.length > 0) return initialPayload.members;
    return readFromStorage<GroupMemberToken[]>(STORAGE_KEYS.GROUP_SCHEDULER_MEMBERS, []);
  });
  const [shareConfig, setShareConfigState] = useState<GroupShareConfig>(initialPayload.config ?? {});
  const [importedShareConfig, setImportedShareConfig] = useState<GroupShareConfig | undefined>(initialPayload.config);
  const [decodeError, setDecodeError] = useState<string | null>(() => {
    const hash = getBrowserHash();
    if (!hash || hash === '#') return null;
    try {
      decodeGroupURL(hash);
      return null;
    } catch (error) {
      return error instanceof GroupURLDecodeError ? error.message : 'Link nhóm không hợp lệ.';
    }
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.GROUP_SCHEDULER_MEMBERS, members);
  }, [members]);
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<GroupScheduleRunResult | null>(() => loadLastGroupScheduleResult(members));
  const [solveError, setSolveError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<GroupConfigurationIssue[]>([]);

  const dbData = useMemo(() => loadCourseDb(), []);
  const availableCourses = useMemo<CourseChoice[]>(() => {
    return dbData
      .map((course) => ({ id: getCourseId(course), name: getCourseName(course) }))
      .filter((course) => course.id)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [dbData]);

  const shareUrl = useMemo(() => (members.length > 0 ? encodeGroupURL(members, shareConfig) : ''), [members, shareConfig]);
  const urlWarning = shareUrl.length > 2000 ? 'Link nhóm đang dài hơn 2000 ký tự. Một số app chat có thể cắt link; hãy giảm số môn hoặc gửi link bằng cách copy trực tiếp.' : null;

  const updateBrowserUrl = useCallback((nextMembers: GroupMemberToken[], nextConfig: GroupShareConfig) => {
    if (typeof window === 'undefined' || nextMembers.length === 0) return;
    const nextUrl = encodeGroupURL(nextMembers, nextConfig);
    window.history.replaceState(null, '', nextUrl);
  }, []);

  const setShareConfig = useCallback((nextConfig: GroupShareConfig) => {
    setShareConfigState(nextConfig);
    updateBrowserUrl(members, nextConfig);
  }, [members, updateBrowserUrl]);

  const setMembersFromURL = useCallback((hash = getBrowserHash()) => {
    try {
      const decoded = decodeGroupPayload(hash);
      setMembers(decoded.members);
      setShareConfigState(decoded.config ?? {});
      setImportedShareConfig(decoded.config);
      setDecodeError(null);
      setResult(null);
    } catch (error) {
      setDecodeError(error instanceof GroupURLDecodeError ? error.message : 'Link nhóm không hợp lệ.');
      setMembers([]);
    }
  }, []);

  const replaceMembers = useCallback((nextMembers: GroupMemberToken[]) => {
    const sanitized = nextMembers.map(sanitizeGroupMember).filter((member) => member.sharedCourses.length + member.personalCourses.length > 0);
    setMembers(sanitized);
    setResult(null);
    updateBrowserUrl(sanitized, shareConfig);
  }, [shareConfig, updateBrowserUrl]);

  const addMember = useCallback((member: GroupMemberToken) => {
    const sanitized = sanitizeGroupMember(member);
    if (sanitized.sharedCourses.length + sanitized.personalCourses.length === 0) {
      setSolveError('Bạn cần nhập ít nhất một môn chung hoặc môn cá nhân.');
      return false;
    }
    if (isDuplicateMember(sanitized, members)) {
      setSolveError('Có vẻ bạn đã tham gia nhóm này rồi. Kiểm tra lại danh sách môn trước khi thêm tiếp.');
      return false;
    }

    const nextMembers = [...members, sanitized];
    setMembers(nextMembers);
    setResult(null);
    setSolveError(null);
    updateBrowserUrl(nextMembers, shareConfig);
    return true;
  }, [members, shareConfig, updateBrowserUrl]);

  const activeJob = useRef<AbortController | null>(null);
  const cancelSolve = useCallback(() => {
    activeJob.current?.abort();
    activeJob.current = null;
    setSolving(false);
  }, []);
  useEffect(() => {
    setSolving(false);
    return () => { activeJob.current?.abort(); activeJob.current = null; };
  }, [members, defaultCampusId, shareConfig]);

  const startJob = (config: Partial<GroupFitnessConfig>, tradeoff?: GroupScheduleTradeoff) => {
    activeJob.current?.abort();
    const controller = new AbortController();
    activeJob.current = controller;
    const ids = new Set(members.flatMap(member => [...member.sharedCourses, ...member.personalCourses].map(id => id.trim().toUpperCase())));
    const db = dbData.filter(course => ids.has(getCourseId(course)));
    return { controller, reply: runWorker({ db, members, config, campus: defaultCampusId, tradeoff }, controller.signal) };
  };
  const solve = async (config: Partial<GroupFitnessConfig> = {}): Promise<'invalid' | void> => {
    if (members.length < 2) { setSolveError('Cần ít nhất 2 thành viên để xếp lịch nhóm.'); return 'invalid'; }
    setSolving(true);
    setSolveError(null);
    setResult(null);
    setValidationIssues([]);
    const { controller, reply } = startJob(config);
    try {
      const response = await reply;
      if (controller.signal.aborted) return;
      if (response.kind === 'error') throw new Error(response.message);
      if (response.kind === 'analysis') return;
      setValidationIssues(response.issues);
      if (response.kind === 'invalid') return 'invalid';
      const nextResult = response.result;
      if (!nextResult.solutions.length) {
        setSolveError(nextResult.trace?.some(stage => stage.reachedSearchBudget)
          ? 'Đã đạt giới hạn tìm kiếm. Hãy giảm số lớp cần xét hoặc điều chỉnh ưu tiên.'
          : 'Chưa tìm được lịch chung. Hãy kiểm tra các môn và điều kiện đã chọn.');
      } else {
        saveToStorage<PersistedGroupScheduleResult>(STORAGE_KEYS.GROUP_SCHEDULE_LAST_RESULT, {
          version: 1, updatedAt: new Date().toISOString(), memberSignature: getMemberSignature(members), result: nextResult,
        });
      }
      setResult(nextResult);
    } catch (error) {
      if (!controller.signal.aborted) setSolveError(error instanceof Error ? error.message : 'Có lỗi khi xếp lịch nhóm.');
    } finally {
      if (activeJob.current === controller) { activeJob.current = null; setSolving(false); }
    }
  };

  const clearResult = useCallback(() => {
    cancelSolve();
    setResult(null);
    setSolveError(null);
  }, [cancelSolve]);

  const analyzeTradeoff = async (option: GroupScheduleOption, tradeoff: GroupScheduleTradeoff, config: Partial<GroupFitnessConfig> = {}) => {
    const { controller, reply } = startJob(config, tradeoff);
    try {
      const response = await reply;
      if (response.kind === 'error') throw new Error(response.message);
      if (response.kind !== 'analysis' || controller.signal.aborted) return tradeoff;
      const analyzed = response.tradeoff;
      setResult(current => current && { ...current, solutions: current.solutions.map(candidate => candidate !== option ? candidate : {
        ...candidate, tradeoffs: candidate.tradeoffs?.map(item => item.id === analyzed.id ? analyzed : item),
      }) });
      return analyzed;
    } catch (error) {
      if (!controller.signal.aborted) setSolveError(error instanceof Error ? error.message : 'Không phân tích được phương án.');
      return tradeoff;
    } finally {
      if (activeJob.current === controller) activeJob.current = null;
    }
  };

  const getOptionRegistrations = useCallback((option: GroupScheduleOption, memberIndex = 0) => {
    const memberSchedule = option.schedules.find((schedule) => schedule.memberIndex === memberIndex);
    return (memberSchedule?.items ?? []).map((item) => ({
      id: item.courseId,
      name: item.courseName,
      classGroup: item.classId,
      courseType: 'LT',
      schedule: Array.isArray(item.schedule) ? item.schedule.join(', ') : item.schedule || '',
      instructor: '',
      startWeek: '',
    }));
  }, []);

  return {
    members,
    shareUrl,
    urlWarning,
    decodeError,
    solving,
    result,
    solveError,
    availableCourses,
    validationIssues,
    importedShareConfig,
    setMembersFromURL,
    addMember,
    replaceMembers,
    solve,
    cancelSolve,
    setShareConfig,
    analyzeTradeoff,
    clearResult,
    setResult: next => { cancelSolve(); setResult(next); },
    getOptionRegistrations,
  };
}
