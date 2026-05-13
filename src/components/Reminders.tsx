"use client";

import { useMemo, useState } from "react";
import { format, parseISO, formatDistanceToNow, isPast } from "date-fns";
import { Plus, Repeat, Trash2, X } from "lucide-react";
import type { Reminder, ReminderRecurrence } from "@/types";
import { createReminder, deleteReminder } from "@/lib/api";
import { useLang } from "@/lib/i18n";

interface RemindersProps {
  reminders: Reminder[];
  isLoading: boolean;
  onChange: () => void;
}

function todayDateInput(): string {
  // Returns YYYY-MM-DD for today in local time, suitable for <input type="date">
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nowTimeInput(): string {
  // Returns HH:MM for one minute from now in local time
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function combineLocalToISO(date: string, time: string): string | null {
  if (!date || !time) return null;
  // <input type="datetime-local"> would be cleaner but split fields are friendlier
  const local = new Date(`${date}T${time}`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export default function Reminders({ reminders, isLoading, onChange }: RemindersProps) {
  const { t } = useLang();

  // Composer state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayDateInput());
  const [time, setTime] = useState(nowTimeInput());
  const [texts, setTexts] = useState<string[]>([""]);
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>("none");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const handleAddText = () => setTexts([...texts, ""]);
  const handleRemoveText = (idx: number) =>
    setTexts(texts.length === 1 ? [""] : texts.filter((_, i) => i !== idx));
  const handleSetText = (idx: number, value: string) => {
    const next = [...texts];
    next[idx] = value;
    setTexts(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanTexts = texts.map((t) => t.trim()).filter(Boolean);
    if (cleanTexts.length === 0) return setError("At least one message is required.");
    const iso = combineLocalToISO(date, time);
    if (!iso) return setError("Pick a valid date and time.");

    setSubmitting(true);
    try {
      await createReminder({
        title: title.trim() || undefined,
        scheduledAt: iso,
        texts: cleanTexts,
        recurrence,
      });
      setTitle("");
      setDate(todayDateInput());
      setTime(nowTimeInput());
      setTexts([""]);
      setRecurrence("none");
      setFlash(t("rem.created"));
      setTimeout(() => setFlash(""), 2200);
      onChange();
    } catch (err: any) {
      setError(err.message || "Failed to create reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id);
      onChange();
    } catch {
      /* swallow — the list refetch will fix any drift */
    }
  };

  const { upcoming, past } = useMemo(() => {
    const up: Reminder[] = [];
    const pa: Reminder[] = [];
    for (const r of reminders) {
      // Recurring reminders always show as upcoming (their next occurrence)
      // even after firing, since they re-schedule themselves automatically.
      const isRecurring = r.recurrence && r.recurrence !== "none";
      if (!isRecurring && r.firedAt) pa.push(r);
      else up.push(r);
    }
    return { upcoming: up, past: pa };
  }, [reminders]);

  return (
    <section className="flex-1 min-h-0 px-5 lg:px-8 py-5 lg:py-6 flex flex-col gap-4 overflow-hidden">
      {/* === Composer === */}
      <form onSubmit={handleSubmit} className="surface-panel p-5 flex flex-col gap-3">
        <h2 className="section-title">{t("rem.composeHeading")}</h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("rem.titlePlaceholder")}
          className="dark-input"
          aria-label={t("rem.title")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="eyebrow-label">{t("rem.date")}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="dark-input"
              style={{ colorScheme: "light" }}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="eyebrow-label">{t("rem.time")}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="dark-input"
              style={{ colorScheme: "light" }}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="eyebrow-label">{t("rem.recurrence")}</label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as ReminderRecurrence)}
            className="ghost-select"
            aria-label={t("rem.recurrence")}
          >
            <option value="none">{t("rem.recurrence.none")}</option>
            <option value="daily">{t("rem.recurrence.daily")}</option>
            <option value="weekly">{t("rem.recurrence.weekly")}</option>
            <option value="monthly">{t("rem.recurrence.monthly")}</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="eyebrow-label">{t("rem.texts")}</label>
          {texts.map((txt, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <textarea
                value={txt}
                onChange={(e) => handleSetText(idx, e.target.value)}
                placeholder={t("rem.textPlaceholder")}
                rows={2}
                className="dark-input"
                style={{ resize: "vertical", flex: 1, minHeight: "60px" }}
              />
              {texts.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveText(idx)}
                  className="ghost-btn"
                  style={{ padding: "8px 10px" }}
                  aria-label={t("rem.removeText")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddText}
            className="ghost-btn"
            style={{ alignSelf: "flex-start", fontSize: "10px", padding: "6px 12px" }}
          >
            <Plus size={11} />
            {t("rem.addText")}
          </button>
        </div>

        {flash && (
          <p
            className="font-prose"
            style={{ color: "var(--color-success)", fontSize: "13px", margin: 0 }}
          >
            ✓ {flash}
          </p>
        )}
        {error && (
          <p
            className="font-prose"
            style={{ color: "var(--color-error)", fontSize: "13px", margin: 0 }}
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="ghost-btn gold">
          {submitting ? t("rem.submitting") : t("rem.submit")}
        </button>
      </form>

      {/* === Upcoming + Past lists === */}
      <div className="surface-panel flex flex-col flex-1 min-h-0 overflow-hidden">
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2 className="section-title">{t("rem.upcomingHeading")}</h2>
          <span
            className="font-mono"
            style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
          >
            {upcoming.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "70px",
                    borderRadius: "10px",
                    background: "var(--color-surface-secondary)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p
                className="font-prose"
                style={{ fontSize: "15px", color: "var(--color-text-tertiary)" }}
              >
                {t("rem.empty")}
              </p>
            </div>
          ) : (
            <ul className="list-none m-0 p-0">
              {upcoming.map((r) => (
                <ReminderRow key={r.id} reminder={r} onDelete={handleDelete} t={t} />
              ))}
            </ul>
          )}

          {past.length > 0 && (
            <>
              <div
                className="px-6 py-3 border-t border-b flex items-center justify-between"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)" }}
              >
                <h3 className="eyebrow-label">{t("rem.pastHeading")}</h3>
                <span
                  className="font-mono"
                  style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
                >
                  {past.length}
                </span>
              </div>
              <ul className="list-none m-0 p-0">
                {past.map((r) => (
                  <ReminderRow
                    key={r.id}
                    reminder={r}
                    onDelete={handleDelete}
                    t={t}
                    muted
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function ReminderRow({
  reminder,
  onDelete,
  t,
  muted = false,
}: {
  reminder: Reminder;
  onDelete: (id: string) => void;
  t: (key: any) => string;
  muted?: boolean;
}) {
  const scheduled = parseISO(reminder.scheduledAt);
  const isUpcoming = !reminder.firedAt;
  const overdue = isUpcoming && isPast(scheduled);

  const relative = isUpcoming
    ? overdue
      ? t("rem.now")
      : `${t("rem.in")} ${formatDistanceToNow(scheduled)}`
    : reminder.firedAt
      ? `${t("rem.fired")} · ${format(parseISO(reminder.firedAt), "MMM d, HH:mm")}`
      : "";

  return (
    <li
      className="px-6 py-4"
      style={{
        borderBottom: "1px solid var(--color-border)",
        opacity: muted ? 0.65 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-baseline gap-2 flex-wrap">
            {reminder.title && (
              <span
                className="font-display"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-gold)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {reminder.title}
              </span>
            )}
            <span
              className="font-mono"
              style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
            >
              {format(scheduled, "MMM d · HH:mm")}
            </span>
            {reminder.recurrence && reminder.recurrence !== "none" && (
              <span
                className="business-chip"
                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                title={t(`rem.recurrence.${reminder.recurrence}` as any)}
              >
                <Repeat size={9} />
                {t(`rem.recurrence.${reminder.recurrence}` as any)}
              </span>
            )}
            {relative && (
              <span
                className="font-prose"
                style={{
                  fontSize: "12px",
                  color: overdue ? "var(--color-error)" : "var(--color-text-secondary)",
                  fontStyle: "italic",
                }}
              >
                {relative}
              </span>
            )}
          </div>

          <ul className="mt-2 list-none m-0 p-0 flex flex-col gap-1">
            {reminder.texts.map((text, idx) => (
              <li
                key={idx}
                className="font-prose"
                style={{
                  fontSize: "14px",
                  lineHeight: 1.5,
                  color: "var(--color-text-primary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {reminder.texts.length > 1 ? `${idx + 1}. ${text}` : text}
              </li>
            ))}
          </ul>
        </div>

        {isUpcoming && (
          <button
            type="button"
            onClick={() => onDelete(reminder.id)}
            className="ghost-btn"
            style={{ padding: "6px 10px", fontSize: "10px" }}
            aria-label={t("rem.delete")}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </li>
  );
}
