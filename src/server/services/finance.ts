import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { approvals, clients, commitments, invoices, payments, timelineEvents } from "@/server/db/schema";

const OUTSTANDING = ["sent", "scheduled", "partially_paid", "payment_pending", "unknown"] as const;

/**
 * Financial overview. Every figure is computed from PactPop records whose payment status was
 * confirmed by PayPal (verified webhook or server-side API check). Draft invoices are excluded.
 */
export async function financeSummary(db: Database, businessId: string) {
  const now = new Date();
  const [received, refunded, outstanding, overdue, pendingPayments, activeCommitments, pendingApprovals, agreed] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${payments.amountMinor}),0)`, n: sql<number>`count(*)::int` })
      .from(payments)
      .where(and(eq(payments.businessId, businessId), eq(payments.status, "completed"))),
    db
      .select({ total: sql<string>`coalesce(sum(${payments.amountMinor}),0)` })
      .from(payments)
      .where(and(eq(payments.businessId, businessId), eq(payments.status, "refunded"))),
    db
      .select({ total: sql<string>`coalesce(sum(${invoices.amountMinor}),0)`, n: sql<number>`count(*)::int` })
      .from(invoices)
      .where(and(eq(invoices.businessId, businessId), inArray(invoices.status, [...OUTSTANDING]))),
    db
      .select({ total: sql<string>`coalesce(sum(${invoices.amountMinor}),0)`, n: sql<number>`count(*)::int` })
      .from(invoices)
      .where(and(eq(invoices.businessId, businessId), inArray(invoices.status, [...OUTSTANDING]), lt(invoices.dueDate, now))),
    db
      .select({ total: sql<string>`coalesce(sum(${payments.amountMinor}),0)`, n: sql<number>`count(*)::int` })
      .from(payments)
      .where(and(eq(payments.businessId, businessId), inArray(payments.status, ["created", "approved", "pending"]))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(commitments)
      .where(and(eq(commitments.businessId, businessId), sql`${commitments.status} not in ('completed','cancelled','draft')`)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(approvals)
      .where(and(eq(approvals.businessId, businessId), eq(approvals.status, "pending"))),
    db
      .select({ total: sql<string>`coalesce(sum(${commitments.agreedTotalMinor}),0)` })
      .from(commitments)
      .where(and(eq(commitments.businessId, businessId), sql`${commitments.status} not in ('cancelled','draft','proposed','awaiting_acceptance')`)),
  ]);
  return {
    receivedMinor: Number(received[0].total),
    receivedCount: received[0].n,
    refundedMinor: Number(refunded[0].total),
    outstandingMinor: Number(outstanding[0].total),
    outstandingCount: outstanding[0].n,
    overdueMinor: Number(overdue[0].total),
    overdueCount: overdue[0].n,
    pendingPaymentsMinor: Number(pendingPayments[0].total),
    pendingPaymentsCount: pendingPayments[0].n,
    activeCommitments: activeCommitments[0].n,
    pendingApprovals: pendingApprovals[0].n,
    agreedMinor: Number(agreed[0].total),
  };
}

/** Completed payments per month for the last `months` months (zero-filled). */
export async function revenueTrend(db: Database, businessId: string, months = 6) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - (months - 1));
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', coalesce(${payments.completedAt}, ${payments.createdAt})), 'YYYY-MM')`,
      total: sql<string>`sum(${payments.amountMinor})`,
    })
    .from(payments)
    .where(and(eq(payments.businessId, businessId), eq(payments.status, "completed"), gte(sql`coalesce(${payments.completedAt}, ${payments.createdAt})`, start)))
    .groupBy(sql`1`);
  const map = new Map(rows.map((r) => [r.month, Number(r.total)]));
  const out: { month: string; label: string; receivedMinor: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start);
    d.setUTCMonth(start.getUTCMonth() + i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push({ month: key, label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }), receivedMinor: map.get(key) ?? 0 });
  }
  return out;
}

export async function commitmentStatusCounts(db: Database, businessId: string) {
  return db
    .select({ status: commitments.status, n: sql<number>`count(*)::int` })
    .from(commitments)
    .where(eq(commitments.businessId, businessId))
    .groupBy(commitments.status);
}

export async function recentActivity(db: Database, businessId: string, limit = 8) {
  return db
    .select({ event: timelineEvents, commitmentTitle: commitments.title, clientName: clients.name })
    .from(timelineEvents)
    .innerJoin(commitments, eq(commitments.id, timelineEvents.commitmentId))
    .innerJoin(clients, eq(clients.id, commitments.clientId))
    .where(eq(timelineEvents.businessId, businessId))
    .orderBy(desc(timelineEvents.createdAt))
    .limit(limit);
}
