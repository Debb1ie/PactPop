import type { Metadata } from "next";
import { ApprovalCard } from "@/components/agents/approval-card";
import { Card, CardHeader } from "@/components/ui/primitives";
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
  const held = pending.reduce((s, p) => s + (p.a.amountMinor ?? 0), 0);

  return (
    <>
      <section className="card-art-orchid relative mb-6 overflow-hidden rounded-[1.75rem] p-6 text-white shadow-[0_30px_60px_-30px_rgb(120_40_200/0.6)] sm:p-8" aria-label="Approval summary">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <Mascot mood={pending.length === 0 ? "thumbs-up" : pending.length > 2 ? "shocked" : "card-wave"} width={132} priority className="mx-auto shrink-0 sm:mx-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-white/70">TrustGate · Approval Center</p>
            <h1 className="mt-1 text-[1.75rem] font-bold leading-tight sm:text-[2.125rem]">
              {pending.length === 0 ? "All clear. Poppy's on watch." : `${pending.length} decision${pending.length === 1 ? "" : "s"} waiting for you`}
            </h1>
            <p className="mt-1.5 max-w-xl text-[0.9375rem] text-white/80">Agents prepare. You decide. Nothing that moves money or changes an agreement runs until you approve it.</p>
          </div>
        </div>
        <dl className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { k: "Waiting", v: String(pending.length) },
            { k: "Money on hold", v: formatMoney(held, cur) },
            { k: "Approved", v: String(decided.filter((d) => d.a.status === "executed").length) },
            { k: "Rejected", v: String(decided.filter((d) => d.a.status === "rejected").length) },
          ].map((x) => (
            <div key={x.k} className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <dt className="text-[0.75rem] text-white/75">{x.k}</dt>
              <dd className="money mt-0.5 text-[1.375rem] font-bold">{x.v}</dd>
            </div>
          ))}
        </dl>
      </section>
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
                approval={{ id: a.id, actionType: a.actionType, title: a.title, amount: a.amountMinor != null ? formatMoney(a.amountMinor, a.currency ?? cur) : null, reason: a.reasoningSummary, client: clientName, commitment: commitmentTitle }}
              />
            ))
          )}
        </section>
        <Card className="min-w-0 self-start">
          <CardHeader title="Decision history" description="Audit trail of approved and rejected actions" />
          {decided.length === 0 ? (
            <div className="flex items-center gap-3 px-5 pb-5 pt-2">
              <Mascot mood="sleeping" width={70} decorative />
              <p className="text-[0.9375rem] text-muted">No decisions yet. Approved and rejected actions appear here.</p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {decided.map(({ a, clientName }) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Mascot mood={a.status === "executed" ? "laughing" : a.status === "rejected" ? "crying" : "confused"} width={38} decorative className="shrink-0" />
                  <div className="min-w-0 flex-1">
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
