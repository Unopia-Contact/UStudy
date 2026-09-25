import type { AcademicWorkloadRule } from './types';

/** Scope rỗng áp dụng cho mọi chương trình có cùng mã môn. */
export const ACADEMIC_WORKLOAD_RULES: AcademicWorkloadRule[] = [
  {
    id: 'global-add00031-lt-lab',
    scope: {},
    courseId: 'ADD00031',
    mode: 'lt_plus_lab',
    reason: 'Môn Anh văn 1 tổ chức lớp LT tích hợp giờ thực hành.',
  },{
    id: 'global-add00032-lt-lab',
    scope: {},
    courseId: 'ADD00032',
    mode: 'lt_plus_lab',
    reason: 'Môn Anh văn 2 tổ chức lớp LT tích hợp giờ thực hành.',
  },{
    id: 'global-add00033-lt-lab',
    scope: {},
    courseId: 'ADD00033',
    mode: 'lt_plus_lab',
    reason: 'Môn Anh văn 3 tổ chức lớp LT tích hợp giờ thực hành.',
  },{
    id: 'global-add00034-lt-lab',
    scope: {},
    courseId: 'ADD00034',
    mode: 'lt_plus_lab',
    reason: 'Môn Anh văn 4 tổ chức lớp LT tích hợp giờ thực hành.',
  },{
    id: 'global-baa00021-lt-lab',
    scope: {},
    courseId: 'BAA00021',
    mode: 'lt_plus_lab',
    reason: 'Môn thể dục 1 tổ chức lớp LT tích hợp giờ thực hành.',
  },{
    id: 'global-baa00022-lt-lab',
    scope: {},
    courseId: 'BAA00022',
    mode: 'lt_plus_lab',
    reason: 'Môn thể dục 2 tổ chức lớp LT tích hợp giờ thực hành.',
  },
];
