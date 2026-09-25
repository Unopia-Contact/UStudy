import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, FileDown, RotateCcw } from 'lucide-react';
import { AppSelect, Checkbox, Input, Textarea } from '../../../components/ui/form';
import { AppDialog } from '../../../components/ui/overlays';
import {
  buildExamCalendarIcs,
  DEFAULT_EXAM_CALENDAR_EXPORT_PREFERENCES,
  DEFAULT_EXAM_DESCRIPTION_TEMPLATE,
  DEFAULT_EXAM_TITLE_TEMPLATE,
  downloadExamCalendar,
  EXAM_CALENDAR_TEMPLATE_TOKENS,
  getExamCalendarFileName,
  getExamCalendarName,
  readExamCalendarExportPreferences,
  renderExamCalendarDescription,
  renderExamCalendarTitle,
  saveExamCalendarExportPreferences,
} from '../services/exam-calendar-export';
import type {
  ExamCalendarExportPreferences,
  ExamCalendarExportScope,
  ExamCalendarTemplateMode,
  ExamData,
} from '../types';

interface ExamCalendarExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exams: ExamData[];
  filteredExams: ExamData[];
  selectedSemester: string;
}

type TemplateField = 'title' | 'description';

const SCOPE_OPTIONS = [
  { id: 'semester', name: 'Học kỳ đang chọn' },
  { id: 'filtered', name: 'Theo bộ lọc hiện tại' },
  { id: 'all', name: 'Tất cả lịch thi' },
];

const TOKEN_LABELS: Record<(typeof EXAM_CALENDAR_TEMPLATE_TOKENS)[number], string> = {
  examType: 'Loại kỳ thi',
  courseCode: 'Mã môn',
  courseName: 'Tên môn',
  className: 'Lớp/Nhóm',
  date: 'Ngày thi',
  time: 'Thời gian',
  room: 'Phòng',
  location: 'Cơ sở',
  semester: 'Học kỳ',
  notes: 'Ghi chú gốc',
};

export function ExamCalendarExportDialog({
  open,
  onOpenChange,
  exams,
  filteredExams,
  selectedSemester,
}: ExamCalendarExportDialogProps) {
  const [preferences, setPreferences] = useState<ExamCalendarExportPreferences>(
    DEFAULT_EXAM_CALENDAR_EXPORT_PREFERENCES,
  );
  const [rememberAsDefault, setRememberAsDefault] = useState(false);
  const [activeTemplateField, setActiveTemplateField] = useState<TemplateField>('title');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPreferences(readExamCalendarExportPreferences());
    setRememberAsDefault(false);
    setError('');
  }, [open]);

  const scopedExams = useMemo(() => {
    if (preferences.scope === 'all') return exams;
    if (preferences.scope === 'filtered') return filteredExams;
    if (selectedSemester === 'all') return exams;
    return exams.filter((exam) => exam.semester === selectedSemester);
  }, [exams, filteredExams, preferences.scope, selectedSemester]);

  const activeTitleTemplate = preferences.mode === 'default'
    ? DEFAULT_EXAM_TITLE_TEMPLATE
    : preferences.titleTemplate;
  const activeDescriptionTemplate = preferences.mode === 'default'
    ? DEFAULT_EXAM_DESCRIPTION_TEMPLATE
    : preferences.descriptionTemplate;
  const previewExam = scopedExams[0];
  const calendarSemester = preferences.scope === 'all' ? 'all' : selectedSemester;
  const exportPreview = useMemo(() => buildExamCalendarIcs(scopedExams, {
    calendarName: getExamCalendarName(calendarSemester),
    titleTemplate: activeTitleTemplate,
    descriptionTemplate: activeDescriptionTemplate,
  }), [activeDescriptionTemplate, activeTitleTemplate, calendarSemester, scopedExams]);

  const updatePreference = <Key extends keyof ExamCalendarExportPreferences>(
    key: Key,
    value: ExamCalendarExportPreferences[Key],
  ) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const insertToken = (token: string) => {
    const value = `{${token}}`;
    if (activeTemplateField === 'title') {
      updatePreference('titleTemplate', `${preferences.titleTemplate}${value}`);
      return;
    }
    updatePreference('descriptionTemplate', `${preferences.descriptionTemplate}${value}`);
  };

  const handleReset = () => {
    setPreferences(DEFAULT_EXAM_CALENDAR_EXPORT_PREFERENCES);
    setActiveTemplateField('title');
    setError('');
  };

  const handleExport = () => {
    if (scopedExams.length === 0) {
      setError('Phạm vi đã chọn không có lịch thi để xuất.');
      return;
    }
    if (!activeTitleTemplate.trim()) {
      setError('Tên sự kiện không được để trống.');
      return;
    }

    const result = buildExamCalendarIcs(scopedExams, {
      calendarName: getExamCalendarName(calendarSemester),
      titleTemplate: activeTitleTemplate,
      descriptionTemplate: activeDescriptionTemplate,
    });

    if (result.exportedCount === 0) {
      setError('Không có sự kiện hợp lệ. Hãy kiểm tra lại ngày thi trong dữ liệu đã đồng bộ.');
      return;
    }

    if (rememberAsDefault) {
      saveExamCalendarExportPreferences({
        ...preferences,
        titleTemplate: preferences.titleTemplate || DEFAULT_EXAM_TITLE_TEMPLATE,
        descriptionTemplate: preferences.descriptionTemplate || DEFAULT_EXAM_DESCRIPTION_TEMPLATE,
      });
    }

    downloadExamCalendar(result, getExamCalendarFileName(calendarSemester));
    onOpenChange(false);
  };

  const setMode = (mode: ExamCalendarTemplateMode) => {
    updatePreference('mode', mode);
    if (mode === 'custom' && !preferences.titleTemplate) {
      setPreferences((current) => ({
        ...current,
        mode,
        titleTemplate: DEFAULT_EXAM_TITLE_TEMPLATE,
        descriptionTemplate: DEFAULT_EXAM_DESCRIPTION_TEMPLATE,
      }));
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xuất lịch thi"
      description="Tạo file .ics để thêm lịch thi vào Google Calendar, Apple Calendar hoặc Outlook."
      icon={CalendarPlus}
      size="md"
      mobileFullScreen
      footer={(
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="ustudy-button-text ustudy-button-text-muted justify-center gap-2 sm:justify-start"
          >
            <RotateCcw className="h-4 w-4" />
            Khôi phục mặc định
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="ustudy-button-dialog ustudy-button-dialog-cancel flex-1 sm:flex-none"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={scopedExams.length === 0}
              className="ustudy-button-dialog ustudy-button-dialog-confirm flex-1 gap-2 sm:flex-none"
            >
              <FileDown className="h-4 w-4" />
              Xuất {exportPreview.exportedCount} sự kiện
            </button>
          </div>
        </div>
      )}
    >
      <section className="pb-5">
        <label className="text-sm font-semibold text-gray-900">Phạm vi xuất</label>
        <AppSelect
          value={preferences.scope}
          onChange={(value) => updatePreference('scope', value as ExamCalendarExportScope)}
          options={SCOPE_OPTIONS}
          ariaLabel="Chọn phạm vi xuất lịch thi"
          className="mt-2"
          triggerClassName="h-10 px-3 text-sm font-medium"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Sẽ tạo {exportPreview.exportedCount} sự kiện
          {preferences.scope === 'filtered' ? ' theo học kỳ, loại thi, cơ sở và từ khóa đang lọc.' : '.'}
        </p>
      </section>

      <section className="border-t border-gray-200 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Cấu trúc sự kiện</h3>
            <p className="mt-0.5 text-xs text-gray-500">Dùng mẫu sẵn hoặc tự sắp xếp thông tin.</p>
          </div>
          <div className="flex shrink-0 rounded-lg bg-gray-100 p-1" aria-label="Chọn cấu trúc sự kiện">
            {(['default', 'custom'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMode(mode)}
                aria-pressed={preferences.mode === mode}
                className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${
                  preferences.mode === mode
                    ? 'bg-white text-[#004A98] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {mode === 'default' ? 'Mặc định' : 'Tùy chỉnh'}
              </button>
            ))}
          </div>
        </div>

        {preferences.mode === 'custom' && (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="exam-calendar-title-template" className="text-sm font-medium text-gray-700">
                Tên sự kiện
              </label>
              <Input
                id="exam-calendar-title-template"
                value={preferences.titleTemplate}
                onFocus={() => setActiveTemplateField('title')}
                onChange={(event) => updatePreference('titleTemplate', event.target.value)}
                className="mt-2 h-10 rounded-lg border-gray-300 bg-white text-sm focus-visible:border-[#004A98] focus-visible:ring-[#004A98]/15"
                aria-invalid={!preferences.titleTemplate.trim()}
              />
            </div>

            <div>
              <label htmlFor="exam-calendar-description-template" className="text-sm font-medium text-gray-700">
                Ghi chú
              </label>
              <Textarea
                id="exam-calendar-description-template"
                value={preferences.descriptionTemplate}
                onFocus={() => setActiveTemplateField('description')}
                onChange={(event) => updatePreference('descriptionTemplate', event.target.value)}
                className="mt-2 min-h-44 resize-y rounded-lg border-gray-300 bg-white text-sm leading-6 focus-visible:border-[#004A98] focus-visible:ring-[#004A98]/15"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600">
                Chèn vào {activeTemplateField === 'title' ? 'tên sự kiện' : 'ghi chú'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {EXAM_CALENDAR_TEMPLATE_TOKENS.map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => insertToken(token)}
                    className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#004A98]"
                    title={`Chèn ${TOKEN_LABELS[token]}`}
                  >
                    {`{${token}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-gray-200 py-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Xem trước</h3>
          <span className="text-xs text-gray-500">Asia/Ho_Chi_Minh</span>
        </div>
        {previewExam ? (
          <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">
            <p className="break-words text-sm font-semibold text-gray-900">
              {renderExamCalendarTitle(previewExam, activeTitleTemplate)}
            </p>
            <p className="mt-2 whitespace-pre-line break-words text-xs leading-5 text-gray-600">
              {renderExamCalendarDescription(previewExam, activeDescriptionTemplate) || 'Không có ghi chú.'}
            </p>
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-gray-500">
            Phạm vi này chưa có lịch thi để xem trước.
          </p>
        )}
      </section>

      <label className="flex cursor-pointer items-start gap-3 border-t border-gray-200 pt-5">
        <Checkbox
          checked={rememberAsDefault}
          onCheckedChange={(checked) => setRememberAsDefault(checked === true)}
          className="mt-0.5 border-gray-300 data-[state=checked]:border-[#004A98] data-[state=checked]:bg-[#004A98]"
        />
        <span>
          <span className="block text-sm font-medium text-gray-800">Ghi nhớ cấu hình này</span>
          <span className="mt-0.5 block text-xs leading-5 text-gray-500">
            Lần xuất sau sẽ dùng lại phạm vi và cấu trúc đang chọn.
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}
    </AppDialog>
  );
}
