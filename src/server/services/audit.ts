import type { Database } from "@/server/db/create";
import { auditLogs, timelineEvents } from "@/server/db/schema";

type Actor = { type: "user" | "agent" | "system" | "paypal" | "client"; id?: string | null; label?: string | null };

/** `Database` or an open transaction — both expose insert(). */
type Writer = Pick<Database, "insert">;

export async function recordAudit(
  db: Writer,
  entry: {
    businessId: string | null;
    actor: Actor;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    ip?: string | null;
  },
) {
  await db.insert(auditLogs).values({
    businessId: entry.businessId,
    actorType: entry.actor.type,
    actorId: entry.actor.id ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    ip: entry.ip ?? null,
  });
}

/** Append to a commitment's timeline (feeds the Timeline, Evidence Vault and VowGraph). */
export async function recordTimeline(
  db: Writer,
  e: {
    businessId: string;
    commitmentId: string;
    kind: string;
    title: string;
    detail?: string | null;
    refType?: string | null;
    refId?: string | null;
    actor: Actor;
    amountMinor?: number | null;
  },
) {
  await db.insert(timelineEvents).values({
    businessId: e.businessId,
    commitmentId: e.commitmentId,
    kind: e.kind,
    title: e.title,
    detail: e.detail ?? null,
    refType: e.refType ?? null,
    refId: e.refId ?? null,
    actorType: e.actor.type,
    actorLabel: e.actor.label ?? null,
    amountMinor: e.amountMinor ?? null,
  });
}
