package com.ustudy.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class TodayScheduleWidgetProvider extends AppWidgetProvider {
    private static final int[] ROWS = { R.id.widget_row_1, R.id.widget_row_2, R.id.widget_row_3 };
    private static final int[] TIMES = { R.id.widget_time_1, R.id.widget_time_2, R.id.widget_time_3 };
    private static final int[] TITLES = { R.id.widget_title_1, R.id.widget_title_2, R.id.widget_title_3 };
    private static final int[] ROOMS = { R.id.widget_room_1, R.id.widget_room_2, R.id.widget_room_3 };

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
        boolean enabled = ScheduleWidgetPlugin.preferences(context).getBoolean(ScheduleWidgetPlugin.KEY_ENABLED, false);
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today_schedule);
            Intent openApp = new Intent(context, MainActivity.class);
            openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pending = PendingIntent.getActivity(context, 0, openApp,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pending);
            for (int row : ROWS) views.setViewVisibility(row, View.GONE);
            String message = enabled
                    ? (snapshot == null ? "Chưa có thời khóa biểu trong UStudy" : "Mở UStudy để cập nhật lịch")
                    : "Bật widget trong Cài đặt UStudy";
            int count = 0;
            if (enabled && snapshot != null) {
                try {
                    JSONObject data = new JSONObject(snapshot);
                    if (today.compareTo(data.getString("validUntil")) <= 0) {
                        JSONArray events = data.getJSONArray("events");
                        message = "Hôm nay không có lịch học";
                        for (int i = 0; i < events.length(); i++) {
                            JSONObject event = events.getJSONObject(i);
                            if (!today.equals(event.getString("date"))) continue;
                            if (count < ROWS.length) {
                                views.setViewVisibility(ROWS[count], View.VISIBLE);
                                views.setTextViewText(TIMES[count], event.getString("startTime") + "–" + event.getString("endTime"));
                                views.setTextViewText(TITLES[count], event.getString("title"));
                                String room = event.optString("room", "");
                                views.setTextViewText(ROOMS[count], room.isEmpty() ? "Chưa có phòng" : room);
                            }
                            count++;
                        }
                        if (count > ROWS.length) message = "+" + (count - ROWS.length) + " buổi khác · mở UStudy";
                        else if (count > 0) message = "";
                    }
                } catch (Exception ignored) {
                    message = "Mở UStudy để cập nhật lịch";
                }
            }
            views.setTextViewText(R.id.widget_message, message);
            views.setViewVisibility(R.id.widget_message, message.isEmpty() ? View.GONE : View.VISIBLE);
            manager.updateAppWidget(id, views);
        }
    }
}
