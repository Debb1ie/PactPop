import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Handshake, Wallet } from "lucide-react";
import { z } from "zod";
import { Card, CardBody, CardHeader, DemoBadge, EmptyState, ListGroup, ListRow, PageHeader, Stat } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getClient } from "@/server/services/clients";
import { updateClientAction } from "../actions";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "Client" };

const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

export default async function ClientPage({ params }: PageProps<"/app/clients/[id]">) {
  const ctx = await requireAuth();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const db = await getDb();
  const data = await getClient(db, ctx.business.id, id);
  if (!data) notFound();
  const { client } = data;
  const cur = ctx.business.currency;

  return (
    <>
      <Link href="/app/clients" className="-ml-1 mb-2 inline-flex items-center text-[1.0625rem] text-accent hover:opacity-70">
        <ChevronLeft className="h-5 w-5" /> Clients
      </Link>
      <PageHeader
        title={client.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {[client.company, client.email, client.phone].filter(Boolean).join(" · ") || "No contact details yet"} {client.isDemo && <DemoBadge />}
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Paid" value={formatMoney(data.paidMinor, cur)} sub="Confirmed by PayPal" icon={<Wallet className="h-4 w-4" />} iconBg="bg-success" />
        <Stat label="Outstanding" value={formatMoney(data.outstandingMinor, cur)} sub={`${data.invoices.length} invoice(s)`} icon={<Wallet className="h-4 w-4" />} iconBg="bg-warning" />
        <div className="col-span-2 sm:col-span-1">
          <Stat label="Commitments" value={data.commitments.length} sub={`${data.requests.length} request(s) received`} icon={<Handshake className="h-4 w-4" />} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {data.commitments.length === 0 ? (
            <ListGroup header="Commitments">
              <li>
                <EmptyState title="No commitments yet" description="A commitment is created when this client accepts a proposal." />
              </li>
            </ListGroup>
          ) : (
            <ListGroup header="Commitments">
              {data.commitments.map((c) => (
                <ListRow
                  key={c.id}
                  title={c.title}
                  subtitle={`Started ${fmtDate(c.startDate ?? c.createdAt)}`}
                  detail={
                    <span className="flex flex-col items-end gap-1">
                      <span className="money font-semibold text-foreground">{formatMoney(c.agreedTotalMinor, c.currency)}</span>
                      <StatusBadge status={c.status} />
                    </span>
                  }
                />
              ))}
            </ListGroup>
          )}

          <ListGroup header="Payment history" footer="Only payments reported by PayPal are listed.">
            {data.payments.length === 0 ? (
              <ListRow title={<span className="text-muted">No payments yet</span>} />
            ) : (
              data.payments.map(({ payment: p, commitmentTitle }) => (
                <ListRow
                  key={p.id}
                  title={commitmentTitle}
                  subtitle={
                    <span className="font-mono text-xs">
                      {p.paypalCaptureId ?? p.paypalOrderId ?? p.paypalInvoicePaymentId ?? "—"}
                      {p.isSandbox ? " · sandbox" : ""}
                    </span>
                  }
                  detail={
                    <span className="flex flex-col items-end gap-1">
                      <span className="money font-semibold text-foreground">{formatMoney(p.amountMinor, p.currency)}</span>
                      <StatusBadge status={p.status === "completed" ? "paid" : p.status} />
                    </span>
                  }
                />
              ))
            )}
          </ListGroup>
        </div>

        <Card className="self-start">
          <CardHeader title="Profile & notes" description="Notes are only visible to your team." />
          <CardBody>
            <ClientForm action={updateClientAction.bind(null, client.id)} defaults={client} submitLabel="Save changes" />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
