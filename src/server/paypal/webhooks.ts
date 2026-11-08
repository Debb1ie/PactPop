import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { invoices, paymentEvents } from "@/server/db/schema";
import { env } from "@/server/env";
import { paypal } from "./client";
import { syncInvoice } from "./invoices";
import { applyCaptureWebhook } from "./orders";

export type WebhookEvent = { id: string; event_type: string; resource_type?: string; resource?: Record<string, unknown> };

/**
 * Ask PayPal whether this delivery is genuine (verify-webhook-signature). Only verified events
 * are stored or acted on, so a forged request can't occupy a real event id.
 */
export async function verifyWebhook(headers: Headers, event: WebhookEvent): Promise<boolean> {
  const webhookId = env().PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const h = (k: string) => headers.get(k) ?? "";
  if (!h("paypal-transmission-id") || !h("paypal-transmission-sig")) return false;
  const r = await paypal<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      auth_algo: h("paypal-auth-algo"),
      cert_url: h("paypal-cert-url"),
      transmission_id: h("paypal-transmission-id"),
      transmission_sig: h("paypal-transmission-sig"),
      transmission_time: h("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    },
  });
  return r.verification_status === "SUCCESS";
}

/** The PayPal invoice id an invoicing event refers to. */
function invoiceIdOf(event: WebhookEvent): string | null {
  const r = event.resource ?? {};
  const nested = (r.invoice as { id?: string } | undefined)?.id;
  return nested ?? (typeof r.id === "string" ? r.id : null);
}

/**
 * Store a verified event once (unique PayPal event id) and apply it. For invoices we re-read the
 * invoice from PayPal before recording money, so the webhook is a trigger, not the source of truth.
 */
export async function handleVerifiedEvent(db: Database, event: WebhookEvent): Promise<{ duplicate: boolean; applied: string }> {
  const resourceId = event.event_type.startsWith("INVOICING.") ? invoiceIdOf(event) : typeof event.resource?.id === "string" ? (event.resource.id as string) : null;
  let local: { id: string; businessId: string } | undefined;
  if (event.event_type.startsWith("INVOICING.") && resourceId) {
    [local] = await db.select({ id: invoices.id, businessId: invoices.businessId }).from(invoices).where(eq(invoices.paypalInvoiceId, resourceId)).limit(1);
  }

  const inserted = await db
    .insert(paymentEvents)
    .values({
      businessId: local?.businessId ?? null,
      paypalEventId: event.id,
      eventType: event.event_type,
      resourceType: event.resource_type ?? null,
      resourceId,
      payload: event as unknown as object,
      signatureVerified: true,
    })
    .onConflictDoNothing({ target: paymentEvents.paypalEventId })
    .returning({ id: paymentEvents.id });
  if (inserted.length === 0) return { duplicate: true, applied: "already received" };

  let applied = "stored";
  let processingError: string | null = null;
  try {
    if (local && ["INVOICING.INVOICE.PAID", "INVOICING.INVOICE.CANCELLED", "INVOICING.INVOICE.REFUNDED", "INVOICING.INVOICE.UPDATED"].includes(event.event_type)) {
      const r = await syncInvoice(db, { businessId: local.businessId, invoiceId: local.id, via: "webhook" });
      applied = r.ok ? r.message : "invoice not found";
    } else if (event.event_type.startsWith("INVOICING.")) {
      applied = "invoice is not managed by PactPop";
    } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" && event.resource) {
      applied = await applyCaptureWebhook(db, event.resource);
    }
  } catch (e) {
    processingError = e instanceof Error ? e.message : "processing failed";
  }
  await db.update(paymentEvents).set({ processedAt: new Date(), processingError }).where(eq(paymentEvents.id, inserted[0].id));
  if (processingError) throw new Error(processingError);
  return { duplicate: false, applied };
}
