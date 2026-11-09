/**
 * Chart data for the AI chat. The model picks a metric and a chart type; every number here comes
 * from the database, never from the model.
 */
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { businesses, invoices } from "@/server/db/schema";
import type { ChartKind, ChartSpec } from "@/lib/docs";
import { cashflowByMonth, revenueTrend } from "./finance";
import { vowgraphSummary } from "./vowgraph";

export const CHART_METRICS = ["agreed_by_client", "money_by_stage", "cash_flow", "received_by_month", "invoice_status"] as const;
export type ChartMetric = (typeof CHART_METRICS)[number];

const STAGES = ["Request", "Agreement", "Delivery", "Approval", "Paid"];
function stageOf(status: string) {
  if (status === "completed") return 4;
  if (status === "awaiting_approval" || status === "payment_ready") return 3;
  if (["accepted", "in_progress", "awaiting_evidence"].includes(status)) return 2;
  if (status === "proposed" || status === "awaiting_acceptance") return 1;
  return 0;
}

/** Folds anything past the first `max` categories into "Other" (pie readability). */
function topN<T extends { label: string; value: number }>(rows: T[], max = 5) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  if (sorted.length <= max + 1) return sorted;
  const rest = sorted.slice(max).reduce((s, r) => s + r.value, 0);
  return [...sorted.slice(0, max), { label: "Other", value: rest } as T];
}

export async function chartData(db: Database, businessId: string, metric: ChartMetric, kind?: ChartKind): Promise<ChartSpec> {
  const [biz] = await db.select({ currency: businesses.currency }).from(businesses).where(eq(businesses.id, businessId));
  const currency = biz?.currency ?? "USD";

  if (metric === "agreed_by_client") {
    const rows = await vowgraphSummary(db, businessId, 50);
    const by = new Map<string, number>();
    for (const r of rows) by.set(r.clientName, (by.get(r.clientName) ?? 0) + r.agreedTotalMinor);
    const data = topN([...by].map(([label, value]) => ({ label, value }))).filter((d) => d.value > 0);
    return { kind: kind ?? "donut", title: "Agreed value by client", subtitle: "All open agreements", unit: "money", currency, series: [{ key: "value", label: "Agreed value" }], data };
  }

  if (metric === "money_by_stage") {
    const rows = await vowgraphSummary(db, businessId, 50);
    const data = STAGES.map((label) => ({ label, value: 0 }));
    for (const r of rows) data[stageOf(r.status)].value += r.agreedTotalMinor;
    return { kind: kind && kind !== "line" ? kind : "bar", title: "Money by stage", subtitle: "Where agreed value sits in the journey", unit: "money", currency, series: [{ key: "value", label: "Agreed value" }], data };
  }

  if (metric === "cash_flow") {
    const rows = await cashflowByMonth(db, businessId);
    return {
      kind: kind === "line" ? "line" : "bar",
      title: "Cash flow",
      subtitle: "Milestones due vs PayPal-confirmed money",
      unit: "money",
      currency,
      series: [
        { key: "expected", label: "Expected" },
        { key: "received", label: "Received" },
      ],
      data: rows.map((r) => ({ label: r.label, expected: r.scheduledMinor, received: r.receivedMinor })),
    };
  }

  if (metric === "received_by_month") {
    const rows = await revenueTrend(db, businessId, 6);
    return { kind: kind === "line" ? "line" : "bar", title: "Payments received", subtitle: "PayPal-confirmed, last 6 months", unit: "money", currency, series: [{ key: "value", label: "Received" }], data: rows.map((r) => ({ label: r.label, value: r.receivedMinor })) };
  }

  // invoice_status
  const rows = await db
    .select({ status: invoices.status, total: sql<string>`coalesce(sum(${invoices.amountMinor}),0)` })
    .from(invoices)
    .where(and(eq(invoices.businessId, businessId)))
    .groupBy(invoices.status);
  const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const data = topN(rows.map((r) => ({ label: label(r.status), value: Number(r.total) }))).filter((d) => d.value > 0);
  return { kind: kind ?? "pie", title: "PayPal invoices by status", subtitle: "Invoice value per status", unit: "money", currency, series: [{ key: "value", label: "Invoice value" }], data };
}
