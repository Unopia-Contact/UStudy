package com.ustudy.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

/** Compact widget backed by the same local, 30-day schedule snapshot as the list widget. */
public class NextScheduleWidgetProvider extends AppWidgetProvider {
    private static final TimeZone CAMPUS_TIME_ZONE = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, NextScheduleWidgetProvider.class));
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
        if (Intent.ACTION_DATE_CHANGED.equals(action) || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) refreshAll(context);
    }

    private static void render(Context context, AppWidgetManager manager, int[] ids) {
        if (ids == null || ids.length == 0) return;

        Date now = new Date();
        String snapshot = ScheduleWidgetPlugin.preferences(context).getString(ScheduleWidgetPlugin.KEY_SNAPSHOT, null);
        String status = ScheduleWidgetPlugin.preferences(context).getString(ScheduleWidgetPlugin.KEY_STATUS, null);
        String today = dateFormat("yyyy-MM-dd").format(now);
        NextSession next = null;
        boolean current = false;
        if (snapshot != null) {
            try {
                JSONObject data = new JSONObject(snapshot);
                current = today.compareTo(data.getString("validUntil")) <= 0;
                if (current) next = findNext(data.getJSONArray("events"), now);
            } catch (Exception ignored) {
                current = false;
            }
        }

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_next_schedule);
            Intent openSchedule = new Intent(Intent.ACTION_VIEW, Uri.parse("com.ustudy.app://schedule"),
                    context, MainActivity.class);
            openSchedule.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pending = PendingIntent.getActivity(context, 1, openSchedule,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.next_widget_root, pending);

            if (next != null) {
                Calendar date = Calendar.getInstance(CAMPUS_TIME_ZONE);
                date.setTime(next.start);
                int weekday = date.get(Calendar.DAY_OF_WEEK);
                views.setTextViewText(R.id.next_widget_weekday,
                        weekday == Calendar.SUNDAY ? "CN" : "Th " + weekday);
                views.setTextViewText(R.id.next_widget_date, String.valueOf(date.get(Calendar.DAY_OF_MONTH)));
                views.setTextViewText(R.id.next_widget_month, "thg " + (date.get(Calendar.MONTH) + 1));
                views.setTextViewText(R.id.next_widget_title, next.title);
                views.setTextViewText(R.id.next_widget_time, next.startTime + "–" + next.endTime);
                views.setTextViewText(R.id.next_widget_room, next.room.isEmpty() ? "Chưa có phòng" : next.room);
                views.setViewVisibility(R.id.next_widget_room_row, View.VISIBLE);
                views.setTextViewText(R.id.next_widget_status, timeLabel(next, now, today));
            } else {
                views.setTextViewText(R.id.next_widget_weekday, "");
                views.setTextViewText(R.id.next_widget_date, "–");
                views.setTextViewText(R.id.next_widget_month, "");
                String title = snapshot == null
                        ? ("no-schedule".equals(status) ? "Chưa có TKB" : "Chưa có lịch")
                        : current ? "Không có lịch" : "Lịch đã cũ";
                String message = snapshot == null && "no-schedule".equals(status)
                        ? "Đồng bộ lịch học" : current ? "Trong 30 ngày tới" : "Mở UStudy cập nhật";
                views.setTextViewText(R.id.next_widget_title, title);
                views.setTextViewText(R.id.next_widget_time, "");
                views.setTextViewText(R.id.next_widget_room, "");
                views.setViewVisibility(R.id.next_widget_room_row, View.GONE);
                views.setTextViewText(R.id.next_widget_status, message);
            }
            manager.updateAppWidget(id, WidgetSizeLayouts.create(manager.getAppWidgetOptions(id),
                    130f, 115f, (width, height) -> squareViews(context, views, width, height)));
        }
    }

    private static RemoteViews squareViews(Context context, RemoteViews source, float width, float height) {
        RemoteViews views = source.clone();
        float side = WidgetGeometry.squareSide(width, height);
        int pixels = Math.max(1, (int) Math.floor(side * context.getResources().getDisplayMetrics().density));
        views.setInt(R.id.next_widget_size, "setWidth", pixels);
        views.setInt(R.id.next_widget_size, "setHeight", pixels);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            views.setViewLayoutWidth(R.id.next_widget_root, pixels, TypedValue.COMPLEX_UNIT_PX);
            views.setViewLayoutHeight(R.id.next_widget_root, pixels, TypedValue.COMPLEX_UNIT_PX);
        }
        boolean expanded = side >= 180f;
        views.setInt(R.id.next_widget_title, "setMaxLines", expanded ? 2 : 1);
        views.setTextViewTextSize(R.id.next_widget_title, TypedValue.COMPLEX_UNIT_SP, expanded ? 12f : 10f);
        views.setTextViewTextSize(R.id.next_widget_time, TypedValue.COMPLEX_UNIT_SP, expanded ? 13f : 10f);
        views.setTextViewTextSize(R.id.next_widget_date, TypedValue.COMPLEX_UNIT_SP, expanded ? 25f : 19f);
        views.setTextViewTextSize(R.id.next_widget_room, TypedValue.COMPLEX_UNIT_SP, expanded ? 11f : 9f);
        views.setTextViewTextSize(R.id.next_widget_status, TypedValue.COMPLEX_UNIT_SP, expanded ? 9f : 8f);
        return views;
    }

    private static NextSession findNext(JSONArray events, Date now) throws Exception {
        SimpleDateFormat timeFormat = dateFormat("yyyy-MM-dd HH:mm");
        NextSession next = null;
        for (int i = 0; i < events.length(); i++) {
            try {
                JSONObject event = events.getJSONObject(i);
                String date = event.getString("date");
                String startTime = event.getString("startTime");
                String endTime = event.getString("endTime");
                Date start = timeFormat.parse(date + " " + startTime);
                Date end = timeFormat.parse(date + " " + endTime);
                if (start == null || end == null || !end.after(start) || !end.after(now)) continue;
                if (next == null || start.before(next.start)) {
                    next = new NextSession(date, startTime, endTime, event.getString("title"),
                            event.optString("room", ""), start, end);
                }
            } catch (Exception ignored) {
                // A damaged event should not hide the remaining valid classes.
            }
        }
        return next;
    }

    private static String timeLabel(NextSession session, Date now, String today) {
        if (!session.start.after(now)) return "Đang học · đến " + session.endTime;
        long minutes = (session.start.getTime() - now.getTime() + 59999) / 60000;
        if (session.date.equals(today)) {
            if (minutes < 60) return "Còn khoảng " + minutes + " phút";
            return "Hôm nay · " + session.startTime;
        }
        SimpleDateFormat dayFormat = dateFormat("yyyy-MM-dd");
        try {
            Date day = dayFormat.parse(session.date);
            if (day != null && day.getTime() - dayFormat.parse(today).getTime() == 86400000L) {
                return "Ngày mai · " + session.startTime;
            }
            return dateFormat("EEE, dd/MM").format(day) + " · " + session.startTime;
        } catch (Exception ignored) {
            return session.date + " · " + session.startTime;
        }
    }

    private static SimpleDateFormat dateFormat(String pattern) {
        SimpleDateFormat format = new SimpleDateFormat(pattern, new Locale("vi", "VN"));
        format.setTimeZone(CAMPUS_TIME_ZONE);
        format.setLenient(false);
        return format;
    }

    private static final class NextSession {
        final String date;
        final String startTime;
        final String endTime;
        final String title;
        final String room;
        final Date start;
        final Date end;

        NextSession(String date, String startTime, String endTime, String title, String room, Date start, Date end) {
            this.date = date;
            this.startTime = startTime;
            this.endTime = endTime;
            this.title = title;
            this.room = room;
            this.start = start;
            this.end = end;
        }
    }
}
