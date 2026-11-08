import { and, asc, desc, eq, gte, inArray, isNotNull, lt, notInArray, sql } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { approvals, changeOrders, clients, commitments, invoices, milestones, payments, timelineEvents } from "@/server/db/schema";

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

/* ───────── Trading-desk dashboard data ───────── */

const CONTRACTED = ["accepted", "in_progress", "awaiting_evidence", "awaiting_approval", "payment_ready", "completed", "disputed"] as const;

/** Where the money stands: contracted vs received, invoiced, scheduled, pending change orders, pipeline. */
export async function moneyPosition(db: Database, businessId: string) {
  const sum = (col: Parameters<typeof sql>[1]) => sql<string>`coalesce(sum(${col}),0)`;
  const [[contracted], [received], [invoiced], [scheduled], [pendingCO], [pipeline]] = await Promise.all([
    db.select({ v: sum(commitments.agreedTotalMinor), n: sql<number>`count(*)::int` }).from(commitments).where(and(eq(commitments.businessId, businessId), inArray(commitments.status, [...CONTRACTED]))),
    db.select({ v: sum(payments.amountMinor) }).from(payments).where(and(eq(payments.businessId, businessId), eq(payments.status, "completed"))),
    db.select({ v: sum(invoices.amountMinor) }).from(invoices).where(and(eq(invoices.businessId, businessId), inArray(invoices.status, [...OUTSTANDING]))),
    db
      .select({ v: sum(milestones.amountMinor) })
      .from(milestones)
      .innerJoin(commitments, eq(commitments.id, milestones.commitmentId))
      .where(and(eq(milestones.businessId, businessId), inArray(milestones.status, ["pending", "in_progress", "submitted", "approved"]), inArray(commitments.status, [...CONTRACTED]))),
    db.select({ v: sum(changeOrders.amountMinor) }).from(changeOrders).where(and(eq(changeOrders.businessId, businessId), eq(changeOrders.status, "pending_owner_approval"))),
    db.select({ v: sum(commitments.agreedTotalMinor), n: sql<number>`count(*)::int` }).from(commitments).where(and(eq(commitments.businessId, businessId), inArray(commitments.status, ["proposed", "awaiting_acceptance"]))),
  ]);
  const c = Number(contracted.v);
  const r = Number(received.v);
  return {
    contractedMinor: c,
    contractedCount: contracted.n,
    receivedMinor: r,
    invoicedMinor: Number(invoiced.v),
    scheduledMinor: Number(scheduled.v),
    pendingChangeOrdersMinor: Number(pendingCO.v),
    pipelineMinor: Number(pipeline.v),
    pipelineCount: pipeline.n,
    collectedPct: c > 0 ? Math.round((r / c) * 1000) / 10 : 0,
  };
}

/** Upcoming money: unpaid milestones on contracted commitments, by due date. */
export async function receivablesSchedule(db: Database, businessId: string, limit = 8) {
  const rows = await db
    .select({ m: milestones, commitmentTitle: commitments.title, clientName: clients.name, company: clients.company, clientId: clients.id })
    .from(milestones)
    .innerJoin(commitments, eq(commitments.id, milestones.commitmentId))
    .innerJoin(clients, eq(clients.id, commitments.clientId))
    .where(and(eq(milestones.businessId, businessId), inArray(milestones.status, ["pending", "in_progress", "submitted", "approved", "invoiced"]), inArray(commitments.status, [...CONTRACTED])))
    .orderBy(asc(milestones.dueDate))
    .limit(limit);
  const now = Date.now();
  return rows.map((r) => ({
    id: r.m.id,
    dueDate: r.m.dueDate,
    overdue: r.m.dueDate ? r.m.dueDate.getTime() < now : false,
    client: r.company ?? r.clientName,
    clientId: r.clientId,
    commitment: r.commitmentTitle,
    milestone: r.m.title,
    kind: r.m.kind,
    amountMinor: r.m.amountMinor,
    currency: r.m.currency,
    status: r.m.status,
  }));
}

/** Scheduled (milestones due) vs received (PayPal-confirmed) per month, 3 months back to 2 ahead. */
export async function cashflowByMonth(db: Database, businessId: string) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - 3);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 6);
  const [sched, recv] = await Promise.all([
    db
      .select({ month: sql<string>`to_char(date_trunc('month', ${milestones.dueDate}), 'YYYY-MM')`, total: sql<string>`sum(${milestones.amountMinor})` })
      .from(milestones)
      .innerJoin(commitments, eq(commitments.id, milestones.commitmentId))
      .where(and(eq(milestones.businessId, businessId), inArray(commitments.status, [...CONTRACTED]), notInArray(milestones.status, ["cancelled"]), gte(milestones.dueDate, start), lt(milestones.dueDate, end)))
      .groupBy(sql`1`),
    db
      .select({ month: sql<string>`to_char(date_trunc('month', coalesce(${payments.completedAt}, ${payments.createdAt})), 'YYYY-MM')`, total: sql<string>`sum(${payments.amountMinor})` })
      .from(payments)
      .where(and(eq(payments.businessId, businessId), eq(payments.status, "completed"), gte(sql`coalesce(${payments.completedAt}, ${payments.createdAt})`, start)))
      .groupBy(sql`1`),
  ]);
  const s = new Map(sched.map((r) => [r.month, Number(r.total)]));
  const r = new Map(recv.map((x) => [x.month, Number(x.total)]));
  const nowKey = new Date().toISOString().slice(0, 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(start);
    d.setUTCMonth(start.getUTCMonth() + i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { month: key, label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(), scheduledMinor: s.get(key) ?? 0, receivedMinor: r.get(key) ?? 0, current: key === nowKey };
  });
}

/** Money ledger: timeline events that carry an amount. */
export async function moneyLedger(db: Database, businessId: string, limit = 10) {
  return db
    .select({ e: timelineEvents, commitmentTitle: commitments.title, clientName: clients.name, company: clients.company })
    .from(timelineEvents)
    .innerJoin(commitments, eq(commitments.id, timelineEvents.commitmentId))
    .innerJoin(clients, eq(clients.id, commitments.clientId))
    .where(and(eq(timelineEvents.businessId, businessId), isNotNull(timelineEvents.amountMinor)))
    .orderBy(desc(timelineEvents.createdAt))
    .limit(limit);
}
