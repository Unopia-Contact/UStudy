import { useEffect, useState } from 'react';
import { BarChart3, Loader2, Trash2 } from 'lucide-react';
import { Switch } from '../../../components/ui/form/switch';
import { AppDialog } from '../../../components/ui/overlays/app-dialog';
import { useAppNotification } from '../../../context/NotificationContext';
import { ANALYTICS_STORAGE_KEYS, isAnonymousAnalyticsEnabled, setAnonymousAnalyticsEnabled } from '../../analytics/analytics-storage';
import { deleteAnonymousAnalyticsInstallation, flushPendingAnalyticsDeletion } from '../../analytics/installation-analytics';

export function AnonymousAnalyticsSettings() {
  const { addNotification } = useAppNotification();
  const [enabled, setEnabled] = useState(() => isAnonymousAnalyticsEnabled());
  const [pendingDeletion, setPendingDeletion] = useState(
    () => Boolean(localStorage.getItem(ANALYTICS_STORAGE_KEYS.pendingDeletionId)),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!pendingDeletion || !navigator.onLine) return;
    void flushPendingAnalyticsDeletion().then((result) => {
      if (result === 'deleted') setPendingDeletion(false);
    });
  }, [pendingDeletion]);

  const handleEnabledChange = (nextEnabled: boolean) => {
    if (pendingDeletion && nextEnabled) return;
    setAnonymousAnalyticsEnabled(nextEnabled);
    setEnabled(nextEnabled);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteAnonymousAnalyticsInstallation();
    setEnabled(false);
    setPendingDeletion(result === 'pending');
    setDeleting(false);
    setConfirmOpen(false);

    if (result === 'pending') {
      addNotification({
        title: 'Đang chờ xóa dữ liệu thống kê',
        message: 'UStudy sẽ tự thử lại khi có kết nối mạng. Trong lúc chờ, mã này không được dùng để thống kê.',
        type: 'warning',
      });
      return;
    }

    if (result === 'unsupported-origin') {
      addNotification({
        title: 'Đã xóa mã thống kê cục bộ',
        message: 'Môi trường hiện tại không gửi analytics production, nên không có bản ghi máy chủ cần xóa.',
        type: 'info',
      });
      return;
    }

    addNotification({
      title: 'Đã xóa dữ liệu thống kê',
      message: 'Mã installation trên thiết bị và bản ghi tương ứng trên UStudy đã được xóa.',
      type: 'success',
    });
  };

  return (
    <>
      <section className="ustudy-settings-card" aria-labelledby="anonymous-analytics-title">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]">
            <BarChart3 className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="anonymous-analytics-title" className="text-sm font-semibold text-slate-900">
                  Thống kê sử dụng ẩn danh
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                  Gửi một mã ngẫu nhiên, domain, phiên bản ứng dụng và ngày hoạt động tối đa một lần mỗi ngày. Không gửi mã sinh viên, PIN, điểm, lịch học hay dữ liệu Portal.
                </p>
              </div>
              <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-lg px-1 sm:justify-end">
                <span className="text-sm font-medium text-slate-700">{enabled ? 'Đang bật' : 'Đang tắt'}</span>
                <Switch
                  checked={enabled}
                  disabled={pendingDeletion}
                  onCheckedChange={handleEnabledChange}
                  aria-label="Cho phép thống kê sử dụng ẩn danh"
                  className="h-6 w-11 data-[state=checked]:bg-[#004A98] data-[state=unchecked]:bg-slate-300 [&_[data-slot=switch-thumb]]:size-5"
                />
              </label>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${pendingDeletion ? 'bg-amber-500' : enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>
                    {pendingDeletion
                      ? 'Đang chờ kết nối để xóa dữ liệu trên máy chủ'
                      : enabled
                        ? 'Mã installation chỉ thuộc domain đang mở'
                        : 'Không gửi heartbeat mới'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={deleting || pendingDeletion}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Xóa mã và dữ liệu thống kê
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Cloudflare Web Analytics là lớp đo lượt xem không cookie và không dùng mã installation này. Nút xóa chỉ áp dụng cho hệ thống đếm installation của UStudy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <AppDialog
        open={confirmOpen}
        onOpenChange={(open) => { if (!deleting) setConfirmOpen(open); }}
        title="Xóa dữ liệu thống kê?"
        description="Thao tác này đồng thời tắt thống kê trên domain hiện tại. Nếu bật lại sau đó, UStudy sẽ tạo một mã hoàn toàn mới."
        icon={Trash2}
        size="sm"
        footer={(
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={deleting} className="ustudy-button-outline">
              Hủy
            </button>
            <button
              type="button"
              onClick={() => { void handleDelete(); }}
              disabled={deleting}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleting ? 'Đang xóa…' : 'Xóa dữ liệu'}
            </button>
          </>
        )}
      >
        <p className="text-sm leading-6 text-slate-600">
          Dữ liệu học tập trên thiết bị không bị ảnh hưởng. UStudy chỉ xóa mã ngẫu nhiên dùng để tính tổng installation và lần hoạt động gần nhất.
        </p>
      </AppDialog>
    </>
  );
}
