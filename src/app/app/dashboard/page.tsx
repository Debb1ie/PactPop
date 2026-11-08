import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Info, MoreHorizontal } from "lucide-react";
import { CashflowChart } from "@/components/app/cashflow-chart";
import { CommitmentWallet } from "@/components/app/commitment-wallet";
import { ActivityChart, ClientValueChart, StageChart, type ClientValue, type StageValue, type WeekActivity } from "@/components/app/insight-charts";
import { and, eq, gte } from "drizzle-orm";
import { timelineEvents } from "@/server/db/schema";
import { MoneyActivity } from "@/components/app/money-activity";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { paypalConfigured } from "@/server/env";
import { cashflowByMonth, moneyLedger, moneyPosition } from "@/server/services/finance";
import { vowgraphSummary } from "@/server/services/vowgraph";
import { listApprovals } from "@/server/services/workflow";

export const metadata: Metadata = { title: "Dashboard" };

const STAGES = ["Request", "Agreement", "Delivery", "Approval", "Paid"];
/** Same mapping as the Commitments journey. */
function stageOf(status: string) {
  if (status === "completed") return 4;
  if (status === "awaiting_approval" || status === "payment_ready") return 3;
  if (["accepted", "in_progress", "awaiting_evidence"].includes(status)) return 2;
  if (status === "proposed" || status === "awaiting_acceptance") return 1;
  return 0;
}

/** Finance overview: commitments as cards, details, collection, cash flow and transactions. */
export default async function DashboardPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const bid = ctx.business.id;
  const [commitments, cashflow, ledger, position, pending] = await Promise.all([vowgraphSummary(db, bid, 12), cashflowByMonth(db, bid), moneyLedger(db, bid, 12), moneyPosition(db, bid), listApprovals(db, bid)]);
  const hour = new Date().getHours();
  const hello = `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}, ${ctx.user.name.split(" ")[0]}`;
  const cur = ctx.business.currency;
  const expected = cashflow.reduce((s, d) => s + d.scheduledMinor, 0);

  // Agreed value by client (top 5)
  const byClient = new Map<string, ClientValue>();
  for (const c of commitments) {
    const row = byClient.get(c.clientName) ?? { client: c.clientName, valueMinor: 0, agreements: 0 };
    row.valueMinor += c.agreedTotalMinor;
    row.agreements += 1;
    byClient.set(c.clientName, row);
  }
  const clientValues = [...byClient.values()].sort((a, b) => b.valueMinor - a.valueMinor).slice(0, 5);

  // Money at each stage of the agreement journey
  const stages: StageValue[] = STAGES.map((stage) => ({ stage, valueMinor: 0, count: 0 }));
  for (const c of commitments) {
    const s = stages[stageOf(c.status)];
    s.valueMinor += c.agreedTotalMinor;
    s.count += 1;
  }

  // Who did the work: timeline actions per week, last 8 weeks
  const WEEK = 7 * 86_400_000;
  const now = new Date().getTime();
  const since = new Date(now - 8 * WEEK);
  const actions = await db
    .select({ at: timelineEvents.createdAt, actor: timelineEvents.actorType })
    .from(timelineEvents)
    .where(and(eq(timelineEvents.businessId, bid), gte(timelineEvents.createdAt, since)));
  const weeks: WeekActivity[] = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(since.getTime() + i * WEEK);
    const end = new Date(start.getTime() + WEEK - 86_400_000);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { label: `${start.getMonth() + 1}/${start.getDate()}`, range: `${fmt(start)} – ${fmt(end)}`, agents: 0, people: 0 };
  });
  for (const a of actions) {
    const w = weeks[Math.min(7, Math.floor((a.at.getTime() - since.getTime()) / WEEK))];
    if (!w) continue;
    if (a.actor === "agent") w.agents += 1;
    else if (a.actor === "user" || a.actor === "client") w.people += 1;
  }

  return (
    <>
      {!paypalConfigured() && (
        <p className="pure mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.75rem] text-muted">
          <Info className="h-3.5 w-3.5" /> PayPal Sandbox isn&apos;t connected yet. Received amounts only count PayPal-confirmed payments.
        </p>
      )}

      <div className="mb-6">
        <h1 className="text-[1.75rem] font-bold leading-tight sm:text-[2rem]">{hello}</h1>
        <div className="mt-4 flex flex-wrap gap-2.5 text-[0.8125rem]">
          <span className="pure rounded-full px-3.5 py-1.5 text-muted">
            <span className="money font-semibold text-foreground">{formatMoney(position.contractedMinor, cur)}</span> under agreement
          </span>
          <span className="pure rounded-full px-3.5 py-1.5 text-muted">
            <span className="money font-semibold text-foreground">{formatMoney(position.receivedMinor, cur)}</span> received
          </span>
          {pending.length > 0 && (
            <Link href="/app/approvals" className="pure inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-muted transition-colors hover:text-foreground">
              <span className="font-semibold text-foreground">{pending.length}</span> approval{pending.length === 1 ? "" : "s"} waiting <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
          {position.pipelineMinor > 0 && (
            <span className="pure rounded-full px-3.5 py-1.5 text-muted">
              <span className="money font-semibold text-foreground">{formatMoney(position.pipelineMinor, cur)}</span> in pipeline
            </span>
          )}
        </div>
      </div>

      <CommitmentWallet items={commitments} />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="panel min-w-0" aria-label="Cash flow">
          <div className="panel-head">
            <h3 className="panel-title">Cash Flow</h3>
            <Link href="/app/payments" aria-label="Open payments" className="ml-auto grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground">
              <MoreHorizontal className="h-5 w-5" />
            </Link>
          </div>
          <div className="px-5 pb-4">
            <p className="text-[0.8125rem] text-muted">
              <span className="money font-semibold text-foreground">{formatMoney(expected, cur)}</span> expected over 6 months ·{" "}
              <span className="money font-semibold text-foreground">{formatMoney(position.receivedMinor, cur)}</span> received
            </p>
            <div className="mt-2">
              <CashflowChart data={cashflow} currency={cur} />
            </div>
          </div>
        </section>

        <MoneyActivity
          currency={cur}
          asOf={new Date().toISOString()}
          rows={ledger.map(({ e, company, clientName }) => ({
            id: e.id,
            date: e.createdAt.toISOString(),
            title: e.title,
            kind: e.kind,
            party: company ?? clientName,
            amountMinor: e.amountMinor,
          }))}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="panel min-w-0" aria-label="Agreed value by client">
          <div className="panel-head">
            <h3 className="panel-title">Top clients</h3>
            <span className="ml-auto text-[0.75rem] text-muted">Agreed value</span>
          </div>
          <div className="px-5 pb-5 pt-2">
            <ClientValueChart data={clientValues} currency={cur} />
          </div>
        </section>
        <section className="panel min-w-0" aria-label="Money by stage">
          <div className="panel-head">
            <h3 className="panel-title">Money by stage</h3>
            <span className="ml-auto text-[0.75rem] text-muted">All agreements</span>
          </div>
          <div className="px-5 pb-5 pt-4">
            <StageChart data={stages} currency={cur} />
          </div>
        </section>
        <section className="panel min-w-0" aria-label="Agents and people activity">
          <div className="panel-head">
            <h3 className="panel-title">Who did the work</h3>
            <span className="ml-auto text-[0.75rem] text-muted">Last 8 weeks</span>
          </div>
          <div className="px-5 pb-5 pt-2">
            <ActivityChart data={weeks} />
          </div>
        </section>
      </div>

      <p className="mt-5 text-[0.75rem] text-faint">Records tagged DEMO are seeded sample data. Payment figures only come from PayPal.</p>
    </>
  );
}
