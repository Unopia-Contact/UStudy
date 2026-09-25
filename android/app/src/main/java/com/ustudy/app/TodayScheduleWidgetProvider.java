package com.ustudy.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
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
        render(context, manager, new int[] { id });
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (Intent.ACTION_DATE_CHANGED.equals(action) || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)) refreshAll(context);
    }

    private static void render(Context context, AppWidgetManager manager, int[] ids) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        dateFormat.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String today = dateFormat.format(new Date());
        String snapshot = ScheduleWidgetPlugin.preferences(context).getString(ScheduleWidgetPlugin.KEY_SNAPSHOT, null);
        String status = ScheduleWidgetPlugin.preferences(context).getString(ScheduleWidgetPlugin.KEY_STATUS, null);
        int todayCount = 0;
        int upcomingCount = 0;
        boolean current = false;
        if (snapshot != null) {
            try {
                JSONObject data = new JSONObject(snapshot);
                current = today.compareTo(data.getString("validUntil")) <= 0;
                if (current) {
                    JSONArray events = data.getJSONArray("events");
                    for (int i = 0; i < events.length(); i++) {
                        String date = events.getJSONObject(i).getString("date");
                        if (today.equals(date)) todayCount++;
                        if (today.compareTo(date) <= 0) upcomingCount++;
                    }
                }
            } catch (Exception ignored) {
                current = false;
            }
        }

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today_schedule);
            Intent openApp = new Intent(context, MainActivity.class);
            openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pending = PendingIntent.getActivity(context, 0, openApp,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_header, pending);
            views.setTextViewText(R.id.widget_subtitle, todayCount > 0
                    ? "Hôm nay · " + todayCount + " buổi học"
                    : upcomingCount > 0 ? "Hôm nay nghỉ · " + upcomingCount + " buổi sắp tới" : "Lịch học của bạn");
            Bundle options = manager.getAppWidgetOptions(id);
            boolean compact = options != null && options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 200) < 150;
            views.setViewVisibility(R.id.widget_subtitle, compact ? View.GONE : View.VISIBLE);
            String message = snapshot == null
                    ? ("no-schedule".equals(status) ? "Chưa có thời khóa biểu. Mở UStudy để đồng bộ." : "Mở UStudy để nạp lịch học.")
                    : current ? "Không có lịch trong 30 ngày tới." : "Lịch đã cũ. Mở UStudy để cập nhật.";
            views.setTextViewText(R.id.widget_empty, message);

            Intent adapter = new Intent(context, ScheduleWidgetListService.class);
            adapter.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
            adapter.setData(Uri.parse(adapter.toUri(Intent.URI_INTENT_SCHEME)));
            views.setRemoteAdapter(R.id.widget_schedule_list, adapter);
            views.setEmptyView(R.id.widget_schedule_list, R.id.widget_empty);
            manager.updateAppWidget(id, views);
        }
        manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_schedule_list);
    }
}
