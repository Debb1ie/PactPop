import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { agentExecutions } from "@/server/db/schema";

export const dynamic = "force-dynamic";

/** One conversation's turns with the events needed to redraw them. Only the owner can read it. */
export async function GET(_req: Request, { params }: RouteContext<"/api/agents/conversations/[id]">) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Sign in" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return Response.json({ error: "Not found" }, { status: 404 });
  const rows = await (await getDb())
    .select({ id: agentExecutions.id, input: agentExecutions.input, output: agentExecutions.output, status: agentExecutions.status, error: agentExecutions.error, createdAt: agentExecutions.createdAt })
    .from(agentExecutions)
    .where(and(eq(agentExecutions.businessId, ctx.business.id), eq(agentExecutions.userId, ctx.user.id), eq(agentExecutions.conversationId, id)))
    .orderBy(asc(agentExecutions.createdAt));
  if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({
    id,
    turns: rows.map((r) => {
      const out = (r.output ?? {}) as { text?: string; events?: unknown[] };
      const events = out.events?.length ? out.events : [...(out.text ? [{ type: "message", agent: "Orchestrator", text: out.text }] : []), ...(r.error ? [{ type: "error", message: r.error }] : [])];
      return { id: r.id, input: r.input, events, createdAt: r.createdAt.toISOString() };
    }),
  });
}
