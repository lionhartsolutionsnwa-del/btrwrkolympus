"use client";

import { Languages, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/i18n";

interface HeaderProps {
  status: "idle" | "syncing" | "error";
  onRefresh: () => void;
}

export default function Header({ status, onRefresh }: HeaderProps) {
  const { lang, setLang, t } = useLang();

  const statusLabel = {
    idle: t("status.idle"),
    syncing: t("status.syncing"),
    error: t("status.error"),
  }[status];

  const statusColor = {
    idle: "var(--color-success)",
    syncing: "var(--color-warning)",
    error: "var(--color-error)",
  }[status];

  return (
    <header className="app-header flex items-center justify-between gap-4">
      <div className="flex items-center gap-8 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* laurel wreath glyph */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M13 5L13 21" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M9 7C7 9 6 12 7 15C8 17 10 18 11 18"
              stroke="var(--color-gold)"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="7" cy="11" r="0.8" fill="var(--color-gold)" />
            <circle cx="8" cy="14" r="0.8" fill="var(--color-gold)" />
            <circle cx="10" cy="16" r="0.8" fill="var(--color-gold)" />
            <path
              d="M17 7C19 9 20 12 19 15C18 17 16 18 15 18"
              stroke="var(--color-gold)"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="19" cy="11" r="0.8" fill="var(--color-gold)" />
            <circle cx="18" cy="14" r="0.8" fill="var(--color-gold)" />
            <circle cx="16" cy="16" r="0.8" fill="var(--color-gold)" />
            <path
              d="M13 4L13.6 5.3L15 5.5L14 6.4L14.2 7.8L13 7.1L11.8 7.8L12 6.4L11 5.5L12.4 5.3Z"
              fill="var(--color-gold)"
            />
          </svg>
          <h1
            className="font-brand truncate"
            style={{
              fontSize: "22px",
              lineHeight: 1.2,
              color: "var(--color-text-primary)",
            }}
          >
            {t("brand.title")}
          </h1>
          <span
            className="font-prose hidden md:inline"
            style={{
              fontSize: "14px",
              color: "var(--color-text-tertiary)",
              marginLeft: "4px",
            }}
          >
            {t("brand.tagline")}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span
            className={`status-dot ${
              status === "error" ? "error" : status === "syncing" ? "syncing" : "nominal"
            }`}
          />
          <span
            className="font-display"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: statusColor,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className="ghost-btn"
          aria-label={lang === "en" ? "Switch to Chinese" : "切换到英文"}
          title={lang === "en" ? "切换到中文" : "Switch to English"}
        >
          <Languages size={13} />
          {t("lang.toggle")}
        </button>

        <button
          onClick={onRefresh}
          disabled={status === "syncing"}
          className={`ghost-btn gold ${status === "syncing" ? "syncing" : ""}`}
        >
          <RefreshCw size={13} className={status === "syncing" ? "animate-spin" : ""} />
          {status === "syncing" ? t("btn.summoning") : t("btn.summon")}
        </button>
      </div>
    </header>
  );
}
