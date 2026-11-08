"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { resetDemoAction } from "./actions";

/** Demo workspace only: rebuild the sample data so a walkthrough starts fresh. */
export function ResetDemoButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Reset the demo workspace? All demo data is rebuilt from scratch and you will be signed out.")) return;
        start(async () => {
          await resetDemoAction();
        });
      }}
      className="pure inline-flex h-9 items-center gap-2 rounded-full px-4 text-[0.8125rem] font-medium text-foreground transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      <RotateCcw className="h-4 w-4 text-muted" /> {pending ? "Resetting…" : "Reset demo data"}
    </button>
  );
}
