import "server-only";
import { z } from "zod";

/**
 * Server-only configuration. Validated once at first use.
 * Nothing in here may ever be exposed through NEXT_PUBLIC_* variables.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),

  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_BASE_URL: z.string().url().default("https://api-m.sandbox.paypal.com"),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  AI_PROVIDER: z.enum(["anthropic", "heuristic"]).default("anthropic"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("claude-sonnet-5-5"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
    }
    // Guard rail: PactPop must never run against live PayPal from this codebase.
    if (!parsed.data.PAYPAL_BASE_URL.includes("sandbox")) {
      throw new Error("PAYPAL_BASE_URL must point at the PayPal Sandbox (api-m.sandbox.paypal.com)");
    }
    cached = parsed.data;
  }
  return cached;
}

export function paypalConfigured(): boolean {
  const e = env();
  return Boolean(e.PAYPAL_CLIENT_ID && e.PAYPAL_CLIENT_SECRET);
}

export function aiConfigured(): boolean {
  const e = env();
  return e.AI_PROVIDER === "anthropic" && Boolean(e.AI_API_KEY);
}
