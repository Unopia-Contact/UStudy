import type { Campus } from '../../../domain/campus-map/types';

// Physical inventory only. Portal codes are kept in the integration layer.
export const CAMPUS_MAP_CAMPUSES: Campus[] = [
  {
    id: 'dong-hoa',
    code: 'CS2',
    name: 'Cơ sở Đông Hòa',
    shortName: 'Đông Hòa',
    status: 'active',
    buildings: [
      {
        id: 'b4-2',
        code: 'B4-2_',
        name: 'Tòa B4.2',
        kind: 'academic',
        aliases: ['B4-2', 'B4_2'],
        status: 'active',
        floors: [
          {
            id: '6',
            label: 'Tầng 6',
            level: 6,
            sortOrder: 6,
            rooms: [
              {
                id: '2', code: '6.2', label: 'Phòng 6.2', kind: 'computer-lab',
                aliases: ['B4.2 6.2', 'B4-2_6.2'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              }
            ],
          }
        ],
      },
      {
        id: 'ndh',
        code: 'NĐH',
        name: 'Nhà điều hành',
        kind: 'academic',
        aliases: ['Nhà điều hành', 'NĐH'],
        status: 'active',
        floors: [
          {
            id: '1',
            label: 'Tầng 1',
            level: 1,
            sortOrder: 1,
            rooms: [
              {
                id: '9', code: '1.9', label: 'Phòng 1.9', kind: 'classroom',
                aliases: ['NĐH 1.9'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ],
          },
          {
            id: '2',
            label: 'Tầng 2',
            level: 2,
            sortOrder: 2,
            rooms: [
              {
                id: '1', code: '2.1', label: 'Phòng 2.1', kind: 'classroom',
                aliases: ['NĐH 2.1'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '2', code: '2.2', label: 'Phòng 2.2', kind: 'classroom',
                aliases: ['NĐH 2.2'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '3', code: '2.3', label: 'Phòng 2.3', kind: 'classroom',
                aliases: ['NĐH 2.3'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '4', code: '2.4', label: 'Phòng 2.4', kind: 'classroom',
                aliases: ['NĐH 2.4'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '5', code: '2.5', label: 'Phòng 2.5', kind: 'classroom',
                aliases: ['NĐH 2.5'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '6', code: '2.6', label: 'Phòng 2.6', kind: 'classroom',
                aliases: ['NĐH 2.6'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '7', code: '2.7', label: 'Phòng 2.7', kind: 'classroom',
                aliases: ['NĐH 2.7'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '8', code: '2.8', label: 'Phòng 2.8', kind: 'classroom',
                aliases: ['NĐH 2.8'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '9', code: '2.9', label: 'Phòng 2.9', kind: 'classroom',
                aliases: ['NĐH 2.9'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ],
          },
          {
            id: '3',
            label: 'Tầng 3',
            level: 3,
            sortOrder: 3,
            rooms: [
              {
                id: '1', code: '3.1', label: 'Phòng 3.1', kind: 'classroom',
                aliases: ['NĐH 3.1'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '2', code: '3.2', label: 'Phòng 3.2', kind: 'classroom',
                aliases: ['NĐH 3.2'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '3', code: '3.3', label: 'Phòng 3.3', kind: 'classroom',
                aliases: ['NĐH 3.3'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '4', code: '3.4', label: 'Phòng 3.4', kind: 'classroom',
                aliases: ['NĐH 3.4'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '5', code: '3.5', label: 'Phòng 3.5', kind: 'classroom',
                aliases: ['NĐH 3.5'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '6', code: '3.6', label: 'Phòng 3.6', kind: 'classroom',
                aliases: ['NĐH 3.6'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '7', code: '3.7', label: 'Phòng 3.7', kind: 'classroom',
                aliases: ['NĐH 3.7'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '8', code: '3.8', label: 'Phòng 3.8', kind: 'classroom',
                aliases: ['NĐH 3.8'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '9', code: '3.9', label: 'Phòng 3.9', kind: 'classroom',
                aliases: ['NĐH 3.9'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ],
          },
          {
            id: '4',
            label: 'Tầng 4',
            level: 4,
            sortOrder: 4,
            rooms: [
              {
                id: '1', code: '4.1', label: 'Phòng 4.1', kind: 'classroom',
                aliases: ['NĐH 4.1'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '2', code: '4.2', label: 'Phòng 4.2', kind: 'classroom',
                aliases: ['NĐH 4.2'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '3', code: '4.3', label: 'Phòng 4.3', kind: 'classroom',
                aliases: ['NĐH 4.3'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '4', code: '4.4', label: 'Phòng 4.4', kind: 'classroom',
                aliases: ['NĐH 4.4'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '5', code: '4.5', label: 'Phòng 4.5', kind: 'classroom',
                aliases: ['NĐH 4.5'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '6', code: '4.6', label: 'Phòng 4.6', kind: 'classroom',
                aliases: ['NĐH 4.6'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '7', code: '4.7', label: 'Phòng 4.7', kind: 'classroom',
                aliases: ['NĐH 4.7'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '8', code: '4.8', label: 'Phòng 4.8', kind: 'classroom',
                aliases: ['NĐH 4.8'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '9', code: '4.9', label: 'Phòng 4.9', kind: 'classroom',
                aliases: ['NĐH 4.9'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ],
          },
          {
            id: '5',
            label: 'Tầng 5',
            level: 5,
            sortOrder: 5,
            rooms: [
              {
                id: '1', code: '5.1', label: 'Phòng 5.1', kind: 'classroom',
                aliases: ['NĐH 5.1'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '2', code: '5.2', label: 'Phòng 5.2', kind: 'classroom',
                aliases: ['NĐH 5.2'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '3', code: '5.3', label: 'Phòng 5.3', kind: 'classroom',
                aliases: ['NĐH 5.3'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '4', code: '5.4', label: 'Phòng 5.4', kind: 'classroom',
                aliases: ['NĐH 5.4'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '5', code: '5.5', label: 'Phòng 5.5', kind: 'classroom',
                aliases: ['NĐH 5.5'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '6', code: '5.6', label: 'Phòng 5.6', kind: 'classroom',
                aliases: ['NĐH 5.6'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '7', code: '5.7', label: 'Phòng 5.7', kind: 'classroom',
                aliases: ['NĐH 5.7'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '8', code: '5.8', label: 'Phòng 5.8', kind: 'classroom',
                aliases: ['NĐH 5.8'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '9', code: '5.9', label: 'Phòng 5.9', kind: 'classroom',
                aliases: ['NĐH 5.9'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ],
          },
          {
            id: '6',
            label: 'Tầng 6',
            level: 6,
            sortOrder: 6,
            rooms: [
              {
                id: '1', code: '6.1', label: 'Phòng 6.1', kind: 'classroom',
                aliases: ['NĐH 6.1'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '2', code: '6.2', label: 'Phòng 6.2', kind: 'classroom',
                aliases: ['NĐH 6.2'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '3', code: '6.3', label: 'Phòng 6.3', kind: 'classroom',
                aliases: ['NĐH 6.3'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '4', code: '6.4', label: 'Phòng 6.4', kind: 'classroom',
                aliases: ['NĐH 6.4'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '5', code: '6.5', label: 'Phòng 6.5', kind: 'classroom',
                aliases: ['NĐH 6.5'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '6', code: '6.6', label: 'Phòng 6.6', kind: 'classroom',
                aliases: ['NĐH 6.6'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '7', code: '6.7', label: 'Phòng 6.7', kind: 'classroom',
                aliases: ['NĐH 6.7'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '8', code: '6.8', label: 'Phòng 6.8', kind: 'classroom',
                aliases: ['NĐH 6.8'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '9', code: '6.9', label: 'Phòng 6.9', kind: 'classroom',
                aliases: ['NĐH 6.9'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ],
          },
          {
            id: '7',
            label: 'Tầng 7',
            level: 7,
            sortOrder: 7,
            rooms: [
              {
                id: '1', code: '7.1', label: 'Phòng 7.1', kind: 'classroom',
                aliases: ['NĐH 7.1'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '2', code: '7.2', label: 'Phòng 7.2', kind: 'classroom',
                aliases: ['NĐH 7.2'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '3', code: '7.3', label: 'Phòng 7.3', kind: 'classroom',
                aliases: ['NĐH 7.3'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '4', code: '7.4', label: 'Phòng 7.4', kind: 'classroom',
                aliases: ['NĐH 7.4'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '5', code: '7.5', label: 'Phòng 7.5', kind: 'classroom',
                aliases: ['NĐH 7.5'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '6', code: '7.6', label: 'Phòng 7.6', kind: 'classroom',
                aliases: ['NĐH 7.6'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '7', code: '7.7', label: 'Phòng 7.7', kind: 'classroom',
                aliases: ['NĐH 7.7'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '8', code: '7.8', label: 'Phòng 7.8', kind: 'classroom',
                aliases: ['NĐH 7.8'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '9', code: '7.9', label: 'Phòng 7.9', kind: 'classroom',
                aliases: ['NĐH 7.9'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ],
          },
          {
            id: '8',
            label: 'Tầng 8',
            level: 8,
            sortOrder: 8,
            rooms: [
              {
                id: '1', code: '8.1', label: 'Phòng 8.1', kind: 'classroom',
                aliases: ['NĐH 8.1'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '2', code: '8.2', label: 'Phòng 8.2', kind: 'classroom',
                aliases: ['NĐH 8.2'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '3', code: '8.3', label: 'Phòng 8.3', kind: 'classroom',
                aliases: ['NĐH 8.3'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '4', code: '8.4', label: 'Phòng 8.4', kind: 'classroom',
                aliases: ['NĐH 8.4'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '5', code: '8.5', label: 'Phòng 8.5', kind: 'classroom',
                aliases: ['NĐH 8.5'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '6', code: '8.6', label: 'Phòng 8.6', kind: 'classroom',
                aliases: ['NĐH 8.6'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '7', code: '8.7', label: 'Phòng 8.7', kind: 'classroom',
                aliases: ['NĐH 8.7'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '8', code: '8.8', label: 'Phòng 8.8', kind: 'classroom',
                aliases: ['NĐH 8.8'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
              {
                id: '9', code: '8.9', label: 'Phòng 8.9', kind: 'classroom',
                aliases: ['NĐH 8.9'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cho-quan',
    code: 'CS1',
    name: 'Cơ sở Chợ Quán',
    shortName: 'Chợ Quán',
    status: 'active',
    buildings: [

    ]
  },
];
