import { useState } from 'react';
import { ChevronLeft, ChevronRight, Database, GraduationCap, HardDriveDownload, LockKeyhole, MailWarning, RefreshCw, UserRound, type LucideIcon } from 'lucide-react';
import { DataSourceCenter, ImportData, OpticalDataTransfer, PortalSyncTools, ReportError, SettingUserProfile } from '../../features/settings';
import { useStudentDb } from '../../hooks/useStudentDb';
import { ChangePinModal } from '../../components/security';
import { useCrypto } from '../../context/CryptoContext';
import { PageHeader } from '../../components/layout/page-header';
import { PageShell } from '../../components/layout/page-shell';

type SettingsSection = 'program' | 'portal' | 'transfer' | 'sources' | 'security' | 'report';

const settingsSections: Array<{ id: SettingsSection; label: string; icon: LucideIcon }> = [
    { id: 'program', label: 'Chương trình đào tạo', icon: GraduationCap },
    { id: 'portal', label: 'Đồng bộ Portal', icon: RefreshCw },
    { id: 'transfer', label: 'Sao lưu & chuyển dữ liệu', icon: HardDriveDownload },
    { id: 'sources', label: 'Nguồn & lịch sử dữ liệu', icon: Database },
    { id: 'security', label: 'Bảo mật', icon: LockKeyhole },
    { id: 'report', label: 'Báo lỗi', icon: MailWarning },
];

export function SettingsPage({ onPageChange }: { onPageChange: (page: string) => void }) {
    const { name } = useStudentDb();
    const { lock, hasData } = useCrypto();
    const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
    const [showChangePinModal, setShowChangePinModal] = useState(false);
    const visibleSections = settingsSections.filter((section) => section.id !== 'security' || hasData);
    const selectedSection = activeSection ?? 'program';
    const selectedLabel = visibleSections.find((section) => section.id === selectedSection)?.label ?? 'Chương trình đào tạo';

    const handleLockNow = () => {
        lock();
        window.location.reload();
    };

    return (
        <PageShell header={<PageHeader title="Cài đặt" description={<span className="hidden md:inline">Quản lý dữ liệu và tùy chọn của bạn.</span>} />}>
            <div className="mx-auto grid w-full max-w-5xl min-w-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                <nav aria-label="Danh mục cài đặt" className={activeSection ? 'hidden lg:block' : 'block'}>
                    <div className="mb-4 flex min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <UserRound className="h-5 w-5 shrink-0 text-[#004A98]" />
                        <span className="min-w-0 truncate text-sm font-semibold text-gray-900">{name || 'Tài khoản của bạn'}</span>
                    </div>
                    <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white lg:divide-y-0 lg:border-0 lg:bg-transparent">
                        {visibleSections.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveSection(id)}
                                aria-current={selectedSection === id ? 'page' : undefined}
                                className={`flex min-h-14 w-full min-w-0 items-center gap-3 px-4 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30 lg:mb-1 lg:min-h-11 lg:rounded-lg lg:px-3 ${selectedSection === id ? 'text-[#004A98] lg:bg-[#EAF3FF] lg:font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                <span className="min-w-0 flex-1">{label}</span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 lg:hidden" aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                </nav>

                <div className={`ustudy-settings-detail min-w-0 ${activeSection ? 'block' : 'hidden lg:block'}`}>
                    <button type="button" onClick={() => setActiveSection(null)} className="mb-4 flex min-h-11 items-center gap-2 text-sm font-semibold text-[#004A98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30 lg:hidden">
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />Cài đặt
                    </button>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 lg:hidden">{selectedLabel}</h2>

                    {selectedSection === 'program' && <SettingUserProfile onPageChange={onPageChange} />}
                    {selectedSection === 'portal' && <section className="ustudy-settings-card"><h2 className="ustudy-settings-title">Đồng bộ Portal</h2><PortalSyncTools /></section>}
                    {selectedSection === 'transfer' && <section className="ustudy-settings-card space-y-6"><ImportData /><div className="border-t border-gray-200 pt-5"><OpticalDataTransfer /></div></section>}
                    {selectedSection === 'sources' && <DataSourceCenter defaultExpanded />}
                    {selectedSection === 'security' && hasData && (
                        <section className="ustudy-settings-card">
                            <h2 className="ustudy-settings-title">Bảo mật</h2>
                            <p className="ustudy-settings-description hidden md:block">Dữ liệu của bạn được mã hóa và chỉ mở bằng mật khẩu của bạn.</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <button type="button" onClick={() => setShowChangePinModal(true)} className="ustudy-button-outline min-h-11 justify-center font-semibold"><LockKeyhole className="h-4 w-4" />Đổi mật khẩu</button>
                                <button type="button" onClick={handleLockNow} className="ustudy-button-outline min-h-11 justify-center font-semibold"><LockKeyhole className="h-4 w-4" />Khóa ngay</button>
                            </div>
                        </section>
                    )}
                    {selectedSection === 'report' && <ReportError />}
                </div>
            </div>

            {showChangePinModal && <ChangePinModal onClose={() => setShowChangePinModal(false)} />}
        </PageShell>
    );
}
