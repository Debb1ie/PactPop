import "server-only";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { businesses, clients, commitments, invoices, milestones, payments } from "@/server/db/schema";
import { fromPayPalValue, toPayPalValue } from "@/lib/money";
import { recordAudit, recordTimeline } from "@/server/services/audit";
import { paypal } from "./client";

type PayPalInvoice = {
  id: string;
  status: string;
  detail: { invoice_number?: string; metadata?: { recipient_view_url?: string } };
  payments?: { paid_amount?: { currency_code: string; value: string }; transactions?: { payment_id?: string; transaction_id?: string; payment_date?: string; amount?: { currency_code: string; value: string } }[] };
};

const STATUS: Record<string, (typeof invoices.$inferSelect)["status"]> = {
  DRAFT: "draft",
  SENT: "sent",
  SCHEDULED: "scheduled",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
  MARKED_AS_PAID: "marked_as_paid",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "refunded",
  PAYMENT_PENDING: "payment_pending",
};

const splitName = (full: string) => {
  const [given, ...rest] = full.trim().split(/\s+/);
  return { given_name: given || full, surname: rest.join(" ") || undefined };
};

/**
 * Create and send a PayPal Sandbox invoice for one milestone. The amount comes from the
 * milestone row (backend pricing), never from AI text. Idempotent: one invoice per milestone
 * locally (unique index) and on PayPal (PayPal-Request-Id keyed by milestone).
 */
export async function sendMilestoneInvoice(db: Database, input: { businessId: string; milestoneId: string; userId: string; userName: string }) {
  const [row] = await db
    .select({ m: milestones, c: commitments, client: clients, biz: businesses })
    .from(milestones)
    .innerJoin(commitments, eq(commitments.id, milestones.commitmentId))
    .innerJoin(clients, eq(clients.id, commitments.clientId))
    .innerJoin(businesses, eq(businesses.id, milestones.businessId))
    .where(and(eq(milestones.id, input.milestoneId), eq(milestones.businessId, input.businessId)));
  if (!row) return { ok: false as const, message: "Milestone not found" };
  const { m, c, client, biz } = row;

  const [existing] = await db.select().from(invoices).where(eq(invoices.milestoneId, m.id));
  if (existing) return { ok: true as const, message: "Invoice already sent", invoice: existing };
  if (m.status === "paid" || m.status === "cancelled") return { ok: false as const, message: `This milestone is ${m.status}` };
  if (!["accepted", "in_progress", "awaiting_evidence", "awaiting_approval", "payment_ready"].includes(c.status))
    return { ok: false as const, message: "The client has to accept the agreement before invoicing" };
  if (m.amountMinor <= 0) return { ok: false as const, message: "Milestone amount must be positive" };

  const invoiceNumber = `PP-${m.id.slice(0, 8).toUpperCase()}`;
  const due = m.dueDate && m.dueDate.getTime() > Date.now() ? m.dueDate : new Date(Date.now() + 7 * 86_400_000);
  const created = await paypal<PayPalInvoice>("/v2/invoicing/invoices", {
    method: "POST",
    requestId: `pactpop-inv-${m.id}`,
    body: {
      detail: {
        currency_code: m.currency,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().slice(0, 10),
        payment_term: { due_date: due.toISOString().slice(0, 10) },
        note: `${c.title} · ${m.title}. Issued by ${biz.name} through PactPop (PayPal Sandbox).`,
        reference: c.id,
      },
      invoicer: { business_name: biz.name },
      primary_recipients: [{ billing_info: { name: splitName(client.name), ...(client.email ? { email_address: client.email } : {}) } }],
      items: [{ name: m.title.slice(0, 200), description: c.title.slice(0, 1000), quantity: "1", unit_amount: { currency_code: m.currency, value: toPayPalValue(m.amountMinor, m.currency) } }],
    },
  });

  await paypal(`/v2/invoicing/invoices/${created.id}/send`, {
    method: "POST",
    requestId: `pactpop-send-${m.id}`,
    body: { send_to_invoicer: false, send_to_recipient: Boolean(client.email) },
  });
  const sent = await paypal<PayPalInvoice>(`/v2/invoicing/invoices/${created.id}`);

  const [inv] = await db.transaction(async (tx) => {
    const ins = await tx
      .insert(invoices)
      .values({
        businessId: input.businessId,
        commitmentId: c.id,
        milestoneId: m.id,
        clientId: client.id,
        paypalInvoiceId: created.id,
        invoiceNumber: sent.detail.invoice_number ?? invoiceNumber,
        status: STATUS[sent.status] ?? "sent",
        amountMinor: m.amountMinor,
        currency: m.currency,
        payerViewUrl: sent.detail.metadata?.recipient_view_url ?? null,
        dueDate: due,
        sentAt: new Date(),
        lastSyncedAt: new Date(),
        isSandbox: true,
      })
      .returning();
    await tx.update(milestones).set({ status: "invoiced", updatedAt: new Date() }).where(eq(milestones.id, m.id));
    await recordTimeline(tx, {
      businessId: input.businessId,
      commitmentId: c.id,
      kind: "invoice.sent",
      title: `PayPal invoice sent: ${m.title}`,
      detail: `Invoice ${invoiceNumber} in the PayPal Sandbox`,
      refType: "invoice",
      refId: ins[0].id,
      actor: { type: "user", id: input.userId, label: input.userName },
      amountMinor: m.amountMinor,
    });
    await recordAudit(tx, {
      businessId: input.businessId,
      actor: { type: "user", id: input.userId, label: input.userName },
      action: "paypal.send_invoice",
      entityType: "invoice",
      entityId: ins[0].id,
      after: { paypalInvoiceId: created.id, amountMinor: m.amountMinor, currency: m.currency },
    });
    return ins;
  });
  return { ok: true as const, message: `Invoice ${inv.invoiceNumber} sent through PayPal`, invoice: inv };
}

/**
 * Pull an invoice's status from PayPal (server-side check). A payment is recorded only when
 * PayPal itself reports the invoice paid; amounts come from PayPal's response.
 */
export async function syncInvoice(db: Database, input: { businessId: string; invoiceId: string; via: "api" | "webhook" }) {
  const [inv] = await db.select().from(invoices).where(and(eq(invoices.id, input.invoiceId), eq(invoices.businessId, input.businessId)));
  if (!inv?.paypalInvoiceId) return { ok: false as const, message: "Invoice not found" };
  const remote = await paypal<PayPalInvoice>(`/v2/invoicing/invoices/${inv.paypalInvoiceId}`);
  const status = STATUS[remote.status] ?? "unknown";
  const paid = status === "paid" || status === "marked_as_paid";

  await db.transaction(async (tx) => {
    await tx.update(invoices).set({ status, lastSyncedAt: new Date(), updatedAt: new Date(), ...(paid && !inv.paidAt ? { paidAt: new Date() } : {}) }).where(eq(invoices.id, inv.id));
    if (!paid || inv.paidAt) return;

    const txn = remote.payments?.transactions?.[0];
    const paidMinor = remote.payments?.paid_amount ? fromPayPalValue(remote.payments.paid_amount.value, inv.currency) : inv.amountMinor;
    const paymentRef = txn?.payment_id ?? txn?.transaction_id ?? `invoice:${inv.paypalInvoiceId}`;
    const [already] = await tx.select({ id: payments.id }).from(payments).where(eq(payments.paypalInvoicePaymentId, paymentRef));
    if (already) return;

    await tx.insert(payments).values({
      businessId: inv.businessId,
      commitmentId: inv.commitmentId,
      milestoneId: inv.milestoneId,
      invoiceId: inv.id,
      source: "invoice",
      paypalInvoicePaymentId: paymentRef,
      status: "completed",
      amountMinor: paidMinor,
      currency: inv.currency,
      verifiedVia: input.via,
      completedAt: txn?.payment_date ? new Date(txn.payment_date) : new Date(),
      isSandbox: true,
    });
    await tx.update(milestones).set({ status: "paid", updatedAt: new Date() }).where(eq(milestones.id, inv.milestoneId));
    await recordTimeline(tx, {
      businessId: inv.businessId,
      commitmentId: inv.commitmentId,
      kind: "payment.received",
      title: `Payment confirmed by PayPal: invoice ${inv.invoiceNumber}`,
      detail: input.via === "webhook" ? "Verified webhook" : "Confirmed with the PayPal API",
      refType: "invoice",
      refId: inv.id,
      actor: { type: "paypal", label: "PayPal Sandbox" },
      amountMinor: paidMinor,
    });
    await recordAudit(tx, {
      businessId: inv.businessId,
      actor: { type: "paypal", label: "PayPal Sandbox" },
      action: "payment.confirmed",
      entityType: "invoice",
      entityId: inv.id,
      after: { paypalStatus: remote.status, paidMinor, via: input.via },
    });
  });
  return { ok: true as const, status, paid, message: paid ? "PayPal confirms this invoice is paid" : `PayPal status: ${remote.status.toLowerCase().replace(/_/g, " ")}` };
}
