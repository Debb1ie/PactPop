import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Card, CardBody, CardHeader, DemoBadge, EmptyState, PageHeader, Stat } from "@/components/ui/primitives";
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
      <PageHeader
        title={client.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {[client.company, client.email, client.phone].filter(Boolean).join(" · ") || "No contact details yet"} {client.isDemo && <DemoBadge />}
          </span>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Paid to date" value={formatMoney(data.paidMinor, cur)} sub="Confirmed by PayPal" />
        <Stat label="Outstanding" value={formatMoney(data.outstandingMinor, cur)} sub={`${data.invoices.length} invoice(s) in total`} />
        <Stat label="Commitments" value={data.commitments.length} sub={`${data.requests.length} request(s) received`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Commitments" description="Agreements with this client" />
            {data.commitments.length === 0 ? (
              <EmptyState title="No commitments yet" description="A commitment is created when this client accepts a proposal." />
            ) : (
              <ul className="divide-y divide-border">
                {data.commitments.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted">Started {fmtDate(c.startDate ?? c.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="money text-sm">{formatMoney(c.agreedTotalMinor, c.currency)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Payment history" description="Only payments reported by PayPal" />
            {data.payments.length === 0 ? (
              <EmptyState title="No payments yet" />
            ) : (
              <ul className="divide-y divide-border">
                {data.payments.map(({ payment: p, commitmentTitle }) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{commitmentTitle}</p>
                      <p className="money truncate text-xs text-muted">
                        {p.paypalCaptureId ?? p.paypalOrderId ?? p.paypalInvoicePaymentId ?? "—"}
                        {p.isSandbox ? " · sandbox" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="money text-sm">{formatMoney(p.amountMinor, p.currency)}</span>
                      <StatusBadge status={p.status === "completed" ? "paid" : p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card>
          <CardHeader title="Profile & notes" />
          <CardBody>
            <ClientForm action={updateClientAction.bind(null, client.id)} defaults={client} submitLabel="Save changes" />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
