"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { agentPermissions } from "@/server/db/schema";
import { effectivePolicy, policyDef } from "@/server/agents/policies";
import { recordAudit } from "@/server/services/audit";

const input = z.object({ tool: z.string().min(1).max(80), policy: z.enum(["allow", "approval", "deny"]) });

export type PolicyResult = { ok: boolean; message: string };

/** Owner/admin changes a TrustGate policy. Locked floors can never be relaxed. */
export async function updatePolicyAction(tool: string, policy: string): Promise<PolicyResult> {
  const ctx = await requireRole(["owner", "admin"]);
  const parsed = input.safeParse({ tool, policy });
  if (!parsed.success) return { ok: false, message: "Invalid setting" };
  const def = policyDef(parsed.data.tool);
  if (!def) return { ok: false, message: "Unknown tool" };
  if (effectivePolicy(def.tool, parsed.data.policy) !== parsed.data.policy) return { ok: false, message: `${def.label} always needs approval. This control is locked.` };

  const db = await getDb();
  const [before] = await db.select().from(agentPermissions).where(and(eq(agentPermissions.businessId, ctx.business.id), eq(agentPermissions.tool, def.tool)));
  if (before) {
    await db.update(agentPermissions).set({ policy: parsed.data.policy, updatedBy: ctx.user.id, updatedAt: new Date() }).where(eq(agentPermissions.id, before.id));
  } else {
    await db.insert(agentPermissions).values({ businessId: ctx.business.id, tool: def.tool, policy: parsed.data.policy, updatedBy: ctx.user.id });
  }
  await recordAudit(db, { businessId: ctx.business.id, actor: { type: "user", id: ctx.user.id }, action: "trustgate.policy_changed", entityType: "agent_permission", entityId: def.tool, before: { policy: before?.policy ?? def.defaultPolicy }, after: { policy: parsed.data.policy } });
  revalidatePath("/app/settings");
  return { ok: true, message: `${def.label}: ${parsed.data.policy === "allow" ? "allowed" : parsed.data.policy === "approval" ? "needs approval" : "blocked"}` };
}
