import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { LogoMark } from "@/components/brand/logo";
import { DocToolbar } from "@/components/docs/doc-toolbar";
import { PaperTrail, type TrailItem } from "@/components/docs/paper-trail";
import { formatMoney } from "@/lib/money";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { paymentReceipt } from "@/server/services/invoice-docs";

export const metadata: Metadata = { title: "Receipt" };

const when = (d: Date | null | undefined) => (d ? d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

/** Receipt for one PayPal payment (invoice payment or client checkout), with PayPal's references. */
export default async function ReceiptPage({ params }: PageProps<"/app/payments/receipts/[id]">) {
  const ctx = await requireAuth();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const r = await paymentReceipt(await getDb(), ctx.business.id, id);
  if (!r) notFound();
  const { p } = r;
  const done = p.status === "completed";
  const ref = p.paypalCaptureId ?? p.paypalInvoicePaymentId ?? p.paypalOrderId ?? "—";

  const items: TrailItem[] = [
    ...(p.source === "order" ? [{ at: p.createdAt.toISOString(), kind: "sent" as const, title: "Client started PayPal checkout (Orders v2)", detail: `Order ${p.paypalOrderId}` }] : []),
    ...r.events.map((e) => ({ at: e.createdAt.toISOString(), kind: "webhook" as const, title: `PayPal webhook received: ${e.eventType}`, detail: `Event ${e.paypalEventId} · signature ${e.signatureVerified ? "verified with PayPal" : "NOT verified"}` })),
    ...r.audits.map((a) => {
      const pp = ((a.after ?? {}) as { paypal?: { status?: string; fee?: { value: string; currency_code: string } | null; payerEmail?: string | null } }).paypal;
      return { at: a.createdAt.toISOString(), kind: "paid" as const, title: "Payment captured and confirmed by PayPal", detail: pp ? `Capture status ${pp.status}${pp.fee ? ` · PayPal fee ${pp.fee.currency_code} ${pp.fee.value}` : ""}` : undefined };
    }),
    ...(done && p.completedAt && r.audits.length === 0 ? [{ at: p.completedAt.toISOString(), kind: "paid" as const, title: `Payment confirmed by PayPal (${p.verifiedVia === "webhook" ? "verified webhook" : "server-side check"})` }] : []),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="mx-auto max-w-2xl">
      <DocToolbar back="/app/payments" backLabel="Payments" fileName={`receipt-${ref}`} />
      <div id="print-area">
        <article className="relative overflow-hidden rounded-2xl bg-white p-6 text-[#0d0d10] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)] ring-1 ring-black/5 sm:p-10">
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark className="h-11 w-11" title="" />
              <div>
                <p className="text-[1.125rem] font-bold">{r.biz?.name}</p>
                <p className="text-[0.8125rem] text-[#62626e]">Payment receipt</p>
              </div>
            </div>
            <span className={`rotate-[-4deg] rounded-md border-2 px-2.5 py-0.5 text-[0.8125rem] font-black tracking-[0.18em] ${done ? "border-[#1f8a4c] text-[#1f8a4c]" : "border-[#b8740c] text-[#b8740c]"}`}>{done ? "PAID" : p.status.toUpperCase()}</span>
          </header>

          <div className="mt-8 text-center">
            <p className="text-[0.8125rem] text-[#62626e]">Amount received</p>
            <p className="money mt-1 text-[2.75rem] font-bold leading-none">{formatMoney(p.amountMinor, p.currency)}</p>
            <p className="mt-2 text-[0.875rem] text-[#62626e]">{when(p.completedAt ?? p.createdAt)}</p>
          </div>

          <dl className="mt-8 divide-y divide-[#ececf0] text-[0.875rem]">
            {[
              ["From", r.client ? `${r.client.name}${r.client.company ? ` · ${r.client.company}` : ""}` : p.payerEmail ?? "—"],
              ["Payer PayPal email", p.payerEmail ?? "—"],
              ["For", r.milestone ? `${r.milestone.title}${r.commitment ? ` · ${r.commitment.title}` : ""}` : r.commitment?.title ?? "—"],
              ["Paid with", p.source === "order" ? "PayPal checkout (Orders v2)" : "PayPal invoice (Invoicing v2)"],
              ["PayPal reference", ref],
              ...(r.invoice ? [["Invoice", r.invoice.invoiceNumber ?? r.invoice.paypalInvoiceId ?? "—"]] : []),
              ...(p.feeMinor != null ? [["PayPal fee", formatMoney(p.feeMinor, p.currency)]] : []),
              ...(p.netMinor != null ? [["Net received", formatMoney(p.netMinor, p.currency)]] : []),
              ["Confirmed via", p.verifiedVia === "webhook" ? "Verified PayPal webhook" : p.verifiedVia === "api" ? "Server-side check with PayPal" : "Not confirmed yet"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-2.5">
                <dt className="text-[#62626e]">{k}</dt>
                <dd className="break-all text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[0.75rem] text-[#62626e]">PayPal Sandbox: test money only. Made with PactPop.</p>
        </article>
        <PaperTrail items={items} />
      </div>
    </div>
  );
}
