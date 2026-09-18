import type { PortalRoomBinding } from './types';

// Do not add a binding until the physical room exists in campus-map inventory.
export const PORTAL_ROOM_BINDINGS: PortalRoomBinding[] = [{
  roomId: 'dong-hoa/b4-2/6/2',
  components: { campusCode: 'P.cs2:', buildingCode: 'PM_B4-2_', roomCode: '6.2' },
  status: 'verified',
  sourceIds: ['user-confirmed-portal-code'],
}];
