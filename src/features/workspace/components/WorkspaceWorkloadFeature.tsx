import { Calculator, Clock3, Database, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { AppSelect } from '../../../components/ui/form/app-select';
import { STORAGE_KEYS } from '../../../config';
import { useCampus } from '../../../context/CampusContext';
import { useDepartmentData } from '../../../context/DepartmentContext';
import type { WorkloadHourSource, WorkloadRuleSource } from '../../../domain/schedule-workload';
import { readFromStorage } from '../../../helpers/localStorage/save';
import { getProgramScheduleWorkloadOverrides } from '../../settings/services/schedule-workload-preferences';
import {
  buildOpenCourseWorkloadDiagnostics,
  type OpenCourseWorkloadDiagnostic,
} from '../../visual-schedule/services/workload-diagnostics';

type WorkloadFilter = 'all' | WorkloadRuleSource | 'warning';

const FILTER_OPTIONS = [
  { id: 'all', name: 'Tất cả cách tính' },
  { id: 'academic_rule', name: 'Quy tắc học vụ' },
  { id: 'automatic_fallback', name: 'Fallback tự động' },
  { id: 'user', name: 'Người dùng ghi đè' },
  { id: 'default', name: 'Mặc định LT / TH / BT' },
  { id: 'warning', name: 'Có cảnh báo' },
];

const SOURCE_LABELS: Record<WorkloadRuleSource, string> = {
  academic_rule: 'Quy tắc học vụ',
  automatic_fallback: 'Fallback tự động',
  user: 'Người dùng ghi đè',
  default: 'Mặc định',
};

const SOURCE_STYLES: Record<WorkloadRuleSource, string> = {
  academic_rule: 'bg-blue-50 text-[#004A98]',
  automatic_fallback: 'bg-amber-50 text-amber-700',
  user: 'bg-violet-50 text-violet-700',
  default: 'bg-gray-100 text-gray-700',
};

const MODE_LABELS: Record<string, string> = {
  separate: 'Tách riêng LT / TH / BT',
  lt_plus_lab: 'LT cộng giờ TH',
  lt_plus_exercise: 'LT cộng giờ BT',
  lab_as_lt: 'Dùng giờ TH cho LT',
  exercise_as_lt: 'Dùng giờ BT cho LT',
  custom: 'Tổng tiết thủ công',
};

const HOUR_SOURCE_LABELS: Record<WorkloadHourSource, string> = {
  theory: 'LT',
  lab: 'TH',
  exercise: 'BT',
};

function getCourseSource(row: OpenCourseWorkloadDiagnostic): WorkloadRuleSource {
  const sources = row.components.flatMap((component) => component.ruleSources);
  return (['user', 'academic_rule', 'automatic_fallback', 'default'] as WorkloadRuleSource[])
    .find((source) => sources.includes(source)) ?? 'default';
}

function formatNumberVariants(values: number[], suffix: string): string {
  const usefulValues = values.filter((value) => value > 0);
  if (usefulValues.length === 0) return `0 ${suffix}`;
  if (usefulValues.length === 1) return `${usefulValues[0]} ${suffix}`;
  return `${usefulValues[0]}–${usefulValues[usefulValues.length - 1]} ${suffix}`;
}

export function WorkspaceWorkloadFeature() {
  const { defaultCampusId, defaultCampus } = useCampus();
  const {
    data,
    facultyId,
    majorId,
    cohortId,
    currentFaculty,
    currentMajor,
    currentCohort,
  } = useDepartmentData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<WorkloadFilter>('all');
  const [dataRevision, setDataRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setDataRevision((revision) => revision + 1);
    window.addEventListener('message', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('message', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const academicContext = useMemo(() => ({
    campusId: defaultCampusId,
    facultyId,
    majorId,
    cohortId,
  }), [cohortId, defaultCampusId, facultyId, majorId]);

  const rows = useMemo(() => buildOpenCourseWorkloadDiagnostics({
    openCourses: readFromStorage<any[]>(STORAGE_KEYS.COURSE_DB_OFFLINE, []),
    coursesMeta: Array.isArray(data.courses) ? data.courses : [],
    academicContext,
    userOverrides: getProgramScheduleWorkloadOverrides(academicContext),
  }), [academicContext, data.courses, dataRevision]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesSearch = !normalizedSearch || `${row.courseId} ${row.courseName}`
      .toLowerCase()
      .includes(normalizedSearch);
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'warning') return row.warnings.length > 0;
    return row.components.some((component) => component.ruleSources.includes(filter));
  });

  const academicRuleCount = rows.filter((row) => row.components.some((component) => component.ruleSources.includes('academic_rule'))).length;
  const fallbackCount = rows.filter((row) => row.components.some((component) => component.ruleSources.includes('automatic_fallback'))).length;
  const overrideCount = rows.filter((row) => row.components.some((component) => component.ruleSources.includes('user'))).length;
  const warningCount = rows.filter((row) => row.warnings.length > 0).length;

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]">
              <Calculator className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900">Cách tính môn trong DSLM hiện tại</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Đọc toàn bộ danh sách lớp mở, tính riêng từng phương án lớp rồi tổng hợp số tuần có thể xảy ra.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {defaultCampus.name} · {currentCohort?.name ?? cohortId} · {currentFaculty?.name ?? facultyId} · {currentMajor?.name ?? majorId}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-5 sm:divide-y-0">
          {[
            ['Môn trong DSLM', rows.length, 'text-gray-900'],
            ['Quy tắc học vụ', academicRuleCount, 'text-[#004A98]'],
            ['Fallback', fallbackCount, 'text-amber-700'],
            ['Ghi đè', overrideCount, 'text-violet-700'],
            ['Cảnh báo', warningCount, warningCount ? 'text-amber-700' : 'text-gray-900'],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="min-w-0 px-4 py-3 sm:px-5">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`mt-0.5 text-xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:p-5">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-semibold text-gray-600">Tìm trong DSLM</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Mã hoặc tên môn học"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#004A98] focus:ring-2 focus:ring-[#004A98]/20"
            />
          </span>
        </label>
        <div className="w-full sm:w-60">
          <p className="mb-1.5 text-xs font-semibold text-gray-600">Nguồn cách tính</p>
          <AppSelect
            value={filter}
            options={FILTER_OPTIONS}
            onChange={(value) => setFilter(value as WorkloadFilter)}
            ariaLabel="Lọc theo nguồn cách tính"
            triggerClassName="h-11"
          />
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
          <Database className="mx-auto h-8 w-8 text-gray-300" />
          <h2 className="mt-3 text-sm font-semibold text-gray-900">Danh sách lớp mở hiện tại chưa có dữ liệu</h2>
          <p className="mt-1 text-sm text-gray-500">Đồng bộ mục Danh sách lớp mở từ Portal rồi mở lại màn hình này.</p>
        </section>
      ) : filteredRows.length === 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center shadow-sm">
          <Search className="mx-auto h-7 w-7 text-gray-300" />
          <h2 className="mt-3 text-sm font-semibold text-gray-900">Không có môn phù hợp</h2>
          <p className="mt-1 text-sm text-gray-500">Thử đổi từ khóa hoặc nguồn cách tính.</p>
        </section>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => {
            const source = getCourseSource(row);

            return (
              <article key={row.courseId} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-gray-900">{row.courseId} · {row.courseName}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SOURCE_STYLES[source]}`}>
                        {SOURCE_LABELS[source]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      CTĐT: LT {Number(row.courseMeta?.theory_hours) || 0} · TH {Number(row.courseMeta?.lab_hours) || 0} · BT {Number(row.courseMeta?.exercise_hours) || 0}
                    </p>
                    {row.academicRuleIds.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Rule: <code className="font-mono text-[11px] text-[#004A98]">{row.academicRuleIds.join(', ')}</code>
                        {row.academicRuleReasons.length > 0 ? ` · ${row.academicRuleReasons.join(' · ')}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-gray-500">{row.classOptions.length} phương án lớp</span>
                </div>

                <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                  <div className="divide-y divide-gray-100 lg:border-r lg:border-gray-100">
                    {row.components.map((component) => {
                      const formulaSources = component.sources
                        .map((item) => HOUR_SOURCE_LABELS[item])
                        .join(' + ');
                      const modeLabels = component.appliedModes
                        .map((mode) => MODE_LABELS[mode] ?? mode)
                        .join(' / ');
                      return (
                        <div key={component.component} className="grid gap-3 px-4 py-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                          <div>
                            <p className="text-xs font-semibold text-gray-500">Thành phần</p>
                            <p className="mt-0.5 text-base font-bold text-[#004A98]">{component.component}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {modeLabels}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">
                              {formulaSources || 'Chưa có nguồn giờ'} = {formatNumberVariants(component.requiredPeriods, 'tiết')} · {formatNumberVariants(component.periodsPerWeek, 'tiết/tuần')}
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-xs font-semibold text-gray-500">Kết quả</p>
                            {component.totalWeeks.some((value) => value > 0) ? (
                              <>
                                <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900">{formatNumberVariants(component.totalWeeks, 'tuần')}</p>
                                <p className="text-[11px] text-gray-400">Tính riêng theo từng phương án lớp</p>
                              </>
                            ) : (
                              <p className="mt-0.5 text-xs font-semibold text-amber-700">Chưa tính được</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {row.components.length === 0 && (
                      <div className="px-4 py-5 text-sm text-amber-700 sm:px-5">Không nhận diện được thành phần LT, TH hoặc BT.</div>
                    )}
                  </div>

                  <div className="min-w-0 bg-gray-50/70 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-gray-400" />
                      <h3 className="text-xs font-semibold text-gray-700">Dòng lịch dùng để chia số tuần</h3>
                    </div>
                    <details className="mt-3 rounded-lg border border-gray-200 bg-white" open={row.classOptions.length <= 3}>
                      <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-[#004A98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98]/30">
                        Xem {row.classOptions.length} phương án lớp
                      </summary>
                      <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto border-t border-gray-100">
                        {row.classOptions.map((option) => (
                          <div key={option.classId} className="px-3 py-3">
                            <p className="text-xs font-semibold text-gray-900">{option.classId}</p>
                            <div className="mt-2 space-y-2">
                              {option.diagnostic.registrations.map((registration, index) => {
                                const component = String(registration?.courseType || 'LT').trim().toUpperCase();
                                const calculation = option.diagnostic.components.find((item) => item.component === component);
                                return (
                                  <div key={`${option.classId}-${component}-${index}`} className="text-[11px] leading-5 text-gray-600">
                                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                                      <span className="font-semibold text-[#004A98]">{component} · nhóm {String(registration?.classGroup || '—')}</span>
                                      <span className="tabular-nums text-gray-500">
                                        {calculation?.periodsPerWeek || 0} tiết/tuần → {calculation?.totalWeeks || '—'} tuần
                                      </span>
                                    </div>
                                    <p className="break-words font-mono">{String(registration?.schedule || 'Chưa có lịch')}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>

                {row.warnings.length > 0 && (
                  <div className="space-y-1.5 border-t border-amber-100 bg-amber-50 px-4 py-3 sm:px-5">
                    {row.warnings.map((warning) => (
                      <p key={warning.code} className="flex items-start gap-2 text-xs leading-5 text-amber-800">
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span><code className="mr-1 font-mono text-[10px]">{warning.code}</code>{warning.message}</span>
                      </p>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
