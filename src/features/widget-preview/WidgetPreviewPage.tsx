import { useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock3, GraduationCap, MapPin, MoveDiagonal2, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../components/layout/page-header';
import { PageShell } from '../../components/layout/page-shell';
import { Button } from '../../components/ui/form/button';
import './widget-preview.css';

type WidgetSize = '2x2' | '4x2' | '4x3';
type SampleState = 'sample' | 'long-title' | 'empty' | 'stale';
type Dimensions = { width: number; height: number };

const PRESETS: Record<WidgetSize, Dimensions> = {
    '2x2': { width: 130, height: 130 },
    '4x2': { width: 320, height: 145 },
    '4x3': { width: 320, height: 250 },
};

const SCHEDULE_DAYS = [
    {
        date: 'Thứ Ba, 06/10',
        sessions: [
            { start: '07:30', end: '11:00', title: 'Nhập môn xử lý ngôn ngữ tự nhiên', room: 'D105' },
        ],
    },
    {
        date: 'Thứ Tư, 07/10',
        sessions: [
            { start: '07:30', end: '11:00', title: 'Cơ sở trí tuệ nhân tạo', room: 'F302' },
            { start: '13:30', end: '17:00', title: 'Nhập môn thiết kế và phân tích giải thuật', room: 'F301' },
        ],
    },
    {
        date: 'Thứ Sáu, 09/10',
        sessions: [
            { start: '07:30', end: '11:00', title: 'Hệ điều hành', room: 'F106' },
        ],
    },
] as const;

const SAMPLE_OPTIONS: Array<{ value: SampleState; label: string }> = [
    { value: 'sample', label: 'Lịch mẫu' },
    { value: 'long-title', label: 'Tên môn và phòng dài' },
    { value: 'empty', label: 'Chưa có lịch' },
    { value: 'stale', label: 'Lịch đã cũ' },
];

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function NextClassMock({ state, width, height }: { state: SampleState; width: number; height: number }) {
    const side = Math.min(width, height);
    const hasData = state === 'sample' || state === 'long-title';
    const title = state === 'long-title'
        ? 'Nhập môn thiết kế và phân tích giải thuật nâng cao'
        : state === 'stale' ? 'Lịch đã cũ' : state === 'empty' ? 'Chưa có lịch' : 'Hệ điều hành';
    const room = state === 'long-title' ? 'CS2:PM_B4-2_6.2' : 'F106';
    const status = state === 'stale' ? 'Mở UStudy cập nhật'
        : state === 'empty' ? 'Mở UStudy để nạp lịch' : 'Ngày mai · 07:30';

    return (
        <div className="widget-mock-next-slot"><div className={`widget-mock widget-mock-next${side >= 180 ? ' is-expanded' : ''}`} style={{ width: side, height: side }} aria-label="Mô phỏng widget buổi học tiếp theo">
            <div className="widget-mock-next-header">
                <span className="widget-mock-next-logo"><GraduationCap aria-hidden="true" /></span>
                <span className="widget-mock-next-brand">UStudy</span>
                <span className="widget-mock-next-overline">TIẾP THEO</span>
            </div>
            <div className="widget-mock-next-main">
                <div className="widget-mock-date">
                    <span>{hasData ? 'Th 6' : ''}</span>
                    <strong>{hasData ? '25' : '–'}</strong>
                    <span>{hasData ? 'thg 9' : ''}</span>
                </div>
                <div className="widget-mock-next-info">
                    <span className="widget-mock-course-name" title={title}>{title}</span>
                    {hasData && (
                        <>
                            <strong className="widget-mock-next-time">07:30–11:00</strong>
                            <span className="widget-mock-next-room" title={room}><MapPin aria-hidden="true" />{room}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="widget-mock-next-footer">
                <Clock3 aria-hidden="true" />
                <span title={status}>{status}</span>
                <ChevronRight aria-hidden="true" />
            </div>
        </div></div>
    );
}

function ScheduleMock({ compact, state }: { compact: boolean; state: SampleState }) {
    const hasData = state === 'sample' || state === 'long-title';
    const emptyMessage = state === 'stale' ? 'Lịch đã cũ. Mở UStudy để cập nhật.' : 'Mở UStudy để nạp lịch học.';

    return (
        <div className={`widget-mock widget-mock-schedule${compact ? ' is-compact' : ''}`} aria-label="Mô phỏng widget lịch học cuộn">
            <div className="widget-mock-schedule-header">
                <span className="widget-mock-schedule-logo">U</span>
                <span className="widget-mock-schedule-heading"><strong>UStudy</strong><span>Lịch học</span></span>
                <span className="widget-mock-open">Mở <ChevronRight aria-hidden="true" /></span>
            </div>
            <div className="widget-mock-schedule-list" tabIndex={0} aria-label="Danh sách lịch học cuộn được">
                {hasData ? SCHEDULE_DAYS.map((day, dayIndex) => (
                    <div className="widget-mock-day" key={day.date}>
                        <div className={`widget-mock-day-header${dayIndex % 2 ? ' is-lilac' : ''}`}>
                            <CalendarDays aria-hidden="true" />
                            <strong>{day.date}</strong>
                        </div>
                        {day.sessions.map((session, sessionIndex) => {
                            const longTitle = state === 'long-title' && dayIndex === 0 && sessionIndex === 0;
                            const title = longTitle ? 'Nhập môn thiết kế và phân tích giải thuật nâng cao' : session.title;
                            const room = longTitle ? 'CS2:PM_B4-2_6.2' : session.room;
                            return (
                                <div className="widget-mock-session" key={`${day.date}-${session.start}`}>
                                    <span className="widget-mock-session-mark" />
                                    <span className="widget-mock-session-time"><strong>{session.start}</strong><span>{session.end}</span></span>
                                    <span className="widget-mock-session-content">
                                        <strong title={title}>{title}</strong>
                                        <span title={`Phòng ${room}`}><MapPin aria-hidden="true" />Phòng {room}</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )) : <div className="widget-mock-empty">{emptyMessage}</div>}
            </div>
        </div>
    );
}

export function WidgetPreviewPage() {
    const [preset, setPreset] = useState<WidgetSize>('4x3');
    const [dimensions, setDimensions] = useState<Dimensions>(PRESETS['4x3']);
    const [sampleState, setSampleState] = useState<SampleState>('sample');
    const [zoom, setZoom] = useState(1.5);
    const resizeStart = useRef<({ x: number; y: number } & Dimensions) | null>(null);

    const selectPreset = (value: WidgetSize) => {
        setPreset(value);
        setDimensions(PRESETS[value]);
    };

    const onResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        resizeStart.current = { x: event.clientX, y: event.clientY, ...dimensions };
    };
    const onResizeMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (!resizeStart.current) return;
        const start = resizeStart.current;
        setDimensions({
            width: preset === '2x2' ? clamp(Math.round(start.width + (event.clientX - start.x) / zoom), 130, 420) : start.width,
            height: clamp(Math.round(start.height + (event.clientY - start.y) / zoom), 115, 320),
        });
    };
    const onResizeEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
        resizeStart.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    const onResizeKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        const step = event.shiftKey ? 1 : 10;
        const delta = {
            ArrowLeft: { width: -step, height: 0 }, ArrowRight: { width: step, height: 0 },
            ArrowUp: { width: 0, height: -step }, ArrowDown: { width: 0, height: step },
        }[event.key];
        if (!delta) return;
        event.preventDefault();
        setDimensions((current) => ({
            width: preset === '2x2' ? clamp(current.width + delta.width, 130, 420) : current.width,
            height: clamp(current.height + delta.height, 115, 320),
        }));
    };

    const isNextClass = preset === '2x2';
    const compact = !isNextClass && dimensions.height < 160;
    const frameStyle: CSSProperties = { width: dimensions.width * zoom, height: dimensions.height * zoom };
    const widgetStyle: CSSProperties = { width: dimensions.width, height: dimensions.height, transform: `scale(${zoom})` };

    return (
        <PageShell
            header={(
                <PageHeader title="Xem trước widget Android"
                    description="Mô phỏng giao diện trên laptop với dữ liệu mẫu. Chỉ có trong chế độ dev."
                    actions={<Button asChild variant="outline" size="sm"><Link to="/dashboard">Về UStudy</Link></Button>} />
            )}
        >
            <div className="widget-preview-layout">
                <section className="widget-preview-controls" aria-label="Tùy chỉnh bản xem trước">
                    <div className="widget-preview-control-group">
                        <span className="widget-preview-label">Kích thước widget</span>
                        <div className="widget-preview-segments" role="group" aria-label="Kích thước widget">
                            {(['2x2', '4x2', '4x3'] as const).map((size) => (
                                <button key={size} type="button" aria-pressed={preset === size}
                                    onClick={() => selectPreset(size)}>{size.replace('x', '×')}</button>
                            ))}
                        </div>
                    </div>
                    <label className="widget-preview-control-group">
                        <span className="widget-preview-label">Dữ liệu hiển thị</span>
                        <select value={sampleState} onChange={(event) => setSampleState(event.target.value as SampleState)}>
                            {SAMPLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </label>
                    <div className="widget-preview-control-group">
                        <div className="widget-preview-label-row"><label htmlFor="widget-preview-width">Rộng</label><output>{dimensions.width} dp</output></div>
                        <input id="widget-preview-width" type="range" min="130" max="420" step="1" value={dimensions.width}
                            onChange={(event) => setDimensions((current) => ({ ...current, width: Number(event.target.value) }))} />
                    </div>
                    <div className="widget-preview-control-group">
                        <div className="widget-preview-label-row"><label htmlFor="widget-preview-height">Cao</label><output>{dimensions.height} dp</output></div>
                        <input id="widget-preview-height" type="range" min="115" max="320" step="1" value={dimensions.height}
                            onChange={(event) => setDimensions((current) => ({ ...current, height: Number(event.target.value) }))} />
                    </div>
                    <div className="widget-preview-control-group">
                        <div className="widget-preview-label-row"><label htmlFor="widget-preview-zoom">Phóng to bản xem trước</label><output>{Math.round(zoom * 100)}%</output></div>
                        <input id="widget-preview-zoom" type="range" min="1" max="2" step="0.25" value={zoom}
                            onChange={(event) => setZoom(Number(event.target.value))} />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDimensions(PRESETS[preset])}>
                        <RotateCcw aria-hidden="true" /> Đặt lại kích thước
                    </Button>
                    <p className="widget-preview-hint">Widget nhỏ luôn vuông; vùng dư trong suốt. Widget lịch chỉ kéo đổi chiều cao, danh sách cuộn được. Thanh rộng mô phỏng vùng launcher cấp, không phải thao tác resize ngang.</p>
                </section>

                <section className="widget-preview-workspace" aria-label="Vùng xem trước widget">
                    <div className="widget-preview-workspace-header">
                        <div><strong>{preset.replace('x', '×')}</strong><span>{compact ? 'Header thu gọn' : isNextClass ? 'Buổi học tiếp theo' : 'Lịch học cuộn'}</span></div>
                        <span>{dimensions.width} × {dimensions.height} dp</span>
                    </div>
                    <div className="widget-preview-stage">
                        <div className="widget-preview-stage-inner">
                            <div className="widget-preview-frame" style={frameStyle}>
                                <div className="widget-preview-scaled" style={widgetStyle}>
                                    {isNextClass ? <NextClassMock state={sampleState} width={dimensions.width} height={dimensions.height} /> : <ScheduleMock compact={compact} state={sampleState} />}
                                </div>
                                <button type="button" className="widget-preview-resize"
                                    aria-label="Kéo để đổi kích thước widget; dùng phím mũi tên khi được chọn"
                                    title="Kéo để đổi kích thước"
                                    onPointerDown={onResizeStart} onPointerMove={onResizeMove}
                                    onPointerUp={onResizeEnd} onPointerCancel={onResizeEnd} onKeyDown={onResizeKeyDown}>
                                    <MoveDiagonal2 aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="widget-preview-caveat">Bản này dùng HTML/CSS để xem bố cục; font và cách cắt nội dung trên launcher Android có thể khác. Hãy kiểm tra APK trước khi phát hành.</p>
                </section>
            </div>
        </PageShell>
    );
}
