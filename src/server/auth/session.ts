import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { businessMembers, businesses, sessions, users } from "@/server/db/schema";

export const SESSION_COOKIE = "pp_session";
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type Role = "owner" | "admin" | "member";

/** Everything a request handler needs to act on behalf of a user inside one tenant. */
export type AuthContext = {
  user: { id: string; email: string; name: string };
  business: { id: string; name: string; slug: string; currency: string; isDemo: boolean; plan: string; trialEndsAt: Date | null };
  role: Role;
  sessionId: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, businessId: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), activeBusinessId: businessId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Resolves the session cookie to user + tenant + role. Memoised per request. */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      sessionId: sessions.id,
      activeBusinessId: sessions.activeBusinessId,
      user: { id: users.id, email: users.email, name: users.name },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.activeBusinessId) return null;

  // Membership is re-checked on every request: removing a member revokes access immediately.
  const [membership] = await db
    .select({
      role: businessMembers.role,
      business: {
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        currency: businesses.currency,
        isDemo: businesses.isDemo,
        plan: businesses.plan,
        trialEndsAt: businesses.trialEndsAt,
      },
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(and(eq(businessMembers.userId, row.user.id), eq(businessMembers.businessId, row.activeBusinessId)))
    .limit(1);
  if (!membership) return null;

  return { user: row.user, business: membership.business, role: membership.role, sessionId: row.sessionId };
});

/** For pages and server actions: redirects to /login when unauthenticated. */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Role gate for sensitive operations (approvals, settings, permissions). */
export async function requireRole(roles: Role[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!roles.includes(ctx.role)) throw new AuthorizationError(`This action requires one of: ${roles.join(", ")}`);
  return ctx;
}

export class AuthorizationError extends Error {
  readonly status = 403;
}
