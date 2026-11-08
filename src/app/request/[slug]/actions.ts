"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { businesses, projectRequests } from "@/server/db/schema";
import { parseMajorInput } from "@/lib/money";
import { rateLimit, RateLimitError } from "@/server/security/rate-limit";
import { recordAudit } from "@/server/services/audit";

export type RequestState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

const schema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  budget: z.string().trim().max(20).optional().or(z.literal("")),
  deadline: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(20, "Describe the project in at least a sentence or two").max(5000),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot: real people leave it empty
});

/** Public client request. Stored as untrusted text; agents analyse it later behind TrustGate. */
export async function submitRequestAction(slug: string, _prev: RequestState, form: FormData): Promise<RequestState> {
  try {
    await rateLimit("client-request", 5, 15 * 60 * 1000, slug);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const d = parsed.data;
  if (d.website) return { ok: true }; // silently drop bots

  let budgetMinor: number | null = null;
  if (d.budget) {
    budgetMinor = parseMajorInput(d.budget);
    if (budgetMinor == null) return { fieldErrors: { budget: "Use a number, for example 1500" } };
  }

  const db = await getDb();
  const [biz] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, slug)).limit(1);
  if (!biz) return { error: "This request link isn't active." };

  const [row] = await db
    .insert(projectRequests)
    .values({
      businessId: biz.id,
      contactName: d.name,
      contactEmail: d.email.toLowerCase(),
      company: d.company || null,
      rawText: d.message,
      statedBudgetMinor: budgetMinor,
      statedDeadline: d.deadline || null,
      source: "portal",
      status: "new",
    })
    .returning({ id: projectRequests.id });
  await recordAudit(db, { businessId: biz.id, actor: { type: "client", label: d.name }, action: "request.submitted", entityType: "project_request", entityId: row.id });
  return { ok: true };
}
