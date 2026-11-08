import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { CashflowChart } from "@/components/app/cashflow-chart";
import { LedgerTable, ReceivablesTable } from "@/components/app/money-tables";
import { PositionBoard } from "@/components/app/position-board";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { paypalConfigured } from "@/server/env";
import { cashflowByMonth, moneyLedger, moneyPosition, receivablesSchedule } from "@/server/services/finance";
import { listApprovals } from "@/server/services/workflow";

export const metadata: Metadata = { title: "Dashboard" };

/** Finance overview only. Agents, commitments and payments each have their own page. */
export default async function DashboardPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const [position, cashflow, receivables, ledger, pending] = await Promise.all([
    moneyPosition(db, ctx.business.id),
    cashflowByMonth(db, ctx.business.id),
    receivablesSchedule(db, ctx.business.id, 6),
    moneyLedger(db, ctx.business.id, 8),
    listApprovals(db, ctx.business.id),
  ]);
  const cur = ctx.business.currency;
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" }).toUpperCase();

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-mono">{today}</p>
          <h1 className="display-x mt-1 text-[1.9rem] font-bold uppercase leading-none tracking-[-0.01em]">Dashboard</h1>
        </div>
        {!paypalConfigured() && (
          <p className="rounded-[4px] border border-warning/40 px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-warning">
            PayPal Sandbox not connected · add credentials to .env
          </p>
        )}
      </div>

      {pending.length > 0 && (
        <Link
          href="/app/approvals"
          className="mb-4 flex items-center gap-3 rounded-[4px] border border-warning/40 bg-warning-soft px-4 py-2.5 text-[0.875rem] transition-colors hover:border-warning"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.06em] text-warning">{pending.length} awaiting decision</span>
          <span className="min-w-0 flex-1 truncate">
            {pending[0].a.title}
            {pending[0].a.amountMinor != null && <span className="money ml-2">{formatMoney(pending[0].a.amountMinor, cur)}</span>}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" />
        </Link>
      )}

      <PositionBoard p={position} currency={cur} sandbox />

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="panel min-w-0" aria-label="Cash flow">
          <div className="panel-head">
            <h2 className="label-mono !text-foreground">Cash flow</h2>
            <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.06em] text-muted">Scheduled vs received · 6M</span>
          </div>
          <div className="p-4">
            <CashflowChart data={cashflow} currency={cur} />
          </div>
        </section>

        <section className="panel min-w-0" aria-label="Receivables">
          <div className="panel-head">
            <h2 className="label-mono !text-foreground">Receivables</h2>
            <Link href="/app/payments" className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.06em] text-muted hover:text-accent">
              All payments →
            </Link>
          </div>
          <ReceivablesTable compact rows={receivables} />
        </section>
      </div>

      <section className="panel mt-4" aria-label="Ledger">
        <div className="panel-head">
          <h2 className="label-mono !text-foreground">Ledger</h2>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.06em] text-faint">Agreements, change orders and payments</span>
          <Link href="/app/commitments" className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.06em] text-muted hover:text-accent">
            Commitments →
          </Link>
        </div>
        <LedgerTable
          currency={cur}
          rows={ledger.map(({ e, company, clientName, commitmentTitle }) => ({
            id: e.id,
            createdAt: e.createdAt,
            title: e.title,
            kind: e.kind,
            client: company ?? clientName,
            commitment: commitmentTitle,
            amountMinor: e.amountMinor,
            actor: e.actorLabel,
          }))}
        />
      </section>

      <p className="mt-4 font-mono text-[0.7rem] text-faint">Records tagged DEMO are seeded sample data. “Received” only counts payments PayPal has confirmed.</p>
    </>
  );
}
