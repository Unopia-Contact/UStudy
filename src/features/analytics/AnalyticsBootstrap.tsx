import { useEffect } from 'react';
import { sendDailyAnalyticsHeartbeat } from './installation-analytics';

export function AnalyticsBootstrap() {
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
  return null;
}
