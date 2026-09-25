package com.ustudy.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
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
                views.setTextViewText(R.id.next_widget_title, next.title);
                views.setTextViewText(R.id.next_widget_details, next.startTime + "–" + next.endTime
                        + " · " + (next.room.isEmpty() ? "Chưa có phòng" : next.room));
                views.setTextViewText(R.id.next_widget_status, timeLabel(next, now, today));
            } else {
                String title = snapshot == null
                        ? ("no-schedule".equals(status) ? "Chưa có thời khóa biểu" : "Chưa có lịch học")
                        : current ? "Không có buổi học sắp tới" : "Lịch học đã cũ";
                String details = snapshot == null && "no-schedule".equals(status)
                        ? "Mở UStudy để đồng bộ" : current ? "Trong 30 ngày tới" : "Mở UStudy để cập nhật";
                views.setTextViewText(R.id.next_widget_title, title);
                views.setTextViewText(R.id.next_widget_details, details);
                views.setTextViewText(R.id.next_widget_status, "");
            }
            manager.updateAppWidget(id, views);
        }
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
