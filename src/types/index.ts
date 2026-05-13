export type TaskStatus = "todo" | "in_progress" | "done";

export interface NotionTask {
  id: string;
  name: string;
  status: TaskStatus;
  dueDate?: string | null;
  description?: string;
  business?: string;
  createdAt: string;
}

export interface TaskStats {
  active: number;
  dueToday: number;
  completed: number;
  overdue: number;
}

export type TaskFilter = "all" | "today" | "upcoming" | "completed";

export interface ScrollFile {
  url: string;
  name: string;
  size: number;
}

export interface Scroll {
  id: string;
  author: string;
  message: string;
  taskId?: string;
  taskName?: string;
  newStatus?: TaskStatus;
  links?: string[];
  files?: ScrollFile[];
  createdAt: string;
}

export type ReminderRecurrence = "none" | "daily" | "weekly" | "monthly";

export interface Reminder {
  id: string;
  title: string | null;
  /** ISO timestamp (UTC) when this should fire next */
  scheduledAt: string;
  /** One or more message bodies — each posts as a separate Discord message */
  texts: string[];
  /** How often to repeat. "none" = one-shot. */
  recurrence: ReminderRecurrence;
  /** ISO timestamp when the reminder LAST fired, or null if never */
  firedAt: string | null;
  createdAt: string;
}
