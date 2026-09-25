export interface ExamData {
  id: string;
  courseCode: string;
  courseName: string;
  className: string;
  examDate: string;
  examTime: string;
  room: string;
  location: string;
  semester: string;
  examType: 'Giữa kỳ' | 'Cuối kỳ';
  notes: string;
}

export type ExamCalendarExportScope = 'semester' | 'filtered' | 'all';
export type ExamCalendarTemplateMode = 'default' | 'custom';

export interface ExamCalendarExportPreferences {
  version: 1;
  mode: ExamCalendarTemplateMode;
  scope: ExamCalendarExportScope;
  titleTemplate: string;
  descriptionTemplate: string;
}
