import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCheck, Handshake, Inbox, Wallet } from "lucide-react";
import { RevenueChart } from "@/components/app/revenue-chart";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, EmptyState, Notice, PageHeader, Stat } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
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

  // Deterministic insights from real records (AI-written summaries arrive with the Finance Agent).
  const insights: { tone: "warning" | "info" | "success"; text: string; href?: string }[] = [];
  if (summary.pendingApprovals > 0) insights.push({ tone: "warning", text: `${summary.pendingApprovals} action(s) are waiting for your approval.` });
  if (summary.overdueCount > 0) insights.push({ tone: "warning", text: `${summary.overdueCount} invoice(s) are overdue, totalling ${formatMoney(summary.overdueMinor, cur)}.` });
  if (summary.outstandingCount > 0) insights.push({ tone: "info", text: `${formatMoney(summary.outstandingMinor, cur)} is invoiced and not yet paid.` });
  if (summary.receivedCount > 0) insights.push({ tone: "success", text: `${summary.receivedCount} payment(s) confirmed by PayPal so far.` });

  return (
    <>
      <PageHeader
        title={`Hi ${firstName} 👋`}
        description="Here's where your commitments and payments stand."
        actions={
          <ButtonLink href="/app/clients/new" variant="outline">
            Add client
          </ButtonLink>
        }
      />

      {!paypalConfigured() && (
        <Notice tone="warning" className="mb-6">
          <p className="font-medium">PayPal Sandbox isn&apos;t connected yet</p>
          <p className="mt-0.5 text-muted">
            Add <code className="money text-xs">PAYPAL_CLIENT_ID</code> and <code className="money text-xs">PAYPAL_CLIENT_SECRET</code> to{" "}
            <code className="money text-xs">.env</code> to issue sandbox invoices. Payment figures below only include payments PayPal has confirmed.
          </p>
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Payments received" value={formatMoney(summary.receivedMinor, cur)} sub={`${summary.receivedCount} confirmed by PayPal`} icon={<Wallet className="h-5 w-5" />} />
        <Stat label="Outstanding" value={formatMoney(summary.outstandingMinor, cur)} sub={`${summary.outstandingCount} open invoice(s)`} icon={<Inbox className="h-5 w-5" />} />
        <Stat label="Active commitments" value={summary.activeCommitments} sub={`${formatMoney(summary.agreedMinor, cur)} under agreement`} icon={<Handshake className="h-5 w-5" />} />
        <Stat label="Pending approvals" value={summary.pendingApprovals} sub="Actions waiting for you" icon={<CheckCheck className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Payments received" description="PayPal-confirmed payments per month" />
          <CardBody>
            <RevenueChart data={trend} currency={cur} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Insights" description="Calculated from your records" />
          <CardBody className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-muted">No alerts. New insights appear here as commitments and payments move.</p>
            ) : (
              insights.map((i) => (
                <div key={i.text} className="flex gap-3 text-sm">
                  <AlertTriangle className={i.tone === "warning" ? "h-4 w-4 shrink-0 text-warning" : i.tone === "success" ? "h-4 w-4 shrink-0 text-success" : "h-4 w-4 shrink-0 text-accent"} />
                  <span>{i.text}</span>
                </div>
              ))
            )}
            {statusCounts.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Commitments by status</p>
                <div className="flex flex-wrap gap-2">
                  {statusCounts.map((s) => (
                    <span key={s.status} className="inline-flex items-center gap-1.5">
                      <StatusBadge status={s.status} />
                      <span className="money text-xs text-muted">{s.n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent activity" description="Across all commitments" />
        {activity.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No activity yet"
            description={`Share your request link (/request/${ctx.business.slug}) with a client, or add a client to get started.`}
            action={<ButtonLink href="/app/clients/new">Add your first client</ButtonLink>}
          />
        ) : (
          <ul className="divide-y divide-border">
            {activity.map(({ event, commitmentTitle, clientName }) => (
              <li key={event.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="truncate text-xs text-muted">
                    {clientName} · {commitmentTitle} · {event.actorLabel ?? event.actorType}
                  </p>
                </div>
                <div className="text-right">
                  {event.amountMinor != null && <p className="money text-sm">{formatMoney(event.amountMinor, cur)}</p>}
                  <p className="text-xs text-muted">{timeAgo(event.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="mt-4 text-xs text-muted">
        Records tagged <span className="font-semibold text-warning">DEMO</span> are seeded sample data. Nothing on this page is presented as PayPal data unless PayPal confirmed it.{" "}
        <Link href="/app/clients" className="text-accent hover:underline">
          View clients
        </Link>
      </p>
    </>
  );
}
