import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Switch } from '../../../components/ui/form/switch';
import { useAppNotification } from '../../../context/NotificationContext';
import {
  getPendingAnalyticsDeactivationId,
  isAnonymousAnalyticsEnabled,
  setAnonymousAnalyticsEnabled,
} from '../../analytics/analytics-storage';
import {
  deactivateAnonymousAnalyticsInstallation,
  flushPendingAnalyticsDeactivation,
} from '../../analytics/installation-analytics';

export function AnonymousAnalyticsSettings() {
  const { addNotification } = useAppNotification();
  const [enabled, setEnabled] = useState(() => isAnonymousAnalyticsEnabled());
  const [pendingDeactivation, setPendingDeactivation] = useState(
    () => Boolean(getPendingAnalyticsDeactivationId()),
  );
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!pendingDeactivation || !navigator.onLine) return;
    void flushPendingAnalyticsDeactivation().then((result) => {
      if (result !== 'pending') setPendingDeactivation(false);
    });
  }, [pendingDeactivation]);

  const handleEnabledChange = async (nextEnabled: boolean) => {
    if (updating || (pendingDeactivation && nextEnabled)) return;

    if (nextEnabled) {
      setAnonymousAnalyticsEnabled(true);
      setEnabled(true);
      return;
    }

    setUpdating(true);
    setEnabled(false);
    const result = await deactivateAnonymousAnalyticsInstallation();
    const isPending = result === 'pending';
    setPendingDeactivation(isPending);
    setUpdating(false);

    if (isPending) {
      addNotification({
        title: 'Đã tắt thống kê',
        message: 'ID sẽ được vô hiệu hóa trên máy chủ khi kết nối ổn định trở lại.',
        type: 'info',
      });
    }
  };

  return (
    <section className="ustudy-settings-card" aria-labelledby="anonymous-analytics-title">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="anonymous-analytics-title" className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <BarChart3 className="h-5 w-5 shrink-0 text-[#004A98]" aria-hidden="true" />
            Thống kê sử dụng ẩn danh
          </h2>
          <p className="text-sm leading-relaxed text-gray-600">
            Gửi mã ngẫu nhiên, domain, phiên bản ứng dụng và ngày hoạt động tối đa một lần mỗi ngày. Không gửi mã sinh viên, PIN, điểm, lịch học hay dữ liệu Portal.
          </p>
          <p className="mt-3 text-xs text-slate-500" aria-live="polite">
            {pendingDeactivation
              ? 'Đã tắt · đang chờ vô hiệu hóa ID trên máy chủ'
              : enabled
                ? 'Đang bật · tối đa một lần gửi mỗi ngày'
                : 'Đang tắt · không gửi dữ liệu thống kê'}
          </p>
        </div>

        <label htmlFor="anonymous-analytics-switch" className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2">
          <span className="sr-only">Cho phép thống kê sử dụng ẩn danh</span>
          <Switch
            id="anonymous-analytics-switch"
            checked={enabled}
            disabled={updating || pendingDeactivation}
            onCheckedChange={(checked) => { void handleEnabledChange(checked); }}
            aria-label="Cho phép thống kê sử dụng ẩn danh"
          />
        </label>
      </div>
    </section>
  );
}
