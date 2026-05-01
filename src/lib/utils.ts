import type { NotionTask, TaskStats, TaskStatus } from "@/types";
import { isToday, isBefore, parseISO, startOfDay, isThisWeek } from "date-fns";

export function computeStats(tasks: NotionTask[]): TaskStats {
  const now = startOfDay(new Date());

  return {
    active: tasks.filter((t) => t.status !== "done").length,
    dueToday: tasks.filter((t) => {
      if (!t.dueDate || t.status === "done") return false;
      return isToday(parseISO(t.dueDate));
    }).length,
    completed: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => {
      if (!t.dueDate || t.status === "done") return false;
      const due = parseISO(t.dueDate);
      return isBefore(due, now);
    }).length,
  };
}

export function filterTasks(
  tasks: NotionTask[],
  filter: "all" | "today" | "upcoming" | "completed"
): NotionTask[] {
  const now = startOfDay(new Date());

  switch (filter) {
    case "today":
      return tasks.filter((t) => {
        if (!t.dueDate || t.status === "done") return false;
        return isToday(parseISO(t.dueDate));
      });
    case "upcoming":
      return tasks.filter((t) => {
        if (!t.dueDate || t.status === "done") return false;
        const due = parseISO(t.dueDate);
        return !isBefore(due, now) && isThisWeek(parseISO(t.dueDate), { weekStartsOn: 1 });
      });
    case "completed":
      return tasks.filter((t) => t.status === "done");
    default:
      return tasks.filter((t) => t.status !== "done");
  }
}

export function getTasksByDate(tasks: NotionTask[], date: Date): NotionTask[] {
  const target = startOfDay(date);
  return tasks.filter((t) => {
    if (!t.dueDate) return false;
    return startOfDay(parseISO(t.dueDate)).getTime() === target.getTime();
  });
}

export function getStatusClass(status: TaskStatus, dueDate?: string | null): string {
  if (status === "done") return "done";
  if (status === "in_progress") return "in-progress";
  if (dueDate && isBefore(parseISO(dueDate), startOfDay(new Date()))) return "overdue";
  return "todo";
}

export function formatDate(dateStr: string, lang: "en" | "zh" = "en"): string {
  const d = parseISO(dateStr);
  if (lang === "zh") {
    return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}
