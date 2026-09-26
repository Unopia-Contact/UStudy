package com.ustudy.app;

/** Size policy in dp, independent of launcher cell counts. */
final class WidgetGeometry {
    private WidgetGeometry() {}

    static float squareSide(float width, float height) {
        return Math.min(positive(width, 130f), positive(height, 115f));
    }

    static float positive(float value, float fallback) {
        return !Float.isNaN(value) && !Float.isInfinite(value) && value > 0 ? value : fallback;
    }

    static boolean compactSchedule(float height) {
        return positive(height, 190f) < 160f;
    }
}
