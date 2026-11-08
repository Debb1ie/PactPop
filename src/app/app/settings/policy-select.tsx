"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { updatePolicyAction } from "./actions";

const OPTIONS = [
  { v: "allow", label: "Allow" },
  { v: "approval", label: "Ask me" },
  { v: "deny", label: "Block" },
] as const;

/** Segmented control for one TrustGate policy. Locked tools show their floor and can't be relaxed. */
export function PolicySelect({ tool, label, value, locked }: { tool: string; label: string; value: string; locked: boolean }) {
  const [current, setCurrent] = useState(value);
  const [pending, start] = useTransition();
  const toast = useToast();
  const set = (v: string) => {
    if (v === current) return;
    const prev = current;
    setCurrent(v);
    start(async () => {
      const r = await updatePolicyAction(tool, v);
      toast({ tone: r.ok ? "success" : "error", title: r.message });
      if (!r.ok) setCurrent(prev);
    });
  };
  return (
    <div role="radiogroup" aria-label={`Policy for ${label}`} className={cn("inline-flex rounded-full bg-surface-2 p-0.5", pending && "opacity-70")}>
      {OPTIONS.map((o) => {
        const disabled = locked && o.v === "allow";
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={current === o.v}
            disabled={disabled || pending}
            onClick={() => set(o.v)}
            title={disabled ? "Locked: this action always needs your approval" : undefined}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-3 text-[0.75rem] font-medium transition-colors",
              current === o.v ? (o.v === "deny" ? "bg-error text-white" : o.v === "approval" ? "bg-warning text-[#2a1a00]" : "bg-foreground text-background") : "text-muted hover:text-foreground",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {disabled && <Lock className="h-3 w-3" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
