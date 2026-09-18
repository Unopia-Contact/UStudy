import type { Campus } from '../../../domain/campus-map/types';

// Physical inventory only. Portal codes are kept in the integration layer.
export const CAMPUS_MAP_CAMPUSES: Campus[] = [
  {
    id: 'dong-hoa', code: 'CS2', name: 'Cơ sở Đông Hòa', shortName: 'Đông Hòa', status: 'active',
    buildings: [{
      id: 'b4-2', code: 'B4.2', name: 'Tòa B4.2', kind: 'academic',
      aliases: ['B4-2', 'B4_2'], status: 'active',
      floors: [{
        id: '6', label: 'Tầng 6', level: 6, sortOrder: 6,
        rooms: [{
          id: '2', code: '6.2', label: 'Phòng 6.2', kind: 'computer-lab',
          aliases: ['B4.2 6.2', 'B4-2 6.2'], status: 'active',
          verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
        }],
      }],
    }],
  },
  { id: 'cho-quan', code: 'CS1', name: 'Cơ sở Chợ Quán', shortName: 'Chợ Quán', status: 'active', buildings: [] },
];
