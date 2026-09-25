import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Book, ClipboardList, ShoppingCart } from 'lucide-react';
import { useCourseData } from '../../hooks/useCourseData';
import { useRegisteredCourses } from '../../hooks/useRegisteredCourses';
import { type ClassSection } from '../../types';
import { NoDataCard } from '../../components/feedback';
import { PageHeader } from '../../components/layout/page-header';
import { PageShell } from '../../components/layout/page-shell';
import { STORAGE_KEYS } from '../../config';
import { readFromStorage, saveToStorage } from '../../helpers/localStorage/save';
import { getConflicts } from '../../logic/ScheduleValidator';
import { NavigationBar } from './components/NavigationBar';
import { TrainingProgramView } from './components/TrainingProgramView';
import { SelectionView } from './components/SelectionView';
import { CalendarView } from './components/CalenderView';
import { StudyPlanView } from './components/StudyPlanView';
import { SelectionBasket } from './components/SelectionBasket';
import { MobileBottomSheet } from '../../components/ui/overlays/mobile-bottom-sheet';
import { PrerequisiteFlowchart } from './components/PrerequisiteFlowchart';
import { useScheduleSolver } from './hooks/use-schedule-solver';
import { GroupSchedulePage } from '../group-schedule';
import type { Course } from '../../types';
import { createPortal } from 'react-dom';
import { useCampus } from '../../context/CampusContext';
import { STUDY_ROADMAP_TAB_TO_PATH, getStudyRoadmapTabFromPath } from '../../app/routes';
import { tabs, type Tab } from './types';
import {
    createCourseCodeSet,
    normalizeCourseCode,
    omitRegisteredCourseEntries,
    reconcileSelectedCourseIds,
} from '../../logic/course-identity';

// Danh sách các tab
const isStudyRoadmapTab = (value: unknown): value is Tab =>
    value === tabs.trainingProgram || value === tabs.studyPlan || value === tabs.selection || value === tabs.calendar;

export function StudyRoadmapFeature() {
    const { defaultCampusId } = useCampus();
    const location = useLocation();
    const navigate = useNavigate();
    const tabFromPath = getStudyRoadmapTabFromPath(location.pathname);
    const savedTab = readFromStorage<unknown>(STORAGE_KEYS.STUDY_ROADMAP_ACTIVE_TAB, tabs.selection);
    const activeTab = tabFromPath ||
        (location.hash.startsWith('#v1_') ? tabs.calendar : isStudyRoadmapTab(savedTab) ? savedTab : tabs.selection);
    const setActiveTab = (tab: Tab) => {
        navigate(STUDY_ROADMAP_TAB_TO_PATH[tab]);
    };
    const [viewMode, setViewMode] = useState<'recommend' | 'all'>('all');
    const [selectedCourses, setSelectedCourses] = useState<Set<string>>(() => {
        const saved = readFromStorage<string[]>(STORAGE_KEYS.SELECTED_BASKET, []);
        return Array.isArray(saved) ? new Set(saved) : new Set();
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showFlowchart, setShowFlowchart] = useState(false);
    const [flowchartCourse, setFlowchartCourse] = useState<Course | null>(null);
    const [allowedClassesMap, setAllowedClassesMap] = useState<Record<string, string[]>>(() => {
        return readFromStorage<Record<string, string[]>>(STORAGE_KEYS.ALLOWED_CLASSES_MAP, {});
    });

    // State giỏ hàng mobile: true = mở drawer giỏ hàng
    const [showMobileBasket, setShowMobileBasket] = useState(false);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.ALLOWED_CLASSES_MAP, allowedClassesMap);
    }, [allowedClassesMap]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.SELECTED_BASKET, Array.from(selectedCourses));
    }, [selectedCourses]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.STUDY_ROADMAP_ACTIVE_TAB, activeTab);
    }, [activeTab]);

    useEffect(() => {
        setSearchTerm('');
    }, [activeTab]);

    // Đóng basket drawer khi chuyển tab
    useEffect(() => {
        setShowMobileBasket(false);
    }, [activeTab]);

    useEffect(() => {
        const desktopQuery = window.matchMedia('(min-width: 1024px)');
        const closeBasketOnDesktop = () => {
            if (desktopQuery.matches) setShowMobileBasket(false);
        };
        desktopQuery.addEventListener('change', closeBasketOnDesktop);
        return () => desktopQuery.removeEventListener('change', closeBasketOnDesktop);
    }, []);

    useEffect(() => {
        if (!tabFromPath) {
            navigate(STUDY_ROADMAP_TAB_TO_PATH[activeTab], { replace: true });
        }
    }, [tabFromPath, activeTab, navigate]);

    const { recommended, all, isReady, hasData } = useCourseData();
    const { registeredCourses, registeredSections, registeredMask, registeredCourseCodes } = useRegisteredCourses();
    const { solve: solveRaw, solving, options, setOptions, activeOption, setActiveOption, currentSections, error: solverError } = useScheduleSolver();

    const globalAllCourses = useMemo(
        () => [...all.core, ...all.major, ...all.electives],
        [all.core, all.electives, all.major],
    );
    const normalizedRegisteredCourseCodes = useMemo(
        () => createCourseCodeSet(registeredCourseCodes),
        [registeredCourseCodes],
    );
    const selectionReconciliation = useMemo(
        () => reconcileSelectedCourseIds(selectedCourses, normalizedRegisteredCourseCodes, globalAllCourses),
        [globalAllCourses, normalizedRegisteredCourseCodes, selectedCourses],
    );
    const pendingSelectedCourses = selectionReconciliation.selectedCourseIds;

    useEffect(() => {
        if (selectionReconciliation.removedCourseIds.length === 0) return;

        setSelectedCourses(selectionReconciliation.selectedCourseIds);
        setAllowedClassesMap((current) => omitRegisteredCourseEntries(
            current,
            normalizedRegisteredCourseCodes,
            globalAllCourses,
        ));
        setOptions([]);
    }, [globalAllCourses, normalizedRegisteredCourseCodes, selectionReconciliation, setOptions]);

    // Wrap solve() to automatically include registeredMask
    const solve = (courses: import('../../types').Course[], allowedClassesMap: Record<string, string[]>, prefs?: import('./hooks/use-schedule-solver').SolverPreferences) => {
        solveRaw(courses, allowedClassesMap, prefs, registeredMask);
    };

    const currentSource = viewMode === 'recommend' ? recommended : all;
    const handleCourseToggle = (courseId: string) => {
        const course = globalAllCourses.find((item) => item.id === courseId || item.code === courseId);
        if (normalizedRegisteredCourseCodes.has(normalizeCourseCode(course?.code || courseId))) return;

        setSelectedCourses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(courseId)) {
                newSet.delete(courseId);
            } else {
                newSet.add(courseId);
            }
            return newSet;
        });
    };

    const handleShowFlowchart = (course: Course) => {
        setFlowchartCourse(course);
        setShowFlowchart(true);
    };

    const filteredCourses = {
        core: currentSource.core.filter(c =>
            c.nameVi.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.id.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        major: currentSource.major.filter(c =>
            c.nameVi.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.id.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        electives: currentSource.electives.filter(c =>
            c.nameVi.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.id.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    };

    const confirmedSections: ClassSection[] = currentSections;
    const handleGetConflicts = (section: ClassSection) => getConflicts(section, [...registeredSections, ...confirmedSections], defaultCampusId);
    
    const MobileBasketControls = (
        <>
            {showMobileBasket && (
                <MobileBottomSheet
                    title="Giỏ môn học"
                    eyebrow={`${pendingSelectedCourses.size} môn đã chọn`}
                    ariaLabel="Giỏ môn học"
                    onClose={() => setShowMobileBasket(false)}
                    className="lg:hidden"
                    sheetClassName="h-[min(80dvh,42rem)]"
                    contentClassName="p-4"
                    sheetId="study-roadmap-basket"
                >
                    <SelectionBasket
                        selectedCourses={Array.from(pendingSelectedCourses)
                            .map(id => globalAllCourses.find(c => c.id === id)!)
                            .filter(Boolean)}
                        registeredCourseCodes={registeredCourseCodes}
                        courseCatalog={globalAllCourses}
                        onRemoveCourse={handleCourseToggle}
                        allowedClassesMap={allowedClassesMap}
                        setAllowedClassesMap={setAllowedClassesMap}
                    />
                </MobileBottomSheet>
            )}

            {/* FAB button - chỉ hiện khi đang ở tab selection và chưa mở drawer */}
            {activeTab === 'selection' && !showMobileBasket && (
                createPortal(
                    <button
                        type="button"
                        className="fixed bottom-[calc(var(--ustudy-mobile-nav-height)+1rem)] right-4 z-30 flex min-h-11 items-center gap-2 rounded-lg bg-[#004A98] px-4 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#003A78] md:hidden"
                        onClick={() => setShowMobileBasket(true)}
                    >
                        <ShoppingCart className="h-5 w-5" />
                        Giỏ môn học
                        {pendingSelectedCourses.size > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-[#004A98]">
                                {pendingSelectedCourses.size}
                            </span>
                        )}
                    </button>,
                    document.body,
                )
            )}
        </>
    );

    if (!isReady) {
        return (
            <div className="flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004A98]"></div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <PageShell
                header={<PageHeader
                    title="Lộ trình học tập"
                    description="Đây là lộ trình học tập của bạn."
                />}
            >
                <NoDataCard />
            </PageShell>
        );
    }

    return (
        <>
            <PageShell
                header={<PageHeader
                    title="Lộ trình học tập"
                    description="Chọn môn học và xem lịch trực quan với phát hiện xung đột thời gian."
                />}
            >
                {/* Nội dung chính */}
                <div className="flex-1 w-full min-w-0">
                    {/* Navigation */}
                    <div className="hidden lg:block">
                        <NavigationBar
                            tabs={[
                                // { id: tabs.trainingProgram, label: 'Chương trình đào tạo', icon: Book },
                                { id: tabs.studyPlan, label: 'Kế hoạch học tập', description: 'Tiến độ và lộ trình theo học kỳ', icon: Book },
                                { id: 'selection', label: 'Chọn môn & Học phí', description: 'Chọn học phần và xem chi phí dự kiến', icon: ShoppingCart },
                                { id: 'calendar', label: 'Xếp lịch & Lịch dự kiến', description: 'Tạo phương án lịch cá nhân hoặc nhóm', icon: Calendar, showBadge: true, badgeCount: pendingSelectedCourses.size },
                            ]}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    </div>

                    {/* Mobile Navigation */}
                    <div className="lg:hidden">
                        <NavigationBar
                            tabs={[
                                // { id: tabs.trainingProgram, label: 'Lộ trình', icon: Book },
                                { id: tabs.studyPlan, label: 'Kế hoạch', description: 'Tiến độ theo học kỳ', icon: ClipboardList },
                                { id: 'selection', label: 'Chọn môn', description: 'Học phần và học phí', icon: ShoppingCart },
                                { id: 'calendar', label: 'Xếp lịch', description: 'Lịch dự kiến', icon: Calendar, showBadge: true, badgeCount: pendingSelectedCourses.size },
                            ]}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    </div>

                    <div className="pt-5">
                        {/* Tab 1: Chương trình đào tạo */}
                        {activeTab === 'trainingProgram' && (
                            <TrainingProgramView />
                        )}

                        {/* Tab Kế hoạch học tập: kéo môn vào học kỳ */}
                        {activeTab === 'studyPlan' && (
                            <StudyPlanView />
                        )}

                        {/* Tab 2: Chọn môn học */}
                        {activeTab === 'selection' && (
                            // Desktop: 2 cột. Mobile: 1 cột (giỏ hàng ẩn vào drawer)
                            <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:flex-nowrap">
                                <button
                                    type="button"
                                    onClick={() => setShowMobileBasket(true)}
                                    className="hidden min-h-11 w-full items-center justify-between rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-[#004A98] transition-colors hover:bg-blue-50 md:flex lg:hidden"
                                >
                                    <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Giỏ môn học</span>
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs">{pendingSelectedCourses.size} môn</span>
                                </button>

                                {/* CỘT TRÁI: danh sách môn học */}
                                <div
                                    className="flex-1 min-w-0 w-full overflow-y-auto"
                                    // Desktop: scroll độc lập; Mobile: tự nhiên
                                    style={{ height: undefined }}
                                >
                                    {/* Desktop: fixed height để scroll độc lập */}
                                    <div className="hidden overflow-y-auto lg:block" style={{ height: 'calc(100vh - 11rem)' }}>
                                        <SelectionView
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                            viewMode={viewMode}
                                            setViewMode={setViewMode}
                                            recommended={recommended}
                                            all={all}
                                            filteredCourses={filteredCourses}
                                            selectedCourses={pendingSelectedCourses}
                                            handleCourseToggle={handleCourseToggle}
                                            handleShowFlowchart={handleShowFlowchart}
                                            registeredCourseCodes={registeredCourseCodes}
                                        />
                                    </div>
                                    {/* Mobile: không fixed height */}
                                    <div className="pb-36 md:pb-4 lg:hidden">
                                        <SelectionView
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                            viewMode={viewMode}
                                            setViewMode={setViewMode}
                                            recommended={recommended}
                                            all={all}
                                            filteredCourses={filteredCourses}
                                            selectedCourses={pendingSelectedCourses}
                                            handleCourseToggle={handleCourseToggle}
                                            handleShowFlowchart={handleShowFlowchart}
                                            registeredCourseCodes={registeredCourseCodes}
                                        />
                                    </div>
                                </div>

                                {/* CỘT PHẢI: giỏ hàng - chỉ hiện trên desktop */}
                                <div
                                    className="hidden w-[26vw] flex-shrink-0 lg:block xl:w-[24vw] 2xl:w-[22vw]"
                                    style={{ height: 'calc(100vh - 11rem)' }}
                                >
                                    <SelectionBasket
                                        selectedCourses={Array.from(pendingSelectedCourses)
                                            .map(id => globalAllCourses.find(c => c.id === id)!)
                                            .filter(Boolean)}
                                        registeredCourseCodes={registeredCourseCodes}
                                        courseCatalog={globalAllCourses}
                                        onRemoveCourse={handleCourseToggle}
                                        allowedClassesMap={allowedClassesMap}
                                        setAllowedClassesMap={setAllowedClassesMap}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Lịch trực quan */}
                        {activeTab === 'calendar' && (
                            <CalendarView
                                selectedCourses={pendingSelectedCourses}
                                setActiveTab={setActiveTab}
                                currentSections={currentSections}
                                registeredCourses={registeredCourses}
                                registeredSections={registeredSections}
                                activeOption={activeOption}
                                options={options}
                                allCurrentCourses={globalAllCourses as Course[]}
                                solve={solve}
                                solving={solving}
                                solverError={solverError}
                                setActiveOption={setActiveOption}
                                getConflicts={handleGetConflicts}
                                allowedClassesMap={allowedClassesMap}
                                setSelectedCourses={setSelectedCourses}
                                setAllowedClassesMap={setAllowedClassesMap}
                                setOptions={setOptions}
                                groupScheduleContent={(
                                    <GroupSchedulePage
                                        embedded
                                        selectedCourseIds={pendingSelectedCourses}
                                        allCourses={globalAllCourses as Course[]}
                                        allowedClassesMap={allowedClassesMap}
                                        setAllowedClassesMap={setAllowedClassesMap}
                                        onRemoveSelectedCourse={handleCourseToggle}
                                        onPageChange={() => undefined}
                                    />
                                )}
                            />
                        )}
                    </div>
                </div>

                {showFlowchart && flowchartCourse && (
                    <PrerequisiteFlowchart
                        course={flowchartCourse}
                        allCourses={globalAllCourses as Course[]}
                        onClose={() => setShowFlowchart(false)}
                    />
                )}
            </PageShell>

            {MobileBasketControls}
        </>
    );
}
