"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatMoneyCompact } from "@/lib/money";

type Point = { month: string; label: string; scheduledMinor: number; receivedMinor: number; current: boolean };

/**
 * Cash flow: scheduled (milestones due) vs received (PayPal-confirmed) per month.
 * Two series, validated palette (violet / teal), legend always shown, table view available.
 */
export function CashflowChart({ data, currency }: { data: Point[]; currency: string }) {
  const totalScheduled = data.reduce((s, d) => s + d.scheduledMinor, 0);
  const totalReceived = data.reduce((s, d) => s + d.receivedMinor, 0);
  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.7rem]">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[1px] bg-accent" aria-hidden />
          <span className="uppercase tracking-[0.06em] text-muted">Scheduled</span>
          <span>{formatMoney(totalScheduled, currency)}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[1px] bg-money-in" aria-hidden />
          <span className="uppercase tracking-[0.06em] text-muted">Received</span>
          <span>{formatMoney(totalReceived, currency)}</span>
        </span>
      </div>
      <div className="mt-3 h-56 w-full" role="img" aria-label="Scheduled versus received payments per month">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }} barCategoryGap="28%" barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--border-strong)" }}
              tick={({ x, y, payload, index }) => (
                <text x={x} y={Number(y) + 12} textAnchor="middle" fontSize={10.5} fontFamily="var(--font-mono)" fill={data[index]?.current ? "var(--foreground)" : "var(--muted)"} fontWeight={data[index]?.current ? 700 : 400}>
                  {payload.value}
                </text>
              )}
            />
            <YAxis tickLine={false} axisLine={false} width={48} allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 10.5, fontFamily: "var(--font-mono)" }} tickFormatter={(v: number) => formatMoneyCompact(v, currency)} />
            <Tooltip
              cursor={{ fill: "var(--fill)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="rounded-[4px] border border-border bg-surface px-3 py-2 font-mono text-[0.75rem] shadow-[var(--shadow-lift)]">
                    <p className="text-muted">{p.month}</p>
                    <p>
                      <span className="text-muted">Scheduled </span>
                      {formatMoney(p.scheduledMinor, currency)}
                    </p>
                    <p>
                      <span className="text-muted">Received </span>
                      <span className="text-money-in">{formatMoney(p.receivedMinor, currency)}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="scheduledMinor" fill="var(--accent)" radius={[2, 2, 0, 0]} maxBarSize={22} />
            <Bar dataKey="receivedMinor" fill="var(--money-in)" radius={[2, 2, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 font-mono text-[0.75rem]">
        <summary className="cursor-pointer uppercase tracking-[0.06em] text-muted hover:text-foreground">View as table</summary>
        <table className="mt-2 w-full">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1 font-normal">Month</th>
              <th className="py-1 text-right font-normal">Scheduled</th>
              <th className="py-1 text-right font-normal">Received</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t border-border">
                <td className="py-1.5">{d.month}</td>
                <td className="py-1.5 text-right">{formatMoney(d.scheduledMinor, currency)}</td>
                <td className="py-1.5 text-right">{formatMoney(d.receivedMinor, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
