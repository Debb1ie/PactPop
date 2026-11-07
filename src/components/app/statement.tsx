import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatementLine = {
  label: string;
  value: ReactNode;
  note: ReactNode;
  /** Optional state flag shown beside the label (encodes attention, not decoration). */
  flag?: { text: string; tone: "warning" | "success" | "neutral" };
};

const FLAG = {
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  neutral: "bg-fill text-muted",
};

/**
 * Account-statement summary: one panel, columns separated by rules, like the summary row of a
 * bank or PayPal statement. Replaces generic KPI tiles.
 */
export function Statement({ title, period, badge, lines }: { title: string; period: string; badge?: ReactNode; lines: StatementLine[] }) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface" aria-label={title}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-5 py-3">
        <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
        <span className="font-mono text-[0.7rem] text-muted">{period}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </header>
      <dl className="grid grid-cols-2 lg:grid-cols-4">
        {lines.map((l, i) => (
          <div
            key={l.label}
            className={cn(
              "flex min-w-0 flex-col px-5 py-5",
              i % 2 === 1 && "border-l border-border",
              i >= 2 && "border-t border-border lg:border-t-0",
              i === 2 && "lg:border-l",
            )}
          >
            <dt className="flex items-center gap-2 text-[0.8125rem] text-muted">
              {l.label}
              {l.flag && <span className={cn("rounded-md px-1.5 py-px text-[0.6875rem] font-semibold", FLAG[l.flag.tone])}>{l.flag.text}</span>}
            </dt>
            <dd className="money mt-2 text-[1.625rem] font-semibold leading-none tracking-[-0.03em] sm:text-[1.875rem]">{l.value}</dd>
            <dd className="mt-2 text-[0.8125rem] text-muted">{l.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
