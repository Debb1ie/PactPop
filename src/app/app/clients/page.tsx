import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, DemoBadge, EmptyState, Input, PageHeader } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { listClients } from "@/server/services/clients";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: PageProps<"/app/clients">) {
  const ctx = await requireAuth();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const db = await getDb();
  const rows = await listClients(db, ctx.business.id, q);
  const cur = ctx.business.currency;

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone you've made promises to, with what they've paid and what's still outstanding."
        actions={<ButtonLink href="/app/clients/new">Add client</ButtonLink>}
      />
      <form className="relative mb-4 max-w-sm" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input name="q" defaultValue={q} placeholder="Search name, company or email" className="pl-9" aria-label="Search clients" />
      </form>
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={q ? "No clients match your search" : "No clients yet"}
            description={q ? "Try a different name or email." : "Add a client, or share your request link so clients can come to you."}
            action={!q && <ButtonLink href="/app/clients/new">Add client</ButtonLink>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Active</th>
                  <th className="px-5 py-3 text-right font-medium">Paid</th>
                  <th className="px-5 py-3 text-right font-medium">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-2/50">
                    <td className="px-5 py-3.5">
                      <Link href={`/app/clients/${c.id}`} className="font-medium hover:text-accent">
                        {c.name}
                      </Link>{" "}
                      {c.isDemo && <DemoBadge />}
                      <p className="text-xs text-muted">{[c.company, c.email].filter(Boolean).join(" · ") || "No contact details"}</p>
                    </td>
                    <td className="money px-5 py-3.5">{c.activeCommitments}</td>
                    <td className="money px-5 py-3.5 text-right">{formatMoney(c.paidMinor, cur)}</td>
                    <td className={`money px-5 py-3.5 text-right ${c.outstandingMinor > 0 ? "text-warning" : ""}`}>{formatMoney(c.outstandingMinor, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
