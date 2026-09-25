import { useEffect, useState } from 'react';
import { CACHE_POPULATED_EVENT, useCrypto } from '../context/CryptoContext';
import { useSchedule } from '../features/visual-schedule/hooks/use-schedule';
import { buildWidgetScheduleSnapshot } from '../features/visual-schedule/services/schedule-export';
import { isScheduleWidgetAvailable, syncScheduleWidget } from './schedule-widget';

/** Chỉ đồng bộ sau khi bộ nhớ mã hóa đã được mở; không đọc PIN hay dữ liệu sinh viên. */
export function AndroidWidgetSync() {
  const { cryptoKey } = useCrypto();
  const [revision, setRevision] = useState(0);
  const [cacheReady, setCacheReady] = useState(false);
  const schedule = useSchedule();

  useEffect(() => {
    if (!isScheduleWidgetAvailable()) return;
    const refresh = () => setRevision((value) => value + 1);
    const onMessage = (event: MessageEvent) => {
      if (event.source === window && event.data?.type === CACHE_POPULATED_EVENT) {
        setCacheReady(true);
        refresh();
      }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('message', onMessage);
    window.addEventListener('ustudy:storage-changed', refresh);
    window.addEventListener('storage', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('ustudy:storage-changed', refresh);
      window.removeEventListener('storage', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    if (!isScheduleWidgetAvailable()) return;
    // Sau khi xóa dữ liệu và mở ứng dụng lại, xóa cả bản lịch native còn sót.
    if (!cryptoKey || !cacheReady) return;
    const timer = window.setTimeout(() => {
      void syncScheduleWidget(buildWidgetScheduleSnapshot(schedule)).catch((error) => {
        console.warn('[ScheduleWidget] Không thể đồng bộ lịch:', error);
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [cryptoKey, cacheReady, schedule, revision]);

  return null;
}
