"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Mascot } from "@/components/brand/mascot";
import { formatMoney, formatMoneyCompact } from "@/lib/money";

type Point = { month: string; label: string; receivedMinor: number };

/** Single-series monthly bar chart (no legend: the card title names the series). */
export function RevenueChart({ data, currency }: { data: Point[]; currency: string }) {
  const hasData = data.some((d) => d.receivedMinor > 0);
  if (!hasData) {
    return (
      <div className="relative flex h-64 flex-col items-center justify-start overflow-hidden rounded-xl pt-2 text-center">
        {/* ghost bars hint at the chart to come */}
        <div className="absolute inset-x-8 bottom-0 flex h-full items-end justify-around opacity-25 [mask-image:linear-gradient(to_top,black_0%,transparent_100%)]" aria-hidden>
          {[12, 18, 9, 15, 13, 20].map((h, i) => (
            <span key={i} className="w-5 rounded-full bg-gradient-to-t from-[#7c5cff] to-[#f6c89f]" style={{ height: `${h}%` }} />
          ))}
        </div>
        <Mascot mood="sleeping" width={120} className="relative" />
        <p className="relative mt-3 text-[0.9375rem] font-semibold">No payments yet</p>
        <p className="relative mt-0.5 max-w-xs text-[0.8125rem] text-muted">Monthly totals appear here once PayPal confirms your first payment.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="h-60 w-full" role="img" aria-label="Payments received per month, last six months">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              allowDecimals={false}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              tickFormatter={(v: number) => formatMoneyCompact(v, currency)}
            />
            <Tooltip
              cursor={{ fill: "var(--fill)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="material rounded-xl px-3 py-2 text-sm shadow-[var(--shadow-lift)] ring-[0.5px] ring-border">
                    <p className="text-xs text-muted">{p.month}</p>
                    <p className="money font-semibold">{formatMoney(p.receivedMinor, currency)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="receivedMinor" fill="var(--accent)" radius={[2, 2, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-accent">View as table</summary>
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
