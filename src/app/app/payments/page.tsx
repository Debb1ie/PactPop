import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { ReceivablesTable } from "@/components/app/money-tables";
import { PositionBoard } from "@/components/app/position-board";
import { RevenueChart } from "@/components/app/revenue-chart";
import { Pill, StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { clients, invoices, payments } from "@/server/db/schema";
import { paypalConfigured } from "@/server/env";
import { moneyPosition, receivablesSchedule, revenueTrend } from "@/server/services/finance";

export const metadata: Metadata = { title: "Payments" };

const date = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase() : "—");

export default async function PaymentsPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const bid = ctx.business.id;
  const cur = ctx.business.currency;
  const [position, receivables, trend, inv, pays] = await Promise.all([
    moneyPosition(db, bid),
    receivablesSchedule(db, bid, 50),
    revenueTrend(db, bid),
    db.select({ i: invoices, client: clients.name, company: clients.company }).from(invoices).innerJoin(clients, eq(clients.id, invoices.clientId)).where(eq(invoices.businessId, bid)).orderBy(desc(invoices.createdAt)).limit(50),
    db.select().from(payments).where(eq(payments.businessId, bid)).orderBy(desc(payments.createdAt)).limit(50),
  ]);
  const connected = paypalConfigured();

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-mono">PayPal Sandbox</p>
          <h1 className="mt-1 text-[1.75rem] font-bold leading-tight">Payments</h1>
        </div>
        <Pill tone={connected ? "success" : "neutral"}>{connected ? "PayPal Sandbox connected" : "PayPal Sandbox not connected"}</Pill>
      </div>

      <PositionBoard p={position} currency={cur} sandbox />

      <section className="panel mt-4" aria-label="Receivables schedule">
        <div className="panel-head">
          <h2 className="panel-title">Receivables schedule</h2>
          <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.06em] text-muted">
            {receivables.length} open · {formatMoney(receivables.reduce((s, r) => s + r.amountMinor, 0), cur)}
          </span>
        </div>
        <ReceivablesTable rows={receivables} />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="panel min-w-0" aria-label="Invoices">
          <div className="panel-head">
            <h2 className="panel-title">PayPal invoices</h2>
          </div>
          {inv.length === 0 ? (
            <p className="px-4 py-6 text-[0.875rem] text-muted">
              No invoices yet. {connected ? "The PayFlow Agent creates them from approved milestones." : "Connect the PayPal Sandbox to issue invoices from approved milestones."}
            </p>
          ) : (
            <ul className="divide-y divide-border text-[0.8125rem]">
              {inv.map(({ i, company, client }) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-[0.7rem] text-muted">{i.invoiceNumber ?? i.paypalInvoiceId ?? "DRAFT"}</span>
                  <span className="min-w-0 flex-1 truncate">{company ?? client}</span>
                  <StatusBadge status={i.status} />
                  <span className="money">{formatMoney(i.amountMinor, i.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel min-w-0" aria-label="Transactions">
          <div className="panel-head">
            <h2 className="panel-title">Transactions</h2>
            <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.06em] text-faint">verified by webhook or API</span>
          </div>
          {pays.length === 0 ? (
            <p className="px-4 py-6 text-[0.875rem] text-muted">No transactions yet. Payments appear here only after PayPal confirms them.</p>
          ) : (
            <ul className="divide-y divide-border text-[0.8125rem]">
              {pays.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-[0.7rem] text-muted">{date(p.completedAt ?? p.createdAt)}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[0.7rem]">{p.paypalCaptureId ?? p.paypalOrderId ?? p.paypalInvoicePaymentId}</span>
                  <StatusBadge status={p.status === "completed" ? "paid" : p.status} />
                  <span className="money font-semibold">{formatMoney(p.amountMinor, p.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel mt-4" aria-label="Payments received">
        <div className="panel-head">
          <h2 className="panel-title">Payments received</h2>
          <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.06em] text-muted">PayPal-confirmed · 6M</span>
        </div>
        <div className="p-4">
          <RevenueChart data={trend} currency={cur} />
        </div>
      </section>
    </>
  );
}
