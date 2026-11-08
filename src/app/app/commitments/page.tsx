import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { OrbField, type Orb, type OrbTone } from "@/components/fx/orb-field";
import { StatusBadge, statusLabel } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { clients, commitments, milestones, timelineEvents } from "@/server/db/schema";
import { vowgraphSummary } from "@/server/services/vowgraph";

export const metadata: Metadata = { title: "Commitments" };

const toneFor = (status: string): OrbTone =>
  status === "completed" ? "mint" : ["in_progress", "accepted", "awaiting_evidence", "awaiting_approval", "payment_ready"].includes(status) ? "violet" : status === "awaiting_acceptance" || status === "proposed" ? "amber" : status === "disputed" ? "rose" : "slate";

const date = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase() : "—");

export default async function CommitmentsPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const bid = ctx.business.id;
  const [rows, vow, events] = await Promise.all([
    db
      .select({ c: commitments, clientName: clients.name, company: clients.company, clientId: clients.id })
      .from(commitments)
      .innerJoin(clients, eq(clients.id, commitments.clientId))
      .where(eq(commitments.businessId, bid))
      .orderBy(desc(commitments.updatedAt)),
    vowgraphSummary(db, bid),
    db
      .select({ e: timelineEvents, title: commitments.title, clientName: clients.name, company: clients.company })
      .from(timelineEvents)
      .innerJoin(commitments, eq(commitments.id, timelineEvents.commitmentId))
      .innerJoin(clients, eq(clients.id, commitments.clientId))
      .where(eq(timelineEvents.businessId, bid))
      .orderBy(desc(timelineEvents.createdAt))
      .limit(14),
  ]);
  const ms = rows.length
    ? await db
        .select()
        .from(milestones)
        .where(and(eq(milestones.businessId, bid), inArray(milestones.commitmentId, rows.map((r) => r.c.id))))
    : [];

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
      details: [c.title, c.milestones.length ? `${paid} of ${c.milestones.length} milestones paid` : "No milestones yet", ...c.pendingChangeOrders.map((o) => `Change order pending: ${o.title} · ${formatMoney(o.amountMinor, c.currency)}`)],
      href: `/app/clients/${c.clientId}`,
    };
  });

  return (
    <>
      <div className="mb-5">
        <p className="label-mono">{rows.length} agreements</p>
        <h1 className="mt-1 text-[1.75rem] font-bold leading-tight">Commitments</h1>
      </div>

      <section className="panel overflow-hidden" aria-label="All commitments">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[0.8125rem]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="label-mono px-4 py-2.5 font-normal">Client · agreement</th>
                <th className="label-mono px-2 py-2.5 font-normal">Status</th>
                <th className="label-mono px-2 py-2.5 font-normal">Ver.</th>
                <th className="label-mono px-2 py-2.5 font-normal">Milestones</th>
                <th className="label-mono px-2 py-2.5 font-normal">Due</th>
                <th className="label-mono px-4 py-2.5 text-right font-normal">Agreed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ c, company, clientName, clientId }) => {
                const own = ms.filter((m) => m.commitmentId === c.id);
                const paid = own.filter((m) => m.status === "paid").length;
                return (
                  <tr key={c.id} className="transition-colors hover:bg-fill">
                    <td className="px-4 py-3">
                      <Link href={`/app/clients/${clientId}`} className="font-medium hover:text-accent">
                        {company ?? clientName}
                      </Link>
                      <span className="text-muted"> · {c.title}</span>
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-2 py-3 font-mono text-[0.75rem] text-muted">v{c.currentVersion}</td>
                    <td className="px-2 py-3">
                      {own.length ? (
                        <span className="flex items-center gap-1" aria-label={`${paid} of ${own.length} milestones paid`}>
                          {own
                            .sort((a, b) => a.position - b.position)
                            .map((m) => (
                              <span key={m.id} title={`${m.title} · ${formatMoney(m.amountMinor, m.currency)} · ${m.status}`} className={`h-2.5 w-5 rounded-sm ${m.status === "paid" ? "bg-money-in" : m.kind === "change_order" ? "bg-warning" : "bg-border-strong"}`} />
                            ))}
                          <span className="ml-1.5 font-mono text-[0.7rem] text-muted">
                            {paid}/{own.length}
                          </span>
                        </span>
                      ) : (
                        <span className="font-mono text-[0.7rem] text-faint">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3 font-mono text-[0.75rem] text-muted">{date(c.dueDate)}</td>
                    <td className="money px-4 py-3 text-right">{formatMoney(c.agreedTotalMinor, c.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="panel min-w-0 overflow-hidden" aria-label="VowGraph">
          <div className="panel-head">
            <h2 className="panel-title">VowGraph</h2>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.06em] text-faint">orb = agreement · ring = milestone (lit when paid) · moon = pending change order</span>
          </div>
          <OrbField orbs={orbs} height={480} ariaLabel="3D view of commitments, milestones and pending change orders" />
        </section>

        <section className="panel min-w-0" aria-label="Activity">
          <div className="panel-head">
            <h2 className="panel-title">Activity</h2>
          </div>
          {events.length === 0 ? (
            <p className="px-4 py-6 text-[0.875rem] text-muted">No activity yet.</p>
          ) : (
            <ol className="divide-y divide-border">
              {events.map(({ e, company, clientName }) => (
                <li key={e.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] gap-3 px-4 py-2.5 text-[0.8125rem]">
                  <span className="font-mono text-[0.7rem] text-muted">{date(e.createdAt)}</span>
                  <span className="min-w-0">
                    <span className="block truncate">{e.title}</span>
                    <span className="block truncate font-mono text-[0.65rem] uppercase text-faint">
                      {company ?? clientName} · {e.actorLabel ?? e.actorType}
                    </span>
                  </span>
                  <span className="money text-right text-[0.8125rem]">{e.amountMinor != null ? formatMoney(e.amountMinor) : ""}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
