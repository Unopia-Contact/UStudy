import { AppSelect } from "../../../components/ui/form";
import { COHORTS, getProgramDataSourceCohort } from "../../../assets/data/academic-programs/registry";
import { useDepartmentData } from "../../../context/DepartmentContext";
import { useCampus } from "../../../context/CampusContext";
import { CAMPUS_OPTIONS } from "../../../domain/campus";
import { CheckCircle, GraduationCap, Shield } from "lucide-react";
import { useAppNotification } from "../../../context/NotificationContext";
import { savePlain } from "../../../helpers/localStorage/save";
import { STORAGE_KEYS } from "../../../config/storageKeys";
import { ImportData } from "./importData";

export function SettingUserProfile({ onPageChange }: { onPageChange: (page: string) => void }) {
    const {
        facultyId, majorId, cohortId, academicYear,
        currentFaculty, faculties, academicYears,
        setFaculty, setMajor, setCohort, setAcademicYear,
        isConfigured, setIsConfigured
    } = useDepartmentData();
    const { defaultCampusId, setDefaultCampusId } = useCampus();
    const { addNotification } = useAppNotification();
    const programDataSourceCohort = getProgramDataSourceCohort(cohortId, facultyId, majorId);
    const programDataSourceLabel = COHORTS.find((cohort) => cohort.id === programDataSourceCohort)?.name ?? programDataSourceCohort;
    const isUsingSharedProgramData = Boolean(programDataSourceCohort && programDataSourceCohort !== cohortId);
    return (
        <div className="ustudy-settings-card">
            {!isConfigured &&
                <div className="mb-6 w-full flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng bạn</h2>
                    <p className="text-gray-500">Vui lòng thiết lập chương trình đào tạo của bạn để bắt đầu sử dụng hệ thống.</p>
                    <div className="p-2"></div>
                </div>
            }
            <h2 className="ustudy-settings-title"><GraduationCap className="ustudy-settings-title-icon" />Chương trình đào tạo</h2>
            <p className="ustudy-settings-description">Chọn Cơ sở mặc định, Khóa tuyển, Khoa, Ngành và Năm học để hiển thị đúng dữ liệu của bạn.</p>


            <div className="grid grid-cols-1 gap-4 md:gap-6">
                <AppSelect
                    label="Cơ sở mặc định"
                    value={defaultCampusId}
                    options={CAMPUS_OPTIONS}
                    onChange={(value) => setDefaultCampusId(value as typeof defaultCampusId)}
                />

                {defaultCampusId === 'cho-quan' && (
                    <div>
                        <p className="text-xs leading-5 text-gray-500">
                            Hiện tại chương trình đào tạo và học phí cơ sở 1 - Chợ Quán vẫn chưa hoàn thiện. Các tính năng khác vẫn sử dụng bình thường.
                        </p>
                    </div>
                )}

                <AppSelect
                    label="Khóa tuyển"
                    value={cohortId}
                    options={COHORTS}
                    onChange={setCohort}
                />

                <AppSelect
                    label="Khoa"
                    value={facultyId}
                    options={[...faculties].sort((a, b) => a.name.localeCompare(b.name))}
                    onChange={setFaculty}
                />

                <AppSelect
                    label="Ngành"
                    value={majorId}
                    options={[...(currentFaculty?.majors || [])].sort((a, b) => a.name.localeCompare(b.name))}
                    onChange={setMajor}
                />

                <div className="hidden md:block">
                    <AppSelect
                        label="Năm học"
                        subLabel="(Học phí)"
                        value={academicYear}
                        options={academicYears}
                        onChange={setAcademicYear}
                        disabled={true}
                    />
                </div>
            </div>
            {
                isUsingSharedProgramData && (
                    <p className="mt-2 text-xs text-blue-700 pt-3">
                        Lưu ý: Dữ liệu chương trình hiện đang dùng theo {programDataSourceLabel}.
                    </p>
                )
            }

            <div className="mt-5 border-t border-gray-200 pt-4 md:mt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    {!isConfigured && <ImportData compact completeSetup importButtonLabel="Nhập dữ liệu (JSON)" />}

                    <button
                        onClick={() => {
                            savePlain(STORAGE_KEYS.FACULTY_ID, facultyId);
                            savePlain(STORAGE_KEYS.MAJOR_ID, majorId);
                            savePlain(STORAGE_KEYS.COHORT_ID, cohortId);
                            savePlain(STORAGE_KEYS.ACADEMIC_YEAR, academicYear);
                            setIsConfigured(true);
                            addNotification({
                                title: 'Thiết lập thành công',
                                message: 'Thông tin chương trình đào tạo đã được lưu.',
                                type: 'success'
                            });
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#004A98] px-4 text-sm font-medium text-white transition-colors hover:bg-[#003B7A]"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {isConfigured ? 'Lưu thiết lập' : 'Xác nhận thông tin'}
                    </button>
                </div>
            </div>
            {/* Privacy link - chỉ hiện khi chưa cấu hình */}
            {
                !isConfigured && (
                    <div className="mt-6 pt-5 border-t border-gray-200">
                        <button
                            onClick={(e) => { e.preventDefault(); onPageChange('privacy'); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold">Bảo mật & Quyền dữ liệu</p>
                                <p className="text-xs text-blue-500">Tìm hiểu cách chúng tôi bảo vệ dữ liệu của bạn</p>
                            </div>
                        </button>
                    </div>
                )
            }
        </div >
    );
}
