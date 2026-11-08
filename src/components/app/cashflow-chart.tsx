"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatMoneyCompact } from "@/lib/money";

type Point = { month: string; label: string; scheduledMinor: number; receivedMinor: number; current: boolean };

/**
 * Money expected per month (milestones due) as gradient bars on full-height tracks.
 * The tooltip also shows what PayPal has confirmed as received that month. Table view available.
 */
export function CashflowChart({ data, currency }: { data: Point[]; currency: string }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.scheduledMinor, d.receivedMinor)));
  const rows = data.map((d) => ({ ...d, track: max }));
  return (
    <div>
      <div className="h-64 w-full" role="img" aria-label="Money expected per month from milestones">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 28, right: 4, left: 0, bottom: 0 }} barCategoryGap="38%" barGap={-20}>
            <defs>
              <linearGradient id="pp-flow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8d6cff" />
                <stop offset="0.6" stopColor="#b9a5ff" />
                <stop offset="1" stopColor="#f6c89f" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border-strong)" strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v: number) => formatMoneyCompact(v, currency)} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="rounded-lg bg-white px-3 py-2 text-[0.8125rem] text-[#1c1d23] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5)]">
                    <p className="font-semibold">{p.month}</p>
                    <p className="money">Expected {formatMoney(p.scheduledMinor, currency)}</p>
                    <p className="money text-[#0f9182]">Received {formatMoney(p.receivedMinor, currency)}</p>
                  </div>
                );
              }}
            />
            {/* full-height track behind each bar */}
            <Bar dataKey="track" fill="var(--surface-2)" radius={[8, 8, 8, 8]} barSize={20} isAnimationActive={false} />
            <Bar dataKey="scheduledMinor" fill="url(#pp-flow)" radius={[8, 8, 8, 8]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-[0.8125rem]">
        <summary className="cursor-pointer text-muted hover:text-foreground">View as table</summary>
        <table className="mt-2 w-full">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1 font-medium">Month</th>
              <th className="py-1 text-right font-medium">Expected</th>
              <th className="py-1 text-right font-medium">Received</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t border-border">
                <td className="py-1.5">{d.month}</td>
                <td className="money py-1.5 text-right">{formatMoney(d.scheduledMinor, currency)}</td>
                <td className="money py-1.5 text-right">{formatMoney(d.receivedMinor, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
