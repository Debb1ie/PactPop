"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartSpec } from "@/lib/docs";
import { formatMoney, formatMoneyCompact } from "@/lib/money";

/*
 * Validated categorical palette (dataviz reference instance; passes CVD + contrast checks in both
 * modes in this order). "Other" is always neutral grey. Two-series charts use the validated
 * violet/orange pair; single-series charts use one hue.
 */
const CAT = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9"],
};
const PAIR = { light: ["#6250d6", "#eb6834"], dark: ["#9085e9", "#d95926"] };
const OTHER = { light: "#9a9aa6", dark: "#62636e" };

function useIsDark() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

/** A chart the agents asked to show. Values are rendered exactly as the server computed them. */
export function ChatChart({ spec }: { spec: ChartSpec }) {
  const dark = useIsDark();
  const mode = dark ? "dark" : "light";
  const [table, setTable] = useState(false);
  const fmt = (v: number) => (spec.unit === "money" ? formatMoney(v, spec.currency) : String(v));
  const short = (v: number) => (spec.unit === "money" ? formatMoneyCompact(v, spec.currency) : String(v));
  const key = spec.series[0].key;
  const surface = dark ? "#26272e" : "#ffffff";
  const total = spec.data.reduce((s, d) => s + Number(d[key] ?? 0), 0);
  const isShare = spec.kind === "pie" || spec.kind === "donut";
  const colorAt = (i: number, label: string) => (label === "Other" ? OTHER[mode] : CAT[mode][i % CAT[mode].length]);
  const seriesColor = (i: number) => (spec.series.length > 1 ? PAIR[mode][i] : PAIR[mode][0]);

  const tip = ({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; payload?: { label?: string } }[]; label?: string }) =>
    active && payload?.length ? (
      <div className="rounded-lg bg-white px-3 py-2 text-[0.75rem] text-[#1c1d23] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5)]">
        <p className="font-semibold">{label ?? payload[0].payload?.label}</p>
        {payload.map((p, i) => (
          <p key={i} className="money">
            {spec.series.length > 1 ? `${p.name}: ` : ""}
            {fmt(Number(p.value ?? 0))}
            {isShare && total > 0 ? ` · ${Math.round((Number(p.value ?? 0) / total) * 100)}%` : ""}
          </p>
        ))}
      </div>
    ) : null;

  if (spec.data.length === 0 || total === 0)
    return (
      <div className="rounded-2xl bg-surface px-4 py-5 text-[0.875rem] text-muted ring-1 ring-border">
        <p className="font-semibold text-foreground">{spec.title}</p>
        <p className="mt-1">No data for this chart yet.</p>
      </div>
    );

  return (
    <figure className="rounded-2xl bg-surface p-4 ring-1 ring-border sm:p-5">
      <figcaption>
        <p className="text-[0.9375rem] font-semibold">{spec.title}</p>
        {spec.subtitle && <p className="text-[0.75rem] text-muted">{spec.subtitle}</p>}
      </figcaption>

      {isShare ? (
        <div className="mt-3 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative h-52" role="img" aria-label={`${spec.title}: ${spec.data.map((d) => `${d.label} ${fmt(Number(d[key]))}`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={spec.data} dataKey={key} nameKey="label" innerRadius={spec.kind === "donut" ? "58%" : 0} outerRadius="92%" paddingAngle={spec.data.length > 1 ? 2 : 0} stroke={surface} strokeWidth={2} isAnimationActive>
                  {spec.data.map((d, i) => (
                    <Cell key={d.label} fill={colorAt(i, d.label)} />
                  ))}
                </Pie>
                <Tooltip content={tip as never} />
              </PieChart>
            </ResponsiveContainer>
            {spec.kind === "donut" && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="money text-[1.125rem] font-bold">{short(total)}</p>
                  <p className="text-[0.65rem] text-muted">total</p>
                </div>
              </div>
            )}
          </div>
          <ul className="space-y-2 text-[0.8125rem]">
            {spec.data.map((d, i) => (
              <li key={d.label} className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: colorAt(i, d.label) }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{d.label}</span>
                <span className="money font-semibold">{fmt(Number(d[key]))}</span>
                <span className="w-9 text-right text-muted">{Math.round((Number(d[key]) / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          {spec.series.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-4 text-[0.75rem] text-muted">
              {spec.series.map((s, i) => (
                <span key={s.key} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: seriesColor(i) }} aria-hidden /> {s.label}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 h-56" role="img" aria-label={`${spec.title} chart`}>
            <ResponsiveContainer width="100%" height="100%">
              {spec.kind === "line" ? (
                <LineChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border-strong)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={48} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v: number) => short(v)} />
                  <Tooltip content={tip as never} />
                  {spec.series.map((s, i) => (
                    <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={seriesColor(i)} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: surface, fill: seriesColor(i) }} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%" barGap={2}>
                  <CartesianGrid vertical={false} stroke="var(--border-strong)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={48} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v: number) => short(v)} />
                  <Tooltip cursor={{ fill: "var(--fill)" }} content={tip as never} />
                  {spec.series.map((s, i) => (
                    <Bar key={s.key} dataKey={s.key} name={s.label} fill={seriesColor(i)} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}

      <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="mt-2 text-[0.75rem] text-muted hover:text-foreground">
        {table ? "Hide table" : "View as table"}
      </button>
      {table && (
        <table className="mt-2 w-full text-[0.75rem]">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-normal">{isShare ? "Category" : "Period"}</th>
              {spec.series.map((s) => (
                <th key={s.key} className="py-1 text-right font-normal">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.data.map((d) => (
              <tr key={d.label} className="border-t border-border">
                <td className="py-1">{d.label}</td>
                {spec.series.map((s) => (
                  <td key={s.key} className="money py-1 text-right">
                    {fmt(Number(d[s.key] ?? 0))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}
