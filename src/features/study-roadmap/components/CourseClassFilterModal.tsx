import React, { useEffect, useState } from 'react';
import { readFromStorage } from '../../../helpers/localStorage/save';
import { STORAGE_KEYS } from '../../../config';
import type { ClassPreferenceLevel, ClassPreferenceSelection } from '../../group-schedule/types';
import courseDbJson from '../../../logic/scheduler/Course_db.json';
import { RoadmapDialog } from './RoadmapDialog';

interface CourseClassFilterModalProps {
  courseCode: string;
  courseNameVi: string;
  isOpen: boolean;
  onClose: () => void;
  allowedClassesMap: Record<string, string[]>;
  setAllowedClassesMap: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  classPreferenceMap?: Record<string, ClassPreferenceSelection>;
  setClassPreferenceMap?: React.Dispatch<React.SetStateAction<Record<string, ClassPreferenceSelection>>>;
  embedded?: boolean;
}

export function CourseClassFilterModal({
  courseCode,
  courseNameVi,
  isOpen,
  onClose,
  allowedClassesMap,
  setAllowedClassesMap,
  classPreferenceMap,
  setClassPreferenceMap,
  embedded = false,
}: CourseClassFilterModalProps) {
  const [availableClasses, setAvailableClasses] = useState<{ id: string; schedule?: string[] }[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const courseDb = readFromStorage<any[]>(STORAGE_KEYS.COURSE_DB_OFFLINE, [] as any[]);
    const mergedMap = new Map<string, any>();
    (courseDbJson as any[]).forEach(item => mergedMap.set(item.id, item));
    if (courseDb && Array.isArray(courseDb)) {
        courseDb.forEach(item => {
            const existing = mergedMap.get(item.id);
            if (existing && (!item.classes || item.classes.length === 0) && existing.classes && existing.classes.length > 0) {
                item.classes = existing.classes;
            }
            mergedMap.set(item.id, item);
        });
    }
    const mergedDb = Array.from(mergedMap.values());

    const courseData = mergedDb.find((course: any) => course.id === courseCode);
    setAvailableClasses(courseData?.classes ?? []);
  }, [isOpen, courseCode]);

  if (!isOpen) return null;

  const activeClasses = allowedClassesMap[courseCode]
    ? new Set(allowedClassesMap[courseCode])
    : new Set(availableClasses.map((courseClass) => courseClass.id));
  const usesPreferenceMode = Boolean(classPreferenceMap && setClassPreferenceMap);
  const classPreferenceLabels: { value: ClassPreferenceLevel | null; label: string; activeClass: string }[] = [
    { value: 'excluded', label: 'Cấm', activeClass: 'bg-rose-600 text-white' },
    { value: null, label: 'Chọn', activeClass: 'bg-gray-700 text-white' },
    { value: 'preferred', label: 'Ưu tiên', activeClass: 'bg-[#004A98] text-white' },
    { value: 'required', label: 'Bắt buộc', activeClass: 'bg-red-600 text-white' },
  ];

  const handleToggle = (classId: string) => {
    setAllowedClassesMap((previous) => {
      const currentSelected = previous[courseCode] ? [...previous[courseCode]] : availableClasses.map((courseClass) => courseClass.id);
      const nextSelected = currentSelected.includes(classId)
        ? currentSelected.filter((id) => id !== classId)
        : [...currentSelected, classId];
      return { ...previous, [courseCode]: nextSelected };
    });
  };

  const handleSelectAll = (selectAll: boolean) => {
    setAllowedClassesMap((previous) => ({
      ...previous,
      [courseCode]: selectAll ? availableClasses.map((courseClass) => courseClass.id) : [],
    }));
  };

  const getPreferenceLevel = (classId: string): ClassPreferenceLevel | null => {
    const selection = classPreferenceMap?.[courseCode];
    if (selection?.excluded?.includes(classId)) return 'excluded';
    if (selection?.required?.includes(classId)) return 'required';
    if (selection?.preferred?.includes(classId)) return 'preferred';
    return null;
  };

  const setPreferenceLevel = (classId: string, level: ClassPreferenceLevel | null) => {
    setClassPreferenceMap?.((current) => {
      const excluded = new Set(current[courseCode]?.excluded ?? []);
      const preferred = new Set(current[courseCode]?.preferred ?? []);
      const required = new Set(current[courseCode]?.required ?? []);
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

      if (
        (nextSelection.excluded?.length ?? 0) === 0 &&
        (nextSelection.preferred?.length ?? 0) === 0 &&
        (nextSelection.required?.length ?? 0) === 0
      ) {
        const { [courseCode]: _removed, ...rest } = current;
        return rest;
      }

      return { ...current, [courseCode]: nextSelection };
    });
  };

  const clearPreference = () => {
    setClassPreferenceMap?.((current) => {
      const { [courseCode]: _removed, ...rest } = current;
      return rest;
    });
  };

  const content = (
        <div className="p-1">
          {embedded && <button type="button" onClick={onClose} className="mb-3 min-h-11 text-sm font-medium text-[#004A98]">← Quay lại giỏ môn</button>}
          {embedded && <h3 className="mb-3 text-sm font-semibold">{courseNameVi} · Lớp được xét</h3>}
          {availableClasses.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">Không tìm thấy dữ liệu lớp học cho môn này.</div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-gray-500">
                  {usesPreferenceMode
                    ? 'Chọn Cấm / Ưu tiên / Bắt buộc cho lớp của thành viên này'
                    : 'Bỏ tick để loại trừ khỏi thuật toán xếp lịch'}
                </span>
                <div className="flex gap-2">
                  {usesPreferenceMode ? (
                    <button type="button" onClick={clearPreference} className="text-xs text-gray-500 hover:text-red-600 hover:underline">
                      Xóa cấu hình
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => handleSelectAll(true)} className="text-xs text-[#004A98] hover:underline">
                        Chọn tất cả
                      </button>
                      <span className="text-gray-300">|</span>
                      <button type="button" onClick={() => handleSelectAll(false)} className="text-xs text-gray-500 hover:text-red-600 hover:underline">
                        Bỏ chọn tất cả
                      </button>
                    </>
                  )}
                </div>
              </div>

              {[...availableClasses].sort((a, b) => a.id.localeCompare(b.id)).map((availableClass) => {
                const isChecked = activeClasses.has(availableClass.id);
                const preferenceLevel = getPreferenceLevel(availableClass.id);
                const classTone = preferenceLevel === 'excluded'
                  ? 'border-rose-300 bg-rose-50'
                  : preferenceLevel === 'required'
                    ? 'border-red-300 bg-red-50'
                    : preferenceLevel === 'preferred' || isChecked
                      ? 'border-[#004A98] bg-blue-50/50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100';

                return (
                  <div key={availableClass.id} className={`flex flex-wrap items-start gap-3 rounded-lg border p-3 transition-colors ${classTone}`}>
                    {!usesPreferenceMode && (
                      <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                        <input type="checkbox" className="h-4 w-4 accent-[#004A98]" aria-label={`Cho phép lớp ${availableClass.id} được xét`} checked={isChecked} onChange={() => handleToggle(availableClass.id)} />
                      </label>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${preferenceLevel === 'excluded' ? 'text-rose-900' : preferenceLevel === 'required' ? 'text-red-900' : isChecked || preferenceLevel === 'preferred' ? 'text-blue-900' : 'text-gray-700'}`}>
                        {availableClass.id.replace(/_/g, ' ')}
                      </p>

                      {availableClass.schedule && availableClass.schedule.length > 0 && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span className={`text-xs ${preferenceLevel === 'excluded' ? 'text-rose-700/80' : preferenceLevel === 'required' ? 'text-red-700/80' : isChecked || preferenceLevel === 'preferred' ? 'text-blue-700/80' : 'text-gray-500'}`}>
                            {availableClass.schedule.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {usesPreferenceMode && (
                      <div className="grid w-full shrink-0 grid-cols-2 gap-1 rounded-lg bg-white p-1 sm:w-[244px] sm:grid-cols-4">
                        {classPreferenceLabels.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setPreferenceLevel(availableClass.id, item.value)}
                            className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${preferenceLevel === item.value ? item.activeClass : 'text-gray-500 hover:bg-gray-100'}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
  );
  if (embedded) return content;
  return <RoadmapDialog title={usesPreferenceMode ? 'Cấu hình lớp' : 'Lớp được xét'} description={`${courseCode} · ${courseNameVi}`} onClose={onClose} footer={<button type="button" onClick={onClose} className="ustudy-button-primary min-h-11 w-full">Xong</button>}>{content}</RoadmapDialog>;
}
