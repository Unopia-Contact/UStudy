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
      // NDH
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
      // A
      {
        id: 'a',
        code: 'A',
        name: 'Tòa A',
        kind: 'academic',
        aliases: ['Tòa A'],
        status: 'active',
        floors: [
          {
            id: 'basement',
            label: 'Tầng 0',
            level: 0,
            sortOrder: 0,
            rooms: [
              {
                id: '1', code: '001', label: 'Phòng A001', kind: 'classroom',
                aliases: ['A001'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ]
          },
          {
            id: '2',
            label: 'Tầng 2',
            level: 2,
            sortOrder: 2,
            rooms: ['201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212', '213', '214'].map((code) => {
              const overrides: Record<string, Partial<any>> = {
                '201': { label: 'Phòng giáo viên D201', kind: 'office' },
                '202': { label: 'Phòng giáo viên D202', kind: 'office' },
                '203': { label: 'Phòng máy D203', kind: 'computer-lab' },
                '204': { label: 'Phòng máy D204', kind: 'computer-lab' },
              };
              return {
                id: code,
                code,
                label: `Phòng D${code}`,
                kind: 'classroom' as const,
                aliases: [`D${code}`],
                status: 'active' as const,
                map: { shapeId: `room-d${code}` },
                ...overrides[code],
              };
            }),
          }
        ],
      },
      // B
      {
        id: 'b',
        code: 'HT',
        name: 'Tòa B',
        kind: 'academic',
        aliases: ['Tòa B', 'Hội trường', 'HTB', 'Hội trường B'],
        status: 'active',
        floors: [
          {
            id: '1',
            label: 'Tầng 1',
            level: 1,
            sortOrder: 1,
            rooms: [
              {
                id: '1', code: 'B', label: 'Hội trường B', kind: 'classroom',
                aliases: ['Hội trường B', 'HTB'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ]
          }
        ],
      },
      // C
      {
        id: 'c',
        code: 'C',
        name: 'Tòa C',
        kind: 'academic',
        aliases: ['Tòa C'],
        status: 'active',
        floors: [
          {
            id: '0',
            label: 'Tầng 0',
            level: 0,
            sortOrder: 0,
            rooms: [
              {
                id: '1', code: '001', label: 'Phòng C001', kind: 'classroom',
                aliases: ['C001'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              },
            ]
          }
        ],
      },
      // D
      {
        id: 'd',
        code: 'D',
        name: 'Tòa D',
        kind: 'academic',
        aliases: ['Tòa D'],
        status: 'active',
        floors: [
          {
            id: '0',
            label: 'Tầng Hầm',
            level: -1,
            sortOrder: -1,
            rooms: ['environmental-technology-lab', '004', '005', '006', '007'].map((code) => {
              const overrides: Record<string, Partial<any>> = {
                'environmental-technology-lab': {
                  label: 'PTN Công nghệ môi trường',
                  kind: 'laboratory',
                  aliases: ['D003 PTN Công nghệ môi trường', 'Công nghệ môi trường', 'Phòng thí nghiệm Công nghệ môi trường'],
                  map: { shapeId: 'environmental-technology-lab' },
                },
              };

              return {
                id: code,
                code,
                label: `D${code}`,
                kind: 'classroom' as const,
                aliases: [`D${code}`],
                status: 'active' as const,
                map: { shapeId: `room-d${code}` },

                ...overrides[code],
              };
            }),
          },
          {
            id: '1',
            label: 'Tầng 1',
            level: 1,
            sortOrder: 1,
            rooms: ['101', '102', '102a', '103', 'lecturer-room', '105', '106', '107', '108'].map((code) => {
              const overrides: Record<string, Partial<any>> = {
                'lecturer-room': {
                  label: 'Phòng GV',
                  kind: 'office',
                  aliases: ['D104 Phòng GV', 'Phòng giảng viên', 'Phòng giáo viên'],
                  map: { shapeId: 'lecturer-room' },
                },
              };

              return {
                id: code,
                code,
                label: `D${code}`,
                kind: 'classroom' as const,
                aliases: [`D${code}`],
                status: 'active' as const,
                map: { shapeId: `room-d${code}` },

                ...overrides[code],
              };
            }),
          }
        ],
      },
      // E
      {
        id: 'e',
        code: 'E',
        name: 'Tòa E',
        kind: 'academic',
        aliases: ['Tòa E'],
        status: 'active',
        floors: [
          {
            id: '1',
            label: 'Tầng 1',
            level: 1,
            sortOrder: 1,
            rooms: ['101', '102', '103', '104', '105', '106', '107'].map((code) => {
              const overrides: Record<string, Partial<any>> = {
                '101': {
                  label: 'Data Center',
                  kind: 'office',
                  aliases: ['E101', 'Data Center', 'Phòng Data Center'],
                  map: { shapeId: 'room-e101' },
                },
                '102': {
                  label: 'Phòng ý tế',
                  kind: 'medical',
                  aliases: ['E102', 'Phòng ý tế'],
                  map: { shapeId: 'room-e102' },
                },
              };

              return {
                id: code,
                code,
                label: `E${code}`,
                kind: 'classroom' as const,
                aliases: [`E${code}`],
                status: 'active' as const,
                map: { shapeId: `room-e${code}` },

                ...overrides[code],
              };
            }),
          },
          {
            id: '2',
            label: 'Tầng 2',
            level: 2,
            sortOrder: 2,
            rooms: ['201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211'].map((code) => ({
              id: code, code, label: `E${code}`, kind: 'classroom' as const,
              aliases: [`E${code}`], status: 'active' as const,
              map: { shapeId: `room-e${code}` },
            })),
          },
          {
            id: '3',
            label: 'Tầng 3',
            level: 3,
            sortOrder: 3,
            rooms: ['301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312'].map((code) => ({
              id: code, code, label: `E${code}`, kind: 'classroom' as const,
              aliases: [`E${code}`], status: 'active' as const,
              map: { shapeId: `room-e${code}` },
            })),
          }
        ],
      },
      // NTĐ
      {
        id: 'ntd',
        code: 'NTĐ_',
        name: 'Nhà thi đấu',
        kind: 'academic',
        aliases: ['Nhà thể dục', 'NTĐ', 'Nhà thi đấu'],
        status: 'active',
        floors: [
          {
            id: '1',
            label: 'Tầng 1',
            level: 1,
            sortOrder: 1,
            rooms: [
              {
                id: 'ntd_khtn', code: 'KHTN', label: 'NTĐ_KHTN', kind: 'classroom',
                aliases: ['NTĐ_KHTN', 'NTĐ_KHTN1', 'NTĐ_KHTN2', 'NTĐ_KHTN3', 'NTĐ_KHTN4', 'NTĐ_KHTN5', 'NTĐ_KHTN6', 'NTĐ_KHTN7', 'NTĐ_KHTN8', 'NTĐ_KHTN9', 'NTĐ_KHTN10'], status: 'active',
                verification: { status: 'observed', sourceIds: ['user-confirmed-portal-code'] },
              }
            ]
          }
        ]
      },
      // F
      {
        id: 'f',
        code: 'F',
        name: 'Tòa F',
        kind: 'academic',
        aliases: ['Nhà F'],
        status: 'active',
        floors: [
          {
            id: 'basement',
            label: 'Tầng hầm',
            level: -1,
            sortOrder: -1,
            rooms: [],
          },
          {
            id: '1', label: 'Tầng 1', level: 1, sortOrder: 1,
            rooms: ['101', '102', '103', '104', '105', '106'].map((code) => ({
              id: code, code, label: `F${code}`, kind: 'classroom' as const,
              aliases: [`F${code}`], status: 'active' as const,
              map: { shapeId: `room-f${code}` },
            })),
          },
          {
            id: '2', label: 'Tầng 2', level: 2, sortOrder: 2,
            rooms: ['201', '202', '203', '204', '205', '206'].map((code) => ({
              id: code, code, label: `F${code}`, kind: 'classroom' as const,
              aliases: [`F${code}`], status: 'active' as const,
              map: { shapeId: `room-f${code}` },
            })),
          },
          {
            id: '3', label: 'Tầng 3', level: 3, sortOrder: 3,
            rooms: ['301', '302', '303', '304', '305', '306'].map((code) => ({
              id: code, code, label: `F${code}`, kind: 'classroom' as const,
              aliases: [`F${code}`], status: 'active' as const,
              map: { shapeId: `room-f${code}` },
            })),
          },
        ],
      },
      // B42
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
