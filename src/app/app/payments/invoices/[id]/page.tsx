import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DocToolbar } from "@/components/docs/doc-toolbar";
import { InvoiceDocument } from "@/components/docs/invoice-document";
import { PaperTrail, type TrailItem } from "@/components/docs/paper-trail";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { invoiceDossier } from "@/server/services/invoice-docs";

export const metadata: Metadata = { title: "Invoice" };

type PayPalSnap = { status?: string; invoiceNumber?: string | null; transactions?: { payment_id?: string; transaction_id?: string; payment_date?: string; amount?: { value: string; currency_code: string } }[] };

/** Every PayPal invoice is documented: the invoice itself plus PayPal's own records and the full paper trail. */
export default async function InvoiceDocPage({ params }: PageProps<"/app/payments/invoices/[id]">) {
  const ctx = await requireAuth();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const d = await invoiceDossier(await getDb(), ctx.business.id, id);
  if (!d) notFound();

  const items: TrailItem[] = [];
  for (const a of d.audits) {
    const after = (a.after ?? {}) as { paypal?: PayPalSnap; via?: string };
    if (a.action === "paypal.send_invoice") items.push({ at: a.createdAt.toISOString(), kind: "sent", title: "Invoice created and sent through PayPal (Invoicing v2)", detail: after.paypal ? `PayPal status: ${after.paypal.status}` : undefined });
    if (a.action === "payment.confirmed") {
      const t = after.paypal?.transactions?.[0];
      items.push({
        at: a.createdAt.toISOString(),
        kind: "paid",
        title: `Payment confirmed by PayPal (${after.via === "webhook" ? "verified webhook" : "server-side check"})`,
        detail: t ? `Transaction ${t.payment_id ?? t.transaction_id}${t.amount ? ` · ${t.amount.currency_code} ${t.amount.value}` : ""}${t.payment_date ? ` · paid ${t.payment_date}` : ""}` : `PayPal status: ${after.paypal?.status ?? "PAID"}`,
      });
    }
  }
  for (const e of d.events) items.push({ at: e.createdAt.toISOString(), kind: "webhook", title: `PayPal webhook received: ${e.eventType}`, detail: `Event ${e.paypalEventId} · signature ${e.signatureVerified ? "verified with PayPal" : "NOT verified"}` });
  items.sort((a, b) => a.at.localeCompare(b.at));

  const paid = d.payments.find((p) => p.status === "completed");
  const record = [
    { label: "PayPal invoice ID", value: d.invoice.paypalInvoiceId ?? "—" },
    { label: "Invoice number", value: d.invoice.invoiceNumber ?? "—" },
    { label: "Status (PayPal)", value: d.invoice.status.toUpperCase() },
    { label: "Amount", value: formatMoney(d.invoice.amountMinor, d.invoice.currency) },
    { label: "Last checked with PayPal", value: d.invoice.lastSyncedAt?.toLocaleString("en-US") ?? "—" },
    ...(paid ? [{ label: "Payment reference", value: paid.paypalInvoicePaymentId ?? paid.paypalCaptureId ?? "—" }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <DocToolbar back="/app/payments" backLabel="Payments" fileName={`invoice-${d.doc.number}`} />
      <div id="print-area">
        <InvoiceDocument doc={d.doc} />
        <PaperTrail items={items} record={record} />
      </div>
      {d.invoice.payerViewUrl && (
        <p className="no-print mt-4 text-center text-[0.8125rem] text-muted">
          PayPal&apos;s copy:{" "}
          <a href={d.invoice.payerViewUrl} target="_blank" rel="noreferrer" className="font-medium text-accent hover:opacity-80">
            open the invoice on PayPal
          </a>
        </p>
      )}
    </div>
  );
}
