import { useEffect, useState } from 'react';
import { BarChart3, Loader2, PowerOff } from 'lucide-react';
import { Switch } from '../../../components/ui/form/switch';
import { AppDialog } from '../../../components/ui/overlays/app-dialog';
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
  const [enabled, setEnabled] = useState(() => isAnonymousAnalyticsEnabled());
  const [pendingDeactivation, setPendingDeactivation] = useState(
    () => Boolean(getPendingAnalyticsDeactivationId()),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (!pendingDeactivation || !navigator.onLine) return;
    void flushPendingAnalyticsDeactivation().then((result) => {
      if (result === 'deactivated') setPendingDeactivation(false);
    });
  }, [pendingDeactivation]);

  const handleEnabledChange = (nextEnabled: boolean) => {
    if (pendingDeactivation && nextEnabled) return;
    setAnonymousAnalyticsEnabled(nextEnabled);
    setEnabled(nextEnabled);
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    const result = await deactivateAnonymousAnalyticsInstallation();
    setEnabled(false);
    setPendingDeactivation(result === 'pending');
    setDeactivating(false);
    setConfirmOpen(false);
  };

  return (
    <>
      <section className="ustudy-settings-card" aria-labelledby="anonymous-analytics-title">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]">
            <BarChart3 className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="anonymous-analytics-title" className="text-sm font-semibold text-slate-900">
                  Thống kê sử dụng ẩn danh
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                  Gửi một mã ngẫu nhiên, domain, phiên bản ứng dụng và ngày hoạt động tối đa một lần mỗi ngày. UStudy không gửi mã sinh viên, PIN, điểm, lịch học hay dữ liệu Portal.
                </p>
              </div>
              <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-lg px-1 sm:justify-end">
                <span className="text-sm font-medium text-slate-700">{enabled ? 'Đang bật' : 'Đang tắt'}</span>
                <Switch
                  checked={enabled}
                  disabled={pendingDeactivation}
                  onCheckedChange={handleEnabledChange}
                  aria-label="Cho phép thống kê sử dụng ẩn danh"
                  className="h-6 w-11 data-[state=checked]:bg-[#004A98] data-[state=unchecked]:bg-slate-300 [&_[data-slot=switch-thumb]]:size-5"
                />
              </label>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${pendingDeactivation ? 'bg-amber-500' : enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>
                    {pendingDeactivation
                      ? 'Đang chờ kết nối để vô hiệu hóa ID cũ'
                      : enabled
                        ? 'Gửi tối đa một heartbeat mỗi ngày'
                        : 'Đã tạm dừng heartbeat'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={deactivating || pendingDeactivation}
                  className="ustudy-button-outline min-h-10 shrink-0 px-3"
                >
                  {deactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
                  Tắt và xóa ID trên thiết bị
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Nếu chọn tắt và xóa ID, UStudy sẽ vô hiệu hóa bản ghi server nhưng giữ lịch sử ngày hoạt động ẩn danh đã ghi nhận cho báo cáo tổng hợp. Cloudflare Web Analytics là một lớp đo lường riêng và không dùng ID này.
              </p>
            </div>
          </div>
        </div>
      </section>

      <AppDialog
        open={confirmOpen}
        onOpenChange={(open) => { if (!deactivating) setConfirmOpen(open); }}
        title="Tắt thống kê trên thiết bị này?"
        description="UStudy sẽ dừng heartbeat và xóa ID ngẫu nhiên khỏi trình duyệt. Nếu bật lại sau đó, một ID hoàn toàn mới sẽ được tạo."
        icon={PowerOff}
        size="sm"
        footer={(
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={deactivating} className="ustudy-button-outline">
              Hủy
            </button>
            <button
              type="button"
              onClick={() => { void handleDeactivate(); }}
              disabled={deactivating}
              className="ustudy-button-primary min-w-32"
            >
              {deactivating && <Loader2 className="h-4 w-4 animate-spin" />}
              {deactivating ? 'Đang xử lý…' : 'Tắt thống kê'}
            </button>
          </>
        )}
      >
        <div className="space-y-3 text-sm leading-6 text-slate-600">
          <p>Dữ liệu học tập trên thiết bị không bị ảnh hưởng.</p>
          <p>Lịch sử các ngày hoạt động ẩn danh đã ghi nhận vẫn được giữ lại, nhưng ID cũ sẽ được đánh dấu ngừng hoạt động và không thể nhận heartbeat mới.</p>
        </div>
      </AppDialog>
    </>
  );
}
