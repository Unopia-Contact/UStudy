import { useEffect, useMemo, useState, Fragment } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronRight, ListFilter, Moon, MoreHorizontal, Settings, Sun, Users, Zap, type LucideIcon } from 'lucide-react';

import { GroupURLShare } from './components/GroupURLShare';
import { GroupMemberCoursePicker } from './components/GroupMemberCoursePicker';
import { buildSavedGroupSchedule, GroupScheduleCalendarPreview } from './components/GroupScheduleCalendarPreview';
import { GroupScheduleResult, type GroupScheduleResultViewMode } from './components/GroupScheduleResult';
import { GroupScheduleResultViewTabs } from './components/GroupScheduleResultViewTabs';
import { GroupScheduleOptionJump } from './components/GroupScheduleOptionJump';
import { CourseSharingForm, getCourseSharingSummary } from './components/CourseSharingEditor';
import { GroupCourseMemberNames } from './components/GroupCourseMemberNames';
import { GroupScheduleComparison } from './components/GroupScheduleComparison';
import { SavedSchedulesModal } from './components/SavedSchedulesModal';
import { CourseClassFilterModal } from '../study-roadmap';
import { RoadmapDialog } from '../study-roadmap/components/RoadmapDialog';
import { DayOffFields } from '../../components/schedule/day-off-fields';
import { AppSelect } from '../../components/ui/form';
import { Input } from '../../components/ui/form/input';
import { PageHeader } from '../../components/layout/page-header';
import { ScheduleOptionSelector } from '../schedule';
import { buildDensityMap } from './services/group-scheduler';
import type { ClassPreferenceLevel, ClassPreferenceSelection, CourseSharingMap, GroupMemberToken } from './types';
import { useGroupScheduler } from './hooks/use-group-scheduler';
import { readFromStorage, saveToStorage } from '../../helpers/localStorage/save';
import { STORAGE_KEYS } from '../../config';
import type { Course, SavedSchedule } from '../../types';
import type { SolverPreferences } from '../study-roadmap';
import courseDbJson from '../../logic/scheduler/Course_db.json';
import { cycleDayOffSession, formatDayOffSession, formatDaysOff, getDayOffSession } from '../../utils/dayOffPreferences';
import { OpenClassDetailDialog, type OpenClassDetailTarget } from '../../components/course';
import { useCampus } from '../../context/CampusContext';

type GroupScheduleStep = 1 | 2 | 3;

type CourseEditorView = 'overview' | 'classes' | 'sharing';

function CoursePreferenceAction({ icon: Icon, title, summary, onClick }: {
    icon: LucideIcon;
    title: string;
    summary: string;
    onClick: () => void;
}) {
    return (
        <button type="button" onClick={onClick} className="flex min-h-14 w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-[#004A98]" />
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">{title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-600">{summary}</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
        </button>
    );
}

const defaultSolverPreferences: SolverPreferences = {
    daysOff: [],
    session: '0',
    strategy: 'compress',
    noGaps: false,
};

const stepItems: Array<{ id: GroupScheduleStep; label: string }> = [
    { id: 1, label: 'Nhóm' },
    { id: 2, label: 'Ưu tiên' },
    { id: 3, label: 'Kết quả' },
];

interface GroupSchedulePageProps {
    allCourses?: Course[];
    embedded?: boolean;
    modeSwitch?: React.ReactNode;
}

interface GroupClassOption {
    id: string;
    schedule: string[];
}

function createMemberId() {
    return globalThis.crypto?.randomUUID?.() ?? `member-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeDraft(): GroupMemberToken {
    return {
        id: createMemberId(),
        nickname: '',
        sharedCourses: [],
        personalCourses: [],
        busyMask: [],
    };
}

function getCourseCode(course: Course): string {
    return (course.code || course.id).toUpperCase();
}

function normalizeCourseId(value: unknown): string {
    return String(value || '').trim().toUpperCase();
}

function normalizeSchedule(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    const text = String(value || '').trim();
    return text ? [text] : [];
}

function loadClassOptionsByCourse(): Record<string, GroupClassOption[]> {
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
    const rawCourses = Array.from(mergedMap.values());

    return rawCourses.reduce<Record<string, GroupClassOption[]>>((acc, course) => {
        const courseId = normalizeCourseId(course?.id || course?.code || course?.course_id);
        if (!courseId || !Array.isArray(course?.classes)) return acc;

        const seen = new Set<string>();
        acc[courseId] = course.classes
            .map((cls: any) => ({
                id: String(cls?.id || cls?.classId || cls?.className || '').trim(),
                schedule: normalizeSchedule(cls?.schedule),
            }))
            .filter((cls: GroupClassOption) => {
                if (!cls.id || seen.has(cls.id)) return false;
                seen.add(cls.id);
                return true;
            })
            .sort((a: GroupClassOption, b: GroupClassOption) => a.id.localeCompare(b.id));

        return acc;
    }, {});
}

export function GroupSchedulePage({
    allCourses = [],
    embedded = false,
    modeSwitch,
}: GroupSchedulePageProps) {
    const { defaultCampusId } = useCampus();
    const {
        members,
        shareUrl,
        urlWarning,
        decodeError,
        solving,
        result,
        solveError,
        validationIssues,
        importedShareConfig,
        availableCourses,
        setMembersFromURL,
        addMember,
        replaceMembers,
        solve,
        cancelSolve,
        setShareConfig,
        analyzeTradeoff,
        clearResult,
        setResult,
    } = useGroupScheduler();

    const savedUIState = useMemo(() => {
        return readFromStorage(STORAGE_KEYS.GROUP_SCHEDULE_UI_STATE, {
            activeStep: 1 as GroupScheduleStep,
            resultViewMode: 'course' as GroupScheduleResultViewMode,
            showGroupCalendarPreview: false,
        });
    }, []);

    const [activeStep, setActiveStep] = useState<GroupScheduleStep>(savedUIState.activeStep);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [activeResultIndex, setActiveResultIndex] = useState(0);
    const [activePreviewMemberIndex, setActivePreviewMemberIndex] = useState(0);
    const [showGroupCalendarPreview, setShowGroupCalendarPreview] = useState(savedUIState.showGroupCalendarPreview);
    const [showSaveGroupScheduleModal, setShowSaveGroupScheduleModal] = useState(false);
    const [groupScheduleName, setGroupScheduleName] = useState('');
    const [resultViewMode, setResultViewMode] = useState<GroupScheduleResultViewMode>(savedUIState.resultViewMode);
    const [draft, setDraft] = useState<GroupMemberToken>(makeDraft);
    const [draftCourseIds, setDraftCourseIds] = useState<string[]>([]);
    const [localNotice, setLocalNotice] = useState<string | null>(null);

    const [showListModal, setShowListModal] = useState(false);
    const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>(() => {
        return readFromStorage<SavedSchedule[]>(STORAGE_KEYS.SAVED_SCHEDULES, []);
    });
    const [personalAllowedClasses, setPersonalAllowedClasses] = useState<Record<string, string[]>>({});
    const [personalClassPreferences, setPersonalClassPreferences] = useState<Record<string, ClassPreferenceSelection>>({});
    const [groupPreferredClasses, setGroupPreferredClasses] = useState<Record<string, ClassPreferenceSelection>>(() => {
        return readFromStorage<Record<string, ClassPreferenceSelection>>(STORAGE_KEYS.GROUP_SCHEDULER_CLASS_PREFERENCES, {});
    });
    const [courseSharing, setCourseSharing] = useState<CourseSharingMap>(() => {
        return readFromStorage<CourseSharingMap>(STORAGE_KEYS.GROUP_SCHEDULER_COURSE_SHARING, {});
    });
    const [groupPrefs, setGroupPrefs] = useState<SolverPreferences>(() => readFromStorage<SolverPreferences>(STORAGE_KEYS.SOLVER_PREFERENCES, defaultSolverPreferences));
    const [classPreferenceTargetByCourse, setClassPreferenceTargetByCourse] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!importedShareConfig) return;
        if (importedShareConfig.groupPreferredClasses) setGroupPreferredClasses(importedShareConfig.groupPreferredClasses as Record<string, ClassPreferenceSelection>);
        if (importedShareConfig.courseSharing) setCourseSharing(importedShareConfig.courseSharing);
        if (importedShareConfig.groupPreferences) setGroupPrefs((current) => ({ ...current, ...importedShareConfig.groupPreferences }));
    }, [importedShareConfig]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.GROUP_SCHEDULER_CLASS_PREFERENCES, groupPreferredClasses);
    }, [groupPreferredClasses]);
    useEffect(() => {
        saveToStorage(STORAGE_KEYS.GROUP_SCHEDULER_COURSE_SHARING, courseSharing);
    }, [courseSharing]);
    useEffect(() => {
        setShareConfig({
            groupPreferredClasses,
            courseSharing,
            groupPreferences: groupPrefs,
        });
    }, [courseSharing, groupPreferredClasses, groupPrefs, setShareConfig]);
    const [courseEditor, setCourseEditor] = useState<{ courseId: string; view: CourseEditorView } | null>(null);
    const [memberFormOpen, setMemberFormOpen] = useState(false);
    const [filterCourseId, setFilterCourseId] = useState<string | null>(null);
    const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
    const [openClassDetails, setOpenClassDetails] = useState<OpenClassDetailTarget | null>(null);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.GROUP_SCHEDULE_UI_STATE, {
            activeStep,
            resultViewMode,
            showGroupCalendarPreview,
        });
    }, [activeStep, resultViewMode, showGroupCalendarPreview]);

    useEffect(() => {
        const onHashChange = () => setMembersFromURL(window.location.hash);
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [setMembersFromURL]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.SOLVER_PREFERENCES, groupPrefs);
    }, [groupPrefs]);

    const firstResultMember = result?.solutions[0]?.schedules[0]?.memberIndex;
    useEffect(() => {
        if (firstResultMember !== undefined) {
            setActiveStep(3);
            setActiveResultIndex(0);
            setActivePreviewMemberIndex(firstResultMember);
            setShowGroupCalendarPreview(true);
        }
    }, [firstResultMember, result?.density]);

    const knownCourseIds = useMemo(() => new Set(availableCourses.map((course) => course.id)), [availableCourses]);
    const courseCatalog = useMemo(() => {
        const names = new Map(availableCourses.map(({ id, name }) => [id, name]));
        for (const course of allCourses) {
            const id = getCourseCode(course);
            const name = course.nameVi || course.name;
            if (name || !names.has(id)) names.set(id, name || id);
        }
        return names;
    }, [allCourses, availableCourses]);
    const editingMember = editingMemberIndex === null ? null : members[editingMemberIndex] ?? null;
    const groupCourses = useMemo(() => buildDensityMap(members), [members]);
    const classOptionsByCourse = useMemo(() => loadClassOptionsByCourse(), []);
    const selectedOption = result?.solutions[activeResultIndex] ?? result?.solutions[0];
    const buildDraftClassPreferences = (): Record<string, ClassPreferenceSelection> => {
        const next = Object.fromEntries(
            Object.entries(personalClassPreferences).filter(([courseId]) => draftCourseIds.includes(courseId)).map(([courseId, selection]) => [
                courseId,
                {
                    excluded: [...(selection.excluded ?? [])],
                    preferred: [...(selection.preferred ?? [])],
                    required: [...(selection.required ?? [])],
                },
            ]),
        ) as Record<string, ClassPreferenceSelection>;

        draftCourseIds.forEach((courseId) => {
            const allowed = personalAllowedClasses[courseId];
            const allClassIds = (classOptionsByCourse[courseId] ?? []).map((classOption) => classOption.id);
            if (!allowed || allClassIds.length === 0) return;

            const selection = next[courseId] ?? {};
            next[courseId] = {
                ...selection,
                excluded: Array.from(new Set([
                    ...(selection.excluded ?? []),
                    ...allClassIds.filter((classId) => !allowed.includes(classId)),
                ])),
            };
        });

        return next;
    };

    const resetMemberDraft = () => {
        setMemberFormOpen(false);
        setDraft(makeDraft());
        setDraftCourseIds([]);
        setPersonalAllowedClasses({});
        setPersonalClassPreferences({});
        setEditingMemberIndex(null);
    };

    const startEditingMember = (member: GroupMemberToken, index: number) => {
        setMemberFormOpen(true);
        if (editingMemberIndex === index) return;
        const preferenceMap = Object.fromEntries(
            Object.entries(member.preferredClasses ?? {}).map(([courseId, selection]) => [
                courseId,
                Array.isArray(selection)
                    ? { preferred: selection }
                    : {
                        excluded: [...(selection.excluded ?? [])],
                        preferred: [...(selection.preferred ?? [])],
                        required: [...(selection.required ?? [])],
                    },
            ]),
        ) as Record<string, ClassPreferenceSelection>;

        setEditingMemberIndex(index);
        setDraft({
            ...member,
            id: member.id ?? createMemberId(),
            sharedCourses: [...member.sharedCourses],
            personalCourses: [...member.personalCourses],
            busyMask: [...member.busyMask],
            preferredClasses: preferenceMap,
            personalConfig: member.personalConfig ? { ...member.personalConfig, daysOff: [...(member.personalConfig.daysOff ?? [])] } : undefined,
        });
        setDraftCourseIds([...new Set([...member.sharedCourses, ...member.personalCourses])]);
        setPersonalAllowedClasses({});
        setPersonalClassPreferences(preferenceMap);
    };

    const submitDraft = () => {
        const retainedSharedCourses = (editingMember?.sharedCourses ?? []).filter((courseId) => draftCourseIds.includes(courseId));
        const nextDraft: GroupMemberToken = {
            ...draft,
            sharedCourses: retainedSharedCourses,
            personalCourses: draftCourseIds.filter((courseId) => !retainedSharedCourses.includes(courseId)),
            busyMask: draft.busyMask,
            preferredClasses: buildDraftClassPreferences(),
            personalConfig: draft.personalConfig,
        };

        const unknownCourses = draftCourseIds.filter((course) => knownCourseIds.size > 0 && !knownCourseIds.has(course));
        setLocalNotice(unknownCourses.length > 0 ? `Các môn chưa có trong dữ liệu lớp học: ${unknownCourses.join(', ')}.` : null);

        if (!draftCourseIds.length) { setLocalNotice("Hãy chọn ít nhất một môn."); return; }
        if (editingMemberIndex !== null) {
            replaceMembers(members.map((member, index) => index === editingMemberIndex ? nextDraft : member));
            resetMemberDraft();
            return;
        }

        if (addMember(nextDraft)) {
            resetMemberDraft();
        }
    };

    const removeMember = (index: number) => {
        setCourseSharing((current) => Object.fromEntries(
            Object.entries(current).map(([courseId, rule]) => [
                courseId,
                {
                    ...rule,
                    groups: rule.groups?.map((group) => group
                        .filter((memberIndex) => memberIndex !== index)
                        .map((memberIndex) => memberIndex > index ? memberIndex - 1 : memberIndex)),
                },
            ]),
        ));
        replaceMembers(members.filter((_, memberIndex) => memberIndex !== index));
        clearResult();
    };

    const getClassPreferenceTargets = (courseId: string, subscribers: number[]) => {
        const rule = courseSharing[courseId];
        const targets = [{ id: 'global', name: 'Toàn bộ môn' }];
        if (rule?.mode === 'independent') {
            return [...targets, ...subscribers.map((memberIndex) => ({ id: `member-${memberIndex}`, name: members[memberIndex]?.nickname || `Thành viên ${memberIndex + 1}` }))];
        }
        if (!rule?.groups) return [...targets, { id: 'all', name: 'Nhóm học chung' }];
        rule.groups.forEach((group, groupIndex) => {
            if (group.some((memberIndex) => subscribers.includes(memberIndex))) targets.push({ id: `group-${groupIndex}`, name: `Nhóm ${groupIndex + 1}` });
        });
        subscribers.filter((memberIndex) => !rule.groups?.some((group) => group.includes(memberIndex))).forEach((memberIndex) => targets.push({ id: `member-${memberIndex}`, name: members[memberIndex]?.nickname || `Học riêng ${memberIndex + 1}` }));
        return targets;
    };

    const getTargetSelection = (courseId: string): ClassPreferenceSelection | undefined => {
        const target = classPreferenceTargetByCourse[courseId] ?? 'global';
        return target === 'global' ? groupPreferredClasses[courseId] : courseSharing[courseId]?.groupClassPreferences?.[target];
    };

    const getGroupClassPreferenceLevel = (courseId: string, classId: string): ClassPreferenceLevel | null => {
        const selection = getTargetSelection(courseId);
        if (selection?.excluded?.includes(classId)) return 'excluded';
        if (selection?.required?.includes(classId)) return 'required';
        if (selection?.preferred?.includes(classId)) return 'preferred';
        return null;
    };

    const getGroupCourseName = (courseId: string): string => courseCatalog.get(courseId) ?? courseId;

    const setGroupClassPreferenceLevel = (courseId: string, classId: string, level: ClassPreferenceLevel | null) => {
        const target = classPreferenceTargetByCourse[courseId] ?? 'global';
        const updateSelection = (currentSelection?: ClassPreferenceSelection): ClassPreferenceSelection | undefined => {
            const excluded = new Set(currentSelection?.excluded ?? []);
            const preferred = new Set(currentSelection?.preferred ?? []);
            const required = new Set(currentSelection?.required ?? []);
            excluded.delete(classId);
            preferred.delete(classId);
            required.delete(classId);

            if (level === 'excluded') excluded.add(classId);
            if (level === 'preferred') preferred.add(classId);
            if (level === 'required') required.add(classId);

            const nextSelection: ClassPreferenceSelection = {
                excluded: Array.from(excluded).sort((a, b) => a.localeCompare(b)),
                preferred: Array.from(preferred).sort((a, b) => a.localeCompare(b)),
                required: Array.from(required).sort((a, b) => a.localeCompare(b)),
            };

            if ((nextSelection.excluded?.length ?? 0) === 0 && (nextSelection.preferred?.length ?? 0) === 0 && (nextSelection.required?.length ?? 0) === 0) {
                return undefined;
            }
            return nextSelection;
        };
        if (target === 'global') {
            setGroupPreferredClasses((current) => {
                const next = updateSelection(current[courseId]);
                if (!next) {
                    const { [courseId]: _removed, ...rest } = current;
                    return rest;
                }
                return { ...current, [courseId]: next };
            });
            return;
        }
        setCourseSharing((current) => {
            const rule = current[courseId] ?? { mode: 'required' as const };
            const next = updateSelection(rule.groupClassPreferences?.[target]);
            const groupClassPreferences = { ...(rule.groupClassPreferences ?? {}) };
            if (next) groupClassPreferences[target] = next;
            else delete groupClassPreferences[target];
            return { ...current, [courseId]: { ...rule, groupClassPreferences } };
        });
    };

    const clearGroupClassPreference = (courseId: string) => {
        const target = classPreferenceTargetByCourse[courseId] ?? 'global';
        if (target !== 'global') {
            setCourseSharing((current) => {
                const rule = current[courseId];
                if (!rule) return current;
                const groupClassPreferences = { ...(rule.groupClassPreferences ?? {}) };
                delete groupClassPreferences[target];
                return { ...current, [courseId]: { ...rule, groupClassPreferences } };
            });
            return;
        }
        setGroupPreferredClasses((current) => {
            const { [courseId]: _removed, ...rest } = current;
            return rest;
        });
    };

    const runGroupSolve = async () => {
        const config = { ...groupPrefs, groupPreferredClasses, courseSharing };
        setActiveStep(3);
        setShowGroupCalendarPreview(true);
        if (await solve(config) === 'invalid') setActiveStep(2);
    };


    const saveSelectedGroupSchedule = () => {
        const fallbackMemberIndex = selectedOption?.schedules[0]?.memberIndex ?? activePreviewMemberIndex;
        const memberIndex = showGroupCalendarPreview ? activePreviewMemberIndex : fallbackMemberIndex;
        const newSaved = buildSavedGroupSchedule(selectedOption, memberIndex, groupScheduleName, defaultCampusId);
        if (!newSaved) return;

        const savedSchedulesRaw = readFromStorage<unknown>(STORAGE_KEYS.SAVED_SCHEDULES, []);
        const savedSchedules = Array.isArray(savedSchedulesRaw) ? savedSchedulesRaw : [];
        saveToStorage(STORAGE_KEYS.SAVED_SCHEDULES, [newSaved, ...savedSchedules]);
        setSavedSchedules([newSaved, ...savedSchedules]);
        setShowSaveGroupScheduleModal(false);
        setGroupScheduleName('');
        setLocalNotice('Đã lưu lịch nhóm. Bạn có thể xem lại trong Lịch đã lưu.');
    };

    const handleLoadSchedule = (saved: SavedSchedule) => {
        if (!saved.groupSchedule) {
            if (window.confirm('Đây là lịch cá nhân. Bạn có muốn sang tab Lịch dự kiến để xem không?')) {
                alert('Vui lòng mở tab Lịch dự kiến để tải lịch này.');
            }
            return;
        }
        if (!saved.groupSchedule.rawOption) {
            alert('Lịch này được lưu ở phiên bản cũ và không thể mở lại trực tiếp trong Lịch nhóm. Vui lòng mở tab Lịch dự kiến (cá nhân) để xem chi tiết nhé!');
            return;
        }

        setResult({
            density: [],
            warnings: [],
            solutions: [saved.groupSchedule.rawOption]
        } as any);
        setActiveResultIndex(0);
        setShowListModal(false);
    };

    const handleDeleteSchedule = (id: string) => {
        const updated = savedSchedules.filter(s => s.id !== id);
        setSavedSchedules(updated);
        saveToStorage(STORAGE_KEYS.SAVED_SCHEDULES, updated);
    };

    const canOpenStep = (step: GroupScheduleStep) => {
        if (step === 1) return true;
        if (step === 2) return members.length > 0;
        return !!result?.solutions.length;
    };

    const openStep = (step: GroupScheduleStep) => {
        if (step !== 3) cancelSolve();
        setActiveStep(step);
    };

    const renderStepper = () => (
        <div role="group" aria-label="Thanh xếp lịch" className="ustudy-card flex flex-col gap-3 p-3 md:flex-row md:items-center md:gap-4">
            {modeSwitch && (
                <div className="w-full shrink-0 border-b border-gray-100 pb-3 md:w-auto md:border-b-0 md:border-r md:pb-0 md:pr-4">
                    {modeSwitch}
                </div>
            )}
            <div className="hidden min-w-0 flex-1 items-center justify-between gap-1 px-1 md:flex">
                {stepItems.map((step, index) => {
                    const isActive = activeStep === step.id;
                    const isDone = activeStep > step.id || (step.id === 3 && !!result?.solutions.length);
                    const isClickable = canOpenStep(step.id);
                    const isLast = index === stepItems.length - 1;

                    return (
                        <Fragment key={step.id}>
                            <button
                                type="button"
                                disabled={!isClickable}
                                onClick={() => openStep(step.id)}
                                aria-label={`Bước ${step.id}: ${step.label}`}
                                aria-current={isActive ? 'step' : undefined}
                                className="group relative z-10 flex min-h-11 min-w-0 items-center gap-2 text-left transition-opacity focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-45"
                            >
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${isDone
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : isActive
                                        ? 'bg-[#004A98] text-white shadow-sm ring-2 ring-blue-100 ring-offset-1'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200 group-hover:bg-gray-200'
                                    }`}>
                                    {isDone ? <Check className="h-4 w-4" /> : step.id}
                                </div>
                                <span className={`hidden text-sm transition-colors md:block ${isActive ? 'text-[#004A98] font-bold' : isDone ? 'text-emerald-700 font-bold' : 'text-gray-500 font-medium'
                                    }`}>
                                    {step.label}
                                </span>
                            </button>

                            {!isLast && (
                                <div className={`mx-2 h-px flex-1 transition-colors md:mx-4 ${isDone ? 'bg-emerald-400' : 'bg-gray-200'
                                    }`} />
                            )}
                        </Fragment>
                    );
                })}
            </div>
            <select aria-label="Bước xếp lịch nhóm" className="h-11 rounded-lg bg-white px-2 text-sm font-semibold text-[#004A98] md:hidden" value={activeStep} onChange={event => openStep(Number(event.target.value) as GroupScheduleStep)}>
                {stepItems.map(step => <option key={step.id} value={step.id} disabled={!canOpenStep(step.id)}>Bước {step.id}/3 · {step.label}</option>)}
            </select>
        </div>
    );

    const memberFields = (
        <div className="space-y-3">
            <label className="block text-sm font-medium">Tên hiển thị
                <Input
                    className="mt-1 h-11 border-slate-300 bg-white focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-200"
                    placeholder="Bạn A"
                    value={draft.nickname ?? ''}
                    onChange={event => setDraft({ ...draft, nickname: event.target.value })}
                />
            </label>
            <GroupMemberCoursePicker
                catalog={courseCatalog}
                selectedIds={draftCourseIds}
                onChange={setDraftCourseIds}
                canFilterClasses={id => (classOptionsByCourse[id]?.length ?? 0) > 0}
                onFilterClasses={setFilterCourseId}
            />
            {(editingMember || members.length > 0) && <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 [&::-webkit-details-marker]:hidden">
                    <ChevronDown aria-hidden="true" className="size-4 -rotate-90 text-slate-500 group-open:rotate-0" />
                    Ngày muốn nghỉ
                </summary>
                <DayOffFields label="Thành viên muốn nghỉ" value={draft.personalConfig?.daysOff} onChange={daysOff => setDraft({ ...draft, personalConfig: { ...draft.personalConfig, daysOff } })} />
            </details>}
        </div>
    );
    const memberSubmit = <button type="button" disabled={!draftCourseIds.length} className="ustudy-button-primary min-h-11" onClick={submitDraft}>
        {editingMember ? 'Lưu thay đổi' : members.length ? 'Thêm vào nhóm' : 'Tạo liên kết nhóm'}
    </button>;

    const renderMemberStep = () => (
        <section className="ustudy-card space-y-3 p-4 sm:p-5">
            <h2 className="text-base font-semibold">Nhóm của bạn</h2>
            {!members.length ? <>{memberFields}{memberSubmit}</> : <>
                <ul className="divide-y divide-gray-200">
                    {members.map((member, index) => <li key={member.id ?? index}>
                        <button className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm hover:text-[#004A98]" onClick={() => startEditingMember(member, index)}>
                            <span className="min-w-0 truncate font-medium">{member.nickname || 'Thành viên ' + (index + 1)}</span>
                            <span className="shrink-0 text-gray-500">{new Set([...member.sharedCourses, ...member.personalCourses]).size} môn ›</span>
                        </button>
                    </li>)}
                </ul>
                <div className="flex flex-wrap items-start gap-2">
                    <GroupURLShare url={shareUrl} warning={urlWarning} />
                    <button className="ustudy-button-outline min-h-11" onClick={() => { if (editingMemberIndex !== null) resetMemberDraft(); setMemberFormOpen(true); }}>Thêm thành viên</button>
                </div>
                {memberFormOpen && !filterCourseId && <RoadmapDialog title={editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên'} focusTitleOnOpen onClose={() => setMemberFormOpen(false)}
                    footer={<div className="flex w-full items-center justify-between gap-3">
                        {editingMemberIndex !== null && <button className="min-h-11 text-sm text-red-700" onClick={() => { removeMember(editingMemberIndex); resetMemberDraft(); }}>Xóa thành viên</button>}
                        {memberSubmit}
                    </div>}>
                    {memberFields}
                    {solveError && <p role="alert" className="text-sm text-amber-800">{solveError}</p>}
                </RoadmapDialog>}
            </>}
            {filterCourseId && (
                <CourseClassFilterModal
                    courseCode={filterCourseId}
                    courseNameVi={getGroupCourseName(filterCourseId)}
                    isOpen
                    onClose={() => setFilterCourseId(null)}
                    allowedClassesMap={personalAllowedClasses}
                    setAllowedClassesMap={setPersonalAllowedClasses}
                    classPreferenceMap={personalClassPreferences}
                    setClassPreferenceMap={setPersonalClassPreferences}
                />
            )}

        </section>
    );

    const configuredCourses = groupCourses.filter(({ courseId }) => {
        const classes = groupPreferredClasses[courseId];
        const sharing = courseSharing[courseId];
        return classes?.excluded?.length || classes?.preferred?.length || classes?.required?.length
            || (sharing && sharing.mode !== 'required') || sharing?.groups?.length || Object.keys(sharing?.groupClassPreferences ?? {}).length;
    }).length;
    const preferenceSummary = [
        groupPrefs.strategy === 'spread' && 'Trải đều',
        groupPrefs.noGaps && 'Tránh tiết trống',
        groupPrefs.daysOff?.length && 'Nghỉ ' + formatDaysOff(groupPrefs.daysOff),
        configuredCourses && configuredCourses + ' môn có ưu tiên riêng',
    ].filter(Boolean).join(' · ');

    const renderGroupConfigStep = () => (
        <section className="ustudy-card space-y-4 p-4 sm:p-5">
            <h2 className="text-base font-semibold">Ưu tiên của nhóm</h2>
            <div className="max-w-md">
                    {/* Buổi ưu tiên */}
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <Sun className="h-4 w-4 text-[#004A98]" />

                            <label className="text-sm font-semibold text-gray-900">
                                Buổi ưu tiên của nhóm
                            </label>
                        </div>

                        <div className="flex rounded-lg bg-gray-100 p-1">
                            {[
                                { id: "0", label: "Bất kỳ", icon: Zap },
                                { id: "1", label: "Sáng", icon: Sun },
                                { id: "2", label: "Chiều", icon: Moon },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    aria-pressed={groupPrefs.session === item.id}
                                    type="button"
                                    onClick={() =>
                                        setGroupPrefs((current) => ({
                                            ...current,
                                            session: item.id,
                                        }))
                                    }
                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-all ${groupPrefs.session === item.id
                                        ? "bg-white text-[#004A98] shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />

                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

            </div>
            <details className="border-y border-gray-200">
                <summary className="cursor-pointer py-3 text-sm font-semibold">Tùy chỉnh thêm</summary>
                <div className="space-y-4 pb-4">
                    {/* Chiến thuật */}
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-[#004A98]" />

                            <label className="text-sm font-semibold text-gray-900">
                                Chiến thuật xếp lịch
                            </label>
                        </div>

                        <div className="flex rounded-lg bg-gray-100 p-1">
                            {[
                                { id: "compress", label: "Dồn lịch" },
                                { id: "spread", label: "Trải đều" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                        setGroupPrefs((current) => ({
                                            ...current,
                                            strategy: item.id,
                                        }))
                                    }
                                    className={`flex-1 rounded-md px-2 py-2 text-sm font-medium transition-all ${groupPrefs.strategy === item.id
                                        ? "bg-white text-[#004A98] shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cài đặt nâng cao chiếm toàn chiều ngang */}
                <div className="border-gray-200">
                    <div className="py-4">
                        <div className="mt-4 grid gap-5 border-t border-gray-200 pt-4 lg:grid-cols-2">
                            {/* Tiết trống */}
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Tiết trống nhóm
                                </label>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setGroupPrefs((current) => ({
                                            ...current,
                                            noGaps: !current.noGaps,
                                        }))
                                    }
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${groupPrefs.noGaps
                                        ? "border-blue-200 bg-blue-50 text-[#004A98]"
                                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {groupPrefs.noGaps
                                        ? "Hạn chế tối đa tiết trống"
                                        : "Cho phép tiết trống"}
                                </button>
                            </div>

                            {/* Ngày nghỉ */}
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Ngày nhóm muốn nghỉ
                                </label>

                                <div className="flex flex-wrap gap-2">
                                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                                        const offSession = getDayOffSession(groupPrefs.daysOff, day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => setGroupPrefs((current) => ({ ...current, daysOff: cycleDayOffSession(current.daysOff, day) }))}
                                                className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg border text-xs font-bold transition-colors ${offSession === 'all'
                                                    ? 'border-red-500 bg-red-500 text-white'
                                                    : offSession === 'morning'
                                                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                                                        : offSession === 'afternoon'
                                                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                                                            : 'border-gray-200 bg-white text-gray-400 hover:border-red-300'
                                                    }`}
                                                title="Bấm lần lượt: nghỉ cả ngày, nghỉ sáng, nghỉ chiều, bỏ chọn"
                                                aria-label={`${day === 6 ? 'Chủ nhật' : `Thứ ${day + 2}`}: ${offSession ? formatDayOffSession(offSession) : 'Không hạn chế'}`}
                                            >
                                                <span>{day === 6 ? 'CN' : `T${day + 2}`}</span>
                                                {offSession && <span className="mt-0.5 text-[9px] font-medium leading-none">{formatDayOffSession(offSession)}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            <div className="space-y-2 pb-4">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Settings className="h-4 w-4 text-[#004A98]" />Ưu tiên theo môn</h3>
                    <p className="mt-1 text-xs text-gray-500">Chỉnh ưu tiên lớp và cách học cùng cho từng môn.</p>
                </div>
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                    {groupCourses.length === 0 ? (
                        <div className="ustudy-muted-panel text-sm text-gray-500">Chưa có môn nào trong nhóm.</div>
                    ) : (
                        groupCourses.map((course) => {
                            const courseName = getGroupCourseName(course.courseId);
                            const hasDistinctCourseName = courseName !== course.courseId;
                            const classOptions = classOptionsByCourse[course.courseId] ?? [];
                            const hasSharing = course.subscribers.length >= 2;
                            const sharing = courseSharing[course.courseId];
                            const view = courseEditor?.courseId === course.courseId ? courseEditor.view : null;
                            const setView = (next: CourseEditorView) => setCourseEditor({ courseId: course.courseId, view: next });
                            const backToOverview = () => setView('overview');
                            const targetSelection = getTargetSelection(course.courseId);
                            const preferenceTargets = getClassPreferenceTargets(course.courseId, course.subscribers);
                            const globalSelection = groupPreferredClasses[course.courseId];
                            const groupPreferenceCount = preferenceTargets.filter(target => target.id !== 'global'
                                && sharing?.groupClassPreferences?.[target.id]).length;
                            const classSummary = [
                                globalSelection?.excluded?.length && `${globalSelection.excluded.length} lớp bị loại`,
                                globalSelection?.preferred?.length && `${globalSelection.preferred.length} lớp ưu tiên`,
                                globalSelection?.required?.length && `${globalSelection.required.length} lớp bắt buộc`,
                                groupPreferenceCount && `${groupPreferenceCount} thiết lập riêng`,
                            ].filter(Boolean).join(' · ');

                            return (
                                <div key={course.courseId} className="min-w-0">
                                    <button type="button" className="w-full border-b border-gray-200 py-3 text-left text-sm font-medium" onClick={() => setView('overview')}>
                                        {courseName} <span className="text-xs text-gray-500">{hasDistinctCourseName && `${course.courseId} · `}{course.subscribers.length} người</span>
                                    </button>
                                    {view && <RoadmapDialog
                                        key={view}
                                        title={view === 'classes' ? 'Ưu tiên lớp' : view === 'sharing' ? 'Học cùng nhau' : courseName}
                                        description={view === 'overview' && !hasDistinctCourseName ? undefined
                                            : view !== 'overview' && hasDistinctCourseName ? `${course.courseId} · ${courseName}` : course.courseId}
                                        focusTitleOnOpen
                                        onClose={view === 'overview' ? () => setCourseEditor(null) : backToOverview}
                                        footer={view !== 'overview' && <button type="button" onClick={backToOverview} className="ustudy-button-primary min-h-11 justify-center">Quay lại</button>}
                                    >
                                        {view === 'overview' && <div className="space-y-3">
                                            <GroupCourseMemberNames names={course.subscribers.map(index => members[index]?.nickname || `Thành viên ${index + 1}`)} />
                                            {classOptions.length > 0 || hasSharing ? (
                                                <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
                                                    {classOptions.length > 0 && <CoursePreferenceAction icon={ListFilter} title="Ưu tiên lớp" summary={classSummary || 'Chưa đặt ưu tiên'} onClick={() => setView('classes')} />}
                                                    {hasSharing && <CoursePreferenceAction icon={Users} title="Học cùng nhau" summary={getCourseSharingSummary(sharing)} onClick={() => setView('sharing')} />}
                                                </div>
                                            ) : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Chưa có dữ liệu lớp cho môn này.</p>}
                                        </div>}
                                        {view === 'sharing' && <CourseSharingForm
                                            courseId={course.courseId}
                                            subscribers={course.subscribers}
                                            members={members}
                                            value={sharing}
                                            onChange={(nextRule) => {
                                                setCourseSharing(current => ({ ...current, [course.courseId]: nextRule }));
                                                setClassPreferenceTargetByCourse(current => ({ ...current, [course.courseId]: 'global' }));
                                            }}
                                        />}
                                        {view === 'classes' && (
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center justify-between gap-2 bg-white pb-1">
                                                    <span className="text-xs font-medium text-gray-500">Áp dụng cho</span>
                                                    <AppSelect value={classPreferenceTargetByCourse[course.courseId] ?? 'global'} onChange={(value) => setClassPreferenceTargetByCourse((current) => ({ ...current, [course.courseId]: value }))} options={preferenceTargets} ariaLabel={`Chọn nhóm áp dụng ưu tiên lớp cho ${course.courseId}`} className="w-44" triggerClassName="h-8 px-2.5 text-xs" menuClassName="right-0 left-auto w-48" />
                                                </div>
                                                {classOptions.map((classOption) => {
                                                    const selectedLevel = getGroupClassPreferenceLevel(course.courseId, classOption.id);

                                                    return (
                                                        <div
                                                            key={classOption.id}
                                                            className={`flex w-full flex-col gap-3 rounded-lg border p-2 text-left transition-colors sm:flex-row sm:items-start sm:justify-between ${selectedLevel === 'excluded' ? 'border-rose-300 bg-rose-50 text-rose-950' : selectedLevel === 'required' ? 'border-red-300 bg-red-50 text-red-950' : selectedLevel === 'preferred' ? 'border-[#004A98] bg-blue-50 text-blue-950' : 'border-gray-200 bg-white text-gray-700'}`}
                                                        >
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block font-mono text-sm font-semibold">{classOption.id.replace(/_/g, ' ')}</span>
                                                                <span className={`mt-1 block text-xs leading-relaxed ${selectedLevel === 'excluded' ? 'text-rose-700' : selectedLevel === 'required' ? 'text-red-700' : selectedLevel === 'preferred' ? 'text-blue-700' : 'text-gray-500'}`}>
                                                                    {classOption.schedule.length > 0 ? classOption.schedule.join(', ') : 'Chưa có lịch học'}
                                                                </span>
                                                            </span>
                                                            <span className="grid grid-cols-2 gap-1 rounded-lg bg-white p-1 sm:w-[300px] sm:grid-cols-4">
                                                                {[
                                                                    { value: 'excluded' as const, label: 'Cấm' },
                                                                    { value: null, label: 'Chọn' },
                                                                    { value: 'preferred' as const, label: 'Ưu tiên' },
                                                                    { value: 'required' as const, label: 'Bắt buộc' },
                                                                ].map((item) => (
                                                                    <button
                                                                        key={item.label}
                                                                        type="button"
                                                                        onClick={() => setGroupClassPreferenceLevel(course.courseId, classOption.id, item.value)}
                                                                        className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${selectedLevel === item.value ? item.value === 'excluded' ? 'bg-rose-600 text-white' : item.value === 'required' ? 'bg-red-600 text-white' : item.value === 'preferred' ? 'bg-[#004A98] text-white' : 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                                                    >
                                                                        {item.label}
                                                                    </button>
                                                                ))}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {((targetSelection?.excluded?.length ?? 0) + (targetSelection?.preferred?.length ?? 0) + (targetSelection?.required?.length ?? 0)) > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => clearGroupClassPreference(course.courseId)}
                                                        className="text-xs font-medium text-gray-500 hover:text-red-600"
                                                    >
                                                        Bỏ ưu tiên lớp
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </RoadmapDialog>}
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
            </details>
            {preferenceSummary && <p className="text-xs text-slate-600">{preferenceSummary}</p>}
            {validationIssues.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
                    <div className="flex items-start gap-2 px-4 py-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-amber-950">Kiểm tra cấu hình trước khi xếp</p><p className="mt-0.5 text-xs text-amber-800">Các lý do dưới đây được đối chiếu trực tiếp với lớp mở, lịch bận và bộ lọc hiện tại.</p></div></div>
                    <div className="divide-y divide-amber-200 border-t border-amber-200 bg-white/70">
                        {validationIssues.map((issue) => <details key={issue.id} className="group px-4 py-2.5"><summary className="cursor-pointer list-none text-sm font-medium text-gray-900">{issue.severity === 'error' ? 'Không thể xếp' : 'Có thể phải tách nhóm'} · {issue.title}</summary><p className="mt-1 text-xs text-gray-600">{issue.description}</p>{issue.rejectedClasses?.length ? <div className="mt-2 space-y-1 text-xs text-gray-500">{issue.rejectedClasses.map((entry) => <p key={entry.classId}><span className="font-mono font-medium text-gray-700">{entry.classId}:</span> {entry.reasons.join('; ')}</p>)}</div> : null}</details>)}
                    </div>
                </div>
            ) : null}

            <button type="button" className="ustudy-button-primary min-h-11" disabled={members.length < 2 || solving} onClick={runGroupSolve}>
                {solving ? 'Đang xếp lịch…' : 'Xếp lịch nhóm'}
            </button>
            {members.length < 2 && <p className="text-xs text-slate-600">Cần thêm một thành viên để xếp lịch.</p>}
        </section>
    );

    const openSavedSchedules = () => {
        setSavedSchedules(readFromStorage<SavedSchedule[]>(STORAGE_KEYS.SAVED_SCHEDULES, []));
        setShowListModal(true);
    };
    const renderResultToolbar = (moreActions?: React.ReactNode, memberControl?: React.ReactNode) => {
        const options = result?.solutions ?? [];
        return (
            <div className="space-y-3">
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
                    <div className="col-start-1 row-start-1 min-w-0">
                        {options.length > 1 ? <GroupScheduleOptionJump
                            current={activeResultIndex + 1}
                            total={options.length}
                            onChange={setActiveResultIndex}
                        /> : selectedOption && <span className="text-xs font-medium text-slate-600">Phương án {selectedOption.option}</span>}
                    </div>
                    {options.length > 1 && <div className="col-span-2 col-start-1 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1">
                        <ScheduleOptionSelector
                            compact
                            options={options.map(option => ({ id: option.option, label: String(option.option) }))}
                            activeIndex={activeResultIndex}
                            onChange={setActiveResultIndex}
                            className="mx-auto w-fit lg:mx-0"
                        />
                    </div>}
                    <div className="col-start-2 row-start-1 flex items-center justify-end gap-1.5 sm:gap-2 lg:col-start-3">
                        <button type="button" className="ustudy-button-primary h-11 whitespace-nowrap px-2.5 py-0 text-xs sm:h-8" disabled={!selectedOption} onClick={() => setShowSaveGroupScheduleModal(true)}>Lưu lịch</button>
                        {moreActions ?? <AppSelect ariaLabel="Tùy chọn lịch nhóm" value="" menuClassName="right-0 min-w-44"
                            triggerClassName="h-11 justify-center px-2 py-0 sm:h-8" triggerContent={<MoreHorizontal aria-hidden="true" className="size-4" />}
                            options={[{ id: 'saved', name: 'Lịch đã lưu' }, { id: 'image', name: 'Tạo ảnh tùy chỉnh', disabled: !selectedOption }]}
                            onChange={action => {
                                if (action === 'saved') openSavedSchedules();
                                else { setShowGroupCalendarPreview(true); setIsImageDialogOpen(true); }
                            }} />}
                    </div>
                </div>
                {selectedOption && renderResultNotices()}
                {selectedOption && <div className="flex min-w-0 items-center gap-2 border-b border-slate-200 pb-3 sm:gap-3">
                    <GroupScheduleResultViewTabs
                        value={showGroupCalendarPreview ? 'calendar' : resultViewMode}
                        onChange={view => {
                            setShowGroupCalendarPreview(view === 'calendar');
                            if (view !== 'calendar') setResultViewMode(view);
                        }}
                    />
                    {memberControl}
                </div>}
            </div>
        );
    };

    const missingCourses = (result?.density ?? []).filter(course => selectedOption && course.subscribers.some(index =>
        !selectedOption.schedules.find(schedule => schedule.memberIndex === index)?.items.some(item => item.courseId === course.courseId)));
    const renderResultNotices = () => (missingCourses.length > 0 || result?.warnings.length ? (
        <div className="space-y-2">
            {missingCourses.length > 0 && <p role="status" className="text-sm text-amber-800">Chưa xếp đủ môn: {missingCourses.map(course => course.courseId).join(', ')}</p>}
            {result?.warnings.length ? (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {result.warnings.map((warning) => (
                        <div key={warning}>{warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    ) : null);

    const renderResultStep = () => (
        <section className="ustudy-card space-y-3 p-4 sm:p-5">
            {(!showGroupCalendarPreview || !result?.solutions.length) && <>{renderResultToolbar()}{!selectedOption && result?.warnings.map(warning => <p key={warning} className="text-sm text-amber-800">{warning}</p>)}</>}
            {result?.solutions.length ? (
                showGroupCalendarPreview ? (
                    <GroupScheduleCalendarPreview
                        isImageDialogOpen={isImageDialogOpen}
                        setIsImageDialogOpen={setIsImageDialogOpen}
                        onOpenSaved={openSavedSchedules}
                        renderToolbar={renderResultToolbar}
                        options={result.solutions}
                        activeOptionIndex={activeResultIndex}
                        activeMemberIndex={activePreviewMemberIndex}
                        setActiveOptionIndex={(index) => {
                            setActiveResultIndex(index);
                        }}
                        setActiveMemberIndex={setActivePreviewMemberIndex}
                        onOpenClassDetails={setOpenClassDetails}
                    />
                ) : (
                    <>
                        {selectedOption && (
                            <GroupScheduleResult
                                option={selectedOption}
                                viewMode={resultViewMode}
                                onOpenClassDetails={setOpenClassDetails}
                                onAnalyzeTradeoff={(tradeoff) => analyzeTradeoff(selectedOption, tradeoff, { ...groupPrefs, groupPreferredClasses, courseSharing })}
                            />
                        )}
                    </>
                )
            ) : (
                <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">{solving ? <div className="flex items-center justify-between gap-2"><span role="status">Đang xếp lịch…</span>
                    <button type="button" className="ustudy-button-outline min-h-11" onClick={() => openStep(2)}>Dừng xếp lịch</button>
                </div> : 'Chưa có kết quả. Hãy kiểm tra lại ưu tiên của nhóm.'}</div>
            )}

            {result?.solutions.length ? <details className="mt-4 border-t border-gray-200 pt-3"><summary className="min-h-11 cursor-pointer text-sm font-medium text-[#004A98]">So sánh các phương án</summary><GroupScheduleComparison options={result.solutions} activeIndex={activeResultIndex} /></details> : null}

            <OpenClassDetailDialog target={openClassDetails} onOpenChange={(open) => { if (!open) setOpenClassDetails(null); }} />

            {selectedOption && showSaveGroupScheduleModal && (
                <RoadmapDialog
                    onClose={() => setShowSaveGroupScheduleModal(false)}
                    title="Lưu lịch nhóm"
                    description="Lưu phương án hiện tại để mở lại trong Lịch đã lưu."
                    footer={(
                        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowSaveGroupScheduleModal(false)}
                                className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={saveSelectedGroupSchedule}
                                disabled={!groupScheduleName.trim()}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#004A98] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#003A78] disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                Lưu lịch
                            </button>
                        </div>
                    )}
                >
                    <div>
                        <label htmlFor="group-schedule-name" className="block text-sm font-semibold text-slate-800">
                            Tên gợi nhớ
                        </label>
                        <input
                            id="group-schedule-name"
                            autoFocus
                            type="text"
                            value={groupScheduleName}
                            onChange={(event) => setGroupScheduleName(event.target.value)}
                            placeholder={`Ví dụ: Nhóm - PA ${selectedOption.option}`}
                            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#004A98] focus:ring-2 focus:ring-[#004A98]/15"
                            onKeyDown={(event) => event.key === 'Enter' && groupScheduleName.trim() && saveSelectedGroupSchedule()}
                        />
                    </div>
                    <p className="border-l-2 border-[#004A98] bg-blue-50 px-3 py-2 text-xs leading-5 text-slate-600">
                        Lưu cả nhóm và các lớp của phương án đang xem. Khi mở lại, bạn vẫn có thể đổi thành viên để xem lịch riêng từng người.
                    </p>
                </RoadmapDialog>
            )}

            <SavedSchedulesModal
                isOpen={showListModal}
                onClose={() => setShowListModal(false)}
                savedSchedules={savedSchedules}
                onLoadSchedule={handleLoadSchedule}
                onDeleteSchedule={handleDeleteSchedule}
            />
        </section>
    );

    return (
        <div className={embedded ? 'space-y-4 pb-20 md:pb-4' : 'mx-auto max-w-6xl space-y-4 pb-20 md:pb-4'}>
            {!embedded && (
                <PageHeader
                    title="Xếp lịch nhóm"
                    description="Mời bạn bè, bấm xếp lịch, rồi chọn phương án phù hợp nhất cho cả nhóm."
                />
            )}

            {renderStepper()}

            {decodeError && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{decodeError} Nếu link không hoạt động, hãy copy toàn bộ URL vào trình duyệt.</span>
                </div>
            )}

            {(solveError || localNotice) && (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{solveError || localNotice}</span>
                </div>
            )}

            {activeStep === 1 && renderMemberStep()}
            {activeStep === 2 && renderGroupConfigStep()}
            {activeStep === 3 && renderResultStep()}
        </div>
    );
}

export default GroupSchedulePage;
