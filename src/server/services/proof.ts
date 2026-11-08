/**
 * ProofFlow: delivery evidence checked against the agreed acceptance criteria.
 * The AI judges evidence (as untrusted data); code decides what happens next. A milestone only
 * becomes payable after the owner approves the delivery (locked TrustGate floor).
 */
import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { approvals, clients, commitments, deliverables, evidenceFiles, milestones, type VerificationReport } from "@/server/db/schema";
import { formatMoney } from "@/lib/money";
import { recordAudit, recordTimeline } from "./audit";

type Actor = { type: "user" | "agent" | "system"; id?: string | null; label?: string | null };

/** Deliverables with their criteria and evidence, for review. */
export async function listProof(db: Database, businessId: string, opts: { client?: string; deliverableId?: string; openOnly?: boolean } = {}) {
  const conds = [eq(deliverables.businessId, businessId)];
  if (opts.deliverableId) conds.push(eq(deliverables.id, opts.deliverableId));
  if (opts.openOnly) conds.push(inArray(deliverables.status, ["submitted", "needs_changes"]));
  if (opts.client) conds.push(or(ilike(clients.name, `%${opts.client}%`), ilike(clients.company, `%${opts.client}%`))!);
  const rows = await db
    .select({ d: deliverables, client: clients.company, clientName: clients.name, agreement: commitments.title, milestone: milestones.title, milestoneAmount: milestones.amountMinor, milestoneStatus: milestones.status })
    .from(deliverables)
    .innerJoin(commitments, eq(commitments.id, deliverables.commitmentId))
    .innerJoin(clients, eq(clients.id, commitments.clientId))
    .leftJoin(milestones, eq(milestones.id, deliverables.milestoneId))
    .where(and(...conds))
    .orderBy(asc(deliverables.createdAt));
  const ids = rows.map((r) => r.d.id);
  const ev = ids.length ? await db.select().from(evidenceFiles).where(and(eq(evidenceFiles.businessId, businessId), inArray(evidenceFiles.deliverableId, ids))) : [];
  return rows.map((r) => ({ ...r, client: r.client ?? r.clientName, evidence: ev.filter((e) => e.deliverableId === r.d.id) }));
}

/**
 * Store ProofFlow's review. Criteria are matched against the deliverable's own list, so the model
 * can't invent passes. When every deliverable for the milestone is verified, an owner approval
 * "Approve delivery" is queued; approving it is what makes the payment due.
 */
export async function saveProofReview(
  db: Database,
  businessId: string,
  input: { deliverableId: string; verified: string[]; missing: string[]; issues: string[]; suggestions?: string[]; summary: string; analyzedBy: "ai" | "heuristic" },
  meta: { reasoning: string; executionId?: string | null },
) {
  const [row] = await listProof(db, businessId, { deliverableId: input.deliverableId });
  if (!row) throw new Error("Deliverable not found");
  if (!["submitted", "needs_changes", "verified"].includes(row.d.status)) throw new Error(`This deliverable is ${row.d.status}; there is no submitted proof to check`);

  const criteria = row.d.acceptanceCriteria;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const known = new Map(criteria.map((c) => [norm(c), c]));
  const verified = input.verified.map((v) => known.get(norm(v))).filter((v): v is string => Boolean(v));
  const missing = criteria.filter((c) => !verified.includes(c));
  const passed = missing.length === 0 && input.issues.length === 0 && row.evidence.length > 0;

  const report: VerificationReport = {
    verified,
    missing: [...new Set([...missing, ...input.missing.filter((m) => !known.has(norm(m)))])],
    issues: row.evidence.length === 0 ? ["No evidence attached", ...input.issues] : input.issues,
    suggestions: input.suggestions ?? [],
    summary: input.summary.slice(0, 600),
    analyzedBy: input.analyzedBy,
    analyzedAt: new Date().toISOString(),
  };
  await db.update(deliverables).set({ status: passed ? "verified" : "needs_changes", verification: report, updatedAt: new Date() }).where(eq(deliverables.id, row.d.id));
  await recordTimeline(db, {
    businessId,
    commitmentId: row.d.commitmentId,
    kind: passed ? "deliverable.verified" : "deliverable.needs_changes",
    title: passed ? `ProofFlow: ${row.d.title} meets all ${criteria.length} criteria` : `ProofFlow: ${row.d.title} needs changes (${report.missing.length + report.issues.length} open)`,
    refType: "deliverable",
    refId: row.d.id,
    actor: { type: "agent", label: "ProofFlow Agent" },
  });

  let approval: typeof approvals.$inferSelect | null = null;
  let openForMilestone = 0;
  if (passed && row.d.milestoneId) {
    const siblings = await db.select({ status: deliverables.status }).from(deliverables).where(and(eq(deliverables.businessId, businessId), eq(deliverables.milestoneId, row.d.milestoneId)));
    openForMilestone = siblings.filter((s) => !["verified", "approved"].includes(s.status)).length;
    const [already] = await db
      .select({ id: approvals.id })
      .from(approvals)
      .where(and(eq(approvals.businessId, businessId), eq(approvals.actionType, "deliverables.approve"), eq(approvals.status, "pending"), eq(approvals.commitmentId, row.d.commitmentId)))
      .limit(1);
    if (openForMilestone === 0 && !already && row.milestoneStatus && !["approved", "invoiced", "paid"].includes(row.milestoneStatus)) {
      const [c] = await db.select({ clientId: commitments.clientId }).from(commitments).where(eq(commitments.id, row.d.commitmentId));
      [approval] = await db
        .insert(approvals)
        .values({
          businessId,
          actionType: "deliverables.approve",
          title: `Approve delivery: ${row.client} · ${row.milestone}`,
          payload: { milestoneId: row.d.milestoneId, commitmentId: row.d.commitmentId },
          amountMinor: row.milestoneAmount,
          currency: "USD",
          commitmentId: row.d.commitmentId,
          clientId: c?.clientId ?? null,
          reasoningSummary: `ProofFlow checked every deliverable for this milestone against its acceptance criteria. Approving makes ${row.milestoneAmount != null ? formatMoney(row.milestoneAmount) : "the payment"} due.`,
          requestedByExecutionId: meta.executionId ?? null,
          status: "pending",
        })
        .returning();
    }
  }
  await recordAudit(db, { businessId, actor: { type: "agent", label: "ProofFlow Agent" }, action: "deliverable.reviewed", entityType: "deliverable", entityId: row.d.id, after: { passed, verified: verified.length, missing: report.missing.length } });
  return { passed, report, criteria, approval, openForMilestone, deliverable: row.d.title };
}

/** Executor for an approved "deliverables.approve": the milestone becomes due. */
export async function approveDelivery(db: Database, businessId: string, milestoneId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [m] = await tx.select().from(milestones).where(and(eq(milestones.id, milestoneId), eq(milestones.businessId, businessId)));
    if (!m) throw new Error("Milestone not found");
    if (["invoiced", "paid"].includes(m.status)) return { milestoneId, status: m.status };
    await tx.update(milestones).set({ status: "approved", updatedAt: new Date() }).where(eq(milestones.id, m.id));
    await tx
      .update(deliverables)
      .set({ status: "approved", approvedBy: userId, approvedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(deliverables.milestoneId, m.id), eq(deliverables.status, "verified")));
    await recordTimeline(tx, { businessId, commitmentId: m.commitmentId, kind: "delivery.approved", title: `Delivery approved: ${m.title} is now due`, refType: "milestone", refId: m.id, actor: { type: "user", label: "You" }, amountMinor: m.amountMinor });
    await recordAudit(tx, { businessId, actor: { type: "user", id: userId }, action: "milestone.approved", entityType: "milestone", entityId: m.id });
    return { milestoneId, status: "approved" };
  });
}

/** Owner submits delivery proof: notes plus links, attached to a deliverable. */
export async function submitProof(db: Database, businessId: string, input: { deliverableId: string; notes: string; links: string[] }, actor: Actor) {
  const [row] = await listProof(db, businessId, { deliverableId: input.deliverableId });
  if (!row) throw new Error("Deliverable not found");
  if (row.d.status === "approved") throw new Error("This deliverable is already approved");
  await db.update(deliverables).set({ status: "submitted", submissionNotes: input.notes, updatedAt: new Date() }).where(eq(deliverables.id, row.d.id));
  const rows = [
    ...input.links.map((u) => ({ businessId, commitmentId: row.d.commitmentId, deliverableId: row.d.id, kind: "url", label: new URL(u).hostname, url: u, uploadedBy: actor.id ?? null })),
    ...(input.notes ? [{ businessId, commitmentId: row.d.commitmentId, deliverableId: row.d.id, kind: "note", label: "Delivery notes", note: input.notes, uploadedBy: actor.id ?? null }] : []),
  ];
  if (rows.length) await db.insert(evidenceFiles).values(rows);
  await recordTimeline(db, { businessId, commitmentId: row.d.commitmentId, kind: "deliverable.submitted", title: `Proof submitted: ${row.d.title}`, refType: "deliverable", refId: row.d.id, actor: { type: actor.type, label: actor.label ?? "You" } });
  return { deliverable: row.d.title };
}
