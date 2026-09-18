import { Building2, DoorOpen, MapPin, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CAMPUS_MAP_DATA, searchMapRooms, type CampusId } from '../../domain/campus-map';
import { resolveKnownPortalRoom } from '../../integrations/hcmus-portal/rooms';

const data = CAMPUS_MAP_DATA;
const campuses: CampusId[] = ['dong-hoa', 'cho-quan'];

export default function CampusMapView() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const requestedRoomId = params.get('roomId');
  const selectedRoom = requestedRoomId ? data.roomsById[requestedRoomId] : undefined;
  const legacyDirectoryLocation = params.get('building');
  const roomBuildingId = selectedRoom ? data.floorsById[selectedRoom.floorId].buildingId : undefined;
  const requestedBuildingId = params.get('buildingId');
  const selectedBuildingId = roomBuildingId ??
    (requestedBuildingId && data.buildingsById[requestedBuildingId] ? requestedBuildingId : undefined);
  const requestedCampusId = params.get('campusId') as CampusId | null;
  const campusId = selectedBuildingId ? data.buildingsById[selectedBuildingId].campusId :
    requestedCampusId && data.campusesById[requestedCampusId] ? requestedCampusId : 'dong-hoa';
  const buildingIds = data.buildingIdsByCampusId[campusId] ?? [];
  // Old directory links use a different ID system. Do not silently show the first unrelated building.
  const buildingId = selectedBuildingId ?? (legacyDirectoryLocation || (requestedRoomId && !selectedRoom) ? undefined : buildingIds[0]);
  const building = buildingId ? data.buildingsById[buildingId] : undefined;
  const floorIds = buildingId ? data.floorIdsByBuildingId[buildingId] ?? [] : [];
  const requestedFloorId = params.get('floorId');
  const floorId = selectedRoom?.floorId ??
    (requestedFloorId && floorIds.includes(requestedFloorId) ? requestedFloorId : floorIds[0]);
  const floor = floorId ? data.floorsById[floorId] : undefined;
  const roomIds = floorId ? data.roomIdsByFloorId[floorId] ?? [] : [];

  function select(next: Record<string, string>) {
    setNotice('');
    setParams(next);
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    const portal = resolveKnownPortalRoom(value);
    if (portal.status === 'matched' && portal.roomId) {
      select({ roomId: portal.roomId, ...(portal.matchedBy === 'structural' ? { match: 'structural' } : {}) });
      return;
    }
    if (portal.status === 'ambiguous') {
      setNotice('Mã này khớp nhiều phòng. Chưa thể chọn vị trí an toàn.');
      return;
    }
    const matches = searchMapRooms(value, data);
    if (matches.length === 1) select({ roomId: matches[0].fullId });
    else setNotice(matches.length > 1
      ? `Tìm thấy ${matches.length} phòng. Vui lòng nhập mã cụ thể hơn.`
      : 'Chưa có phòng này trong dữ liệu bản đồ. UStudy không tự đoán vị trí từ mã Portal.');
  }

  return <section className="space-y-4" aria-label="Bản đồ khuôn viên">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-slate-900">Tìm phòng học</h2>
          <p className="mt-1 text-sm text-slate-500">Tìm bằng tên phòng hoặc mã Portal, ví dụ P.cs2:PM_B4-2_6.2.</p></div>
        <MapPin className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
      </div>
      <form onSubmit={search} className="mt-4 flex gap-2">
        <label htmlFor="campus-room-search" className="sr-only">Tìm phòng</label>
        <input id="campus-room-search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Mã phòng hoặc mã Portal" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Search className="h-4 w-4" aria-hidden="true" />Tìm
        </button>
      </form>
      {notice && <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}
      {requestedRoomId && !selectedRoom && <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Phòng trong liên kết chưa có trong dữ liệu bản đồ.</p>}
      {legacyDirectoryLocation && <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Địa điểm từ danh bạ chưa được ánh xạ vào bản đồ mới. Không hiển thị vị trí suy đoán.</p>}
    </div>

    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Cơ sở</h3>
        <div className="mt-3 flex flex-wrap gap-2 lg:flex-col">
          {campuses.map((id) => <button key={id} type="button" onClick={() => select({ campusId: id })}
            aria-pressed={campusId === id} className={`rounded-xl px-3 py-2 text-left text-sm ${campusId === id ? 'bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}>
            {data.campusesById[id]?.name}
          </button>)}
        </div>
        <h3 className="mt-6 text-sm font-semibold text-slate-900">Tòa nhà</h3>
        {buildingIds.length ? <div className="mt-3 space-y-2">
          {buildingIds.map((id) => <button key={id} type="button" onClick={() => select({ buildingId: id })}
            aria-pressed={buildingId === id} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${buildingId === id ? 'bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />{data.buildingsById[id].name}
          </button>)}
        </div> : <p className="mt-3 text-sm text-slate-500">Chưa có dữ liệu tòa nhà tại cơ sở này.</p>}
      </aside>

      <div className="space-y-4">
        {building ? <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{data.campusesById[campusId]?.shortName}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{building.name}</h3>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Chọn tầng">
              {floorIds.map((id) => <button key={id} type="button" onClick={() => select({ floorId: id })}
                aria-pressed={floorId === id} className={`rounded-lg px-3 py-1.5 text-sm ${floorId === id ? 'bg-blue-600 font-medium text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {data.floorsById[id].label}
              </button>)}
            </div>
          </div>
          {floor && <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900"><DoorOpen className="h-5 w-5 text-blue-600" aria-hidden="true" />{floor.label}</h3>
            {floor.map ? <img className="mt-4 w-full rounded-xl border border-slate-200" src={floor.map.asset} alt={`Sơ đồ ${floor.label} của ${building.name}`} />
              : <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">Chưa có sơ đồ tầng; danh sách phòng vẫn dùng được.</p>}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {roomIds.map((id) => {
                const room = data.roomsById[id];
                return <button key={id} type="button" onClick={() => select({ roomId: id })} aria-pressed={selectedRoom?.fullId === id}
                  className={`rounded-xl border p-3 text-left ${selectedRoom?.fullId === id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}>
                  <span className="block text-sm font-semibold text-slate-900">{room.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{room.name ?? building.name} · {room.code}</span>
                </button>;
              })}
            </div>
            {selectedRoom && <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4" aria-live="polite">
              <p className="font-semibold text-blue-900">{selectedRoom.label} · {building.name}</p>
              <p className="mt-1 text-sm text-blue-800">{data.campusesById[campusId]?.name} → {floor.label} → {selectedRoom.label}</p>
              {params.get('match') === 'structural' && <p className="mt-2 text-sm text-amber-800">Vị trí được suy luận từ mã Portal và phòng có trong dữ liệu bản đồ; chưa có binding xác minh riêng.</p>}
              {selectedRoom.navigation?.instruction && <p className="mt-2 text-sm text-blue-800">{selectedRoom.navigation.instruction}</p>}
            </div>}
          </div>}
        </> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Chưa có dữ liệu bản đồ cho cơ sở này.</div>}
      </div>
    </div>
  </section>;
}
