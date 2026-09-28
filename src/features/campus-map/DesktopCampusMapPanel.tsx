import { ArrowLeft, Building2, ChevronRight, Layers3 } from 'lucide-react';
import { CAMPUS_MAP_DATA as data, type Campus, type CampusId, type BuildingRuntime, type FloorRuntime } from '../../domain/campus-map';

interface DesktopCampusMapPanelProps {
  campus?: Campus;
  campusId: CampusId;
  building?: BuildingRuntime;
  buildingIds: string[];
  floorIds: string[];
  floorId?: string;
  floor?: FloorRuntime;
  visibleFloor?: FloorRuntime;
  roomId: string | null;
  isFloorView: boolean;
  select: (next: Record<string, string>) => void;
  selectFloor: (id: string) => void;
  openFloor: () => void;
}

export function DesktopCampusMapPanel({
  campus, campusId, building, buildingIds, floorIds, floorId, floor,
  visibleFloor, roomId, isFloorView, select, selectFloor, openFloor,
}: DesktopCampusMapPanelProps) {
  const totalFloors = buildingIds.reduce((sum, id) => sum + (data.floorIdsByBuildingId[id]?.length ?? 0), 0);
  const totalRooms = floorIds.reduce((sum, id) => sum + (data.roomIdsByFloorId[id]?.length ?? 0), 0);
  const roomIds = visibleFloor ? data.roomIdsByFloorId[visibleFloor.fullId] ?? [] : [];

  return (
    <aside className="flex h-[clamp(28rem,calc(100dvh-14rem),40rem)] min-w-0 self-start flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Thông tin bản đồ">
      <header className="min-h-28 shrink-0 bg-[#004A98] px-5 py-5 text-white">
        {building && (
          <button type="button" onClick={() => select({ campusId })} className="mb-2 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-blue-50 hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />Tất cả tòa
          </button>
        )}
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <h3 className="min-w-0 text-lg font-semibold">{building?.name ?? campus?.name ?? 'Cơ sở'}</h3>
        </div>
        <p className="mt-2 text-sm tabular-nums text-blue-100">
          {building ? `${floorIds.length} tầng · ${totalRooms} phòng` : `${buildingIds.length} tòa · ${totalFloors} tầng`}
        </p>
      </header>

      {!building ? (
        <section className="flex min-h-0 flex-1 flex-col p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">Danh sách tòa</h4>
          {buildingIds.length ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain divide-y divide-slate-100 border-y border-slate-200" role="region" aria-label="Danh sách tòa" tabIndex={0}>
              {buildingIds.map(id => (
                <button key={id} type="button" onClick={() => select({ campusId, buildingId: id })} className="group flex min-h-11 w-full items-center gap-2 px-1 py-2 text-left text-sm text-slate-700 hover:bg-blue-50">
                  <Building2 className="h-4 w-4 shrink-0 text-[#004A98]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 font-medium">{data.buildingsById[id].name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">Chưa có dữ liệu tòa.</p>}
        </section>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
            <section>
              <h4 className="mb-2 text-sm font-semibold text-slate-900">Chọn tầng</h4>
              {floorIds.length ? (
                <div className="grid max-h-36 grid-cols-5 gap-2 overflow-y-auto overscroll-contain" role="region" aria-label="Danh sách tầng" tabIndex={0}>
                  {floorIds.map(id => {
                    const item = data.floorsById[id];
                    const active = id === floorId;
                    return <button key={id} type="button" onClick={() => selectFloor(id)} aria-pressed={active} aria-label={item.label} className={`flex min-h-11 items-center justify-center rounded-lg px-1 text-xs font-semibold ${active ? 'bg-[#004A98] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-blue-50'}`}>{item.label.replace(/^Tầng\s*/i, '')}</button>;
                  })}
                </div>
              ) : <p className="text-sm text-slate-500">Chưa có dữ liệu tầng.</p>}
            </section>
            {isFloorView && visibleFloor && (
              <section className="border-t border-slate-200 pt-3">
                <h4 className="mb-2 text-sm font-semibold text-slate-900">Phòng · {visibleFloor.label}</h4>
                {roomIds.length ? (
                  <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto overscroll-contain" role="region" aria-label="Danh sách phòng" tabIndex={0}>
                    {roomIds.map(id => <button key={id} type="button" aria-pressed={roomId === id} onClick={() => select({ roomId: id })} className={`min-h-9 rounded-lg border px-3 py-1.5 text-sm ${roomId === id ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{data.roomsById[id].label}</button>)}
                  </div>
                ) : <p className="text-sm text-slate-500">Chưa có dữ liệu phòng.</p>}
              </section>
            )}
          </div>
          <footer className="shrink-0 border-t border-slate-200 p-4">
            <button type="button" onClick={openFloor} disabled={!floor?.map} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#004A98] text-sm font-semibold text-white hover:bg-[#003A78] disabled:cursor-not-allowed disabled:opacity-50">
              <Layers3 className="h-4 w-4" aria-hidden="true" />
              {floor?.map ? `Xem bản đồ ${floor.label.toLocaleLowerCase()}` : 'Tầng này chưa có sơ đồ'}
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}

