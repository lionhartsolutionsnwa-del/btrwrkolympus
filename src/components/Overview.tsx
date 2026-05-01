"use client";

import type { NotionTask } from "@/types";
import { computeStats } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface OverviewProps {
  tasks: NotionTask[];
  isLoading: boolean;
}

export default function Overview({ tasks, isLoading }: OverviewProps) {
  const { t } = useLang();
  const stats = computeStats(tasks);

  const statBlocks = [
    {
      label: t("stat.openQuests"),
      value: stats.active,
      color: "var(--color-text-primary)",
    },
    {
      label: t("stat.dueToday"),
      value: stats.dueToday,
      color: stats.dueToday > 0 ? "var(--color-warning)" : "var(--color-success)",
    },
    {
      label: t("stat.completed"),
      value: stats.completed,
      color: "var(--color-success)",
    },
    {
      label: t("stat.overdue"),
      value: stats.overdue,
      color: stats.overdue > 0 ? "var(--color-error)" : "var(--color-text-tertiary)",
    },
  ];

  return (
    <section
      className="px-5 lg:px-8 py-5 lg:py-6 border-b"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statBlocks.map((block) => (
          <div key={block.label} className="surface-panel p-5 lg:p-6">
            {isLoading ? (
              <div
                style={{
                  width: "64px",
                  height: "42px",
                  borderRadius: "8px",
                  background: "var(--color-surface-secondary)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ) : (
              <p className="stat-number" style={{ color: block.color }}>
                {String(block.value).padStart(2, "0")}
              </p>
            )}
            <p className="stat-label mt-2">{block.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
