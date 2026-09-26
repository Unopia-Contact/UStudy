package com.ustudy.app;

import android.appwidget.AppWidgetManager;
import android.os.Build;
import android.os.Bundle;
import android.util.SizeF;
import android.widget.RemoteViews;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

/** Exact sizes on Android 12+, orientation-aware estimates on older launchers. */
final class WidgetSizeLayouts {
    interface Factory { RemoteViews create(float width, float height); }

    private WidgetSizeLayouts() {}

    static RemoteViews create(Bundle options, float defaultWidth,
            float defaultHeight, Factory factory) {
        if (options == null) options = new Bundle();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ArrayList<SizeF> sizes = options.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES);
            Map<SizeF, RemoteViews> layouts = new LinkedHashMap<>();
            if (sizes != null) for (SizeF size : sizes) {
                if (size == null || size.getWidth() <= 0 || size.getHeight() <= 0
                        || Float.isNaN(size.getWidth()) || Float.isNaN(size.getHeight())
                        || Float.isInfinite(size.getWidth()) || Float.isInfinite(size.getHeight())) continue;
                // RemoteViews permits at most 16 size variants.
                if (layouts.size() == 16) break;
                layouts.put(size, factory.create(size.getWidth(), size.getHeight()));
            }
            if (!layouts.isEmpty()) return new RemoteViews(layouts);
        }
        float minWidth = WidgetGeometry.positive(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH), defaultWidth);
        float maxWidth = WidgetGeometry.positive(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH), minWidth);
        float minHeight = WidgetGeometry.positive(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT), defaultHeight);
        float maxHeight = WidgetGeometry.positive(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT), minHeight);
        return new RemoteViews(factory.create(maxWidth, minHeight), factory.create(minWidth, maxHeight));
    }
}
