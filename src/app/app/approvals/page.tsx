import type { Metadata } from "next";
import { ApprovalCard } from "@/components/agents/approval-card";
import { Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { Mascot } from "@/components/brand/mascot";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { listApprovals } from "@/server/services/workflow";

export const metadata: Metadata = { title: "Approval Center" };

export default async function ApprovalsPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const [pending, decided] = await Promise.all([listApprovals(db, ctx.business.id, "pending"), listApprovals(db, ctx.business.id, "decided")]);
  const cur = ctx.business.currency;

  return (
    <>
      <PageHeader title="Approval Center" description="Actions the agents prepared that TrustGate requires you to decide. Approving executes the action; nothing runs before that." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-3" aria-label="Pending approvals">
          <h2 className="text-[0.9375rem] font-semibold">Waiting for you · {pending.length}</h2>
          {pending.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <Mascot mood="thumbs-up" width={130} />
                <p className="mt-4 text-[1.0625rem] font-semibold">Nothing to decide</p>
                <p className="mt-1 max-w-sm text-[0.9375rem] text-muted">When an agent prepares a sensitive action, it waits here for you.</p>
              </div>
            </Card>
          ) : (
            pending.map(({ a, clientName, commitmentTitle }) => (
              <ApprovalCard
                key={a.id}
                approval={{ id: a.id, title: a.title, amount: a.amountMinor != null ? formatMoney(a.amountMinor, a.currency ?? cur) : null, reason: a.reasoningSummary, client: clientName, commitment: commitmentTitle }}
              />
            ))
          )}
        </section>
        <Card className="min-w-0 self-start">
          <CardHeader title="Decision history" description="Audit trail of approved and rejected actions" />
          {decided.length === 0 ? (
            <p className="px-5 pb-5 pt-2 text-[0.9375rem] text-muted">No decisions yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {decided.map(({ a, clientName }) => (
                <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] font-medium">{a.title}</p>
                    <p className="text-[0.75rem] text-muted">
                      {[clientName, a.amountMinor != null ? formatMoney(a.amountMinor, a.currency ?? cur) : null, a.decidedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" })].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
