import type { Metadata } from "next";
import { Plus, Search, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, DemoBadge, EmptyState, ListGroup, ListRow, PageHeader } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { listClients } from "@/server/services/clients";

export const metadata: Metadata = { title: "Clients" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = ["bg-[#7656e8]", "bg-[#30b0c7]", "bg-[#ff9f0a]", "bg-[#34c759]", "bg-[#ff6b6b]", "bg-[#5856d6]"];

export default async function ClientsPage({ searchParams }: PageProps<"/app/clients">) {
  const ctx = await requireAuth();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const db = await getDb();
  const rows = await listClients(db, ctx.business.id, q);
  const cur = ctx.business.currency;
  const totalOutstanding = rows.reduce((s, c) => s + c.outstandingMinor, 0);

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${rows.length} ${rows.length === 1 ? "client" : "clients"}${totalOutstanding > 0 ? ` · ${formatMoney(totalOutstanding, cur)} outstanding` : ""}`}
        actions={
          <ButtonLink href="/app/clients/new" size="sm">
            <Plus className="h-4 w-4" /> Add client
          </ButtonLink>
        }
      />
      <form className="relative mb-6" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search"
          aria-label="Search clients by name, company or email"
          className="h-10 w-full rounded-xl bg-fill pl-9 pr-3 text-[1.0625rem] placeholder:text-muted focus:outline-none focus:ring-[3px] focus:ring-ring sm:max-w-md"
        />
      </form>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={q ? "No results" : "No clients yet"}
            description={q ? `Nothing matches "${q}". Check the spelling or try an email address.` : "Add a client, or share your request link so clients can come to you."}
            action={!q && <ButtonLink href="/app/clients/new">Add client</ButtonLink>}
          />
        </Card>
      ) : (
        <ListGroup header={q ? `Results for "${q}"` : "All clients"}>
          {rows.map((c, i) => (
            <ListRow
              key={c.id}
              href={`/app/clients/${c.id}`}
              icon={<span className="text-[0.8125rem] font-semibold">{initials(c.name)}</span>}
              iconBg={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} !rounded-full !h-10 !w-10`}
              title={
                <span className="flex items-center gap-2">
                  <span className="truncate">{c.name}</span> {c.isDemo && <DemoBadge />}
                </span>
              }
              subtitle={[c.company, c.email].filter(Boolean).join(" · ") || "No contact details"}
              detail={
                <span className="flex flex-col items-end leading-tight">
                  <span className={`money font-semibold ${c.outstandingMinor > 0 ? "text-warning" : "text-foreground"}`}>
                    {formatMoney(c.outstandingMinor > 0 ? c.outstandingMinor : c.paidMinor, cur)}
                  </span>
                  <span className="text-xs">{c.outstandingMinor > 0 ? "outstanding" : c.activeCommitments > 0 ? `${c.activeCommitments} active` : "paid"}</span>
                </span>
              }
            />
          ))}
        </ListGroup>
      )}
    </>
  );
}
