import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { clients, commitments, milestones, timelineEvents } from "@/server/db/schema";

export const metadata: Metadata = { title: "Commitments" };

const STAGES = ["Request", "Agreement", "Delivery", "Approval", "Paid"];
/** Map a commitment status onto the five-step journey. */
function stageOf(status: string) {
  if (status === "completed") return 4;
  if (status === "awaiting_approval" || status === "payment_ready") return 3;
  if (["accepted", "in_progress", "awaiting_evidence"].includes(status)) return 2;
  if (status === "proposed" || status === "awaiting_acceptance") return 1;
  return 0;
}

/** Per-client accent: avatar colour plus the matching journey gradient. */
const TONES = [
  { dot: "bg-[#7656e8]", bar: "from-[#b9a5ff] to-[#7656e8]" },
  { dot: "bg-[#30b0c7]", bar: "from-[#8fe3f0] to-[#2a8fd6]" },
  { dot: "bg-[#ff9f0a]", bar: "from-[#ffd28a] to-[#ff7a1a]" },
  { dot: "bg-[#34c759]", bar: "from-[#a8f0b8] to-[#24a148]" },
  { dot: "bg-[#ff6b8b]", bar: "from-[#ffc0d0] to-[#e84a7a]" },
];
const initials = (n: string) =>
  n
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

function Avatar({ name, tone }: { name: string; tone: (typeof TONES)[number] }) {
  return <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold text-white", tone.dot)}>{initials(name)}</span>;
}

const date = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase() : "—");

export default async function CommitmentsPage() {
  const ctx = await requireAuth();
  const db = await getDb();
  const bid = ctx.business.id;
  const [rows, events] = await Promise.all([
    db
      .select({ c: commitments, clientName: clients.name, company: clients.company, clientId: clients.id })
      .from(commitments)
      .innerJoin(clients, eq(clients.id, commitments.clientId))
      .where(eq(commitments.businessId, bid))
      .orderBy(desc(commitments.updatedAt)),
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

  const toneOf = new Map<string, (typeof TONES)[number]>();
  rows.forEach((r) => !toneOf.has(r.clientId) && toneOf.set(r.clientId, TONES[toneOf.size % TONES.length]));
  const at = rows.map((r) => stageOf(r.c.status));
  const cur = ctx.business.currency;
  const agreed = rows.filter((_, i) => at[i] >= 2).reduce((s, r) => s + r.c.agreedTotalMinor, 0);
  const stats = [
    { art: "card-art-orchid", label: "Under agreement", value: formatMoney(agreed, cur), note: "accepted by clients" },
    { art: "card-art-ice", label: "In delivery", value: String(at.filter((s) => s === 2 || s === 3).length), note: "being worked on" },
    { art: "card-art-ember", label: "Awaiting client", value: String(at.filter((s) => s === 1).length), note: "proposals out" },
    { art: "card-art-midnight", label: "Drafts", value: String(at.filter((s) => s === 0).length), note: "not sent yet" },
  ];

  return (
    <>
      <div className="mb-5">
        <p className="label-mono">{rows.length} agreements</p>
        <h1 className="mt-1 text-[1.75rem] font-bold leading-tight">Commitments</h1>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cn("relative overflow-hidden rounded-[1.25rem] p-4 text-white shadow-[0_18px_40px_-22px_rgb(0_0_0/0.7)] sm:p-5", s.art)}>
            <p className="text-[0.75rem] font-medium text-white/75">{s.label}</p>
            <p className="money mt-6 text-[1.5rem] font-bold leading-none sm:text-[1.75rem]">{s.value}</p>
            <p className="mt-1.5 text-[0.75rem] text-white/70">{s.note}</p>
          </div>
        ))}
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
                      <span className="flex items-center gap-3">
                        <Avatar name={company ?? clientName} tone={toneOf.get(clientId)!} />
                        <span className="min-w-0">
                          <Link href={`/app/clients/${clientId}`} className="block font-semibold hover:text-accent">
                            {company ?? clientName}
                          </Link>
                          <span className="block text-[0.75rem] text-muted">{c.title}</span>
                        </span>
                      </span>
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
        <section className="panel min-w-0" aria-label="Agreement journey">
          <div className="panel-head">
            <h2 className="panel-title">Agreement journey</h2>
            <span className="ml-auto text-[0.75rem] text-muted">Where each agreement stands</span>
          </div>
          <ul className="space-y-5 px-5 pb-6 pt-3">
            {rows.map(({ c, company, clientName, clientId }) => {
              const at = stageOf(c.status);
              const tone = toneOf.get(clientId)!;
              return (
                <li key={c.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={company ?? clientName} tone={tone} />
                      <p className="truncate text-[0.9375rem] font-semibold">
                        {company ?? clientName} <span className="font-normal text-muted">· {c.title}</span>
                      </p>
                    </span>
                    <span className="shrink-0 rounded-full bg-fill px-2.5 py-1 text-[0.75rem] font-medium">{STAGES[Math.max(0, at)]}</span>
                  </div>
                  <ol className="mt-3 grid grid-cols-5 gap-1.5" aria-label={`${company ?? clientName}: ${STAGES[Math.max(0, at)]}`}>
                    {STAGES.map((st, i) => (
                      <li key={st} className="min-w-0">
                        <span className={cn("block h-2 rounded-full", i <= at ? cn("bg-gradient-to-r", tone.bar, i === at && "opacity-80") : "bg-surface-2")} />
                        <span className={cn("mt-1.5 block truncate text-[0.6875rem]", i <= at ? "text-foreground" : "text-faint")}>{st}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              );
            })}
          </ul>
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
