import { Clock3, RotateCcw, Settings2, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { AppSelect } from '../../../components/ui/form/app-select';
import { Button } from '../../../components/ui/form/button';
import { AppDialog } from '../../../components/ui/overlays/app-dialog';
import { useAppNotification } from '../../../context/NotificationContext';
import { useCampus } from '../../../context/CampusContext';
import { useDepartmentData } from '../../../context/DepartmentContext';
import {
  type UserWorkloadOverride,
  type UserWorkloadOverrideMode,
} from '../../../domain/schedule-workload';
import { useStudentDb } from '../../../hooks/useStudentDb';
import { buildScheduleWorkloadDiagnostics } from '../../visual-schedule/services/workload-diagnostics';
import {
  getProgramScheduleWorkloadOverrides,
  saveProgramScheduleWorkloadOverrides,
} from '../services/schedule-workload-preferences';

const MODE_OPTIONS = [
  { id: 'system', name: 'Theo quy tắc hệ thống' },
  { id: 'separate', name: 'Tách riêng LT / TH / BT' },
  { id: 'lt_plus_lab', name: 'Cộng LT + TH' },
  { id: 'lt_plus_exercise', name: 'Cộng LT + BT' },
  { id: 'lab_as_lt', name: 'Dùng giờ TH cho LT' },
  { id: 'exercise_as_lt', name: 'Dùng giờ BT cho LT' },
  { id: 'custom', name: 'Nhập tổng tiết thủ công' },
];

const MODE_LABELS: Record<string, string> = Object.fromEntries(
  MODE_OPTIONS.map((option) => [option.id, option.name]),
);

const SOURCE_LABELS = {
  user: 'Tùy chỉnh',
  academic_rule: 'Quy tắc hệ thống',
  automatic_fallback: 'Tự động',
  default: 'Mặc định',
} as const;

export function ScheduleWorkloadSettings() {
  const { registrations } = useStudentDb();
  const { defaultCampusId } = useCampus();
  const { data, facultyId, majorId, cohortId } = useDepartmentData();
  const { addNotification } = useAppNotification();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draftOverrides, setDraftOverrides] = useState<Record<string, UserWorkloadOverride>>({});

  const academicContext = useMemo(() => ({
    campusId: defaultCampusId,
    facultyId,
    majorId,
    cohortId,
  }), [cohortId, defaultCampusId, facultyId, majorId]);

  useEffect(() => {
    setDraftOverrides(getProgramScheduleWorkloadOverrides(academicContext));
  }, [academicContext, open]);

  const rows = useMemo(() => buildScheduleWorkloadDiagnostics({
    registrations: Array.isArray(registrations) ? registrations : [],
    coursesMeta: Array.isArray(data.courses) ? data.courses : [],
    academicContext,
    userOverrides: draftOverrides,
  }), [academicContext, data.courses, draftOverrides, registrations]);

  const filteredRows = rows.filter((row) => (
    `${row.courseId} ${row.courseName}`.toLowerCase().includes(search.trim().toLowerCase())
  ));
  const academicRuleCount = rows.filter((row) => row.resolved.academicRuleId).length;
  const fallbackCount = rows.filter((row) => row.components.some((component) => component.ruleSource === 'automatic_fallback')).length;
  const warningCount = rows.filter((row) => row.resolved.warnings.length > 0).length;
  const overrideCount = Object.keys(draftOverrides).length;

  const updateMode = (courseId: string, value: string) => {
    setDraftOverrides((current) => {
      const next = { ...current };
      if (value === 'system') delete next[courseId];
      else next[courseId] = {
        ...next[courseId],
        mode: value as UserWorkloadOverrideMode,
        ...(value === 'custom' ? { customHours: next[courseId]?.customHours || 0 } : {}),
      };
      return next;
    });
  };

  const handleSave = () => {
    saveProgramScheduleWorkloadOverrides(academicContext, draftOverrides);
    addNotification({
      title: 'Đã cập nhật cách tính số tuần',
      message: 'Thời khóa biểu đã được tính lại theo quy tắc vừa lưu.',
      type: 'success',
    });
    setOpen(false);
  };

  const handleReset = () => {
    setDraftOverrides({});
  };

  return (
    <div className="ustudy-settings-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="ustudy-settings-title">
            <Clock3 className="ustudy-settings-title-icon" />Cách tính số tuần học
          </h2>
          <p className="ustudy-settings-description">
            Kiểm tra cách UStudy phân bổ giờ lý thuyết, thực hành và bài tập cho từng môn.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span><strong className="tabular-nums text-slate-900">{academicRuleCount}</strong> quy tắc hệ thống</span>
            <span><strong className="tabular-nums text-slate-900">{fallbackCount}</strong> fallback tự động</span>
            <span><strong className="tabular-nums text-slate-900">{overrideCount}</strong> tùy chỉnh</span>
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <TriangleAlert className="h-4 w-4" />{warningCount} môn cần kiểm tra
              </span>
            )}
          </div>
        </div>
        <Button type="button" variant="outline" className="min-h-11 shrink-0" onClick={() => setOpen(true)}>
          <Settings2 />Quản lý quy tắc
        </Button>
      </div>

      <AppDialog
        open={open}
        onOpenChange={setOpen}
        title="Cách tính số tuần học"
        description="Quy tắc hệ thống chỉ bị thay đổi khi bạn tạo tùy chỉnh riêng cho môn."
        icon={Clock3}
        size="xl"
        mobileFullScreen
        contentClassName="space-y-4"
        footer={(
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={overrideCount === 0}>
              <RotateCcw />Khôi phục tất cả
            </Button>
            <div className="flex gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="button" className="bg-[#004A98] hover:bg-[#003A78]" onClick={handleSave}>Lưu thay đổi</Button>
            </div>
          </div>
        )}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Tìm môn học</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nhập mã hoặc tên môn"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#004A98] focus:ring-2 focus:ring-[#004A98]/20"
          />
        </label>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Chưa có dữ liệu đăng ký học phần để kiểm tra cách tính số tuần.
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Không tìm thấy môn phù hợp với từ khóa.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((row) => {
              const selectedMode = draftOverrides[row.courseId]?.mode ?? 'system';
              const hasOverride = Boolean(draftOverrides[row.courseId]);
              const primaryComponent = row.components.find((component) => component.component === 'LT') ?? row.components[0];
              return (
                <section key={row.courseId} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{row.courseId} · {row.courseName}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {primaryComponent ? SOURCE_LABELS[primaryComponent.ruleSource] : 'Chưa xác định'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        CTĐT: LT {Number(row.courseMeta?.theory_hours) || 0} · TH {Number(row.courseMeta?.lab_hours) || 0} · BT {Number(row.courseMeta?.exercise_hours) || 0}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {row.components.map((component) => (
                          <span key={component.component} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs text-blue-800">
                            {component.component}: {component.requiredPeriods} tiết · {component.totalWeeks || '—'} tuần
                          </span>
                        ))}
                      </div>
                      {row.resolved.academicRuleReason && (
                        <p className="mt-2 text-xs leading-5 text-slate-600">{row.resolved.academicRuleReason}</p>
                      )}
                      {row.resolved.warnings.map((warning) => (
                        <p key={warning.code} className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-amber-700">
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{warning.message}
                        </p>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <AppSelect
                        ariaLabel={`Quy tắc cho ${row.courseId}`}
                        value={selectedMode}
                        options={MODE_OPTIONS}
                        onChange={(value) => updateMode(row.courseId, value)}
                      />
                      {selectedMode === 'custom' && (
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-slate-700">Tổng số tiết LT</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={draftOverrides[row.courseId]?.customHours || ''}
                            onChange={(event) => setDraftOverrides((current) => ({
                              ...current,
                              [row.courseId]: {
                                mode: 'custom',
                                customHours: Number(event.target.value) || 0,
                              },
                            }))}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm tabular-nums outline-none focus:border-[#004A98] focus:ring-2 focus:ring-[#004A98]/20"
                          />
                        </label>
                      )}
                      {hasOverride && (
                        <p className="text-xs text-slate-500">Đang ghi đè: {MODE_LABELS[selectedMode]}</p>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </AppDialog>
    </div>
  );
}
