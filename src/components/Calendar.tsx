"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NotionTask } from "@/types";
import { getTasksByDate } from "@/lib/utils";
import { useLang, WEEKDAY_LETTERS } from "@/lib/i18n";

interface CalendarProps {
  tasks: NotionTask[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

const DOT_COLOR_MAP: Record<string, string> = {
  done: "var(--color-success)",
  overdue: "var(--color-error)",
  inProgress: "var(--color-warning)",
  todo: "var(--color-gold)",
};

export default function Calendar({ tasks, selectedDate, onSelectDate }: CalendarProps) {
  const { lang, t } = useLang();
  const WEEKDAYS = WEEKDAY_LETTERS[lang];
  const dateLocale = lang === "zh" ? zhCN : undefined;
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddingBefore = Array(startDay).fill(null);

  const getDotColor = (date: Date): string => {
    const dayTasks = getTasksByDate(tasks, date);
    if (dayTasks.length === 0) return "transparent";

    const hasOverdue = dayTasks.some(
      (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date()
    );
    const hasInProgress = dayTasks.some((t) => t.status === "in_progress");
    const allDone = dayTasks.every((t) => t.status === "done");

    if (hasOverdue) return DOT_COLOR_MAP.overdue;
    if (hasInProgress) return DOT_COLOR_MAP.inProgress;
    if (allDone) return DOT_COLOR_MAP.done;
    return DOT_COLOR_MAP.todo;
  };

  const goToPrev = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNext = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <section className="surface-panel h-full min-h-[340px] flex flex-col overflow-hidden">
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h2 className="section-title">
          {format(currentMonth, lang === "zh" ? "yyyy年 MMMM" : "MMMM yyyy", {
            locale: dateLocale,
          })}
        </h2>

        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            className="h-8 w-8 grid place-items-center rounded-md transition-colors"
            style={{
              color: "var(--color-text-secondary)",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-gold-bg)";
              e.currentTarget.style.color = "var(--color-gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
            aria-label={t("cal.prevMonth")}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToNext}
            className="h-8 w-8 grid place-items-center rounded-md transition-colors"
            style={{
              color: "var(--color-text-secondary)",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-gold-bg)";
              e.currentTarget.style.color = "var(--color-gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
            aria-label={t("cal.nextMonth")}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        {WEEKDAYS.map((day, i) => (
          <div
            key={`${day}-${i}`}
            style={{
              textAlign: "center",
              padding: "10px 0",
              font: "600 11px/1.4 'Cinzel', Georgia, serif",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--color-gold)",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[260px] grid grid-cols-7 auto-rows-fr gap-1 p-3">
        {paddingBefore.map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const isCurrentDay = isToday(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dotColor = getDotColor(day);
          const dayTasks = getTasksByDate(tasks, day);
          const dotCount = dayTasks.length;
          const isFuture = day > new Date();

          let cellClass = "rounded-md flex flex-col items-center justify-center transition-colors";
          if (isSelected) cellClass += " calendar-selected";
          else if (isCurrentDay) cellClass += " calendar-today";

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cellClass}
              style={{
                minHeight: "44px",
                border: !isSelected && !isCurrentDay ? "1px solid transparent" : undefined,
                background: !isSelected && !isCurrentDay ? "transparent" : undefined,
                opacity: isFuture && !isCurrentDay ? 0.6 : 1,
              }}
              aria-label={`${format(day, "MMMM d")}, ${dayTasks.length} quests`}
              title={`${format(day, "MMMM d")}: ${dayTasks.length} quest${dayTasks.length === 1 ? "" : "s"}`}
            >
              <span
                style={{
                  font: `${isCurrentDay || isSelected ? 600 : 500} 13px/1.2 "Cinzel", Georgia, serif`,
                  color: isSelected
                    ? "var(--color-surface)"
                    : isCurrentDay
                      ? "var(--color-gold)"
                      : "var(--color-text-primary)",
                  letterSpacing: "0.02em",
                }}
              >
                {format(day, "d")}
              </span>

              {dotCount > 0 && !isSelected && (
                <div className="mt-1 flex items-center gap-[2px]">
                  {[...Array(Math.min(dotCount, 3))].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "999px",
                        background: dotColor,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="px-6 py-3 border-t flex flex-wrap items-center gap-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        {[
          [t("cal.legend.overdue"), "var(--color-error)"],
          [t("cal.legend.active"), "var(--color-warning)"],
          [t("cal.legend.open"), "var(--color-gold)"],
          [t("cal.legend.done"), "var(--color-success)"],
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "999px",
                background: color,
              }}
            />
            <span className="eyebrow-label" style={{ fontSize: "10px", letterSpacing: "0.10em" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
