import { useMemo } from "react";
import {
  CalendarDays,
  MapPin,
  Settings2,
} from "lucide-react";

import type { DashboardCalendarEvent } from "../services/dashboard-calendar-events";
import type { DashboardCalendarSource } from "../services/dashboard-layout";

interface DashboardCalendarWidgetProps {
  sources: DashboardCalendarSource[];
  days: number;
  events: DashboardCalendarEvent[];
  onOpenSettings: () => void;
  showSettings?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatEventDate(date: Date, today: Date): string {
  const dayDiff = Math.round(
    (startOfDay(date).getTime() - startOfDay(today).getTime()) / DAY_MS,
  );

  if (dayDiff === 0) return "Hôm nay";
  if (dayDiff === 1) return "Ngày mai";

  const weekday = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
  }).format(date);

  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function DashboardCalendarWidget({
  days,
  events,
  onOpenSettings,
  showSettings = true,
}: DashboardCalendarWidgetProps) {
  const today = new Date();
  const todayKey = toDateKey(today);


  const groupedEvents = useMemo(() => {
    return events.reduce<
      Array<{
        key: string;
        date: Date;
        events: DashboardCalendarEvent[];
      }>
    >((groups, event) => {
      const key = toDateKey(event.date);
      const currentGroup = groups.at(-1);

      if (currentGroup?.key === key) {
        currentGroup.events.push(event);
      } else {
        groups.push({
          key,
          date: event.date,
          events: [event],
        });
      }

      return groups;
    }, []);
  }, [events]);

  return (
    <section className="ustudy-card ustudy-card-padding flex min-h-[300px] max-h-[440px] flex-col overflow-hidden">
      {/* ================= HEADER ================= */}
      <header className="relative z-30 shrink-0 border-b border-slate-100 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#004A98] shadow-sm shadow-blue-900/10">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold tracking-[-0.01em] text-slate-900 md:text-base">
                  Lịch {days} ngày tới
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Theo dõi lịch học và lịch thi sắp tới
                </p>
              </div>
            </div>

            {/* Sources */}
            {/* <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {hasClasses && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#004A98] ring-1 ring-inset ring-blue-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#004A98]" />
                  Lịch học
                </span>
              )}

              {hasExams && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  Lịch thi
                </span>
              )}

              {!hasClasses && !hasExams && (
                <span className="text-xs text-slate-400">
                  Chưa chọn nội dung
                </span>
              )}

              {events.length > 0 && (
                <span className="ml-0.5 text-[11px] font-medium text-slate-400">
                  · {events.length} sự kiện
                </span>
              )}
            </div> */}
          </div>

          {showSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="
                group flex h-9 w-9 shrink-0 items-center justify-center
                rounded-xl border border-slate-200 bg-white
                text-slate-400 shadow-sm
                transition-all duration-200
                hover:border-blue-200 hover:bg-blue-50
                hover:text-[#004A98] hover:shadow
                active:scale-95
              "
              title="Tùy chỉnh nội dung lịch"
              aria-label="Tùy chỉnh nội dung lịch"
            >
              <Settings2 className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
            </button>
          )}
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      {events.length > 0 ? (
        <div
          className="
            relative min-h-0 flex-1 overflow-y-auto
            [scrollbar-gutter:stable]
            [scrollbar-width:thin]
          "
        >
          {groupedEvents.map((group) => {
            const isToday = group.key === todayKey;

            return (
              <section
                key={group.key}
                className="relative pb-2 last:pb-1"
              >
                {/* ================= DATE HEADER ================= */}
                <div
                  className="
                    sticky -top-px z-20
                    flex items-center justify-between
                    bg-white/95 px-1 py-3
                    backdrop-blur-md
                  "
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {isToday && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#004A98] opacity-30" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#004A98]" />
                      </span>
                    )}

                    <h4
                      className={`text-[13px] font-bold ${isToday ? "text-[#004A98]" : "text-slate-700"
                        }`}
                    >
                      {formatEventDate(group.date, today)}
                    </h4>

                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-500">
                      {formatShortDate(group.date)}
                    </span>
                  </div>

                  {group.events.length > 1 && (
                    <span className="shrink-0 text-[10px] font-medium text-slate-400">
                      {group.events.length} sự kiện
                    </span>
                  )}
                </div>

                {/* ================= EVENTS ================= */}
                <div className="space-y-2">
                  {group.events.map((event) => {
                    const isClass = event.source === "classes";
                    const accent = isClass
                      ? "bg-[#004A98]"
                      : "bg-violet-500";

                    return (
                      <article
                        key={event.id}
                        className="
    group relative overflow-hidden
    rounded-lg border border-slate-200/80
    bg-white px-3.5 py-2.5
    transition-all duration-150
    hover:border-blue-200 hover:bg-slate-50/60
  "
                      >
                        {/* Accent */}
                        <div
                          className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full ${accent}`}
                        />

                        <div className="min-w-0 pl-1">
                          {/* Tên môn */}
                          <p className="truncate text-[13.5px] font-semibold leading-5 text-slate-900">
                            {event.title}
                          </p>

                          {/* Giờ + phòng */}
                          <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px]">
                            <span
                              className={`shrink-0 font-semibold tabular-nums ${isClass ? "text-[#004A98]" : "text-violet-700"
                                }`}
                            >
                              {event.startTime || "Chưa có giờ"}
                              {event.endTime && ` – ${event.endTime}`}
                            </span>

                            <span className="text-slate-300">•</span>

                            <span className="inline-flex min-w-0 items-center gap-1 text-slate-500">
                              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                              <span className="truncate">
                                {event.room || "Chưa có phòng"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* ================= EMPTY STATE ================= */
        <div className="flex min-h-40 flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 scale-150 rounded-full bg-blue-50 blur-xl" />

            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
              <CalendarDays className="h-5 w-5 text-[#004A98]" />
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-800">
            Lịch đang trống
          </p>

          <p className="mt-1 max-w-[260px] text-xs leading-5 text-slate-500">
            Không có lịch học hoặc lịch thi trong {days} ngày tiếp theo.
          </p>
        </div>
      )}
    </section>
  );
}
