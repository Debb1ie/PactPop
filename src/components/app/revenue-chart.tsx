"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatMoneyCompact } from "@/lib/money";

type Point = { month: string; label: string; receivedMinor: number };

/** Single-series monthly bar chart (no legend — the card title names the series). */
export function RevenueChart({ data, currency }: { data: Point[]; currency: string }) {
  return (
    <div>
      <div className="h-64 w-full" role="img" aria-label="Payments received per month, last six months">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}
              tickFormatter={(v: number) => formatMoneyCompact(v, currency)}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-[var(--shadow-lift)]">
                    <p className="text-xs text-muted">{p.month}</p>
                    <p className="money font-semibold">{formatMoney(p.receivedMinor, currency)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="receivedMinor" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-foreground">View as table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 font-medium">Month</th>
              <th className="py-1 text-right font-medium">Received</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t border-border">
                <td className="py-1.5">{d.month}</td>
                <td className="money py-1.5 text-right">{formatMoney(d.receivedMinor, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
