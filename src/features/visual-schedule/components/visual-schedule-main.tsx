import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Calendar, Clock, BookOpen, GraduationCap, ChevronLeft, ChevronRight, Download, ImageDown, ImagePlus, MoreHorizontal } from 'lucide-react';

import { getScheduleGridTemplate, getVisibleWeekDays } from '../../../constants';
import { useVisualSchedule } from '../hooks/use-visual-schedule';
import { NoDataCard } from '../../../components/feedback';
import { PageHeader } from '../../../components/layout/page-header';
import { PageShell } from '../../../components/layout/page-shell';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/overlays/dropdown-menu';
import { ColorLegend } from './ColorLegend';
import { HolidayManagerDialog } from './HolidayManagerDialog';
import { CourseDetailCard } from './CourseDetailCard';
import { CourseCard } from './EditSessionDialog';
import { QuickStatsCard } from './QuickStatsCard';
import { OpenClassDetailDialog, type OpenClassDetailTarget } from '../../../components/course';
import { getOverlappingSessions } from '../services/schedule-helpers';
import { useCampus } from '../../../context/CampusContext';
import { downloadImage } from '../../../utils/export';
import { ScheduleImageDialog } from '../../schedule-image/ScheduleImageDialog';
import { fromScheduleSessions } from '../../schedule-image/schedule-image-model';
import {
  buildScheduleAxis,
  getScheduleAxisBreakLabel,
  getScheduleAxisContext,
  getScheduleAxisHeader,
  getScheduleAxisHint,
  getScheduleAxisPosition,
  getScheduleAxisTimeBreakSummary,
} from '../../../components/schedule/schedule-axis';

interface VisualScheduleMainProps {
  selectedSemester?: string;
}

export function VisualScheduleMain({ selectedSemester }: VisualScheduleMainProps) {
  const { defaultCampusId } = useCampus();
  const [isHolidayManagerOpen, setIsHolidayManagerOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isExportingCurrentImage, setIsExportingCurrentImage] = useState(false);
  const [imageExportError, setImageExportError] = useState('');
  const [openClassDetails, setOpenClassDetails] = useState<OpenClassDetailTarget | null>(null);
  const currentScheduleImageRef = useRef<HTMLDivElement>(null);
  const {
    isReady,
    hasData,
    schedule,
    currentWeek,
    totalWeeks,
    weekRangeStr,
    currentWeekHolidays,
    displaySessions,
    stats,
    trends,
    uniqueCourses,
    isToday,
    handlePreviousWeek,
    handleNextWeek,
    handleExport
  } = useVisualSchedule({ selectedSemester });

  const scheduleAxis = useMemo(
    () => buildScheduleAxis(displaySessions, defaultCampusId),
    [displaySessions, defaultCampusId],
  );
  const visibleDays = useMemo(
    () => getVisibleWeekDays([
      ...schedule.sessions.map((session) => session.dayOfWeek),
      ...displaySessions.map((session) => session.dayOfWeek),
    ]),
    [schedule.sessions, displaySessions],
  );
  const dayColumnCount = visibleDays.length;
  const gridTemplateColumns = getScheduleGridTemplate(64, dayColumnCount);
  const calendarMinWidth = dayColumnCount === 7
    ? 'min-w-[644px] md:min-w-[1156px]'
    : 'min-w-[560px] md:min-w-[1000px]';

  const calendarBlocks = useMemo(() => {
    const visited = new Set<string>();
    return displaySessions.flatMap((session) => {
      if (visited.has(session.id)) return [];
      const sessions = [session, ...getOverlappingSessions(session, displaySessions)]
        .filter((candidate, index, values) => values.findIndex((value) => value.id === candidate.id) === index);
      sessions.forEach((candidate) => visited.add(candidate.id));
      return [{
        sessions,
        day: session.dayOfWeek,
      }];
    });
  }, [displaySessions]);

  const exportCurrentScheduleImage = async () => {
    const calendar = currentScheduleImageRef.current;
    if (!calendar || isExportingCurrentImage) return;

    setIsExportingCurrentImage(true);
    setImageExportError('');
    try {
      const dataUrl = await toPng(calendar, {
        backgroundColor: '#ffffff',
        width: calendar.scrollWidth,
        height: calendar.scrollHeight,
        pixelRatio: 2,
      });
      downloadImage(dataUrl, `thoi-khoa-bieu-tuan-${currentWeek}.png`);
    } catch (error) {
      console.error('Failed to export current timetable image:', error);
      setImageExportError('Không thể xuất ảnh lịch hiện tại. Thử tải lại trang rồi xuất lại.');
    } finally {
      setIsExportingCurrentImage(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex-1 flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004A98]"></div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <PageShell
        header={<PageHeader
          title="Thời khóa biểu"
          description="Vui lòng nhập dữ liệu để xem thời khóa biểu."
        />}
      >
        <NoDataCard />
      </PageShell>
    );
  }

  return (
    <PageShell
      className="ustudy-schedule-page"
      header={
        <PageHeader
          title="Thời khóa biểu"
          description={<>Xem lịch học theo tuần - {schedule.semesterName}</>}
          actions={<>
            <div className="flex items-center">
              <HolidayManagerDialog
                open={isHolidayManagerOpen}
                onOpenChange={setIsHolidayManagerOpen}
                overrides={schedule.overrides}
                systemHolidays={schedule.systemHolidays}
                semesterStartDate={schedule.semesterStartDate}
                courses={Array.from(new Map(schedule.sessions.map((session) => [session.courseCode, {
                  code: session.courseCode,
                  name: session.courseName,
                }])).values())}
                onSave={schedule.updateOverrides}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50" aria-label="Mở tùy chọn thời khóa biểu" title="Tùy chọn thời khóa biểu">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Tùy chọn</span>
                    {schedule.overrides.holidays.length > 0 && <span className="ustudy-badge-count text-[10px] font-bold">{schedule.overrides.holidays.length}</span>}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50 w-56 bg-white">
                  <DropdownMenuItem onClick={() => setIsHolidayManagerOpen(true)} className="cursor-pointer hover:bg-gray-100">
                    <Calendar className="mr-2 h-4 w-4" />Quản lý nghỉ lễ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsImageDialogOpen(true)} className="cursor-pointer hover:bg-gray-100">
                    <ImagePlus className="mr-2 h-4 w-4" />Tạo ảnh tổng quan
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={isExportingCurrentImage} onClick={() => void exportCurrentScheduleImage()} className="cursor-pointer hover:bg-gray-100">
                    <ImageDown className="mr-2 h-4 w-4" />{isExportingCurrentImage ? 'Đang xuất ảnh…' : 'Xuất ảnh lịch hiện tại'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport} className="cursor-pointer hover:bg-gray-100">
                    <Download className="mr-2 h-4 w-4" />Xuất lịch (.ics)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>}
        />
      }
    >

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
        <QuickStatsCard
          icon={BookOpen}
          title="Tổng môn"
          value={`${stats.totalCourses}/${schedule.totalCourses}`}
          subtitle={`${stats.totalCredits} TC`}
          bgColor="bg-[#004A98]"
          trend={trends.coursesTrend}
        />
        <QuickStatsCard
          icon={Clock}
          title="Tiết/tuần"
          value={`${stats.totalPeriods}`}
          subtitle={stats.formattedHours}
          bgColor="bg-green-600"
          trend={trends.periodsTrend}
        />
        <QuickStatsCard
          icon={Calendar}
          title="Tuần"
          value={`${currentWeek}/${totalWeeks}`}
          subtitle={weekRangeStr}
          bgColor="bg-orange-600"
        />
      </div>

      {/* Color Legend */}
      <ColorLegend />

      {/* Week Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5 md:p-4 mb-3 md:mb-4 flex items-center justify-between">
        <button
          onClick={handlePreviousWeek}
          disabled={currentWeek === 1}
          className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs md:text-sm font-medium hidden sm:inline">Tuần trước</span>
        </button>

        <div className="text-center">
          <div className="text-sm md:text-lg font-semibold text-[#004A98]">
            Tuần {currentWeek}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500">{weekRangeStr}</div>
        </div>

        <button
          onClick={handleNextWeek}
          disabled={currentWeek === totalWeeks}
          className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-xs md:text-sm font-medium hidden sm:inline">Tuần sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {currentWeekHolidays.length > 0 && (
        <div className="mb-3 flex items-start gap-3 border-y border-amber-200 bg-amber-50 px-3 py-3 md:mb-4 md:px-4">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">Tuần này có {currentWeekHolidays.length} kỳ nghỉ ảnh hưởng lịch học</p>
            <p className="mt-0.5 truncate text-xs text-amber-700">{currentWeekHolidays.map((holiday) => holiday.reason).join(' · ')}</p>
          </div>
          <button type="button" onClick={() => setIsHolidayManagerOpen(true)} className="shrink-0 text-xs font-semibold text-amber-800 hover:text-amber-950">Xem chi tiết</button>
        </div>
      )}

      {imageExportError && <p role="alert" className="mb-3 text-sm font-medium text-red-700">{imageExportError}</p>}

      {/* Weekly Calendar Grid */}
      {scheduleAxis.mode === 'time' && (
        <p className="mb-2 text-xs text-slate-500" title={getScheduleAxisTimeBreakSummary(scheduleAxis) ?? undefined}>
          {getScheduleAxisHint(scheduleAxis)} {getScheduleAxisTimeBreakSummary(scheduleAxis)}
        </p>
      )}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto mb-4 md:mb-6">
        <div ref={currentScheduleImageRef} className={calendarMinWidth}>
          <div className="sticky top-0 z-20 grid bg-[#004A98]" style={{ gridTemplateColumns }}>
            <div className="sticky left-0 z-30 flex h-11 flex-col items-center justify-center border-r border-white/20 bg-[#004A98] text-[10px] font-semibold text-white md:h-12 md:text-xs">
              <span>{getScheduleAxisHeader(scheduleAxis)}</span>
              <span className="text-[8px] font-medium text-white/70">{getScheduleAxisContext(scheduleAxis)}</span>
            </div>
            {visibleDays.map((day) => (
              <div key={day.day} className={`flex h-11 flex-col items-center justify-center border-l border-white/15 px-1 text-[10px] font-semibold text-white md:h-12 md:text-[13px] ${isToday(day.day) ? 'bg-green-600' : 'bg-[#004A98]'}`}>
                {day.label}
                {isToday(day.day) && <span className="mt-0.5 text-[9px] font-normal md:text-[11px]">Hôm nay</span>}
              </div>
            ))}
          </div>

          <div className="relative isolate">
            <div className="relative">
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
                      <div key={`${day.day}-${label}`} className={`border-b border-l border-gray-200 ${isToday(day.day) ? 'bg-green-50/30' : 'bg-white'}`} />
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="pointer-events-none absolute inset-0 z-[2]">
              {calendarBlocks.map((block) => {
                const dayIndex = visibleDays.findIndex((day) => day.day === block.day);
                if (dayIndex < 0) return null;
                const positions = block.sessions.map((session) => getScheduleAxisPosition(session, scheduleAxis, defaultCampusId));
                const top = Math.min(...positions.map((position) => position.top));
                const bottom = Math.max(...positions.map((position) => position.top + position.height));
                const position = { top, height: bottom - top };
                return (
                  <div
                    key={block.sessions.map((session) => session.id).join(':')}
                    className="pointer-events-auto absolute p-0.5"
                    style={{
                      top: position.top,
                      height: position.height,
                      left: `calc(64px + ${dayIndex} * ((100% - 64px) / ${dayColumnCount}))`,
                      width: `calc((100% - 64px) / ${dayColumnCount})`,
                    }}
                  >
                    <CourseCard
                      sessions={block.sessions}
                      hasConflict={block.sessions.length > 1}
                      weekNumber={currentWeek}
                      overrides={schedule.overrides}
                      onSave={schedule.updateOverrides}
                      onOpenClassDetails={setOpenClassDetails}
                      timelineMode
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Course Details Section */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#004A98]" />
          Chi tiết môn học đã đăng ký
        </h3>
        <div className="space-y-0">
          {uniqueCourses.map((session) => (
            <CourseDetailCard key={session.id} session={session} onOpenClassDetails={setOpenClassDetails} />
          ))}
        </div>
      </div>

      <OpenClassDetailDialog target={openClassDetails} onOpenChange={(open) => { if (!open) setOpenClassDetails(null); }} />
      {isImageDialogOpen && (
        <ScheduleImageDialog
          open={isImageDialogOpen}
          onOpenChange={setIsImageDialogOpen}
          lessons={fromScheduleSessions(schedule.sessions)}
          title="Thời khóa biểu"
          subtitle={schedule.semesterName}
          filename={`thoi-khoa-bieu-${schedule.semester.replace(/\//g, '-')}`}
        />
      )}

    </PageShell>
  );
}
