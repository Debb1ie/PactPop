import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Bot, History, ShieldCheck, Store } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { DemoBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { agentExecutions, agentPermissions, agentToolCalls, businesses } from "@/server/db/schema";
import { aiConfigured, env, paypalConfigured } from "@/server/env";
import { effectivePolicy, TOOL_POLICIES } from "@/server/agents/policies";
import { TOOLS } from "@/server/agents/tools";
import { PolicySelect } from "./policy-select";

export const metadata: Metadata = { title: "Settings" };

const TABS = [
  { id: "ai", label: "AI & agents", icon: Bot },
  { id: "permissions", label: "Permissions", icon: ShieldCheck },
  { id: "history", label: "Agent history", icon: History },
  { id: "workspace", label: "Workspace", icon: Store },
] as const;

const CATEGORY: Record<string, string> = { read: "Reading data", draft: "Drafting", communicate: "Contacting clients", financial: "Money" };

function Row({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="text-[0.9375rem] font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-[0.8125rem] text-muted">{hint}</p>}
      </div>
      <div className="text-[0.875rem] text-muted">{value}</div>
    </div>
  );
}

export default async function SettingsPage({ searchParams }: PageProps<"/app/settings">) {
  const ctx = await requireAuth();
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "ai";
  const bid = ctx.business.id;
  const ai = aiConfigured();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mt-1 text-[1.75rem] font-bold leading-tight">Settings</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto md:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/app/settings?tab=${id}`}
              aria-current={tab === id ? "page" : undefined}
              className={cn("flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.9375rem] transition-colors", tab === id ? "bg-surface font-semibold" : "text-muted hover:bg-surface hover:text-foreground")}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>

        <div className="panel min-w-0 px-5 py-2 sm:px-6">
          {tab === "ai" && (
            <>
              <div className="divide-y divide-border">
                <Row
                  label="Agent engine"
                  hint={ai ? "Claude coordinates the agents through permission-checked tools." : "Rule-based planner: same tools and TrustGate checks, fixed set of requests. Add AI_API_KEY to use Claude."}
                  value={<span className={cn("rounded-full px-2.5 py-1 text-[0.75rem] font-medium", ai ? "bg-accent-soft text-accent" : "bg-warning-soft text-warning")}>{ai ? env().AI_MODEL : "Rule-based mode"}</span>}
                />
                <Row label="Reasoning shown" hint="A short summary of the orchestrator's thinking appears in the chat." value="Summarised" />
                <Row label="Prices" hint="Agents estimate units of work; your rate card sets every amount." value="From your rates" />
              </div>
              <h2 className="mt-4 text-[1rem] font-semibold">Tools the agents can use</h2>
              <ul className="mb-4 mt-2 divide-y divide-border rounded-xl bg-surface-2">
                {TOOLS.map((t) => (
                  <li key={t.name} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block font-mono text-[0.8125rem]">{t.name}</span>
                      <span className="block text-[0.75rem] text-muted">{t.description.split(". ")[0]}.</span>
                    </span>
                    <span className="text-[0.75rem] text-muted">{t.agent}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === "permissions" && <PermissionsTab businessId={bid} canEdit={ctx.role !== "member"} />}

          {tab === "history" && <HistoryTab businessId={bid} />}

          {tab === "workspace" && <WorkspaceTab businessId={bid} name={ctx.business.name} isDemo={ctx.business.isDemo} user={ctx.user} role={ctx.role} />}
        </div>
      </div>
    </div>
  );
}

async function PermissionsTab({ businessId, canEdit }: { businessId: string; canEdit: boolean }) {
  const db = await getDb();
  const rows = await db.select().from(agentPermissions).where(eq(agentPermissions.businessId, businessId));
  const byTool = new Map(rows.map((r) => [r.tool, r.policy]));
  const groups = ["read", "draft", "communicate", "financial"] as const;
  return (
    <div className="py-3">
      <p className="text-[0.875rem] text-muted">
        TrustGate decides what agents may do on their own. <span className="font-medium text-foreground">Ask me</span> sends the action to your Approval Center. Locked controls always need you.
      </p>
      {groups.map((g) => (
        <section key={g} className="mt-5">
          <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.04em] text-muted">{CATEGORY[g]}</h2>
          <ul className="mt-1 divide-y divide-border">
            {TOOL_POLICIES.filter((p) => p.category === g).map((p) => (
              <li key={p.tool} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-[0.9375rem]">{p.label}</span>
                {canEdit ? (
                  <PolicySelect tool={p.tool} label={p.label} value={effectivePolicy(p.tool, byTool.get(p.tool) ?? null)} locked={Boolean(p.floor)} />
                ) : (
                  <span className="text-[0.8125rem] text-muted">{effectivePolicy(p.tool, byTool.get(p.tool) ?? null)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

async function HistoryTab({ businessId }: { businessId: string }) {
  const db = await getDb();
  const runs = await db.select().from(agentExecutions).where(eq(agentExecutions.businessId, businessId)).orderBy(desc(agentExecutions.createdAt)).limit(30);
  const counts = runs.length
    ? await db
        .select({ executionId: agentToolCalls.executionId, n: sql<number>`count(*)::int`, gated: sql<number>`count(*) filter (where ${agentToolCalls.decision} = 'approval_required')::int` })
        .from(agentToolCalls)
        .where(and(eq(agentToolCalls.businessId, businessId), inArray(agentToolCalls.executionId, runs.map((r) => r.id))))
        .groupBy(agentToolCalls.executionId)
    : [];
  const byRun = new Map(counts.map((c) => [c.executionId, c]));
  if (!runs.length) return <p className="py-6 text-[0.9375rem] text-muted">No agent runs yet. Ask the agents something on the AI Agents page.</p>;
  return (
    <ul className="divide-y divide-border">
      {runs.map((r) => {
        const c = byRun.get(r.id);
        return (
          <li key={r.id} className="py-3.5">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-[0.9375rem] font-medium">{r.input}</p>
              <StatusBadge status={r.status === "awaiting_approval" ? "approval_required" : r.status} />
            </div>
            <p className="mt-0.5 text-[0.75rem] text-muted">
              {r.provider === "anthropic" ? r.model : "Rule-based"} · {c?.n ?? 0} tool call(s){c?.gated ? ` · ${c.gated} sent for approval` : ""} ·{" "}
              {r.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

async function WorkspaceTab({ businessId, name, isDemo, user, role }: { businessId: string; name: string; isDemo: boolean; user: { name: string; email: string }; role: string }) {
  const db = await getDb();
  const [b] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const r = b.pricingRules;
  return (
    <div className="divide-y divide-border">
      <Row label="Business" value={<span className="flex items-center gap-2 text-foreground">{name} {isDemo && <DemoBadge />}</span>} />
      <Row label="Signed in as" value={`${user.name} · ${user.email} (${role})`} />
      <Row label="Client request link" value={<span className="font-mono text-[0.8125rem]">/request/{b.slug}</span>} />
      <Row label="PayPal" hint="Sandbox only. Credentials stay on the server." value={paypalConfigured() ? "Sandbox connected" : "Not connected"} />
      <Row label="Rate card" hint="Used by the pricing engine for every quote and change order." value={<span className="money text-foreground">{formatMoney(r.pageRateMinor)}/page · {formatMoney(r.additionalPageRateMinor)}/extra page · {formatMoney(r.hourlyRateMinor)}/h · {r.depositPercent}% deposit</span>} />
    </div>
  );
}
