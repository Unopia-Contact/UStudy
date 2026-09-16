import type { CSSProperties } from 'react';
import { useMemo, useState, useRef } from 'react';
import { AlertTriangle, Calendar, Clock, Camera, Download, Loader2, ImagePlus } from 'lucide-react';
import { UI_COLORS } from '../../../config';
import { getScheduleGridTemplate, getVisibleWeekDays } from '../../../constants';
import { maskToSections } from '../../../logic/scheduler/ScheduleDecoder';
import type { GroupScheduleOption } from '../types';
import type { ClassSection, SavedSchedule } from '../../../types';
import type { OpenClassDetailTarget } from '../../../components/course';
import { AppSelect } from '../../../components/ui/form';
import { ScheduleOptionSelector } from '../../schedule';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { captureElementAsDataURL, slugify, downloadImage } from '../../../utils/export';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/overlays/dropdown-menu';
import { getScheduleConflictLabel, ScheduleConflictHoverCard } from '../../../components/schedule/schedule-conflict-hover-card';
import { getCompactCampusLabel } from '../../../components/schedule/campus-label';
import { useCampus } from '../../../context/CampusContext';
import { ScheduleImageDialog } from '../../schedule-image/ScheduleImageDialog';
import { fromClassSections } from '../../schedule-image/schedule-image-model';
import type { CampusId } from '../../../domain/campus';
import {
  classSectionsOverlap,
  getClassSectionTimeRange,
} from '../../../components/schedule/schedule-timeline';
import {
  buildScheduleAxis,
  getScheduleAxisBreakLabel,
  getScheduleAxisContext,
  getScheduleAxisHeader,
  getScheduleAxisHint,
  getScheduleAxisPosition,
  getScheduleAxisTimeBreakSummary,
} from '../../../components/schedule/schedule-axis';

interface GroupScheduleCalendarPreviewProps {
  options: GroupScheduleOption[];
  activeOptionIndex: number;
  activeMemberIndex: number;
  setActiveOptionIndex: (index: number) => void;
  setActiveMemberIndex: (index: number) => void;
  onOpenClassDetails: (target: OpenClassDetailTarget) => void;
}

const PALETTE = UI_COLORS.SCHEDULE_PALETTE;

function getSolidTint(hexColor: string, tint = 0.9) {
  const normalized = hexColor.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) return '#F8FAFC';

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * tint);

  return `rgb(${mix(red)}, ${mix(green)}, ${mix(blue)})`;
}

export function getGroupMemberSections(
  option: GroupScheduleOption | undefined,
  memberIndex: number,
  defaultCampusId: CampusId = 'dong-hoa',
): ClassSection[] {
  const memberSchedule = option?.schedules.find((schedule) => schedule.memberIndex === memberIndex);
  if (!memberSchedule) return [];

  return memberSchedule.items.flatMap((item, itemIndex) => maskToSections(
    item.mask,
    item.courseId,
    item.courseName,
    item.classId,
    PALETTE[itemIndex % PALETTE.length],
    0,
    { scheduleEntries: item.scheduleEntries, defaultCampusId },
  ));
}

export function buildSavedGroupSchedule(
  option: GroupScheduleOption | undefined,
  memberIndex: number,
  scheduleName: string,
  defaultCampusId: CampusId = 'dong-hoa',
): SavedSchedule | null {
  const member = option?.schedules.find((schedule) => schedule.memberIndex === memberIndex) ?? option?.schedules[0];
  if (!option || !member || !scheduleName.trim()) return null;

  const sections = getGroupMemberSections(option, member.memberIndex, defaultCampusId);
  if (sections.length === 0) return null;

  const groupMembers = option.schedules.map((schedule) => {
    const memberSections = getGroupMemberSections(option, schedule.memberIndex, defaultCampusId);
    const memberCourses = Array.from(new Set(schedule.items.map((item) => item.courseId)));
    const memberAllowedClassesMap = schedule.items.reduce<Record<string, string[]>>((acc, item) => {
      acc[item.courseId] = Array.from(new Set([...(acc[item.courseId] ?? []), item.classId]));
      return acc;
    }, {});

    return {
      memberIndex: schedule.memberIndex,
      nickname: schedule.nickname,
      sessions: memberSections,
      selectedCourses: memberCourses,
      allowedClassesMap: memberAllowedClassesMap,
    };
  });

  const selectedCourses = Array.from(new Set(member.items.map((item) => item.courseId)));
  const allowedClassesMap = member.items.reduce<Record<string, string[]>>((acc, item) => {
    acc[item.courseId] = Array.from(new Set([...(acc[item.courseId] ?? []), item.classId]));
    return acc;
  }, {});

  return {
    id: crypto.randomUUID(),
    name: scheduleName.trim(),
    createdAt: new Date().toISOString(),
    sessions: sections,
    selectedCourses,
    allowedClassesMap,
    groupSchedule: {
      option: option.option,
      members: groupMembers,
      rawOption: option,
    },
  };
}

function getConflicts(section: ClassSection, sections: ClassSection[], defaultCampusId: CampusId): ClassSection[] {
  return sections.filter((candidate) => (
    candidate.id !== section.id &&
    classSectionsOverlap(section, candidate, defaultCampusId)
  ));
}

function getStats(sections: ClassSection[], defaultCampusId: CampusId) {
  const totalPeriods = sections.reduce((sum, section) => {
    const range = getClassSectionTimeRange(section, defaultCampusId);
    return sum + (range.endMinute - range.startMinute) / 50;
  }, 0);
  const periodsPerDay: Record<number, number> = {};

  sections.forEach((section) => {
    const range = getClassSectionTimeRange(section, defaultCampusId);
    periodsPerDay[section.day] = (periodsPerDay[section.day] ?? 0) + (range.endMinute - range.startMinute) / 50;
  });

  return {
    totalPeriods,
    periodsPerDay,
    scheduledDays: Object.keys(periodsPerDay).length,
  };
}

export function GroupScheduleCalendarPreview({
  options,
  activeOptionIndex,
  activeMemberIndex,
  setActiveOptionIndex,
  setActiveMemberIndex,
  onOpenClassDetails,
}: GroupScheduleCalendarPreviewProps) {
  const { defaultCampusId } = useCampus();
  const option = options[activeOptionIndex] ?? options[0];
  const member = option?.schedules.find((schedule) => schedule.memberIndex === activeMemberIndex) ?? option?.schedules[0];
  const effectiveMemberIndex = member?.memberIndex ?? 0;
  const sections = getGroupMemberSections(option, effectiveMemberIndex, defaultCampusId);
  const visibleDays = useMemo(
    () => getVisibleWeekDays(sections.map((section) => section.day)),
    [sections],
  );
  const dayColumnCount = visibleDays.length;
  const gridTemplateColumns = getScheduleGridTemplate(64, dayColumnCount);
  const calendarMinWidth = dayColumnCount === 7
    ? 'min-w-[713px] md:min-w-[1156px]'
    : 'min-w-[620px] md:min-w-[1000px]';
  const scheduleAxis = useMemo(
    () => buildScheduleAxis(sections, defaultCampusId),
    [sections, defaultCampusId],
  );
  const groupLabelByClass = useMemo(() => new Map((member?.items ?? []).map((item) => [`${item.courseId}:${item.classId}`, item.sharingGroupLabel])), [member]);
  const stats = getStats(sections, defaultCampusId);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportTotal, setExportTotal] = useState(0);

  const handleExportCurrent = async () => {
    if (!calendarRef.current || !option || !member) return;
    setIsExporting(true);
    try {
      const dataUrl = await captureElementAsDataURL(calendarRef.current);
      const nickname = slugify(member.nickname || `Thanh vien ${effectiveMemberIndex + 1}`);
      downloadImage(dataUrl, `${nickname}-pa${option.option}.png`);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllZip = async () => {
    if (!calendarRef.current) return;
    setIsExporting(true);
    
    const totalImages = options.reduce((sum, opt) => sum + opt.schedules.length, 0);
    setExportTotal(totalImages);
    setExportProgress(0);

    const zip = new JSZip();
    let count = 0;
    
    // Lưu lại index hiện tại để khôi phục
    const originalOptionIndex = activeOptionIndex;
    const originalMemberIndex = activeMemberIndex;
    
    try {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const folderName = `phuong-an-${String(opt.option).padStart(2, '0')}`;
        const folder = zip.folder(folderName);
        
        setActiveOptionIndex(i);
        
        for (let j = 0; j < opt.schedules.length; j++) {
          const sched = opt.schedules[j];
          setActiveMemberIndex(sched.memberIndex);
          
          // Chờ DOM cập nhật
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const dataUrl = await captureElementAsDataURL(calendarRef.current);
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          const nickname = slugify(sched.nickname || `Thanh vien ${sched.memberIndex + 1}`);
          
          folder?.file(`${nickname}-pa${opt.option}.png`, base64Data, { base64: true });
          
          count++;
          setExportProgress(count);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'Lich_Nhom.zip');
      
    } catch (e) {
      console.error('Export zip failed', e);
    } finally {
      setActiveOptionIndex(originalOptionIndex);
      setActiveMemberIndex(originalMemberIndex);
      setIsExporting(false);
      setExportProgress(0);
      setExportTotal(0);
    }
  };

  if (!option || !member) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        Chưa có phương án lịch để xem.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <ScheduleOptionSelector
          options={options.map((item) => ({ id: item.option, label: `PA ${item.option}` }))}
          activeIndex={activeOptionIndex}
          onChange={setActiveOptionIndex}
        />

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:border-l lg:border-gray-200 lg:pl-3">
          <button type="button" className="schedule-image-secondary" onClick={() => setIsImageDialogOpen(true)} disabled={sections.length === 0}><ImagePlus className="h-4 w-4" /><span>Tạo ảnh</span></button>
          <span className="text-xs font-medium text-gray-500">Thành viên</span>
          <AppSelect
            value={String(effectiveMemberIndex)}
            options={option.schedules.map((schedule) => ({
              id: String(schedule.memberIndex),
              name: schedule.nickname,
            }))}
            onChange={(value) => setActiveMemberIndex(Number(value))}
            ariaLabel="Chọn thành viên để xem lịch"
            className="min-w-40"
            triggerClassName="h-9 px-3 py-0 text-sm font-medium"
            disabled={isExporting}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button" 
                disabled={isExporting}
                className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <span className="hidden sm:inline">{isExporting && exportTotal > 0 ? `Đang xuất... (${exportProgress}/${exportTotal})` : 'Xuất ảnh'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white z-50">
              <DropdownMenuItem onClick={handleExportCurrent} className="cursor-pointer hover:bg-gray-100">
                <Camera className="mr-2 h-4 w-4" /> Xuất hiện tại (1 ảnh)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAllZip} className="cursor-pointer hover:bg-gray-100">
                <Download className="mr-2 h-4 w-4" /> Xuất toàn bộ (ZIP)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isImageDialogOpen && <ScheduleImageDialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen} lessons={fromClassSections(sections)} title={`Lịch của ${member.nickname}`} subtitle={`Phương án ${option.option}`} filename={`lich-nhom-${slugify(member.nickname || 'thanh-vien')}-pa${option.option}`} />}

      <div ref={calendarRef} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#004A98] text-white shadow-sm">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Lịch của {member.nickname} {isExporting && `- Phương án ${option.option}`}
              </h3>
              <p className="truncate text-xs text-gray-500">
                {sections.length > 0 ? `${sections.length} lớp · ${stats.totalPeriods} tiết · ${stats.scheduledDays} ngày học` : 'Thành viên này chưa có lớp được xếp'}
              </p>
              {scheduleAxis.mode === 'time' && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {getScheduleAxisHint(scheduleAxis)} {getScheduleAxisTimeBreakSummary(scheduleAxis)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1" title={getScheduleAxisTimeBreakSummary(scheduleAxis) ?? undefined}>
              <Clock className="h-3 w-3 text-[#004A98]" />
              {scheduleAxis.mode === 'time'
                ? 'Theo giờ thực'
                : `${getScheduleAxisContext(scheduleAxis)} · Tiết 1–${scheduleAxis.maxPeriod}`}
            </span>
          </div>
        </div>

        <div className="overflow-auto">
          <div className={calendarMinWidth}>
            <div className="sticky top-0 z-20 grid bg-[#004A98]" style={{ gridTemplateColumns }}>
              <div className="sticky left-0 z-30 flex h-11 flex-col items-center justify-center border-r border-white/20 bg-[#004A98] md:h-12">
                <span className="text-[10px] font-semibold text-white md:text-xs">{getScheduleAxisHeader(scheduleAxis)}</span>
                <span className="text-[8px] font-medium text-white/70">{getScheduleAxisContext(scheduleAxis)}</span>
              </div>
              {visibleDays.map((day) => (
                <div key={day.day} className="flex h-11 flex-col items-center justify-center border-l border-white/15 bg-[#004A98] px-1 text-white md:h-12">
                  <span className="hidden text-[10px] font-normal leading-none text-white/70 md:block">{day.nameVi}</span>
                  <span className="text-[11px] font-semibold leading-tight md:text-[13px]">{day.short}</span>
                  {(stats.periodsPerDay[day.day] ?? 0) > 0 && (
                    <span className="mt-0.5 hidden rounded-full bg-white/20 px-1.5 text-[9px] font-bold leading-4 md:inline-flex">
                      {Math.round(stats.periodsPerDay[day.day])} tiết
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ position: 'relative', isolation: 'isolate' }}>
              {/* Không tạo stacking context để cột Tiết sticky nằm trên thẻ môn khi vuốt ngang. */}
              <div style={{ position: 'relative' }}>
                {scheduleAxis.rows.map((row) => {
                  const isBreak = row.kind === 'break';
                  const label = row.kind === 'period'
                    ? row.period
                    : row.kind === 'time' && row.minute % 60 === 0
                      ? `${String(Math.floor(row.minute / 60)).padStart(2, '0')}:00`
                      : '';

                  return (
                    <div
                      key={row.kind === 'period' ? `period-${row.period}` : row.kind === 'break' ? `break-${row.afterPeriod}` : `time-${row.minute}`}
                      className="grid"
                      style={{ gridTemplateColumns, height: row.height }}
                    >
                      <div className={`sticky left-0 z-[4] flex items-center justify-center border-b border-r text-[9px] font-medium md:text-[10px] ${isBreak ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                        {row.kind === 'period' ? <><span className="sr-only">Tiết </span>{label}</> : isBreak ? 'Trưa' : label}
                      </div>
                      {isBreak ? (
                        <div className="flex items-center justify-center border-b border-l border-amber-200 bg-amber-50 px-3 text-[10px] font-medium text-amber-700 md:text-xs" style={{ gridColumn: `span ${dayColumnCount}` }}>
                          {getScheduleAxisBreakLabel(row)}
                        </div>
                      ) : visibleDays.map((day) => (
                        <div key={`${day.day}-${label}`} className="border-b border-l border-gray-200 bg-white transition-colors hover:bg-slate-50/80" />
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0 z-[2]">
                {sections.map((section) => {
                  const conflicts = getConflicts(section, sections, defaultCampusId);
                  const hasConflict = conflicts.length > 0;
                  const conflictLabel = getScheduleConflictLabel(section, conflicts);
                  const timeRange = getClassSectionTimeRange(section, defaultCampusId);
                  const { top, height } = getScheduleAxisPosition(section, scheduleAxis, defaultCampusId);
                  const dayIndex = visibleDays.findIndex((day) => day.day === section.day);
                  if (dayIndex < 0) return null;
                  const baseColor = hasConflict ? '#EF4444' : section.color;
                  const backgroundColor = hasConflict ? '#FFF1F2' : getSolidTint(section.color);
                  const textColor = hasConflict ? '#991B1B' : '#111827';
                  const subTextColor = hasConflict ? '#B91C1C' : '#6B7280';
                  const pillBg = hasConflict ? '#FEE2E2' : getSolidTint(section.color, 0.82);
                  const pillText = hasConflict ? '#991B1B' : '#374151';
                  const startTime = timeRange.startTime;
                  const endTime = timeRange.endTime;
                  const isCompact = height < 80;
                  const isMedium = height >= 80 && height < 150;
                  const isTall = height >= 150;

                  return (
                    <ScheduleConflictHoverCard
                      key={section.id}
                      section={section}
                      conflictingSections={conflicts}
                      defaultCampusId={defaultCampusId}
                    >
                      <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Xem lớp mở ${section.sectionNumber} của môn ${section.courseCode}`}
                      onClick={() => onOpenClassDetails({
                        courseCode: section.courseCode,
                        courseName: section.courseNameVi || section.courseName,
                        classId: section.selectedClassId || section.sectionNumber,
                      })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onOpenClassDetails({
                            courseCode: section.courseCode,
                            courseName: section.courseNameVi || section.courseName,
                            classId: section.selectedClassId || section.sectionNumber,
                          });
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: top + 2,
                        left: `calc(64px + ${dayIndex} * ((100% - 64px) / ${dayColumnCount}) + 3px)`,
                        width: `calc((100% - 64px) / ${dayColumnCount} - 6px)`,
                        height: height - 4,
                        backgroundColor,
                        borderRadius: '8px',
                        border: `1px solid ${hasConflict ? '#FECACA' : getSolidTint(section.color, 0.65)}`,
                        borderLeftWidth: '3.5px',
                        borderLeftColor: baseColor,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: isCompact ? '3px 6px' : '5px 7px',
                        gap: 0,
                        boxSizing: 'border-box',
                        boxShadow: hasConflict ? '0 2px 8px rgba(239,68,68,0.15)' : '0 1px 4px rgba(15,23,42,0.08)',
                        cursor: 'pointer',
                        zIndex: 2,
                        pointerEvents: 'auto',
                      }}
                    >
                      {hasConflict && !isCompact && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          background: '#FEE2E2',
                          borderRadius: 4,
                          padding: '1px 5px',
                          marginBottom: 3,
                          width: 'fit-content',
                        }}>
                          <AlertTriangle style={{ width: 9, height: 9, color: '#DC2626', flexShrink: 0 }} />
                          <span style={{ fontSize: 8, fontWeight: 700, color: '#B91C1C' }}>{conflictLabel}</span>
                        </div>
                      )}

                      <p style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: isCompact ? 9 : 11,
                        fontWeight: 700,
                        color: textColor,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginBottom: isCompact ? 0 : 2,
                      }}>
                        {section.courseCode}
                        {isCompact && (
                          <span style={{ fontFamily: 'inherit', fontWeight: 500, color: subTextColor, fontSize: 8, marginLeft: 4 }}>
                            · Lớp {section.sectionNumber} · {getCompactCampusLabel(section.campusId)}
                          </span>
                        )}
                      </p>

                      {!isCompact && groupLabelByClass.get(`${section.courseCode}:${section.selectedClassId || section.sectionNumber}`) ? (
                        <span style={{ alignSelf: 'flex-start', marginBottom: 2, borderRadius: 4, background: pillBg, padding: '1px 5px', fontSize: 8, fontWeight: 700, color: pillText }}>
                          {groupLabelByClass.get(`${section.courseCode}:${section.selectedClassId || section.sectionNumber}`)}
                        </span>
                      ) : null}

                      {!isCompact && (
                        <p style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: subTextColor,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: isMedium ? 2 : 3,
                          WebkitBoxOrient: 'vertical',
                          flexShrink: 1,
                          minHeight: 0,
                          marginBottom: 'auto',
                        } as CSSProperties}>
                          {section.courseNameVi}
                        </p>
                      )}

                      {isTall && <div style={{ flex: 1 }} />}

                      {!isCompact && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          flexShrink: 0,
                          marginTop: isMedium ? 'auto' : 4,
                          paddingTop: 3,
                          borderTop: `1px solid ${hasConflict ? '#FECACA' : getSolidTint(section.color, 0.72)}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                            <span style={{
                              flexShrink: 0,
                              background: pillBg,
                              color: pillText,
                              fontSize: 8,
                              fontWeight: 700,
                              borderRadius: 4,
                              padding: '1px 5px',
                              lineHeight: 1.5,
                              whiteSpace: 'nowrap',
                            }}>
                              Lớp {section.sectionNumber}
                            </span>
                            {section.room && section.room !== '---' && (
                              <span style={{
                                fontSize: 8,
                                fontWeight: 600,
                                color: subTextColor,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {section.room}
                              </span>
                            )}
                            <span
                              title={section.campusId === 'cho-quan' ? 'Cơ sở 1 - Chợ Quán' : 'Cơ sở 2 - Đông Hòa'}
                              style={{
                                flexShrink: 0,
                                fontSize: 8,
                                fontWeight: 700,
                                color: subTextColor,
                              }}
                            >
                              {getCompactCampusLabel(section.campusId)}
                            </span>
                          </div>

                          {startTime && (isTall || isMedium) && (
                            <span style={{
                              fontSize: 8,
                              fontWeight: 500,
                              color: subTextColor,
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                            }}>
                              {startTime} - {endTime}
                            </span>
                          )}
                        </div>
                      )}
                      </div>
                    </ScheduleConflictHoverCard>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
