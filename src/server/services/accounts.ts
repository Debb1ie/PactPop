import { eq } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { agentPermissions, businessMembers, businesses, users } from "@/server/db/schema";
import { TOOL_POLICIES } from "@/server/agents/policies";
import { DEFAULT_PRICING_RULES } from "./pricing";
import { recordAudit } from "./audit";
import type { PlanId } from "@/lib/plans";

export const TRIAL_DAYS = 14;

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 40) || "business"
  );
}

async function uniqueSlug(db: Database, base: string) {
  let slug = slugify(base);
  for (let i = 2; ; i++) {
    const [hit] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, slug)).limit(1);
    if (!hit) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

export class DuplicateEmailError extends Error {}

/** Creates user + business + owner membership + default TrustGate permissions atomically. */
export async function createAccount(
  db: Database,
  input: { name: string; email: string; passwordHash: string; businessName: string; isDemo?: boolean; plan?: PlanId },
) {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new DuplicateEmailError("An account with this email already exists");

  const slug = await uniqueSlug(db, input.businessName);
  return db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ email, name: input.name.trim(), passwordHash: input.passwordHash }).returning();
    const [business] = await tx
      .insert(businesses)
      .values({
        name: input.businessName.trim(),
        slug,
        email,
        pricingRules: DEFAULT_PRICING_RULES,
        isDemo: input.isDemo ?? false,
        plan: input.plan ?? "solo",
        // Paid plans begin with a 14-day trial; nothing is charged.
        trialEndsAt: input.plan && input.plan !== "solo" ? new Date(Date.now() + TRIAL_DAYS * 86_400_000) : null,
      })
      .returning();
    await tx.insert(businessMembers).values({ businessId: business.id, userId: user.id, role: "owner" });
    await tx.insert(agentPermissions).values(TOOL_POLICIES.map((p) => ({ businessId: business.id, tool: p.tool, policy: p.defaultPolicy })));
    await recordAudit(tx, {
      businessId: business.id,
      actor: { type: "user", id: user.id },
      action: "account.created",
      entityType: "business",
      entityId: business.id,
    });
    return { user, business };
  });
}
