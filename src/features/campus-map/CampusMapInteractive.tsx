import { ArrowLeft, Building2, DoorOpen, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MobileBottomSheet } from '../../components/ui/overlays/mobile-bottom-sheet';
import { CAMPUS_MAP_DATA, searchMapRooms, type CampusId } from '../../domain/campus-map';
import { resolveKnownPortalRoom } from '../../integrations/hcmus-portal/rooms';
import { Campus2Diagram, LEGACY_CAMPUS_BUILDINGS, LegacyFloorDiagram } from './Campus2Diagram';
import { searchCampusRooms, type BuildingId } from './campus-data';
import { MapViewport } from './MapViewport';

const data = CAMPUS_MAP_DATA;

export default function CampusMapInteractive() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const roomId = params.get('roomId');
  const room = roomId ? data.roomsById[roomId] : undefined;
  const roomFloor = room ? data.floorsById[room.floorId] : undefined;
  const modernBuildingId = roomFloor?.buildingId ?? params.get('buildingId');
  const modernBuilding = modernBuildingId ? data.buildingsById[modernBuildingId] : undefined;
  const campusId: CampusId = modernBuilding?.campusId ?? (params.get('campusId') === 'cho-quan' ? 'cho-quan' : 'dong-hoa');
  const legacyBuildingId = params.get('legacyBuilding') as BuildingId | null;
  const legacy = campusId === 'dong-hoa' ? LEGACY_CAMPUS_BUILDINGS.find((item) => item.id === legacyBuildingId) : undefined;
  const legacyFloorNumber = Number(params.get('legacyFloor'));
  const legacyFloor = legacy?.building.floors.find((item) => item.number === legacyFloorNumber) ?? legacy?.building.floors[0];
  const legacyRoomCode = params.get('legacyRoom');
  const legacyRoom = legacyFloor?.rooms.find((item) => item.code === legacyRoomCode);
  const floorIds = modernBuildingId ? data.floorIdsByBuildingId[modernBuildingId] ?? [] : [];
  const modernFloorId = roomFloor?.fullId ?? (params.get('floorId') && floorIds.includes(params.get('floorId')!) ? params.get('floorId')! : floorIds[0]);
  const modernFloor = modernFloorId ? data.floorsById[modernFloorId] : undefined;
  const selectedRoomLabel = room?.label ?? legacyRoom?.name ?? legacyRoomCode ?? '';

  useEffect(() => { if (room) setMobileDetailsOpen(true); }, [room?.fullId]);

  function go(next: Record<string, string>) {
    setNotice('');
    setMobileDetailsOpen(false);
    setParams(next);
  }

  function chooseLegacyBuilding(id: BuildingId) {
    const item = LEGACY_CAMPUS_BUILDINGS.find((entry) => entry.id === id);
    if (item) go({ campusId: 'dong-hoa', legacyBuilding: id, legacyFloor: String(item.building.floors[0]?.number ?? 1) });
  }

  function chooseLegacyRoom(code: string) {
    if (!legacy || !legacyFloor) return;
    setParams({ campusId: 'dong-hoa', legacyBuilding: legacy.id, legacyFloor: String(legacyFloor.number), legacyRoom: code });
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
    if (portal.status === 'ambiguous') {
      setNotice('Mã Portal khớp nhiều phòng; không thể chọn vị trí an toàn.');
      return;
    }
    const modern = searchMapRooms(value, data);
    if (modern.length === 1) { go({ roomId: modern[0].fullId }); return; }
    if (modern.length > 1) { setNotice('Tìm thấy nhiều phòng; vui lòng nhập cụ thể hơn.'); return; }
    if (/^P\./i.test(value)) { setNotice('Mã Portal này chưa có vị trí được xác minh trên bản đồ.'); return; }
    const legacyMatches = searchCampusRooms(value, 50).filter((item) => item.fullCode.toLocaleLowerCase() === value.toLocaleLowerCase());
    const distinct = [...new Map(legacyMatches.map((item) => [`${item.buildingId}/${item.floor}/${item.fullCode}`, item])).values()];
    if (distinct.length === 1) {
      go({ campusId: 'dong-hoa', legacyBuilding: distinct[0].buildingId, legacyFloor: String(distinct[0].floor), legacyRoom: distinct[0].fullCode });
    } else setNotice(distinct.length > 1 ? 'Có nhiều phòng trùng mã trong sơ đồ cũ; vui lòng chọn tòa trước.' : 'Chưa tìm thấy phòng này trong dữ liệu bản đồ.');
  }

  const details = selectedRoomLabel ? <div className="space-y-2 text-sm">
    <p className="font-semibold text-slate-900">{selectedRoomLabel}</p>
    <p className="text-slate-600">{modernBuilding?.name ?? legacy?.building.name} · {modernFloor?.label ?? `Tầng ${legacyFloor?.number}`}</p>
    {room ? <>
      <p className="text-slate-500">{data.campusesById[modernBuilding?.campusId ?? 'dong-hoa']?.name}</p>
      {params.get('match') === 'structural' && <p className="text-amber-700">Mã Portal được suy luận từ cấu trúc; chưa có binding xác minh riêng.</p>}
      {!modernFloor?.map && <p className="text-amber-700">Phòng đã có trong danh sách, nhưng chưa có vị trí vẽ trên sơ đồ tầng.</p>}
    </> : <p className="text-amber-700">Thông tin từ sơ đồ Đông Hòa cũ; vị trí phòng chưa được xác minh với inventory mới.</p>}
  </div> : null;

  const isFloorView = Boolean(legacy || modernBuilding);
  return <section className="mt-5 space-y-4" aria-label="Bản đồ khuôn viên">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-slate-900">{isFloorView ? 'Sơ đồ tầng' : 'Sơ đồ khuôn viên'}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <button type="button" className="text-blue-700 hover:underline" onClick={() => go({ campusId })}>{data.campusesById[campusId]?.shortName}</button>
          {isFloorView && <><span aria-hidden="true">›</span><span>{modernBuilding?.name ?? legacy?.building.name}</span>
            <span aria-hidden="true">›</span><span>{modernFloor?.label ?? `Tầng ${legacyFloor?.number}`}</span></>}
        </div>
      </div>
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

    <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
        {isFloorView && <button type="button" onClick={() => go({ campusId })} className="mb-3 flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />Bản đồ khuôn viên
        </button>}
        <h3 className="text-sm font-semibold text-slate-900">{isFloorView ? 'Chọn tầng' : 'Tòa nhà'}</h3>
        {legacy ? <div className="mt-2 flex flex-wrap gap-2 lg:flex-col">
          {legacy.building.floors.map((item) => <button key={item.number} type="button"
            onClick={() => go({ campusId: 'dong-hoa', legacyBuilding: legacy.id, legacyFloor: String(item.number) })}
            aria-pressed={legacyFloor?.number === item.number} className={`ustudy-map-list-item ${legacyFloor?.number === item.number ? 'ustudy-map-list-item-active' : ''}`}>
            Tầng {item.number}
          </button>)}
        </div> : modernBuilding ? <div className="mt-2 flex flex-wrap gap-2 lg:flex-col">
          {floorIds.map((id) => <button key={id} type="button" onClick={() => go({ campusId, buildingId: modernBuildingId!, floorId: id })}
            aria-pressed={modernFloorId === id} className={`ustudy-map-list-item ${modernFloorId === id ? 'ustudy-map-list-item-active' : ''}`}>
            {data.floorsById[id].label}
          </button>)}
        </div> : campusId === 'dong-hoa' ? <div className="mt-2 max-h-[460px] space-y-1 overflow-y-auto">
          {LEGACY_CAMPUS_BUILDINGS.map((item) => <button key={item.id} type="button" onClick={() => chooseLegacyBuilding(item.id)}
            className="ustudy-map-list-item"><Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />{item.building.name}</button>)}
          {(data.buildingIdsByCampusId['dong-hoa'] ?? []).map((id) => <button key={id} type="button" onClick={() => go({ campusId: 'dong-hoa', buildingId: id })}
            className="ustudy-map-list-item"><Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />{data.buildingsById[id].name}<span className="ml-auto text-xs text-amber-700">Chưa vẽ</span></button>)}
        </div> : <p className="mt-2 text-sm text-slate-500">Chưa có sơ đồ cơ sở này.</p>}
      </aside>

      <div className="min-w-0 space-y-3">
        {campusId === 'cho-quan' ? <div className="flex min-h-[340px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Chưa có bản đồ khuôn viên Chợ Quán.
        </div> : legacy && legacyFloor ? <LegacyFloorDiagram buildingId={legacy.id} floor={legacyFloor} selectedRoom={legacyRoomCode ?? undefined} onSelectRoom={chooseLegacyRoom} />
          : modernBuilding && modernFloor ? modernFloor.map ? <MapViewport width={modernFloor.map.viewBox[2]} height={modernFloor.map.viewBox[3]}
            label={`Sơ đồ ${modernBuilding.name} ${modernFloor.label}`} resetKey={modernFloor.fullId}>
            <image href={modernFloor.map.asset} width={modernFloor.map.viewBox[2]} height={modernFloor.map.viewBox[3]} />
          </MapViewport> : <div className="flex min-h-[340px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
            <DoorOpen className="h-7 w-7 text-slate-400" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-800">{modernBuilding.name} · {modernFloor.label}</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Bản đồ Đông Hòa cũ không có tòa này. Chưa có sơ đồ tầng nên không thể đặt phòng lên map chính xác.</p>
          </div> : <Campus2Diagram onSelect={chooseLegacyBuilding} />}
        {campusId === 'dong-hoa' && !isFloorView && <p className="text-xs text-slate-500">Sơ đồ khuôn viên Đông Hòa kế thừa từ bản cũ. B4.2 chưa có vị trí trên bản vẽ này.</p>}
        {legacy && <p className="text-xs text-amber-700">Sơ đồ tầng cũ để tham khảo; vị trí phòng chưa được đối chiếu với inventory mới.</p>}

        {legacyFloor && <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-900">Phòng trong sơ đồ cũ</h3>
          {legacyFloor.rooms.length ? <div className="mt-2 flex flex-wrap gap-2">
            {legacyFloor.rooms.map((item) => <button key={item.code} type="button" onClick={() => chooseLegacyRoom(item.code)}
              className={`rounded-lg border px-3 py-2 text-sm ${legacyRoomCode === item.code ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              {item.code}
            </button>)}
          </div> : <p className="mt-2 text-sm text-slate-500">Tầng này chưa có danh sách phòng.</p>}
        </div>}
        {modernFloor && <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-900">Phòng trong inventory mới</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(data.roomIdsByFloorId[modernFloor.fullId] ?? []).map((id) => <button key={id} type="button" onClick={() => { go({ roomId: id }); setMobileDetailsOpen(true); }}
              className={`rounded-lg border px-3 py-2 text-sm ${roomId === id ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              {data.roomsById[id].label}
            </button>)}
          </div>
        </div>}
        {details && <div className="hidden rounded-lg border border-slate-200 bg-white p-4 lg:block" aria-live="polite">{details}</div>}
      </div>
    </div>
    {mobileDetailsOpen && details && <MobileBottomSheet title={selectedRoomLabel} onClose={() => setMobileDetailsOpen(false)}>{details}</MobileBottomSheet>}
  </section>;
}
