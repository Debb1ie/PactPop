import type { Metadata } from "next";
import { AlertTriangle, Inbox } from "lucide-react";
import { QuickActions } from "@/components/app/quick-actions";
import { Statement } from "@/components/app/statement";
import { RevenueChart } from "@/components/app/revenue-chart";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, EmptyState, ListGroup, ListRow, Notice, PageHeader } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { paypalConfigured } from "@/server/env";
import { commitmentStatusCounts, financeSummary, recentActivity, revenueTrend } from "@/server/services/finance";
import { vowgraphSummary } from "@/server/services/vowgraph";
import { buildBriefing } from "@/server/services/briefing";
import { listApprovals } from "@/server/services/workflow";
import { aiConfigured, env } from "@/server/env";
import { AgentConsole } from "@/components/agents/agent-console";
import { ApprovalCard } from "@/components/agents/approval-card";
import { BriefingList } from "@/components/agents/briefing-list";
import { OrbField, type Orb, type OrbTone } from "@/components/fx/orb-field";
import { statusLabel } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "Dashboard" };

function timeAgo(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const [summary, trend, statusCounts, activity, vow] = await Promise.all([
    financeSummary(db, ctx.business.id),
    revenueTrend(db, ctx.business.id),
    commitmentStatusCounts(db, ctx.business.id),
    recentActivity(db, ctx.business.id),
    vowgraphSummary(db, ctx.business.id),
  ]);
  const [briefing, pendingApprovals] = await Promise.all([buildBriefing(db, ctx.business.id), listApprovals(db, ctx.business.id)]);
  const ai = aiConfigured();
  // VowGraph orbs: one per commitment, sized by agreed amount; rings = milestones (lit when paid);
  // satellites = pending change orders.
  const toneFor = (status: string): OrbTone =>
    status === "completed" ? "mint" : ["in_progress", "accepted", "awaiting_evidence", "awaiting_approval", "payment_ready"].includes(status) ? "violet" : status === "awaiting_acceptance" || status === "proposed" ? "amber" : status === "disputed" ? "rose" : "slate";
  const maxAmount = Math.max(1, ...vow.map((c) => c.agreedTotalMinor));
  const orbs: Orb[] = vow.map((c) => {
    const paid = c.milestones.filter((m) => m.paid).length;
    return {
      key: c.id,
      label: c.clientName,
      caption: `${formatMoney(c.agreedTotalMinor, c.currency)} · ${statusLabel(c.status)}`,
      size: c.agreedTotalMinor / maxAmount,
      tone: toneFor(c.status),
      rings: c.milestones.length ? c.milestones.map((m) => ({ lit: m.paid })) : [{ lit: false }],
      satellites: c.pendingChangeOrders.map((o) => ({ label: o.title })),
      details: [
        c.title,
        `${c.milestones.length ? `${paid} of ${c.milestones.length} milestones paid` : "No milestones yet"}`,
        ...c.pendingChangeOrders.map((o) => `Change order pending: ${o.title} · ${formatMoney(o.amountMinor, c.currency)}`),
      ],
      href: `/app/clients/${c.clientId}`,
    };
  });
  const cur = ctx.business.currency;
  const firstName = ctx.user.name.split(" ")[0];

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName}`} description="Here's where your commitments and payments stand today." />

      {!paypalConfigured() && (
        <Notice tone="warning" className="mb-6" icon={<AlertTriangle className="h-5 w-5 text-warning" />}>
          <p className="font-semibold">PayPal Sandbox isn&apos;t connected yet</p>
          <p className="mt-0.5 text-[0.8125rem] text-muted">
            Add <code className="font-mono text-xs">PAYPAL_CLIENT_ID</code> and <code className="font-mono text-xs">PAYPAL_CLIENT_SECRET</code> to{" "}
            <code className="font-mono text-xs">.env</code> to send sandbox invoices. Figures below only count payments PayPal has confirmed.
          </p>
        </Notice>
      )}

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <AgentConsole
            mode={ai ? "ai" : "heuristic"}
            model={ai ? env().AI_MODEL : null}
            suggestions={[
              "Give me a briefing on my business",
              "Analyse the new request from Kitefly Tours",
              "Draft a proposal for Kitefly Tours",
              "Northwind asked for a booking system too. Check the scope.",
              "What's waiting for my approval?",
            ]}
          />
        </div>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Agent briefing" description="Next actions the Operations Agent found in your records" />
            <div className="pt-2">
              <BriefingList items={briefing} />
            </div>
          </Card>
          {pendingApprovals.length > 0 && (
            <section aria-label="Needs your decision" className="space-y-3">
              <h2 className="text-[0.9375rem] font-semibold">Needs your decision</h2>
              {pendingApprovals.slice(0, 2).map(({ a, clientName, commitmentTitle }) => (
                <ApprovalCard
                  key={a.id}
                  approval={{ id: a.id, title: a.title, amount: a.amountMinor != null ? formatMoney(a.amountMinor, a.currency ?? cur) : null, reason: a.reasoningSummary, client: clientName, commitment: commitmentTitle }}
                />
              ))}
            </section>
          )}
        </div>
      </div>

      <Statement
        title="Statement"
        period={`As of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${cur}`}
        badge={<span className="rounded-md bg-fill px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">PayPal Sandbox</span>}
        lines={[
          {
            label: "Received",
            value: formatMoney(summary.receivedMinor, cur),
            note: summary.receivedCount > 0 ? `${summary.receivedCount} payment(s) confirmed by PayPal` : "No PayPal payments yet",
          },
          {
            label: "Outstanding",
            value: formatMoney(summary.outstandingMinor, cur),
            note: `${summary.outstandingCount} open invoice(s)`,
            flag: summary.overdueCount > 0 ? { text: `${summary.overdueCount} overdue`, tone: "warning" } : undefined,
          },
          {
            label: "Under agreement",
            value: formatMoney(summary.agreedMinor, cur),
            note: `${summary.activeCommitments} open commitment(s)`,
          },
          {
            label: "Approvals",
            value: summary.pendingApprovals,
            note: summary.pendingApprovals > 0 ? "Waiting for your decision" : "Nothing waiting",
            flag: summary.pendingApprovals > 0 ? { text: "Action needed", tone: "warning" } : undefined,
          },
        ]}
      />

      <Card className="mt-6">
        <CardHeader
          title="VowGraph"
          description="One orb per commitment, sized by agreed amount. Rings are milestones and light up when paid; orbiting moons are change orders waiting for approval."
        />
        <div className="mx-5 mb-5 mt-3 overflow-hidden rounded-xl">
          <OrbField orbs={orbs} height={330} ariaLabel="3D view of your commitments, their milestones and pending change orders" />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {activity.length === 0 ? (
            <Card>
              <CardHeader title="Recent activity" />
              <EmptyState
                icon={<Inbox className="h-6 w-6" />}
                title="No activity yet"
                description="Every proposal, approval and PayPal payment will show up here."
                action={<ButtonLink href="/app/clients/new">Add your first client</ButtonLink>}
              />
            </Card>
          ) : (
            <ListGroup header="Recent activity">
              {activity.map(({ event, commitmentTitle, clientName }) => (
                <ListRow
                  key={event.id}
                  title={event.title}
                  subtitle={`${clientName} · ${commitmentTitle} · ${timeAgo(event.createdAt)}`}
                  detail={event.amountMinor != null ? <span className="money font-semibold text-foreground">{formatMoney(event.amountMinor, cur)}</span> : undefined}
                />
              ))}
            </ListGroup>
          )}

          <Card>
            <CardHeader title="Payments received" description="PayPal-confirmed, last 6 months" />
            <CardBody>
              <RevenueChart data={trend} currency={cur} />
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Quick actions" />
            <CardBody>
              <QuickActions requestPath={`/request/${ctx.business.slug}`} />
            </CardBody>
          </Card>



          {statusCounts.length > 0 && (
            <ListGroup header="Commitments by status">
              {statusCounts.map((s) => (
                <ListRow key={s.status} title={<StatusBadge status={s.status} />} detail={<span className="money">{s.n}</span>} />
              ))}
            </ListGroup>
          )}
        </div>
      </div>
      <p className="mt-6 text-[0.8125rem] text-muted">
        Records tagged <span className="font-semibold text-warning">DEMO</span> are seeded sample data. Payment figures only come from PayPal.
      </p>
    </>
  );
}
