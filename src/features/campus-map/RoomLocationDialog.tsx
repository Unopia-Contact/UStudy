import { AlertTriangle, Building2, DoorOpen, ExternalLink, Layers3, MapPinned } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../app/routes';
import { AppDialog } from '../../components/ui/overlays/app-dialog';
import { CAMPUS_MAP_DATA } from '../../domain/campus-map';
import { DongHoaCampusDiagram } from './DongHoaCampusDiagram';
import { InlineFloorSvg } from './InlineFloorSvg';
import { MapViewport } from './MapViewport';
import type { ScheduleMapLocation } from './services/resolve-schedule-location';

type MapMode = 'floor' | 'campus';

function EmptyMapState({ title, detail }: { title: string; detail: string }) {
  return <div className="flex min-h-[340px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:min-h-[480px]">
    <MapPinned className="h-7 w-7 text-slate-400" aria-hidden="true" />
    <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
    <p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">{detail}</p>
  </div>;
}

export function RoomLocationDialog({ open, onOpenChange, location }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: ScheduleMapLocation;
}) {
  const [mode, setMode] = useState<MapMode>(location.floorMapAvailable ? 'floor' : 'campus');

  useEffect(() => {
    if (open) setMode(location.floorMapAvailable ? 'floor' : 'campus');
  }, [location.floor.fullId, location.floorMapAvailable, open]);

  const fullMapUrl = `${APP_ROUTES.campusMap}?${new URLSearchParams({ roomId: location.room.fullId, from: 'schedule' })}`;
  const campusBuildings = (CAMPUS_MAP_DATA.buildingIdsByCampusId[location.campus.id] ?? [])
    .map((id) => CAMPUS_MAP_DATA.buildingsById[id]);

  const map = mode === 'floor'
    ? location.floor.map
      ? <MapViewport
          width={location.floor.map.viewBox[2]}
          height={location.floor.map.viewBox[3]}
          label={`Sơ đồ ${location.building.name}, ${location.floor.label}`}
          resetKey={`${location.floor.fullId}:${location.room.fullId}`}
          className="max-md:!min-h-[420px]"
        >
          <InlineFloorSvg asset={location.floor.map.asset} selectedShapeId={location.room.map?.shapeId} />
        </MapViewport>
      : <EmptyMapState title="Chưa có sơ đồ tầng" detail={`UStudy đã xác định ${location.room.label} thuộc ${location.building.name}, ${location.floor.label}, nhưng chưa có bản vẽ tầng này.`} />
    : location.campus.id === 'dong-hoa'
      ? <DongHoaCampusDiagram buildings={campusBuildings} selectedId={location.building.fullId} />
      : location.campus.map
        ? <MapViewport width={location.campus.map.viewBox[2]} height={location.campus.map.viewBox[3]} label={`Sơ đồ ${location.campus.name}`} resetKey={location.campus.id}>
            <image href={location.campus.map.asset} width={location.campus.map.viewBox[2]} height={location.campus.map.viewBox[3]} />
          </MapViewport>
        : <EmptyMapState title="Chưa có sơ đồ khuôn viên" detail={`UStudy đã xác định phòng thuộc ${location.building.name}, nhưng ${location.campus.name} chưa có bản đồ khuôn viên.`} />;

  return <AppDialog
    open={open}
    onOpenChange={onOpenChange}
    title={`Vị trí ${location.room.label}`}
    description={`${location.campus.shortName} → ${location.building.name} → ${location.floor.label} → ${location.room.label}`}
    icon={MapPinned}
    size="xl"
    mobileFullScreen
    contentClassName="!m-0 !space-y-0 !overflow-hidden !p-0"
    footer={<>
      <button type="button" className="ustudy-button-secondary justify-center" onClick={() => onOpenChange(false)}>Đóng</button>
      <Link to={fullMapUrl} onClick={() => onOpenChange(false)} className="ustudy-button-primary justify-center">
        <ExternalLink className="h-4 w-4" aria-hidden="true" />Mở bản đồ đầy đủ
      </Link>
    </>}
  >
    <div className="grid h-full min-h-0 overflow-y-auto md:grid-cols-[minmax(0,1fr)_280px] md:overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-col bg-slate-50 p-3 sm:p-4" aria-label="Bản đồ vị trí phòng">
        <div className="mb-3 grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1" role="group" aria-label="Chọn loại bản đồ">
          <button type="button" onClick={() => setMode('floor')} aria-pressed={mode === 'floor'} className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${mode === 'floor' ? 'bg-[#004A98] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Layers3 className="h-4 w-4" aria-hidden="true" />{location.floor.label}
          </button>
          <button type="button" onClick={() => setMode('campus')} aria-pressed={mode === 'campus'} className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${mode === 'campus' ? 'bg-[#004A98] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Building2 className="h-4 w-4" aria-hidden="true" />Khuôn viên
          </button>
        </div>
        <div className="min-h-0 flex-1">{map}</div>
        {mode === 'floor' && location.floorMapAvailable && !location.roomShapeAvailable && <p role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Sơ đồ tầng đã có, nhưng vị trí chính xác của phòng chưa được đánh dấu.
        </p>}
      </section>

      <aside className="min-h-0 overflow-y-auto border-t border-slate-200 bg-white p-5 md:border-l md:border-t-0" aria-label="Thông tin vị trí">
        <div className={`mb-5 flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-5 ${location.status === 'inferred' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
          {location.status === 'inferred' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <MapPinned className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <span>{location.status === 'inferred' ? 'Vị trí được suy luận từ cấu trúc mã phòng Portal.' : 'Mã phòng Portal đã được liên kết với dữ liệu bản đồ.'}</span>
        </div>

        <h3 className="text-sm font-semibold text-slate-900">Đường đến phòng</h3>
        <ol className="mt-3 space-y-0">
          {[
            { icon: MapPinned, label: 'Cơ sở', value: location.campus.name },
            { icon: Building2, label: 'Tòa nhà', value: location.building.name },
            { icon: Layers3, label: 'Tầng', value: location.floor.label },
            { icon: DoorOpen, label: 'Phòng', value: location.room.label },
          ].map((step, index, steps) => <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
            {index < steps.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-28px)] w-px bg-slate-200" aria-hidden="true" />}
            <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]"><step.icon className="h-4 w-4" aria-hidden="true" /></span>
            <span className="min-w-0 pt-0.5"><span className="block text-xs text-slate-500">{step.label}</span><span className="block text-sm font-semibold text-slate-900">{step.value}</span></span>
          </li>)}
        </ol>

        {location.room.navigation?.instruction && <div className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Hướng dẫn</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{location.room.navigation.instruction}</p>
        </div>}
      </aside>
    </div>
  </AppDialog>;
}
