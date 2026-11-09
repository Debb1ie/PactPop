import "server-only";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { auditLogs, businesses, clients, commitments, invoices, milestones, paymentEvents, payments, timelineEvents } from "@/server/db/schema";
import type { InvoiceDocData } from "@/lib/docs";

/** Invoice-style data for a milestone that hasn't been invoiced yet (sample / preview). */
export async function sampleInvoice(db: Database, businessId: string, milestoneId: string): Promise<InvoiceDocData | null> {
  const [r] = await db
    .select({ m: milestones, c: commitments, client: clients, biz: businesses })
    .from(milestones)
    .innerJoin(commitments, eq(commitments.id, milestones.commitmentId))
    .innerJoin(clients, eq(clients.id, commitments.clientId))
    .innerJoin(businesses, eq(businesses.id, milestones.businessId))
    .where(and(eq(milestones.id, milestoneId), eq(milestones.businessId, businessId)));
  if (!r) return null;
  const due = r.m.dueDate && r.m.dueDate.getTime() > Date.now() ? r.m.dueDate : new Date(Date.now() + 7 * 86_400_000);
  return {
    milestoneId: r.m.id,
    kind: "sample",
    number: `PP-${r.m.id.slice(0, 8).toUpperCase()}`,
    status: "sample",
    issuedAt: new Date().toISOString(),
    dueAt: due.toISOString(),
    business: { name: r.biz.name, email: r.biz.email },
    client: { name: r.client.name, company: r.client.company, email: r.client.email },
    agreement: r.c.title,
    items: [{ name: r.m.title, description: r.c.title, quantity: 1, unitMinor: r.m.amountMinor, totalMinor: r.m.amountMinor }],
    totalMinor: r.m.amountMinor,
    currency: r.m.currency,
    note: `${r.c.title} · ${r.m.title}. Issued by ${r.biz.name} through PactPop (PayPal Sandbox).`,
    paypal: { sandbox: true },
  };
}

/** Everything needed to document one PayPal invoice: the invoice, PayPal's records and the paper trail. */
export async function invoiceDossier(db: Database, businessId: string, invoiceId: string) {
  const [r] = await db
    .select({ i: invoices, m: milestones, c: commitments, client: clients, biz: businesses })
    .from(invoices)
    .innerJoin(milestones, eq(milestones.id, invoices.milestoneId))
    .innerJoin(commitments, eq(commitments.id, invoices.commitmentId))
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .innerJoin(businesses, eq(businesses.id, invoices.businessId))
    .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)));
  if (!r) return null;
  const [pays, events, audits, timeline] = await Promise.all([
    db.select().from(payments).where(and(eq(payments.businessId, businessId), eq(payments.invoiceId, r.i.id))),
    r.i.paypalInvoiceId ? db.select().from(paymentEvents).where(eq(paymentEvents.resourceId, r.i.paypalInvoiceId)).orderBy(asc(paymentEvents.createdAt)) : Promise.resolve([]),
    db.select().from(auditLogs).where(and(eq(auditLogs.businessId, businessId), eq(auditLogs.entityType, "invoice"), eq(auditLogs.entityId, r.i.id))).orderBy(asc(auditLogs.createdAt)),
    db.select().from(timelineEvents).where(and(eq(timelineEvents.businessId, businessId), eq(timelineEvents.refId, r.i.id))).orderBy(asc(timelineEvents.createdAt)),
  ]);
  const doc: InvoiceDocData = {
    kind: "invoice",
    number: r.i.invoiceNumber ?? r.i.paypalInvoiceId ?? "DRAFT",
    status: r.i.status,
    issuedAt: (r.i.sentAt ?? r.i.createdAt).toISOString(),
    dueAt: r.i.dueDate?.toISOString() ?? null,
    paidAt: r.i.paidAt?.toISOString() ?? null,
    business: { name: r.biz.name, email: r.biz.email },
    client: { name: r.client.name, company: r.client.company, email: r.client.email },
    agreement: r.c.title,
    items: [{ name: r.m.title, description: r.c.title, quantity: 1, unitMinor: r.i.amountMinor, totalMinor: r.i.amountMinor }],
    totalMinor: r.i.amountMinor,
    currency: r.i.currency,
    note: `${r.c.title} · ${r.m.title}. Issued by ${r.biz.name} through PactPop (PayPal Sandbox).`,
    paypal: { invoiceId: r.i.paypalInvoiceId, payerUrl: r.i.payerViewUrl, sandbox: r.i.isSandbox },
  };
  return { doc, invoice: r.i, payments: pays, events, audits, timeline };
}

/** One PayPal payment (invoice payment or checkout capture) as a receipt. */
export async function paymentReceipt(db: Database, businessId: string, paymentId: string) {
  const [p] = await db.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.businessId, businessId)));
  if (!p) return null;
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const [ctx] = p.commitmentId
    ? await db
        .select({ c: commitments, client: clients })
        .from(commitments)
        .innerJoin(clients, eq(clients.id, commitments.clientId))
        .where(eq(commitments.id, p.commitmentId))
    : [];
  const [m] = p.milestoneId ? await db.select().from(milestones).where(eq(milestones.id, p.milestoneId)) : [];
  const [inv] = p.invoiceId ? await db.select().from(invoices).where(eq(invoices.id, p.invoiceId)) : [];
  const ids = [p.paypalCaptureId, p.paypalOrderId, p.paypalInvoicePaymentId, inv?.paypalInvoiceId].filter((x): x is string => Boolean(x));
  const events = ids.length ? await db.select().from(paymentEvents).where(or(inArray(paymentEvents.resourceId, ids))).orderBy(asc(paymentEvents.createdAt)) : [];
  const audits = await db.select().from(auditLogs).where(and(eq(auditLogs.businessId, businessId), eq(auditLogs.entityType, "payment"), eq(auditLogs.entityId, p.id))).orderBy(asc(auditLogs.createdAt));
  return { p, biz, commitment: ctx?.c ?? null, client: ctx?.client ?? null, milestone: m ?? null, invoice: inv ?? null, events, audits };
}
