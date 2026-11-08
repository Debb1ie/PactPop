import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { Pill, StatusBadge } from "@/components/ui/status-badge";
import { SendInvoiceButton } from "./paypal-buttons";

const date = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase() : "—");

const TONE = ["bg-[#ff9f0a]", "bg-[#7656e8]", "bg-[#30b0c7]", "bg-[#34c759]", "bg-[#ff6b8b]"];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export type Receivable = {
  id: string;
  dueDate: Date | null;
  overdue: boolean;
  client: string;
  clientId: string;
  commitment: string;
  milestone: string;
  amountMinor: number;
  currency: string;
  status: string;
};

/** Upcoming money, by due date. */
/** `invoiceable` adds a "Send PayPal invoice" action (PayPal configured, owner view). */
export function ReceivablesTable({ rows, compact, invoiceable }: { rows: Receivable[]; compact?: boolean; invoiceable?: boolean }) {
  if (!rows.length) return <p className="px-4 py-6 text-[0.875rem] text-muted">No scheduled payments. Milestones appear here once a client accepts an agreement.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-[0.8125rem]">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="label-mono px-4 py-2 font-normal">Due</th>
            <th className="label-mono px-2 py-2 font-normal">Client · milestone</th>
            {!compact && <th className="label-mono px-2 py-2 font-normal">Status</th>}
            <th className="label-mono px-4 py-2 text-right font-normal">Amount</th>
            {invoiceable && <th className="label-mono px-4 py-2 text-right font-normal">PayPal</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-fill">
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[0.75rem] text-muted">
                {date(r.dueDate)}
                {r.overdue && (
                  <Pill tone="error" className="ml-2 py-0.5 font-sans text-[0.6875rem]">
                    Late
                  </Pill>
                )}
              </td>
              <td className="px-2 py-2.5">
                <span className="flex items-center gap-2.5">
                  <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.65rem] font-semibold text-white", TONE[hash(r.clientId) % TONE.length])} aria-hidden>
                    {r.client.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <Link href={`/app/clients/${r.clientId}`} className="font-medium hover:text-accent">
                      {r.client}
                    </Link>
                    <span className="text-muted"> · {r.milestone}</span>
                  </span>
                </span>
              </td>
              {!compact && (
                <td className="px-2 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
              )}
              <td className="money whitespace-nowrap px-4 py-2.5 text-right">{formatMoney(r.amountMinor, r.currency)}</td>
              {invoiceable && <td className="px-4 py-2.5 text-right">{r.status === "invoiced" ? <span className="text-[0.75rem] text-muted">Invoice sent</span> : <SendInvoiceButton milestoneId={r.id} />}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type LedgerRow = { id: string; createdAt: Date; title: string; kind: string; client: string; commitment: string; amountMinor: number | null; actor: string | null };

/** Money events in date order (agreements, change orders, payments). */
export function LedgerTable({ rows, currency }: { rows: LedgerRow[]; currency: string }) {
  if (!rows.length) return <p className="px-4 py-6 text-[0.875rem] text-muted">No money events yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-[0.8125rem]">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="label-mono px-4 py-2 font-normal">Date</th>
            <th className="label-mono px-2 py-2 font-normal">Event</th>
            <th className="label-mono px-2 py-2 font-normal">Client</th>
            <th className="label-mono px-4 py-2 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            // Only real cash (PayPal-confirmed payments) is shown as money in.
            const positive = /^payment\./.test(r.kind);
            return (
              <tr key={r.id} className="transition-colors hover:bg-fill">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[0.75rem] text-muted">{date(r.createdAt)}</td>
                <td className="px-2 py-2.5">
                  {r.title}
                  {r.actor && <span className="ml-1.5 font-mono text-[0.65rem] uppercase text-faint">{r.actor}</span>}
                </td>
                <td className="px-2 py-2.5 text-muted">{r.client}</td>
                <td className={cn("money whitespace-nowrap px-4 py-2.5 text-right", positive && "font-semibold")}>
                  {r.amountMinor != null ? `${positive ? "+" : ""}${formatMoney(r.amountMinor, currency)}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
