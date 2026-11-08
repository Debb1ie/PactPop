"use server";

import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { env } from "@/server/env";
import { issueAgreementLink } from "@/server/services/agreements";

/** Owner creates (or rotates) the client's one-link agreement + checkout URL. */
export async function clientLinkAction(commitmentId: string): Promise<{ ok: boolean; message: string; url?: string }> {
  const ctx = await requireRole(["owner", "admin"]);
  if (!z.string().uuid().safeParse(commitmentId).success) return { ok: false, message: "Invalid agreement" };
  const r = await issueAgreementLink(await getDb(), ctx.business.id, commitmentId, { id: ctx.user.id, label: ctx.user.name });
  if (!r.ok) return { ok: false, message: r.message };
  return { ok: true, message: "Client link copied", url: `${env().APP_URL.replace(/\/$/, "")}/agreement/${r.token}` };
}
