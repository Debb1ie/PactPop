"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatMoney, formatMoneyCompact } from "@/lib/money";

/* Shared bits ─────────────────────────────────────────────── */

function Tip({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "end" }) {
  return (
    <div className={cn("pointer-events-none absolute bottom-[calc(100%+8px)] z-20 w-max max-w-[14rem] rounded-lg", align === "end" ? "right-0" : "left-1/2 -translate-x-1/2", " bg-white px-3 py-2 text-left text-[0.75rem] leading-snug text-[#1c1d23] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5)]")}>
      {children}
    </div>
  );
}

function TableToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="mt-3 text-[0.75rem] text-muted hover:text-foreground">
      {open ? "Hide table" : "View as table"}
    </button>
  );
}

/* 1. Agreed value by client: horizontal bars, single hue ───────────── */

export type ClientValue = { client: string; valueMinor: number; agreements: number };

export function ClientValueChart({ data, currency }: { data: ClientValue[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.valueMinor));
  if (!data.length) return <p className="py-8 text-center text-[0.8125rem] text-muted">No agreements yet.</p>;
  return (
    <div>
      <ul className="space-y-3.5" role="img" aria-label={`Agreed value by client: ${data.map((d) => `${d.client} ${formatMoney(d.valueMinor, currency)}`).join(", ")}`}>
        {data.map((d, i) => (
          <li key={d.client} className="relative" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
              <span className="truncate font-medium">{d.client}</span>
              <span className="money shrink-0 text-muted">{formatMoney(d.valueMinor, currency)}</span>
            </div>
            {/* hit target taller than the mark */}
            <div className="relative mt-1.5 flex h-4 items-center">
              <span
                className={cn("h-2 rounded-full transition-opacity", hover !== null && hover !== i && "opacity-40")}
                style={{ width: `${Math.max(2, (d.valueMinor / max) * 100)}%`, background: "var(--viz-1)" }}
              />
              {hover === i && (
                <Tip>
                  <p className="font-semibold">{d.client}</p>
                  <p className="money">{formatMoney(d.valueMinor, currency)}</p>
                  <p className="text-[#62626e]">
                    {d.agreements} agreement{d.agreements === 1 ? "" : "s"}
                  </p>
                </Tip>
              )}
            </div>
          </li>
        ))}
      </ul>
      <TableToggle open={table} onToggle={() => setTable((t) => !t)} />
      {table && (
        <table className="mt-2 w-full text-[0.75rem]">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-normal">Client</th>
              <th className="py-1 font-normal">Agreements</th>
              <th className="py-1 text-right font-normal">Agreed value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.client} className="border-t border-border">
                <td className="py-1">{d.client}</td>
                <td className="py-1">{d.agreements}</td>
                <td className="money py-1 text-right">{formatMoney(d.valueMinor, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* 2. Money by stage: columns, single hue ─────────────────────────── */

export type StageValue = { stage: string; valueMinor: number; count: number };

export function StageChart({ data, currency }: { data: StageValue[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.valueMinor));
  return (
    <div>
      <div className="relative grid h-48 grid-cols-5 items-end gap-3 border-b border-border-strong" role="img" aria-label={`Money by stage: ${data.map((d) => `${d.stage} ${formatMoney(d.valueMinor, currency)}`).join(", ")}`}>
        {data.map((d, i) => (
          <div key={d.stage} className="relative flex h-full flex-col items-center justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {d.valueMinor > 0 && <span className="money mb-1 text-[0.7rem] text-muted">{formatMoneyCompact(d.valueMinor, currency)}</span>}
            <span
              className={cn("w-full max-w-[2.75rem] rounded-t-[4px] transition-opacity", hover !== null && hover !== i && "opacity-40")}
              style={{ height: `${d.valueMinor ? Math.max(3, (d.valueMinor / max) * 80) : 0}%`, background: "var(--viz-1)" }}
            />
            {hover === i && (
              <Tip align={i === data.length - 1 ? "end" : "center"}>
                <p className="font-semibold">{d.stage}</p>
                <p className="money">{formatMoney(d.valueMinor, currency)}</p>
                <p className="text-[#62626e]">
                  {d.count} agreement{d.count === 1 ? "" : "s"}
                </p>
              </Tip>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-3 text-center text-[0.7rem] text-muted">
        {data.map((d) => (
          <span key={d.stage} className="truncate">
            {d.stage}
          </span>
        ))}
      </div>
      <TableToggle open={table} onToggle={() => setTable((t) => !t)} />
      {table && (
        <table className="mt-2 w-full text-[0.75rem]">
          <tbody>
            {data.map((d) => (
              <tr key={d.stage} className="border-t border-border">
                <td className="py-1">{d.stage}</td>
                <td className="py-1">{d.count}</td>
                <td className="money py-1 text-right">{formatMoney(d.valueMinor, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* 3. Who did the work: weekly stacked columns, agents vs people ───────── */

export type WeekActivity = { label: string; range: string; agents: number; people: number };

export function ActivityChart({ data }: { data: WeekActivity[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.agents + d.people));
  const totals = data.reduce((s, d) => ({ agents: s.agents + d.agents, people: s.people + d.people }), { agents: 0, people: 0 });
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[0.75rem] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--viz-1)" }} aria-hidden /> Agents <span className="font-semibold text-foreground">{totals.agents}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--viz-2)" }} aria-hidden /> People <span className="font-semibold text-foreground">{totals.people}</span>
        </span>
      </div>
      <div
        className="grid h-44 items-end gap-2 border-b border-border-strong"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Actions per week, agents versus people: ${data.map((d) => `${d.label} ${d.agents} agent, ${d.people} people`).join("; ")}`}
      >
        {data.map((d, i) => {
          const total = d.agents + d.people;
          return (
            <div key={d.range} className="relative flex h-full flex-col items-center justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className={cn("flex w-full max-w-[1.75rem] flex-col gap-[2px] transition-opacity", hover !== null && hover !== i && "opacity-40")} style={{ height: `${(total / max) * 90}%` }}>
                {d.people > 0 && <span className="w-full rounded-t-[4px]" style={{ flexGrow: d.people, background: "var(--viz-2)" }} />}
                {d.agents > 0 && <span className={cn("w-full", d.people === 0 && "rounded-t-[4px]")} style={{ flexGrow: d.agents, background: "var(--viz-1)" }} />}
              </div>
              {hover === i && (
                <Tip align={i >= data.length - 2 ? "end" : "center"}>
                  <p className="font-semibold">{d.range}</p>
                  <p>Agents {d.agents}</p>
                  <p>People {d.people}</p>
                </Tip>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid gap-2 text-center text-[0.65rem] text-muted" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((d) => (
          <span key={d.range} className="truncate">
            {d.label}
          </span>
        ))}
      </div>
      <TableToggle open={table} onToggle={() => setTable((t) => !t)} />
      {table && (
        <table className="mt-2 w-full text-[0.75rem]">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-normal">Week</th>
              <th className="py-1 text-right font-normal">Agents</th>
              <th className="py-1 text-right font-normal">People</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.range} className="border-t border-border">
                <td className="py-1">{d.range}</td>
                <td className="py-1 text-right">{d.agents}</td>
                <td className="py-1 text-right">{d.people}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
