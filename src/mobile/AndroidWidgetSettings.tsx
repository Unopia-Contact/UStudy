import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Switch } from '../components/ui/form/switch';
import { isScheduleWidgetAvailable, isScheduleWidgetEnabled, setScheduleWidgetEnabled } from './schedule-widget';
import { Capacitor } from '@capacitor/core';

export function AndroidWidgetSettings() {
  const [enabled, setEnabled] = useState(isScheduleWidgetEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (Capacitor.getPlatform() !== 'android') return null;
  const available = isScheduleWidgetAvailable();

  const toggle = async (next: boolean) => {
    setBusy(true);
    setError('');
    try {
      await setScheduleWidgetEnabled(next);
      setEnabled(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu cài đặt widget.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ustudy-settings-card" aria-labelledby="android-widget-title">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#004A98]">
          <CalendarDays className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="android-widget-title" className="text-sm font-semibold text-slate-900">Widget lịch học Android</h2>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                Hiển thị tối đa 3 buổi học hôm nay ngay trên màn hình chính. Khi bật, tên môn, giờ và phòng của lịch 30 ngày tới được lưu riêng trên thiết bị để widget xem được cả khi UStudy đang khóa. Không gửi dữ liệu này lên server.
              </p>
            </div>
            <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-lg px-1 sm:justify-end">
              <span className="text-sm font-medium text-slate-700">{enabled ? 'Đang bật' : 'Đang tắt'}</span>
              <Switch checked={enabled} disabled={!available || busy} onCheckedChange={toggle}
                aria-label="Cho phép hiển thị lịch học trên widget Android"
                className="h-6 w-11 data-[state=checked]:bg-[#004A98] data-[state=unchecked]:bg-slate-300 [&_[data-slot=switch-thumb]]:size-5" />
            </label>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {available ? 'Bật xong, giữ một khoảng trống trên màn hình chính Android → Widget → UStudy. Tắt sẽ xóa ngay bản lịch lưu cho widget.' : 'Bản APK hiện tại chưa hỗ trợ widget. Hãy cập nhật APK mới.'}
          </p>
          {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </section>
  );
}
