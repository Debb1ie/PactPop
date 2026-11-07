import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window in-memory rate limiter.
 * Limitation (documented): state is per server instance. For multi-instance deployments,
 * swap the Map for Redis/Postgres without changing call sites.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export class RateLimitError extends Error {
  readonly status = 429;
  constructor(public retryAfterSeconds: number) {
    super(`Too many requests. Try again in ${retryAfterSeconds}s.`);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return;
  }
  b.count += 1;
  if (b.count > limit) throw new RateLimitError(Math.ceil((b.resetAt - now) / 1000));
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function rateLimit(scope: string, limit: number, windowMs: number, subject?: string) {
  checkRateLimit(`${scope}:${subject ?? (await clientIp())}`, limit, windowMs);
}
