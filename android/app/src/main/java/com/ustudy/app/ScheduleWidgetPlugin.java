package com.ustudy.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "ScheduleWidget")
public class ScheduleWidgetPlugin extends Plugin {
    static final String PREFS = "ustudy_schedule_widget";
    static final String KEY_ENABLED = "enabled";
    static final String KEY_SNAPSHOT = "snapshot";

    static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("Thiếu trạng thái widget.");
            return;
        }
        SharedPreferences.Editor editor = preferences(getContext()).edit().putBoolean(KEY_ENABLED, enabled);
        if (!enabled) editor.remove(KEY_SNAPSHOT);
        if (!editor.commit()) {
            call.reject("Không thể lưu cài đặt widget.");
            return;
        }
        TodayScheduleWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void setSnapshot(PluginCall call) {
        if (!preferences(getContext()).getBoolean(KEY_ENABLED, false)) {
            call.reject("Widget chưa được bật.");
            return;
        }
        String snapshot = call.getString("snapshot");
        if (snapshot == null) {
            preferences(getContext()).edit().remove(KEY_SNAPSHOT).apply();
            TodayScheduleWidgetProvider.refreshAll(getContext());
            call.resolve();
            return;
        }
        if (snapshot.getBytes(StandardCharsets.UTF_8).length > 131072) {
            call.reject("Dữ liệu lịch quá lớn.");
            return;
        }
        try {
            JSONObject data = new JSONObject(snapshot);
            JSONArray events = data.getJSONArray("events");
            if (data.getInt("version") != 1 || events.length() > 256
                    || !data.getString("validUntil").matches("\\d{4}-\\d{2}-\\d{2}")) {
                call.reject("Định dạng lịch không hợp lệ.");
                return;
            }
            for (int i = 0; i < events.length(); i++) {
                JSONObject event = events.getJSONObject(i);
                if (!event.getString("date").matches("\\d{4}-\\d{2}-\\d{2}")
                        || !event.getString("startTime").matches("\\d{2}:\\d{2}")
                        || !event.getString("endTime").matches("\\d{2}:\\d{2}")
                        || event.getString("title").length() > 160
                        || event.getString("room").length() > 80
                        || event.getString("campusId").length() > 40) {
                    call.reject("Một buổi học không hợp lệ.");
                    return;
                }
            }
            if (!preferences(getContext()).edit().putString(KEY_SNAPSHOT, snapshot).commit()) {
                call.reject("Không thể lưu lịch cho widget.");
                return;
            }
            TodayScheduleWidgetProvider.refreshAll(getContext());
            call.resolve();
        } catch (Exception error) {
            call.reject("Không thể đọc dữ liệu lịch.", error);
        }
    }
}
