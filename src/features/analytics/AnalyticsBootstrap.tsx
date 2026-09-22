import { useEffect } from 'react';
import { useAppNotification } from '../../context/NotificationContext';
import { ANALYTICS_STORAGE_KEYS, isAnonymousAnalyticsEnabled } from './analytics-storage';
import { sendDailyAnalyticsHeartbeat } from './installation-analytics';

export function AnalyticsBootstrap() {
  const { addNotification } = useAppNotification();

  useEffect(() => {
    const run = () => { void sendDailyAnalyticsHeartbeat(); };
    run();
    window.addEventListener('online', run);
    window.addEventListener('ustudy:analytics-preference-change', run);
    return () => {
      window.removeEventListener('online', run);
      window.removeEventListener('ustudy:analytics-preference-change', run);
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem(ANALYTICS_STORAGE_KEYS.noticeSeen)) return;
    localStorage.setItem(ANALYTICS_STORAGE_KEYS.noticeSeen, 'true');
    if (!isAnonymousAnalyticsEnabled()) return;
    addNotification({
      title: 'Thống kê sử dụng ẩn danh',
      message: 'UStudy dùng một mã ngẫu nhiên để đếm lượt cài đặt, tối đa một lần mỗi ngày. Bạn có thể tắt hoặc xóa mã tại Bảo mật & Quyền.',
      type: 'info',
    });
  }, [addNotification]);

  return null;
}

