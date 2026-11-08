"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { statusLabel } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

export type WalletCommitment = {
  id: string;
  title: string;
  status: string;
  version: number;
  dueDate: string | null;
  agreedTotalMinor: number;
  currency: string;
  clientId: string;
  clientName: string;
  milestones: { title: string; paid: boolean; status: string; kind: string; amountMinor: number }[];
  pendingChangeOrders: { title: string; amountMinor: number }[];
};

const ref = (id: string) => `PP-${id.slice(0, 4).toUpperCase()}`;
const dueLabel = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" }).replace("/", "/") : "—");

/** One card per agreement. The selected card drives the details and collection panels below. */
export function CommitmentWallet({ items }: { items: WalletCommitment[] }) {
  // Default to the agreement that's actually running, not a draft.
  const ACTIVE = ["in_progress", "accepted", "awaiting_evidence", "awaiting_approval", "payment_ready"];
  const [selectedId, setSelectedId] = useState((items.find((c) => ACTIVE.includes(c.status)) ?? items[0])?.id);
  const selected = items.find((c) => c.id === selectedId) ?? items[0];

  if (!items.length) {
    return (
      <div className="panel px-6 py-10 text-center">
        <p className="font-semibold">No commitments yet</p>
        <p className="mt-1 text-sm text-muted">Agreements appear here as cards once a client accepts a proposal.</p>
      </div>
    );
  }

  const collected = selected.milestones.filter((m) => m.paid).reduce((s, m) => s + m.amountMinor, 0);
  const scheduledTotal = selected.milestones.reduce((s, m) => s + m.amountMinor, 0) + selected.pendingChangeOrders.reduce((s, o) => s + o.amountMinor, 0);
  const total = scheduledTotal > 0 ? scheduledTotal : selected.agreedTotalMinor;
  const segments = [
    ...selected.milestones.map((m) => ({ key: m.title, title: m.title, amount: m.amountMinor, type: m.paid ? "paid" : m.status === "invoiced" ? "invoiced" : m.kind === "change_order" ? "change" : "open" })),
    ...selected.pendingChangeOrders.map((o) => ({ key: `co-${o.title}`, title: `${o.title} (pending)`, amount: o.amountMinor, type: "pending" })),
  ];
  const SEG: Record<string, string> = {
    paid: "bg-gradient-to-r from-[#9b84ff] via-[#c7b8ff] to-[#7c5cff]",
    invoiced: "bg-accent",
    change: "bg-lime",
    pending: "bg-lime/50",
    open: "bg-surface-2",
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.375rem] font-bold">
          My Commitments <sup className="text-[0.75rem] font-medium text-muted">{items.length}</sup>
        </h2>
        <Link href="/app/clients/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[0.9375rem] font-semibold text-accent transition hover:bg-[#f0edff]">
          Add New <span aria-hidden className="text-lg leading-none">+</span>
        </Link>
      </div>

      <div className="-mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-0 sm:px-0" role="listbox" aria-label="Commitments">
        {items.map((c) => {
          const active = c.id === selected.id;
          return (
            <button
              key={c.id}
              role="option"
              aria-selected={active}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "w-[18.5rem] shrink-0 snap-start overflow-hidden rounded-2xl bg-surface text-left transition-all",
                active ? "p-1 ring-1 ring-white/40 shadow-[0_16px_40px_-20px_rgb(124_92_255/0.6)]" : "opacity-90 hover:opacity-100",
              )}
            >
              <div
                className={cn(
                  "grid grid-cols-[1fr_auto] gap-3 rounded-xl px-5 pb-5 pt-6",
                  active ? "bg-gradient-to-br from-[#b9a5ff] via-[#8d6cff] to-[#5a3df0] text-white" : "bg-[#1f2026] text-foreground dark:bg-[#1f2026]",
                )}
              >
                <div className="min-w-0">
                  <p className={cn("text-[0.7rem] font-medium uppercase", active ? "text-white/80" : "text-muted")}>Client</p>
                  <p className="mt-1 truncate text-[0.875rem] font-medium">{c.clientName}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-[0.7rem] font-medium uppercase", active ? "text-white/80" : "text-muted")}>Ref</p>
                  <p className="money mt-1 text-[0.875rem]">•••• {ref(c.id)}</p>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3 px-5 pb-5 pt-4">
                <div>
                  <p className="text-[0.7rem] font-medium uppercase text-muted">Agreed</p>
                  <p className="money mt-1 text-[1.75rem] font-bold leading-none">{formatMoney(c.agreedTotalMinor, c.currency)}</p>
                </div>
                <LogoMark className="h-7 w-7 opacity-90" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="panel" aria-label="Commitment details">
          <div className="panel-head">
            <h3 className="panel-title">Commitment Details</h3>
            <Link href={`/app/clients/${selected.clientId}`} aria-label="Open client" className="ml-auto grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground">
              <MoreHorizontal className="h-5 w-5" />
            </Link>
          </div>
          <dl className="m-5 mt-3 grid grid-cols-2 gap-y-3 rounded-xl bg-surface-2 px-4 py-3 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-border">
            {[
              ["Number", `•••• ${ref(selected.id)}`],
              ["Due date", dueLabel(selected.dueDate)],
              ["Version", `v${selected.version}`],
              ["Status", statusLabel(selected.status)],
            ].map(([k, v]) => (
              <div key={k} className="sm:px-4 sm:first:pl-0">
                <dt className="text-[0.7rem] font-medium uppercase text-muted">{k}</dt>
                <dd className="money mt-1 text-[0.875rem] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel" aria-label="Collection">
          <div className="panel-head">
            <h3 className="panel-title">Collection</h3>
            <span className="ml-auto truncate text-[0.8125rem] text-muted">{selected.title}</span>
          </div>
          <div className="px-5 pb-5 pt-2">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="money text-[1.75rem] font-bold">{formatMoney(collected, selected.currency)}</span>
              <span className="text-[0.875rem] text-muted">collected from {formatMoney(total, selected.currency)}</span>
            </p>
            {segments.length ? (
              <div className="mt-3 flex h-5 gap-1.5" role="img" aria-label={segments.map((s) => `${s.title}: ${formatMoney(s.amount)} ${s.type}`).join("; ")}>
                {segments.map((s) => (
                  <span key={s.key} title={`${s.title} · ${formatMoney(s.amount, selected.currency)}`} className={cn("h-full rounded-full", SEG[s.type])} style={{ flexGrow: s.amount, flexBasis: 0 }} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[0.8125rem] text-muted">No milestones yet: they&apos;re created when the client accepts.</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-muted">
              <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#b19cff]" />Paid</li>
              <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />Invoiced</li>
              <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-lime" />Change order</li>
              <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-surface-2 ring-1 ring-border-strong" />Not yet due</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
