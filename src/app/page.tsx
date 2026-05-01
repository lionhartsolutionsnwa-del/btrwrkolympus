"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import Header from "@/components/Header";
import Overview from "@/components/Overview";
import TaskList from "@/components/TaskList";
import Calendar from "@/components/Calendar";
import Scrolls from "@/components/Scrolls";
import { fetchScrolls, fetchTasks } from "@/lib/api";
import type { TaskFilter } from "@/types";
import { filterTasks, getTasksByDate } from "@/lib/utils";
import Toast from "@/components/Toast";
import { useLang } from "@/lib/i18n";

type DashboardTab = "olympus" | "scrolls";

export default function Home() {
  const { t } = useLang();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("olympus");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const TABS: Array<{ key: DashboardTab; label: string; glyph: string }> = [
    { key: "olympus", label: t("tab.olympus"), glyph: "⚜" },
    { key: "scrolls", label: t("tab.scrolls"), glyph: "📜" },
  ];

  const { data, error, mutate: mutateTasks } = useSWR("/api/tasks", fetchTasks, {
    onError: () => setSyncStatus("error"),
    onSuccess: () => setSyncStatus("idle"),
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const { data: scrollData, mutate: mutateScrolls } = useSWR("/api/scrolls", fetchScrolls, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const tasks = data?.tasks ?? [];
  const scrolls = scrollData?.scrolls ?? [];

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleRefresh = useCallback(async () => {
    setSyncStatus("syncing");
    try {
      await Promise.all([mutateTasks(), mutateScrolls()]);
      setSyncStatus("idle");
      showToast(t("toast.synced"), "success");
    } catch {
      setSyncStatus("error");
      showToast(t("toast.syncFailed"), "error");
    }
  }, [mutateScrolls, mutateTasks, showToast, t]);

  const handleScrollPosted = useCallback(async () => {
    // A scroll may have updated a task — refresh both.
    await Promise.all([mutateTasks(), mutateScrolls()]);
    showToast(t("toast.scrollSealed"), "success");
  }, [mutateScrolls, mutateTasks, showToast, t]);

  const handleSelectDate = (date: Date) => {
    if (selectedDate && selectedDate.toDateString() === date.toDateString()) {
      setSelectedDate(null);
      setFilter("all");
    } else {
      setSelectedDate(date);
      const dayTasks = getTasksByDate(tasks, date);
      if (dayTasks.length === 0) {
        showToast(t("toast.noQuestsOnDay"), "info");
      } else {
        setFilter("all");
      }
    }
  };

  const displayedTasks = selectedDate
    ? tasks.filter((t) => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === selectedDate.toDateString();
      })
    : filterTasks(tasks, filter);

  const isLoading = !data && !error;
  const isLoadingScrolls = !scrollData;

  return (
    <div className="app-shell">
      <Header status={syncStatus} onRefresh={handleRefresh} />

      <nav className="app-tabs" aria-label="Dashboard">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
            aria-pressed={activeTab === t.key}
          >
            <span style={{ marginRight: "8px", color: "var(--color-gold)" }}>{t.glyph}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === "olympus" && (
        <>
          <Overview tasks={tasks} isLoading={isLoading} />
          <section className="dashboard-main px-5 lg:px-8 py-5 lg:py-6">
            <div className="h-full min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <TaskList
                tasks={displayedTasks}
                isLoading={isLoading}
                filter={filter}
                onFilterChange={setFilter}
                selectedDate={selectedDate}
                onClearSelectedDate={() => setSelectedDate(null)}
                readOnly
              />
              <Calendar tasks={tasks} selectedDate={selectedDate} onSelectDate={handleSelectDate} />
            </div>
          </section>
        </>
      )}

      {activeTab === "scrolls" && (
        <Scrolls
          tasks={tasks}
          scrolls={scrolls}
          isLoading={isLoading || isLoadingScrolls}
          onPosted={handleScrollPosted}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
