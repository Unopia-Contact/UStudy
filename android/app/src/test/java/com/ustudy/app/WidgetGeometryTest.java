package com.ustudy.app;

import org.junit.Test;
import static org.junit.Assert.*;

public class WidgetGeometryTest {
    @Test public void widthBoundaries() {
        assertEquals(WidgetGeometry.Width.NARROW, WidgetGeometry.widthMode(179));
        assertEquals(WidgetGeometry.Width.NORMAL, WidgetGeometry.widthMode(180));
        assertEquals(WidgetGeometry.Width.NORMAL, WidgetGeometry.widthMode(280));
        assertEquals(WidgetGeometry.Width.WIDE, WidgetGeometry.widthMode(281));
    }
    @Test public void invalidSizesHaveSafeFallbacks() {
        assertEquals(130f, WidgetGeometry.positive(0, 130), 0.001f);
        assertEquals(190f, WidgetGeometry.positive(Float.NaN, 190), 0.001f);
        assertEquals(115f, WidgetGeometry.positive(Float.POSITIVE_INFINITY, 115), 0.001f);
    }
    @Test public void scheduleUsesCompactLayoutOnlyWhenShort() {
        assertTrue(WidgetGeometry.compactSchedule(320, 129));
        assertTrue(WidgetGeometry.compactSchedule(179, 250));
        assertFalse(WidgetGeometry.compactSchedule(180, 130));
        assertFalse(WidgetGeometry.compactSchedule(320, 250));
        assertFalse(WidgetGeometry.compactSchedule(0, 0));
    }
    @Test public void heightBoundariesAndNextDensity() {
        assertEquals(WidgetGeometry.Height.SHORT, WidgetGeometry.heightMode(129));
        assertEquals(WidgetGeometry.Height.NORMAL, WidgetGeometry.heightMode(130));
        assertEquals(WidgetGeometry.Height.NORMAL, WidgetGeometry.heightMode(220));
        assertEquals(WidgetGeometry.Height.TALL, WidgetGeometry.heightMode(221));
        assertFalse(WidgetGeometry.expandedNext(130, 260));
        assertFalse(WidgetGeometry.expandedNext(320, 115));
        assertTrue(WidgetGeometry.expandedNext(190, 260));
    }
}
