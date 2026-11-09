import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getAuthContext } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { agentExecutions } from "@/server/db/schema";

export const dynamic = "force-dynamic";

/** The signed-in user's agent conversations in this business, newest first. */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Sign in" }, { status: 401 });
  const rows = await (await getDb())
    .select({ conversationId: agentExecutions.conversationId, input: agentExecutions.input, createdAt: agentExecutions.createdAt })
    .from(agentExecutions)
    .where(and(eq(agentExecutions.businessId, ctx.business.id), eq(agentExecutions.userId, ctx.user.id), isNotNull(agentExecutions.conversationId)))
    .orderBy(desc(agentExecutions.createdAt))
    .limit(300);
  const map = new Map<string, { id: string; title: string; updatedAt: string; turns: number }>();
  for (const r of rows) {
    const id = r.conversationId!;
    const c = map.get(id);
    if (!c) map.set(id, { id, title: r.input, updatedAt: r.createdAt.toISOString(), turns: 1 });
    else {
      c.turns += 1;
      c.title = r.input; // rows are newest-first, so the last one seen is the opening message
    }
  }
  return Response.json({ conversations: [...map.values()].slice(0, 40) });
}
