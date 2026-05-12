"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { format, parseISO } from "date-fns";
import { ChevronDown, Pencil, Plus, X } from "lucide-react";
import type { NotionTask, TaskStatus } from "@/types";
import { createTask, fetchBusinesses, updateTask } from "@/lib/api";
import { useLang } from "@/lib/i18n";

interface QuestsProps {
  tasks: NotionTask[];
  isLoading: boolean;
  onTasksChange: () => void;
}

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  todo: "todo",
  in_progress: "in-progress",
  done: "done",
};

function toInputDate(iso?: string | null): string {
  if (!iso) return "";
  // Notion gives us ISO with time (e.g. 2026-04-21T12:00:00). Take date part.
  return iso.slice(0, 10);
}

export default function Quests({ tasks, isLoading, onTasksChange }: QuestsProps) {
  const { t } = useLang();

  const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: t("quests.badge.todo"),
    in_progress: t("quests.badge.inProgress"),
    done: t("quests.badge.done"),
  };

  const { data: businessData } = useSWR("/api/businesses", fetchBusinesses, {
    revalidateOnFocus: false,
  });
  const businesses = businessData?.businesses ?? [];

  // ── New quest form ──────────────────────────────────────────────────────
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newStatus, setNewStatus] = useState<"todo" | "in_progress">("todo");
  const [newBusiness, setNewBusiness] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!newName.trim()) return setCreateError(t("err.messageRequired"));
    setCreating(true);
    try {
      await createTask({
        name: newName,
        description: newDescription || undefined,
        dueDate: newDue || undefined,
        status: newStatus,
        business: newBusiness || undefined,
      });
      setNewName("");
      setNewDescription("");
      setNewDue("");
      setNewStatus("todo");
      setNewBusiness("");
      setShowNew(false);
      onTasksChange();
    } catch (err: any) {
      setCreateError(err.message || t("err.postFailed"));
    } finally {
      setCreating(false);
    }
  };

  // Sort: open quests first by due date asc, then completed at the bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    const aDone = a.status === "done";
    const bDone = b.status === "done";
    if (aDone !== bDone) return aDone ? 1 : -1;
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDue - bDue;
  });

  return (
    <section className="flex-1 min-h-0 px-5 lg:px-8 py-5 lg:py-6 flex flex-col gap-4 overflow-hidden">
      {/* New quest panel */}
      <div className="surface-panel p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title">{t("scroll.createQuestHeading")}</h2>
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="ghost-btn gold"
            style={{ fontSize: "10px", padding: "7px 12px" }}
            aria-expanded={showNew}
          >
            {showNew ? <X size={11} /> : <Plus size={11} />}
            {showNew ? t("quests.cancel") : t("scroll.newQuestToggle")}
          </button>
        </div>

        {showNew && (
          <form onSubmit={handleCreate} className="animate-fade-in flex flex-col gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("quests.questPrompt")}
              className="dark-input"
              autoFocus
              required
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={t("quests.editor.descriptionPlaceholder")}
              rows={3}
              className="dark-input"
              style={{ resize: "vertical", minHeight: "70px" }}
              aria-label={t("quests.editor.description")}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="dark-input"
                style={{ colorScheme: "light", flex: 1 }}
              />
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as "todo" | "in_progress")}
                className="ghost-select"
                style={{ flex: 1 }}
              >
                <option value="todo">{t("quests.statusTodo")}</option>
                <option value="in_progress">{t("quests.statusInProgress")}</option>
              </select>
              <select
                value={newBusiness}
                onChange={(e) => setNewBusiness(e.target.value)}
                className="ghost-select"
                style={{ flex: 1 }}
              >
                <option value="">{t("quests.category")}</option>
                {businesses.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            {createError && (
              <p
                className="font-prose"
                style={{ color: "var(--color-error)", fontSize: "13px", margin: 0 }}
              >
                {createError}
              </p>
            )}
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="ghost-btn gold"
            >
              {creating ? t("scroll.creatingQuest") : t("scroll.createQuestSubmit")}
            </button>
          </form>
        )}
      </div>

      {/* Quest list */}
      <div className="surface-panel flex flex-col flex-1 min-h-0 overflow-hidden">
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2 className="section-title">{t("quests.editor.heading")}</h2>
          <span
            className="font-mono"
            style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
          >
            {tasks.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "60px",
                    borderRadius: "10px",
                    background: "var(--color-surface-secondary)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="h-full grid place-items-center px-6 py-10 text-center">
              <p
                className="font-prose"
                style={{ fontSize: "15px", color: "var(--color-text-tertiary)" }}
              >
                {t("quests.editor.empty")}
              </p>
            </div>
          ) : (
            <ul className="list-none m-0 p-0">
              {sortedTasks.map((task) => (
                <QuestRow
                  key={task.id}
                  task={task}
                  businesses={businesses}
                  statusLabels={STATUS_LABELS}
                  onSaved={onTasksChange}
                  t={t}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// QuestRow — one task with click-to-expand inline editor
// ──────────────────────────────────────────────────────────────────────────

interface QuestRowProps {
  task: NotionTask;
  businesses: { name: string; color?: string }[];
  statusLabels: Record<TaskStatus, string>;
  onSaved: () => void;
  t: (key: any) => string;
}

function QuestRow({ task, businesses, statusLabels, onSaved, t }: QuestRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || "");
  const [due, setDue] = useState(toInputDate(task.dueDate));
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [business, setBusiness] = useState(task.business || "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");

  // If the task object updates from upstream while we're not editing, sync.
  // Only sync when collapsed to avoid clobbering in-progress edits.
  useEffect(() => {
    if (expanded) return;
    setName(task.name);
    setDescription(task.description || "");
    setDue(toInputDate(task.dueDate));
    setStatus(task.status);
    setBusiness(task.business || "");
  }, [
    expanded,
    task.name,
    task.description,
    task.dueDate,
    task.status,
    task.business,
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateTask(task.id, {
        name: name.trim() || task.name,
        description,
        dueDate: due || "",
        status,
        business,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
      setExpanded(false);
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(task.name);
    setDescription(task.description || "");
    setDue(toInputDate(task.dueDate));
    setStatus(task.status);
    setBusiness(task.business || "");
    setError("");
    setExpanded(false);
  };

  const badgeClass = STATUS_BADGE_CLASS[task.status];

  return (
    <li style={{ borderBottom: "1px solid var(--color-border)" }}>
      {/* Collapsed row */}
      <div
        className="task-row"
        style={{
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className={`status-badge ${badgeClass}`}
          style={{ flexShrink: 0 }}
        >
          {statusLabels[task.status]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
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
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {task.business && <span className="business-chip">{task.business}</span>}
            {task.dueDate && (
              <span
                className="font-mono"
                style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
              >
                {format(parseISO(task.dueDate), "MMM d")}
              </span>
            )}
          </div>
        </div>
        {savedFlash && (
          <span
            className="font-display"
            style={{
              fontSize: "11px",
              color: "var(--color-success)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            ✓ {t("quests.editor.saved")}
          </span>
        )}
        <ChevronDown
          size={14}
          style={{
            color: "var(--color-text-tertiary)",
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <form
          onSubmit={handleSave}
          className="animate-fade-in"
          style={{
            padding: "16px 24px 22px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-surface-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div className="flex flex-col gap-1">
            <label className="eyebrow-label">{t("quests.editor.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="dark-input"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="eyebrow-label">{t("quests.editor.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("quests.editor.descriptionPlaceholder")}
              rows={3}
              className="dark-input"
              style={{ resize: "vertical", minHeight: "70px" }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-col gap-1" style={{ flex: 1 }}>
              <label className="eyebrow-label">{t("quests.editor.due")}</label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="dark-input"
                style={{ colorScheme: "light" }}
              />
            </div>
            <div className="flex flex-col gap-1" style={{ flex: 1 }}>
              <label className="eyebrow-label">{t("quests.editor.status")}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="ghost-select"
              >
                <option value="todo">{t("quests.badge.todo")}</option>
                <option value="in_progress">{t("quests.badge.inProgress")}</option>
                <option value="done">{t("quests.badge.done")}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1" style={{ flex: 1 }}>
              <label className="eyebrow-label">{t("quests.editor.category")}</label>
              <select
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="ghost-select"
              >
                <option value="">{t("quests.category")}</option>
                {businesses.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p
              className="font-prose"
              style={{ color: "var(--color-error)", fontSize: "13px", margin: 0 }}
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="ghost-btn"
              disabled={saving}
            >
              {t("quests.editor.cancel")}
            </button>
            <button type="submit" disabled={saving} className="ghost-btn gold">
              <Pencil size={11} />
              {saving ? t("quests.editor.saving") : t("quests.editor.save")}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
