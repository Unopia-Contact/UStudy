import { ArrowLeft, Building2, ChevronRight, DoorOpen, Layers3, MapPinned } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const visibleFloor = isFloorView ? data.floorsById[roomFloor?.fullId ?? params.get('mapFloor') ?? floorId] ?? floor : undefined;

  function select(next: Record<string, string>) { setNotice(''); setParams(next); }
  function selectFloor(id: string) { if (building) select({ campusId, buildingId: building.fullId, floorId: id, ...(isFloorView && visibleFloor ? { view: 'floor', mapFloor: visibleFloor.fullId } : {}) }); }
  function openFloor() { if (building && floor) select({ campusId, buildingId: building.fullId, floorId: floor.fullId, view: 'floor', mapFloor: floor.fullId }); }
  function selectSearchResult(result: CampusPlaceSearchResult) {
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
  </MapViewport> : !isFloorView && campusId === 'dong-hoa' ? <DongHoaCampusDiagram buildings={(data.buildingIdsByCampusId['dong-hoa'] ?? []).map((id) => data.buildingsById[id])} selectedId={building?.fullId} onSelect={(id) => select({ campusId: 'dong-hoa', buildingId: id })} /> : !isFloorView && campus?.map ? <MapViewport width={campus.map.viewBox[2]} height={campus.map.viewBox[3]} label={`Sơ đồ khuôn viên ${campus.name}`} resetKey={campus.id}>
    <image href={campus.map.asset} width={campus.map.viewBox[2]} height={campus.map.viewBox[3]} />
  </MapViewport> : <div className="flex min-h-[340px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center"><MapPinned className="h-7 w-7 text-slate-400" aria-hidden="true" /><p className="mt-2 text-sm font-semibold text-slate-800">{isFloorView ? 'Chưa có sơ đồ tầng' : 'Chưa có sơ đồ khuôn viên'}</p><p className="mt-1 max-w-sm text-sm text-slate-500">Thêm asset SVG và viewBox vào data mới để hiển thị ở đây.</p></div>;

  return <section className="mt-5 space-y-4" aria-label="Bản đồ khuôn viên">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Bản đồ {campus?.shortName ?? 'khuôn viên'}</h2><p className="mt-1 text-sm text-slate-500">Chọn tòa, tầng, rồi mở sơ đồ khi dữ liệu đã được thêm.</p></div>
      <label className="flex items-center gap-2 text-sm text-slate-600">Cơ sở<select value={campusId} onChange={(event) => select({ campusId: event.target.value })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">{campusIds.map((id) => <option key={id} value={id}>{data.campusesById[id]?.name ?? id}</option>)}</select></label></div>
    <CampusMapSearch campusId={campusId} onSelect={selectSearchResult} />
    {notice && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}
    {roomId && !room && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Phòng trong liên kết chưa có trong dữ liệu bản đồ mới.</p>}
    {params.has('legacyBuilding') && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Liên kết bản đồ cũ chưa được ánh xạ sang dữ liệu mới. Hãy chọn tòa trong danh sách.</p>}
    {params.has('building') && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Liên kết danh bạ cũ chưa được ánh xạ sang dữ liệu mới. Hãy chọn tòa trong danh sách.</p>}
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="min-w-0 space-y-3"><div className="flex min-h-10 items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">{isFloorView && building && visibleFloor ? `Sơ đồ ${building.name} · ${visibleFloor.label}` : 'Sơ đồ khuôn viên'}</h3>{isFloorView && <button type="button" onClick={() => select(building ? { campusId, buildingId: building.fullId, floorId: floor?.fullId ?? '' } : { campusId })} className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Về khuôn viên</button>}</div>{mapContent}</div>
      <aside className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Thông tin bản đồ">{!building ? <><header className="bg-[#004A98] px-5 py-5 text-white"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Building2 className="h-5 w-5" aria-hidden="true" /></div><p className="text-xs font-semibold uppercase text-blue-100">{campus?.code ?? campusId} · Khám phá cơ sở</p><h3 className="mt-1 text-xl font-bold">{campus?.name ?? 'Cơ sở'}</h3><p className="mt-2 text-sm leading-6 text-blue-50/90">Chọn tòa trong danh sách để xem thông tin và tầng.</p></header><div className="flex-1 p-5"><div className="mb-5 grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50"><div className="p-4"><p className="text-lg font-bold tabular-nums text-slate-900">{buildingIds.length}</p><p className="text-xs text-slate-500">Số tòa</p></div><div className="p-4"><p className="text-lg font-bold tabular-nums text-slate-900">{buildingIds.reduce((sum, id) => sum + (data.floorIdsByBuildingId[id]?.length ?? 0), 0)}</p><p className="text-xs text-slate-500">Tầng có dữ liệu</p></div></div><h4 className="mb-3 text-sm font-semibold text-slate-900">Danh sách tòa</h4>{buildingIds.length ? <div className="divide-y divide-slate-100 border-y border-slate-200">{buildingIds.map((id) => <button key={id} type="button" onClick={() => select({ campusId, buildingId: id })} className="group flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]"><Building2 className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1 font-medium">{data.buildingsById[id].name}</span><ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" /></button>)}</div> : <p className="text-sm text-slate-500">Chưa có tòa nào trong dữ liệu mới.</p>}</div></> : <><header className="bg-[#004A98] px-5 py-5 text-white"><button type="button" onClick={() => select({ campusId })} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-50 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Tất cả tòa nhà</button><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-blue-100">Tham quan tòa nhà</p><h3 className="mt-1 text-xl font-bold">{building.name}</h3></div><div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-center"><p className="text-lg font-bold tabular-nums">{floorIds.length}</p><p className="text-[10px] font-semibold uppercase text-blue-100">tầng</p></div></div></header><div className="flex-1 space-y-5 p-5"><div className="grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50"><div className="p-4"><Layers3 className="h-4 w-4 text-[#004A98]" aria-hidden="true" /><p className="mt-2 text-lg font-bold tabular-nums text-slate-900">{floorIds.length}</p><p className="text-xs text-slate-500">Tổng số tầng</p></div><div className="p-4"><DoorOpen className="h-4 w-4 text-[#004A98]" aria-hidden="true" /><p className="mt-2 text-lg font-bold tabular-nums text-slate-900">{floorIds.reduce((sum, id) => sum + (data.roomIdsByFloorId[id]?.length ?? 0), 0)}</p><p className="text-xs text-slate-500">Phòng có dữ liệu</p></div></div><section><h4 className="mb-3 text-sm font-semibold text-slate-900">Chọn tầng</h4>{floorIds.length ? <div className="grid grid-cols-5 gap-2">{floorIds.map((id) => { const item = data.floorsById[id]; const active = id === floorId; return <button key={id} type="button" onClick={() => selectFloor(id)} aria-pressed={active} className={`flex aspect-square min-h-11 items-center justify-center rounded-lg text-xs font-semibold ${active ? 'bg-[#004A98] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-blue-50'}`}>{item.label.replace(/^Tầng\s*/i, '')}</button>; })}</div> : <p className="text-sm text-slate-500">Tòa này chưa có dữ liệu tầng.</p>}</section>{isFloorView && visibleFloor && <section className="border-t border-slate-200 pt-5"><h4 className="text-sm font-semibold text-slate-900">Phòng tầng đang xem</h4><div className="mt-2 flex flex-wrap gap-2">{(data.roomIdsByFloorId[visibleFloor.fullId] ?? []).map((id) => <button key={id} type="button" onClick={() => select({ roomId: id })} className={`rounded-lg border px-3 py-2 text-sm ${roomId === id ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{data.roomsById[id].label}</button>)}</div></section>}</div><footer className="border-t border-slate-200 p-5"><button type="button" onClick={openFloor} disabled={!floor} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#004A98] text-sm font-semibold text-white hover:bg-[#003A78] disabled:cursor-not-allowed disabled:opacity-50"><Layers3 className="h-4 w-4" aria-hidden="true" />Xem bản đồ {floor?.label?.toLocaleLowerCase() ?? 'tầng'}</button></footer></>}</aside></div>
  </section>;
}
