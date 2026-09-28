import type { CampusUnitLocation } from '../../assets/data/campus-directory';
import { CAMPUS_MAP_DATA, type CampusMapRuntimeData } from '../../domain/campus-map';

function normalize(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Resolve legacy directory addresses against the current inventory, never a guessed room. */
export function resolveDirectoryMapLink(location: CampusUnitLocation, data: CampusMapRuntimeData = CAMPUS_MAP_DATA) {
    const params = new URLSearchParams({ from: 'directory' });
    if (location.campusRoomId && data.roomsById[location.campusRoomId]) {
        params.set('roomId', location.campusRoomId);
        return { params, label: 'Xem phòng trên bản đồ' };
    }

    const legacyCampus = location.buildingId.match(/^(LT|NVC)(?:-|$)/);
    const campusId = legacyCampus?.[1] === 'LT' ? 'dong-hoa' : legacyCampus?.[1] === 'NVC' ? 'cho-quan' : undefined;
    const buildingKey = location.buildingId.replace(/^(LT|NVC)-/, '');
    const buildings = Object.values(data.buildingsById).filter((building) =>
        (!campusId || building.campusId === campusId) &&
        [building.fullId, building.id, building.code, building.name, ...(building.aliases ?? [])]
            .some((value) => normalize(value) === normalize(buildingKey)),
    );
    if (buildings.length !== 1) {
        // Campus-only addresses can open the campus, not an arbitrary building.
        if (campusId && location.buildingId === legacyCampus?.[1] && data.campusesById[campusId]) {
            params.set('campusId', campusId);
            return { params, label: 'Xem cơ sở trên bản đồ' };
        }
        return null;
    }

    const building = buildings[0];
    params.set('campusId', building.campusId);
    params.set('buildingId', building.fullId);
    const floors = (data.floorIdsByBuildingId[building.fullId] ?? []).map((id) => data.floorsById[id]);
    const eligibleFloors = location.floor == null ? floors : floors.filter((floor) => floor.level === location.floor);
    const roomCodes = [location.roomCode, location.note?.match(/phòng\s+([A-Z]*\d+(?:\.\d+)?[A-Z]?)/i)?.[1]]
        .filter((code): code is string => Boolean(code)).map(normalize);
    const rooms = eligibleFloors.flatMap((floor) => (data.roomIdsByFloorId[floor.fullId] ?? []).map((id) => data.roomsById[id]))
        .filter((room) => [room.code, room.label.replace(/^phòng\s+/i, ''), ...(room.aliases ?? [])]
            .some((value) => roomCodes.includes(normalize(value))));
    if (rooms.length === 1) {
        params.set('roomId', rooms[0].fullId);
        return { params, label: 'Xem phòng trên bản đồ' };
    }
    if (location.floor != null && eligibleFloors.length === 1) {
        params.set('floorId', eligibleFloors[0].fullId);
        params.set('view', 'floor');
        params.set('mapFloor', eligibleFloors[0].fullId);
        return { params, label: 'Xem tầng trên bản đồ (chưa liên kết phòng)' };
    }
    return { params, label: 'Xem tòa trên bản đồ (chưa liên kết phòng)' };
}
