package com.ustudy.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationSettings")
public class NotificationSettingsPlugin extends Plugin {
    private static final int NOTIFICATION_PERMISSION_REQUEST_CODE = 41002;
    private static final String TEST_CHANNEL_ID = "ustudy_notification_test";
    private static final String LOG_TAG = "UStudyNotifications";
    private static NotificationSettingsPlugin activeInstance;
    private PluginCall pendingPermissionCall;
    private boolean permissionRequestActive;
    private boolean sendTestAfterPermission;

    @Override
    public void load() {
        super.load();
        activeInstance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (activeInstance == this) {
            activeInstance = null;
        }
        pendingPermissionCall = null;
        permissionRequestActive = false;
        sendTestAfterPermission = false;
    }

    @Override
    protected void handleOnResume() {
        if (hasNotificationPermission()) {
            permissionRequestActive = false;
            sendPendingTestNotification();
        }
    }

    private boolean hasNotificationPermission() {
        return
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean canPostNotifications() {
        return hasNotificationPermission() && NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    }

    private void requestPermissionWithoutWaiting() {
        if (hasNotificationPermission() || permissionRequestActive) return;

        permissionRequestActive = true;
        try {
            ActivityCompat.requestPermissions(
                getActivity(),
                new String[] { Manifest.permission.POST_NOTIFICATIONS },
                NOTIFICATION_PERMISSION_REQUEST_CODE
            );
        } catch (Exception error) {
            permissionRequestActive = false;
            Log.e(LOG_TAG, "Unable to request notification permission", error);
        }
    }

    private void openNotificationSettings() {
        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
        intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
    }

    private void resolveNotificationPermission(PluginCall call) {
        boolean granted = hasNotificationPermission() && NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    private void resolvePendingPermissionCall() {
        PluginCall pendingCall = pendingPermissionCall;
        if (pendingCall == null) return;

        pendingPermissionCall = null;
        resolveNotificationPermission(pendingCall);
        getBridge().releaseCall(pendingCall);
    }

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        resolveNotificationPermission(call);

        // Some Android skins update the permission before dispatching the
        // activity callback. Complete the saved request after this check has
        // already answered so polling can never be blocked by the old call.
        if (pendingPermissionCall != null && hasNotificationPermission()) {
            resolvePendingPermissionCall();
        }
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (hasNotificationPermission()) {
            resolveNotificationPermission(call);
            return;
        }

        if (pendingPermissionCall != null) {
            call.reject("A notification permission request is already active.");
            return;
        }

        pendingPermissionCall = call;
        getBridge().saveCall(call);
        try {
            ActivityCompat.requestPermissions(
                getActivity(),
                new String[] { Manifest.permission.POST_NOTIFICATIONS },
                NOTIFICATION_PERMISSION_REQUEST_CODE
            );
        } catch (Exception error) {
            pendingPermissionCall = null;
            getBridge().releaseCall(call);
            call.reject("Unable to request notification permission: " + error.getMessage(), error);
        }
    }

    public static boolean handlePermissionResult(int requestCode) {
        if (requestCode != NOTIFICATION_PERMISSION_REQUEST_CODE) return false;

        NotificationSettingsPlugin plugin = activeInstance;
        if (plugin != null) {
            plugin.permissionRequestActive = false;
            if (plugin.pendingPermissionCall != null) {
                plugin.resolvePendingPermissionCall();
            }
            plugin.sendPendingTestNotification();
        }
        return true;
    }

    @PluginMethod(returnType = PluginMethod.RETURN_NONE)
    public void prepareNotificationPermission(PluginCall call) {
        requestPermissionWithoutWaiting();
    }

    @PluginMethod(returnType = PluginMethod.RETURN_NONE)
    public void requestPermissionAndSendTestNotification(PluginCall call) {
        if (canPostNotifications()) {
            displayTestNotification();
            return;
        }

        if (!hasNotificationPermission()) {
            sendTestAfterPermission = true;
            requestPermissionWithoutWaiting();
            return;
        }

        try {
            openNotificationSettings();
        } catch (Exception error) {
            Log.e(LOG_TAG, "Unable to open notification settings", error);
        }
    }

    @PluginMethod
    public void openAppNotificationSettings(PluginCall call) {
        try {
            openNotificationSettings();
            call.resolve();
        } catch (Exception error) {
            call.reject("Không thể mở cài đặt thông báo: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void sendTestNotification(PluginCall call) {
        try {
            if (!hasNotificationPermission()) {
                call.reject("Notification permission is not granted.");
                return;
            }

            if (!canPostNotifications()) {
                call.reject("Notifications are disabled for UStudy.");
                return;
            }

            displayTestNotification();
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to display the test notification: " + error.getMessage(), error);
        }
    }

    private void sendPendingTestNotification() {
        if (!sendTestAfterPermission || !canPostNotifications()) return;

        sendTestAfterPermission = false;
        displayTestNotification();
    }

    private void displayTestNotification() {
        try {
            Context context = getContext();
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationManager systemManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                NotificationChannel channel = new NotificationChannel(
                    TEST_CHANNEL_ID,
                    "UStudy test notifications",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Checks whether UStudy can display notifications on this device.");
                systemManager.createNotificationChannel(channel);
            }

            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                91001,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder notification = new NotificationCompat.Builder(context, TEST_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("UStudy - Thong bao thu")
                .setContentText("Thong bao tren dien thoai dang hoat dong binh thuong.")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

            notificationManager.notify(91001, notification.build());
        } catch (Exception error) {
            Log.e(LOG_TAG, "Unable to display the test notification", error);
        }
    }
}
