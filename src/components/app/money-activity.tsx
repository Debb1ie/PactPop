"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

export type ActivityRow = { id: string; date: string; title: string; kind: string; party: string; amountMinor: number | null };

const AVATAR = ["bg-[#f6c89f] text-[#5a3a12]", "bg-[#b9a5ff] text-[#2a1a6b]", "bg-[#d7ee6e] text-[#3a4410]", "bg-[#9ee6d8] text-[#0f4a40]"];

/** Status pill derived from the real event kind. */
function statusFor(kind: string): { label: string; cls: string } {
  if (kind.startsWith("payment.")) return { label: "Paid", cls: "bg-success-soft text-success" };
  if (kind === "change_order.rejected") return { label: "Rejected", cls: "border border-error/60 text-error" };
  if (kind === "change_order.drafted") return { label: "Pending", cls: "border border-warning/50 text-warning" };
  if (kind === "change_order.approved") return { label: "Approved", cls: "bg-surface-2 text-foreground" };
  if (kind === "proposal.accepted") return { label: "Signed", cls: "bg-surface-2 text-foreground" };
  return { label: "Sent", cls: "bg-surface-2 text-muted" };
}

const RANGES = [
  { v: "7", label: "Last 7 days" },
  { v: "30", label: "Last 30 days" },
  { v: "all", label: "All dates" },
];

/** Money activity with a working date filter. */
export function MoneyActivity({ rows, currency, asOf }: { rows: ActivityRow[]; currency: string; /** server time, keeps filtering pure */ asOf: string }) {
  const [range, setRange] = useState("all");
  const shown = useMemo(() => {
    if (range === "all") return rows;
    const since = new Date(asOf).getTime() - Number(range) * 86_400_000;
    return rows.filter((r) => new Date(r.date).getTime() >= since);
  }, [rows, range, asOf]);

  return (
    <section className="panel min-w-0" aria-label="Money activity">
      <div className="panel-head">
        <h3 className="panel-title">Transactions</h3>
        <label className="relative ml-auto inline-flex items-center">
          <CalendarDays className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted" />
          <span className="sr-only">Date range</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="h-8 appearance-none rounded-full border border-border-strong bg-transparent pl-8 pr-3 text-[0.75rem] font-medium focus:outline-none focus:ring-[3px] focus:ring-ring/40"
          >
            {RANGES.map((r) => (
              <option key={r.v} value={r.v}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {shown.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-[0.875rem] text-muted">No transactions in this period.</p>
      ) : (
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full min-w-[480px] text-[0.8125rem]">
            <thead>
              <tr className="text-left text-[0.75rem] text-muted">
                <th className="py-2 font-medium">Client</th>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => {
                const st = statusFor(r.kind);
                const inflow = r.kind.startsWith("payment.");
                return (
                  <tr key={r.id} title={r.title}>
                    <td className="py-2">
                      <span className="flex items-center gap-2.5">
                        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold", AVATAR[i % AVATAR.length])} aria-hidden>
                          {r.party.slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{r.party}</span>
                          <span className="block truncate text-[0.7rem] text-muted">{r.title}</span>
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-2 text-muted">{new Date(r.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</td>
                    <td className="py-2">
                      <span className={cn("inline-flex rounded-full px-3 py-1 text-[0.75rem] font-medium", st.cls)}>{st.label}</span>
                    </td>
                    <td className={cn("money whitespace-nowrap py-2 text-right font-medium", inflow && "text-success")}>
                      {r.amountMinor != null ? `${inflow ? "+" : ""}${formatMoney(r.amountMinor, currency)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
