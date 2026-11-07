import type { Metadata } from "next";
import { AlertTriangle, CheckCheck, CheckCircle2, CircleDollarSign, Clock, Handshake, Inbox, Link2, Wallet } from "lucide-react";
import { QuickActions } from "@/components/app/quick-actions";
import { RevenueChart } from "@/components/app/revenue-chart";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, EmptyState, ListGroup, ListRow, Notice, PageHeader, Stat } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { PLANS } from "@/lib/plans";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { paypalConfigured } from "@/server/env";
import { commitmentStatusCounts, financeSummary, recentActivity, revenueTrend } from "@/server/services/finance";

export const metadata: Metadata = { title: "Dashboard" };

function timeAgo(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type Insight = { tone: "warning" | "info" | "success"; text: string };
const INSIGHT_ICON = {
  warning: { icon: AlertTriangle, bg: "bg-warning" },
  info: { icon: Clock, bg: "bg-accent" },
  success: { icon: CheckCircle2, bg: "bg-success" },
};

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const [summary, trend, statusCounts, activity] = await Promise.all([
    financeSummary(db, ctx.business.id),
    revenueTrend(db, ctx.business.id),
    commitmentStatusCounts(db, ctx.business.id),
    recentActivity(db, ctx.business.id),
  ]);
  const cur = ctx.business.currency;
  const firstName = ctx.user.name.split(" ")[0];
  const onFreePlan = (PLANS.find((p) => p.id === ctx.business.plan) ?? PLANS[0]).monthlyMinor === 0;

  // Deterministic insights from real records (AI-written summaries arrive with the Finance Agent).
  const insights: Insight[] = [];
  if (summary.pendingApprovals > 0) insights.push({ tone: "warning", text: `${summary.pendingApprovals} action(s) are waiting for your approval.` });
  if (summary.overdueCount > 0) insights.push({ tone: "warning", text: `${summary.overdueCount} invoice(s) are overdue, totalling ${formatMoney(summary.overdueMinor, cur)}.` });
  if (summary.outstandingCount > 0) insights.push({ tone: "info", text: `${formatMoney(summary.outstandingMinor, cur)} is invoiced and not yet paid.` });
  if (summary.receivedCount > 0) insights.push({ tone: "success", text: `${summary.receivedCount} payment(s) confirmed by PayPal so far.` });

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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat tone="violet" label="Payments received" value={formatMoney(summary.receivedMinor, cur)} sub={`${summary.receivedCount} confirmed by PayPal`} icon={<Wallet className="h-4 w-4" />} />
        <Stat tone="peach" label="Outstanding" value={formatMoney(summary.outstandingMinor, cur)} sub={`${summary.outstandingCount} open invoice(s)`} icon={<CircleDollarSign className="h-4 w-4" />} />
        <Stat tone="pink" label="Under agreement" value={formatMoney(summary.agreedMinor, cur)} sub={`${summary.activeCommitments} active commitment(s)`} icon={<Handshake className="h-4 w-4" />} />
        <Stat tone="ice" label="Pending approvals" value={summary.pendingApprovals} sub="Waiting for your decision" icon={<CheckCheck className="h-4 w-4" />} />
      </div>

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
              <QuickActions showUpgrade={onFreePlan} />
            </CardBody>
          </Card>

          <ListGroup header="Insights">
            {insights.length === 0 ? (
              <ListRow icon={<CheckCircle2 className="h-4 w-4" />} iconBg="bg-success" title="All clear" subtitle="Alerts appear as commitments and payments move." />
            ) : (
              insights.map((i) => {
                const { icon: Icon, bg } = INSIGHT_ICON[i.tone];
                return <ListRow key={i.text} icon={<Icon className="h-4 w-4" />} iconBg={bg} title={<span className="whitespace-normal">{i.text}</span>} />;
              })
            )}
          </ListGroup>

          <ListGroup header="Your request link" footer="Clients will use this link to send project requests for the Intake Agent to analyse.">
            <ListRow icon={<Link2 className="h-4 w-4" />} iconBg="bg-[#3b82f6]" title={`/request/${ctx.business.slug}`} subtitle="Client request portal" />
          </ListGroup>

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
