import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { changeOrders, clients, commitments, milestones } from "@/server/db/schema";

/**
 * VowGraph summary for the dashboard: each open commitment with its milestones (paid or not)
 * and its pending change orders. Built from real foreign keys, not decoration.
 */
export async function vowgraphSummary(db: Database, businessId: string, limit = 6) {
  const rows = await db
    .select({ c: commitments, clientName: clients.name, clientId: clients.id, company: clients.company })
    .from(commitments)
    .innerJoin(clients, eq(clients.id, commitments.clientId))
    .where(and(eq(commitments.businessId, businessId), notInArray(commitments.status, ["cancelled"])))
    .orderBy(desc(commitments.agreedTotalMinor))
    .limit(limit);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.c.id);
  const [ms, cos] = await Promise.all([
    db.select().from(milestones).where(and(eq(milestones.businessId, businessId), inArray(milestones.commitmentId, ids))),
    db
      .select()
      .from(changeOrders)
      .where(and(eq(changeOrders.businessId, businessId), inArray(changeOrders.commitmentId, ids), inArray(changeOrders.status, ["draft", "pending_owner_approval", "owner_approved"]))),
  ]);
  return rows.map(({ c, clientName, clientId, company }) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    version: c.currentVersion,
    dueDate: c.dueDate ? c.dueDate.toISOString() : null,
    agreedTotalMinor: c.agreedTotalMinor,
    currency: c.currency,
    clientId,
    clientName: company ?? clientName,
    milestones: ms.filter((m) => m.commitmentId === c.id).sort((a, b) => a.position - b.position).map((m) => ({ title: m.title, paid: m.status === "paid", status: m.status, kind: m.kind, amountMinor: m.amountMinor })),
    pendingChangeOrders: cos.filter((o) => o.commitmentId === c.id).map((o) => ({ title: o.title, amountMinor: o.amountMinor })),
  }));
}
