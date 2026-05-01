"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Paperclip, Link as LinkIcon, X } from "lucide-react";
import type { NotionTask, Scroll, TaskStatus } from "@/types";
import { postScroll } from "@/lib/api";
import { useLang } from "@/lib/i18n";

interface ScrollsProps {
  tasks: NotionTask[];
  scrolls: Scroll[];
  isLoading: boolean;
  onPosted: () => void;
}

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  todo: "todo",
  in_progress: "in-progress",
  done: "done",
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function Scrolls({
  tasks,
  scrolls,
  isLoading,
  onPosted,
}: ScrollsProps) {
  const { t } = useLang();
  const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: t("quests.badge.todo"),
    in_progress: t("quests.badge.inProgress"),
    done: t("quests.badge.done"),
  };

  // ── Composer state ──────────────────────────────────────────────────────
  const [author, setAuthor] = useState<string>("");
  const [message, setMessage] = useState("");
  const [taskId, setTaskId] = useState<string>("");
  const [newStatus, setNewStatus] = useState<TaskStatus | "">("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Feed filter ─────────────────────────────────────────────────────────
  const [showOlder, setShowOlder] = useState(false);

  // Persist author across sessions
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? window.localStorage.getItem("olympus.author") : null;
    if (saved) setAuthor(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && author) {
      window.localStorage.setItem("olympus.author", author);
    }
  }, [author]);

  const taskLookup = useMemo(() => {
    const map = new Map<string, NotionTask>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  // Split scrolls into recent (≤7 days) and older
  const { recentScrolls, olderScrolls } = useMemo(() => {
    const cutoff = Date.now() - ONE_WEEK_MS;
    const recent: Scroll[] = [];
    const older: Scroll[] = [];
    for (const s of scrolls) {
      const ts = new Date(s.createdAt).getTime();
      if (ts >= cutoff) recent.push(s);
      else older.push(s);
    }
    return { recentScrolls: recent, olderScrolls: older };
  }, [scrolls]);

  // ── Composer handlers ───────────────────────────────────────────────────
  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setPostError(t("err.linkProtocol"));
      return;
    }
    setPostError("");
    setLinks([...links, trimmed]);
    setLinkInput("");
  };

  const handleRemoveLink = (idx: number) => setLinks(links.filter((_, i) => i !== idx));
  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles([...files, ...Array.from(incoming)]);
  };
  const handleRemoveFile = (idx: number) => setFiles(files.filter((_, i) => i !== idx));

  const handleSubmitScroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError("");
    if (!author.trim()) return setPostError(t("err.authorRequired"));
    if (!message.trim()) return setPostError(t("err.messageRequired"));

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("author", author.trim());
      fd.append("message", message.trim());
      if (taskId) {
        fd.append("taskId", taskId);
        const task = taskLookup.get(taskId);
        if (task) fd.append("taskName", task.name);
      }
      if (newStatus) fd.append("newStatus", newStatus);
      links.forEach((l) => fd.append("links", l));
      files.forEach((f) => fd.append("files", f));
      await postScroll(fd);

      setMessage("");
      setTaskId("");
      setNewStatus("");
      setLinks([]);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onPosted();
    } catch (err: any) {
      setPostError(err.message || t("err.postFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // Reset status if user clears the task selection
  useEffect(() => {
    if (!taskId) setNewStatus("");
  }, [taskId]);

  return (
    <section className="flex-1 min-h-0 px-5 lg:px-8 py-5 lg:py-6">
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4 h-full min-h-0">
        {/* ===== LEFT COLUMN: composer ===== */}
        <form onSubmit={handleSubmitScroll} className="surface-panel p-5 flex flex-col gap-3 self-start">
            <h2 className="section-title">{t("scroll.compose")}</h2>

            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("scroll.author")}
              className="dark-input"
              aria-label="Author"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("scroll.message")}
              rows={4}
              className="dark-input"
              style={{ resize: "vertical", minHeight: "90px" }}
              aria-label="Message"
            />

            <div className="flex flex-col gap-2">
              <label className="eyebrow-label">{t("scroll.questOptional")}</label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="ghost-select"
                aria-label="Task"
              >
                <option value="">{t("scroll.noQuest")}</option>
                {tasks
                  .filter((task) => task.status !== "done")
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                      {task.business ? ` · ${task.business}` : ""}
                    </option>
                  ))}
              </select>
            </div>

            {taskId && (
              <div className="flex flex-col gap-2">
                <label className="eyebrow-label">{t("scroll.markProgress")}</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TaskStatus | "")}
                  className="ghost-select"
                  aria-label="New status"
                >
                  <option value="">{t("scroll.noChange")}</option>
                  <option value="in_progress">{t("quests.badge.inProgress")}</option>
                  <option value="done">{t("quests.statusDone")}</option>
                </select>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-col gap-2">
              <label className="eyebrow-label">{t("scroll.links")}</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder={t("scroll.linkPlaceholder")}
                  className="dark-input"
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                />
                <button type="button" onClick={handleAddLink} className="ghost-btn">
                  <LinkIcon size={12} />
                  {t("scroll.add")}
                </button>
              </div>
              {links.length > 0 && (
                <ul className="flex flex-col gap-1 list-none m-0 p-0">
                  {links.map((l, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-[12px]">
                      <LinkIcon size={11} style={{ color: "var(--color-gold)" }} />
                      <span
                        style={{
                          color: "var(--color-text-secondary)",
                          flex: 1,
                          wordBreak: "break-all",
                        }}
                      >
                        {l}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        aria-label="Remove link"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--color-text-tertiary)",
                          cursor: "pointer",
                        }}
                      >
                        <X size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Files */}
            <div className="flex flex-col gap-2">
              <label className="eyebrow-label">{t("scroll.files")}</label>
              <label
                className="ghost-btn"
                style={{ alignSelf: "flex-start", cursor: "pointer", padding: "7px 12px" }}
              >
                <Paperclip size={12} />
                <span>{t("scroll.attachFile")}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
              {files.length > 0 && (
                <ul className="flex flex-col gap-1 list-none m-0 p-0">
                  {files.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-[12px]">
                      <Paperclip size={11} style={{ color: "var(--color-gold)" }} />
                      <span
                        style={{
                          color: "var(--color-text-secondary)",
                          flex: 1,
                          wordBreak: "break-all",
                        }}
                      >
                        {f.name}{" "}
                        <span style={{ color: "var(--color-text-tertiary)" }}>
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        aria-label="Remove file"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--color-text-tertiary)",
                          cursor: "pointer",
                        }}
                      >
                        <X size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {postError && (
              <p
                className="font-prose"
                style={{ color: "var(--color-error)", fontSize: "13px", margin: 0 }}
              >
                {postError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !author.trim() || !message.trim()}
              className="ghost-btn gold"
              style={{ marginTop: "4px" }}
            >
              {submitting ? t("scroll.sealing") : t("scroll.seal")}
            </button>
        </form>

        {/* ===== RIGHT COLUMN: feed ===== */}
        <div className="surface-panel flex flex-col overflow-hidden min-h-[340px]">
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h2 className="section-title">{t("scroll.feedHeading")}</h2>
            <span
              className="font-mono"
              style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
            >
              {recentScrolls.length} {t("scroll.feedCount")}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: "100px",
                      borderRadius: "10px",
                      background: "var(--color-surface-secondary)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : recentScrolls.length === 0 && (!showOlder || olderScrolls.length === 0) ? (
              <div className="h-full grid place-items-center px-6 py-10 text-center">
                <p
                  className="font-prose"
                  style={{ fontSize: "15px", color: "var(--color-text-tertiary)" }}
                >
                  {t("scroll.feedEmpty")}
                </p>
              </div>
            ) : (
              <ul className="list-none m-0 p-0">
                {recentScrolls.map((scroll) => (
                  <ScrollRow key={scroll.id} scroll={scroll} statusLabels={STATUS_LABELS} t={t} />
                ))}

                {/* Older scrolls (collapsed by default) */}
                {showOlder &&
                  olderScrolls.map((scroll) => (
                    <ScrollRow
                      key={scroll.id}
                      scroll={scroll}
                      statusLabels={STATUS_LABELS}
                      t={t}
                      muted
                    />
                  ))}
              </ul>
            )}
          </div>

          {/* Toggle for older scrolls */}
          {olderScrolls.length > 0 && (
            <div
              className="px-6 py-3 border-t flex items-center justify-center"
              style={{ borderColor: "var(--color-border)" }}
            >
              <button
                type="button"
                onClick={() => setShowOlder(!showOlder)}
                className="ghost-btn"
                style={{ fontSize: "10px", padding: "7px 14px" }}
              >
                {showOlder
                  ? t("scroll.hideOlder")
                  : `${t("scroll.showOlder")} · ${olderScrolls.length} ${t("scroll.olderCount")}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Scroll row — shared between recent and older lists
// ──────────────────────────────────────────────────────────────────────────

function ScrollRow({
  scroll,
  statusLabels,
  t,
  muted = false,
}: {
  scroll: Scroll;
  statusLabels: Record<TaskStatus, string>;
  t: (key: any) => string;
  muted?: boolean;
}) {
  return (
    <li
      className="px-6 py-5"
      style={{
        borderBottom: "1px solid var(--color-border)",
        opacity: muted ? 0.65 : 1,
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
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
            {scroll.author}
          </span>
          {scroll.newStatus && (
            <span className={`status-badge ${STATUS_BADGE_CLASS[scroll.newStatus]}`}>
              → {statusLabels[scroll.newStatus]}
            </span>
          )}
        </div>
        <span
          className="font-mono"
          style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
        >
          {format(new Date(scroll.createdAt), "MMM d · HH:mm")}
        </span>
      </div>

      <p
        className="font-prose mt-2"
        style={{
          fontSize: "15px",
          lineHeight: 1.6,
          color: "var(--color-text-primary)",
          whiteSpace: "pre-wrap",
          margin: "8px 0 0",
        }}
      >
        {scroll.message}
      </p>

      {scroll.taskName && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="business-chip">{t("scroll.questChip")}</span>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            {scroll.taskName}
          </span>
        </div>
      )}

      {scroll.links && scroll.links.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 list-none m-0 p-0">
          {scroll.links.map((l, idx) => (
            <li key={idx} className="flex items-center gap-2 text-[13px]">
              <LinkIcon size={11} style={{ color: "var(--color-gold)" }} />
              <a
                href={l}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-info)", wordBreak: "break-all" }}
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
      )}

      {scroll.files && scroll.files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 list-none m-0 p-0">
          {scroll.files.map((f, idx) => (
            <li key={idx} className="flex items-center gap-2 text-[13px]">
              <Paperclip size={11} style={{ color: "var(--color-gold)" }} />
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-info)" }}
              >
                {f.name}
              </a>
              <span
                className="font-mono"
                style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}
              >
                {(f.size / 1024).toFixed(1)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
