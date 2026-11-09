import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { ReceivablesTable } from "@/components/app/money-tables";
import { PositionBoard } from "@/components/app/position-board";
import { RevenueChart } from "@/components/app/revenue-chart";
import { Pill, StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { CircleDollarSign, ExternalLink, FileText, Receipt, ReceiptText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { SyncInvoiceButton } from "@/components/app/paypal-buttons";
import type { ReactNode } from "react";

/** Empty state with an iOS-style gradient icon tile. */
function EmptyTile({ icon: Icon, tile, title, children }: { icon: LucideIcon; tile: string; title: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 pb-6 pt-3">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[0.95rem] bg-gradient-to-br text-white shadow-[0_12px_24px_-12px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.3)] ${tile}`}>
        <Icon className="h-6 w-6" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.9375rem] font-semibold">{title}</p>
        <p className="mt-0.5 text-[0.8125rem] text-muted">{children}</p>
      </div>
    </div>
  );
}
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
        <ReceivablesTable rows={receivables} invoiceable={connected} />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="panel min-w-0" aria-label="Invoices">
          <div className="panel-head">
            <h2 className="panel-title">PayPal invoices</h2>
          </div>
          {inv.length === 0 ? (
            <EmptyTile icon={ReceiptText} tile="from-[#ff8ad8] to-[#7656e8]" title="No invoices yet">
              {connected ? "The PayFlow Agent creates them from approved milestones." : "Connect the PayPal Sandbox to issue invoices from approved milestones."}
            </EmptyTile>
          ) : (
            <ul className="divide-y divide-border text-[0.8125rem]">
              {inv.map(({ i, company, client }) => (
                <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
                  <span className="font-mono text-[0.7rem] text-muted">{i.invoiceNumber ?? i.paypalInvoiceId ?? "DRAFT"}</span>
                  <span className="min-w-0 flex-1 truncate">{company ?? client}</span>
                  <StatusBadge status={i.status} />
                  <span className="money">{formatMoney(i.amountMinor, i.currency)}</span>
                  {i.payerViewUrl && !i.paidAt && (
                    <a href={i.payerViewUrl} target="_blank" rel="noreferrer" className="pure inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.75rem] font-medium hover:opacity-80">
                      Payer page <ExternalLink className="h-3 w-3 text-muted" />
                    </a>
                  )}
                  {!i.paidAt && <SyncInvoiceButton invoiceId={i.id} />}
                  <Link href={`/app/payments/invoices/${i.id}`} className="pure inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.75rem] font-medium hover:opacity-80">
                    <FileText className="h-3.5 w-3.5 text-[#6c4ef5]" /> Document
                  </Link>
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
          {pays.filter((p) => p.status !== "created").length === 0 ? (
            <EmptyTile icon={CircleDollarSign} tile="from-[#d7ee6e] to-[#1f8f7a]" title="No transactions yet">
              Payments appear here only after PayPal confirms them.
            </EmptyTile>
          ) : (
            <ul className="divide-y divide-border text-[0.8125rem]">
              {pays.filter((p) => p.status !== "created").map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-[0.7rem] text-muted">{date(p.completedAt ?? p.createdAt)}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[0.7rem]">{p.paypalCaptureId ?? p.paypalOrderId ?? p.paypalInvoicePaymentId}</span>
                  <StatusBadge status={p.status === "completed" ? "paid" : p.status} />
                  <span className="money font-semibold">{formatMoney(p.amountMinor, p.currency)}</span>
                  <Link href={`/app/payments/receipts/${p.id}`} className="pure inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.75rem] font-medium hover:opacity-80">
                    <Receipt className="h-3.5 w-3.5 text-[#0f9182]" /> Receipt
                  </Link>
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
