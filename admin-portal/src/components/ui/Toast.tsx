"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type ToastTone = "danger" | "warning" | "info";

type Toast = {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (title: string, message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { bg: string; icon: string }> = {
  danger: { bg: "bg-danger-soft border-danger-line text-danger", icon: "error" },
  warning: { bg: "bg-warning-soft border-warning text-warning", icon: "warning" },
  info: { bg: "bg-accent-soft border-accent text-accent-strong", icon: "info" },
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message: string, tone: ToastTone = "danger") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, title, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const style = toneStyles[t.tone];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3 shadow-lg backdrop-blur ${style.bg}`}
            >
              <Icon name={style.icon} size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="mt-0.5 text-xs opacity-90">{t.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
