import type { Metadata } from "next";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { AgentConsole } from "@/components/agents/agent-console";
import { Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { agentExecutions, agentToolCalls } from "@/server/db/schema";
import { aiConfigured, env } from "@/server/env";
import { TOOLS } from "@/server/agents/tools";

export const metadata: Metadata = { title: "Command Center" };

export default async function CommandCenterPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const ai = aiConfigured();
  const runs = await db.select().from(agentExecutions).where(eq(agentExecutions.businessId, ctx.business.id)).orderBy(desc(agentExecutions.createdAt)).limit(12);
  const counts = runs.length
    ? await db
        .select({ executionId: agentToolCalls.executionId, n: sql<number>`count(*)::int`, gated: sql<number>`count(*) filter (where ${agentToolCalls.decision} = 'approval_required')::int` })
        .from(agentToolCalls)
        .where(inArray(agentToolCalls.executionId, runs.map((r) => r.id)))
        .groupBy(agentToolCalls.executionId)
    : [];
  const byRun = new Map(counts.map((c) => [c.executionId, c]));

  return (
    <>
      <PageHeader title="Command Center" description="Give the agents work in plain language. Every tool call is checked by TrustGate and recorded." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <AgentConsole
            tall
            mode={ai ? "ai" : "heuristic"}
            model={ai ? env().AI_MODEL : null}
            suggestions={[
              "Give me a briefing on my business",
              "Analyse the new request from Kitefly Tours",
              "Draft and send a proposal for Kitefly Tours",
              "Northwind asked for a Team page, a Gallery and an FAQ. Check the scope.",
              "Which invoices are overdue?",
              "What's waiting for my approval?",
            ]}
          />
        </div>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Run history" description="Persisted executions, with tool calls and approvals" />
            {runs.length === 0 ? (
              <p className="px-5 pb-5 pt-2 text-[0.9375rem] text-muted">No runs yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {runs.map((r) => {
                  const c = byRun.get(r.id);
                  return (
                    <li key={r.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-[0.875rem] font-medium">{r.input}</p>
                        <StatusBadge status={r.status === "awaiting_approval" ? "approval_required" : r.status} />
                      </div>
                      <p className="mt-0.5 font-mono text-[0.7rem] text-muted">
                        {r.provider === "anthropic" ? r.model : "rule-based"} · {c?.n ?? 0} tool call(s){c?.gated ? ` · ${c.gated} gated` : ""} · {r.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Available tools" description="What the agents can do, and who owns each tool" />
            <ul className="mt-2 divide-y divide-border">
              {TOOLS.map((t) => (
                <li key={t.name} className="flex items-baseline justify-between gap-3 px-5 py-2.5">
                  <span className="font-mono text-[0.75rem]">{t.name}</span>
                  <span className="text-[0.75rem] text-muted">{t.agent}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
