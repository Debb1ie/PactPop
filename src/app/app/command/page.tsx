import type { Metadata } from "next";
import { AgentConsole, type Suggestion } from "@/components/agents/agent-console";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { aiConfigured, aiModel, aiProviderLabel } from "@/server/env";
import { buildBriefing } from "@/server/services/briefing";

export const metadata: Metadata = { title: "AI Agents" };

function greeting(name: string) {
  const h = new Date().getHours();
  return `${h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"}, ${name}`;
}

/** One page, one job: talk to the agents. Permissions, tools and history live in Settings. */
export default async function AgentsPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const ai = aiConfigured();
  const briefing = await buildBriefing(db, ctx.business.id);

  // Suggestions: what the Operations Agent found in your records first, then useful defaults.
  const fromBriefing: Suggestion[] = briefing.filter((b) => b.command).map((b) => ({ title: b.title, detail: `${b.agent} · ${b.detail}`, command: b.command! }));
  const defaults: Suggestion[] = [
    { title: "Brief me on my business", detail: "Payments, agreements, approvals", command: "Give me a briefing on my business" },
    { title: "Check a scope change", detail: "Northwind wants a Team page, Gallery and FAQ", command: "Northwind asked for a Team page, a Gallery and an FAQ. Check the scope." },
    { title: "What's waiting for me?", detail: "Approvals TrustGate is holding", command: "What's waiting for my approval?" },
    { title: "Which invoices are overdue?", detail: "Finance Agent", command: "Which invoices are overdue?" },
  ];
  const suggestions = [...fromBriefing, ...defaults].filter((s, i, all) => all.findIndex((x) => x.command === s.command) === i).slice(0, 4);

  return <AgentConsole mode={ai ? "ai" : "heuristic"} model={ai ? `${aiProviderLabel()} · ${aiModel()}` : null} suggestions={suggestions} greeting={greeting(ctx.user.name.split(" ")[0])} />;
}
