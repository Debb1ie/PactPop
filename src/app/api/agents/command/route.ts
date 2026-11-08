import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { runCommand, type AgentEvent } from "@/server/agents/orchestrator";
import { checkRateLimit, RateLimitError } from "@/server/security/rate-limit";

const body = z.object({ input: z.string().trim().min(2).max(2000), model: z.string().max(80).optional() });

/** Streams agent events as NDJSON (one JSON object per line). */
export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Sign in to use the agents." }, { status: 401 });

  // Same-origin check for this cookie-authenticated, state-changing endpoint.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ error: "Cross-origin request blocked." }, { status: 403 });

  try {
    checkRateLimit(`agents:${ctx.user.id}`, 20, 60_000);
  } catch (e) {
    if (e instanceof RateLimitError) return Response.json({ error: e.message }, { status: 429 });
    throw e;
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Type a request between 2 and 2000 characters." }, { status: 400 });

  const db = await getDb();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: AgentEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      await runCommand({ db, businessId: ctx.business.id, userId: ctx.user.id, input: parsed.data.input, model: parsed.data.model, emit });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
