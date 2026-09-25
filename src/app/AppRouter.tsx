import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { StudyRoadmapPage } from '../pages/study-roadmap/StudyRoadmapPage';
import { GradesPage } from '../pages/grades/GradesPage';
import { TuitionPage } from '../pages/tuition/TuitionPage';
import { SchedulePage } from '../pages/schedule/SchedulePage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { PrivacySecurity, SettingUserProfile } from '../features/settings';
import { ExamSchedulePage } from '../pages/exams/ExamSchedulePage';
import { ChatbotPage } from '../pages/chatbot/ChatbotPage';
import { MainLayout } from '../layouts/MainLayout';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useDepartmentData } from '../context/DepartmentContext';
import { CampusInformationPage } from '../pages/campus-information/CampusInformationPage';
import { APP_ROUTES, getPageIdFromPath, getPathForPage } from './routes';
import { APP_CONFIG } from '../config/appConfig';
import { GuidesPage } from '../pages/guides/GuidesPage';

const isWorkspaceEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_WORKSPACE === 'true';
const WorkspacePage = isWorkspaceEnabled
    ? lazy(() => import('../pages/workspace/WorkspacePage').then(({ WorkspacePage: Page }) => ({ default: Page })))
    : null;
const WidgetPreviewPage = import.meta.env.DEV
    ? lazy(() => import('../features/widget-preview/WidgetPreviewPage').then(({ WidgetPreviewPage: Page }) => ({ default: Page })))
    : null;

function RequireConfigured({ isConfigured }: { isConfigured: boolean }) {
    const location = useLocation();

    if (!isConfigured) {
        return <Navigate to={APP_ROUTES.setup} replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}

function SetupRoute({ isConfigured, onPageChange }: { isConfigured: boolean; onPageChange: (page: string) => void }) {
    if (isConfigured) {
        return <Navigate to={APP_ROUTES.dashboard} replace />;
    }

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <SettingUserProfile onPageChange={onPageChange} />
        </div>
    );
}

function RoutedApp() {
    const { semesterNumber, academicYear, isConfigured } = useDepartmentData();
    const selectedSemester = `Học kỳ ${semesterNumber}, ${academicYear}`;
    const location = useLocation();
    const navigate = useNavigate();
    const currentPage = getPageIdFromPath(location.pathname);
    const isPublicPage = currentPage === 'privacy' || currentPage === 'guide';
    const isWidgetPreview = import.meta.env.DEV && location.pathname === '/widget-preview';
    const visiblePage = isWidgetPreview ? 'widget-preview' : isConfigured || isPublicPage ? currentPage : 'setup';

    const handlePageChange = (page: string) => {
        navigate(getPathForPage(page));
    };

    useEffect(() => {
        if (!isWidgetPreview) sessionStorage.setItem(STORAGE_KEYS.PAGE, currentPage);
    }, [currentPage, isWidgetPreview]);

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android') return;
        let active = true;
        const openWidgetRoute = (url?: string) => {
            if (active && url === 'com.ustudy.app://schedule') navigate(APP_ROUTES.schedule);
        };
        const listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => openWidgetRoute(url));
        void CapacitorApp.getLaunchUrl().then((launch) => openWidgetRoute(launch?.url)).catch(() => {});
        return () => {
            active = false;
            void listener.then((handle) => handle.remove());
        };
    }, [navigate]);

    useEffect(() => {
        const handleBackButton = () => {
            if (location.pathname !== APP_ROUTES.dashboard) {
                navigate(APP_ROUTES.dashboard);
                return;
            }

            CapacitorApp.exitApp();
        };

        const listener = CapacitorApp.addListener('backButton', handleBackButton);

        return () => {
            void listener.then((handle) => handle.remove());
        };
    }, [location.pathname, navigate]);

    return (
        <MainLayout
            currentPage={visiblePage}
            onPageChange={handlePageChange}
            selectedSemester={selectedSemester}
        >
            <Routes>
                <Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.dashboard} replace />} />
                <Route path={APP_ROUTES.privacy} element={<PrivacySecurity />} />
                <Route path={`${APP_ROUTES.guide}/*`} element={<GuidesPage />} />
                {WorkspacePage && (
                    <Route
                        path="/ad/*"
                        element={(
                            <Suspense fallback={<div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#004A98]" /></div>}>
                                <WorkspacePage />
                            </Suspense>
                        )}
                    />
                )}
                {WidgetPreviewPage && (
                    <Route
                        path="/widget-preview"
                        element={(
                            <Suspense fallback={<div className="flex h-40 items-center justify-center text-sm text-slate-500">Đang mở bản xem trước…</div>}>
                                <WidgetPreviewPage />
                            </Suspense>
                        )}
                    />
                )}
                <Route path={APP_ROUTES.setup} element={<SetupRoute isConfigured={isConfigured} onPageChange={handlePageChange} />} />

                <Route element={<RequireConfigured isConfigured={isConfigured} />}>
                    <Route path={APP_ROUTES.dashboard} element={<DashboardPage />} />
                    <Route path={`${APP_ROUTES.studyRoadmap}/*`} element={<StudyRoadmapPage />} />
                    <Route path={APP_ROUTES.legacyGroupSchedule} element={<StudyRoadmapPage />} />
                    <Route path={APP_ROUTES.grades} element={<GradesPage />} />
                    <Route path={APP_ROUTES.tuition} element={<TuitionPage selectedSemester={selectedSemester} />} />
                    <Route path={`${APP_ROUTES.campus}/*`} element={<CampusInformationPage />} />
                    <Route path={APP_ROUTES.legacyCampusMap} element={<Navigate to={APP_ROUTES.campusMap} replace />} />
                    <Route path={APP_ROUTES.schedule} element={<SchedulePage selectedSemester={selectedSemester} />} />
                    <Route path={APP_ROUTES.examSchedule} element={<ExamSchedulePage />} />
                    <Route
                        path={APP_ROUTES.chatbot}
                        element={APP_CONFIG.CHATBOT_ENABLED ? <ChatbotPage /> : <Navigate to={APP_ROUTES.dashboard} replace />}
                    />
                    <Route path={APP_ROUTES.settings} element={<SettingsPage onPageChange={handlePageChange} />} />
                </Route>

                <Route path="*" element={<Navigate to={isConfigured ? APP_ROUTES.dashboard : APP_ROUTES.setup} replace />} />
            </Routes>
        </MainLayout>
    );
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <RoutedApp />
        </BrowserRouter>
    );
}
