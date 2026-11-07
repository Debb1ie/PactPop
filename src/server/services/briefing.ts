import { and, desc, eq, inArray, lte, notInArray } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { approvals, clients, commitments, projectRequests, proposals } from "@/server/db/schema";
import { formatMoney } from "@/lib/money";

export type BriefingItem = {
  id: string;
  agent: string;
  title: string;
  detail: string;
  /** Natural-language command the console runs when the owner clicks "Run". */
  command?: string;
  href?: string;
  tone: "action" | "attention" | "info";
};

/**
 * Operations Agent briefing: next actions derived from live records. Deterministic, so it's
 * instant and costs nothing; each item hands off to the agents with a ready-made command.
 */
export async function buildBriefing(db: Database, businessId: string): Promise<BriefingItem[]> {
  const soon = new Date(Date.now() + 3 * 86_400_000);
  const [newReqs, analyzed, pending, sent, dueSoon] = await Promise.all([
    db.select().from(projectRequests).where(and(eq(projectRequests.businessId, businessId), inArray(projectRequests.status, ["new", "needs_info"]))).orderBy(desc(projectRequests.createdAt)).limit(3),
    db.select().from(projectRequests).where(and(eq(projectRequests.businessId, businessId), eq(projectRequests.status, "analyzed"))).limit(3),
    db.select().from(approvals).where(and(eq(approvals.businessId, businessId), eq(approvals.status, "pending"))).limit(5),
    db
      .select({ p: proposals, clientName: clients.name, company: clients.company })
      .from(proposals)
      .innerJoin(clients, eq(clients.id, proposals.clientId))
      .where(and(eq(proposals.businessId, businessId), eq(proposals.status, "sent")))
      .limit(3),
    db
      .select({ c: commitments, clientName: clients.name, company: clients.company })
      .from(commitments)
      .innerJoin(clients, eq(clients.id, commitments.clientId))
      .where(and(eq(commitments.businessId, businessId), notInArray(commitments.status, ["completed", "cancelled", "draft"]), lte(commitments.dueDate, soon)))
      .limit(3),
  ]);

  const items: BriefingItem[] = [];
  for (const a of pending)
    items.push({ id: `appr-${a.id}`, agent: "TrustGate", title: a.title, detail: `${a.amountMinor != null ? `${formatMoney(a.amountMinor)} · ` : ""}needs your decision`, href: "/app/approvals", tone: "attention" });
  for (const r of newReqs) {
    const who = r.company ?? r.contactName;
    items.push({ id: `req-${r.id}`, agent: "Intake Agent", title: `Analyse ${who}'s request`, detail: r.status === "needs_info" ? "Missing details. Prepare follow-up questions." : "New request, not yet analysed", command: `Analyse the new request from ${who}`, tone: "action" });
  }
  for (const r of analyzed) {
    const who = r.company ?? r.contactName;
    items.push({ id: `prop-${r.id}`, agent: "Proposal Agent", title: `Draft a proposal for ${who}`, detail: "Request analysed and ready to price", command: `Draft a proposal for ${who}`, tone: "action" });
  }
  for (const s of sent) {
    const days = Math.floor((Date.now() - s.p.updatedAt.getTime()) / 86_400_000);
    if (days >= 2) items.push({ id: `sent-${s.p.id}`, agent: "Operations Agent", title: `${s.company ?? s.clientName} hasn't replied`, detail: `Proposal sent ${days} days ago · ${formatMoney(s.p.totalMinor)}`, tone: "info" });
  }
  for (const d of dueSoon) {
    const days = Math.ceil(((d.c.dueDate?.getTime() ?? Date.now()) - Date.now()) / 86_400_000);
    items.push({ id: `due-${d.c.id}`, agent: "Operations Agent", title: `${d.c.title} for ${d.company ?? d.clientName}`, detail: days < 0 ? `${-days} day(s) past due` : `Due in ${days} day(s)`, tone: days < 0 ? "attention" : "info" });
  }
  return items.slice(0, 6);
}
