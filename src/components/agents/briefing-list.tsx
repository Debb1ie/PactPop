"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BriefingItem } from "@/server/services/briefing";
import { sendAgentCommand } from "./agent-console";

const TONE = { action: "bg-accent", attention: "bg-warning", info: "bg-faint" };

/** Operations Agent briefing; "Run" hands the item to the agents in the console. */
export function BriefingList({ items }: { items: BriefingItem[] }) {
  if (items.length === 0) return <p className="px-4 py-4 text-[0.9375rem] text-muted">Nothing needs attention right now.</p>;
  return (
    <ul className="divide-y divide-border">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-3 px-4 py-3">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE[it.tone])} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] font-medium">{it.title}</p>
            <p className="truncate text-[0.8125rem] text-muted">
              {it.agent} · {it.detail}
            </p>
          </div>
          {it.command ? (
            <button
              onClick={() => sendAgentCommand(it.command!)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[4px] border border-border px-2.5 text-[0.8125rem] font-medium transition-colors hover:border-accent hover:text-accent"
            >
              <Play className="h-3 w-3" /> Run
            </button>
          ) : it.href ? (
            <Link href={it.href} className="inline-flex h-8 shrink-0 items-center rounded-[4px] border border-border px-2.5 text-[0.8125rem] font-medium hover:border-accent hover:text-accent">
              Review
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
