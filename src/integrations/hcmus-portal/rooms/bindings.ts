import type { PortalRoomBinding } from './types';

// Do not add a binding until the physical room exists in campus-map inventory.
const NTD_KHTN_ROOM_ID = 'dong-hoa/ntd/1/ntd_khtn';

// Portal labels ten administrative codes for the same physical sports-hall room.
// Keep separate exact bindings so that resolving a schedule never has to guess.
const NTD_KHTN_BINDINGS: PortalRoomBinding[] = Array.from({ length: 10 }, (_, index) => ({
  roomId: NTD_KHTN_ROOM_ID,
  components: {
    campusCode: 'P.cs2:',
    buildingCode: 'NTĐ_',
    roomCode: `KHTN${index + 1}`,
  },
  status: 'verified',
  sourceIds: ['user-confirmed-portal-code'],
}));

export const PORTAL_ROOM_BINDINGS: PortalRoomBinding[] = [
  {
    roomId: 'dong-hoa/b4-2/6/2',
    components: { campusCode: 'P.cs2:', buildingCode: 'PM_B4-2_', roomCode: '6.2' },
    status: 'verified',
    sourceIds: ['user-confirmed-portal-code'],
  },
  ...NTD_KHTN_BINDINGS,
];
