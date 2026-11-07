"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Spinner } from "./button";
import { cn } from "@/lib/cn";

/** iOS UIAlertController-style confirmation, on the native <dialog> (focus trap + Esc). */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  tone = "primary",
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  tone?: "primary" | "danger" | "success";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="material m-auto w-[min(86vw,17.5rem)] overflow-hidden rounded-[0.9rem] p-0 text-center text-foreground shadow-[var(--shadow-lift)]"
    >
      <div className="px-4 pb-4 pt-5">
        <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
        {children && <div className="mt-1 text-[0.8125rem] leading-snug text-foreground/80">{children}</div>}
      </div>
      <div className="hairline-t grid grid-cols-2">
        <button onClick={onCancel} disabled={loading} className="h-11 text-[1.0625rem] text-accent hover:bg-fill disabled:opacity-40">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          autoFocus
          className={cn(
            "flex h-11 items-center justify-center gap-2 border-l-[0.5px] border-border-strong text-[1.0625rem] font-semibold hover:bg-fill disabled:opacity-60",
            tone === "danger" ? "text-error" : tone === "success" ? "text-success" : "text-accent",
          )}
        >
          {loading && <Spinner />}
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
