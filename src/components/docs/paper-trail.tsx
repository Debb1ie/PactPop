import { BadgeCheck, FileText, Send, ShieldCheck, Webhook } from "lucide-react";
import type { ReactNode } from "react";

export type TrailItem = { at: string; title: string; detail?: ReactNode; kind: "sent" | "webhook" | "paid" | "audit" | "note" };

const ICON = { sent: Send, webhook: Webhook, paid: BadgeCheck, audit: ShieldCheck, note: FileText };
const fmt = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/** The documented history behind an invoice or payment, printed under the document. */
export function PaperTrail({ items, record }: { items: TrailItem[]; record?: { label: string; value: ReactNode }[] }) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 text-[#0d0d10] ring-1 ring-black/5 sm:p-8">
      <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[#62626e]">Paper trail</h2>
      {record && record.length > 0 && (
        <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-xl bg-[#f6f5fb] p-4 text-[0.8125rem] sm:grid-cols-2">
          {record.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt className="text-[#62626e]">{r.label}</dt>
              <dd className="break-all text-right font-mono text-[0.75rem]">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <ol className="mt-5 space-y-4">
        {items.length === 0 && <li className="text-[0.875rem] text-[#62626e]">Nothing recorded yet.</li>}
        {items.map((it, i) => {
          const Icon = ICON[it.kind];
          return (
            <li key={i} className="flex gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${it.kind === "paid" ? "bg-[#e7f6ec] text-[#1f8a4c]" : it.kind === "webhook" ? "bg-[#e8f0fb] text-[#0a62d0]" : "bg-[#f1ecff] text-[#6c4ef5]"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.875rem] font-semibold">{it.title}</p>
                <p className="text-[0.75rem] text-[#62626e]">{fmt(it.at)}</p>
                {it.detail && <div className="mt-1 text-[0.8125rem] text-[#3a3a42]">{it.detail}</div>}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 border-t border-[#ececf0] pt-4 text-[0.75rem] text-[#62626e]">
        Recorded automatically by PactPop. Money is counted only after PayPal confirms it (verified webhook or a server-side check with PayPal). PayPal Sandbox: test money only.
      </p>
    </section>
  );
}
