import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';
import { toPng } from 'html-to-image';
import { Download, ImagePlus, Move, Trash2 } from 'lucide-react';
import { AppDialog } from '../../components/ui/overlays/app-dialog';
import { downloadImage } from '../../utils/export';
import { buildBasicTable, dayLabel, DEFAULT_RECT, groupLessons, IMAGE_SIZES, clamp, constrainRect, resizeOverlayRect, surfaceOpacityFromTransparency, type OverlayRect, type OverlayResizeDirection, type ScheduleImageLayout, type ScheduleImageLesson } from './schedule-image-model';
import { readBackground, writeBackground } from './schedule-image-storage';
import './schedule-image.css';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessons: ScheduleImageLesson[];
  title: string;
  subtitle?: string;
  filename?: string;
}

interface Preferences {
  sizeId: string;
  customWidth: number;
  customHeight: number;
  layout: ScheduleImageLayout;
  rects: Record<string, OverlayRect>;
  shade: number;
  surfaceTransparency: number;
  basicTextColor: 'black' | 'white';
  contentScale: number;
}

const STORAGE_KEY = 'ustudy:schedule-image:preferences:v1';
const DEFAULT_PREFS: Preferences = {
  sizeId: 'phone', customWidth: 1080, customHeight: 1920, layout: 'columns', rects: {},
  shade: 0, surfaceTransparency: 0, basicTextColor: 'black', contentScale: 100,
};

function loadPreferences(): Preferences {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<Preferences>;
    const known = Object.fromEntries(Object.entries(stored).filter(([key]) => key in DEFAULT_PREFS)) as Partial<Preferences>;
    return { ...DEFAULT_PREFS, ...known, rects: known.rects ?? {} };
  } catch { return DEFAULT_PREFS; }
}

const safeColor = (color: string) => /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#004a98';

function Lesson({ lesson }: { lesson: ScheduleImageLesson }) {
  return <div className="schedule-image-lesson" style={{ '--lesson-color': safeColor(lesson.color) } as CSSProperties}>
    <span className="schedule-image-time">{lesson.time}</span>
    <strong>{lesson.course}</strong>
    {lesson.room && <small>Phòng: {lesson.room}</small>}
  </div>;
}

function ScheduleArtwork({ lessons, layout, title, subtitle, rect, width, height, backgroundUrl, shade, surfaceTransparency, basicTextColor, contentScale, stageRef, panelRef }: Pick<Props, 'lessons' | 'title' | 'subtitle'> & {
  layout: ScheduleImageLayout; rect: OverlayRect; width: number; height: number; backgroundUrl: string | null;
  shade: number; surfaceTransparency: number; basicTextColor: 'black' | 'white'; contentScale: number;
  stageRef: RefObject<HTMLDivElement | null>; panelRef: RefObject<HTMLDivElement | null>;
}) {
  const groups = groupLessons(lessons);
  const basicTable = layout === 'basic-table' ? buildBasicTable(lessons) : null;
  const isBasic = layout === 'basic' || layout === 'basic-table';
  const surfaceOpacity = surfaceOpacityFromTransparency(surfaceTransparency);
  const compact = width * rect.width / 100 < 700 || groups.length >= 7;
  return <div ref={stageRef} className="schedule-image-stage" data-basic={isBasic} style={{ width, height, backgroundColor: isBasic || (!backgroundUrl && surfaceOpacity === 0) ? 'transparent' : undefined }}>
    {backgroundUrl && <img className="schedule-image-background" src={backgroundUrl} alt="" />}
    {backgroundUrl && shade > 0 && <div className="schedule-image-tint" style={{ opacity: shade / 100 }} />}
    <div ref={panelRef} className="schedule-image-panel" data-compact={compact} data-basic={isBasic} data-text-color={basicTextColor} style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%`, backgroundColor: isBasic ? 'transparent' : `rgb(255 255 255 / ${surfaceOpacity})`, '--schedule-content-scale': contentScale / 100, '--schedule-surface-opacity': surfaceOpacity, '--schedule-shadow-opacity': surfaceOpacity * 0.14 } as CSSProperties}>
      <div className="schedule-image-heading"><strong>{title}</strong>{subtitle && <span>{subtitle}</span>}</div>
      <div className={`schedule-image-content schedule-image-${layout}`} style={{ '--schedule-day-count': basicTable?.days.length ?? groups.length, '--schedule-period-count': basicTable?.periods.length ?? 10 } as CSSProperties}>
        {basicTable ? <>
          <div className="schedule-image-table-head" style={{ gridColumn: 1, gridRow: 1 }}>Tiết</div>
          {basicTable.days.map((day, index) => <div className="schedule-image-table-head" key={day.day} style={{ gridColumn: index + 2, gridRow: 1 }}>{day.short}</div>)}
          {basicTable.periods.map((period) => <div className="schedule-image-table-period" key={period} style={{ gridColumn: 1, gridRow: period + 1 }}>{period}</div>)}
          {basicTable.emptyCells.map(({ dayIndex, period }) => <div className="schedule-image-table-cell" key={`${basicTable.days[dayIndex].day}-${period}`} style={{ gridColumn: dayIndex + 2, gridRow: period + 1 }} />)}
          {basicTable.placements.map(({ lesson, dayIndex, rowStart, rowSpan, lane, laneCount }) => <div className="schedule-image-table-lesson" key={`${lesson.day}-${lesson.id}`} style={{ gridColumn: dayIndex + 2, gridRow: `${rowStart + 1} / span ${rowSpan}`, width: `${100 / laneCount}%`, marginLeft: `${lane * 100 / laneCount}%` }}>
            <strong>{lesson.course}</strong>{lesson.room && <small>Phòng: {lesson.room}</small>}
          </div>)}
        </> : layout === 'basic' ? groups.map((group) => <div className="schedule-image-basic-day" key={group.day}>
          <strong>{dayLabel(group.day)}</strong>
          {group.lessons.map((lesson) => <div className="schedule-image-basic-lesson" key={lesson.id}>
            <span>{lesson.time} · {lesson.course}</span>
            {lesson.room && <small>Phòng: {lesson.room}</small>}
          </div>)}
        </div>) : layout === 'list' ? groups.flatMap((group) => group.lessons.map((lesson) => <div key={`${group.day}-${lesson.id}`} className="schedule-image-list-row"><span>{dayLabel(group.day)}</span><Lesson lesson={lesson} /></div>)) :
          groups.map((group) => <div className="schedule-image-day" key={group.day}><div className="schedule-image-day-title">{dayLabel(group.day)}</div>{group.lessons.map((lesson) => <Lesson key={lesson.id} lesson={lesson} />)}</div>)}
      </div>
    </div>
  </div>;
}

export function ScheduleImageDialog({ open, onOpenChange, lessons, title, subtitle, filename = 'thoi-khoa-bieu' }: Props) {
  const [prefs, setPrefs] = useState(loadPreferences);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(0.4);
  const [overflow, setOverflow] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const imageUrlRef = useRef<string | null>(null);
  const imageRevisionRef = useRef(0);
  const dragRef = useRef<{ direction: OverlayResizeDirection | 'move'; x: number; y: number; rect: OverlayRect } | null>(null);
  const size = IMAGE_SIZES.find((item) => item.id === prefs.sizeId) ?? { id: 'custom', label: 'Tùy chỉnh', width: prefs.customWidth, height: prefs.customHeight };
  const sizeKey = size.id === 'custom' ? `custom:${size.width}x${size.height}` : size.id;
  const rect = constrainRect(prefs.rects[sizeKey] ?? DEFAULT_RECT);
  const groups = useMemo(() => groupLessons(lessons), [lessons]);

  const update = (patch: Partial<Preferences>) => setPrefs((previous) => ({ ...previous, ...patch }));
  const setRect = (next: OverlayRect) => setPrefs((previous) => ({ ...previous, rects: { ...previous.rects, [sizeKey]: constrainRect(next) } }));

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* Storage may be disabled. */ }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const revision = imageRevisionRef.current;
    readBackground().then((blob) => {
      if (!active || imageRevisionRef.current !== revision || !blob) return;
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = URL.createObjectURL(blob);
      setBackgroundUrl(imageUrlRef.current);
    }).catch(() => { /* Private browsing may disable IndexedDB. Upload still works. */ });
    return () => { active = false; };
  }, [open]);

  useEffect(() => () => { if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current); }, []);

  useEffect(() => {
    if (!open || !viewportRef.current) return;
    const element = viewportRef.current;
    const updateScale = () => setScale(Math.max(0.05, Math.min((element.clientWidth - 24) / size.width, (element.clientHeight - 24) / size.height, 1)));
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    updateScale();
    return () => observer.disconnect();
  }, [open, size.width, size.height]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const check = () => {
      const content = panel.querySelector('.schedule-image-content');
      const clippedLesson = Array.from(panel.querySelectorAll('.schedule-image-table-lesson'))
        .some((lesson) => lesson.scrollHeight > lesson.clientHeight + 2 || lesson.scrollWidth > lesson.clientWidth + 2);
      setOverflow(Boolean(content && (panel.scrollHeight > panel.clientHeight + 2 || content.scrollHeight > content.clientHeight + 2 || content.scrollWidth > content.clientWidth + 2 || clippedLesson)));
    };
    const observer = new ResizeObserver(check);
    observer.observe(panel);
    const content = panel.querySelector('.schedule-image-content');
    if (content) observer.observe(content);
    check();
    return () => observer.disconnect();
  }, [open, lessons, prefs.layout, prefs.contentScale, rect.width, rect.height, size.width, size.height]);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
      setError('Chọn ảnh PNG, JPG hoặc WebP không quá 15 MB.'); return;
    }
    setError('');
    imageRevisionRef.current += 1;
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = URL.createObjectURL(file);
    setBackgroundUrl(imageUrlRef.current);
    try {
      await writeBackground(file);
    } catch { setError('Không lưu được ảnh nền trên thiết bị này; ảnh vẫn dùng được trong phiên hiện tại.'); }
  };

  const removeBackground = async () => {
    imageRevisionRef.current += 1;
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setBackgroundUrl(null);
    try { await writeBackground(); } catch { setError('Không xóa được ảnh nền đã lưu trên thiết bị.'); }
  };

  const beginDrag = (event: PointerEvent<HTMLButtonElement>, direction: OverlayResizeDirection | 'move') => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { direction, x: event.clientX, y: event.clientY, rect };
  };
  const drag = (event: PointerEvent<HTMLButtonElement>) => {
    const initial = dragRef.current;
    if (!initial || !stageRef.current) return;
    const dx = (event.clientX - initial.x) / (size.width * scale) * 100;
    const dy = (event.clientY - initial.y) / (size.height * scale) * 100;
    setRect(initial.direction === 'move'
      ? { ...initial.rect, x: initial.rect.x + dx, y: initial.rect.y + dy }
      : resizeOverlayRect(initial.rect, initial.direction, dx, dy));
  };

  const handleDragKey = (event: KeyboardEvent<HTMLButtonElement>, direction: OverlayResizeDirection | 'move') => {
    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    const dx = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const dy = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    setRect(direction === 'move' ? { ...rect, x: rect.x + dx, y: rect.y + dy } : resizeOverlayRect(rect, direction, dx, dy));
  };

  const resizeDirections: OverlayResizeDirection[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const resizeLabels: Record<OverlayResizeDirection, string> = {
    nw: 'góc trên trái', n: 'cạnh trên', ne: 'góc trên phải', e: 'cạnh phải',
    se: 'góc dưới phải', s: 'cạnh dưới', sw: 'góc dưới trái', w: 'cạnh trái',
  };

  const exportPng = async () => {
    if (!stageRef.current || exporting) return;
    setExporting(true); setError('');
    try {
      // Controls sit outside the artwork and are never part of the capture.
      // `html-to-image` appends a query string when cacheBust is enabled. That
      // makes locally selected `blob:` background URLs invalid (`blob:...?time`),
      // so the export fails before the canvas can be drawn.
      const dataUrl = await toPng(stageRef.current, { width: size.width, height: size.height, pixelRatio: 1 });
      downloadImage(dataUrl, `${filename}-${size.width}x${size.height}.png`);
    } catch {
      setError('Không thể tạo ảnh. Thử ảnh nền nhỏ hơn hoặc một khổ ảnh khác.');
    } finally { setExporting(false); }
  };

  const slider = (label: string, value: number, onChange: (value: number) => void, min = 0, max = 100) => <label className="schedule-image-control">{label}: {Math.round(value)}%
    <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>;

  return <AppDialog open={open} onOpenChange={onOpenChange} title="Tạo ảnh thời khóa biểu" description="Chọn kiểu lịch, ảnh nền và kéo khung lịch đến vị trí mong muốn." icon={ImagePlus} size="xl" mobileFullScreen contentClassName="!m-0 !overflow-hidden !p-0" footer={<>
    <span className="mr-auto text-xs text-slate-500">Ảnh xuất đúng kích thước {size.width} × {size.height}px</span>
    <button type="button" className="ustudy-button-primary" disabled={exporting || lessons.length === 0} onClick={exportPng}><Download className="h-4 w-4" />{exporting ? 'Đang tạo ảnh…' : 'Tải PNG'}</button>
  </>}>
    <div className="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain border-b border-slate-200 p-4 lg:border-b-0 lg:border-r lg:p-5">
        <label className="schedule-image-control">Kiểu thời khóa biểu
          <select value={prefs.layout} onChange={(event) => update({ layout: event.target.value as ScheduleImageLayout })}>
            <option value="basic">Basic · theo ngày</option><option value="basic-table">Basic · bảng theo tiết</option><option value="columns">Bảng theo ngày</option><option value="cards">Thẻ từng ngày</option><option value="list">Danh sách</option>
          </select>
        </label>
        {(prefs.layout === 'basic' || prefs.layout === 'basic-table') && <label className="schedule-image-control">Màu chữ Basic
          <select value={prefs.basicTextColor} onChange={(event) => update({ basicTextColor: event.target.value as 'black' | 'white' })}>
            <option value="black">Chữ đen</option><option value="white">Chữ trắng</option>
          </select>
          <span className="text-xs font-normal text-slate-500">Không có ảnh nền, PNG sẽ trong suốt.</span>
        </label>}
        <label className="schedule-image-control">Kích thước ảnh
          <select value={prefs.sizeId} onChange={(event) => update({ sizeId: event.target.value })}>
            {IMAGE_SIZES.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.width}×{item.height}</option>)}
            <option value="custom">Tùy chỉnh</option>
          </select>
        </label>
        {prefs.sizeId === 'custom' && <div className="grid grid-cols-2 gap-2">
          {(['customWidth', 'customHeight'] as const).map((key) => <label key={key} className="schedule-image-control">{key === 'customWidth' ? 'Rộng (px)' : 'Cao (px)'}
            <input type="number" min={600} max={3000} value={prefs[key]} onChange={(event) => update({ [key]: clamp(Number(event.target.value) || 600, 600, 3000) })} />
          </label>)}
        </div>}
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-slate-800">Ảnh nền</span>
          <label className="schedule-image-secondary cursor-pointer"><ImagePlus className="h-4 w-4" />Tải ảnh lên
            <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void onFile(event.target.files?.[0]); event.target.value = ''; }} />
          </label>
          {backgroundUrl && <button type="button" className="ml-2 inline-flex items-center gap-1 text-sm text-red-600" onClick={() => void removeBackground()}><Trash2 className="h-4 w-4" />Xóa ảnh</button>}
          <p className="text-xs text-slate-500">Ảnh chỉ lưu trên thiết bị này, không tải lên máy chủ.</p>
          {backgroundUrl && slider('Làm tối nền', prefs.shade, (value) => update({ shade: value }), 0, 70)}
        </div>
        <div className="space-y-2 border-t border-slate-200 pt-4">
          {(prefs.layout === 'columns' || prefs.layout === 'cards' || prefs.layout === 'list') && <>
            {slider('Độ trong suốt nền lịch', prefs.surfaceTransparency, (value) => update({ surfaceTransparency: value }))}
            <p className="text-xs text-slate-500">0%: nền đặc · 100%: nền trong suốt, chữ vẫn rõ.</p>
          </>}
          {slider('Cỡ nội dung', prefs.contentScale, (value) => update({ contentScale: value }), 30, 200)}
          <p className="text-xs text-slate-500">Kéo biểu tượng và các cạnh ngay trên ảnh để chỉnh khung.</p>
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 shrink-0 basis-[44%] flex-col overflow-hidden bg-slate-100 p-3 lg:basis-auto lg:p-5">
        {lessons.length === 0 ? <p className="py-12 text-center text-sm text-slate-500">Chưa có buổi học để tạo ảnh.</p> : <>
          <p className="mb-3 shrink-0 text-xs text-slate-600">{groups.length} ngày · {lessons.length} buổi học{overflow && <span className="ml-2 font-semibold text-amber-700">Nội dung đang bị cắt — kéo rộng khung, giảm cỡ nội dung hoặc đổi kiểu lịch.</span>}</p>
          <div ref={viewportRef} className="schedule-image-preview flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden rounded-lg border border-slate-200 p-3" data-text-color={prefs.layout === 'basic' || prefs.layout === 'basic-table' ? prefs.basicTextColor : 'black'}>
            <div style={{ width: size.width * scale, height: size.height * scale, position: 'relative', flex: 'none' }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                <ScheduleArtwork lessons={lessons} title={title} subtitle={subtitle} layout={prefs.layout} rect={rect} width={size.width} height={size.height} backgroundUrl={backgroundUrl} shade={prefs.shade} surfaceTransparency={prefs.surfaceTransparency} basicTextColor={prefs.basicTextColor} contentScale={prefs.contentScale} stageRef={stageRef} panelRef={panelRef} />
              </div>
              <div className="schedule-image-selection" style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%` }}>
                <button type="button" className="schedule-image-move" aria-label="Kéo để di chuyển khung lịch" onPointerDown={(event) => beginDrag(event, 'move')} onPointerMove={drag} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onKeyDown={(event) => handleDragKey(event, 'move')}><span><Move aria-hidden="true" /></span></button>
                {resizeDirections.map((direction) => <button key={direction} type="button" className="schedule-image-handle" data-direction={direction} aria-label={`Kéo ${resizeLabels[direction]} để đổi kích thước khung lịch`} onPointerDown={(event) => beginDrag(event, direction)} onPointerMove={drag} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onKeyDown={(event) => handleDragKey(event, direction)} />)}
              </div>
            </div>
          </div>
        </>}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  </AppDialog>;
}
