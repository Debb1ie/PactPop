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

  // anthropic → Claude · groq → open models on Groq (OpenAI-compatible) · heuristic → rule-based, no AI calls
  AI_PROVIDER: z.enum(["anthropic", "groq", "heuristic"]).default("anthropic"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
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
  return e.AI_PROVIDER !== "heuristic" && Boolean(e.AI_API_KEY);
}

const DEFAULT_MODEL = { anthropic: "claude-opus-5-5", groq: "openai/gpt-oss-120b" } as const;

/** The model the agents use, with a sensible default per provider. */
export function aiModel(): string {
  const e = env();
  if (e.AI_PROVIDER === "heuristic") return "rule-based";
  return e.AI_MODEL?.trim() || DEFAULT_MODEL[e.AI_PROVIDER];
}

export type AiModelOption = { id: string; label: string; note: string };

/** Models the agents may use with the configured key. Users see only these labels. */
const CATALOGUE: Record<"anthropic" | "groq", AiModelOption[]> = {
  groq: [
    { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", note: "Best reasoning (default)" },
    { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", note: "Faster, lighter" },
    { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B", note: "Alternative model" },
  ],
  anthropic: [
    { id: "claude-opus-5-5", label: "Claude Opus 5.5", note: "Most capable" },
    { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "Balanced" },
    { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", note: "Fastest" },
  ],
};

export function aiModels(): AiModelOption[] {
  const e = env();
  if (e.AI_PROVIDER === "heuristic") return [];
  const list = CATALOGUE[e.AI_PROVIDER];
  const def = aiModel();
  return list.some((m) => m.id === def) ? list : [{ id: def, label: def.split("/").pop() ?? def, note: "Default" }, ...list];
}

/** Friendly label for a model id. */
export function aiModelLabel(id: string): string {
  return aiModels().find((m) => m.id === id)?.label ?? id.split("/").pop() ?? id;
}

/** Human label for the active AI provider (internal / docs; not shown in the product UI). */
export function aiProviderLabel(): string {
  const p = env().AI_PROVIDER;
  return p === "groq" ? "Groq" : p === "anthropic" ? "Claude" : "Rule-based";
}
