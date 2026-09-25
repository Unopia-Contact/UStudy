import { Capacitor, registerPlugin } from '@capacitor/core';
import type { WidgetScheduleSnapshot } from '../features/visual-schedule/services/schedule-export';

interface NativeScheduleWidget {
  setSnapshot(options: { snapshot: string | null }): Promise<void>;
  clearSnapshot(): Promise<void>;
}

const plugin = registerPlugin<NativeScheduleWidget>('ScheduleWidget');

export function isScheduleWidgetAvailable(): boolean {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('ScheduleWidget');
}

/** Xóa bản lịch native khi người dùng xóa toàn bộ dữ liệu, không ghi lại preference. */
export async function clearNativeScheduleWidget(): Promise<void> {
  if (isScheduleWidgetAvailable()) await plugin.clearSnapshot();
}

export async function syncScheduleWidget(snapshot: WidgetScheduleSnapshot | null): Promise<void> {
  if (!isScheduleWidgetAvailable()) return;
  await plugin.setSnapshot({ snapshot: snapshot ? JSON.stringify(snapshot) : null });
}
