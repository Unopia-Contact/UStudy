// EditSessionDialog.tsx
import { useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronDown, Check, Clock3, MapPin, MessageSquare, Palette, Pencil, RotateCcw, StickyNote } from 'lucide-react';
import { AppSelect, Input, Label, Textarea } from '../../../components/ui/form';
import { AppDialog } from '../../../components/ui/overlays/app-dialog';
import { MobileBottomSheet } from '../../../components/ui/overlays/mobile-bottom-sheet';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../../components/ui/overlays/hover-card';
import { useIsMobile } from '../../../components/ui/use-mobile';
import { type ScheduleSession, type ScheduleOverrides, type SessionOverride } from '../types';
import { validWeek, getSessionWeeks } from '../services/holiday-logic';
import type { Holiday } from '../types';
import { weekDays } from '../../../constants';
import { calculateRowSpan, getDisplayEnd } from '../services/schedule-helpers';
import { CAMPUS_OPTIONS, getCampusDefinition, tryResolvePeriodRange, type CampusId } from '../../../domain/campus';
import { getCompactCampusLabel } from '../../../components/schedule/campus-label';
import { RoomMapLink } from './RoomMapLink';
import { RoomLocationDialog } from '../../campus-map/RoomLocationDialog';
import type { ScheduleMapLocation } from '../../campus-map/services/resolve-schedule-location';

function EditSessionDialog({ onOpenChange, session, overrides, onSave, semesterStartDate, systemHolidays }: {
    onOpenChange: (open: boolean) => void;
    session: ScheduleSession;
    semesterStartDate?: Date;
    systemHolidays?: Holiday[];
    overrides: ScheduleOverrides;
    onSave: (newOverrides: ScheduleOverrides, lastWeek?: number) => boolean | void;
}) {
    const globalOverride = overrides.sessionOverrides[session.id];
    const baseValues = session.baseValues ?? session;
    const holidays = [...(systemHolidays ?? []), ...overrides.holidays];
    const [initialWeeks] = useState(() => getSessionWeeks(session, semesterStartDate, holidays, overrides));
    const [startWeek, setStartWeek] = useState(String(initialWeeks.startWeek));
    const [weekCount, setWeekCount] = useState(String(initialWeeks.weekCount));
    const [room, setRoom] = useState(globalOverride?.room ?? baseValues.room);
    const [startPeriod, setStartPeriod] = useState(String(globalOverride?.startPeriod ?? baseValues.startPeriod));
    const [endPeriod, setEndPeriod] = useState(String(globalOverride?.endPeriod ?? baseValues.endPeriod));
    const [dayOfWeek, setDayOfWeek] = useState(String(globalOverride?.dayOfWeek ?? baseValues.dayOfWeek));
    const [campusId, setCampusId] = useState<CampusId>(globalOverride?.campusId ?? baseValues.campusId ?? 'dong-hoa');
    const [note, setNote] = useState(globalOverride?.note ?? baseValues.note ?? '');
    const [color, setColor] = useState(globalOverride?.color ?? baseValues.color);
    const [error, setError] = useState('');
    const basicColorOptions = [
        { id: 'blue', name: 'Xanh UStudy', hex: '#004A98' },
        { id: 'green', name: 'Xanh lá', hex: '#059669' },
        { id: 'yellow', name: 'Vàng', hex: '#D97706' },
        { id: 'purple', name: 'Tím', hex: '#7C3AED' },
    ];

    const weekEntries = Object.entries(overrides.weekOverrides).filter(([key]) => key.slice(key.indexOf('_') + 1) === session.id);
    const revision = JSON.stringify([baseValues, semesterStartDate, session.startDate, session.endDate, session.totalWeeks,
        globalOverride, weekEntries, holidays]);
    const openedRevision = useRef(revision);
    const persist = (nextOverrides: ScheduleOverrides, lastWeek?: number) => {
        if (revision !== openedRevision.current) {
            setError('Buổi học đã thay đổi trong khi bạn chỉnh sửa. Hãy mở lại để xem lịch mới trước khi lưu.');
            return;
        }
        if (onSave(nextOverrides, lastWeek) === false) {
            setError('Chưa lưu được thay đổi. Kiểm tra dung lượng hoặc mở lại nếu lịch đã đổi ở tab khác.');
            return;
        }
        onOpenChange(false);
    };

    const parsedStartWeek = Number(startWeek);
    const parsedCount = Number(weekCount);
    const startChanged = parsedStartWeek !== initialWeeks.startWeek;
    const countChanged = parsedCount !== initialWeeks.weekCount;
    // A legacy fixed end can precede the first lesson, leaving a valid empty schedule.
    const keepEmpty = initialWeeks.weekCount === 0 && weekCount === '0' && !startChanged;
    const validWeeks = validWeek(parsedStartWeek) && (validWeek(parsedCount) || keepEmpty);
    const timing: SessionOverride = {};
    if (startChanged) timing.startWeek = parsedStartWeek;
    if (countChanged || (startChanged && globalOverride?.endWeek !== undefined)) {
        timing.weekCount = parsedCount;
        timing.endWeek = undefined;
    }
    const preview = validWeeks ? getSessionWeeks({ ...session, dayOfWeek: Number(dayOfWeek) as ScheduleSession['dayOfWeek'] },
        semesterStartDate, holidays, { ...overrides, sessionOverrides: {
            ...overrides.sessionOverrides, [session.id]: { ...globalOverride, ...timing },
        } }) : null;

    const handleSave = () => {
        const parsedStart = Number(startPeriod);
        const parsedEnd = Number(endPeriod);
        const parsedDay = Number(dayOfWeek);
        const periodRange = tryResolvePeriodRange(campusId, parsedStart, parsedEnd);
        const duration = periodRange ? (periodRange.endMinute - periodRange.startMinute) / 50 : 0;

        if (!Number.isFinite(parsedStart) || !Number.isFinite(parsedEnd) || !periodRange || duration <= 0) {
            setError(`Tiết học chưa hợp lệ với ${getCampusDefinition(campusId).name}.`);
            return;
        }
        if (!weekDays.some((day) => day.day === parsedDay)) {
            setError('Vui lòng chọn ngày học hợp lệ.');
            return;
        }
        if (!validWeeks) {
            setError('Tuần bắt đầu và số tuần học phải là số nguyên từ 1 đến 520.');
            return;
        }

        const fields: SessionOverride = {
            room: room.trim(), startPeriod: parsedStart, endPeriod: parsedEnd,
            dayOfWeek: parsedDay as ScheduleSession['dayOfWeek'], note: note.trim(), color,
            campusId,
        };
        const nextEdit: SessionOverride = { ...globalOverride, ...timing };
        for (const [field, value] of Object.entries(fields)) {
            const key = field as keyof typeof baseValues;
            const inherited = baseValues[key] ?? (key === 'note' ? '' : undefined);
            if (value !== inherited) Object.assign(nextEdit, { [field]: value });
            else if (globalOverride?.[field as keyof SessionOverride] !== value) delete nextEdit[field as keyof SessionOverride];
        }
        const sessionOverrides = { ...overrides.sessionOverrides };
        if (Object.values(nextEdit).some(value => value !== undefined)) sessionOverrides[session.id] = nextEdit;
        else delete sessionOverrides[session.id];
        persist({ ...overrides, sessionOverrides }, startChanged || countChanged ? preview?.weeks.at(-1) : undefined);
    };

    const handleRestore = () => {
        const sessionOverrides = { ...overrides.sessionOverrides };
        delete sessionOverrides[session.id];
        const weekOverrides = { ...overrides.weekOverrides };
        for (const [key] of weekEntries) delete weekOverrides[key];
        persist({ ...overrides, sessionOverrides, weekOverrides });
    };

    const hasChanges = Boolean(globalOverride || weekEntries.length);
    const dayLabel = weekDays.find(day => day.day === session.dayOfWeek)?.label;
    const typeLabel = { LT: 'Lý thuyết', TH: 'Thực hành', BT: 'Bài tập' }[session.type];
    return (
        <AppDialog
            open
            onOpenChange={onOpenChange}
            title="Tùy chỉnh môn học"
            description={`${session.courseCode} · ${session.courseName} · ${typeLabel} · ${dayLabel} · ${session.startTime}`}
            icon={Pencil}
            size="lg"
            mobileFullScreen
            contentClassName="space-y-0 !p-0 sm:!p-0"
            footer={
                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {hasChanges && (
                            <button
                                type="button"
                                onClick={handleRestore}
                                className="ustudy-button-dialog ustudy-button-dialog-cancel w-full gap-2 sm:w-auto"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Khôi phục mặc định
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <button type="button" onClick={() => onOpenChange(false)} className="ustudy-button-dialog ustudy-button-dialog-cancel">
                            Hủy
                        </button>
                        <button type="button" onClick={handleSave} className="ustudy-button-dialog ustudy-button-dialog-confirm">
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            }
        >
            <div className="divide-y divide-slate-200">
                <section className="px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="schedule-start-week" className="mb-1.5 block">Tuần bắt đầu</Label>
                            <Input id="schedule-start-week" type="number" min="1" max="520" step="1" inputMode="numeric"
                                value={startWeek} onChange={event => setStartWeek(event.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="schedule-week-count" className="mb-1.5 block">Số tuần học</Label>
                            <Input id="schedule-week-count" type="number" min={keepEmpty ? 0 : 1} max="520" step="1" inputMode="numeric"
                                value={weekCount} onChange={event => setWeekCount(event.target.value)} />
                        </div>
                    </div>
                    <p aria-live="polite" className="mt-3 text-sm text-slate-600">
                        {preview && (preview.weeks.length ? 'Buổi cuối ở tuần ' + preview.weeks.at(-1) + ' · ' + preview.weeks.length + ' buổi học' : 'Không có buổi học trong khoảng đã chọn.')}
                    </p>
                </section>

                <section className="px-4 py-5 sm:px-6">
                    <div className="mb-4 flex items-start gap-3">
                        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#004A98]" />
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Lịch học</h3>
                            <p className="mt-0.5 text-xs leading-5 text-slate-500">Điều chỉnh ngày, phòng và tiết học của buổi này.</p>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label className="mb-1.5 block text-sm font-medium text-slate-700">Cơ sở học</Label>
                            <AppSelect
                                value={campusId}
                                onChange={(value) => setCampusId(value as CampusId)}
                                options={CAMPUS_OPTIONS}
                                ariaLabel="Chọn cơ sở học cho buổi này"
                                triggerClassName="h-10 px-3 py-0 text-sm"
                            />
                            {session.isCampusFallback && campusId === session.campusId && (
                                <p className="mt-1.5 text-xs text-amber-700">Chưa đối chiếu được từ lớp mở, đang dùng cơ sở mặc định.</p>
                            )}
                        </div>
                        <div>
                            <Label className="mb-1.5 block text-sm font-medium text-slate-700">Ngày học</Label>
                            <AppSelect
                                value={dayOfWeek}
                                onChange={setDayOfWeek}
                                options={weekDays.map((day) => ({ id: String(day.day), name: day.label }))}
                                ariaLabel="Chọn ngày học"
                                triggerClassName="h-10 px-3 py-0 text-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="schedule-room" className="mb-1.5 block text-sm font-medium text-slate-700">Phòng học</Label>
                            <div className="relative">
                                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input id="schedule-room" value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Ví dụ: F202" className="h-10 rounded-lg bg-white pl-9" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <Label className="mb-1.5 block text-sm font-medium text-slate-700">Tiết học</Label>
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                                <div className="relative">
                                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input aria-label="Tiết bắt đầu" type="number" min="1" max={getCampusDefinition(campusId).periodCount} step="0.5" value={startPeriod} onChange={(event) => setStartPeriod(event.target.value)} placeholder="Bắt đầu" className="h-10 rounded-lg bg-white pl-9" />
                                </div>
                                <span className="text-xs font-medium text-slate-400">đến</span>
                                <Input aria-label="Tiết kết thúc" type="number" min="1" max={getCampusDefinition(campusId).periodCount} step="0.5" value={endPeriod} onChange={(event) => setEndPeriod(event.target.value)} placeholder="Kết thúc" className="h-10 rounded-lg bg-white" />
                            </div>
                        </div>
                    </div>
                </section>

                <details className="group px-4 py-3 sm:px-6">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                        <Palette className="h-5 w-5 text-[#004A98]" />
                        Màu và ghi chú
                        <ChevronDown className="ml-auto h-4 w-4 group-open:rotate-180" />
                    </summary>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="mb-2 block text-sm font-medium text-slate-700">Màu hiển thị</Label>
                            <div className="flex flex-wrap items-center gap-2">
                            {basicColorOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    title={option.name}
                                    aria-label={`Chọn ${option.name}`}
                                    aria-pressed={color === option.id}
                                    onClick={() => setColor(option.id)}
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition-colors ${color === option.id ? 'border-[#004A98] ring-2 ring-[#004A98]/15' : 'border-slate-200 hover:border-slate-400'}`}
                                >
                                    <span className="h-6 w-6 rounded-full" style={{ backgroundColor: option.hex }} />
                                    {color === option.id && <Check className="absolute h-3.5 w-3.5 text-white" strokeWidth={3} />}
                                </button>
                            ))}
                            <label title="Màu tùy chỉnh" className={`relative flex h-10 min-w-10 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-2.5 transition-colors ${color.startsWith('#') ? 'border-[#004A98] text-[#004A98] ring-2 ring-[#004A98]/15' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                                <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: color.startsWith('#') ? color : '#FFFFFF' }} />
                                <span className="hidden text-xs font-semibold sm:inline">Tùy chỉnh</span>
                                <input
                                    type="color"
                                    value={color.startsWith('#') ? color : '#004A98'}
                                    onChange={(event) => setColor(event.target.value)}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    aria-label="Chọn màu tùy chỉnh"
                                />
                            </label>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="schedule-note" className="mb-1.5 block text-sm font-medium text-slate-700">Ghi chú</Label>
                            <div className="relative">
                                <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Textarea id="schedule-note" rows={3} placeholder="Ví dụ: mang máy tính, kiểm tra giữa kỳ" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-20 rounded-lg bg-white pl-9" />
                            </div>
                        </div>
                    </div>
                </details>
            </div>

            {error && <p role="alert" className="mx-4 mb-5 border-l-2 border-red-500 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700 sm:mx-6">{error}</p>}
        </AppDialog>
    );
}

function CourseCard({
    sessions,
    hasConflict = false,
    onEdit,
    timelineMode = false,
}: {
    sessions: ScheduleSession | ScheduleSession[];
    hasConflict?: boolean;
    onEdit: (sessionId: string) => void;
    timelineMode?: boolean;
}) {
    const [showInfo, setShowInfo] = useState(false);
    const [hoverOpen, setHoverOpen] = useState(false);
    const isMobile = useIsMobile();
    const [mapLocation, setMapLocation] = useState<ScheduleMapLocation | null>(null);

    const colorClasses = {
        blue: 'bg-blue-50 border-blue-500',
        green: 'bg-green-50 border-green-500',
        yellow: 'bg-yellow-50 border-yellow-500',
        purple: 'bg-purple-50 border-purple-500',
    };

    // Đảm bảo sessions luôn là array
    const sessionArray = Array.isArray(sessions) ? sessions : [sessions];
    const primarySession = sessionArray[0];
    const sessionsForCard = hasConflict ? [primarySession] : sessionArray;
    const conflictingCourseCount = new Set(sessionArray.map((session) => session.courseCode)).size;
    const conflictLabel = conflictingCourseCount > 1
        ? `Trùng ${conflictingCourseCount} môn`
        : `Trùng ${sessionArray.length} buổi`;

    // Tính toán vị trí và chiều cao dựa trên tiết thực tế (inclusive endPeriod)
    const rowSpan = calculateRowSpan(primarySession);
    const start = primarySession.startPeriod;
    const displayEnd = getDisplayEnd(primarySession);
    const rowStart = Math.floor(start);

    // top: phần lẻ của tiết bắt đầu so với ô đầu, tính theo % của toàn bộ rowSpan
    const topOffsetPercent = ((start - rowStart) / rowSpan) * 100;
    // height: khoảng từ start đến displayEnd, tính theo % của toàn bộ rowSpan
    const heightPercent = ((displayEnd - start) / rowSpan) * 100;

    // Chọn màu theo trạng thái trùng lịch
    const isCustomColor = primarySession.color.startsWith('#');
    const displayColorClasses = hasConflict
        ? 'bg-red-50 border-red-500'
        : isCustomColor
            ? ''
            : colorClasses[primarySession.color as keyof typeof colorClasses];

    const customStyle = !hasConflict && isCustomColor ? {
        backgroundColor: `${primarySession.color}15`,
        borderColor: primarySession.color,
    } : {};

    function openEditor() {
        setHoverOpen(false);
        if (sessionArray.length === 1) onEdit(primarySession.id);
        else setShowInfo(true);
    }

    const choices = showInfo && sessionArray.map(session => (
        <button key={session.id} type="button"
            className="block min-h-11 w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-[#004A98]"
            onClick={() => { setShowInfo(false); onEdit(session.id); }}>
            <span className="block text-sm font-semibold">{session.courseCode} · {session.courseName}</span>
            <span className="block text-xs text-gray-600">{session.classCode} · {session.type} · {session.startTime}–{session.endTime} · {session.room}</span>
        </button>
    ));

    return (
        <>
            <HoverCard open={hoverOpen && !showInfo && !mapLocation} onOpenChange={setHoverOpen} openDelay={180} closeDelay={100}>
                <HoverCardTrigger asChild>
            <div
                className="relative w-full h-full"
                style={{ minHeight: timelineMode ? '100%' : `calc(var(--schedule-row-height, 36px) * ${rowSpan})` }}
            >
                <div
                    className={`absolute w-full p-1.5 rounded border-l-2 flex flex-col justify-center transition-all duration-200 cursor-pointer overflow-hidden
                        ${displayColorClasses}
                        ${showInfo ? 'ring-2 ring-blue-400 ring-inset' : ''}
                    `}
                    style={{
                        top: timelineMode ? 0 : `${topOffsetPercent}%`,
                        height: timelineMode ? 'calc(100% - 4px)' : `calc(${heightPercent}% - 6px)`,
                        ...customStyle
                    }}
                >
                    <button type="button"
                        aria-label={sessionArray.length > 1 ? 'Chọn buổi học trùng lịch' : 'Tùy chỉnh buổi học ' + primarySession.courseCode}
                        onClick={openEditor}
                        className="absolute inset-0 z-[1] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#004A98]"
                    />
                    {/* Note Indicator */}
                    {primarySession.note && (
                        <div className="absolute bottom-1 right-1 opacity-60">
                            <MessageSquare className="w-2.5 h-2.5" />
                        </div>
                    )}

                    {/* Badge trùng lịch */}
                    {hasConflict && (
                        <div className="mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 shrink-0 text-red-700" />
                            <span className="text-[11px] font-bold text-red-700">{conflictLabel}</span>
                        </div>
                    )}

                    {/* Hiển thị các môn học */}
                    {sessionsForCard.map((sess, idx) => (
                        <div key={sess.id} className={idx > 0 ? 'border-t border-red-200 pt-0.5 mt-0.5' : ''}>
                            <div className={`text-[9px] md:text-[11px] font-bold leading-tight mb-0.5 line-clamp-1 ${hasConflict ? 'text-red-700' : 'text-gray-700'}`}>
                                {sess.courseName}
                            </div>
                            <div className={`font-mono text-[8px] md:text-[10px] font-medium mb-0.5 leading-tight truncate ${hasConflict ? 'text-red-700' : 'text-gray-900'}`}>
                                {sess.courseCode}
                            </div>
                            <div className="text-[8px] leading-tight md:hidden [&_button]:relative [&_button]:z-[2]">
                                <RoomMapLink session={sess} variant="room-label" onOpenLocation={setMapLocation} />
                            </div>
                            <div className={`hidden min-w-0 [&_button]:relative [&_button]:z-[2] items-center gap-0.5 leading-tight md:flex md:text-[10px] ${hasConflict ? 'text-red-600' : 'text-gray-600'}`}>
                                <span className="min-w-0 truncate">{sess.type} | {sess.room} | {getCompactCampusLabel(sess.campusId)}</span>
                                <RoomMapLink session={sess} variant="icon" onOpenLocation={setMapLocation} />
                            </div>
                        </div>
                    ))}
                </div>

            </div>
                </HoverCardTrigger>

                {hasConflict && sessionArray.length > 1 && (
                    <HoverCardContent
                        side="top"
                        align="start"
                        sideOffset={8}
                        className="z-40 w-80 max-w-[calc(100vw-2rem)] rounded-lg border-red-200 bg-white p-0 text-gray-900 shadow-[0_14px_32px_rgba(127,29,29,0.16)]"
                    >
                        <div className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-3 py-2.5">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-red-900">{conflictLabel}</p>
                                <p className="mt-0.5 text-xs text-red-700">Các buổi học cùng chiếm khung giờ này.</p>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100 px-3">
                            {sessionArray.map((sess) => (
                                <div key={sess.id} className="py-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="min-w-0 truncate font-mono text-xs font-bold text-[#004A98]">{sess.courseCode}</span>
                                        <span className="shrink-0 text-xs font-medium text-slate-500">{sess.type} · {sess.classCode || '-'}</span>
                                    </div>
                                    <p className="mt-0.5 truncate text-sm font-medium text-gray-900">{sess.courseName}</p>
                                    <p className="mt-1 truncate text-xs text-slate-500">{sess.startTime} - {sess.endTime} · {sess.room || 'Chưa có phòng'}</p>
                                </div>
                            ))}
                        </div>
                    </HoverCardContent>
                )}
            </HoverCard>

            {isMobile ? showInfo && (
                <MobileBottomSheet
                    title="Chọn buổi học cần chỉnh"
                    eyebrow={conflictLabel}
                    onClose={() => setShowInfo(false)}
                    className="md:hidden"
                    contentClassName="space-y-2 px-4 py-4"
                >
                    {choices}
                </MobileBottomSheet>
            ) : (
                <AppDialog
                    open={showInfo}
                    onOpenChange={setShowInfo}
                    title="Chọn buổi học cần chỉnh"
                    description={conflictLabel}
                    icon={CalendarDays}
                    size="md"
                    contentClassName="space-y-2"
                >
                    {choices}
                </AppDialog>
            )}


            {mapLocation && <RoomLocationDialog
                open
                onOpenChange={(nextOpen) => { if (!nextOpen) setMapLocation(null); }}
                location={mapLocation}
            />}

        </>
    );
}

export { EditSessionDialog, CourseCard };
