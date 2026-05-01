"use client";

import type { NotionTask } from "@/types";
import type { N8nRun } from "@/types/n8n";
import { formatDate, getStatusClass } from "@/lib/utils";

interface HomeOverviewTabProps {
  tasks: NotionTask[];
  failedRuns: N8nRun[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  isLoading: boolean;
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function HomeOverviewTab({
  tasks,
  failedRuns,
  selectedDate,
  onSelectedDateChange,
  isLoading,
}: HomeOverviewTabProps) {
  const dueTasks = tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      return isSameCalendarDay(new Date(task.dueDate), selectedDate);
    })
    .sort((a, b) => {
      const aTime = new Date(a.dueDate || "").getTime();
      const bTime = new Date(b.dueDate || "").getTime();
      return aTime - bTime;
    });

  return (
    <section className="flex-1 min-h-0 px-5 lg:px-8 pb-5 lg:pb-6">
      <div className="h-full min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="surface-panel min-h-[280px] flex flex-col overflow-hidden">
          <div
            className="flex items-center justify-between gap-3 px-6 py-5 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h2 className="section-title">Failed n8n Flows</h2>
            <span className="status-badge overdue">{String(failedRuns.length).padStart(2, "0")}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="h-14 rounded-lg"
                    style={{ background: "var(--color-surface-secondary)", animation: "pulse 1.5s ease-in-out infinite" }}
                  />
                ))}
              </div>
            ) : failedRuns.length === 0 ? (
              <p className="px-6 py-8 text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                No failed flows in the recent run window.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {failedRuns.map((run) => {
                  const item = (
                    <div className="px-6 py-4 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[14px] font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                          {run.workflowName}
                        </p>
                        <span className="status-badge overdue flex-shrink-0">Failed</span>
                      </div>
                      <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                        {run.error || "No error message returned by n8n."}
                      </p>
                    </div>
                  );

                  if (!run.url) {
                    return <li key={run.id}>{item}</li>;
                  }

                  return (
                    <li key={run.id}>
                      <a href={run.url} target="_blank" rel="noreferrer" className="block task-row">
                        {item}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>

        <article className="surface-panel min-h-[280px] flex flex-col overflow-hidden">
          <div
            className="flex items-center justify-between gap-3 px-6 py-5 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h2 className="section-title">Missions Due</h2>
            <input
              type="date"
              value={toInputDate(selectedDate)}
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                onSelectedDateChange(new Date(`${value}T12:00:00`));
              }}
              className="dark-input text-[11px] py-1.5 px-2 max-w-[160px]"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="h-14 rounded-lg"
                    style={{ background: "var(--color-surface-secondary)", animation: "pulse 1.5s ease-in-out infinite" }}
                  />
                ))}
              </div>
            ) : dueTasks.length === 0 ? (
              <p className="px-6 py-8 text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                No missions due on this date.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {dueTasks.map((task) => {
                  const badgeClass = getStatusClass(task.status, task.dueDate);
                  return (
                    <li key={task.id} className="px-6 py-4 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[14px] font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                          {task.name}
                        </p>
                        <span className={`status-badge ${badgeClass} flex-shrink-0`}>
                          {task.status === "in_progress"
                            ? "In Prog"
                            : task.status === "done"
                              ? "Done"
                              : badgeClass === "overdue"
                                ? "Overdue"
                                : "Todo"}
                        </span>
                      </div>
                      {task.dueDate && (
                        <p className="font-mono text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                          DUE {formatDate(task.dueDate)}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
