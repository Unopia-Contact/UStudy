import type { CampusUnitLocation, CampusUnitType } from '../../assets/data/campus-directory';
import { APP_ROUTES } from '../../app/routes';
import { CAMPUS_MAP_DATA, type CampusMapRuntimeData } from '../../domain/campus-map';
import { normalizeDirectoryText } from './campus-directory-search';

export const DIRECTORY_TYPES: { id: CampusUnitType; name: string }[] = [
  { id: 'office', name: 'Phòng ban' },
  { id: 'faculty', name: 'Khoa' },
  { id: 'department', name: 'Bộ môn' },
  { id: 'laboratory', name: 'Phòng thí nghiệm' },
  { id: 'center', name: 'Trung tâm' },
  { id: 'student-service', name: 'Dịch vụ sinh viên' },
  { id: 'library', name: 'Thư viện' },
  { id: 'other', name: 'Đơn vị khác' },
];

export function directoryTypeLabel(type: CampusUnitType) {
  return DIRECTORY_TYPES.find(item => item.id === type)?.name ?? 'Đơn vị';
}

export function locationLabel(location: CampusUnitLocation) {
  if (location.note) return location.note;
  return [location.buildingId === 'NDH' ? 'Nhà điều hành' : `Tòa ${location.buildingId}`,
    location.floor != null ? `Tầng ${location.floor}` : '', location.roomCode].filter(Boolean).join(' · ');
}

/** A phone display may include an extension: never append it to the base dial number. */
export function phoneHref(phone: string) {
  const base = phone.split(/,|;|máy lẻ|ext\.?/i)[0].replace(/[^+\d]/g, '');
  return base ? `tel:${base}` : undefined;
}

const key = (value: string) => normalizeDirectoryText(value).replace(/^(toa|phong)\s+/, '').replace(/\s/g, '');

export function directoryMapLink(location: CampusUnitLocation, data: CampusMapRuntimeData = CAMPUS_MAP_DATA): { href: string; label: string } | undefined {
  const exactRoom = location.campusRoomId ? data.roomsById[location.campusRoomId] : undefined;
  if (exactRoom) return { href: `${APP_ROUTES.campusMap}?${new URLSearchParams({ roomId: exactRoom.fullId, from: 'directory' })}`, label: 'Xem phòng' };
  const buildings = Object.values(data.buildingsById).filter(building =>
    [building.fullId, building.code, building.name, ...(building.aliases ?? [])].some(value => key(value) === key(location.buildingId)));
  if (buildings.length !== 1) return undefined;
  const building = buildings[0];
  const floors = (data.floorIdsByBuildingId[building.fullId] ?? []).map(id => data.floorsById[id]);
  const matchingFloors = location.floor != null ? floors.filter(floor => floor.level === location.floor) : floors;
  const rooms = matchingFloors.flatMap(floor => (data.roomIdsByFloorId[floor.fullId] ?? []).map(id => data.roomsById[id]));
  const roomKey = location.roomCode ? key(location.roomCode) : '';
  const matches = roomKey ? rooms.filter(room => [room.code, room.label, ...(room.aliases ?? [])].some(value => key(value) === roomKey)) : [];
  if (matches.length === 1) return { href: `${APP_ROUTES.campusMap}?${new URLSearchParams({ roomId: matches[0].fullId, from: 'directory' })}`, label: 'Xem phòng' };
  const params = new URLSearchParams({ campusId: building.campusId, buildingId: building.fullId, from: 'directory' });
  if (location.floor != null && matchingFloors.length === 1) {
    params.set('floorId', matchingFloors[0].fullId);
    params.set('view', 'floor');
    params.set('mapFloor', matchingFloors[0].fullId);
    return { href: `${APP_ROUTES.campusMap}?${params}`, label: 'Xem tầng' };
  }
  return { href: `${APP_ROUTES.campusMap}?${params}`, label: 'Xem tòa' };
}
