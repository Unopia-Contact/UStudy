import { Capacitor, registerPlugin } from '@capacitor/core';
import { readPlain, savePlain } from '../helpers/localStorage/save';
import type { WidgetScheduleSnapshot } from '../features/visual-schedule/services/schedule-export';

const PREFERENCE_KEY = 'android_schedule_widget_enabled';
export const WIDGET_PREFERENCE_EVENT = 'ustudy:widget-preference';

interface NativeScheduleWidget {
  setEnabled(options: { enabled: boolean }): Promise<void>;
  setSnapshot(options: { snapshot: string | null }): Promise<void>;
}

const plugin = registerPlugin<NativeScheduleWidget>('ScheduleWidget');

export function isScheduleWidgetAvailable(): boolean {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('ScheduleWidget');
}

export function isScheduleWidgetEnabled(): boolean {
  return readPlain<boolean>(PREFERENCE_KEY, false);
}

export async function setScheduleWidgetEnabled(enabled: boolean): Promise<void> {
  if (!isScheduleWidgetAvailable()) throw new Error('Bản APK này chưa hỗ trợ widget.');
  await plugin.setEnabled({ enabled });
  savePlain(PREFERENCE_KEY, enabled);
  window.dispatchEvent(new Event(WIDGET_PREFERENCE_EVENT));
}

/** Xóa bản lịch native khi người dùng xóa toàn bộ dữ liệu, không ghi lại preference. */
export async function clearNativeScheduleWidget(): Promise<void> {
  if (isScheduleWidgetAvailable()) await plugin.setEnabled({ enabled: false });
}

export async function syncScheduleWidget(snapshot: WidgetScheduleSnapshot | null): Promise<void> {
  if (!isScheduleWidgetAvailable()) return;
  if (!isScheduleWidgetEnabled()) {
    await plugin.setEnabled({ enabled: false });
    return;
  }
  await plugin.setEnabled({ enabled: true });
  await plugin.setSnapshot({ snapshot: snapshot ? JSON.stringify(snapshot) : null });
}
