"use client";

import type { N8nRun } from "@/types/n8n";

interface N8nFailedRunsProps {
  runs: N8nRun[];
  isLoading: boolean;
  configured: boolean;
  error?: string;
  windowDays?: number;
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function N8nFailedRuns({ runs, isLoading, configured, error, windowDays = 2 }: N8nFailedRunsProps) {
  const successCount = runs.filter((run) => run.outcome === "success").length;
  const failedCount = runs.filter((run) => run.outcome === "failed").length;

  return (
    <section className="surface-panel h-full min-h-[340px] flex flex-col overflow-hidden">
      <div
        className="px-6 py-5 border-b flex items-center justify-between"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div>
          <h2 className="section-title">n8n Runs ({windowDays}d)</h2>
          <p className="font-mono text-[11px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            OK {String(successCount).padStart(2, "0")} | FAIL {String(failedCount).padStart(2, "0")}
          </p>
        </div>

        <span className="status-badge todo">{String(runs.length).padStart(2, "0")}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-14 rounded-lg"
                style={{ background: "var(--color-surface-secondary)", animation: "pulse 1.5s ease-in-out infinite" }}
              />
            ))}
          </div>
        ) : !configured ? (
          <p className="px-6 py-8 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            Set `N8N_API_BASE_URL` and `N8N_API_KEY` to display n8n execution runs.
          </p>
        ) : error ? (
          <p className="px-6 py-8 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            {error}
          </p>
        ) : runs.length === 0 ? (
          <p className="px-6 py-8 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            No runs found in the selected window.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {runs.map((run) => {
              const badgeText =
                run.outcome === "success" ? "Success" : run.outcome === "failed" ? "Failed" : run.status.toUpperCase();
              const badgeClass = run.outcome === "success" ? "done" : run.outcome === "failed" ? "overdue" : "todo";

              const row = (
                <div className="px-6 py-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[14px] font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {run.workflowName}
                    </p>
                    <span className={`status-badge ${badgeClass} flex-shrink-0`}>{badgeText}</span>
                  </div>

                  <p className="font-mono text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                    {formatTimestamp(run.stoppedAt || run.startedAt)}
                  </p>

                  {run.outcome === "failed" && (
                    <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                      {run.error || "No error message returned by n8n."}
                    </p>
                  )}
                </div>
              );

              if (!run.url) return <li key={run.id}>{row}</li>;

              return (
                <li key={run.id}>
                  <a href={run.url} target="_blank" rel="noreferrer" className="block task-row">
                    {row}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
