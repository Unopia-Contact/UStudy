import { ArrowLeft, Building2, ChevronRight, DoorOpen, Layers3, Search } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MobileBottomSheet } from '../../components/ui/overlays/mobile-bottom-sheet';
import { CAMPUS_MAP_DATA, searchMapRooms, type CampusId } from '../../domain/campus-map';
import { resolveKnownPortalRoom } from '../../integrations/hcmus-portal/rooms';
import { Campus2Diagram, LEGACY_CAMPUS_BUILDINGS, LegacyFloorDiagram } from './Campus2Diagram';
import { searchCampusRooms, type BuildingId } from './campus-data';
import { MapViewport } from './MapViewport';

const data = CAMPUS_MAP_DATA;

export default function CampusMapTwoPanel() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLElement>(null);
  const roomId = params.get('roomId');
  const room = roomId ? data.roomsById[roomId] : undefined;
  const roomFloor = room ? data.floorsById[room.floorId] : undefined;
  const modernBuildingId = roomFloor?.buildingId ?? params.get('buildingId');
  const modernBuilding = modernBuildingId ? data.buildingsById[modernBuildingId] : undefined;
  const campusId: CampusId = modernBuilding?.campusId ?? (params.get('campusId') === 'cho-quan' ? 'cho-quan' : 'dong-hoa');
  const legacyBuildingId = params.get('legacyBuilding') as BuildingId | null;
  const legacy = campusId === 'dong-hoa' ? LEGACY_CAMPUS_BUILDINGS.find((item) => item.id === legacyBuildingId) : undefined;
  const selectedLegacyFloor = legacy?.building.floors.find((item) => item.number === Number(params.get('legacyFloor'))) ?? legacy?.building.floors[0];
  const legacyRoomCode = params.get('legacyRoom');
  const legacyRoom = selectedLegacyFloor?.rooms.find((item) => item.code === legacyRoomCode);
  const floorIds = modernBuildingId ? data.floorIdsByBuildingId[modernBuildingId] ?? [] : [];
  const selectedModernFloorId = roomFloor?.fullId ??
    (params.get('floorId') && floorIds.includes(params.get('floorId')!) ? params.get('floorId')! : floorIds[0]);
  const selectedModernFloor = selectedModernFloorId ? data.floorsById[selectedModernFloorId] : undefined;
  const isFloorView = Boolean(room || params.get('view') === 'floor');
  const visibleLegacyFloor = isFloorView && legacy
    ? legacy.building.floors.find((item) => item.number === Number(params.get('mapFloor'))) ?? selectedLegacyFloor : undefined;
  const visibleModernFloor = isFloorView && modernBuilding
    ? data.floorsById[roomFloor?.fullId ?? params.get('mapFloor') ?? selectedModernFloorId] ?? selectedModernFloor : undefined;
  const selectedRoomLabel = room?.label ?? legacyRoom?.name ?? legacyRoomCode ?? '';
  const legacyCount = LEGACY_CAMPUS_BUILDINGS.length;
  const modernIds = data.buildingIdsByCampusId[campusId] ?? [];
  const campusBuildingCount = campusId === 'dong-hoa' ? legacyCount + modernIds.length : modernIds.length;
  const campusFloorCount = (campusId === 'dong-hoa'
    ? LEGACY_CAMPUS_BUILDINGS.reduce((sum, item) => sum + item.building.floors.length, 0) : 0)
    + modernIds.reduce((sum, id) => sum + (data.floorIdsByBuildingId[id]?.length ?? 0), 0);

  useEffect(() => { if (room) setMobileDetailsOpen(true); }, [room?.fullId]);
  useEffect(() => {
    if ((legacy || modernBuilding) && window.matchMedia('(max-width: 1023px)').matches && !roomId) {
      infoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [legacy?.id, modernBuilding?.fullId]);

  function go(next: Record<string, string>) {
    setNotice('');
    setMobileDetailsOpen(false);
    setParams(next);
  }

  function chooseLegacyBuilding(id: BuildingId) {
    const item = LEGACY_CAMPUS_BUILDINGS.find((entry) => entry.id === id);
    if (item) go({ campusId: 'dong-hoa', legacyBuilding: id, legacyFloor: String(item.building.floors[0]?.number ?? 1) });
  }

  function chooseLegacyFloor(number: number) {
    if (!legacy) return;
    go({
      campusId: 'dong-hoa', legacyBuilding: legacy.id, legacyFloor: String(number),
      ...(isFloorView ? { view: 'floor', mapFloor: String(visibleLegacyFloor?.number ?? number) } : {})
    });
  }

  function chooseModernFloor(id: string) {
    if (!modernBuilding) return;
    go({
      campusId, buildingId: modernBuilding.fullId, floorId: id,
      ...(isFloorView ? { view: 'floor', mapFloor: visibleModernFloor?.fullId ?? id } : {})
    });
  }

  function viewSelectedFloor() {
    if (legacy && selectedLegacyFloor) go({
      campusId: 'dong-hoa', legacyBuilding: legacy.id,
      legacyFloor: String(selectedLegacyFloor.number), view: 'floor', mapFloor: String(selectedLegacyFloor.number)
    });
    else if (modernBuilding && selectedModernFloor) go({
      campusId, buildingId: modernBuilding.fullId,
      floorId: selectedModernFloor.fullId, view: 'floor', mapFloor: selectedModernFloor.fullId
    });
    if (window.matchMedia('(max-width: 1023px)').matches) {
      window.requestAnimationFrame(() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function chooseLegacyRoom(code: string) {
    if (!legacy || !visibleLegacyFloor) return;
    setParams({
      campusId: 'dong-hoa', legacyBuilding: legacy.id, legacyFloor: String(visibleLegacyFloor.number),
      view: 'floor', mapFloor: String(visibleLegacyFloor.number), legacyRoom: code
    });
    setMobileDetailsOpen(true);
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    const portal = resolveKnownPortalRoom(value);
    if (portal.status === 'matched' && portal.roomId) {
      go({ roomId: portal.roomId, ...(portal.matchedBy === 'structural' ? { match: 'structural' } : {}) });
      return;
    }
    if (portal.status === 'ambiguous') { setNotice('Mã Portal khớp nhiều phòng; không thể chọn vị trí an toàn.'); return; }
    const modern = searchMapRooms(value, data);
    if (modern.length === 1) { go({ roomId: modern[0].fullId }); return; }
    if (modern.length > 1) { setNotice('Tìm thấy nhiều phòng; vui lòng nhập cụ thể hơn.'); return; }
    if (/^P\./i.test(value)) { setNotice('Mã Portal này chưa có vị trí được xác minh trên bản đồ.'); return; }
    const legacyMatches = searchCampusRooms(value, 50).filter((item) => item.fullCode.toLocaleLowerCase() === value.toLocaleLowerCase());
    const distinct = [...new Map(legacyMatches.map((item) => [`${item.buildingId}/${item.floor}/${item.fullCode}`, item])).values()];
    if (distinct.length === 1) go({
      campusId: 'dong-hoa', legacyBuilding: distinct[0].buildingId,
      legacyFloor: String(distinct[0].floor), view: 'floor', mapFloor: String(distinct[0].floor), legacyRoom: distinct[0].fullCode
    });
    else setNotice(distinct.length > 1 ? 'Có nhiều phòng trùng mã trong sơ đồ cũ; vui lòng chọn tòa trước.' : 'Chưa tìm thấy phòng này trong dữ liệu bản đồ.');
  }

  const details = selectedRoomLabel ? <div className="space-y-2 text-sm">
    <p className="font-semibold text-slate-900">{selectedRoomLabel}</p>
    <p className="text-slate-600">{modernBuilding?.name ?? legacy?.building.name} · {selectedModernFloor?.label ?? `Tầng ${selectedLegacyFloor?.number}`}</p>
    {room ? <>
      {params.get('match') === 'structural' && <p className="text-amber-700">Mã Portal được suy luận; chưa có binding xác minh riêng.</p>}
      {!selectedModernFloor?.map && <p className="text-amber-700">Phòng có trong inventory, nhưng chưa có vị trí trên sơ đồ tầng.</p>}
    </> : <p className="text-amber-700">Thông tin từ sơ đồ Đông Hòa cũ; vị trí phòng chưa được đối chiếu với inventory mới.</p>}
  </div> : null;

  return <section className="mt-5 space-y-4" aria-label="Bản đồ khuôn viên">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-slate-900">Bản đồ {data.campusesById[campusId]?.shortName}</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn tòa để xem thông tin, chọn tầng rồi mở sơ đồ tầng.</p></div>
      <label className="flex items-center gap-2 text-sm text-slate-600">Cơ sở
        <select value={campusId} onChange={(event) => go({ campusId: event.target.value })}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <option value="dong-hoa">Đông Hòa</option><option value="cho-quan">Chợ Quán</option>
        </select>
      </label>
    </div>
    <form onSubmit={search} className="flex gap-2">
      <label htmlFor="campus-map-search" className="sr-only">Tìm phòng hoặc mã Portal</label>
      <input id="campus-map-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm phòng hoặc mã Portal"
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" />
      <button type="submit" className="ustudy-button-primary"><Search className="h-4 w-4" aria-hidden="true" />Tìm</button>
    </form>
    {notice && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}
    {roomId && !room && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Phòng trong liên kết chưa có trong inventory mới.</p>}
    {params.has('building') && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Liên kết danh bạ cũ chưa được ánh xạ; hãy chọn tòa trên sơ đồ.</p>}

    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div ref={mapRef} className="min-w-0 space-y-3">
        <div className="flex min-h-10 items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{isFloorView ? `Sơ đồ ${legacy?.building.name ?? modernBuilding?.name} · ${visibleModernFloor?.label ?? `Tầng ${visibleLegacyFloor?.number}`}` : 'Sơ đồ khuôn viên'}</h3>
          {isFloorView && <button type="button" onClick={() => go(legacy
            ? { campusId, legacyBuilding: legacy.id, legacyFloor: String(selectedLegacyFloor?.number ?? 1) }
            : modernBuilding ? { campusId, buildingId: modernBuilding.fullId, floorId: selectedModernFloor?.fullId ?? '' } : { campusId })}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Về khuôn viên</button>}
        </div>
        {campusId === 'cho-quan' ? <div className="flex min-h-[340px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Chưa có bản đồ khuôn viên Chợ Quán.
        </div> : isFloorView && legacy && visibleLegacyFloor
          ? <LegacyFloorDiagram buildingId={legacy.id} floor={visibleLegacyFloor} selectedRoom={legacyRoomCode ?? undefined} onSelectRoom={chooseLegacyRoom} />
          : isFloorView && modernBuilding && visibleModernFloor
            ? visibleModernFloor.map ? <MapViewport width={visibleModernFloor.map.viewBox[2]} height={visibleModernFloor.map.viewBox[3]}
              label={`Sơ đồ ${modernBuilding.name} ${visibleModernFloor.label}`} resetKey={visibleModernFloor.fullId}>
              <image href={visibleModernFloor.map.asset} width={visibleModernFloor.map.viewBox[2]} height={visibleModernFloor.map.viewBox[3]} />
            </MapViewport> : <div className="flex min-h-[340px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
              <DoorOpen className="h-7 w-7 text-slate-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-slate-800">{modernBuilding.name} · {visibleModernFloor.label}</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Sơ đồ Đông Hòa cũ không có tòa này; chưa có bản vẽ tầng để đặt phòng chính xác.</p>
            </div>
            : <Campus2Diagram selected={legacy?.id} onSelect={chooseLegacyBuilding} />}
        {campusId === 'dong-hoa' && !isFloorView && <p className="text-xs text-slate-500">Sơ đồ khuôn viên kế thừa từ bản Đông Hòa cũ. B4.2 chưa có vị trí trên bản vẽ.</p>}
        {isFloorView && legacy && <p className="text-xs text-amber-700">Sơ đồ tầng cũ để tham khảo; vị trí phòng chưa được đối chiếu với inventory mới.</p>}
      </div>

      <aside ref={infoRef} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Thông tin bản đồ">
        {!legacy && !modernBuilding ? <>
          <header className="bg-gradient-to-br from-[#004A98] to-[#0066CC] px-4 py-4 text-white sm:px-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-100">
              {data.campusesById[campusId]?.code} · Khám phá cơ sở
            </p>

            <h3 className="mt-0.5 text-lg font-bold">
              {data.campusesById[campusId]?.name}
            </h3>

            <p className="mt-1 text-xs leading-5 text-blue-50/90">
              Chọn tòa trong danh sách hoặc trên bản đồ.
            </p>
          </header>
          <div className="flex-1 space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">
              <div className="min-w-0 p-3">
                <div className="flex">
                  <Building2 className="h-3.5 w-3.5 text-[#004A98]" aria-hidden="true" />
                  <p className="text-[11px] text-slate-500 ml-1">
                    Số tòa
                  </p>
                </div>
                <p className="mt-1 text-base font-bold tabular-nums text-slate-900">
                  {campusBuildingCount}
                </p>
              </div>

              <div className="min-w-0 p-3">
                <div className="flex">
                  <Layers3 className="h-3.5 w-3.5 text-[#004A98]" aria-hidden="true" />
                  <p className="text-[11px] ml-1 text-slate-500 ml-1">
                    Tầng có dữ liệu
                  </p>
                </div>
                <p className="mt-1 text-base font-bold tabular-nums text-slate-900">
                  {campusFloorCount}
                </p>
              </div>
            </div>
            <section>
              <div className="mb-3 flex items-center justify-between gap-2"><h4 className="text-sm font-semibold text-slate-900">Danh sách tòa</h4><span className="text-xs text-slate-500">{campusBuildingCount} tòa</span></div>
              {campusBuildingCount ? <div className="max-h-[410px] divide-y divide-slate-100 overflow-y-auto border-y border-slate-200">
                {campusId === 'dong-hoa' && LEGACY_CAMPUS_BUILDINGS.map((item) => <button key={item.id} type="button" onClick={() => chooseLegacyBuilding(item.id)}
                  className="group flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]"><Building2 className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1 font-medium">{item.building.name}</span><span className="text-xs text-slate-500">{item.building.floors.length} tầng</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>)}
                {modernIds.map((id) => <button key={id} type="button" onClick={() => go({ campusId, buildingId: id })}
                  className="group flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]"><Building2 className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1 font-medium">{data.buildingsById[id].name}</span><span className="text-xs text-amber-700">Chưa vẽ</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>)}
              </div> : <p className="text-sm text-slate-500">Chưa có dữ liệu tòa nhà.</p>}
            </section>
          </div>
        </> : <>
          <header className="bg-gradient-to-br from-[#004A98] to-[#0066CC] px-4 py-4 text-white sm:px-5">
            <button
              type="button"
              onClick={() => go({ campusId })}
              className="mb-3 inline-flex min-h-7 items-center gap-1 text-xs font-medium text-blue-50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Tất cả tòa nhà
            </button>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-100">
                  Tham quan tòa nhà
                </p>

                <h3 className="mt-0.5 text-lg font-bold">
                  {modernBuilding?.name ?? legacy?.building.name}
                </h3>
              </div>

              <div className="shrink-0 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-center">
                <div className="text-base font-bold tabular-nums">
                  {legacy?.building.floors.length ?? floorIds.length}
                </div>

                <div className="text-[9px] font-semibold uppercase text-blue-100">
                  tầng
                </div>
              </div>
            </div>
          </header>
          <div className="flex-1 space-y-6 p-5 sm:p-6">
            <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">
              <div className="min-w-0 p-3">
                <div className="flex">
                  <Layers3 className="h-3.5 w-3.5 text-[#004A98]" aria-hidden="true" />
                  <p className="text-[11px] ml-1 text-slate-500">
                    Tổng số tầng
                  </p>
                </div>
                <p className="mt-1 text-base font-bold tabular-nums text-slate-900">
                  {legacy?.building.floors.length ?? floorIds.length}
                </p>
              </div>

              <div className="min-w-0 p-3">
                <div className="flex">
                  <DoorOpen className="h-3.5 w-3.5 text-[#004A98]" aria-hidden="true" />
                  <p className="text-[11px] ml-1 text-slate-500">
                    Phòng có dữ liệu
                  </p>
                </div>
                <p className="mt-1 text-base font-bold tabular-nums text-slate-900">
                  {legacy
                    ? legacy.building.floors.reduce(
                      (sum, floor) => sum + floor.rooms.length,
                      0
                    )
                    : floorIds.reduce(
                      (sum, id) => sum + (data.roomIdsByFloorId[id]?.length ?? 0),
                      0
                    )}
                </p>
              </div>
            </div>
            <section>
              <div className="mb-3 flex items-center justify-between gap-2"><h4 className="text-sm font-semibold text-slate-900">Chọn tầng</h4><span className="text-xs text-slate-500">{legacy?.building.floors.length ?? floorIds.length} tầng</span></div>
              <div className="grid grid-cols-5 gap-2">
                {legacy ? legacy.building.floors.map((item) => <button key={item.number} type="button" onClick={() => chooseLegacyFloor(item.number)}
                  aria-label={`Tầng ${item.number}, ${item.rooms.length} phòng`} aria-pressed={selectedLegacyFloor?.number === item.number}
                  className={`flex aspect-square min-h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${selectedLegacyFloor?.number === item.number ? 'bg-[#004A98] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-[#004A98] hover:bg-blue-50 hover:text-[#004A98]'}`}>
                  {item.number}</button>)
                  : floorIds.map((id) => <button key={id} type="button" onClick={() => chooseModernFloor(id)}
                    aria-label={`${data.floorsById[id].label}, ${data.roomIdsByFloorId[id]?.length ?? 0} phòng`} aria-pressed={selectedModernFloorId === id}
                    className={`flex aspect-square min-h-11 items-center justify-center rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${selectedModernFloorId === id ? 'bg-[#004A98] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-[#004A98] hover:bg-blue-50 hover:text-[#004A98]'}`}>
                    {data.floorsById[id].label.replace(/^Tầng\s*/i, '')}</button>)}
              </div>
              <p className="mt-2 text-xs text-slate-500">{selectedLegacyFloor ? `Tầng ${selectedLegacyFloor.number}` : selectedModernFloor?.label ?? 'Chưa có tầng'} · {selectedLegacyFloor?.rooms.length ?? (selectedModernFloor ? data.roomIdsByFloorId[selectedModernFloor.fullId]?.length ?? 0 : 0)} phòng có dữ liệu</p>
            </section>
            {legacy && legacy.building.facilities.length > 0 && <section>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Tiện ích tại tòa</h4>
              <div className="flex flex-wrap gap-2">{legacy.building.facilities.map((facility) => <span key={facility} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600">{facility}</span>)}</div>
            </section>}
            {isFloorView && <section className="border-t border-slate-200 pt-5">
              <h4 className="text-sm font-semibold text-slate-900">Phòng tầng đang xem</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {visibleLegacyFloor?.rooms.map((item) => <button key={item.code} type="button" onClick={() => chooseLegacyRoom(item.code)}
                  className={`rounded-lg border px-3 py-2 text-sm ${legacyRoomCode === item.code ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{item.code}</button>)}
                {visibleModernFloor && (data.roomIdsByFloorId[visibleModernFloor.fullId] ?? []).map((id) => <button key={id} type="button"
                  onClick={() => { go({ roomId: id }); setMobileDetailsOpen(true); }}
                  className={`rounded-lg border px-3 py-2 text-sm ${roomId === id ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{data.roomsById[id].label}</button>)}
              </div>
              {!visibleLegacyFloor?.rooms.length && !visibleModernFloor && <p className="mt-2 text-sm text-slate-500">Chưa có danh sách phòng tầng này.</p>}
              {details && <div className="mt-4 border-t border-slate-200 pt-4" aria-live="polite">{details}</div>}
            </section>}
          </div>
          <footer className="border-t border-slate-200 p-5 sm:p-6">
            <button type="button" onClick={viewSelectedFloor} disabled={!selectedLegacyFloor && !selectedModernFloor}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#004A98] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#003A78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50">
              <Layers3 className="h-4 w-4" aria-hidden="true" />Xem bản đồ {selectedLegacyFloor ? `tầng ${selectedLegacyFloor.number}` : selectedModernFloor?.label?.toLocaleLowerCase() ?? 'tầng'}
            </button>
          </footer>
        </>}
      </aside>
    </div>
    {mobileDetailsOpen && details && <MobileBottomSheet title={selectedRoomLabel} onClose={() => setMobileDetailsOpen(false)}>{details}</MobileBottomSheet>}
  </section>;
}
