import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { businesses, clients, commitments, commitmentVersions, invoices, milestones, proposals } from "@/server/db/schema";
import { recordAudit, recordTimeline } from "./audit";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Create (or rotate) the client's agreement link for a commitment's proposal. Only the SHA-256 of
 * the token is stored; generating a new link invalidates the previous one.
 */
export async function issueAgreementLink(db: Database, businessId: string, commitmentId: string, actor: { id: string; label: string }) {
  const [c] = await db.select().from(commitments).where(and(eq(commitments.id, commitmentId), eq(commitments.businessId, businessId))).limit(1);
  if (!c?.proposalId) return { ok: false as const, message: "This agreement has no proposal to share" };
  if (["cancelled", "completed"].includes(c.status)) return { ok: false as const, message: `This agreement is ${c.status}` };
  const token = randomBytes(24).toString("base64url");
  await db.update(proposals).set({ acceptTokenHash: hash(token), updatedAt: new Date() }).where(and(eq(proposals.id, c.proposalId), eq(proposals.businessId, businessId)));
  await recordAudit(db, { businessId, actor: { type: "user", id: actor.id, label: actor.label }, action: "agreement.link_issued", entityType: "commitment", entityId: c.id });
  return { ok: true as const, token };
}

/** Everything the client page needs, looked up by the secret token. */
export async function agreementByToken(db: Database, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [row] = await db
    .select({ p: proposals, c: commitments, biz: businesses, client: clients })
    .from(proposals)
    .innerJoin(commitments, eq(commitments.proposalId, proposals.id))
    .innerJoin(businesses, eq(businesses.id, proposals.businessId))
    .innerJoin(clients, eq(clients.id, proposals.clientId))
    .where(eq(proposals.acceptTokenHash, hash(token)))
    .limit(1);
  if (!row) return null;
  const ms = await db
    .select({ m: milestones, invoiceUrl: invoices.payerViewUrl, invoiceStatus: invoices.status })
    .from(milestones)
    .leftJoin(invoices, eq(invoices.milestoneId, milestones.id))
    .where(eq(milestones.commitmentId, row.c.id))
    .orderBy(asc(milestones.position));
  return { ...row, milestones: ms };
}

/**
 * Client accepts the agreement: proposal → accepted, commitment → accepted, version 1 snapshot,
 * milestones created from the proposal's plan. Amounts come from the stored proposal only.
 */
export async function acceptAgreement(db: Database, token: string, input: { name: string; ip: string }) {
  const a = await agreementByToken(db, token);
  if (!a) return { ok: false as const, message: "This link is no longer valid" };
  if (a.p.status === "accepted" || !["awaiting_acceptance", "proposed"].includes(a.c.status)) return { ok: true as const, message: "Already accepted" };

  await db.transaction(async (tx) => {
    const now = new Date();
    await tx.update(proposals).set({ status: "accepted", acceptedAt: now, acceptedByName: input.name, acceptedFromIp: input.ip, updatedAt: now }).where(eq(proposals.id, a.p.id));
    const due = new Date(now.getTime() + a.p.timelineDays * 86_400_000);
    await tx.update(commitments).set({ status: "accepted", startDate: now, dueDate: due, agreedTotalMinor: a.p.totalMinor, updatedAt: now }).where(eq(commitments.id, a.c.id));
    const [v] = await tx.select({ id: commitmentVersions.id }).from(commitmentVersions).where(and(eq(commitmentVersions.commitmentId, a.c.id), eq(commitmentVersions.version, 1))).limit(1);
    if (!v)
      await tx.insert(commitmentVersions).values({ businessId: a.p.businessId, commitmentId: a.c.id, version: 1, scopeItems: a.p.scopeItems, exclusions: a.p.exclusions, totalMinor: a.p.totalMinor, reason: `Accepted by ${input.name}` });
    if (a.milestones.length === 0) {
      await tx.insert(milestones).values(
        a.p.milestonePlan.map((m, i) => ({
          businessId: a.p.businessId,
          commitmentId: a.c.id,
          title: m.title,
          kind: m.kind,
          amountMinor: m.amountMinor,
          currency: a.p.currency,
          position: i,
          dueDate: new Date(now.getTime() + m.dueInDays * 86_400_000),
          status: "pending" as const,
        })),
      );
    }
    await recordTimeline(tx, { businessId: a.p.businessId, commitmentId: a.c.id, kind: "proposal.accepted", title: "Agreement accepted by client", detail: `Accepted online by ${input.name}`, refType: "proposal", refId: a.p.id, actor: { type: "client", label: input.name }, amountMinor: a.p.totalMinor });
    await recordAudit(tx, { businessId: a.p.businessId, actor: { type: "client", label: input.name }, action: "agreement.accepted", entityType: "commitment", entityId: a.c.id, ip: input.ip, after: { totalMinor: a.p.totalMinor } });
  });
  return { ok: true as const, message: "Agreement accepted" };
}
