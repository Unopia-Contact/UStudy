import { ArrowLeft, Building2, ChevronRight, Layers3, MapPinned } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MobileBottomSheet } from '../../components/ui/overlays/mobile-bottom-sheet';
import { APP_ROUTES } from '../../app/routes';
import { CAMPUS_MAP_DATA, type CampusId, type CampusPlaceSearchResult } from '../../domain/campus-map';
import { CampusMapSearch } from './CampusMapSearch';
import { DongHoaCampusDiagram } from './DongHoaCampusDiagram';
import { InlineFloorSvg } from './InlineFloorSvg';
import { MapViewport } from './MapViewport';

const data = CAMPUS_MAP_DATA;
const campusIds: CampusId[] = ['dong-hoa', 'cho-quan'];

export default function CampusMap() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const roomId = params.get('roomId');
  const room = roomId ? data.roomsById[roomId] : undefined;
  const roomFloor = room ? data.floorsById[room.floorId] : undefined;
  const requestedBuildingId = params.get('buildingId');
  const building = roomFloor ? data.buildingsById[roomFloor.buildingId] : requestedBuildingId ? data.buildingsById[requestedBuildingId] : undefined;
  const requestedCampusId = params.get('campusId') as CampusId | null;
  const campusId = building?.campusId ?? (requestedCampusId && data.campusesById[requestedCampusId] ? requestedCampusId : 'dong-hoa');
  const campus = data.campusesById[campusId];
  const buildingIds = data.buildingIdsByCampusId[campusId] ?? [];
  const floorIds = building ? data.floorIdsByBuildingId[building.fullId] ?? [] : [];
  const requestedFloorId = params.get('floorId');
  const floorId = roomFloor?.fullId ?? (requestedFloorId && floorIds.includes(requestedFloorId) ? requestedFloorId : floorIds[0]);
  const floor = floorId ? data.floorsById[floorId] : undefined;
  const isFloorView = params.get('view') === 'floor' || Boolean(room);
  const mapFloorId = params.get('mapFloor');
  const visibleFloor = isFloorView ? roomFloor ?? (mapFloorId && floorIds.includes(mapFloorId) ? data.floorsById[mapFloorId] : floor) : undefined;

  function select(next: Record<string, string>) { setNotice(''); if (params.get('from') === 'schedule') next.from = 'schedule'; setParams(next); setShowBuildings(false); setShowRooms(false); }
  function selectFloor(id: string) { if (building) select({ campusId, buildingId: building.fullId, floorId: id, ...(isFloorView && visibleFloor ? { view: 'floor', mapFloor: visibleFloor.fullId } : {}) }); }
  function openFloor() { if (building && floor?.map) { setSheetOpen(false); select({ campusId, buildingId: building.fullId, floorId: floor.fullId, view: 'floor', mapFloor: floor.fullId }); } }
  function selectSearchResult(result: CampusPlaceSearchResult) {
    setSheetOpen(true);
    if (result.type === 'room' && result.roomId) {
      select({ roomId: result.roomId });
      if (!result.hasFloorMap) setNotice('Đã tìm thấy phòng, nhưng tầng này chưa có sơ đồ.');
      else if (!result.hasRoomShape) setNotice('Đã tìm thấy phòng, nhưng vị trí phòng chưa được đánh dấu trên sơ đồ.');
      return;
    }
    if (result.type === 'floor' && result.floorId) {
      select({ campusId: result.campusId, buildingId: result.buildingId, floorId: result.floorId, view: 'floor', mapFloor: result.floorId });
      if (!result.hasFloorMap) setNotice('Đã tìm thấy tầng, nhưng tầng này chưa có sơ đồ.');
      return;
    }
    select({ campusId: result.campusId, buildingId: result.buildingId });
  }

  const mapContent = isFloorView && building && visibleFloor?.map ? <MapViewport width={visibleFloor.map.viewBox[2]} height={visibleFloor.map.viewBox[3]} label={`Sơ đồ ${building.name} ${visibleFloor.label}`} resetKey={visibleFloor.fullId}>
    <InlineFloorSvg asset={visibleFloor.map.asset} selectedShapeId={room?.floorId === visibleFloor.fullId ? room.map?.shapeId : undefined} />
  </MapViewport> : !isFloorView && campusId === 'dong-hoa' ? <DongHoaCampusDiagram buildings={(data.buildingIdsByCampusId['dong-hoa'] ?? []).map((id) => data.buildingsById[id])} selectedId={building?.fullId} onSelect={(id) => { select({ campusId: 'dong-hoa', buildingId: id }); setSheetOpen(true); }} /> : !isFloorView && campus?.map ? <MapViewport width={campus.map.viewBox[2]} height={campus.map.viewBox[3]} label={`Sơ đồ khuôn viên ${campus.name}`} resetKey={campus.id}>
    <image href={campus.map.asset} width={campus.map.viewBox[2]} height={campus.map.viewBox[3]} />
  </MapViewport> : <div className="flex min-h-[340px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center"><MapPinned className="h-7 w-7 text-slate-400" aria-hidden="true" /><p className="mt-2 text-sm font-semibold text-slate-800">{isFloorView ? 'Chưa có sơ đồ tầng' : 'Chưa có sơ đồ khuôn viên'}</p><p className="mt-1 max-w-sm text-sm text-slate-500">Bạn vẫn có thể tìm phòng và xem danh sách tòa, tầng.</p></div>;

  const details = <aside className="flex min-w-0 flex-col bg-white" aria-label="Thông tin bản đồ">{(!building || showBuildings) ? <><div className="flex-1 p-5"><h4 className="mb-3 text-sm font-semibold text-slate-900">Danh sách tòa</h4>{buildingIds.length ? <div className="divide-y divide-slate-100 border-y border-slate-200">{buildingIds.map((id) => <button key={id} type="button" onClick={() => { select({ campusId, buildingId: id }); setSheetOpen(true); }} className="group flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]"><Building2 className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1 font-medium">{data.buildingsById[id].name}</span><ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" /></button>)}</div> : <p className="text-sm text-slate-500">Chưa có tòa nào trong dữ liệu mới.</p>}</div></> : <><div className="flex-1 space-y-4 p-4"><button type="button" onClick={() => setShowBuildings(true)} className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm text-[#004A98]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Đổi tòa</button><section><h4 className="mb-3 text-sm font-semibold text-slate-900">Chọn tầng</h4>{floorIds.length ? <div className="grid grid-cols-4 gap-2">{floorIds.map((id) => { const item = data.floorsById[id]; const active = id === floorId; return <button key={id} type="button" onClick={() => selectFloor(id)} aria-pressed={active} className={`flex min-h-11 items-center justify-center rounded-lg text-xs font-semibold ${active ? 'bg-[#004A98] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-blue-50'}`}>{item.label}</button>; })}</div> : <p className="text-sm text-slate-500">Tòa này chưa có dữ liệu tầng.</p>}</section>{isFloorView && visibleFloor && <section className="border-t border-slate-200 pt-5"><h4 className="text-sm font-semibold text-slate-900">Phòng tầng đang xem</h4><div className="mt-2 flex flex-wrap gap-2">{(data.roomIdsByFloorId[visibleFloor.fullId] ?? []).map((id) => <button key={id} type="button" onClick={() => select({ roomId: id })} className={`rounded-lg border px-3 py-2 text-sm ${roomId === id ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{data.roomsById[id].label}</button>)}</div></section>}</div><footer className="border-t border-slate-200 p-5"><button type="button" onClick={openFloor} disabled={!floor?.map} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#004A98] text-sm font-semibold text-white hover:bg-[#003A78] disabled:cursor-not-allowed disabled:opacity-50"><Layers3 className="h-4 w-4" aria-hidden="true" />{floor?.map ? `Xem sơ đồ ${floor.label.toLocaleLowerCase()}` : 'Tầng này chưa có sơ đồ'}</button></footer></>}</aside>;

  return <section className="space-y-3" aria-label="Bản đồ khuôn viên">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="hidden lg:block"><h2 className="text-lg font-semibold text-slate-900">Bản đồ {campus?.shortName ?? 'khuôn viên'}</h2><p className="mt-1 text-sm text-slate-500">Tìm phòng hoặc chọn tòa để xem sơ đồ tầng.</p>{params.get('from') === 'schedule' && <Link to={APP_ROUTES.schedule} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Quay lại thời khóa biểu</Link>}</div>
      <label className="flex items-center gap-2 text-sm text-slate-600">Cơ sở<select value={campusId} onChange={(event) => { select({ campusId: event.target.value }); setSheetOpen(false); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">{campusIds.map((id) => <option key={id} value={id}>{data.campusesById[id]?.name ?? id}</option>)}</select></label></div>
    <CampusMapSearch campusId={campusId} onSelect={selectSearchResult} maxResults={compact ? 5 : 10} />
    <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-2 lg:hidden">
      <button type="button" aria-label="Chọn tòa" onClick={() => { setShowRooms(false); setShowBuildings(true); setSheetOpen(true); }} className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-[#004A98]"><span className="truncate">{building ? `${building.name}${visibleFloor ? ` · ${visibleFloor.label}` : ''}` : 'Chọn tòa'}</span><ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /></button>
      <button type="button" aria-label="Chọn phòng" onClick={() => { setShowBuildings(false); setShowRooms(true); setSheetOpen(true); }} className="flex min-h-11 min-w-0 items-center justify-between gap-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-[#004A98]"><span className="truncate">{room?.code ?? 'Phòng'}</span><ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /></button>
    </div>
    {notice && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}
    {roomId && !room && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Phòng trong liên kết chưa có trong dữ liệu bản đồ mới.</p>}
    {params.has('legacyBuilding') && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Liên kết bản đồ cũ chưa được ánh xạ sang dữ liệu mới. Hãy chọn tòa trong danh sách.</p>}
    {params.has('building') && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Liên kết danh bạ cũ chưa được ánh xạ sang dữ liệu mới. Hãy chọn tòa trong danh sách.</p>}
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="min-w-0 space-y-3"><div className="flex min-h-10 items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">{isFloorView && building && visibleFloor ? `Sơ đồ ${building.name} · ${visibleFloor.label}` : 'Sơ đồ khuôn viên'}</h3>{isFloorView && <button type="button" onClick={() => select(building ? { campusId, buildingId: building.fullId, floorId: floor?.fullId ?? '' } : { campusId })} className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Về khuôn viên</button>}</div>{mapContent}</div>
      {!compact && <div className="self-start overflow-hidden rounded-lg border border-slate-200"><h3 className="px-5 pt-4 text-base font-semibold text-slate-900">{showBuildings || !building ? 'Danh sách tòa' : building.name}</h3>{details}</div>}</div>
    {compact && sheetOpen && <MobileBottomSheet sheetId="campus-map" title={showRooms ? 'Chọn phòng' : showBuildings || !building ? 'Chọn tòa' : room ? room.label : building.name} eyebrow={campus?.shortName} onClose={() => setSheetOpen(false)}>
      {showRooms ? <div className="space-y-4 p-4">
        <p className="text-sm text-slate-500">{building ? building.name : 'Các phòng tại cơ sở đang chọn'}</p>
        {(building ? floorIds : buildingIds.flatMap((id) => data.floorIdsByBuildingId[id] ?? [])).map((id) => {
          const item = data.floorsById[id];
          const rooms = data.roomIdsByFloorId[id] ?? [];
          return rooms.length ? <section key={id}>
            <h3 className="mb-2 text-sm font-medium text-slate-700">{!building && `${data.buildingsById[item.buildingId].name} · `}{item.label}</h3>
            <div className="grid grid-cols-3 gap-2">{rooms.map((id) => <button key={id} type="button" aria-pressed={roomId === id} onClick={() => { select({ roomId: id }); setSheetOpen(false); }} className={`min-h-11 min-w-0 rounded-lg border px-2 text-sm ${roomId === id ? 'border-blue-400 bg-blue-50 text-[#004A98]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><span className="block truncate">{data.roomsById[id].code}</span></button>)}</div>
          </section> : null;
        })}
        {!(building ? floorIds : buildingIds.flatMap((id) => data.floorIdsByBuildingId[id] ?? [])).some((id) => data.roomIdsByFloorId[id]?.length) && <p className="text-sm text-slate-500">Chưa có dữ liệu phòng tại đây.</p>}
      </div> : room && !showBuildings ? <div className="space-y-3 p-4">
        <p className="text-sm text-slate-600">{building?.name} · {roomFloor?.label}</p>
        <p className="text-sm text-slate-500">{!roomFloor?.map ? 'Tầng này chưa có sơ đồ.' : room.map?.shapeId ? 'Phòng được tô xanh trên sơ đồ tầng.' : 'Vị trí phòng chưa được đánh dấu trên sơ đồ.'}</p>
        <button type="button" onClick={() => setSheetOpen(false)} className="min-h-11 w-full rounded-lg bg-[#004A98] px-3 text-sm font-semibold text-white">{roomFloor?.map ? 'Xem trên bản đồ' : 'Đóng'}</button>
        <details><summary className="cursor-pointer py-3 text-sm text-[#004A98]">Chọn tòa, tầng khác</summary>{details}</details>
      </div> : details}
    </MobileBottomSheet>}
  </section>;
}
