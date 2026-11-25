import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronUp, Eye, FileUp, RefreshCw, Trash2 } from 'lucide-react';
import { AppRouter } from './app/AppRouter';
import { AppDialog } from './components/ui/overlays/app-dialog';
import { SecurityGate, SecurityLock } from './components/security';
import { CryptoProvider, CACHE_POPULATED_EVENT, useCrypto } from './context/CryptoContext';
import { CampusProvider } from './context/CampusContext';
import { DepartmentProvider } from './context/DepartmentContext';
import { NotificationProvider, useAppNotification } from './context/NotificationContext';
import { commitImport, commitImportObservation, encryptStorageValues, readFromStorage, populateSecureCache } from './helpers/localStorage/save';
import { STORAGE_KEYS } from './config/storageKeys';
import { buildAcademicStorageValues, encryptAcademicStorageValues, readAcademicBaseline } from './logic/academic-storage';
import { buildDataImportStatus } from './helpers/localStorage/data-import-status';
import { buildRawImportPreview, getImportCollectionLabel, mergeSelectedRawImport, type RawImportChange } from './logic/import-preview';
import { mergeImportMetadata, type PortalDataSource } from './logic/import-metadata';
import { requestPortalExtension } from './portal-sync/bridge';
import { AnalyticsBootstrap } from './features/analytics/AnalyticsBootstrap';
import { AndroidWidgetSync } from './mobile/AndroidWidgetSync';
import { isScheduleWidgetAvailable } from './mobile/schedule-widget';
import {
  PORTAL_EXTENSION_PENDING_AVAILABLE,
  PORTAL_EXTENSION_READY_EVENT,
  PORTAL_MOBILE_IMPORT_EVENT,
  PORTAL_SCRAPER_VERSION,
  isSupportedPortalOrigin,
  isPortalSyncPacket,
  type PendingPortalImport,
  type PortalImportTransport,
  type PortalSyncPacket,
} from './portal-sync/protocol';

interface PendingRawImport {
  payload: PortalSyncPacket;
  changes: RawImportChange[];
  selectedIds: string[];
  source: PortalImportTransport;
  extensionPendingId?: string;
  expected: Record<string, string | null>;
}

interface ImportSummary {
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
}

interface ImportCourseSummary {
  id: string;
  name: string;
  status: 'add' | 'update' | 'remove';
}

interface ImportCollectionSummary {
  collection: RawImportChange['collection'];
  courses: ImportCourseSummary[];
  add: number;
  update: number;
  remove: number;
  nonCourseChanges: number;
}

function AppContent() {
  const { addNotification } = useAppNotification();
  const { cryptoKey, unlock, refreshHasData, hasData } = useCrypto();
  const [pendingData, setPendingData] = useState<PendingRawImport | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInProgress = useRef(false);
  const [importPreview, setImportPreview] = useState<PendingRawImport | null>(null);
  const [isImportDetailsOpen, setIsImportDetailsOpen] = useState(false);
  const handledExtensionImports = useRef(new Set<string>());

  const previewSummary = useMemo(() => ({
    add: importPreview?.changes.filter((change) => change.status === 'add').length ?? 0,
    update: importPreview?.changes.filter((change) => change.status === 'update').length ?? 0,
    remove: importPreview?.changes.filter((change) => change.status === 'remove').length ?? 0,
    unchanged: importPreview?.changes.filter((change) => change.status === 'unchanged').length ?? 0,
  }), [importPreview]);
  const groupedPreviewChanges = useMemo(() => {
    const groups: Partial<Record<RawImportChange['collection'], RawImportChange[]>> = {};
    for (const change of importPreview?.changes ?? []) {
      (groups[change.collection] ??= []).push(change);
    }
    return Object.entries(groups) as Array<[RawImportChange['collection'], RawImportChange[]]>;
  }, [importPreview]);
  const changedCollectionSummaries = useMemo(() => {
    const summaries = new Map<RawImportChange['collection'], ImportCollectionSummary>();
    const coursesByCollection = new Map<RawImportChange['collection'], Map<string, ImportCourseSummary>>();

    for (const change of importPreview?.changes ?? []) {
      if (change.status === 'unchanged') continue;

      let summary = summaries.get(change.collection);
      if (!summary) {
        summary = {
          collection: change.collection,
          courses: [],
          add: 0,
          update: 0,
          remove: 0,
          nonCourseChanges: 0,
        };
        summaries.set(change.collection, summary);
      }

      summary[change.status] += 1;
      if (!change.courseId) {
        summary.nonCourseChanges += 1;
        continue;
      }

      let courses = coursesByCollection.get(change.collection);
      if (!courses) {
        courses = new Map<string, ImportCourseSummary>();
        coursesByCollection.set(change.collection, courses);
      }

      const key = change.courseId.toLocaleUpperCase('vi-VN');
      const existing = courses.get(key);
      if (existing) {
        if (change.courseName && existing.name === 'Chưa rõ tên môn') existing.name = change.courseName;
        if (existing.status !== change.status) existing.status = 'update';
        continue;
      }
      courses.set(key, {
        id: change.courseId,
        name: change.courseName || 'Chưa rõ tên môn',
        status: change.status,
      });
    }

    for (const [collection, summary] of summaries) {
      summary.courses = Array.from(coursesByCollection.get(collection)?.values() ?? [])
        .sort((first, second) => first.id.localeCompare(second.id, 'vi-VN'));
    }
    return Array.from(summaries.values());
  }, [importPreview]);

  const preparePortalImport = useCallback(async (payload: PortalSyncPacket, source: PortalImportTransport, suppressIfUnchanged = false, extensionPendingId?: string) => {
      const incomingVersion = payload.scraperVersion || payload.version || String(payload.meta?.scraperVersion || payload.meta?.version || '');
      if (incomingVersion && incomingVersion !== PORTAL_SCRAPER_VERSION) {
        addNotification({
          title: 'Công cụ đồng bộ cần cập nhật',
          message: source === 'extension'
            ? 'Vui lòng cập nhật UStudy Portal Sync trước khi tiếp tục đồng bộ.'
            : source === 'mobile-app'
              ? 'Vui lòng cập nhật ứng dụng UStudy trước khi tiếp tục đồng bộ.'
              : 'Vui lòng kéo lại Bookmarklet mới để lấy dữ liệu chính xác.',
          type: 'warning',
        });
      }
      let currentRaw;
      let changes: RawImportChange[];
      const currentMeta = readFromStorage<any>('import_meta', null);
      const expected = Object.fromEntries([
        STORAGE_KEYS.RAW_STUDENT_DB, STORAGE_KEYS.STUDENT_DB, STORAGE_KEYS.COURSE_DB_OFFLINE, STORAGE_KEYS.IMPORT_META,
      ].map((key) => [key, localStorage.getItem(key)]));
      try {
        currentRaw = readAcademicBaseline();
        if (!currentRaw && expected.raw_student_db !== null) {
          throw new Error('Dữ liệu đang được mở khóa hoặc không đọc được. Hãy thử lại khi dữ liệu đã sẵn sàng.');
        }
        if (!currentMeta && expected.import_meta !== null) throw new Error('Hãy mở khóa thông tin đồng bộ trước khi nhập.');
        changes = buildRawImportPreview(payload.raw, currentRaw, { incomingMeta: payload.meta, currentMeta });
      } catch (error) {
        addNotification({ title: 'Không thể nhập dữ liệu', message: (error as Error).message, type: 'error' });
        return 'rejected';
      }
      const updates = changes.filter(c => c.status !== 'unchanged');
      if (suppressIfUnchanged && updates.every(c => c.observationOnly)) {
        if (updates.length && cryptoKey) {
          try {
            const meta = mergeImportMetadata(currentMeta, payload.meta, updates.map(c => c.collection), updates);
            const encrypted = await encryptStorageValues({ import_meta: meta }, cryptoKey);
            await commitImportObservation(encrypted.import_meta, expected);
            populateSecureCache('import_meta', meta, encrypted.import_meta);
            window.postMessage({ type: CACHE_POPULATED_EVENT }, window.location.origin);
          } catch {
            return 'rejected';
          }
        }
        return 'unchanged';
      }
      setIsImportDetailsOpen(false);
      setImportPreview({
        payload,
        changes,
        selectedIds: changes.filter((change) => change.status !== 'unchanged').map((change) => change.id),
        source,
        extensionPendingId,
        expected,
      });
      return 'preview';
  }, [addNotification, cryptoKey]);

  useEffect(() => {
    const handleBookmarkletMessage = (event: MessageEvent) => {
      const isBookmarkLabMessage = event.origin === window.location.origin
        && event.source === window
        && event.data?.labSource === 'empty-bookmarklet';
      if ((!isSupportedPortalOrigin(event.origin) && !isBookmarkLabMessage) || event.data?.type !== 'IMPORT_FULL_DATA') return;
      if (!isPortalSyncPacket(event.data.payload)) return;
      preparePortalImport(event.data.payload, 'bookmarklet');
    };

    window.addEventListener('message', handleBookmarkletMessage);
    return () => window.removeEventListener('message', handleBookmarkletMessage);
  }, [preparePortalImport]);

  useEffect(() => {
    const handleMobilePortalImport = (event: Event) => {
      const packet = (event as CustomEvent<PortalSyncPacket>).detail;
      if (!isPortalSyncPacket(packet)) return;
      preparePortalImport(packet, 'mobile-app');
    };

    window.addEventListener(PORTAL_MOBILE_IMPORT_EVENT, handleMobilePortalImport);
    return () => window.removeEventListener(PORTAL_MOBILE_IMPORT_EVENT, handleMobilePortalImport);
  }, [preparePortalImport]);

  useEffect(() => {
    if (importPreview || pendingData || isImporting) return;
    let active = true;

    async function consumePendingExtensionImport() {
      while (active) {
        const pendingImport = await requestPortalExtension<PendingPortalImport>('GET_PENDING_IMPORT', {
          ignoredIds: Array.from(handledExtensionImports.current),
        });
        if (!active || !pendingImport || handledExtensionImports.current.has(pendingImport.id)) return;
        handledExtensionImports.current.add(pendingImport.id);
        if (!isPortalSyncPacket(pendingImport.packet)) continue;
        const outcome = await preparePortalImport(pendingImport.packet, 'extension', pendingImport.trigger === 'auto', pendingImport.id);
        if (outcome === 'preview') return;
        if (outcome === 'unchanged') await requestPortalExtension('ACK_PENDING_IMPORT', { id: pendingImport.id });
      }
    }

    function handlePendingAvailable(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (event.data?.type === PORTAL_EXTENSION_PENDING_AVAILABLE) void consumePendingExtensionImport();
    }

    function handleExtensionReady() {
      void consumePendingExtensionImport();
    }

    window.addEventListener('message', handlePendingAvailable);
    document.addEventListener(PORTAL_EXTENSION_READY_EVENT, handleExtensionReady);
    void consumePendingExtensionImport();
    return () => {
      active = false;
      window.removeEventListener('message', handlePendingAvailable);
      document.removeEventListener(PORTAL_EXTENSION_READY_EVENT, handleExtensionReady);
    };
  }, [preparePortalImport, importPreview, pendingData, isImporting]);

  const applyPortalImport = useCallback(async (preview: PendingRawImport, key: CryptoKey) => {
    const selected = new Set(preview.selectedIds);
    const selectedChanges = preview.changes.filter((change) => selected.has(change.id));
    const updatedSources = new Set<PortalDataSource>(selectedChanges.map((change) => change.collection));
    const currentMeta = readFromStorage(STORAGE_KEYS.IMPORT_META, null);
    const raw = mergeSelectedRawImport(preview.payload.raw, readAcademicBaseline(), preview.selectedIds, { currentMeta, incomingMeta: preview.payload.meta });
    const meta = mergeImportMetadata(currentMeta, preview.payload.meta, updatedSources, selectedChanges);
    if (selectedChanges.length && selectedChanges.every(c => c.observationOnly)) {
      const encrypted = await encryptStorageValues({ import_meta: meta }, key);
      await commitImportObservation(encrypted.import_meta, preview.expected);
      populateSecureCache('import_meta', meta, encrypted.import_meta);
      window.postMessage({ type: CACHE_POPULATED_EVENT }, window.location.origin);
      if (preview.extensionPendingId) void requestPortalExtension('ACK_PENDING_IMPORT', { id: preview.extensionPendingId });
      return;
    }
    const makeSummary = (changes: RawImportChange[], unchanged: number): ImportSummary => ({
      added: changes.filter((change) => change.status === 'add').length,
      updated: changes.filter((change) => change.status === 'update').length,
      removed: changes.filter((change) => change.status === 'remove').length,
      unchanged,
    });
    const summary = makeSummary(selectedChanges, preview.changes.filter((change) => change.status === 'unchanged').length);
    const details = Array.from(updatedSources, (source) => ({
      source,
      ...makeSummary(
        selectedChanges.filter((change) => change.collection === source),
        preview.changes.filter((change) => change.collection === source && change.status === 'unchanged').length,
      ),
    }));
    const source = { extension: 'UStudy Extension', 'mobile-app': 'UStudy Android', bookmarklet: 'Bookmarklet Portal' }[preview.source];
    const values = buildAcademicStorageValues(raw, meta);
    const encrypted = await encryptAcademicStorageValues(values, meta, key);
    await commitImport({ ...encrypted, [STORAGE_KEYS.LAST_DATA_IMPORT]: buildDataImportStatus(preview.source) },
      { source, summary, details }, preview.expected);

    for (const [storageKey, value] of Object.entries(values)) populateSecureCache(storageKey, value, encrypted[storageKey]);
    if (meta) populateSecureCache(STORAGE_KEYS.IMPORT_META, meta, encrypted[STORAGE_KEYS.IMPORT_META]);
    window.postMessage({ type: CACHE_POPULATED_EVENT }, window.location.origin);
    refreshHasData();
    addNotification({
      title: 'Nhập dữ liệu thành công',
      message: `Đã áp dụng ${selected.size} thay đổi cho ${values.student_db_full.name || 'sinh viên'}. Có thể hoàn tác trong Cài đặt.`,
      type: 'success',
    });
    if (preview.extensionPendingId) {
      void requestPortalExtension('ACK_PENDING_IMPORT', { id: preview.extensionPendingId });
    }
  }, [addNotification, refreshHasData]);

  const confirmImportPreview = useCallback(async () => {
    if (!importPreview?.selectedIds.length || importInProgress.current) return;
    if (!cryptoKey) {
      setPendingData(importPreview);
      setImportPreview(null);
      return;
    }

    importInProgress.current = true;
    setIsImporting(true);
    try {
      await applyPortalImport(importPreview, cryptoKey);
      setImportPreview((current) => current === importPreview ? null : current);
      setIsImportDetailsOpen(false);
    } catch (error) {
      addNotification({
        title: 'Không thể nhập dữ liệu',
        message: error instanceof Error ? error.message : 'Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      importInProgress.current = false;
      setIsImporting(false);
    }
  }, [addNotification, applyPortalImport, cryptoKey, importPreview]);

  const togglePreviewItem = useCallback((id: string, checked: boolean) => {
    setImportPreview((current) => current ? {
      ...current,
      selectedIds: checked ? [...current.selectedIds, id] : current.selectedIds.filter((selectedId) => selectedId !== id),
    } : current);
  }, []);

  const togglePreviewGroup = useCallback((changes: RawImportChange[], checked: boolean) => {
    const selectableIds = changes.filter((change) => change.status !== 'unchanged').map((change) => change.id);
    setImportPreview((current) => current ? {
      ...current,
      selectedIds: checked
        ? Array.from(new Set([...current.selectedIds, ...selectableIds]))
        : current.selectedIds.filter((id) => !selectableIds.includes(id)),
    } : current);
  }, []);

  return (
    <>
      <AnalyticsBootstrap />
      {pendingData && !cryptoKey && (
        <SecurityLock
          setupMode={!hasData}
          onUnlock={async (key) => {
            await applyPortalImport(pendingData, key);
            unlock(key);
            setPendingData(null);
          }}
        />
      )}

      <AppDialog
        open={Boolean(importPreview)}
        onOpenChange={(open) => {
          if (!open) {
            setImportPreview(null);
            setIsImportDetailsOpen(false);
          }
        }}
        title={`Xem trước dữ liệu từ ${importPreview?.source === 'extension' ? 'UStudy Extension' : importPreview?.source === 'mobile-app' ? 'UStudy Android' : 'Bookmarklet'}`}
        description={`Phát hiện ${previewSummary.add + previewSummary.update + previewSummary.remove} thay đổi trong ${changedCollectionSummaries.length} nhóm dữ liệu. Kiểm tra tóm tắt trước khi áp dụng.`}
        icon={FileUp}
        size={isImportDetailsOpen ? 'lg' : 'md'}
        footer={(
          <>
            <button type="button" onClick={() => { setImportPreview(null); setIsImportDetailsOpen(false); }} className="ustudy-button-outline">Hủy</button>
            <button type="button" onClick={() => setIsImportDetailsOpen((current) => !current)} className="ustudy-button-outline">
              {isImportDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isImportDetailsOpen ? 'Thu gọn' : 'Xem chi tiết'}
            </button>
            <button type="button" onClick={confirmImportPreview} disabled={isImporting || !importPreview?.selectedIds.length} className="ustudy-button-primary">Nhập {importPreview?.selectedIds.length ?? 0} thay đổi</button>
          </>
        )}
      >
        <div className="grid grid-cols-4 divide-x divide-slate-200 border-y border-slate-200 text-center">
          <ImportSummary label="Thêm" value={previewSummary.add} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
          <ImportSummary label="Cập nhật" value={previewSummary.update} icon={<RefreshCw className="h-4 w-4 text-blue-600" />} />
          <ImportSummary label="Xóa" value={previewSummary.remove} icon={<Trash2 className="h-4 w-4 text-red-500" />} />
          <ImportSummary label="Trùng" value={previewSummary.unchanged} icon={<FileUp className="h-4 w-4 text-slate-400" />} />
        </div>
        {!isImportDetailsOpen && (
          <section className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#004A98]" />
              <h3 className="text-sm font-semibold text-slate-900">Thay đổi theo nhóm thông tin</h3>
            </div>
            {changedCollectionSummaries.length > 0 ? (
              <div className="max-h-70 space-y-3 overflow-y-auto pr-1">
                {changedCollectionSummaries.map((summary) => (
                  <section key={summary.collection} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
                      <h4 className="text-sm font-semibold text-slate-900">{getImportCollectionLabel(summary.collection)}</h4>
                      <span className="shrink-0 text-xs text-slate-500">
                        {summary.add > 0 && <strong className="font-semibold text-emerald-700">{summary.add} thêm</strong>}
                        {summary.add > 0 && (summary.update > 0 || summary.remove > 0) && <span className="mx-1.5">·</span>}
                        {summary.update > 0 && <strong className="font-semibold text-blue-700">{summary.update} cập nhật</strong>}
                        {summary.update > 0 && summary.remove > 0 && <span className="mx-1.5">·</span>}
                        {summary.remove > 0 && <strong className="font-semibold text-red-600">{summary.remove} xóa</strong>}
                      </span>
                    </div>
                    {summary.courses.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {summary.courses.map((course) => (
                          <div key={course.id} className="flex items-center gap-3 px-3 py-2.5">
                            <span className="w-24 shrink-0 text-xs font-bold text-[#004A98]">{course.id}</span>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{course.name}</span>
                            <span className={`shrink-0 text-xs font-semibold ${course.status === 'add' ? 'text-emerald-700' : course.status === 'remove' ? 'text-red-600' : 'text-blue-700'}`}>{course.status === 'add' ? 'Thêm mới' : course.status === 'remove' ? 'Xóa' : 'Cập nhật'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-2.5 text-sm text-slate-600">{summary.nonCourseChanges} bản ghi có thay đổi.</p>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">Không có dữ liệu mới cần áp dụng.</p>
            )}
            {previewSummary.unchanged > 0 && <p className="mt-2 text-xs text-slate-500">{previewSummary.unchanged} bản ghi trùng sẽ được bỏ qua.</p>}
          </section>
        )}
        {isImportDetailsOpen && (
          <div className="mt-4 divide-y divide-slate-200">
            {importPreview && groupedPreviewChanges.map(([collection, changes]) => (
              <section key={collection} className="py-3 first:pt-0">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{getImportCollectionLabel(collection as RawImportChange['collection'])}</h3>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <button type="button" onClick={() => togglePreviewGroup(changes, true)} className="text-[#004A98] hover:text-[#003A78]">Chọn tất cả</button>
                    <button type="button" onClick={() => togglePreviewGroup(changes, false)} className="text-slate-600 hover:text-slate-900">Bỏ chọn</button>
                  </div>
                </div>
                {changes.map((change) => (
                  <label key={change.id} className={`flex items-center gap-3 px-1 py-2.5 ${change.status === 'unchanged' ? 'cursor-default opacity-55' : 'cursor-pointer'}`}>
                    <input type="checkbox" checked={importPreview.selectedIds.includes(change.id)} disabled={change.status === 'unchanged'} onChange={(event) => togglePreviewItem(change.id, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#004A98] focus:ring-[#004A98]" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{change.label}</span>
                    <span className={`shrink-0 text-xs font-semibold ${change.status === 'add' ? 'text-emerald-700' : change.status === 'update' ? 'text-blue-700' : change.status === 'remove' ? 'text-red-600' : 'text-slate-500'}`}>{change.status === 'add' ? 'Thêm mới' : change.status === 'update' ? 'Cập nhật' : change.status === 'remove' ? 'Xóa' : 'Đã trùng'}</span>
                  </label>
                ))}
              </section>
            ))}
          </div>
        )}
      </AppDialog>

      {isScheduleWidgetAvailable() && <AndroidWidgetSync />}
      <AppRouter />
    </>
  );
}

function ImportSummary({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-1 px-3 py-3"><span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">{icon}{label}</span><strong className="text-lg tabular-nums text-slate-900">{value}</strong></div>;
}

export default function App() {
  return (
    <CryptoProvider>
      <SecurityGate>
        <NotificationProvider>
          <CampusProvider>
            <DepartmentProvider>
              <AppContent />
            </DepartmentProvider>
          </CampusProvider>
        </NotificationProvider>
      </SecurityGate>
    </CryptoProvider>
  );
}
