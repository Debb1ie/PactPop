"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { decideApproval } from "@/server/services/workflow";

export type DecisionResult = { ok: boolean; message: string };

/** Owner/admin decision on a TrustGate approval. Executes the action on approve. */
export async function decideApprovalAction(approvalId: string, decision: "approve" | "reject"): Promise<DecisionResult> {
  const ctx = await requireRole(["owner", "admin"]);
  if (!z.string().uuid().safeParse(approvalId).success) return { ok: false, message: "Invalid approval" };
  const db = await getDb();
  try {
    const r = await decideApproval(db, ctx.business.id, ctx.user.id, approvalId, decision);
    revalidatePath("/app", "layout");
    if (r.status === "executed") return { ok: true, message: "Approved and applied" };
    if (r.status === "rejected") return { ok: true, message: "Rejected" };
    return { ok: false, message: r.error ?? "The action couldn't be completed" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong" };
  }
}
