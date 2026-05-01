"use client";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

const borderColors = {
  success: "var(--color-success)",
  error: "var(--color-error)",
  info: "var(--color-info)",
};

export default function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          borderLeft: `3px solid ${borderColors[type]}`,
          boxShadow: "var(--shadow-toast)",
        }}
      >
        <span className="text-[11px] tracking-[0.08em] uppercase font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {message}
        </span>

        <button
          onClick={onClose}
          className="text-lg leading-none"
          style={{ color: "var(--color-text-tertiary)", background: "transparent", border: "none", cursor: "pointer" }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
