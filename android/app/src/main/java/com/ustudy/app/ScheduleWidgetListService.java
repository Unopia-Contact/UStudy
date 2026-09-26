package com.ustudy.app;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/** Collection widget: Android tự cuộn danh sách, dữ liệu chỉ đọc từ bộ nhớ riêng của APK. */
public class ScheduleWidgetListService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new ScheduleFactory(getApplicationContext());
    }

    private static final class Row {
        final boolean dayHeader;
        final boolean alternateDay;
        final String label;
        final String startTime;
        final String endTime;
        final String title;
        final String room;

        private Row(boolean dayHeader, boolean alternateDay, String label, String startTime, String endTime,
                String title, String room) {
            this.dayHeader = dayHeader;
            this.alternateDay = alternateDay;
            this.label = label;
            this.startTime = startTime;
            this.endTime = endTime;
            this.title = title;
            this.room = room;
        }

        static Row day(String label, boolean alternate) {
            return new Row(true, alternate, label, "", "", "", "");
        }
        static Row session(String start, String end, String title, String room) {
            return new Row(false, false, "", start, end, title, room);
        }
    }

    private static final class ScheduleFactory implements RemoteViewsFactory {
        private final Context context;
        private volatile List<Row> rows = new ArrayList<>();

        ScheduleFactory(Context context) { this.context = context; }

        @Override public void onCreate() { onDataSetChanged(); }
        @Override public void onDestroy() { rows = new ArrayList<>(); }

        @Override
        public void onDataSetChanged() {
            List<Row> nextRows = new ArrayList<>();
            String snapshot = ScheduleWidgetPlugin.preferences(context).getString(ScheduleWidgetPlugin.KEY_SNAPSHOT, null);
            if (snapshot == null) { rows = nextRows; return; }

            TimeZone zone = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
            SimpleDateFormat dateKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            dateKey.setTimeZone(zone);
            dateKey.setLenient(false);
            String today = dateKey.format(new Date());
            SimpleDateFormat dayLabel = new SimpleDateFormat("EEEE, dd/MM", new Locale("vi", "VN"));
            dayLabel.setTimeZone(zone);
            String lastDate = "";
            int dayIndex = 0;

            try {
                JSONObject data = new JSONObject(snapshot);
                if (today.compareTo(data.getString("validUntil")) > 0) { rows = nextRows; return; }
                JSONArray events = data.getJSONArray("events");
                for (int i = 0; i < events.length(); i++) {
                    JSONObject event = events.getJSONObject(i);
                    String date = event.getString("date");
                    if (date.compareTo(today) < 0) continue;
                    if (!date.equals(lastDate)) {
                        Date parsed = dateKey.parse(date);
                        nextRows.add(Row.day(dayLabel.format(parsed), dayIndex % 2 == 1));
                        dayIndex++;
                        lastDate = date;
                    }
                    nextRows.add(Row.session(event.getString("startTime"), event.getString("endTime"),
                            event.getString("title"), event.optString("room", "")));
                }
            } catch (Exception ignored) {
                nextRows.clear();
            }
            rows = nextRows;
        }

        @Override public int getCount() { return rows.size(); }
        @Override public long getItemId(int position) { return position; }
        @Override public boolean hasStableIds() { return false; }
        @Override public int getViewTypeCount() { return 3; }
        @Override public RemoteViews getLoadingView() { return null; }

        @Override
        public RemoteViews getViewAt(int position) {
            List<Row> current = rows;
            if (position < 0 || position >= current.size()) return null;
            Row row = current.get(position);
            if (row.dayHeader) {
                RemoteViews views = new RemoteViews(context.getPackageName(), row.alternateDay
                        ? R.layout.widget_day_header_alt : R.layout.widget_day_header);
                views.setTextViewText(R.id.widget_day_label, row.label);
                return views;
            }
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_session_item);
            views.setTextViewText(R.id.widget_item_start, row.startTime);
            views.setTextViewText(R.id.widget_item_end, row.endTime);
            views.setTextViewText(R.id.widget_item_title, row.title);
            views.setTextViewText(R.id.widget_item_room, row.room.isEmpty() ? "Chưa có phòng" : "Phòng " + row.room);
            return views;
        }
    }
}
