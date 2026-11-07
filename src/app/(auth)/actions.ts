"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { businessMembers, businesses, users } from "@/server/db/schema";
import { DEMO_EMAIL } from "@/lib/demo";
import { createDemoWorkspace, demoUserExists } from "@/server/services/demo";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/server/auth/session";
import { createAccount, DuplicateEmailError } from "@/server/services/accounts";
import { rateLimit, RateLimitError } from "@/server/security/rate-limit";
import { recordAudit } from "@/server/services/audit";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  businessName: z.string().trim().min(2, "Enter your business name").max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
  password: z.string().min(10, "Use at least 10 characters").max(200),
});

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

export async function registerAction(_: AuthState, form: FormData): Promise<AuthState> {
  try {
    await rateLimit("register", 5, 60 * 60 * 1000);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const db = await getDb();
  try {
    const { user, business } = await createAccount(db, { ...parsed.data, passwordHash: await hashPassword(parsed.data.password) });
    await createSession(user.id, business.id);
  } catch (e) {
    if (e instanceof DuplicateEmailError) return { fieldErrors: { email: e.message } };
    throw e;
  }
  redirect("/app/dashboard");
}

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) });

export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter your email and password" };
  const email = parsed.data.email.toLowerCase();
  try {
    await rateLimit("login", 10, 15 * 60 * 1000);
    await rateLimit("login-email", 10, 15 * 60 * 1000, email);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Same message for unknown email and wrong password — no account enumeration.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Incorrect email or password" };
  }
  const [membership] = await db
    .select({ businessId: businessMembers.businessId })
    .from(businessMembers)
    .where(and(eq(businessMembers.userId, user.id)))
    .limit(1);
  if (!membership) return { error: "This account is not a member of any business" };

  await createSession(user.id, membership.businessId);
  await recordAudit(db, { businessId: membership.businessId, actor: { type: "user", id: user.id }, action: "auth.login", entityType: "user", entityId: user.id });
  redirect("/app/dashboard");
}

/**
 * One-click demo login. Signs into the public, seeded demo workspace only (creating it on first
 * use, so hosted demos work without a manual seed). It can never sign into a real account.
 */
export async function demoLoginAction(): Promise<AuthState> {
  try {
    await rateLimit("demo-login", 20, 15 * 60 * 1000);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }
  const db = await getDb();
  if (!(await demoUserExists(db))) await createDemoWorkspace(db);

  const [row] = await db
    .select({ userId: users.id, businessId: businessMembers.businessId, isDemo: businesses.isDemo })
    .from(users)
    .innerJoin(businessMembers, eq(businessMembers.userId, users.id))
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);
  if (!row || !row.isDemo) return { error: "The demo workspace isn't available right now." };

  await createSession(row.userId, row.businessId);
  await recordAudit(db, { businessId: row.businessId, actor: { type: "user", id: row.userId }, action: "auth.demo_login", entityType: "user", entityId: row.userId });
  redirect("/app/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
