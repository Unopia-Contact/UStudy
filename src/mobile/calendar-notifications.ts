import { Capacitor, registerPlugin } from '@capacitor/core';
import type { LocalNotificationSchema } from '@capacitor/local-notifications';
import { getCalendarEventStart, type DashboardCalendarEvent } from '../features/dashboard';
import { NativeCallTimeoutError, withNativeCallTimeout } from './native-call-timeout';

const NOTIFICATION_OWNER = 'ustudy-calendar';
const MAX_SCHEDULED_NOTIFICATIONS = 400;
const PERMISSION_CHECK_TIMEOUT_MS = 4_000;
const PERMISSION_REQUEST_TIMEOUT_MS = 8_000;
const NATIVE_PERMISSION_REQUEST_TIMEOUT_MS = 60_000;
const NOTIFICATION_SCHEDULE_TIMEOUT_MS = 15_000;

interface NativeNotificationSettingsPlugin {
  openAppNotificationSettings(): Promise<void>;
  checkNotificationPermission(): Promise<{ granted: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  sendTestNotification(): Promise<void>;
  prepareNotificationPermission(): void;
  requestPermissionAndSendTestNotification(): void;
}

const NativeNotificationSettings = registerPlugin<NativeNotificationSettingsPlugin>('NotificationSettings');

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestNativeNotificationPermission(): Promise<boolean> {
  if (await checkAndroidNotificationPermission()) return true;

  let requestCompleted = false;
  let requestGranted = false;
  let requestFailed = false;
  void NativeNotificationSettings.requestNotificationPermission().then(
    (result) => {
      requestCompleted = true;
      requestGranted = result.granted;
    },
    (error) => {
      requestCompleted = true;
      requestFailed = true;
      console.error('[calendar-notifications] Native permission request failed:', error);
    },
  );

  const deadline = Date.now() + NATIVE_PERMISSION_REQUEST_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await wait(500);

    if (requestGranted || await checkAndroidNotificationPermission()) return true;
    if (requestFailed || requestCompleted) return false;
  }

  return false;
}

export interface CalendarNotificationPermissionResult {
  granted: boolean;
  exact: boolean;
  message?: string;
  needsSettings?: boolean;
}

export function supportsCalendarNotifications(): boolean {
  return Capacitor.isNativePlatform();
}

async function getPlugin() {
  return withNativeCallTimeout(
    import('@capacitor/local-notifications').then((module) => module.LocalNotifications),
    PERMISSION_CHECK_TIMEOUT_MS,
    'load-local-notifications-plugin',
  );
}

async function checkAndroidNotificationPermission(): Promise<boolean> {
  const checks = [
    withNativeCallTimeout(
      NativeNotificationSettings.checkNotificationPermission(),
      PERMISSION_CHECK_TIMEOUT_MS,
      'check-notification-permission-native',
    ).then((result) => result.granted),
    getPlugin()
      .then((plugin) => withNativeCallTimeout(
        plugin.checkPermissions(),
        PERMISSION_CHECK_TIMEOUT_MS,
        'check-notification-permission-capacitor',
      ))
      .then((result) => result.display === 'granted'),
  ];

  return new Promise((resolve) => {
    let remaining = checks.length;

    const settle = (granted: boolean) => {
      if (granted) {
        resolve(true);
        return;
      }

      remaining -= 1;
      if (remaining === 0) resolve(false);
    };

    checks.forEach((check) => {
      void check.then(settle, () => settle(false));
    });
  });
}

export async function openAppNotificationSettings(): Promise<void> {
  if (!supportsCalendarNotifications() || Capacitor.getPlatform() !== 'android') {
    throw new Error('Cài đặt thông báo chỉ mở được trong ứng dụng Android.');
  }
  await withNativeCallTimeout(
    NativeNotificationSettings.openAppNotificationSettings(),
    PERMISSION_CHECK_TIMEOUT_MS,
    'open-notification-settings',
  );
}

export function prepareCalendarNotificationPermission(): void {
  if (!supportsCalendarNotifications() || Capacitor.getPlatform() !== 'android') return;
  NativeNotificationSettings.prepareNotificationPermission();
}

export async function requestCalendarNotificationPermission(): Promise<CalendarNotificationPermissionResult> {
  if (!supportsCalendarNotifications()) {
    return { granted: false, exact: false, message: 'Thông báo lịch chỉ hoạt động trên ứng dụng điện thoại.' };
  }

  try {
    if (Capacitor.getPlatform() === 'android') {
      const isGranted = await requestNativeNotificationPermission();
      if (!isGranted) {
        return {
          granted: false,
          exact: false,
          message: 'Quyền thông báo đang bị tắt. Hãy cho phép khi Android hỏi hoặc bật trong Cài đặt điện thoại > Ứng dụng > UStudy > Thông báo.',
          needsSettings: true,
        };
      }

      const LocalNotifications = await getPlugin();
      let exact = true;
      try {
        exact = (await withNativeCallTimeout(
          LocalNotifications.checkExactNotificationSetting(),
          PERMISSION_CHECK_TIMEOUT_MS,
          'check-exact-notification-setting',
        )).exact_alarm === 'granted';
      } catch {
        exact = false;
      }

      return {
        granted: true,
        exact,
        message: exact ? undefined : 'Android có thể gửi thông báo trễ vài phút nếu quyền báo thức chính xác đang tắt.',
      };
    }

    const LocalNotifications = await getPlugin();
    let permission = await withNativeCallTimeout(
      LocalNotifications.checkPermissions(),
      PERMISSION_CHECK_TIMEOUT_MS,
      'check-notification-permission',
    );
    if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
      permission = await withNativeCallTimeout(
        LocalNotifications.requestPermissions(),
        PERMISSION_REQUEST_TIMEOUT_MS,
        'request-notification-permission',
      );
    }

    if (permission.display !== 'granted') {
      return {
        granted: false,
        exact: false,
        message: 'Quyền thông báo đang bị tắt. Mở Cài đặt điện thoại > Ứng dụng > UStudy > Thông báo để cho phép.',
        needsSettings: true,
      };
    }

    let exact = true;
    if (Capacitor.getPlatform() === 'android') {
      try {
        exact = (await withNativeCallTimeout(
          LocalNotifications.checkExactNotificationSetting(),
          PERMISSION_CHECK_TIMEOUT_MS,
          'check-exact-notification-setting',
        )).exact_alarm === 'granted';
      } catch {
        exact = false;
      }
    }

    return {
      granted: true,
      exact,
      message: exact ? undefined : 'Android có thể gửi thông báo trễ vài phút nếu quyền báo thức chính xác đang tắt.',
    };
  } catch (error) {
    console.error('[calendar-notifications] Không thể kiểm tra quyền thông báo:', error);
    const timedOut = error instanceof NativeCallTimeoutError;
    return {
      granted: false,
      exact: false,
      needsSettings: true,
      message: timedOut
        ? 'Không thể xác nhận trạng thái thông báo từ Android. Hãy thử lại hoặc kiểm tra cài đặt thông báo của UStudy.'
        : 'Không thể kiểm tra quyền thông báo. Hãy mở cài đặt thông báo của UStudy và thử lại.',
    };
  }
}

function hashNotificationId(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) & 0x7fffffff || 1;
}

function formatReminder(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} ngày`;
  if (minutes % 60 === 0) return `${minutes / 60} giờ`;
  return `${minutes} phút`;
}

function formatEventTime(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function cancelOwnedNotifications(): Promise<void> {
  if (!supportsCalendarNotifications()) return;
  const LocalNotifications = await getPlugin();
  const pending = await withNativeCallTimeout(
    LocalNotifications.getPending(),
    PERMISSION_CHECK_TIMEOUT_MS,
    'get-pending-notifications',
  );
  const owned = pending.notifications
    .filter((notification) => notification.extra?.owner === NOTIFICATION_OWNER)
    .map((notification) => ({ id: notification.id }));

  if (owned.length > 0) {
    await withNativeCallTimeout(
      LocalNotifications.cancel({ notifications: owned }),
      PERMISSION_REQUEST_TIMEOUT_MS,
      'cancel-calendar-notifications',
    );
  }
}

export async function syncCalendarNotifications(
  events: DashboardCalendarEvent[],
  enabled: boolean,
  reminderMinutes: number[],
): Promise<void> {
  if (!supportsCalendarNotifications()) return;

  await cancelOwnedNotifications();
  if (!enabled) return;

  const LocalNotifications = await getPlugin();

  const now = Date.now();
  const usedIds = new Set<number>();
  const notifications: LocalNotificationSchema[] = [];

  for (const event of events) {
    const eventStart = getCalendarEventStart(event);
    if (!eventStart) continue;

    for (const minutes of reminderMinutes) {
      const notificationAt = new Date(eventStart.getTime() - minutes * 60 * 1000);
      if (notificationAt.getTime() <= now) continue;

      let id = hashNotificationId(`${event.id}-${minutes}`);
      while (usedIds.has(id)) id = id >= 0x7ffffffe ? 1 : id + 1;
      usedIds.add(id);

      notifications.push({
        id,
        title: `Sắp đến: ${event.title}`,
        body: [
          `Còn ${formatReminder(minutes)}`,
          formatEventTime(eventStart),
          event.room,
        ].filter(Boolean).join(' · '),
        schedule: { at: notificationAt, allowWhileIdle: true },
        group: NOTIFICATION_OWNER,
        autoCancel: true,
        extra: {
          owner: NOTIFICATION_OWNER,
          eventId: event.id,
          source: event.source,
        },
      });

      if (notifications.length >= MAX_SCHEDULED_NOTIFICATIONS) break;
    }
    if (notifications.length >= MAX_SCHEDULED_NOTIFICATIONS) break;
  }

  if (notifications.length > 0) {
    await withNativeCallTimeout(
      LocalNotifications.schedule({ notifications }),
      NOTIFICATION_SCHEDULE_TIMEOUT_MS,
      'schedule-calendar-notifications',
    );
  }
}

export async function scheduleTestCalendarNotification(): Promise<void> {
  if (!supportsCalendarNotifications()) {
    throw new Error('Thông báo thử chỉ hoạt động trên ứng dụng điện thoại.');
  }

  if (Capacitor.getPlatform() === 'android') {
    NativeNotificationSettings.requestPermissionAndSendTestNotification();
    return;
  }

  const permission = await requestCalendarNotificationPermission();
  if (!permission.granted) {
    throw new Error(permission.message || 'Chưa được cấp quyền thông báo.');
  }

  const LocalNotifications = await getPlugin();
  await withNativeCallTimeout(
    LocalNotifications.schedule({
      notifications: [{
        id: hashNotificationId(`test-${Date.now()}`),
        title: 'UStudy · Thông báo thử',
        body: 'Thông báo lịch đang hoạt động bình thường.',
        group: NOTIFICATION_OWNER,
        autoCancel: true,
        extra: { owner: NOTIFICATION_OWNER, test: true },
      }],
    }),
    PERMISSION_CHECK_TIMEOUT_MS,
    'schedule-test-notification',
  );
}
