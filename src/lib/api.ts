import type { NotionTask, Scroll, TaskStatus } from "@/types";
import type { N8nRun } from "@/types/n8n";

const API_BASE = "/api";

export interface BusinessOption {
  name: string;
  color?: string;
}

export async function fetchTasks(): Promise<{ tasks: NotionTask[] }> {
  const res = await fetch(`${API_BASE}/tasks`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function fetchBusinesses(): Promise<{ businesses: BusinessOption[] }> {
  const res = await fetch(`${API_BASE}/businesses`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch businesses");
  return res.json();
}

export async function createTask(data: {
  name: string;
  dueDate?: string;
  status?: TaskStatus;
  business?: string;
}): Promise<NotionTask> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
  const result = await res.json();
  return result.task;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<void> {
  await updateTask(id, { status });
}

export interface TaskEdit {
  name?: string;
  description?: string;
  /** ISO date or empty string to clear */
  dueDate?: string;
  status?: TaskStatus;
  /** Empty string clears the category */
  business?: string;
}

export async function updateTask(id: string, fields: TaskEdit): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err.error || err.details || "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || "Failed to update task");
  }
}

export async function fetchScrolls(): Promise<{ scrolls: Scroll[] }> {
  const res = await fetch(`${API_BASE}/scrolls`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch scrolls");
  return res.json();
}

export async function postScroll(formData: FormData): Promise<Scroll> {
  const res = await fetch(`${API_BASE}/scrolls`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err.error || err.details || "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || "Failed to post scroll");
  }
  const data = await res.json();
  return data.scroll;
}

export async function fetchRecentRuns(): Promise<{
  runs: N8nRun[];
  configured: boolean;
  windowDays?: number;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/n8n/failed-runs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch n8n runs");
  return res.json();
}
