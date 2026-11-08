import "server-only";
import { env, paypalConfigured } from "@/server/env";

/**
 * Minimal PayPal REST client (Sandbox only). Credentials and access tokens never leave the server.
 * The base URL is validated in env() to be the sandbox host.
 */

let cached: { token: string; expiresAt: number } | null = null;

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly debugId?: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

async function accessToken(): Promise<string> {
  if (!paypalConfigured()) throw new PayPalError("PayPal Sandbox is not configured", 0);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const e = env();
  const res = await fetch(`${e.PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${e.PAYPAL_CLIENT_ID}:${e.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) throw new PayPalError(`PayPal sign-in failed: ${body.error_description ?? res.status}`, res.status);
  cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 300) * 1000 };
  return cached.token;
}

/**
 * Call a PayPal REST endpoint. `requestId` becomes PayPal-Request-Id, so retries of the same
 * logical operation are idempotent on PayPal's side.
 */
export async function paypal<T = unknown>(path: string, init: { method?: string; body?: unknown; requestId?: string } = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${env().PAYPAL_BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!res.ok) {
    const details = json.details as { issue?: string; description?: string }[] | undefined;
    const why = details?.[0]?.description ?? (json.message as string | undefined) ?? res.statusText;
    throw new PayPalError(`PayPal ${init.method ?? "GET"} ${path.split("?")[0]} failed: ${why}`, res.status, json.debug_id as string | undefined, details);
  }
  return json as T;
}
