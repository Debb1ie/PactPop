"use server";

import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { env } from "@/server/env";
import { issueAgreementLink } from "@/server/services/agreements";
import { submitProof } from "@/server/services/proof";
import { revalidatePath } from "next/cache";

/** Owner attaches delivery proof for ProofFlow. Links must be https; text is stored as untrusted data. */
export async function submitProofAction(deliverableId: string, notes: string, linksText: string): Promise<{ ok: boolean; message: string }> {
  const ctx = await requireRole(["owner", "admin"]);
  if (!z.string().uuid().safeParse(deliverableId).success) return { ok: false, message: "Invalid deliverable" };
  const n = notes.trim();
  if (n.length < 5 || n.length > 2000) return { ok: false, message: "Describe what you delivered (5 to 2000 characters)" };
  const links = linksText.split(/\s+/).map((l) => l.trim()).filter(Boolean);
  if (links.length > 10) return { ok: false, message: "Add at most 10 links" };
  for (const l of links) {
    try {
      if (new URL(l).protocol !== "https:") return { ok: false, message: `Links must start with https:// (${l})` };
    } catch {
      return { ok: false, message: `Not a valid link: ${l}` };
    }
  }
  try {
    const r = await submitProof(await getDb(), ctx.business.id, { deliverableId, notes: n, links }, { type: "user", id: ctx.user.id, label: ctx.user.name });
    revalidatePath("/app", "layout");
    return { ok: true, message: `Proof submitted for ${r.deliverable}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't save the proof" };
  }
}

/** Owner creates (or rotates) the client's one-link agreement + checkout URL. */
export async function clientLinkAction(commitmentId: string): Promise<{ ok: boolean; message: string; url?: string }> {
  const ctx = await requireRole(["owner", "admin"]);
  if (!z.string().uuid().safeParse(commitmentId).success) return { ok: false, message: "Invalid agreement" };
  const r = await issueAgreementLink(await getDb(), ctx.business.id, commitmentId, { id: ctx.user.id, label: ctx.user.name });
  if (!r.ok) return { ok: false, message: r.message };
  return { ok: true, message: "Client link copied", url: `${env().APP_URL.replace(/\/$/, "")}/agreement/${r.token}` };
}
