/**
 * Commercial workflow operations used by agent tools and by the Approval Center.
 * Every amount is computed by the pricing engine from business rules. Callers (including AI
 * agents) supply units of work, never prices.
 */
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import {
  approvals,
  businesses,
  changeOrders,
  clients,
  commitments,
  commitmentVersions,
  milestones,
  projectRequests,
  proposals,
  scopeChanges,
  type RequestExtraction,
  type ScopeItem,
} from "@/server/db/schema";
import { formatMoney } from "@/lib/money";
import { recordAudit, recordTimeline } from "./audit";
import { planMilestones, quoteChangeOrder, quoteProject, type Estimate } from "./pricing";

type Actor = { type: "user" | "agent"; id?: string | null; label: string };

export async function getRules(db: Database, businessId: string) {
  const [b] = await db.select({ rules: businesses.pricingRules, currency: businesses.currency }).from(businesses).where(eq(businesses.id, businessId));
  return b;
}

/* ───────── requests (Intake) ───────── */

export async function listRequests(db: Database, businessId: string, statuses?: string[]) {
  return db
    .select({ r: projectRequests, clientName: clients.name })
    .from(projectRequests)
    .leftJoin(clients, eq(clients.id, projectRequests.clientId))
    .where(and(eq(projectRequests.businessId, businessId), statuses?.length ? inArray(projectRequests.status, statuses as never[]) : undefined))
    .orderBy(desc(projectRequests.createdAt))
    .limit(20);
}

export async function getRequest(db: Database, businessId: string, requestId: string) {
  return db.query.projectRequests.findFirst({ where: and(eq(projectRequests.businessId, businessId), eq(projectRequests.id, requestId)) });
}

export async function saveRequestAnalysis(db: Database, businessId: string, requestId: string, analysis: RequestExtraction, actor: Actor) {
  const req = await getRequest(db, businessId, requestId);
  if (!req) throw new Error("Request not found");
  const status = analysis.missingInfo.length > 2 ? "needs_info" : "analyzed";
  await db.update(projectRequests).set({ extracted: analysis, status, updatedAt: new Date() }).where(eq(projectRequests.id, requestId));
  await recordAudit(db, { businessId, actor: { type: actor.type, id: actor.id ?? null }, action: "request.analyzed", entityType: "project_request", entityId: requestId, after: analysis });
  return { status, request: { ...req, extracted: analysis, status } };
}

/* ───────── pricing & proposals ───────── */

export async function quote(db: Database, businessId: string, estimate: Estimate) {
  const { rules, currency } = await getRules(db, businessId);
  const q = quoteProject(estimate, rules);
  return { ...q, currency, totalFormatted: formatMoney(q.totalMinor, currency) };
}

export async function draftProposal(
  db: Database,
  businessId: string,
  input: {
    requestId: string;
    title: string;
    summary: string;
    scopeItems: ScopeItem[];
    exclusions: string[];
    acceptanceCriteria: string[];
    estimate: Estimate;
    timelineDays: number;
  },
  actor: Actor,
) {
  const req = await getRequest(db, businessId, input.requestId);
  if (!req) throw new Error("Request not found");
  if (!req.clientId) throw new Error("Request has no client yet");
  const { rules, currency } = await getRules(db, businessId);
  const q = quoteProject(input.estimate, rules);
  if (q.unknownFeatures.length) throw new Error(`Unknown features need hours first: ${q.unknownFeatures.join(", ")}`);
  const plan = planMilestones(q.totalMinor, rules, input.timelineDays);

  const [p] = await db
    .insert(proposals)
    .values({
      businessId,
      requestId: req.id,
      clientId: req.clientId,
      title: input.title,
      summary: input.summary,
      scopeItems: input.scopeItems,
      exclusions: input.exclusions,
      acceptanceCriteria: input.acceptanceCriteria,
      pricing: q.breakdown,
      totalMinor: q.totalMinor,
      currency,
      milestonePlan: plan,
      timelineDays: input.timelineDays,
      paymentTerms: `${rules.depositPercent}% deposit on acceptance, ${100 - rules.depositPercent}% on final delivery.`,
      status: "draft",
      generatedBy: actor.type === "agent" ? "agent" : "user",
      isDemo: req.isDemo,
    })
    .returning();
  await db.update(projectRequests).set({ status: "proposal_drafted", updatedAt: new Date() }).where(eq(projectRequests.id, req.id));
  await recordAudit(db, { businessId, actor: { type: actor.type, id: actor.id ?? null }, action: "proposal.drafted", entityType: "proposal", entityId: p.id, after: { totalMinor: p.totalMinor } });
  return { proposal: p, breakdown: q.breakdown, totalFormatted: formatMoney(q.totalMinor, currency), milestones: plan };
}

export async function listProposals(db: Database, businessId: string) {
  return db
    .select({ p: proposals, clientName: clients.name })
    .from(proposals)
    .innerJoin(clients, eq(clients.id, proposals.clientId))
    .where(eq(proposals.businessId, businessId))
    .orderBy(desc(proposals.createdAt))
    .limit(20);
}

/* ───────── commitments ───────── */

export async function findCommitments(db: Database, businessId: string, query?: string) {
  const q = query?.trim();
  return db
    .select({ c: commitments, clientName: clients.name, company: clients.company })
    .from(commitments)
    .innerJoin(clients, eq(clients.id, commitments.clientId))
    .where(
      and(
        eq(commitments.businessId, businessId),
        q ? or(ilike(commitments.title, `%${q}%`), ilike(clients.name, `%${q}%`), ilike(clients.company, `%${q}%`)) : undefined,
      ),
    )
    .orderBy(desc(commitments.updatedAt))
    .limit(10);
}

export async function getCommitmentDetail(db: Database, businessId: string, commitmentId: string) {
  const c = await db.query.commitments.findFirst({
    where: and(eq(commitments.businessId, businessId), eq(commitments.id, commitmentId)),
    with: { client: true, milestones: true, versions: true, changeOrders: true, scopeChanges: true },
  });
  if (!c) return null;
  const latest = [...c.versions].sort((a, b) => b.version - a.version)[0];
  return { ...c, latestVersion: latest ?? null };
}

/* ───────── ScopeWatch ───────── */

export type ScopeAdditionInput = { item: string; rationale: string; pages: number; hours: number };

/**
 * Records a scope comparison. If there are additions, drafts a change order priced by the engine
 * and queues it for owner approval. The accepted agreement is never modified here.
 */
export async function recordScopeChange(
  db: Database,
  businessId: string,
  input: { commitmentId: string; requestText: string; classification: "included" | "clarification" | "revision" | "additional"; additions: ScopeAdditionInput[]; summary: string },
  actor: Actor,
  meta: { executionId?: string | null; reasoning: string },
) {
  const c = await getCommitmentDetail(db, businessId, input.commitmentId);
  if (!c) throw new Error("Commitment not found");
  const { rules, currency } = await getRules(db, businessId);

  // Don't draft the same change twice: if a pending change order already covers these items, reuse it.
  const norm = (t: string) => t.toLowerCase().replace(/\s+page$/, "").trim();
  const wanted = new Set(input.additions.map((a) => norm(a.item)));
  if (wanted.size) {
    const dup = c.changeOrders.find((o) => o.status === "pending_owner_approval" && o.items.length === wanted.size && o.items.every((it) => wanted.has(norm(it.title))));
    if (dup) {
      const [pendingApproval] = await db
        .select()
        .from(approvals)
        .where(and(eq(approvals.businessId, businessId), eq(approvals.status, "pending"), eq(approvals.commitmentId, c.id)))
        .limit(1);
      return { scopeChange: null, changeOrder: dup, approval: pendingApproval ?? null, totalFormatted: formatMoney(dup.amountMinor, currency), breakdown: dup.pricing, duplicate: true as const };
    }
  }

  const [scope] = await db
    .insert(scopeChanges)
    .values({
      businessId,
      commitmentId: c.id,
      requestText: input.requestText,
      baselineVersion: c.currentVersion,
      status: input.additions.length ? "change_order_proposed" : "within_scope",
      analysis: {
        withinScope: input.additions.length ? [] : [input.requestText],
        additions: input.additions.map((a) => ({ item: a.item, rationale: a.rationale, estimatedHours: a.hours, pages: a.pages })),
        summary: input.summary,
        analyzedBy: actor.type === "agent" && actor.label.includes("rule") ? "heuristic" : "ai",
      },
    })
    .returning();
  await recordTimeline(db, {
    businessId,
    commitmentId: c.id,
    kind: "scope.detected",
    title: input.additions.length ? `ScopeWatch: ${input.additions.length} item(s) outside agreed scope` : `ScopeWatch: request is ${input.classification.replace("_", " ")}`,
    refType: "scope_change",
    refId: scope.id,
    actor: { type: "agent", label: "Scope Agent" },
  });

  if (!input.additions.length) return { scopeChange: scope, changeOrder: null, approval: null };

  const pages = input.additions.reduce((s, a) => s + a.pages, 0);
  const hours = input.additions.reduce((s, a) => s + a.hours, 0);
  const q = quoteChangeOrder({ pages, hours }, rules);
  const [co] = await db
    .insert(changeOrders)
    .values({
      businessId,
      commitmentId: c.id,
      scopeChangeId: scope.id,
      title: input.additions.map((a) => a.item).join(", ").slice(0, 120),
      items: input.additions.map((a) => ({ title: a.item, detail: a.rationale })),
      pricing: q.breakdown,
      amountMinor: q.totalMinor,
      currency,
      status: "pending_owner_approval",
    })
    .returning();
  const [approval] = await db
    .insert(approvals)
    .values({
      businessId,
      actionType: "change_orders.apply",
      title: `Approve change order: ${co.title}`,
      payload: { changeOrderId: co.id, commitmentId: c.id },
      amountMinor: co.amountMinor,
      currency,
      commitmentId: c.id,
      clientId: c.clientId,
      reasoningSummary: meta.reasoning,
      requestedByExecutionId: meta.executionId ?? null,
      status: "pending",
    })
    .returning();
  await recordTimeline(db, {
    businessId,
    commitmentId: c.id,
    kind: "change_order.drafted",
    title: `Change order drafted, waiting for your approval`,
    refType: "change_order",
    refId: co.id,
    actor: { type: "agent", label: "Pricing Agent" },
    amountMinor: co.amountMinor,
  });
  await recordAudit(db, { businessId, actor: { type: actor.type, id: actor.id ?? null }, action: "change_order.drafted", entityType: "change_order", entityId: co.id, after: { amountMinor: co.amountMinor } });
  return { scopeChange: scope, changeOrder: co, approval, totalFormatted: formatMoney(co.amountMinor, currency), breakdown: q.breakdown };
}

/* ───────── approvals ───────── */

export async function listApprovals(db: Database, businessId: string, status: "pending" | "decided" = "pending") {
  return db
    .select({ a: approvals, clientName: clients.name, commitmentTitle: commitments.title })
    .from(approvals)
    .leftJoin(clients, eq(clients.id, approvals.clientId))
    .leftJoin(commitments, eq(commitments.id, approvals.commitmentId))
    .where(and(eq(approvals.businessId, businessId), status === "pending" ? eq(approvals.status, "pending") : inArray(approvals.status, ["approved", "rejected", "executed", "failed", "changes_requested"])))
    .orderBy(desc(approvals.createdAt))
    .limit(30);
}

export async function queueApproval(
  db: Database,
  businessId: string,
  input: { actionType: string; title: string; payload: Record<string, unknown>; reasoning: string; amountMinor?: number | null; commitmentId?: string | null; clientId?: string | null; executionId?: string | null },
) {
  const [a] = await db
    .insert(approvals)
    .values({
      businessId,
      actionType: input.actionType,
      title: input.title,
      payload: input.payload,
      reasoningSummary: input.reasoning,
      amountMinor: input.amountMinor ?? null,
      currency: input.amountMinor != null ? "USD" : null,
      commitmentId: input.commitmentId ?? null,
      clientId: input.clientId ?? null,
      requestedByExecutionId: input.executionId ?? null,
      status: "pending",
    })
    .returning();
  return a;
}

/** Executes an approved action. Only the business owner/admin reaches this (enforced by the caller). */
async function executeApproved(db: Database, businessId: string, a: typeof approvals.$inferSelect, userId: string) {
  const user = { type: "user" as const, id: userId };
  if (a.actionType === "change_orders.apply") {
    const changeOrderId = String(a.payload.changeOrderId);
    return db.transaction(async (tx) => {
      const co = await tx.query.changeOrders.findFirst({ where: and(eq(changeOrders.businessId, businessId), eq(changeOrders.id, changeOrderId)) });
      if (!co || co.status !== "pending_owner_approval") throw new Error("Change order is no longer pending");
      const c = await tx.query.commitments.findFirst({ where: and(eq(commitments.businessId, businessId), eq(commitments.id, co.commitmentId)), with: { versions: true, milestones: true } });
      if (!c) throw new Error("Commitment not found");
      const prev = [...c.versions].sort((x, y) => y.version - x.version)[0];
      const nextVersion = c.currentVersion + 1;
      const newTotal = c.agreedTotalMinor + co.amountMinor;
      // New immutable version: the previous agreement is preserved, never edited.
      await tx.insert(commitmentVersions).values({
        businessId,
        commitmentId: c.id,
        version: nextVersion,
        scopeItems: [...(prev?.scopeItems ?? []), ...co.items],
        exclusions: prev?.exclusions ?? [],
        totalMinor: newTotal,
        reason: `Change order approved: ${co.title}`,
        changeOrderId: co.id,
        createdBy: userId,
      });
      await tx.update(commitments).set({ currentVersion: nextVersion, agreedTotalMinor: newTotal, updatedAt: new Date() }).where(eq(commitments.id, c.id));
      const [ms] = await tx
        .insert(milestones)
        .values({ businessId, commitmentId: c.id, title: `Change order: ${co.title}`.slice(0, 120), kind: "change_order", amountMinor: co.amountMinor, currency: co.currency, position: c.milestones.length, changeOrderId: co.id, status: "pending" })
        .returning();
      await tx.update(changeOrders).set({ status: "owner_approved", approvedBy: userId, approvedAt: new Date(), updatedAt: new Date() }).where(eq(changeOrders.id, co.id));
      if (co.scopeChangeId) await tx.update(scopeChanges).set({ status: "accepted", updatedAt: new Date() }).where(eq(scopeChanges.id, co.scopeChangeId));
      await recordTimeline(tx, { businessId, commitmentId: c.id, kind: "change_order.approved", title: `Change order approved: agreement now v${nextVersion}`, refType: "change_order", refId: co.id, actor: { type: "user", label: "You" }, amountMinor: co.amountMinor });
      await recordAudit(tx, { businessId, actor: user, action: "commitment.amount_changed", entityType: "commitment", entityId: c.id, before: { agreedTotalMinor: c.agreedTotalMinor, version: c.currentVersion }, after: { agreedTotalMinor: newTotal, version: nextVersion } });
      return { commitmentId: c.id, version: nextVersion, agreedTotalMinor: newTotal, milestoneId: ms.id };
    });
  }
  if (a.actionType === "proposals.send") {
    const proposalId = String(a.payload.proposalId);
    const p = await db.query.proposals.findFirst({ where: and(eq(proposals.businessId, businessId), eq(proposals.id, proposalId)) });
    if (!p) throw new Error("Proposal not found");
    await db.update(proposals).set({ status: "sent", ownerApprovedAt: new Date(), ownerApprovedBy: userId, updatedAt: new Date() }).where(eq(proposals.id, p.id));
    await recordAudit(db, { businessId, actor: user, action: "proposal.sent", entityType: "proposal", entityId: p.id });
    return { proposalId: p.id, status: "sent" };
  }
  if (a.actionType === "paypal.send_invoice") {
    // Loaded lazily: the PayPal client is server-only and this module is also used by tests.
    const { sendMilestoneInvoice } = await import("@/server/paypal/invoices");
    const r = await sendMilestoneInvoice(db, { businessId, milestoneId: String(a.payload.milestoneId), userId, userName: "You (approved PayFlow Agent)" });
    if (!r.ok) throw new Error(r.message);
    return { invoiceNumber: r.invoice.invoiceNumber, status: r.invoice.status, payerViewUrl: r.invoice.payerViewUrl };
  }
  throw new Error(`No executor for ${a.actionType}`);
}

export async function decideApproval(db: Database, businessId: string, userId: string, approvalId: string, decision: "approve" | "reject", note?: string) {
  const a = await db.query.approvals.findFirst({ where: and(eq(approvals.businessId, businessId), eq(approvals.id, approvalId)) });
  if (!a) throw new Error("Approval not found");
  if (a.status !== "pending") throw new Error("This approval was already decided");

  if (decision === "reject") {
    await db.update(approvals).set({ status: "rejected", decidedBy: userId, decidedAt: new Date(), decisionNote: note ?? null, updatedAt: new Date() }).where(eq(approvals.id, a.id));
    if (a.actionType === "change_orders.apply") {
      await db.update(changeOrders).set({ status: "rejected", updatedAt: new Date() }).where(eq(changeOrders.id, String(a.payload.changeOrderId)));
      if (a.commitmentId)
        await recordTimeline(db, { businessId, commitmentId: a.commitmentId, kind: "change_order.rejected", title: "Change order rejected", actor: { type: "user", label: "You" }, amountMinor: a.amountMinor });
    }
    await recordAudit(db, { businessId, actor: { type: "user", id: userId }, action: "approval.rejected", entityType: "approval", entityId: a.id });
    return { status: "rejected" as const };
  }

  try {
    const result = await executeApproved(db, businessId, a, userId);
    await db.update(approvals).set({ status: "executed", decidedBy: userId, decidedAt: new Date(), decisionNote: note ?? null, result, updatedAt: new Date() }).where(eq(approvals.id, a.id));
    await recordAudit(db, { businessId, actor: { type: "user", id: userId }, action: "approval.executed", entityType: "approval", entityId: a.id, after: result });
    return { status: "executed" as const, result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Execution failed";
    await db.update(approvals).set({ status: "failed", decidedBy: userId, decidedAt: new Date(), result: { error: message }, updatedAt: new Date() }).where(eq(approvals.id, a.id));
    return { status: "failed" as const, error: message };
  }
}
