package com.ustudy.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class TodayScheduleWidgetProvider extends AppWidgetProvider {
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TodayScheduleWidgetProvider.class));
        if (ids.length > 0) render(context, manager, ids);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        render(context, manager, ids);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        super.onAppWidgetOptionsChanged(context, manager, id, options);
        render(context, manager, new int[] { id }, options);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (Intent.ACTION_DATE_CHANGED.equals(action) || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)) refreshAll(context);
    }

    private static void render(Context context, AppWidgetManager manager, int[] ids) {
        render(context, manager, ids, null);
    }

    private static void render(Context context, AppWidgetManager manager, int[] ids, Bundle changedOptions) {
        if (ids == null || ids.length == 0) return;
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        dateFormat.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String today = dateFormat.format(new Date());
        String snapshot = ScheduleWidgetPlugin.preferences(context).getString(ScheduleWidgetPlugin.KEY_SNAPSHOT, null);
        String status = ScheduleWidgetPlugin.preferences(context).getString(ScheduleWidgetPlugin.KEY_STATUS, null);
        boolean current = false;
        if (snapshot != null) {
            try {
                JSONObject data = new JSONObject(snapshot);
                current = today.compareTo(data.getString("validUntil")) <= 0;
            } catch (Exception ignored) {
                current = false;
            }
        }

        for (int id : ids) {
            final String emptyMessage = snapshot == null
                    ? ("no-schedule".equals(status) ? "Chưa có thời khóa biểu. Mở UStudy để đồng bộ." : "Mở UStudy để nạp lịch học.")
                    : current ? "Không có lịch trong 30 ngày tới." : "Lịch đã cũ. Mở UStudy để cập nhật.";
            RemoteViews views = WidgetSizeLayouts.create(changedOptions != null ? changedOptions : manager.getAppWidgetOptions(id),
                    250f, 190f, (width, height) -> createViews(context, id, width, height, emptyMessage));
            manager.updateAppWidget(id, views);
        }
        manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_schedule_list);
    }

    private static RemoteViews createViews(Context context, int id, float width, float height, String message) {
            RemoteViews views = new RemoteViews(context.getPackageName(), WidgetGeometry.compactSchedule(width, height)
                    ? R.layout.widget_today_schedule_compact : R.layout.widget_today_schedule);
            Intent openApp = new Intent(Intent.ACTION_VIEW, Uri.parse("com.ustudy.app://schedule"),
                    context, MainActivity.class);
            openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pending = PendingIntent.getActivity(context, 0, openApp,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_header, pending);
            views.setTextViewText(R.id.widget_empty, message);

            Intent adapter = new Intent(context, ScheduleWidgetListService.class);
            adapter.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
            adapter.setData(Uri.parse(adapter.toUri(Intent.URI_INTENT_SCHEME)));
            views.setRemoteAdapter(R.id.widget_schedule_list, adapter);
            views.setEmptyView(R.id.widget_schedule_list, R.id.widget_empty);
            return views;
    }
}
