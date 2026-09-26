package com.ustudy.app;

/** Size policy in dp, independent of launcher cell counts. */
final class WidgetGeometry {
    private WidgetGeometry() {}

    enum Width { NARROW, NORMAL, WIDE }
    enum Height { SHORT, NORMAL, TALL }

    static Width widthMode(float width) {
        width = positive(width, 250f);
        return width < 180f ? Width.NARROW : width <= 280f ? Width.NORMAL : Width.WIDE;
    }

    static Height heightMode(float height) {
        height = positive(height, 190f);
        return height < 130f ? Height.SHORT : height <= 220f ? Height.NORMAL : Height.TALL;
    }

    static boolean expandedNext(float width, float height) {
        return widthMode(width) != Width.NARROW && heightMode(height) != Height.SHORT;
    }

    static float positive(float value, float fallback) {
        return !Float.isNaN(value) && !Float.isInfinite(value) && value > 0 ? value : fallback;
    }

    static boolean compactSchedule(float width, float height) {
        return widthMode(width) == Width.NARROW || heightMode(height) == Height.SHORT;
    }
}
