"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import type { NotionTask, TaskStatus } from "@/types";
import { getStatusClass, formatDate } from "@/lib/utils";
import { ChevronDown, Plus, X } from "lucide-react";
import { createTask, fetchBusinesses, updateTaskStatus } from "@/lib/api";
import { useLang } from "@/lib/i18n";

interface TaskListProps {
  tasks: NotionTask[];
  isLoading: boolean;
  filter: "all" | "today" | "upcoming" | "completed";
  onFilterChange: (f: "all" | "today" | "upcoming" | "completed") => void;
  onTasksChange?: () => void;
  selectedDate?: Date | null;
  onClearSelectedDate?: () => void;
  /** When true, hide New Quest, form, and disable status mutations.
   * Used on the Olympus tab — all task changes are made via the Scrolls tab. */
  readOnly?: boolean;
}


export default function TaskList({
  tasks,
  isLoading,
  filter,
  onFilterChange,
  onTasksChange,
  selectedDate,
  onClearSelectedDate,
  readOnly = false,
}: TaskListProps) {
  const { lang, t } = useLang();
  const FILTER_TABS = [
    { key: "all" as const, label: t("quests.filter.all") },
    { key: "today" as const, label: t("quests.filter.today") },
    { key: "upcoming" as const, label: t("quests.filter.upcoming") },
    { key: "completed" as const, label: t("quests.filter.completed") },
  ];
  const BADGE_LABELS: Record<string, string> = {
    todo: t("quests.badge.todo"),
    "in-progress": t("quests.badge.inProgress"),
    done: t("quests.badge.done"),
    overdue: t("quests.badge.overdue"),
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newStatus, setNewStatus] = useState<"todo" | "in_progress">("todo");
  const [newBusiness, setNewBusiness] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: businessData } = useSWR(
    readOnly ? null : "/api/businesses",
    fetchBusinesses,
    { revalidateOnFocus: false }
  );
  const businesses = businessData?.businesses ?? [];

  const handleToggleStatus = async (task: NotionTask) => {
    if (readOnly) return;
    const next: TaskStatus = task.status === "done" ? "todo" : "done";
    await updateTaskStatus(task.id, next);
    onTasksChange?.();
  };

  // Clicking the status badge cycles forward: todo → in_progress → done → todo.
  const handleCycleStatus = async (task: NotionTask) => {
    if (readOnly) return;
    const order: TaskStatus[] = ["todo", "in_progress", "done"];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    await updateTaskStatus(task.id, next);
    onTasksChange?.();
  };

  const cycleHint: Record<TaskStatus, string> = {
    todo: `→ ${t("quests.badge.inProgress")}`,
    in_progress: `→ ${t("quests.badge.done")}`,
    done: `→ ${t("quests.badge.todo")}`,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      await createTask({
        name: newName,
        dueDate: newDueDate || undefined,
        status: newStatus,
        business: newBusiness || undefined,
      });
      setNewName("");
      setNewDueDate("");
      setNewStatus("todo");
      setNewBusiness("");
      setShowForm(false);
      onTasksChange?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="surface-panel h-full min-h-[340px] flex flex-col overflow-hidden">
      <div
        className="px-6 py-4 border-b flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="section-title">{t("quests.heading")}</h2>

          {selectedDate && (
            <button
              onClick={onClearSelectedDate}
              className="ghost-btn"
              style={{ fontSize: "10px", padding: "5px 10px" }}
              aria-label="Clear date filter"
            >
              <X size={11} />
              {format(selectedDate, "MMM d")}
            </button>
          )}
        </div>

        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="ghost-btn gold"
            style={{ fontSize: "10px", padding: "7px 12px" }}
          >
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? t("quests.cancel") : t("quests.newQuest")}
          </button>
        )}
      </div>

      {!selectedDate && (
        <div
          className="px-6 py-3 border-b flex items-center gap-2 flex-wrap"
          style={{ borderColor: "var(--color-border)" }}
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`filter-tab ${filter === tab.key ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {!readOnly && showForm && (
        <form
          onSubmit={handleSubmit}
          className="animate-fade-in"
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("quests.questPrompt")}
            className="dark-input"
            autoFocus
            required
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="dark-input"
              style={{ colorScheme: "light", flex: 1 }}
              aria-label="Due date"
            />

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as "todo" | "in_progress")}
              className="ghost-select"
              style={{ flex: 1 }}
              aria-label="Status"
            >
              <option value="todo">{t("quests.statusTodo")}</option>
              <option value="in_progress">{t("quests.statusInProgress")}</option>
            </select>

            <select
              value={newBusiness}
              onChange={(e) => setNewBusiness(e.target.value)}
              className="ghost-select"
              style={{ flex: 1 }}
              aria-label="Business / category"
            >
              <option value="">{t("quests.category")}</option>
              {businesses.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={isSubmitting || !newName.trim()} className="ghost-btn gold">
            {isSubmitting ? t("quests.inscribing") : t("quests.inscribe")}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: "56px",
                  borderRadius: "10px",
                  background: "var(--color-surface-secondary)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="h-full grid place-items-center px-6 py-10 text-center">
            <p
              className="font-prose"
              style={{
                fontSize: "15px",
                color: "var(--color-text-tertiary)",
              }}
            >
              {t("quests.empty")}
            </p>
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {tasks.map((task) => {
              const isExpanded = expandedId === task.id;
              const badgeClass = getStatusClass(task.status, task.dueDate);

              return (
                <li key={task.id}>
                  <div
                    className="task-row"
                    style={{
                      padding: "14px 24px",
                      borderBottom: "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(task);
                      }}
                      disabled={readOnly}
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "1.5px solid",
                        borderColor:
                          task.status === "done" ? "var(--color-success)" : "var(--color-border-strong)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                        background: task.status === "done" ? "var(--color-success)" : "transparent",
                        cursor: readOnly ? "default" : "pointer",
                        opacity: readOnly ? 0.7 : 1,
                      }}
                      aria-label={
                        readOnly
                          ? `Status: ${task.status} (read-only — change in Scrolls)`
                          : task.status === "done"
                            ? "Mark as todo"
                            : "Mark as done"
                      }
                    >
                      {task.status === "done" && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-start justify-between gap-3">
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            lineHeight: 1.5,
                            color:
                              task.status === "done"
                                ? "var(--color-text-tertiary)"
                                : "var(--color-text-primary)",
                            textDecoration: task.status === "done" ? "line-through" : "none",
                            margin: 0,
                          }}
                        >
                          {task.name}
                        </p>
                        {readOnly ? (
                          <span
                            className={`status-badge ${badgeClass}`}
                            title="Status changes happen in the Scrolls tab"
                          >
                            {BADGE_LABELS[badgeClass] || badgeClass}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCycleStatus(task);
                            }}
                            className={`status-badge ${badgeClass} status-badge-button`}
                            title={`Click to advance ${cycleHint[task.status]}`}
                            aria-label={`Status: ${BADGE_LABELS[badgeClass] || badgeClass}. Click to advance ${cycleHint[task.status]}`}
                          >
                            {BADGE_LABELS[badgeClass] || badgeClass}
                          </button>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-2 flex-wrap mt-1"
                        style={{ rowGap: "4px" }}
                      >
                        {task.business && (
                          <span className="business-chip">{task.business}</span>
                        )}
                        {task.dueDate && (
                          <span
                            className="font-mono"
                            style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
                          >
                            {t("quests.due")} {formatDate(task.dueDate, lang)}
                          </span>
                        )}
                      </div>

                      {isExpanded && task.description && (
                        <p
                          className="font-prose mt-2"
                          style={{
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>

                    <span
                      style={{
                        color: "var(--color-text-tertiary)",
                        marginTop: "2px",
                        flexShrink: 0,
                        transition: "transform 0.2s ease",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      <ChevronDown size={14} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
