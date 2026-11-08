"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error" | "warning" | "info";
type Toast = { id: number; tone: Tone; title: string; description?: string };

const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

const icons = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
const tones = { success: "text-success", error: "text-error", warning: "text-warning", info: "text-accent" };

/** iOS-style notification banners that drop in from the top centre. Tap to dismiss. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      setTimeout(() => dismiss(id), t.tone === "error" ? 7000 : 3500);
    },
    [dismiss],
  );
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <button
              key={t.id}
              onClick={() => dismiss(t.id)}
              aria-label={`${t.title}. Dismiss`}
              className="material animate-drop pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-left shadow-[var(--shadow-lift)] ring-[0.5px] ring-border"
            >
              <Icon className={cn("h-6 w-6 shrink-0", tones[t.tone])} />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold">{t.title}</span>
                {t.description && <span className="block text-[0.8125rem] text-muted">{t.description}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
